"use client";

import Link from "next/link";
import { assistantHref } from "@/lib/agent-links";
import { formatNumber } from "@/lib/price";
import { searchHref } from "@/lib/search-params";
import type { SearchResult, SortKey } from "@/lib/search-types";
import { cn } from "@/lib/cn";
import { BrandHeader } from "@/components/ui/brand-header";
import {
  ChevronLeftIcon,
  SearchIcon,
  SparkIcon,
} from "@/components/ui/icons";
import { ActiveFilters } from "./active-filters";
import { CompareBar } from "./compare-bar";
import { CompareProvider } from "./compare-provider";
import { FilterSheet } from "./filter-sheet";
import { ProductCard } from "./product-card";
import { SearchForm } from "./search-form";

const SORT_LABELS: Record<SortKey, string> = {
  relevance: "مرتبط‌ترین",
  price: "ارزان‌ترین",
  distance: "نزدیک‌ترین",
  newest: "به‌روزترین قیمت",
};

export function SearchView({ result }: { result: SearchResult }) {
  const { filters, groups } = result;
  const totalPages = Math.max(1, Math.ceil(result.totalGroups / filters.limit));
  const hasResults = groups.length > 0;
  const hasFilters =
    filters.category !== null ||
    filters.minPrice !== null ||
    filters.maxPrice !== null ||
    filters.district !== null ||
    filters.lat !== null ||
    filters.openNow ||
    filters.torobPay ||
    filters.installments ||
    filters.kalabarg ||
    filters.fastDelivery;

  return (
    <CompareProvider>
      <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 px-4 pb-28 pt-5">
        <BrandHeader />
        <SearchForm defaultValue={filters.q} compact preserve={filters} />
        <Link
          href={assistantHref(filters)}
          className="flex items-center justify-between gap-2 rounded-xl border border-brand-200 bg-brand-50/60 px-3 py-2 text-[10px] font-bold text-brand-700"
        >
          <span className="flex items-center gap-1.5">
            <SparkIcon className="size-3.5" />
            همین جست‌وجو را از دستیار بپرس
          </span>
          <ChevronLeftIcon className="size-3" />
        </Link>

        <div className="flex items-center gap-2">
          <FilterSheet
            key={searchHref(filters)}
            filters={filters}
            categories={result.categories}
            totalGroups={result.totalGroups}
          />
          <div className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-xl border border-line bg-surface px-3 py-2.5">
            <p className="truncate text-[10px] text-muted">
              {hasResults
                ? `${formatNumber(result.totalGroups)} محصول · ${formatNumber(result.totalOffers)} آفر`
                : "نتیجه‌ای پیدا نشد"}
            </p>
            <p className="shrink-0 text-[10px] font-semibold text-ink">
              {SORT_LABELS[filters.sort]}
            </p>
          </div>
        </div>

        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link
            href={searchHref(filters, { category: null, page: 1 })}
            scroll={false}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition",
              filters.category === null
                ? "border-ink bg-ink text-white"
                : "border-line bg-surface text-muted",
            )}
          >
            همه
          </Link>
          {result.categories.map((category) => (
            <Link
              key={category.value}
              href={searchHref(filters, {
                category: category.value,
                page: 1,
              })}
              scroll={false}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition",
                filters.category === category.value
                  ? "border-ink bg-ink text-white"
                  : "border-line bg-surface text-muted",
              )}
            >
              {category.label}
            </Link>
          ))}
        </div>

        <ActiveFilters filters={filters} />

        {hasResults ? (
          <section className="space-y-3" aria-label="نتایج جست‌وجو">
            {groups.map((group) => (
              <ProductCard key={group.product.id} group={group} />
            ))}
          </section>
        ) : (
          <section className="rounded-card border border-line bg-surface p-6 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <SearchIcon className="size-6" />
            </span>
            <h2 className="mt-3 text-sm font-extrabold">
              در این محدوده چیزی پیدا نشد
            </h2>
            <p className="mt-2 text-xs leading-6 text-muted">
              عبارت کوتاه‌تری امتحان کن، دسته را عوض کن یا فیلترهای محدودکننده
              را بردار.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Link
                href="/search"
                className="rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white"
              >
                جست‌وجوی تازه
              </Link>
              {hasFilters ? (
                <Link
                  href={searchHref(filters, {
                    category: null,
                    minPrice: null,
                    maxPrice: null,
                    district: null,
                    lat: null,
                    lng: null,
                    openNow: false,
                    torobPay: false,
                    installments: false,
                    kalabarg: false,
                    fastDelivery: false,
                    page: 1,
                  })}
                  className="rounded-xl border border-line px-4 py-2 text-xs font-semibold text-muted"
                >
                  حذف فیلترها
                </Link>
              ) : null}
            </div>
          </section>
        )}

        {hasResults && totalPages > 1 ? (
          <nav
            aria-label="صفحه‌بندی نتایج"
            className="flex items-center justify-between rounded-2xl border border-line bg-surface px-3 py-2"
          >
            {filters.page > 1 ? (
              <Link
                href={searchHref(filters, { page: filters.page - 1 })}
                className="rounded-lg px-3 py-1.5 text-[11px] font-semibold text-brand-700"
              >
                صفحهٔ قبل
              </Link>
            ) : (
              <span className="px-3 py-1.5 text-[11px] text-muted/50">
                صفحهٔ قبل
              </span>
            )}
            <span className="text-[10px] text-muted">
              {formatNumber(filters.page)} از {formatNumber(totalPages)}
            </span>
            {filters.page < totalPages ? (
              <Link
                href={searchHref(filters, { page: filters.page + 1 })}
                className="rounded-lg px-3 py-1.5 text-[11px] font-semibold text-brand-700"
              >
                صفحهٔ بعد
              </Link>
            ) : (
              <span className="px-3 py-1.5 text-[11px] text-muted/50">
                صفحهٔ بعد
              </span>
            )}
          </nav>
        ) : null}

        <footer className="mt-auto pt-3 text-center text-[10px] leading-6 text-muted">
          <p className="flex items-center justify-center gap-1">
            <SparkIcon className="size-3 text-brand-500" />
            دادهٔ نمونه؛ قیمت‌ها و ساعت‌ها قبل از خرید باید تأیید شوند.
          </p>
          <Link
            href="/api/health"
            className="font-medium text-brand-700 underline underline-offset-4"
          >
            وضعیت سرویس
          </Link>
        </footer>
      </main>
      <CompareBar filters={filters} />
    </CompareProvider>
  );
}
