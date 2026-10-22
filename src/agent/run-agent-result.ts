import type { LanguageModelUsage } from "ai";
import type { AgentResult } from "@/lib/agent-types";
import { toAgentCompareResult, toAgentSearchResult } from "./compact";
import type { AgentToolContext } from "./tools";

export function usageFromModel(usage: LanguageModelUsage) {
  return {
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    totalTokens: usage.totalTokens,
  };
}

export function pickResult(
  toolContext: AgentToolContext,
  tookMs: number,
): AgentResult | null {
  if (toolContext.lastAction === "compare" && toolContext.compare) {
    return toAgentCompareResult(
      toolContext.compare.result,
      toolContext.compare.filters,
      "llm",
      tookMs,
    );
  }

  if (toolContext.search) {
    return toAgentSearchResult(
      toolContext.search.result,
      "llm",
      tookMs,
      undefined,
      toolContext.shops,
    );
  }

  if (toolContext.compare) {
    return toAgentCompareResult(
      toolContext.compare.result,
      toolContext.compare.filters,
      "llm",
      tookMs,
    );
  }

  return null;
}

export function withFallbackMode(
  result: AgentResult,
  reason: string,
): AgentResult {
  return { ...result, mode: "fallback", fallbackReason: reason };
}
