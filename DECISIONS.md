# Decisions

- **D-001 — Tailwind CSS v4.** Installed the current stable line with the
  `@tailwindcss/postcss` plugin. shadcn/ui compatibility will be checked in the
  UI phase; no component library is installed yet.
- **D-002 — Drizzle ORM chosen in Phase 1.** Phase 0 used `pg` for a database
  ping only. The brief allows Prisma or Drizzle; Drizzle was chosen because it
  has no engine binary, keeps the Alpine image small, and reuses the existing
  `pg` driver. Schema: `src/db/schema.ts`; generated SQL: `drizzle/`.
- **D-003 — Vazirmatn is self-hosted.** The variable WOFF2 file was taken from
  the `vazirmatn` npm package and served from `public/fonts`; no external font
  CDN at runtime.
- **D-004 — Postgres host port 5433.** The host already runs a Postgres server
  on 5432, so Docker Compose publishes the container database on 5433. The app
  inside Compose still connects to `db:5432`.
- **D-005 — `.env` is untracked and left for the user.** `.env.example` documents
  every variable. The LLM key is intentionally empty; the user fills it in.
- **D-006 — Migrations and idempotent seed run at container startup.**
  `docker-entrypoint.sh` runs `node scripts/migrate.mjs` before the server and
  runs `node dist/seed.mjs --if-empty` when `SEED_ON_START=true` (default in
  Compose). Local `npm run db:seed` uses `--reset`.
- **D-007 — Provisional brand layer.** The current palette and the wordmark
  «ترب‌یار» are placeholders. Phase 6 studies Torob's real visual language
  (screenshots) and records final design tokens in `docs/design-tokens.md`.
- **D-008 — Docker installed and verified during Phase 0.** Docker 29.1.3 and
  Compose v2.40.3 were installed from Ubuntu packages (authorized via
  `pkexec`). `docker compose up -d --build` succeeds and both containers report
  healthy. The `ehsan` user was added to the `docker` group; existing login
  sessions need a re-login to use the socket without `sudo`.
- **D-011 — Docker Hub is blocked from this network.** Direct access to
  `registry-1.docker.io` returns HTTP 403. `/etc/docker/daemon.json` therefore
  lists three working Iranian mirrors (`docker.arvancloud.ir`, `focker.ir`,
  `registry.docker.ir`). Image names in the Dockerfile stay standard
  (`node:22-alpine`, `postgres:16-alpine`) so deployment targets can supply
  their own registry configuration.
- **D-012 — Alpine `libc6-compat` was removed from the image.** `apk add`
  stalled in the build network. Next.js, `pg` (pure JS), and sharp all have
  musl support, so the deps stage no longer installs that compatibility
  package. The `# syntax=docker/dockerfile:1` directive was also dropped to
  avoid pulling a BuildKit frontend image; only built-in Dockerfile features
  are used.
- **D-009 — `/api/health` always returns HTTP 200.** Per the brief, the payload
  carries `status: "ok" | "degraded"` and a `db` object with
  `up | down | not_configured`. The container healthcheck relies on this
  endpoint.
- **D-010 — Prices default to Toman; RIAL is preserved.** The generated
  sample data uses `priceUnit = "TOMAN"`. The import adapter detects «ریال»,
  RIAL, and IRR and stores `RIAL`; comparison code must convert to a common
  unit in Phase 2. Every generated shop, product, and offer has
  `is_sample = true`; the UI must label it as sample data.

- **D-013 — Dataset values and confirmations stay separate.** `shops`,
  `products`, and `offers` hold imported values. Stock is never stored on an
  offer: it only exists in `offer_observations` after a seller answer, so the
  UI can distinguish «موجودی تأییدشده» from unknown. `shop_observations` stores
  confirmed hours/notes; `seller_checks` stores the follow-up request and token.
  IDs are stable text keys (`shop-0001`, `product-00001`, `offer-00001`), while
  observation/check rows use UUIDs.

- **D-014 — Persian normalization rules.** `normalizePersian` applies NFKC,
  maps Arabic Yeh/Kaf and alef variants to Persian forms, converts Persian and
  Arabic digits to ASCII, strips diacritics/tatweel, turns ZWNJ/ZWJ/NBSP into a
  space, lowercases Latin, and collapses whitespace. It is idempotent and is
  used for every `*_normalized` column. Display helpers keep Persian digits and
  thousands separators separate from the stored canonical text.

- **D-015 — Weekly hours format.** `weekly_hours` is JSON keyed by
  `saturday`…`friday`, each value an array of `{ open, close }` in `HH:mm`
  (`Asia/Tehran`). `null` means unknown; an empty array means closed. Imported
  Persian day keys and `HH:mm-HH:mm` ranges are normalized by
  `src/data/import/parse.ts`.

- **D-016 — Deterministic sample catalog with deliberate gaps.** The generator
  uses a seeded PRNG and produces 300 fictional shops, 2,000 products (250 in
  each of 8 categories), and 4,000 offers (14 for the first 100 shops, 13 for
  the rest). Shop names and contacts are fictional; phone/Instagram values must
  never be presented as callable/real. District centers are approximate and
  jittered. The dataset includes missing hours/coordinates, low-confidence
  addresses, missing prices/dates, and stale prices (>14 days).

- **D-017 — Custom migration runner.** `drizzle-kit` only generates SQL.
  `scripts/migrate.mjs` applies files inside transactions, records them in
  `__app_migrations`, and tries `CREATE EXTENSION IF NOT EXISTS pg_trgm` without
  failing when the extension is unavailable. This avoids requiring the Drizzle
  migrator at runtime and keeps the Liara image small.

- **D-018 — Import adapter contract.** Input is one JSON object with `shops`,
  `products`, and `offers` arrays. All source-field aliases live in
  `src/data/import/mapping.ts`; duplicate IDs and broken shop/product references
  are rejected before any write. Import replaces the whole catalog (including
  observations/checks). Dates must be ISO/Gregorian; Jalali parsing is not
  implemented yet.

- **D-019 — Seed bundle for the container.** `npm run build:db` bundles
  `src/db/seed.ts` to `dist/seed.mjs` with esbuild and keeps `pg` external. The
  standalone Next.js output already includes `pg`, verified by running the
  bundle inside the app container.

- **D-020 — Verified BoxAPI endpoint and constraints.** The working base URL is
  `https://ai.boxapi.ir/ai/v1`, not the marketing host. `/models` accepts
  `openai/gpt-6-luna`; `/chat/completions` and `/responses` both work.
  Streaming works. Function tools on `/chat/completions` require
  `reasoning_effort: "none"` for `gpt-6-luna`; routine app calls should use
  `"none"` or the lowest accepted effort. Smoke test: 9/9 with the corrected
  base URL (296 tokens).

- **D-021 — Search uses SQL candidates plus in-process grouping.** Offer
  candidates are fetched with parameterized SQL over normalized columns and a
  small Persian alias map (for example «آیفون» → `iphone`). Open-now, location,
  grouping, and ranking are evaluated in TypeScript because the dataset is
  small (4,000 offers) and this keeps the behavior testable. `pg_trgm` is
  available but GIN/trigram indexes are deferred until data volume requires
  them; normalized `LIKE` is the documented fallback.
- **D-022 — Location and hours semantics.** Distance is haversine; a district
  selection matches the normalized address only, while “near me” uses the
  browser coordinates and radius. Open status is evaluated at request time in
  `Asia/Tehran`, supports split/overnight ranges, and marks shops closing
  within 60 minutes as «به‌زودی بسته می‌شود». Unknown hours are distinct from
  closed.
- **D-023 — Compare recommendation is deterministic, not LLM.** Two to four
  products are scored from recorded price, nearest distance, open-shop count,
  shop count, and price freshness. The compare API returns the winner plus
  data-grounded reasons; the UI labels it as a data rule, not an AI judgment.
  The selected search context (query, district, or coordinates) is preserved in
  the compare URL so distances and the back link remain meaningful.

- **D-024 — BoxAPI uses the Vercel AI SDK with a request-body adapter.** The app
  uses `ai` 7 + `@ai-sdk/openai-compatible` with provider name `boxapi`. The
  current model rejects `max_tokens`, so the provider transforms it to
  `max_completion_tokens`. Reasoning stays `"none"` for routine calls, matching
  D-020. Verified with a real streamed tool call and token usage.

- **D-025 — One streaming tool loop, not nested agents.** A single
  `streamText` call may search, compare, or list shops, then writes the final
  answer. Tool execution calls the deterministic Phase 2 services; the model
  never queries Postgres. Deterministic parser hints backfill category,
  district, budget, and flag fields the model omits; after a successful search,
  `search_products` is disabled for later steps and repeated calls reuse the
  first result, so a second search cannot replace the cards. `find_shops` adds
  shop details without overwriting the search.

- **D-026 — Grounding and fallback are deterministic.** Prices, distances,
  counts, open state, and stock labels in cards come from tool/database output.
  If the LLM is unconfigured, over budget, unavailable, times out, calls no
  tools, or returns empty text, the app runs a rule-based Persian parser and the
  normal search service. The UI labels LLM, fallback, and cache modes. The
  no-LLM search/compare paths remain independent of the agent.

- **D-027 — Phase 3 budget, cache, and queue are process-local.** One process
  runs a single-slot queue (15-second wait timeout), caches successful answers
  for 30 minutes (100 entries), and tracks token/cost totals in memory. This is
  sufficient for the single Compose app instance and avoids schema churn;
  restarting the app resets usage and cache. Price defaults are $0.12/M input,
  $0.58/M output, and a $3 budget, overridable by environment variables.

- **D-028 — Real Torob CSV streaming importer (supersedes the D-018 CLI).**
  `npm run import` resolves `--dir`/`DATA_DIR` first, then `IMPORT_URL` (base URL
  or `.zip`), then the local `data/raw/torob-dataset/torob-dataset` folder. It
  streams the three CSVs through `csv-parse`, maps real aliases, inserts in
  batches inside one transaction after truncating the catalog, and verifies the
  final counts before commit. The Docker runner bundles `dist/import.mjs` and
  installs `unzip`. The legacy JSON `mapRawCatalog` remains for tests only.
  Import is destructive by replacement; observations and seller checks are
  cleared.

- **D-029 — Real-data search uses a grouped SQL browse page.** Empty
  query/category searches run a grouped `LIMIT/OFFSET` query in Postgres and
  fetch offers only for the page's product IDs. Open-now and district/radius
  filters are applied in SQL before grouping; exact haversine/open-state checks
  remain in TypeScript. Product cards return up to six offers, but aggregate
  counts cover all matching offers. Category facets are capped at 40 plus the
  selected label. This replaces the D-021 assumption that 4,000 offers fit
  comfortably in process memory.

- **D-030 — Imported data quality is surfaced, not silently repaired.** Real
  source gaps are preserved where safe: null prices/dates/hours/categories,
  duplicate shop/product offers, and empty specs remain visible. Prices above
  the PostgreSQL integer limit are converted to `NULL` and counted; the two
  source products without titles receive an explicit `(بدون عنوان)` placeholder
  so their offers are not orphaned. Generated reports are
  `docs/dataset-profile.md` and `docs/data-quality-report.md`.

- **D-031 — Seller confirmation is an additive observation layer.** Phase 4
  creates at most five tokenized `seller_checks` per request with stock/price
  questions plus conditional hours/warranty questions. Sellers write immutable
  `offer_observations` (and `shop_observations` for confirmed hours); imported
  `offers`/`shops` values are never edited. Search shows confirmed data alongside
  the recorded dataset price, and `unknown` stock remains distinct from
  out-of-stock.

- **D-032 — Demo seller simulation is deterministic and poll-driven.** With
  `DEMO_MODE=true`, the token determines a 55/25/20 in-stock/out-of-stock/
  no-answer plan with a 6–12 second delay. A due result advances only when a
  status, seller-page, or polling request reads it; there is no timer, queue
  worker, or daemon. This preserves the single-process Compose deployment and
  makes demos reproducible while keeping `/dev/seller-simulator` available for
  manual overrides during the delay.

- **D-033 — Seller links are capability URLs, not accounts.** A public link
  contains a random `lnk_`/`sim_` token and is sufficient to view and answer one
  check. There is no seller login or verified identity. Checks expire after seven
  days, accept one response, and expose only the chosen product/shop/check
  context. `viewed_at` is recorded on a real page view and backfilled by an
  auto/manual response when needed. This is suitable for the demo; production
  shop authentication remains future work.

- **D-034 — Effective hours come from the latest confirmed shop observation.**
  Search reads `shop_observations.confirmed_hours` when present, otherwise the
  imported `shops.weekly_hours`, and calculates open state from that effective
  value. The dataset row is not rewritten. `hoursConfirmedAt` is shown so buyers
  can distinguish confirmed hours from recorded data.

- **D-035 — Alternatives are deterministic and never claim confirmation.**
  After an out-of-stock answer or expiration, alternatives are the same product
  at other shops first, then similar products in the same category/brand within
  ±40% of the price, excluding the current and out-of-stock offers. Up to four
  are returned with explicit reasons and remain labelled as recorded data until
  they have their own seller observation.

- **D-036 — Seller tools participate in the single agent loop.** The assistant
  can create checks, read their status, and suggest alternatives from real tool
  output. Status/alternative-only turns produce `AgentResult.kind = "seller"`
  instead of a fabricated search result. Responses containing seller checks or
  alternatives are excluded from the 30-minute reply cache so links and status
  stay current; the rest of the Phase 3 queue/budget/fallback design is
  unchanged.
