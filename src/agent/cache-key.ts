import { createHash } from "node:crypto";
import { normalizePersian } from "@/lib/persian";
import type { AgentContext } from "@/lib/agent-types";

export function agentCacheKey(
  message: string,
  context?: AgentContext,
): string {
  const payload = JSON.stringify({
    message: normalizePersian(message),
    district: context?.district ?? null,
    lat: context?.lat ?? null,
    lng: context?.lng ?? null,
    radiusKm: context?.radiusKm ?? null,
  });
  return createHash("sha256").update(payload).digest("hex");
}
