export type JsonRecord = Record<string, unknown>;

export type HttpResult = {
  ok: boolean;
  status: number;
  json: JsonRecord | null;
  text: string;
  latencyMs: number;
};

export type TokenParam = "max_tokens" | "max_completion_tokens";

export class LlmClient {
  readonly apiKey: string;
  readonly rawBaseUrl: string;
  readonly primaryModel: string;

  tokenParam: TokenParam = "max_tokens";
  totalTokens = 0;

  constructor(apiKey: string, rawBaseUrl: string, primaryModel: string) {
    this.apiKey = apiKey;
    this.rawBaseUrl = rawBaseUrl;
    this.primaryModel = primaryModel;
  }

  redact(value: string): string {
    let output = value;
    if (this.apiKey) output = output.split(this.apiKey).join("[REDACTED]");
    return output.replace(/sk-[A-Za-z0-9_-]{12,}/g, "[REDACTED_KEY]");
  }

  short(value: unknown, max = 240): string {
    const text = typeof value === "string" ? value : JSON.stringify(value);
    const clean = this.redact(text ?? "").replace(/\s+/g, " ").trim();
    return clean.length > max ? `${clean.slice(0, max)}…` : clean;
  }

  bases(): string[] {
    let base = this.rawBaseUrl.replace(/\/+$/, "");
    const set = new Set<string>([base]);

    if (/\/chat\/completions$/.test(base)) {
      base = base.replace(/\/chat\/completions$/, "");
      set.add(base);
    }

    if (!/\/v1(\/|$)/.test(base)) {
      set.add(`${base}/v1`);
    }

    return [...set];
  }

  usageTokens(json: JsonRecord | null): number {
    const usage = json?.usage as JsonRecord | undefined;
    const total = Number(usage?.total_tokens ?? 0);
    if (Number.isFinite(total) && total > 0) return total;
    const prompt = Number(usage?.prompt_tokens ?? 0);
    const completion = Number(usage?.completion_tokens ?? 0);
    return Number.isFinite(prompt + completion) ? prompt + completion : 0;
  }

  firstContent(json: JsonRecord | null): string {
    const choices = json?.choices as JsonRecord[] | undefined;
    const message = choices?.[0]?.message as JsonRecord | undefined;
    const content = message?.content;
    return typeof content === "string" ? content.trim() : "";
  }

  async request(
    url: string,
    init: { method: "GET" | "POST"; body?: unknown },
  ): Promise<HttpResult> {
    const startedAt = Date.now();
    try {
      const response = await fetch(url, {
        method: init.method,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          ...(init.body === undefined
            ? {}
            : { "Content-Type": "application/json" }),
        },
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
        signal: AbortSignal.timeout(60_000),
        cache: "no-store",
      });

      const text = await response.text();
      let json: JsonRecord | null = null;
      try {
        json = JSON.parse(text) as JsonRecord;
      } catch {
        json = null;
      }

      return {
        ok: response.ok,
        status: response.status,
        json,
        text: this.redact(text),
        latencyMs: Date.now() - startedAt,
      };
    } catch (error) {
      return {
        ok: false,
        status: 0,
        json: null,
        text: this.redact(
          error instanceof Error ? error.message : String(error),
        ),
        latencyMs: Date.now() - startedAt,
      };
    }
  }

  async chat(
    base: string,
    model: string,
    messages: JsonRecord[],
    maxTokens: number,
    extra: JsonRecord = {},
  ): Promise<HttpResult> {
    const baseBody: JsonRecord = {
      model,
      messages,
      [this.tokenParam]: maxTokens,
      ...extra,
    };

    let result = await this.request(`${base}/chat/completions`, {
      method: "POST",
      body: baseBody,
    });

    if (
      !result.ok &&
      result.status === 400 &&
      /max_tokens|max_completion_tokens/i.test(result.text)
    ) {
      const alternate =
        this.tokenParam === "max_tokens"
          ? "max_completion_tokens"
          : "max_tokens";
      const retryBody = { ...baseBody, [alternate]: maxTokens };
      delete retryBody[this.tokenParam];
      result = await this.request(`${base}/chat/completions`, {
        method: "POST",
        body: retryBody,
      });
      if (result.ok) this.tokenParam = alternate;
    }

    this.totalTokens += this.usageTokens(result.json);
    return result;
  }

  async discoverModels(base: string): Promise<string[] | null> {
    const result = await this.request(`${base}/models`, { method: "GET" });
    if (!result.ok || !result.json) return null;
    const data = result.json.data;
    if (!Array.isArray(data)) return null;
    return data
      .map((item) => (item as JsonRecord | null)?.id)
      .filter((id): id is string => typeof id === "string");
  }
}
