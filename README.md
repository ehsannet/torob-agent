# Torob In-Store Shopping Assistant

Persian (RTL), mobile-first assistant for buying in person from shops in Tehran.
Built with Next.js (App Router), TypeScript, Tailwind CSS, PostgreSQL, Drizzle
ORM, and the Vercel AI SDK (added in a later phase).

> Current status: **Phase 1 — data layer complete**. Search, the agent, and the
> seller loop are implemented in the next phases. See `PROGRESS.md` and
> `docs/data-model.md`.

## Requirements

- Node.js 20.9+ (Node 22 recommended)
- Docker + Docker Compose (for the containerized setup)
- PostgreSQL 16 (only if you run the app outside Docker)

## Local development (without Docker)

```bash
cp .env.example .env   # fill in LLM_API_KEY
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open http://localhost:3000. The health endpoint is at
http://localhost:3000/api/health.

`DATABASE_URL` must point to a reachable Postgres instance for the health
endpoint to report `db.status = "up"`. If it is missing, the app still runs and
reports `not_configured`.

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

The app service passes `LLM_*` variables from `.env` at runtime; secrets are
never baked into the image.

If Docker Hub is blocked on your network, add a reachable registry mirror to
`/etc/docker/daemon.json` and restart Docker (this machine uses Iranian
mirrors; see `DECISIONS.md` D-011). After being added to the `docker` group,
log out and back in before running `docker` without `sudo`.

## Environment variables

See `.env.example`. `.env` is git-ignored and must never be committed.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string |
| `LLM_BASE_URL` | Verified base: `https://ai.boxapi.ir/ai/v1` |
| `LLM_API_KEY` | Server-side only LLM key |
| `LLM_MODEL` | Default cheap model (`openai/gpt-6-luna`) |
| `LLM_MODEL_HARD` | Optional stronger model (`openai/gpt-6-sol`) |
| `EMBEDDING_MODEL` | Embedding model for later phases |
| `APP_BASE_URL` | Public base URL for seller links |
| `DEMO_MODE` | Enables deterministic demo behavior later |
| `SEED_ON_START` | Seed sample data at container start if the catalog is empty |

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
| `npm run db:migrate` | Apply migrations with the project runner |
| `npm run db:seed` | Regenerate the sample catalog |
| `npm run db:seed:if-empty` | Seed only when the catalog is empty |
| `npm run db:report` | Catalog counts and data-quality gaps |
| `npm run db:import -- <file>` | Import a JSON dataset (add `--dry-run` to validate) |

## Data

The development catalog is generated sample data: 300 shops, 2,000 products,
and 4,000 offers, with deliberate gaps and stale prices. All rows carry
`is_sample`. See `docs/data-model.md` for the schema, normalization rules,
hours format, and import contract.

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
dependency.
