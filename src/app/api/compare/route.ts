import { type NextRequest, NextResponse } from "next/server";
import { parseCompareIds } from "@/lib/compare-params";
import { parseSearchFilters } from "@/lib/search-params";
import { compareProducts } from "@/server/compare";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const parsedIds = parseCompareIds(request.nextUrl.searchParams.get("ids"));
  if (!parsedIds.ok) {
    return NextResponse.json(
      { error: parsedIds.error },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const parsedFilters = parseSearchFilters(request.nextUrl.searchParams);
  if (!parsedFilters.ok) {
    return NextResponse.json(
      { error: parsedFilters.error },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const result = await compareProducts(
      parsedIds.ids,
      parsedFilters.filters,
    );
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Compare API failed", error);
    return NextResponse.json(
      { error: "مقایسه در این لحظه ممکن نیست. دوباره تلاش کن." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
