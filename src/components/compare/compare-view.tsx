import Link from "next/link";
import { formatNumber } from "@/lib/price";
import { searchHref } from "@/lib/search-params";
import type { CompareResult, SearchFilters } from "@/lib/search-types";
import { BrandHeader } from "@/components/ui/brand-header";
import { SparkIcon } from "@/components/ui/icons";
import { CompareProductColumn } from "./compare-product-column";
import { CompareSpecsTable } from "./compare-specs-table";

type CompareViewProps = {
  result: CompareResult;
  filters: SearchFilters;
};

export function CompareView({ result, filters }: CompareViewProps) {
  const { groups, recommendation } = result;
  const backHref = searchHref(filters, { page: 1 });

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 px-4 pb-12 pt-5">
      <BrandHeader backHref={backHref} backLabel="بازگشت به نتایج" />

      <header className="rounded-card border border-line bg-surface p-4">
        <p className="text-[10px] font-semibold text-brand-600">مقایسهٔ کنار هم</p>
        <h1 className="mt-1 text-lg font-black">
          {formatNumber(groups.length)} محصول انتخاب‌شده
        </h1>
        <p className="mt-2 text-[11px] leading-6 text-muted">
          قیمت ثبت‌شده، فاصله، ساعت کاری و وضعیت تأیید موجودی را ببین؛ سپس خودت
          تصمیم بگیر.
        </p>
      </header>

      {recommendation ? (
        <section className="rounded-card border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-4">
          <div className="flex items-start gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-500 text-white">
              <SparkIcon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-brand-700">
                پیشنهاد ترب‌یار · قاعدهٔ داده، بدون LLM
              </p>
              <h2 className="mt-1 text-sm font-extrabold leading-6">
                {recommendation.title}
              </h2>
            </div>
          </div>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {recommendation.reasons.map((reason) => (
              <li
                key={reason}
                className="rounded-lg border border-brand-200 bg-white px-2 py-1 text-[10px] font-medium text-brand-700"
              >
                {reason}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[9px] leading-5 text-muted">
            این پیشنهاد فقط بر اساس داده‌های همین صفحه است؛ موجودی و قیمت نهایی
            را از فروشنده تأیید کن.
          </p>
        </section>
      ) : null}

      <section
        aria-label="ستون‌های مقایسه"
        className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1"
      >
        {groups.map((group) => (
          <CompareProductColumn
            key={group.product.id}
            group={group}
            isWinner={recommendation?.productId === group.product.id}
          />
        ))}
      </section>

      <CompareSpecsTable groups={groups} />

      <div className="flex gap-2">
        <Link
          href={backHref}
          className="flex-1 rounded-xl bg-ink px-4 py-3 text-center text-xs font-bold text-white"
        >
          بازگشت به نتایج
        </Link>
        <Link
          href="/search"
          className="flex-1 rounded-xl border border-line bg-surface px-4 py-3 text-center text-xs font-semibold text-muted"
        >
          مقایسهٔ جدید
        </Link>
      </div>

      <footer className="text-center text-[10px] leading-6 text-muted">
        دادهٔ نمونه است؛ پیش از رفتن، قیمت و موجودی را از فروشنده بپرس.
      </footer>
    </main>
  );
}
