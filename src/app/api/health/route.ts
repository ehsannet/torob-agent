import { NextResponse } from "next/server";
import { checkDatabase } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  const db = await checkDatabase();

  return NextResponse.json(
    {
      status: db.status === "up" ? "ok" : "degraded",
      app: "torob-in-store-assistant",
      phase: 1,
      db,
      timestamp: new Date().toISOString(),
      responseTimeMs: Date.now() - startedAt,
      uptimeSeconds: Math.round(process.uptime()),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
