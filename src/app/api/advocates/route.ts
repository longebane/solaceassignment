import { NextResponse } from 'next/server';
import { z } from 'zod';
import { and, or, eq, ilike, sql } from 'drizzle-orm';

import db from '../../../db';
import { advocates } from '../../../db/schema';

const Query = z.object({
  q: z.string().trim().optional(),
  city: z.string().trim().optional(),
  degree: z.string().trim().optional(),
  specialty: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['created_at', 'last_name', 'years_of_experience']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = Query.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  const { q, city, degree, specialty, page, pageSize, sort, order } = parsed.data;

  // Incremental WHERE; undefined entries are ignored by and(...).
  const nameFilter = q
    ? or(ilike(advocates.firstName, `%${q}%`), ilike(advocates.lastName, `%${q}%`))
    : undefined;

  const cityFilter = city ? ilike(advocates.city, `%${city}%`) : undefined;
  const degreeFilter = degree ? eq(advocates.degree, degree) : undefined;

  const specialtyFilter = specialty
    ? sql<boolean>`EXISTS (
      SELECT 1
      FROM jsonb_array_elements_text(
        CASE
          WHEN jsonb_typeof(${advocates.specialties}) = 'array'
            THEN ${advocates.specialties}
          ELSE jsonb_build_array(${advocates.specialties})
        END
      ) AS s(val)
      WHERE val ILIKE ${'%' + specialty + '%'}
    )`
    : undefined;

  const where = and(nameFilter, cityFilter, degreeFilter, specialtyFilter);

  const sortMap = {
    created_at: advocates.createdAt,
    last_name: advocates.lastName,
    years_of_experience: advocates.yearsOfExperience,
  } as const;
  const sortCol = sortMap[sort];
  const orderBy = order === 'asc' ? sortCol : sql`${sortCol} DESC`;

  const offset = (page - 1) * pageSize;

  const projection = {
    id: advocates.id,
    firstName: advocates.firstName,
    lastName: advocates.lastName,
    city: advocates.city,
    degree: advocates.degree,
    specialties: advocates.specialties,
    yearsOfExperience: advocates.yearsOfExperience,
    phoneNumber: advocates.phoneNumber,
    createdAt: advocates.createdAt,
  };

  try {
    const [rows, [{ count }]] = await Promise.all([
      db
        .select(projection)
        .from(advocates)
        .where(where)
        .orderBy(orderBy)
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(advocates)
        .where(where),
    ]);

    return NextResponse.json(
      { data: rows, page, pageSize, total: Number(count) },
      { headers: { 'Cache-Control': 'max-age=15, s-maxage=30' } },
    );
  } catch (err) {
    console.error('GET /api/advocates failed:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
