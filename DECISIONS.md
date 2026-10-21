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
