import { stepCountIs, streamText } from "ai";
import type { LanguageModelUsage } from "ai";
import type {
  AgentContext,
  AgentMode,
  AgentRequest,
  AgentStreamEvent,
} from "@/lib/agent-types";
import { contextToBaseFilters } from "./filters";
import { parseRequestFilters } from "./tools/parse-request";
import { fallbackText, runFallback } from "./fallback";
import { agentCacheKey } from "./cache-key";
import { agentCache } from "./reply-cache";
import {
  AGENT_PROVIDER_NAME,
  getAgentConfig,
  getAgentModel,
} from "./config";
import { buildSystemPrompt, buildUserPrompt } from "./prompt";
import {
  createAgentTools,
  type AgentToolContext,
} from "./tools";
import { pickResult, usageFromModel, withFallbackMode } from "./run-agent-result";
import {
  agentQueue,
  QueueTimeoutError,
  type QueueOutcome,
  type QueueRelease,
} from "./queue";
import { agentUsage } from "./usage";

export async function* runAgent(
  request: AgentRequest,
  signal?: AbortSignal,
): AsyncGenerator<AgentStreamEvent> {
  const message = request.message.trim();
  const context: AgentContext | undefined = request.context;
  const cacheKey = agentCacheKey(message, context);
  const cached = agentCache.get(cacheKey);

  if (cached) {
    agentUsage.recordCacheHit();
    yield {
      type: "result",
      result: { ...cached.result, mode: "cache" },
    };
    yield { type: "delta", text: cached.content };
    yield { type: "usage", usage: agentUsage.snapshot(agentQueue.snapshot()) };
    yield { type: "done", mode: "cache" };
    return;
  }

  yield {
    type: "status",
    stage: "queued",
    message: "درخواست در صف دستیار قرار گرفت…",
  };

  const config = getAgentConfig();
  let release: QueueRelease | null = null;
  let outcome: QueueOutcome = "error";

  try {
    release = await agentQueue.acquire(config.queueWaitTimeoutMs);
  } catch (error) {
    if (error instanceof QueueTimeoutError) {
      yield {
        type: "error",
        message: "دستیار شلوغ است؛ چند لحظه بعد دوباره تلاش کن.",
      };
      return;
    }
    yield { type: "error", message: "شروع پردازش دستیار ممکن نشد." };
    return;
  }

  try {
    if (signal?.aborted) return;

    if (agentUsage.isBudgetExhausted(config.budgetUsd)) {
      const fallback = await runFallback(
        message,
        context,
        "سهمیهٔ هزینهٔ دستیار تمام شده است؛ نتایج با جست‌وجوی مستقیم نمایش داده شد.",
      );
      yield { type: "result", result: fallback.result };
      yield { type: "delta", text: fallback.text };
      yield { type: "usage", usage: agentUsage.snapshot(agentQueue.snapshot()) };
      yield { type: "done", mode: "fallback" };
      outcome = "ok";
      return;
    }

    const model = getAgentModel();
    if (!model) {
      const fallback = await runFallback(
        message,
        context,
        "سرویس هوش مصنوعی تنظیم نشده است؛ نتایج با جست‌وجوی مستقیم نمایش داده شد.",
      );
      yield { type: "result", result: fallback.result };
      yield { type: "delta", text: fallback.text };
      yield { type: "usage", usage: agentUsage.snapshot(agentQueue.snapshot()) };
      yield { type: "done", mode: "fallback" };
      outcome = "ok";
      return;
    }

    yield {
      type: "status",
      stage: "thinking",
      message: "دستیار درخواست را می‌فهمد…",
    };

    const baseFilters = contextToBaseFilters(context);
    const toolContext: AgentToolContext = {
      baseFilters,
      hints: parseRequestFilters(message, context),
      shops: [],
      sellerChecks: [],
      alternatives: [],
      error: null,
      lastAction: null,
    };
    const tools = createAgentTools(toolContext);
    const started = Date.now();
    let text = "";
    let streamError: unknown = null;
    let modelUsage: LanguageModelUsage | null = null;
    let answeringStatusSent = false;

    const result = streamText({
      model,
      system: buildSystemPrompt(baseFilters),
      prompt: buildUserPrompt(message),
      tools,
      toolChoice: "auto",
      stopWhen: stepCountIs(5),
      toolCallConcurrency: 1,
      prepareStep: () => {
        if (toolContext.search && toolContext.search.result.totalGroups > 0) {
          return {
            activeTools: [
              "compare_products",
              "find_shops",
              "create_seller_check",
              "get_seller_check_status",
              "suggest_alternatives",
            ] as const,
          };
        }
        return undefined;
      },
      maxRetries: 1,
      maxOutputTokens: config.maxOutputTokens,
      abortSignal: signal,
      timeout: {
        totalMs: config.streamTimeoutMs,
        firstChunkMs: 20_000,
      },
      providerOptions: {
        [AGENT_PROVIDER_NAME]: { reasoningEffort: "none" },
      },
    });

    try {
      for await (const part of result.stream) {
        if (signal?.aborted) return;

        if (part.type === "text-delta") {
          const chunk = part.text.replace(/[*`]/g, "");
          if (chunk) {
            if (!answeringStatusSent) {
              answeringStatusSent = true;
              yield {
                type: "status",
                stage: "answering",
                message: "دستیار پاسخ را می‌نویسد…",
              };
            }
            text += chunk;
            yield { type: "delta", text: chunk };
          }
          continue;
        }

        if (part.type === "tool-call") {
          yield {
            type: "status",
            stage: "searching",
            message: "دستیار در فروشگاه‌ها جست‌وجو می‌کند…",
          };
          continue;
        }

        if (part.type === "finish") {
          modelUsage = part.totalUsage;
          continue;
        }

        if (part.type === "error") {
          streamError = part.error;
        }
      }
    } catch (error) {
      streamError = error;
    }

    if (signal?.aborted) return;

    if (!modelUsage) {
      try {
        modelUsage = await result.usage;
      } catch {
        modelUsage = null;
      }
    }

    if (modelUsage) {
      agentUsage.recordCall({
        modelId: config.modelId,
        usage: usageFromModel(modelUsage),
        latencyMs: Date.now() - started,
      });
    }

    const tookMs = Date.now() - started;

    if (streamError) {
      agentUsage.recordFailure();
    }

    let agentResult = pickResult(toolContext, tookMs);
    let mode: AgentMode = "llm";
    let fallbackReason: string | undefined;

    if (streamError) {
      fallbackReason =
        "ارتباط با دستیار کامل نشد؛ نتایج با داده‌های ثبت‌شده نمایش داده شد.";
      if (agentResult) {
        agentResult = withFallbackMode(agentResult, fallbackReason);
        text = fallbackText(agentResult, fallbackReason);
        mode = "fallback";
      } else {
        const fallback = await runFallback(message, context, fallbackReason);
        agentResult = fallback.result;
        text = fallback.text;
        mode = "fallback";
      }
    } else if (!agentResult) {
      fallbackReason =
        "دستیار داده‌ای از فروشگاه‌ها برنگرداند؛ جست‌وجوی مستقیم انجام شد.";
      const fallback = await runFallback(message, context, fallbackReason);
      agentResult = fallback.result;
      text = fallback.text;
      mode = "fallback";
    } else if (!text.trim()) {
      fallbackReason =
        "پاسخ متنی مدل خالی بود؛ خلاصهٔ داده‌ها نمایش داده شد.";
      agentResult = withFallbackMode(agentResult, fallbackReason);
      text = fallbackText(agentResult, fallbackReason);
      mode = "fallback";
    }

    if (!agentResult) {
      yield {
        type: "error",
        message: "پاسخ دستیار آماده نشد؛ دوباره تلاش کن.",
      };
      return;
    }

    if (
      mode === "llm" &&
      (agentResult.sellerChecks?.length ?? 0) === 0 &&
      (agentResult.alternatives?.length ?? 0) === 0
    ) {
      agentCache.set(cacheKey, {
        result: agentResult,
        content: text,
      });
    }

    yield {
      type: "status",
      stage: "done",
      message: "پاسخ آماده است.",
    };
    yield { type: "result", result: agentResult };
    if (mode !== "llm") {
      yield { type: "delta", text };
    }
    yield { type: "usage", usage: agentUsage.snapshot(agentQueue.snapshot()) };
    yield { type: "done", mode: mode === "llm" ? "llm" : "fallback" };
    outcome = "ok";
  } finally {
    release?.(outcome);
  }
}
