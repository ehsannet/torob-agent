import { NextResponse } from "next/server";
import { z } from "zod";
import { respondToSellerCheck } from "@/server/seller/checks";
import { isSellerToken } from "@/server/seller/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const responseSchema = z
  .object({
    stockStatus: z.enum(["in_stock", "out_of_stock"]),
    confirmedPriceToman: z.number().int().min(0).max(2_000_000_000).nullish(),
    hoursConfirmed: z.boolean().optional(),
    warrantyConfirmed: z.boolean().optional(),
    note: z.string().trim().max(300).nullish(),
  })
  .refine(
    (value) =>
      value.stockStatus === "out_of_stock" ||
      value.confirmedPriceToman === undefined ||
      value.confirmedPriceToman === null ||
      value.confirmedPriceToman > 0,
    { message: "قیمت تأییدشده باید بزرگ‌تر از صفر باشد." },
  );

type Context = { params: Promise<{ token: string }> };

export async function POST(request: Request, { params }: Context) {
  const { token } = await params;
  if (!isSellerToken(token)) {
    return NextResponse.json({ error: "لینک معتبر نیست." }, { status: 400 });
  }
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "بدنهٔ درخواست معتبر نیست." },
      { status: 400 },
    );
  }
  const parsed = responseSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "پاسخ معتبر نیست." },
      { status: 400 },
    );
  }

  try {
    const result = await respondToSellerCheck(token, parsed.data);
    if (!result.ok) {
      return NextResponse.json(result, {
        status:
          result.code === "not_found"
            ? 404
            : result.code === "closed"
              ? 409
              : 400,
        headers: { "Cache-Control": "no-store" },
      });
    }
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Submit seller response failed", error);
    return NextResponse.json(
      { error: "ثبت پاسخ فروشنده ممکن نشد." },
      { status: 500 },
    );
  }
}
