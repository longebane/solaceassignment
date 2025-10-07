## Changes

1. API (server-side filtering/pagination)
   - Validated query params (Zod)
   - WHERE filters for q/city/degree/specialty + safe sort mapping
   - Robust jsonb EXISTS for specialties (array or scalar)
   - Contract: { data, page, pageSize, total }

2. UI
   - Debounced inputs
   - Paginated list
   - Loading skeletons, error banner, empty state
   - Card layout with tailwind

## TODO

- Keyset pagination for deep lists; measure vs offset
- Full-text search (tsvector) and/or pg_trgm for fuzzy name match
- Redis cache keyed by query params; basic rate limiting
- Tests (API + Playwright happy paths)
- Storybook for the advocate card; design tokens from design team
