# Torob In-Store Shopping Assistant

Persian (RTL), mobile-first assistant for buying in person from shops in Tehran.
Built with Next.js (App Router), TypeScript, Tailwind CSS, PostgreSQL, Drizzle
ORM, and the Vercel AI SDK.

> Current status: **Phase 6 complete + real Torob dataset imported**. Search and
> compare remain deterministic and usable without the LLM; the agent adds
> free-text intent parsing, tool calls, streaming, usage budgets, cache, and
> fallback. Sellers can confirm stock, price, hours, and warranty through
> tokenized links, with a deterministic demo simulator. Shops expose structured
> Persian addresses, route links, open status, and visit warnings. The UI now
> follows a documented Torob-inspired token set, ships route-level
> empty/error/loading states and a downloadable PWA shell. See `PROGRESS.md`,
> `docs/design-tokens.md`, `docs/search.md`, `docs/agent.md`, and
> `docs/seller-loop.md`.

## Requirements

- Node.js 20.9+ (Node 22 recommended)
- Docker + Docker Compose (for the containerized setup)
- PostgreSQL 16 (only if you run the app outside Docker)

## Local development (without Docker)

```bash
cp .env.example .env   # fill in LLM_API_KEY
npm install
npm run db:migrate
npm run import          # real CSV dataset from DATA_DIR or data/raw
# or: npm run db:seed   # deterministic sample data instead
npm run dev
```

Open http://localhost:3000. Search is at `/search`, the assistant at
`/assistant`, shop details at `/shops/<id>`, seller links at `/s/<token>`, the
demo simulator at `/dev/seller-simulator`, and the health endpoint at
`/api/health`.

`DATABASE_URL` must point to a reachable Postgres instance for the health
endpoint to report `db.status = "up"`. If it is missing, the app still runs and
reports `not_configured`.

The import is streaming and idempotent: it validates/reports rows, truncates the
catalog, inserts in batches, then verifies counts. It preserves the CSV directory
layout in `data/raw/torob-dataset/torob-dataset/`. Use
`npm run import -- --dry-run` to validate without writing.

## Docker Compose

```bash
cp .env.example .env   # fill in LLM_API_KEY
docker compose up --build -d
```

- App: http://localhost:3000
- Health: http://localhost:3000/api/health
- Postgres is exposed on host port **5433** (5432 is commonly already taken);
  inside the Compose network the app uses `db:5432`.
- On startup the container applies migrations, then seeds the sample catalog
  only if the database is empty (`SEED_ON_START=true` by default).
- Import the real dataset inside the running container:

  ```bash
  docker compose exec app npm run import -- --dry-run
  docker compose exec app npm run import
  ```

  Use `IMPORT_URL` (base URL or a `.zip`) when the CSVs are not mounted, or
  `DATA_DIR` when the dataset is available inside the container. The runner
  image includes `unzip` for zip sources.

The app service passes `LLM_*` variables from `.env` at runtime; secrets are
never baked into the image.

If Docker Hub is blocked on your network, add a reachable registry mirror to
`/etc/docker/daemon.json` and restart Docker (this machine uses Iranian
mirrors; see `DECISIONS.md` D-011). After being added to the `docker` group,
log out and back in before running `docker` without `sudo`.

## Search and compare (Phase 2)

The search and compare flow is fully deterministic and does not call an LLM:

```bash
curl 'http://localhost:3000/api/search?q=iPhone%2015&district=vanak&openNow=1'
curl 'http://localhost:3000/api/compare?ids=product-00031,product-00123&lat=35.7573&lng=51.4102&radiusKm=3'
```

- `GET /api/search` accepts `q`, `category`, `minPrice`, `maxPrice` (Toman),
  `district` (slug), `lat`/`lng` + `radiusKm`, `openNow`, `torobPay`,
  `installments`, `kalabarg`, `fastDelivery`, `sort` (`relevance`, `price`,
  `distance`, `newest`), `page`, and `limit` (max 24).
- Results are grouped by base product. Each offer carries the recorded price,
  last price change, derived Toman price, open status, distance, and the latest
  confirmed stock status, price, and hours (unknown until a seller observation
  exists). Product cards return up to six offers; aggregate counts still
  describe every matching offer.
- Empty query/category searches use a database-side grouped page, so `/search`
  stays responsive on the 331k-offer catalog. Category facets are capped at 40
  labels; the selected category is always included.
- `GET /api/compare` accepts 2–4 comma-separated product IDs and the same
  location context. It returns the products plus a data-only recommendation
  and reasons.
- The UI exposes `/`, `/search`, and `/compare`. See `docs/search.md` for the
  full response contract and semantics.

## Assistant (Phase 3)

`/assistant` sends free text to `POST /api/agent` and renders a streamed answer
plus result cards built from the same search/compare services. The response is
NDJSON (`status`, `delta`, `result`, `usage`, `done`, `error`).

- One model call may use `search_products`, `compare_products`, and
  `find_shops`; tools call the deterministic catalog, never the reverse.
- A single-slot queue serializes agent requests. Successful answers are cached
  for 30 minutes. Usage, approximate cost, and the $3 default budget are visible
  at `GET /api/agent/usage` and in the UI.
- If the key is missing, the provider fails, the request times out, or the
  budget is exhausted, a Persian rule-based fallback searches the catalog and
  labels the answer accordingly. Search and compare never depend on the LLM.
- Seller tools can create/check confirmation requests and return alternatives;
  status-only results are valid agent results. See `docs/agent.md` for the
  request/event contract, tools, configuration, and limitations.

## Seller confirmation loop (Phase 4)

While browsing `/search`, the buyer can ask one to five shops to confirm stock,
price, known weekly hours, and warranty before visiting. This is additive to the
deterministic catalog: dataset prices and hours are never overwritten, and stock
stays «نامشخص» until an observation exists.

- `POST /api/seller-checks` creates tokenized checks; `GET` lists a browser
  session's checks. `GET /api/seller-checks/[token]` and the public `/s/[token]`
  page drive the seller response. See `docs/seller-loop.md` for the full
  contract.
- `DEMO_MODE=true` (the default) simulates a seller: 55% in stock, 25% out of
  stock, 20% no answer after 6–12 seconds, advanced by polling rather than a
  background daemon. `/dev/seller-simulator` is available only in demo mode.
- Answers create immutable offer/shop observations. Search cards immediately
  show the latest confirmed stock, price, and hours; checks that are out of
  stock or unanswered show alternatives from other shops.
- Three of the assistant's tools support the loop:
  `create_seller_check`, `get_seller_check_status`, and
  `suggest_alternatives`, in addition to search/compare. Seller results are not
  cached.
- `viewed_at` is added by `drizzle/0001_seller_check_viewed_at.sql`; Compose
  applies it at startup before serving.

## Visit planning (Phase 5)

Every shop card and `/shops/[id]` shows a composed structured address (mall,
floor, unit, street, landmark), the current open state, and a Google Maps route
link. The shop detail page also shows weekly hours, confirmed-hours status,
visit warnings, contact/features, and that shop's offers.

- Address fields are extracted deterministically from Persian text at import
  time and by a non-destructive backfill. `npm run data:addresses` reports
  changes; add `--apply` to write, and `--llm` to fill only the remaining
  unstructured rows with a source-checked, cached model pass.
- Visit warnings cover out-of-stock/unknown stock, approximate address, missing
  floor/unit in a mall, closed/unknown hours, closing soon, and stale prices.
- The assistant's `get_visit_plan` tool returns the same plan for an offer or
  shop; visit-only results render as `kind: "visit"` and are not cached.

## Polish, states, and PWA (Phase 6)

The visual language was matched to Torob's light mobile web and recorded in
`docs/design-tokens.md`; all runtime values live in the `@theme` block of
`src/app/globals.css`.

- Shared `PageStatus` and `RouteError` components, route-level `error.tsx` and
  `loading.tsx` files, a root `not-found.tsx`, and skeletons on search, compare,
  shop, seller, and home routes.
- `/manifest.webmanifest`, maskable/any icons, `apple-icon.png`, and a no-op
  service worker registered only in production (`public/sw.js`,
  `src/components/pwa-register.tsx`). The app is installable; offline caching is
  intentionally out of scope for this phase.
- Performance check via Chrome DevTools Protocol on the production build: home
  TTFB ≈12ms and FCP ≈128ms, search TTFB ≈29ms with data ready ≈0.7s, and 0
  installability errors. No external font/CDN requests.

## Environment variables

See `.env.example`. `.env` is git-ignored and must never be committed.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string |
| `LLM_BASE_URL` | Verified base: `https://ai.boxapi.ir/ai/v1` |
| `LLM_API_KEY` | Server-side only LLM key |
| `LLM_MODEL` | Default cheap model (`openai/gpt-6-luna`) |
| `LLM_MODEL_HARD` | Optional stronger model (`openai/gpt-6-sol`) |
| `LLM_INPUT_PRICE_PER_MILLION` | Cost estimate input price, default `0.12` |
| `LLM_OUTPUT_PRICE_PER_MILLION` | Cost estimate output price, default `0.58` |
| `LLM_BUDGET_USD` | Agent cost budget, default `3` |
| `EMBEDDING_MODEL` | Embedding model for later phases |
| `APP_BASE_URL` | Public base URL for seller links, default `http://localhost:3000` |
| `DEMO_MODE` | Enables deterministic simulated seller responses |
| `SEED_ON_START` | Seed sample data at container start if the catalog is empty |
| `DATA_DIR` | Local CSV directory containing `shops.csv`, `products.csv`, `offers.csv` |
| `IMPORT_URL` | Base URL for the three CSVs, or a `.zip` archive; used when no local data exists |

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (standalone output) |
| `npm start` | Start the production server |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm test` | Vitest suite |
| `npm run smoke` | LLM capability smoke test (reads `.env`, never prints the key) |
| `npm run agent:smoke` | AI SDK provider + streamed tool-call check |
| `npm run agent:run-smoke` | End-to-end agent fresh answer + cache hit (needs DB) |
| `npm run db:migrate` | Apply migrations with the project runner |
| `npm run import` | Import/refresh the real CSV catalog from `DATA_DIR`/`IMPORT_URL` |
| `npm run import -- --dir <path>` | Import a specific CSV directory |
| `npm run data:profile` | Write `docs/dataset-profile.md` |
| `npm run data:quality` | Write `docs/data-quality-report.md` from the database |
| `npm run data:addresses` | Backfill structured addresses (dry-run; `--apply`, `--llm`) |
| `npm run db:seed` | Regenerate the sample catalog |
| `npm run db:seed:if-empty` | Seed only when the catalog is empty |
| `npm run db:report` | Console catalog counts and data-quality gaps |

## Data

By default the development catalog is imported Torob data: **6,476 shops,
225,903 products, and 331,506 offers** in Tehran. The source has gaps (15,591
imported offers without a price, including 508 prices normalized to null to fit
the integer column), 769 offers without a price date, 1,797 shops without a
category, and 9,557 duplicate shop/product pairs. The import replaces the sample
catalog but keeps schema, IDs, hours, specs, images, and coordinates. See
`docs/data-quality-report.md` and `docs/dataset-profile.md`; the deterministic
sample dataset remains available through `npm run db:seed`. Read
`docs/data-model.md` for the schema, normalization rules, hours format, and
import contract.

## LLM smoke test

```bash
npm run smoke
```

The script reports, against the real endpoint: model listing and ID format,
plain chat, streaming, tool calling, a Persian prompt, reasoning-effort
acceptance, and whether `/responses` works. It prints token usage but never the
API key. Exit codes: `0` all core checks passed, `1` a core check failed,
`2` missing configuration.

Verified results (Phase 1): 9/9 checks passed with
`https://ai.boxapi.ir/ai/v1` and `openai/gpt-6-luna`. Function tools on
`/chat/completions` require `reasoning_effort: "none"`; see D-020.

The app remains usable without the LLM by design; chat is a convenience, not a
dependency. For the Phase 3 SDK path, `npm run agent:smoke` verifies tool calling
and usage through the configured provider; `npm run agent:run-smoke` exercises
the real search tool and cache.
