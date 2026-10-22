import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createSellerChecks,
  listSellerChecks,
} from "@/server/seller/checks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  offerIds: z
    .array(z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/))
    .min(1)
    .max(5),
  sessionId: z
    .string()
    .regex(/^[a-zA-Z0-9_-]{8,80}$/)
    .optional(),
});

const sessionSchema = z.string().regex(/^[a-zA-Z0-9_-]{8,80}$/);

export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "بدنهٔ درخواست معتبر نیست." },
      { status: 400 },
    );
  }
  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "بین ۱ تا ۵ آفر معتبر انتخاب کن." },
      { status: 400 },
    );
  }

  try {
    const result = await createSellerChecks(
      parsed.data.offerIds,
      parsed.data.sessionId,
    );
    return NextResponse.json(result, {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "no_offers_found" || code === "offer_ids_required") {
      return NextResponse.json(
        { error: "آفرهای انتخاب‌شده پیدا نشدند." },
        { status: 404 },
      );
    }
    console.error("Create seller check failed", error);
    return NextResponse.json(
      { error: "ساخت درخواست تأیید فروشنده ممکن نشد." },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const parsed = sessionSchema.safeParse(
    request.nextUrl.searchParams.get("sessionId") ?? "",
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "شناسهٔ نشست معتبر نیست." },
      { status: 400 },
    );
  }
  try {
    const checks = await listSellerChecks(parsed.data);
    return NextResponse.json(
      { checks },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("List seller checks failed", error);
    return NextResponse.json(
      { error: "دریافت وضعیت درخواست‌ها ممکن نشد." },
      { status: 500 },
    );
  }
}
