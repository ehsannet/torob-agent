import type { JsonRecord, LlmClient } from "./client";

export type StreamOutcome = {
  ok: boolean;
  detail: string;
  tokens: number;
};

export async function checkStreaming(
  client: LlmClient,
  base: string,
  model: string,
): Promise<StreamOutcome> {
  const startedAt = Date.now();
  const messages: JsonRecord[] = [
    { role: "user", content: "Count from 1 to 5." },
  ];

  function bodyWith(param: string): JsonRecord {
    return {
      model,
      messages,
      [param]: 32,
      stream: true,
      stream_options: { include_usage: true },
      reasoning_effort: "none",
    };
  }

  async function post(body: JsonRecord): Promise<Response> {
    return fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${client.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    });
  }

  let response = await post(bodyWith(client.tokenParam));

  if (!response.ok) {
    const errorText = await response.text();
    const alternate =
      client.tokenParam === "max_tokens"
        ? "max_completion_tokens"
        : "max_tokens";

    if (
      response.status === 400 &&
      /max_tokens|max_completion_tokens/i.test(errorText)
    ) {
      response = await post(bodyWith(alternate));
      if (response.ok) {
        client.tokenParam = alternate;
      } else {
        return {
          ok: false,
          detail: `HTTP ${response.status}: ${client.short(await response.text())}`,
          tokens: 0,
        };
      }
    } else {
      return {
        ok: false,
        detail: `HTTP ${response.status}: ${client.short(errorText)}`,
        tokens: 0,
      };
    }
  }

  if (!response.body) {
    return { ok: false, detail: "response has no body", tokens: 0 };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let streamedText = "";
  let streamChunks = 0;
  let tokens = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;

      try {
        const chunk = JSON.parse(payload) as JsonRecord;
        const choice = (chunk.choices as JsonRecord[] | undefined)?.[0];
        const delta = choice?.delta as JsonRecord | undefined;
        if (typeof delta?.content === "string") {
          streamedText += delta.content;
          streamChunks += 1;
        }
        tokens += client.usageTokens(chunk);
      } catch {
        continue;
      }
    }
  }

  if (streamChunks === 0) {
    return { ok: false, detail: "no content chunks received", tokens };
  }

  return {
    ok: true,
    detail: `${streamChunks} chunks, content=${JSON.stringify(client.short(streamedText, 60))}, ${Date.now() - startedAt}ms`,
    tokens,
  };
}
