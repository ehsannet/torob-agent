import { formatDistanceKm } from "@/lib/geo";
import {
  formatNumber,
  formatPriceRange,
  formatRelativeTime,
  formatToman,
} from "@/lib/price";
import type { ProductGroup } from "@/lib/search-types";
import {
  categoryAccent,
  categoryInitial,
  OPEN_CLASSES,
  OPEN_LABELS,
  summarizeStock,
} from "@/lib/ui-labels";
import { cn } from "@/lib/cn";
import { PinIcon, StoreIcon } from "@/components/ui/icons";

type CompareProductColumnProps = {
  group: ProductGroup;
  isWinner: boolean;
};

export function CompareProductColumn({
  group,
  isWinner,
}: CompareProductColumnProps) {
  const best = group.bestOffer;

  return (
    <article
      className={cn(
        "flex min-w-[190px] flex-1 flex-col rounded-card border bg-surface p-3.5",
        isWinner ? "border-brand-300 ring-2 ring-brand-100" : "border-line",
      )}
    >
      <div className="flex items-start gap-2.5">
        <div
          aria-hidden="true"
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-lg font-black",
            categoryAccent(group.product.category),
          )}
        >
          {categoryInitial(group.product.category)}
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-semibold text-brand-600">
            {group.product.brand ?? group.product.category}
          </p>
          <h2 className="mt-0.5 line-clamp-3 text-xs font-extrabold leading-5">
            {group.product.titleFa}
          </h2>
        </div>
      </div>

      {isWinner ? (
        <span className="mt-2 w-fit rounded-full bg-brand-500 px-2 py-0.5 text-[9px] font-bold text-white">
          پیشنهاد ترب‌یار
        </span>
      ) : null}

      <p className="mt-3 text-lg font-black text-brand-600">
        {group.priceMin === null ? "بدون قیمت" : formatToman(group.priceMin)}
      </p>
      <p className="mt-0.5 text-[9px] text-muted">
        {formatPriceRange(group.priceMin, group.priceMax)}
      </p>

      <dl className="mt-3 space-y-1.5 border-t border-line pt-2.5 text-[10px]">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted">فروشگاه</dt>
          <dd className="font-semibold">{formatNumber(group.shopCount)}</dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted">نزدیک‌ترین</dt>
          <dd className="font-semibold">
            {formatDistanceKm(group.nearestDistanceKm)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted">همین حالا باز</dt>
          <dd className="font-semibold">
            {formatNumber(group.openNowCount)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted">موجودی تأییدشده</dt>
          <dd className="font-semibold">{summarizeStock(group)}</dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted">آخرین قیمت</dt>
          <dd
            className={cn(
              "font-semibold",
              group.stalePrice ? "text-warning" : "text-ink",
            )}
          >
            {group.latestPriceChangeAt
              ? formatRelativeTime(group.latestPriceChangeAt)
              : "نامشخص"}
          </dd>
        </div>
      </dl>

      {best ? (
        <div className="mt-3 rounded-xl border border-line bg-page/60 p-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="flex min-w-0 items-center gap-1 text-[10px] font-bold">
              <StoreIcon className="size-3 shrink-0 text-muted" />
              <span className="truncate">{best.shopName}</span>
            </p>
            <span
              className={cn(
                "shrink-0 rounded-full border px-1.5 py-0.5 text-[8px] font-semibold",
                OPEN_CLASSES[best.openStatus.state],
              )}
            >
              {OPEN_LABELS[best.openStatus.state]}
            </span>
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            <p className="text-[11px] font-extrabold">
              {formatToman(best.priceToman)}
            </p>
            {best.distanceKm !== null ? (
              <p className="flex items-center gap-1 text-[9px] text-muted">
                <PinIcon className="size-3" />
                {formatDistanceKm(best.distanceKm)}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  );
}
