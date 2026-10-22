import Link from "next/link";
import { formatDistanceKm } from "@/lib/geo";
import { formatToman } from "@/lib/price";
import type { SellerAlternative } from "@/lib/seller-types";
import { OPEN_LABELS, STOCK_LABELS } from "@/lib/ui-labels";
import { cn } from "@/lib/cn";
import { ChevronLeftIcon, SparkIcon } from "@/components/ui/icons";

export function SellerAlternatives({
  alternatives,
}: {
  alternatives: SellerAlternative[];
}) {
  if (alternatives.length === 0) return null;
  return (
    <section className="mt-3 rounded-xl border border-brand-100 bg-brand-50/50 p-3">
      <p className="flex items-center gap-1 text-[10px] font-bold text-brand-700">
        <SparkIcon className="size-3.5" />
        گزینه‌های جایگزین
      </p>
      <p className="mt-1 text-[9px] leading-4 text-muted">
        این پیشنهادها از داده‌های ثبت‌شده ساخته شده‌اند؛ موجودی آن‌ها تأیید نشده است.
      </p>
      <ul className="mt-2 space-y-2">
        {alternatives.map((alternative) => (
          <li
            key={alternative.offerId}
            className="rounded-lg border border-line bg-white p-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="line-clamp-1 text-[10px] font-bold">
                  {alternative.productTitle}
                </p>
                <p className="mt-0.5 line-clamp-1 text-[9px] text-muted">
                  {alternative.shopName} · {alternative.reason}
                </p>
              </div>
              <span className="shrink-0 text-[10px] font-bold text-brand-600">
                {formatToman(alternative.priceToman)}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] text-muted">
              <span
                className={cn(
                  alternative.stockStatus === "in_stock"
                    ? "text-success"
                    : alternative.stockStatus === "out_of_stock"
                      ? "text-danger"
                      : "",
                )}
              >
                {STOCK_LABELS[alternative.stockStatus]}
              </span>
              <span>{OPEN_LABELS[alternative.openState]}</span>
              {alternative.distanceKm !== null ? (
                <span>{formatDistanceKm(alternative.distanceKm)}</span>
              ) : null}
              <Link
                href={`/search?q=${encodeURIComponent(alternative.productTitle)}`}
                className="ms-auto flex items-center gap-0.5 font-semibold text-brand-700"
              >
                دیدن
                <ChevronLeftIcon className="size-2.5" />
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
