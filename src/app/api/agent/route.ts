import { z } from "zod";
import { runAgent } from "@/agent/run-agent";
import type {
  AgentContext,
  AgentRequest,
  AgentStreamEvent,
} from "@/lib/agent-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const contextSchema = z
  .object({
    district: z.string().max(60).nullable().optional(),
    lat: z.number().min(-90).max(90).nullable().optional(),
    lng: z.number().min(-180).max(180).nullable().optional(),
    radiusKm: z.number().min(0.5).max(30).optional(),
  })
  .optional();

const historySchema = z
  .array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1).max(500),
    }),
  )
  .max(6)
  .optional();

const requestSchema = z.object({
  message: z.string().trim().min(1).max(500),
  context: contextSchema,
  history: historySchema,
});

function normalizeContext(
  context: z.infer<typeof contextSchema>,
): AgentContext | undefined {
  if (!context) return undefined;
  const hasLocation =
    typeof context.lat === "number" &&
    typeof context.lng === "number" &&
    Number.isFinite(context.lat) &&
    Number.isFinite(context.lng);

  return {
    district: context.district ?? null,
    lat: hasLocation ? context.lat! : null,
    lng: hasLocation ? context.lng! : null,
    radiusKm: context.radiusKm ?? 5,
  };
}

function errorEvent(message: string): AgentStreamEvent {
  return { type: "error", message };
}

export async function POST(request: Request): Promise<Response> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { error: "بدنهٔ درخواست معتبر نیست." },
      { status: 400 },
    );
  }

  const parsed = requestSchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json(
      { error: "پیام باید بین ۱ تا ۵۰۰ نویسه باشد." },
      { status: 400 },
    );
  }

  const agentRequest: AgentRequest = {
    message: parsed.data.message,
    context: normalizeContext(parsed.data.context),
    history: parsed.data.history,
  };

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: AgentStreamEvent) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      try {
        for await (const event of runAgent(agentRequest, request.signal)) {
          send(event);
        }
      } catch (error) {
        console.error(
          "[agent] stream failed",
          error instanceof Error ? error.name : "unknown",
        );
        send(
          errorEvent(
            "پردازش دستیار با خطا متوقف شد. جست‌وجوی معمولی همچنان در دسترس است.",
          ),
        );
      } finally {
        closed = true;
        try {
          controller.close();
        } catch {
          closed = true;
        }
      }
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
