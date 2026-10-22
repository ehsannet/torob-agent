import { agentQueue } from "@/agent/queue";
import { agentUsage } from "@/agent/usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(): Response {
  return Response.json(
    { usage: agentUsage.snapshot(agentQueue.snapshot()) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
