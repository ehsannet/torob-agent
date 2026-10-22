import { runAgent } from "../src/agent/run-agent";
import type { AgentResult, AgentStreamEvent } from "../src/lib/agent-types";

async function execute(message: string) {
  const events: AgentStreamEvent[] = [];
  let result: AgentResult | null = null;
  let text = "";

  for await (const event of runAgent({
    message,
    context: {
      district: "vanak",
      lat: null,
      lng: null,
      radiusKm: 5,
    },
  })) {
    events.push(event);
    if (event.type === "delta") text += event.text;
    if (event.type === "result") result = event.result;
    if (event.type === "error") console.error("agent error", event.message);
  }

  return {
    eventTypes: events.map((event) => event.type),
    mode: result?.mode,
    totalGroups: result?.totalGroups,
    products: result?.products.slice(0, 2).map((product) => ({
      id: product.id,
      title: product.titleFa,
      priceMin: product.priceMin,
      shops: product.shopCount,
    })),
    recommendation: result?.recommendation,
    text: text.trim(),
  };
}

async function main() {
  const first = await execute(
    "یه گوشی آیفون ۱۵ تا ۴۵ میلیون در ونک می‌خوام",
  );
  console.log("first", JSON.stringify(first, null, 2));

  const second = await execute(
    "یه گوشی آیفون ۱۵ تا ۴۵ میلیون در ونک می‌خوام",
  );
  console.log(
    "second",
    JSON.stringify(
      {
        eventTypes: second.eventTypes,
        mode: second.mode,
        totalGroups: second.totalGroups,
      },
      null,
      2,
    ),
  );
}

void main();
