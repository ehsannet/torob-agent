import { Pool } from "pg";

export type DbCheck =
  | { status: "up"; latencyMs: number }
  | { status: "down"; latencyMs: number; error: string }
  | { status: "not_configured" };

const globalForDb = globalThis as unknown as { torobPool?: Pool };

function createPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    connectionTimeoutMillis: 2_500,
    query_timeout: 2_500,
    idleTimeoutMillis: 10_000,
    allowExitOnIdle: true,
    application_name: "torob-in-store-assistant",
  });
}

function getPool(): Pool {
  if (!globalForDb.torobPool) {
    globalForDb.torobPool = createPool();
  }
  return globalForDb.torobPool;
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
