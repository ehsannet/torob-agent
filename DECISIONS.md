# Decisions

- **D-001 — Tailwind CSS v4.** Installed the current stable line with the
  `@tailwindcss/postcss` plugin. shadcn/ui compatibility will be checked in the
  UI phase; no component library is installed yet.
- **D-002 — ORM deferred to Phase 1.** Phase 0 needs a database ping only, so
  `pg` is used directly. Prisma is the intended ORM once the schema exists.
- **D-003 — Vazirmatn is self-hosted.** The variable WOFF2 file was taken from
  the `vazirmatn` npm package and served from `public/fonts`; no external font
  CDN at runtime.
- **D-004 — Postgres host port 5433.** The host already runs a Postgres server
  on 5432, so Docker Compose publishes the container database on 5433. The app
  inside Compose still connects to `db:5432`.
- **D-005 — `.env` is untracked and left for the user.** `.env.example` documents
  every variable. The LLM key is intentionally empty; the user fills it in.
- **D-006 — Migrations are not wired into the container entrypoint yet.**
  There is no schema in Phase 0. Phase 1 adds migrations and an idempotent
  seed/import command, then the entrypoint runs them before `node server.js`.
- **D-007 — Provisional brand layer.** The current palette and the wordmark
  «ترب‌یار» are placeholders. Phase 6 studies Torob's real visual language
  (screenshots) and records final design tokens in `docs/design-tokens.md`.
- **D-008 — Docker was unavailable on the development machine.** `docker` and
  `podman` are not installed and passwordless `sudo` is not available, so the
  image and Compose stack could not be executed here. The Dockerfile and
  `docker-compose.yml` follow the brief and are ready to run where Docker
  exists; local production build and `/api/health` were verified with Node.
- **D-009 — `/api/health` always returns HTTP 200.** Per the brief, the payload
  carries `status: "ok" | "degraded"` and a `db` object with
  `up | down | not_configured`. The container healthcheck relies on this
  endpoint.
- **D-010 — Sample-data and price-unit assumptions are deferred.** They belong
  to the data import phase; the decision log will record the toman/rial
  assumption and the demo sample-data marker when Phase 1 starts.
