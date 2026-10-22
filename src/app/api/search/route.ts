import { type NextRequest, NextResponse } from "next/server";
import { parseSearchFilters } from "@/lib/search-params";
import { searchCatalog } from "@/server/search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const parsed = parseSearchFilters(request.nextUrl.searchParams);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const result = await searchCatalog(parsed.filters);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Search API failed", error);
    return NextResponse.json(
      { error: "جست‌وجو در این لحظه ممکن نیست. دوباره تلاش کن." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
