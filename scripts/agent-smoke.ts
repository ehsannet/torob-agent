import { stepCountIs, streamText, tool } from "ai";
import { z } from "zod";
import {
  AGENT_PROVIDER_NAME,
  getAgentConfig,
  getAgentModel,
} from "../src/agent/config";

async function main() {
  const model = getAgentModel();
  const config = getAgentConfig();

  if (!model) {
    console.error("LLM is not configured");
    process.exit(1);
  }

  const lookup = tool({
    description: "Return a fixed price for a product.",
    inputSchema: z.object({ product: z.string() }),
    execute: async ({ product }) => ({ product, priceToman: 42_000_000 }),
  });

  const started = Date.now();
  const result = streamText({
    model,
    system: "برای هر سؤال قیمت، ابزار lookup_price را صدا بزن و فقط قیمت را بگو.",
    prompt: "قیمت گوشی تست را بپرس.",
    tools: { lookup_price: lookup },
    toolChoice: "auto",
    stopWhen: stepCountIs(3),
    maxRetries: 1,
    maxOutputTokens: 120,
    providerOptions: {
      [AGENT_PROVIDER_NAME]: { reasoningEffort: "none" },
    },
  });

  const toolCalls: string[] = [];
  const textParts: string[] = [];
  let usage: unknown = null;

  try {
    for await (const part of result.stream) {
      if (part.type === "tool-call") toolCalls.push(String(part.toolName));
      if (part.type === "text-delta") textParts.push(part.text);
      if (part.type === "finish") usage = part.totalUsage;
      if (part.type === "error") {
        console.error(
          "stream error",
          part.error instanceof Error ? part.error.name : "unknown",
        );
      }
    }
  } catch (error) {
    console.error("failed", error instanceof Error ? error.name : "unknown");
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        model: config.modelId,
        baseUrl: config.baseUrl,
        toolCalls,
        text: textParts.join(""),
        usage,
        latencyMs: Date.now() - started,
      },
      null,
      2,
    ),
  );
}

void main();
