import { z } from "zod";
import type { JsonRecord, LlmClient } from "./client";

export type ToolOutcome = {
  ok: boolean;
  detail: string;
};

const pingArgsSchema = z.object({ message: z.string().min(1) });

export async function checkToolCalling(
  client: LlmClient,
  base: string,
  model: string,
): Promise<ToolOutcome> {
  const result = await client.chat(
    base,
    model,
    [
      {
        role: "user",
        content:
          "برای تست، تابع ping را دقیقاً یک بار با message برابر «سلام» صدا بزن. هیچ متن دیگری ننویس.",
      },
    ],
    96,
    {
      stream: false,
      reasoning_effort: "none",
      tools: [
        {
          type: "function",
          function: {
            name: "ping",
            description: "Echo a short Persian message back to the caller.",
            parameters: {
              type: "object",
              properties: {
                message: { type: "string", description: "Short message text." },
              },
              required: ["message"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "ping" } },
    },
  );

  if (!result.ok || !result.json) {
    return {
      ok: false,
      detail: `HTTP ${result.status}: ${client.short(result.text)}`,
    };
  }

  const choices = result.json.choices as JsonRecord[] | undefined;
  const message = choices?.[0]?.message as JsonRecord | undefined;
  const toolCalls = message?.tool_calls as JsonRecord[] | undefined;
  const fn = toolCalls?.[0]?.function as JsonRecord | undefined;
  const rawArgs = fn?.arguments;

  if (typeof rawArgs !== "string") {
    return {
      ok: false,
      detail: `no tool_calls in response: ${client.short(client.firstContent(result.json), 80)}`,
    };
  }

  try {
    const parsed = pingArgsSchema.safeParse(JSON.parse(rawArgs));
    const ok = parsed.success && fn?.name === "ping";
    return {
      ok,
      detail: ok
        ? `tool_calls[0].function=${String(fn?.name)}, args=${client.short(rawArgs, 80)}`
        : `name=${String(fn?.name)}, invalid args=${client.short(rawArgs, 80)}`,
    };
  } catch {
    return {
      ok: false,
      detail: `arguments are not valid JSON: ${client.short(rawArgs, 80)}`,
    };
  }
}
