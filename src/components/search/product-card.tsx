"use client";

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
  summarizeStock,
} from "@/lib/ui-labels";
import { cn } from "@/lib/cn";
import {
  CheckIcon,
  ClockIcon,
  PinIcon,
  ScaleIcon,
  SparkIcon,
  StoreIcon,
} from "@/components/ui/icons";
import { ShopOfferCard } from "./shop-offer-card";
import { useCompare } from "./compare-provider";

type ProductCardProps = {
  group: ProductGroup;
};

export function ProductCard({ group }: ProductCardProps) {
  const { isSelected, toggle, isFull } = useCompare();
  const selected = isSelected(group.product.id);
  const disabled = !selected && isFull;
  const topOffers = group.offers.slice(0, 2);
  const restOffers = group.offers.slice(2);
  const priceText =
    group.priceMin === null
      ? "قیمت ثبت نشده"
      : `از ${formatToman(group.priceMin)}`;

  return (
    <article
      className={cn(
        "overflow-hidden rounded-card border bg-surface shadow-sm transition",
        selected ? "border-brand-300 ring-2 ring-brand-100" : "border-line",
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            aria-hidden="true"
            className={cn(
              "grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-2xl font-black",
              categoryAccent(group.product.category),
            )}
          >
            {categoryInitial(group.product.category)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-brand-600">
                  {group.product.brand ?? group.product.category}
                  {group.product.brand ? ` · ${group.product.category}` : ""}
                </p>
                <h2 className="mt-1 line-clamp-2 text-sm font-extrabold leading-6">
                  {group.product.titleFa}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => toggle(group.product.id)}
                disabled={disabled}
                aria-pressed={selected}
                title={disabled ? "حداکثر چهار محصول" : "افزودن به مقایسه"}
                className={cn(
                  "flex shrink-0 items-center gap-1 rounded-xl border px-2 py-1.5 text-[10px] font-semibold transition",
                  selected
                    ? "border-brand-500 bg-brand-500 text-white"
                    : "border-line bg-white text-muted hover:border-brand-200 hover:text-brand-700",
                  disabled && "cursor-not-allowed opacity-40",
                )}
              >
                <ScaleIcon className="size-3.5" />
                {selected ? "انتخاب شد" : "مقایسه"}
              </button>
            </div>

            <div className="mt-2 flex flex-wrap items-end gap-x-2 gap-y-1">
              <p className="text-lg font-black text-brand-600">{priceText}</p>
              {group.priceMax !== null && group.priceMax !== group.priceMin ? (
                <p className="pb-0.5 text-[10px] text-muted">
                  تا {formatToman(group.priceMax)}
                </p>
              ) : null}
              <span className="pb-0.5 text-[10px] text-muted">
                · {formatNumber(group.shopCount)} فروشگاه
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {group.nearestDistanceKm !== null ? (
            <span className="flex items-center gap-1 rounded-full bg-page px-2 py-1 text-[10px] text-muted">
              <PinIcon className="size-3" />
              {formatDistanceKm(group.nearestDistanceKm)}
            </span>
          ) : null}
          <span
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-1 text-[10px]",
              group.openNowCount > 0
                ? "bg-success/10 text-success"
                : "bg-page text-muted",
            )}
          >
            <ClockIcon className="size-3" />
            {group.openNowCount > 0
              ? `${formatNumber(group.openNowCount)} فروشگاه باز`
              : "فعلاً بسته"}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-page px-2 py-1 text-[10px] text-muted">
            <StoreIcon className="size-3" />
            {summarizeStock(group)}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {group.reasons.map((reason) => (
            <span
              key={reason}
              className="flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-[10px] font-medium text-brand-700"
            >
              {reason.includes("قدیمی") ? (
                <SparkIcon className="size-3" />
              ) : (
                <CheckIcon className="size-3" />
              )}
              {reason}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-x-reverse divide-line border-y border-line bg-page/50 text-center">
        <div className="px-2 py-2.5">
          <p className="text-[9px] text-muted">قیمت ثبت‌شده</p>
          <p className="mt-1 text-[10px] font-bold">
            {formatPriceRange(group.priceMin, group.priceMax)}
          </p>
        </div>
        <div className="px-2 py-2.5">
          <p className="text-[9px] text-muted">آخرین تغییر</p>
          <p
            className={cn(
              "mt-1 text-[10px] font-bold",
              group.stalePrice ? "text-warning" : "text-ink",
            )}
          >
            {group.latestPriceChangeAt
              ? formatRelativeTime(group.latestPriceChangeAt)
              : "نامشخص"}
          </p>
        </div>
        <div className="px-2 py-2.5">
          <p className="text-[9px] text-muted">موجودی تأییدشده</p>
          <p className="mt-1 text-[10px] font-bold">{summarizeStock(group)}</p>
        </div>
      </div>

      <div className="space-y-2 p-3">
        {topOffers.map((offer) => (
          <ShopOfferCard
            key={offer.id}
            offer={offer}
            isBest={offer.id === group.bestOffer?.id}
          />
        ))}
        {restOffers.length > 0 ? (
          <details className="group rounded-2xl border border-line bg-white">
            <summary className="cursor-pointer list-none px-3 py-2.5 text-center text-[10px] font-semibold text-brand-700">
              نمایش {formatNumber(restOffers.length)} فروشگاه دیگر
            </summary>
            <div className="space-y-2 border-t border-line p-2">
              {restOffers.map((offer) => (
                <ShopOfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          </details>
        ) : null}
      </div>
    </article>
  );
}
