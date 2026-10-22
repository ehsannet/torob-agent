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

## Phase 2 — Search and compare (complete)

Done:

- Search primitives: `src/lib/opening-hours.ts` (Asia/Tehran, overnight ranges,
  closing-soon), `src/lib/geo.ts` (haversine), `src/lib/price.ts`
  (RIAL→Toman, Persian formatting, stale-price age), `src/lib/tehran.ts`
  (district catalog), and `src/lib/search-params.ts` (validated URL filters).
- Search services are split into `src/server/search.ts` (orchestration),
  `search-query.ts` (parameterized SQL, normalized `LIKE`, Persian aliases),
  and `search-results.ts` (mapping, open/distance filtering, grouping, ranking).
  They join the latest offer observation, convert prices to Toman, compute open
  status/distance in JS, and group offers by base product.
- `src/server/compare.ts` compares 2–4 products and emits a deterministic
  recommendation with reasons; no LLM call.
- APIs: `GET /api/search` and `GET /api/compare`, with `400` validation errors
  and `no-store` responses.
- UI: new home, `/search`, filter bottom sheet (category, budget, district,
  near-me radius, open-now, Torob Pay, installments, Kalabarg, fast delivery,
  sort), product cards, shop offer cards, compare selection bar, `/compare`
  view, and loading/empty/error states.
- Transparency labels are visible on every product/shop card: recorded price,
  last price change, confirmed stock, stale-price warning, and address
  confidence warning. `is_sample` data is labelled in the UI.
- Docs: `docs/search.md` documents the API contract and semantics.

Verification:

- `npm test`: 82 tests passed across 11 files (open-now, overnight, geo,
  Toman/RIAL, stale prices, URL filters, compare IDs, recommendation).
- `npm run typecheck`, `npm run lint`, `npm run build`: pass.
- Real DB/API checks: `q=iPhone 15` groups 24 offers; `q=آیفون` maps to the
  same results; district and radius filters work; invalid filters return 400.
- Browser flow (headless Chrome/CDP): search → open filter sheet → apply
  category/sort → select two products → compare bar → compare page. No LLM
  request is made.
- Docker image rebuilt; Compose app is healthy, health payload reports
  `phase: 2`, and `/search` plus `/api/compare` return `200`.

Notes:

- Search currently uses normalized `LIKE` + aliases rather than `pg_trgm`
  GIN indexes; 4,000 offers are well within the in-process grouping budget.
- At night the open-now filter legitimately returns zero results in Tehran.
  Open/closed state is evaluated at request time, not cached.

## Phase 3 — LLM agent (complete)

Done:

- `ai` 7 + `@ai-sdk/openai-compatible` client (`src/agent/config.ts`) with a
  request-body adapter from `max_tokens` to `max_completion_tokens`, usage
  accounting, `reasoning_effort: "none"`, a 60-second total timeout, and model
  caching. Base URL is the verified `https://ai.boxapi.ir/ai/v1`.
- Single-slot agent queue (`src/agent/queue.ts`) with a 15-second wait timeout,
  processed/failed counters, and lock release on success, error, or abort.
- In-memory TTL cache (30 minutes, 100 entries) keyed by normalized message +
  district/coordinates/radius, and an in-memory usage tracker with token counts,
  approximate cost, $3 default budget, and `GET /api/agent/usage`.
- Persian rule-based parser (`src/agent/tools/parse-request.ts`) for category,
  model text, district, budget ranges, open-now, Torob Pay, installments,
  Kalabarg, fast delivery, and sort — used by the no-LLM fallback.
- Tool modules under `src/agent/tools/`: `search_products` (limit 8),
  `compare_products` (2–4 IDs or 2–4 product-name queries), and `find_shops`.
  Tools call Phase 2 services; the model never queries Postgres.
- One `streamText` loop (max 5 steps) with per-step search disabling after a
  successful search, tool-call progress events, streamed text, and a final
  result assembled from tool data. `find_shops` adds shops without overwriting
  the product result. Compare can resolve product names, avoiding accidental
  same-brand substitutions.
- `POST /api/agent` streams NDJSON (`status`, `delta`, `result`, `usage`,
  `done`, `error`) with abort support. Deterministic fallback for missing key,
  budget exhaustion, provider errors, timeouts, empty text, or missing tools.
- `/assistant` mobile RTL UI with contextual location, quick prompts, streamed
  answer, grounded result cards, compare/search links, cache/fallback labels,
  abort control, and visible cost/budget. Home and search link into the
  assistant with preserved context.
- `docs/agent.md`; README, DECISIONS D-024…D-027, `.env.example`, Compose env
  defaults, and `agent:smoke` / `agent:run-smoke` scripts updated.

Verification:

- `npm test`: 94 tests passed across 13 files (parser/filter merging, queue
  serialization/timeout/failure, plus all prior phases).
- `npm run typecheck`, `npm run lint`, `npm run build`: pass.
- Real AI SDK smoke: streamed tool call succeeded with correct token usage.
- Real agent run: Persian iPhone request → 1 grounded product; identical second
  request returned `mode: "cache"` with no model call; empty key returned
  `mode: "fallback"`; PS5/Xbox comparison resolved distinct products and
  explained that Series X was unavailable rather than substituting silently.
- Browser/CDP at `/assistant?district=vanak`: phase label, district context,
  quick prompt, streamed/cached answer, result card, search link, usage badge,
  and no runtime exceptions. Fresh-LLM route and cache hit both returned
  `result`, `usage`, and `done` events.
- Docker image rebuilt; app healthy, `/assistant`, `/search`, and `/icon.svg`
  return 200; `/api/agent` reached the provider from inside Compose.

Notes:

- Cache, usage, and queue counters are process-local and reset on restart; this
  is intentional for the single Compose app instance (D-027).
- Usage numbers are estimates based on configurable per-million prices, not
  provider billing records.
- The assistant intentionally omits conversation history from the model call;
  the API accepts a short history for a later turn model.
- Search and compare remain fully deterministic and independent of the LLM.

## Real Torob dataset import (complete)

Done:

- Added `scripts/profile-dataset.ts` + `npm run data:profile`; generated
  `docs/dataset-profile.md` from the 284 MB CSV export without copying full
  contents.
- Extended the import mapping/parsers for real Torob columns:
  `persian_title`, `brand_name`, `category_name`, `price_toman`,
  `last_price_changed_at`, `warranty`, `category_names`, `contacts`,
  `location_label`, `payment_options`, `supports_fast_delivery`, `website_url`,
  JSON specs arrays, and wrapped `weekly_hours`.
- Added `scripts/import-dataset.ts`, `src/data/import/dataset.ts`,
  `src/data/import/source.ts`, and `src/data/import/import-catalog.ts`.
  The importer streams CSVs through `csv-parse`, batches inserts, normalizes
  over-range prices to null, skips unknown references with a report, verifies
  counts, and replaces the catalog in one transaction.
- Added `npm run import` for local or container use. Sources resolve from
  `--dir`/`DATA_DIR`, then `IMPORT_URL` (base URL or zip), then the local
  dataset. The Docker runner now bundles `dist/import.mjs` and includes `unzip`.
- Added `scripts/data-quality-report.ts` + `npm run data:quality`; generated
  `docs/data-quality-report.md` with counts, field completeness, price units,
  Tehran bounds, duplicates, and top categories/locations.
- Real-data search fixes: exact imported category labels on home/data, district
  matching by `location_label` then address, grouped SQL browse pagination for
  empty searches, SQL prefiltering for open-now and radius, category facets
  capped at 40, product cards capped at six offers, and demo labels replaced
  with real-data caveats.
- Updated README, `docs/data-model.md`, `docs/search.md`, `.env.example`,
  Compose env passthrough, and DECISIONS D-028…D-030.

Verification:

- Dataset profile: shops 6,476 / 13 columns; products 225,903 / 7 columns;
  offers 331,506 / 8 columns; declared README counts match.
- Dry run and real import completed in **3m42s** with
  `shops=6476 products=225903 offers=331506`, skipped 0/0/0, and count
  verification passed.
- Import normalization: 15,083 source-null prices + 508 over-limit prices stored
  as null; 2 source products without titles imported with an explicit
  `(بدون عنوان)` placeholder.
- Quality report: 15,591 offers without price (4.7%), 769 without price date,
  1,797 shops without category, 2,011 without hours, 317,102 without warranty,
  9,557 duplicate shop/product pairs (29,872 rows), 404 identical duplicate
  rows, 0 shops outside the Tehran bounding box. Maximum offers per shop is
  1,346; the source is highly concentrated in Ferdowsi and Sheikh Hadi.
- API/search checks on real data: empty browse ~0.9s / 96 KB response (warm
  Compose ~1.0s; first container request ~3.0s); category `گوشی موبایل` ~0.2–0.6s / 157 KB (814
  products, 2,122 offers); `iPhone 15` ~0.9s; district `ferdowsi` ~1.8s
  before browse paging, ~0.9s after; open-now ~0.8s; fast-delivery query
  ~0.7s. Category facets are 40 + selected; cards show six offers. Browse
  pages 1–3 are disjoint.
- Compare API on two real product IDs: two groups, deterministic recommendation,
  `demo=false`, 0.1s.
- Real-data agent smoke: ``گوشی سامسونگ در فردوسی`` => category
  `گوشی موبایل`, district `ferdowsi`, 47 groups / 5 shops, LLM mode, 8s;
  ``دوربین مدار بسته تا ۵ میلیون`` => 915 groups, CCTV category, 4.2s.
  Deterministic parser hints fill omitted tool fields; repeat searches reuse
  the first result instead of overwriting cards.
- `npm test`: 101 tests passed across 14 files. `npm run typecheck`,
  `npm run lint`, and `npm run build`: pass.

Notes:

- Real rows import with `is_sample=false`; the sample generator remains for
  tests and can be restored with `npm run db:seed`.
- Import is destructive by replacement and clears observations/seller checks;
  back up before re-importing after Phase 4 data exists.
- Two source titles are placeholders; 508 source prices are outside the integer
  column range and are not searchable by price.

## Next — Phase 4 (seller loop)

- Seller/availability confirmation flow on top of `seller_checks`.
- Visit planning and follow-up UX.
