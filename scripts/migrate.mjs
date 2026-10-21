import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";

const MIGRATIONS_DIR = path.resolve(process.cwd(), "drizzle");
const BREAKPOINT = "--> statement-breakpoint";

async function migrate() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 5_000,
    application_name: "torob-migrate",
  });

  try {
    await pool.query(`
      create table if not exists __app_migrations (
        name text primary key,
        applied_at timestamptz not null default now()
      )
    `);

    try {
      await pool.query("create extension if not exists pg_trgm");
    } catch (error) {
      console.warn(
        `[migrate] pg_trgm unavailable, continuing without it: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    const files = (await readdir(MIGRATIONS_DIR))
      .filter((name) => /^\d{4}.*\.sql$/.test(name))
      .sort();

    for (const file of files) {
      const applied = await pool.query(
        "select 1 from __app_migrations where name = $1",
        [file],
      );
      if ((applied.rowCount ?? 0) > 0) {
        console.log(`[migrate] skip ${file}`);
        continue;
      }

      const sql = await readFile(path.join(MIGRATIONS_DIR, file), "utf8");
      const statements = sql
        .split(BREAKPOINT)
        .map((statement) => statement.trim())
        .filter(Boolean);

      const client = await pool.connect();
      try {
        await client.query("begin");
        for (const statement of statements) {
          await client.query(statement);
        }
        await client.query("insert into __app_migrations (name) values ($1)", [
          file,
        ]);
        await client.query("commit");
        console.log(`[migrate] applied ${file}`);
      } catch (error) {
        await client.query("rollback");
        throw new Error(
          `[migrate] failed on ${file}: ${error instanceof Error ? error.message : String(error)}`,
        );
      } finally {
        client.release();
      }
    }

    console.log(`[migrate] done (${files.length} migration file(s))`);
  } finally {
    await pool.end();
  }
}

migrate().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
