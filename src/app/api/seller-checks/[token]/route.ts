import { NextResponse } from "next/server";
import { isSellerToken } from "@/server/seller/tokens";
import { getSellerCheckView } from "@/server/seller/view";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ token: string }> };

export async function GET(request: Request, { params }: Context) {
  const { token } = await params;
  if (!isSellerToken(token)) {
    return NextResponse.json({ error: "لینک معتبر نیست." }, { status: 400 });
  }
  try {
    const check = await getSellerCheckView(token);
    if (!check) {
      return NextResponse.json(
        { error: "درخواست پیدا نشد." },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { check },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Get seller check failed", error);
    return NextResponse.json(
      { error: "دریافت وضعیت درخواست ممکن نشد." },
      { status: 500 },
    );
  }
}
