import { LlmClient, type JsonRecord } from "./smoke/client";
import { checkStreaming } from "./smoke/stream";
import { checkToolCalling } from "./smoke/tool-call";

type CheckStatus = "PASS" | "FAIL" | "INFO";

type Check = {
  name: string;
  status: CheckStatus;
  detail: string;
};

const checks: Check[] = [];

function record(name: string, status: CheckStatus, detail: string) {
  checks.push({ name, status, detail });
  const icon = status === "PASS" ? "✓" : status === "FAIL" ? "✗" : "•";
  console.log(`${icon} ${name} — ${detail}`);
}

function printSummary(client: LlmClient) {
  const passed = checks.filter((check) => check.status === "PASS").length;
  const failed = checks.filter((check) => check.status === "FAIL").length;
  const info = checks.filter((check) => check.status === "INFO").length;

  console.log("");
  console.log("=== Summary ===");
  console.log(`${passed} passed, ${failed} failed, ${info} informational`);
  console.log(`Total tokens observed: ${client.totalTokens}`);
  console.log(
    failed === 0
      ? "Core LLM capabilities verified."
      : "Some core capabilities failed; see lines marked ✗ above.",
  );
}

async function main() {
  const apiKey = (process.env.LLM_API_KEY ?? "").trim();
  const rawBaseUrl = (process.env.LLM_BASE_URL ?? "").trim().replace(/\/+$/, "");
  const primaryModel = (process.env.LLM_MODEL ?? "gpt-6-luna").trim();
  const client = new LlmClient(apiKey, rawBaseUrl, primaryModel);

  console.log("=== LLM smoke test ===");
  console.log(`Base URL: ${rawBaseUrl || "(missing)"}`);
  console.log(`Model: ${primaryModel}`);
  console.log(`API key: ${apiKey ? "present (not printed)" : "missing"}`);
  console.log("");

  if (!rawBaseUrl || !apiKey) {
    console.log(
      "SKIPPED — LLM_BASE_URL and LLM_API_KEY are required. Fill .env, then run `npm run smoke`.",
    );
    process.exitCode = 2;
    return;
  }

  const bases = client.bases();
  let availableModels: string[] = [];
  let modelsBase: string | null = null;

  for (const base of bases) {
    const models = await client.discoverModels(base);
    if (models) {
      modelsBase = base;
      availableModels = models;
      record(
        "models endpoint",
        "PASS",
        `${models.length} models via GET ${base}/models`,
      );
      break;
    }
  }

  if (!modelsBase) {
    record(
      "models endpoint",
      "INFO",
      "not available; continuing with chat completions",
    );
  }

  const modelCandidates = [
    primaryModel,
    primaryModel.startsWith("openai/")
      ? primaryModel.replace(/^openai\//, "")
      : `openai/${primaryModel}`,
  ].filter((value, index, all) => value && all.indexOf(value) === index);

  if (availableModels.length > 0) {
    modelCandidates.sort((a, b) => {
      const aKnown = availableModels.includes(a) ? 0 : 1;
      const bKnown = availableModels.includes(b) ? 0 : 1;
      return aKnown - bKnown;
    });
    const known = modelCandidates.filter((id) => availableModels.includes(id));
    record(
      "model ID format",
      known.length > 0 ? "PASS" : "INFO",
      known.length > 0
        ? `accepted by /models: ${known.join(", ")}`
        : `no candidate found in /models; will try ${modelCandidates.join(", ")}`,
    );
  }

  const pingMessages: JsonRecord[] = [
    { role: "user", content: "Reply with exactly: OK" },
  ];
  let chatBase: string | null = null;
  let chatModel: string | null = null;
  let plainChat: Awaited<ReturnType<typeof client.chat>> | null = null;

  for (const base of bases) {
    for (const candidate of modelCandidates) {
      const result = await client.chat(base, candidate, pingMessages, 8, {
        stream: false,
        reasoning_effort: "none",
      });
      if (result.ok) {
        chatBase = base;
        chatModel = candidate;
        plainChat = result;
        break;
      }
      if (result.status === 401 || result.status === 403) {
        record(
          "authentication",
          "FAIL",
          `HTTP ${result.status}: ${client.short(result.text)}`,
        );
        process.exitCode = 1;
        return;
      }
    }
    if (chatModel) break;
  }

  if (!chatBase || !chatModel || !plainChat) {
    record(
      "plain chat",
      "FAIL",
      "no base URL + model ID combination accepted a minimal chat completion",
    );
    printSummary(client);
    process.exitCode = 1;
    return;
  }

  const content = client.firstContent(plainChat.json);
  record(
    "plain chat",
    content ? "PASS" : "FAIL",
    `HTTP ${plainChat.status} in ${plainChat.latencyMs}ms, content=${JSON.stringify(client.short(content, 40))}`,
  );
  record(
    "chat endpoint",
    "PASS",
    `${chatBase}/chat/completions with model "${chatModel}"`,
  );
  if (modelsBase && modelsBase !== chatBase) {
    record("models base", "INFO", `models on ${modelsBase}, chat on ${chatBase}`);
  }

  const persian = await client.chat(
    chatBase,
    chatModel,
    [
      {
        role: "user",
        content: "در یک جملهٔ کوتاه فارسی بگو امروز هوا چطور است.",
      },
    ],
    64,
    { stream: false, reasoning_effort: "none" },
  );
  const persianText = client.firstContent(persian.json);
  record(
    "Persian prompt",
    persian.ok && persianText.length > 0 ? "PASS" : "FAIL",
    persian.ok
      ? `content=${JSON.stringify(client.short(persianText, 80))}`
      : `HTTP ${persian.status}: ${client.short(persian.text)}`,
  );

  const stream = await checkStreaming(client, chatBase, chatModel);
  client.totalTokens += stream.tokens;
  record("streaming", stream.ok ? "PASS" : "FAIL", stream.detail);

  const tools = await checkToolCalling(client, chatBase, chatModel);
  record("tool calling", tools.ok ? "PASS" : "FAIL", tools.detail);

  let reasoningDetail = "";
  let reasoningOk = false;
  for (const variant of [
    { label: "reasoning_effort=low", extra: { reasoning_effort: "low" } },
    { label: "reasoning.effort=low", extra: { reasoning: { effort: "low" } } },
  ]) {
    const result = await client.chat(chatBase, chatModel, pingMessages, 8, {
      stream: false,
      ...variant.extra,
    });
    if (result.ok) {
      reasoningOk = true;
      reasoningDetail = `accepted ${variant.label}`;
      break;
    }
    reasoningDetail = `rejected ${variant.label} (HTTP ${result.status}): ${client.short(result.text, 160)}`;
  }
  record("reasoning effort", reasoningOk ? "PASS" : "INFO", reasoningDetail);

  const responses = await client.request(`${chatBase}/responses`, {
    method: "POST",
    body: {
      model: chatModel,
      input: "Reply with exactly: OK",
      max_output_tokens: 16,
    },
  });
  if (responses.ok) {
    client.totalTokens += client.usageTokens(responses.json);
    record(
      "/responses endpoint",
      "PASS",
      `HTTP ${responses.status} in ${responses.latencyMs}ms`,
    );
  } else {
    record(
      "/responses endpoint",
      "INFO",
      `HTTP ${responses.status}: ${client.short(responses.text, 160)}`,
    );
  }

  printSummary(client);
  process.exitCode = checks.some((check) => check.status === "FAIL") ? 1 : 0;
}

main().catch((error) => {
  console.error(
    `Smoke test crashed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
