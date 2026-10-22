import type {
  AgentQueueSnapshot,
  AgentUsageSnapshot,
} from "@/lib/agent-types";
import { getAgentConfig } from "./config";

type CallUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};

export type UsageCall = {
  modelId: string;
  usage: CallUsage;
  latencyMs: number;
};

export class UsageTracker {
  private requests = 0;
  private cachedHits = 0;
  private failures = 0;
  private fallbacks = 0;
  private inputTokens = 0;
  private outputTokens = 0;
  private totalTokens = 0;
  private estimatedCostUsd = 0;

  isBudgetExhausted(budgetUsd: number): boolean {
    return this.estimatedCostUsd >= budgetUsd;
  }

  recordCacheHit(): void {
    this.cachedHits += 1;
  }

  recordFailure(): void {
    this.failures += 1;
  }

  recordFallback(): void {
    this.fallbacks += 1;
  }

  recordCall(call: UsageCall): number {
    const config = getAgentConfig();
    const input = call.usage.inputTokens ?? 0;
    const output = call.usage.outputTokens ?? 0;
    const total =
      call.usage.totalTokens ?? input + output;

    const cost =
      (input / 1_000_000) * config.inputPricePerMillion +
      (output / 1_000_000) * config.outputPricePerMillion;

    this.requests += 1;
    this.inputTokens += input;
    this.outputTokens += output;
    this.totalTokens += total;
    this.estimatedCostUsd += cost;

    console.info(
      "[llm]",
      JSON.stringify({
        model: call.modelId,
        inputTokens: input,
        outputTokens: output,
        totalTokens: total,
        estimatedCostUsd: Number(cost.toFixed(6)),
        latencyMs: call.latencyMs,
      }),
    );

    return cost;
  }

  snapshot(
    queue: AgentQueueSnapshot,
    budgetUsd = getAgentConfig().budgetUsd,
  ): AgentUsageSnapshot {
    return {
      requests: this.requests,
      cachedHits: this.cachedHits,
      failures: this.failures,
      fallbacks: this.fallbacks,
      inputTokens: this.inputTokens,
      outputTokens: this.outputTokens,
      totalTokens: this.totalTokens,
      estimatedCostUsd: Number(this.estimatedCostUsd.toFixed(6)),
      budgetUsd,
      remainingUsd: Math.max(
        0,
        Number((budgetUsd - this.estimatedCostUsd).toFixed(6)),
      ),
      queue,
    };
  }
}

const globalForUsage = globalThis as unknown as {
  __torobAgentUsage?: UsageTracker;
};

export const agentUsage =
  globalForUsage.__torobAgentUsage ?? new UsageTracker();

globalForUsage.__torobAgentUsage = agentUsage;
