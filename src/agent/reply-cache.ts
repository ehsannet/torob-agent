import type { AgentResult } from "@/lib/agent-types";
import { TtlCache } from "./cache";

export type CachedReply = {
  result: AgentResult;
  content: string;
};

const globalForCache = globalThis as unknown as {
  __torobAgentCache?: TtlCache<CachedReply>;
};

export const agentCache =
  globalForCache.__torobAgentCache ??
  new TtlCache<CachedReply>(30 * 60 * 1000, 100);

globalForCache.__torobAgentCache = agentCache;
