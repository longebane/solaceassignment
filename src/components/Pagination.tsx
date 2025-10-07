'use client';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}
export default function Pagination({ page, pageSize, total, onChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(total, page * pageSize);

  return (
    <div className="mt-4 flex items-center justify-between gap-4 text-sm">
      <div className="text-muted-foreground">
        {total ? `Showing ${start}–${end} of ${total}` : 'No results'}
      </div>
      <div className="flex items-center gap-2">
        <button
          className="rounded border px-2 py-1 disabled:opacity-50"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          aria-label="Previous page"
        >
          Prev
        </button>
        <span className="min-w-16 text-center tabular-nums">
          {page} / {totalPages}
        </span>
        <button
          className="rounded border px-2 py-1 disabled:opacity-50"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          aria-label="Next page"
        >
          Next
        </button>
      </div>
    </div>
  );
}
