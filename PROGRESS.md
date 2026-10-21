# Progress

## Phase 0 — Skeleton (complete)

Done:

- Next.js 16 App Router + TypeScript project with standalone output.
- Tailwind CSS v4 with RTL base styles and self-hosted Vazirmatn.
- Minimal Persian mobile-first landing page with the four-step product story.
- `GET /api/health` with Postgres connectivity status (`up`, `down`, or
  `not_configured`), latency, timestamp, and uptime.
- `Dockerfile` (multi-stage, non-root, standalone) and `docker-compose.yml`
  (app + Postgres 16, healthchecks).
- `.env.example`, `.gitignore`, `.dockerignore`.
- `scripts/llm-smoke-test.ts` covering chat, streaming, tool calling, Persian,
  model/endpoint discovery, and reasoning-effort acceptance.
- `README.md` and `DECISIONS.md`.

Verification:

- `npm run typecheck`: pass (0 errors).
- `npm run lint`: pass (0 problems).
- `npm run build`: pass, Next.js 16.4.2, `/` and `/_not-found` static,
  `/api/health` dynamic, standalone output generated.
- Local production server (standalone `server.js`, Postgres 18 on a scratch
  cluster): `GET /api/health` → HTTP 200,
  `{"status":"ok","db":{"status":"up",...}}`; `/` → HTTP 200 with
  `dir="rtl"`, Vazirmatn CSS, and the self-hosted font file served.
- Degraded database path: HTTP 200 with `status:"degraded"` and
  `db.status:"down"` when Postgres is unreachable.
- `npm run smoke`: exit 2, clean skip because `.env` has no LLM credentials
  yet. The script's full flow was exercised against a local mock
  OpenAI-compatible server: 9/9 checks passed (models, chat, Persian,
  streaming, tool calling, reasoning, `/responses`). Real-endpoint run is
  pending the user's key.
- `docker compose up`: **not run** — Docker is not installed on this machine
  (see D-008). Compose YAML parses and declares `db` + `app` with healthchecks.

Known blockers / notes:

- Docker is not installed on this machine (no passwordless sudo), so the
  container stack was not executed here. See D-008.
- `LLM_API_KEY` is empty until the user fills `.env`; the smoke test reports a
  clean skip until then.

## Next — Phase 1

- Prisma schema and migrations for `Shop`, `Product`, `Offer` (plus observation
  tables prepared for Phase 4).
- Persian normalization utilities with unit tests.
- Generated sample dataset (~300 shops, ~2,000 products, ~4,000 offers) with
  deliberate gaps, stale prices, and low-confidence addresses.
- Import adapter with column mapping kept in `src/data/import/mapping.ts`.
- Wire migrations + idempotent seed into container startup.
