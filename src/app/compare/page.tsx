import type { Metadata } from "next";
import Link from "next/link";
import { parseCompareIds } from "@/lib/compare-params";
import { parseSearchFilters, type SearchParamsRecord } from "@/lib/search-params";
import { compareProducts } from "@/server/compare";
import { CompareView } from "@/components/compare/compare-view";

export const metadata: Metadata = {
  title: "مقایسهٔ محصولات | ترب‌یار",
};

export const dynamic = "force-dynamic";

type ComparePageProps = {
  searchParams: Promise<SearchParamsRecord>;
};

function CompareError({ message }: { message: string }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-lg font-extrabold">مقایسه ممکن نشد</h1>
      <p className="text-sm leading-7 text-muted">{message}</p>
      <Link
        href="/search"
        className="rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white"
      >
        بازگشت به جست‌وجو
      </Link>
    </main>
  );
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const rawParams = await searchParams;
  const rawIds = rawParams.ids;
  const idsValue = Array.isArray(rawIds) ? (rawIds[0] ?? null) : (rawIds ?? null);
  const parsedIds = parseCompareIds(idsValue);
  if (!parsedIds.ok) {
    return <CompareError message={parsedIds.error} />;
  }

  const parsedFilters = parseSearchFilters(rawParams);
  if (!parsedFilters.ok) {
    return <CompareError message={parsedFilters.error} />;
  }

  let result;
  try {
    result = await compareProducts(parsedIds.ids, parsedFilters.filters);
  } catch (error) {
    console.error("Compare page failed", error);
    return (
      <CompareError message="ارتباط با داده‌ها برقرار نشد. چند لحظه بعد دوباره تلاش کن." />
    );
  }

  if (result.groups.length < 2) {
    return (
      <CompareError message="یکی از محصولات انتخاب‌شده پیدا نشد. از نتایج جست‌وجو دوباره انتخاب کن." />
    );
  }

  return <CompareView result={result} filters={parsedFilters.filters} />;
}
