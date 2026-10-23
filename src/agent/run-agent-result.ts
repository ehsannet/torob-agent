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
  let result: AgentResult | null = null;

  if (toolContext.lastAction === "compare" && toolContext.compare) {
    result = toAgentCompareResult(
      toolContext.compare.result,
      toolContext.compare.filters,
      "llm",
      tookMs,
    );
  } else if (toolContext.search) {
    result = toAgentSearchResult(
      toolContext.search.result,
      "llm",
      tookMs,
      undefined,
      toolContext.shops,
    );
  } else if (toolContext.compare) {
    result = toAgentCompareResult(
      toolContext.compare.result,
      toolContext.compare.filters,
      "llm",
      tookMs,
    );
  }

  if (
    !result &&
    (toolContext.sellerChecks.length > 0 ||
      toolContext.alternatives.length > 0)
  ) {
    result = {
      kind: "seller",
      filters: toolContext.baseFilters,
      products: [],
      shops: [],
      recommendation: null,
      compareIds: [],
      totalGroups: 0,
      totalOffers: 0,
      mode: "llm",
      tookMs,
    };
  }

  if (
    !result &&
    toolContext.visitPlans.length > 0
  ) {
    result = {
      kind: "visit",
      filters: toolContext.baseFilters,
      products: [],
      shops: [],
      recommendation: null,
      compareIds: [],
      totalGroups: 0,
      totalOffers: 0,
      mode: "llm",
      tookMs,
    };
  }

  if (!result) return null;
  return {
    ...result,
    sellerChecks:
      toolContext.sellerChecks.length > 0
        ? toolContext.sellerChecks
        : undefined,
    alternatives:
      toolContext.alternatives.length > 0
        ? toolContext.alternatives
        : undefined,
    visitPlans:
      toolContext.visitPlans.length > 0
        ? toolContext.visitPlans
        : undefined,
  };
}

export function withFallbackMode(
  result: AgentResult,
  reason: string,
): AgentResult {
  return { ...result, mode: "fallback", fallbackReason: reason };
}
