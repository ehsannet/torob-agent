#!/bin/sh
set -e

echo "[entrypoint] applying database migrations"
node scripts/migrate.mjs

if [ "${SEED_ON_START:-false}" = "true" ]; then
  echo "[entrypoint] seeding sample catalog if the database is empty"
  node dist/seed.mjs --if-empty
fi

exec "$@"
