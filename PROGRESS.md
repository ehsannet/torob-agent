# Progress

## Phase 0 — Skeleton (complete)

Done:

- Next.js 16 App Router + TypeScript project with standalone output.
- Tailwind CSS v4 with RTL base styles and self-hosted Vazirmatn.
- Minimal Persian mobile-first landing page with the four-step product story.
- `GET /api/health` with Postgres connectivity status, latency, timestamp, and
  uptime.
- Multi-stage `Dockerfile` (non-root) and `docker-compose.yml` (app + Postgres
  16, healthchecks).
- `.env.example`, `.gitignore`, `.dockerignore`.
- `scripts/llm-smoke-test.ts` covering chat, streaming, tool calling, Persian,
  model/endpoint discovery, and reasoning-effort acceptance.
- `README.md` and `DECISIONS.md`.

Verification:

- `npm run typecheck`, `npm run lint`, `npm run build`: pass.
- Local/Compose health: HTTP 200 with `db.status = "up"`; `/` returns 200 with
  `dir="rtl"` and the self-hosted font.
- Degraded database path returns HTTP 200 with `status:"degraded"`.
- Docker Compose stack healthy; both containers report healthy.
- Docker Hub is blocked from this network (HTTP 403); registry mirrors in
  `/etc/docker/daemon.json` are used. `ehsan` was added to the `docker` group;
  existing shells need one re-login before using `docker` without `pkexec`.
- LLM smoke: **9/9 checks passed** with the verified base URL
  `https://ai.boxapi.ir/ai/v1` and `openai/gpt-6-luna` (296 tokens). Tool calls
  require `reasoning_effort: "none"`. See D-020.
- Local `.env` note: if the smoke test returns an HTML 404, set
  `LLM_BASE_URL=https://ai.boxapi.ir/ai/v1` and
  `LLM_MODEL=openai/gpt-6-luna` in `.env`; the example file now has these.

## Phase 1 — Data (complete)

Done:

- Drizzle ORM + `pg` client (`src/db/schema.ts`, `src/lib/db.ts`).
- Six tables: `shops`, `products`, `offers`, `offer_observations`,
  `shop_observations`, `seller_checks`; four enums for price unit, stock,
  observation source, and seller-check status. Stock is deliberately not stored
  on offers.
- Generated migration `drizzle/0000_init.sql` plus a custom transactional runner
  (`scripts/migrate.mjs`) with `__app_migrations` and optional `pg_trgm`.
- Persian normalization and digit/display helpers
  (`src/lib/persian.ts`) and weekly-hours validation (`src/lib/hours.ts`), both
  unit-tested.
- Deterministic sample generator (`src/data/sample/`) producing 300 shops,
  2,000 products (8 categories × 250), and 4,000 offers (14 for the first 100
  shops, 13 for the rest), with deliberate gaps.
- Seed/replace/report commands (`src/db/seed.ts`, `src/db/replace.ts`,
  `src/db/report.ts`), `--reset` and `--if-empty` modes.
- Import adapter with all source aliases in `src/data/import/mapping.ts`,
  value parsers in `parse.ts`, strict reference checks, and
  `scripts/import-dataset.ts` (`--dry-run` supported).
- Container startup: migrations, then conditional seed when
  `SEED_ON_START=true`, then `node server.js`; seed bundled with esbuild to
  `dist/seed.mjs` (verified inside the app container).
- `docs/data-model.md`, `README.md`, `DECISIONS.md`, and `.env.example`
  updated.

Verification:

- `npm test`: 44 tests passed across 5 files.
- `npm run typecheck`: pass. `npm run lint`: pass. `npm run build`: pass.
- `npm run db:migrate`: applied `0000_init.sql`; subsequent runs skip it.
- `npm run db:seed`: 300 shops, 2,000 products, 4,000 offers.
- `npm run db:seed:if-empty`: correctly skips a non-empty catalog.
- `npm run db:report`:
  - offers per shop: min 13, avg 13.33, max 14;
  - shops without hours: 57 (19.0%);
  - shops without coordinates: 11 (3.7%);
  - low-confidence addresses: 25 (8.3%);
  - offers without price: 130 (3.3%);
  - offers without price date: 171 (4.3%);
  - stale offers (>14 days): 1,494 (37.4%);
  - 0 offers priced in RIAL (sample uses Toman).
- Docker image rebuilt; entrypoint logs show migrations skipped and seed skipped
  because the catalog was already populated. `node dist/seed.mjs --reset`
  inside the container regenerated all rows successfully.
- Compose health remains HTTP 200. `/` returns 200.

Notes:

- All catalog rows are sample data (`is_sample = true`); names and contact
  details are fictional and must not be presented as real.
- `AGENT_BRIEF.md` is intentionally untracked.
- Dates in imports must be ISO/Gregorian; Jalali parsing is deferred (D-018).

## Next — Phase 2 (search and compare, no LLM)

- Product search over normalized columns, filters, and category browsing.
- Group offers by base product; nearby-shop counts and price ranges.
- Compare 2–4 products/offers with transparent differences.
- Add trigram/full-text indexes if `pg_trgm` is available; otherwise normalized
  `LIKE` fallback.
- Haversine distance and RIAL→Toman normalization for comparisons.
- Three-way labels (recorded price / last change / confirmed stock) and stale
  price warnings in the UI.
