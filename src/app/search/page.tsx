import type { Metadata } from "next";
import Link from "next/link";
import { parseSearchFilters, type SearchParamsRecord } from "@/lib/search-params";
import { searchCatalog } from "@/server/search";
import { SearchView } from "@/components/search/search-view";

export const metadata: Metadata = {
  title: "نتایج جست‌وجو | ترب‌یار",
};

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams: Promise<SearchParamsRecord>;
};

function SearchError({ message }: { message: string }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-lg font-extrabold">جست‌وجو انجام نشد</h1>
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

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const rawParams = await searchParams;
  const parsed = parseSearchFilters(rawParams);
  if (!parsed.ok) {
    return <SearchError message={parsed.error} />;
  }

  let result;
  try {
    result = await searchCatalog(parsed.filters);
  } catch (error) {
    console.error("Search page failed", error);
    return (
      <SearchError message="ارتباط با داده‌ها برقرار نشد. چند لحظه بعد دوباره تلاش کن." />
    );
  }

  return <SearchView result={result} />;
}
