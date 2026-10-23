import Link from "next/link";
import { compareHref } from "@/lib/compare-params";
import { formatDistanceKm } from "@/lib/geo";
import { formatNumber, formatToman } from "@/lib/price";
import { searchHref } from "@/lib/search-params";
import type { AgentResult } from "@/lib/agent-types";
import { cn } from "@/lib/cn";
import {
  ChevronLeftIcon,
  NavigationIcon,
  PinIcon,
  ScaleIcon,
  SparkIcon,
  StoreIcon,
} from "@/components/ui/icons";
import {
  SELLER_STATUS_CLASSES,
  SELLER_STATUS_LABELS,
} from "@/lib/seller-labels";
import { OPEN_CLASSES } from "@/lib/ui-labels";
import { SellerAlternatives } from "@/components/seller/seller-alternatives";

const MODE_LABELS = {
  llm: "دستیار هوشمند",
  fallback: "جست‌وجوی جایگزین",
  cache: "پاسخ ذخیره‌شده",
} as const;

function ModeBadge({ mode }: { mode: AgentResult["mode"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold",
        mode === "llm"
          ? "bg-brand-50 text-brand-700"
          : "bg-page text-muted",
      )}
    >
      <SparkIcon className="size-3" />
      {MODE_LABELS[mode]}
    </span>
  );
}

export function AgentResultView({ result }: { result: AgentResult }) {
  const showCompare = result.compareIds.length >= 2;
  const winner = result.recommendation;

  return (
    <section
      className="mt-3 space-y-3 rounded-2xl border border-line bg-surface p-3"
      aria-label="نتیجهٔ دستیار"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ModeBadge mode={result.mode} />
        {result.kind === "seller" ? (
          <span className="text-[11px] font-bold text-muted">وضعیت درخواست</span>
        ) : result.kind === "visit" ? (
          <span className="text-[11px] font-bold text-muted">برنامه بازدید</span>
        ) : (
          <span className="text-[11px] text-muted">
            {formatNumber(result.totalGroups)} گروه ·{" "}
            {formatNumber(result.totalOffers)} آفر
          </span>
        )}
      </div>

      {result.visitPlans && result.visitPlans.length > 0 ? (
        <div className="space-y-2">
          {result.visitPlans.map((plan) => (
            <article
              key={plan.shopId}
              className="rounded-xl border border-brand-100 bg-brand-50/50 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    href={`/shops/${plan.shopId}`}
                    className="truncate text-[13px] font-extrabold hover:text-brand-700"
                  >
                    {plan.shopName}
                  </Link>
                  {plan.productTitle ? (
                    <p className="mt-0.5 truncate text-[11px] text-muted">
                      {plan.productTitle}
                      {plan.priceToman !== null
                        ? ` · ${formatToman(plan.priceToman)}`
                        : ""}
                    </p>
                  ) : null}
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold",
                    OPEN_CLASSES[plan.openState],
                  )}
                >
                  {plan.openLabel}
                </span>
              </div>

              <p className="mt-2 text-[12px] leading-5 text-muted">
                {plan.addressLine}
              </p>
              {plan.hoursConfirmedAt ? (
                <p className="mt-1 text-[10px] text-success">
                  ساعت کاری از طرف فروشنده تأیید شده است.
                </p>
              ) : null}

              {plan.warnings.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {plan.warnings.slice(0, 3).map((warning) => (
                    <li
                      key={warning.key}
                      className={cn(
                        "rounded-md px-1.5 py-1 text-[10px] leading-4",
                        warning.tone === "danger"
                          ? "bg-danger/10 text-danger"
                          : warning.tone === "warning"
                            ? "bg-warning/10 text-warning"
                            : "bg-page text-muted",
                      )}
                    >
                      {warning.label}
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="mt-2 flex items-center justify-between gap-2">
                <a
                  href={plan.routeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-lg bg-ink px-2.5 py-1.5 text-[11px] font-bold text-white"
                >
                  <NavigationIcon className="size-3" />
                  مسیریابی
                </a>
                <Link
                  href={`/shops/${plan.shopId}`}
                  className="flex items-center gap-0.5 text-[11px] font-bold text-brand-700"
                >
                  جزئیات فروشگاه
                  <ChevronLeftIcon className="size-2.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {winner ? (
        <div className="rounded-xl bg-brand-50/70 p-3">
          <p className="flex items-center gap-1 text-[12px] font-bold text-brand-700">
            <SparkIcon className="size-3.5" />
            پیشنهاد اول
          </p>
          <p className="mt-1 text-sm font-extrabold leading-6">{winner.title}</p>
          {winner.reasons.length > 0 ? (
            <p className="mt-1 text-[12px] leading-5 text-muted">
              {winner.reasons[0]}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2">
        {result.products.slice(0, 3).map((product, index) => (
          <article
            key={product.id}
            className="rounded-xl border border-line/80 px-3 py-2.5"
          >
            <div className="flex items-start gap-2">
              <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-page text-[12px] font-black text-muted">
                {formatNumber(index + 1)}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 text-[13px] font-extrabold leading-5">
                  {product.titleFa}
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
                  <span className="font-bold text-ink">
                    {product.priceMin !== null
                      ? `از ${formatToman(product.priceMin)}`
                      : "قیمت ثبت نشده"}
                  </span>
                  <span>{formatNumber(product.shopCount)} فروشگاه</span>
                  {product.nearestDistanceKm !== null ? (
                    <span className="flex items-center gap-0.5">
                      <PinIcon className="size-2.5" />
                      {formatDistanceKm(product.nearestDistanceKm)}
                    </span>
                  ) : null}
                  {product.bestOffer ? (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5",
                        product.bestOffer.openState === "open"
                          ? "bg-success/10 text-success"
                          : "bg-page text-muted",
                      )}
                    >
                      {product.bestOffer.openLabel}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {result.shops.length > 0 ? (
        <div className="rounded-xl bg-page/70 p-3">
          <p className="flex items-center gap-1 text-[12px] font-bold">
            <StoreIcon className="size-3.5 text-brand-600" />
            فروشگاه‌های پیشنهادی
          </p>
          <ul className="mt-2 space-y-1.5">
            {result.shops.slice(0, 3).map((shop) => (
              <li
                key={shop.offerId}
                className="flex items-center justify-between gap-2 text-[11px]"
              >
                <span className="truncate font-semibold">{shop.name}</span>
                <span className="shrink-0 text-muted">
                  {shop.distanceKm !== null
                    ? formatDistanceKm(shop.distanceKm)
                    : shop.openLabel}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {result.sellerChecks && result.sellerChecks.length > 0 ? (
        <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-3">
          <p className="flex items-center gap-1 text-[12px] font-bold text-brand-700">
            <SparkIcon className="size-3.5" />
            درخواست تأیید فروشنده
          </p>
          <ul className="mt-2 space-y-1.5">
            {result.sellerChecks.slice(0, 5).map((check) => (
              <li
                key={check.token}
                className="flex items-center justify-between gap-2 rounded-lg bg-white/80 px-2 py-1.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-bold">
                    {check.shopName}
                  </p>
                  <p className="truncate text-[10px] text-muted">
                    {check.productTitle}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                      SELLER_STATUS_CLASSES[check.status],
                    )}
                  >
                    {SELLER_STATUS_LABELS[check.status]}
                  </span>
                  <Link
                    href={check.linkPath}
                    className="text-[11px] font-bold text-brand-700"
                  >
                    لینک
                  </Link>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-[10px] leading-4 text-muted">
            موجودی فقط بعد از پاسخ فروشنده تأییدشده می‌شود.
          </p>
        </div>
      ) : null}

      {result.alternatives && result.alternatives.length > 0 ? (
        <SellerAlternatives alternatives={result.alternatives} />
      ) : null}

      {result.fallbackReason ? (
        <p className="rounded-lg bg-warning/10 px-2 py-1.5 text-[11px] leading-4 text-warning">
          {result.fallbackReason}
        </p>
      ) : null}

      {result.kind === "search" || result.kind === "compare" ? (
        <div className="flex flex-wrap gap-2">
          <Link
            href={searchHref(result.filters, { page: 1, limit: 12 })}
            className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-ink px-3 py-2 text-[12px] font-bold text-white"
          >
            همهٔ نتایج جست‌وجو
            <ChevronLeftIcon className="size-3" />
          </Link>
          {showCompare ? (
            <Link
              href={compareHref(result.compareIds, result.filters)}
              className="flex items-center justify-center gap-1 rounded-xl border border-line px-3 py-2 text-[12px] font-bold text-muted"
            >
              <ScaleIcon className="size-3" />
              مقایسه
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
