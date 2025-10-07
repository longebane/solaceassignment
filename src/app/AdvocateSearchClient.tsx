'use client';

import { useEffect, useMemo, useState } from 'react';
import { useDebounce } from './utils';
import Pagination from '../components/Pagination';

type Advocate = {
  id: number;
  firstName: string;
  lastName: string;
  city: string;
  degree: string;
  specialties: string[];
  yearsOfExperience: number;
  phoneNumber: number;
  createdAt: string;
};
type ApiResp = { data: Advocate[]; page: number; pageSize: number; total: number };

export default function AdvocateSearchClient() {
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const dq = useDebounce(q, 500);
  const dCity = useDebounce(city, 500);
  const dSpec = useDebounce(specialty, 500);

  const [resp, setResp] = useState<ApiResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    const init = async () => {
      setLoading(true);
      setErr(null);
      try {
        const url = new URL('/api/advocates', window.location.origin);
        if (dq) url.searchParams.set('q', dq);
        if (dCity) url.searchParams.set('city', dCity);
        if (dSpec) url.searchParams.set('specialty', dSpec);
        url.searchParams.set('page', String(page));
        url.searchParams.set('pageSize', String(pageSize));
        url.searchParams.set('sort', 'created_at');
        url.searchParams.set('order', 'desc');

        const r = await fetch(url, { signal: ctrl.signal });

        if (!r.ok) {
          throw new Error(`HTTP ${r.status}`);
        }

        const json = (await r.json()) as ApiResp;
        setResp(json);
      } catch (e: any) {
        if (e.name !== 'AbortError') setErr(e.message ?? 'Request failed');
      } finally {
        setLoading(false);
      }
    };
    init();
    return () => ctrl.abort();
  }, [dq, dCity, dSpec, page]);

  // reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [dq, dCity, dSpec]);

  const list = resp?.data ?? [];

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <h1 className="mb-4 text-2xl font-semibold">Find an Advocate</h1>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Search name</span>
          <input
            className="rounded-md border px-3 py-2"
            placeholder="Name"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">City</span>
          <input
            className="rounded-md border px-3 py-2"
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Specialty</span>
          <input
            className="rounded-md border px-3 py-2"
            placeholder="ie. trauma, coaching"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
          />
        </label>
      </div>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      )}
      {err && (
        <div role="alert" className="mb-3 rounded-md border border-red-300 bg-red-50 p-3 text-sm">
          {err}
        </div>
      )}
      {!loading && !err && list.length === 0 && (
        <div className="rounded-md border p-4 text-sm text-muted-foreground">
          No advocates match your search.
        </div>
      )}

      <ul className="space-y-3">
        {list.map((advocate) => (
          <li key={advocate.id} className="rounded-2xl border p-4 shadow-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="text-lg font-semibold">
                {advocate.firstName} {advocate.lastName}
              </div>
              <div className="text-sm text-muted-foreground">
                {advocate.city} • {advocate.degree} • {advocate.yearsOfExperience} yrs
              </div>
            </div>
            {/* todo: possibly limit number of specialties shown? */}
            {advocate.specialties?.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {advocate.specialties.map((speciality, i) => (
                  <span key={i} className="rounded-full border px-2 py-0.5 text-xs">
                    {speciality}
                  </span>
                ))}
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      <Pagination
        page={page}
        pageSize={pageSize}
        total={resp?.total ?? 0}
        onChange={(p) => setPage(p)}
      />
    </div>
  );
}
