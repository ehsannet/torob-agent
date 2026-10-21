# Torob In-Store Shopping Assistant

Persian (RTL), mobile-first assistant for buying in person from shops in Tehran.
Built with Next.js (App Router), TypeScript, Tailwind CSS, PostgreSQL, and the
Vercel AI SDK (added in a later phase).

> Current status: **Phase 0 — skeleton only**. Data, search, the agent, and the
> seller loop are implemented in the next phases. See `PROGRESS.md`.

## Requirements

- Node.js 20.9+ (Node 22 recommended)
- Docker + Docker Compose (for the containerized setup)
- PostgreSQL 16 (only if you run the app outside Docker)

## Local development (without Docker)

```bash
cp .env.example .env   # fill in LLM_BASE_URL / LLM_API_KEY
npm install
npm run dev
```

Open http://localhost:3000. The health endpoint is at
http://localhost:3000/api/health.

`DATABASE_URL` must point to a reachable Postgres instance for the health
endpoint to report `db.status = "up"`. If it is missing, the app still runs and
reports `not_configured`.

## Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

- App: http://localhost:3000
- Health: http://localhost:3000/api/health
- Postgres is exposed on host port **5433** (5432 is commonly already taken);
  inside the Compose network the app uses `db:5432`.

The app service passes `LLM_*` variables from `.env` at runtime; secrets are
never baked into the image.

## Environment variables

See `.env.example`. `.env` is git-ignored and must never be committed.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string |
| `LLM_BASE_URL` | BoxAPI OpenAI-compatible base URL |
| `LLM_API_KEY` | Server-side only LLM key |
| `LLM_MODEL` | Default cheap model (`gpt-6-luna`) |
| `LLM_MODEL_HARD` | Optional stronger model (`gpt-6-sol`) |
| `EMBEDDING_MODEL` | Embedding model for later phases |
| `APP_BASE_URL` | Public base URL for seller links |
| `DEMO_MODE` | Enables deterministic demo behavior later |

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (standalone output) |
| `npm start` | Start the production server |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run smoke` | LLM capability smoke test (reads `.env`, never prints the key) |

## LLM smoke test

```bash
npm run smoke
```

The script reports, against the real endpoint: model listing and ID format,
plain chat, streaming, tool calling, a Persian prompt, reasoning-effort
acceptance, and whether `/responses` works. It prints token usage but never the
API key. Exit codes: `0` all core checks passed, `1` a core check failed,
`2` missing configuration (expected until `.env` is filled).

The app remains usable without the LLM by design; chat is a convenience, not a
dependency.
