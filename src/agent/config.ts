import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";

export const AGENT_PROVIDER_NAME = "boxapi";
export const AGENT_PROMPT_VERSION = "phase3-v1";

const DEFAULT_MODEL = "openai/gpt-6-luna";
const DEFAULT_INPUT_PRICE = 0.12;
const DEFAULT_OUTPUT_PRICE = 0.58;
const DEFAULT_BUDGET = 3;

export type AgentConfig = {
  configured: boolean;
  baseUrl: string;
  modelId: string;
  inputPricePerMillion: number;
  outputPricePerMillion: number;
  budgetUsd: number;
  maxOutputTokens: number;
  queueWaitTimeoutMs: number;
  streamTimeoutMs: number;
};

function readNumber(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

export function getAgentConfig(): AgentConfig {
  const baseUrl = (process.env.LLM_BASE_URL ?? "").trim().replace(/\/+$/, "");
  const apiKey = (process.env.LLM_API_KEY ?? "").trim();
  const modelId = (process.env.LLM_MODEL ?? DEFAULT_MODEL).trim();

  return {
    configured: Boolean(baseUrl && apiKey && modelId),
    baseUrl,
    modelId,
    inputPricePerMillion: readNumber(
      "LLM_INPUT_PRICE_PER_MILLION",
      DEFAULT_INPUT_PRICE,
    ),
    outputPricePerMillion: readNumber(
      "LLM_OUTPUT_PRICE_PER_MILLION",
      DEFAULT_OUTPUT_PRICE,
    ),
    budgetUsd: readNumber("LLM_BUDGET_USD", DEFAULT_BUDGET),
    maxOutputTokens: 450,
    queueWaitTimeoutMs: 15_000,
    streamTimeoutMs: 60_000,
  };
}

type ModelCache = {
  key: string;
  model: LanguageModel;
};

const globalForModel = globalThis as unknown as {
  __torobAgentModel?: ModelCache;
};

export function getAgentModel(): LanguageModel | null {
  const config = getAgentConfig();
  if (!config.configured) return null;

  const key = `${AGENT_PROMPT_VERSION}|${config.baseUrl}|${config.modelId}`;
  if (globalForModel.__torobAgentModel?.key === key) {
    return globalForModel.__torobAgentModel.model;
  }

  const provider = createOpenAICompatible({
    name: AGENT_PROVIDER_NAME,
    baseURL: config.baseUrl,
    apiKey: process.env.LLM_API_KEY,
    includeUsage: true,
    transformRequestBody: (args) => {
      const { max_tokens: maxTokens, ...rest } = args;
      return maxTokens === undefined
        ? rest
        : { ...rest, max_completion_tokens: maxTokens };
    },
  });

  const model = provider(config.modelId);
  globalForModel.__torobAgentModel = { key, model };
  return model;
}

export function isLlmConfigured(): boolean {
  return getAgentConfig().configured;
}
