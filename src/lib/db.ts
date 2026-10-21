import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../db/schema";

export type DbCheck =
  | { status: "up"; latencyMs: number }
  | { status: "down"; latencyMs: number; error: string }
  | { status: "not_configured" };

const globalForDb = globalThis as unknown as {
  torobPool?: Pool;
  torobDb?: NodePgDatabase<typeof schema>;
};

function connectionString(): string {
  const value = process.env.DATABASE_URL?.trim();
  if (!value) throw new Error("DATABASE_URL is not set");
  return value;
}

function createPool(): Pool {
  return new Pool({
    connectionString: connectionString(),
    max: 5,
    connectionTimeoutMillis: 2_500,
    query_timeout: 2_500,
    idleTimeoutMillis: 10_000,
    allowExitOnIdle: true,
    application_name: "torob-in-store-assistant",
  });
}

export function getPool(): Pool {
  if (!globalForDb.torobPool) {
    globalForDb.torobPool = createPool();
  }
  return globalForDb.torobPool;
}

export function getDb(): NodePgDatabase<typeof schema> {
  if (!globalForDb.torobDb) {
    globalForDb.torobDb = drizzle(getPool(), { schema });
  }
  return globalForDb.torobDb;
}

export async function closeDb(): Promise<void> {
  const pool = globalForDb.torobPool;
  globalForDb.torobPool = undefined;
  globalForDb.torobDb = undefined;
  if (pool) await pool.end();
}

function describeError(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    return `connection failed (${String((error as { code: unknown }).code)})`;
  }
  return "connection failed";
}

export async function checkDatabase(): Promise<DbCheck> {
  if (!process.env.DATABASE_URL?.trim()) {
    return { status: "not_configured" };
  }

  const startedAt = Date.now();
  try {
    await getPool().query("select 1");
    return { status: "up", latencyMs: Date.now() - startedAt };
  } catch (error) {
    return {
      status: "down",
      latencyMs: Date.now() - startedAt,
      error: describeError(error),
    };
  }
}
