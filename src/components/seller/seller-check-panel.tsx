"use client";

import Link from "next/link";
import { formatNumber, formatRelativeTime, formatToman } from "@/lib/price";
import type { ProductGroup } from "@/lib/search-types";
import {
  SELLER_STATUS_CLASSES,
  SELLER_STATUS_LABELS,
} from "@/lib/seller-labels";
import { STOCK_LABELS } from "@/lib/ui-labels";
import { cn } from "@/lib/cn";
import {
  CheckIcon,
  ChevronLeftIcon,
  SparkIcon,
  StoreIcon,
} from "@/components/ui/icons";
import { SellerAlternatives } from "./seller-alternatives";
import { SellerTimeline } from "./seller-timeline";
import { useSellerChecks } from "./use-seller-checks";

export function SellerCheckPanel({ group }: { group: ProductGroup }) {
  const {
    visibleChecks,
    views,
    selected,
    open,
    setOpen,
    creating,
    error,
    demoMode,
    alternatives,
    toggle,
    create,
  } = useSellerChecks(group);

  return (
    <section className="rounded-2xl border border-line bg-page/50 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-1 text-[12px] font-bold">
            <SparkIcon className="size-3.5 text-brand-600" />
            تأیید فروشنده
          </p>
          <p className="mt-1 text-[11px] leading-4 text-muted">
            قیمت و موجودی را قبل از رفتن از فروشگاه بپرس.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="min-h-9 shrink-0 rounded-lg border border-brand-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-brand-700"
        >
          {visibleChecks.length > 0 ? "پرسش تازه" : "از فروشنده بپرس"}
        </button>
      </div>

      {open ? (
        <div className="mt-3 rounded-xl border border-line bg-white p-2.5">
          <p className="text-[11px] font-semibold text-muted">
            حداکثر ۵ فروشگاه از این محصول را انتخاب کن:
          </p>
          <ul className="mt-1.5 space-y-1">
            {group.offers.map((offer) => {
              const checked = selected.includes(offer.id);
              return (
                <li key={offer.id}>
                  <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1.5 hover:bg-page/70">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(offer.id)}
                      className="size-4 accent-[var(--color-brand-500)]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-semibold">
                        {offer.shopName}
                      </span>
                      <span className="block text-[11px] text-muted">
                        {formatToman(offer.priceToman)}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          {error ? (
            <p className="mt-1.5 rounded-lg bg-danger/10 px-2 py-1.5 text-[11px] text-danger">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => void create()}
            disabled={creating || selected.length === 0}
            className="mt-2 min-h-11 w-full rounded-xl bg-brand-500 px-3 py-2 text-[12px] font-bold text-white disabled:opacity-40"
          >
            {creating
              ? "در حال ساخت لینک…"
              : `پرسش از ${formatNumber(selected.length)} فروشگاه`}
          </button>
        </div>
      ) : null}

      {visibleChecks.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {visibleChecks.map((check) => {
            const view = views[check.token];
            const status = view?.status ?? check.status;
            return (
              <li
                key={check.token}
                className="rounded-xl border border-line bg-white p-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-bold">
                      {check.shopName}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {formatToman(check.priceToman)} ·{" "}
                      {formatRelativeTime(check.createdAt)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold",
                      SELLER_STATUS_CLASSES[status],
                    )}
                  >
                    {SELLER_STATUS_LABELS[status]}
                  </span>
                </div>

                {view ? (
                  <>
                    <div className="mt-2">
                      <SellerTimeline steps={view.timeline} compact />
                    </div>
                    {view.latestObservation ? (
                      <p
                        className={cn(
                          "mt-2 rounded-lg px-2 py-1.5 text-[11px]",
                          view.latestObservation.stockStatus === "in_stock"
                            ? "bg-success/10 text-success"
                            : "bg-danger/10 text-danger",
                        )}
                      >
                        {STOCK_LABELS[view.latestObservation.stockStatus]}
                        {view.latestObservation.confirmedPriceToman !== null
                          ? ` · ${formatToman(view.latestObservation.confirmedPriceToman)}`
                          : ""}
                        {" · "}
                        {formatRelativeTime(view.latestObservation.confirmedAt)}
                      </p>
                    ) : null}
                    {status === "sent" || status === "created" ? (
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <p className="text-[11px] text-warning">
                          {view.simulated && view.demoMode
                            ? "در دمو به‌زودی خودکار پاسخ می‌دهد."
                            : "لینک را برای فروشنده بفرست."}
                        </p>
                        <Link
                          href={view.linkPath}
                          className="flex items-center gap-0.5 text-[11px] font-bold text-brand-700"
                        >
                          صفحهٔ فروشنده
                          <ChevronLeftIcon className="size-2.5" />
                        </Link>
                      </div>
                    ) : null}
                  </>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      {visibleChecks.length > 0 ? (
        <p className="mt-2 flex items-start gap-1 text-[10px] leading-4 text-muted">
          <CheckIcon className="mt-0.5 size-2.5 shrink-0 text-success" />
          موجودی فقط بعد از پاسخ فروشنده «تأییدشده» می‌شود؛ قیمت‌های دیگر ثبت دیتاست هستند.
        </p>
      ) : null}

      {demoMode || visibleChecks.some((check) => check.simulated) ? (
        <p className="mt-1 flex items-center gap-1 text-[10px] text-brand-700">
          <StoreIcon className="size-2.5" />
          حالت دمو: پاسخ فروشنده شبیه‌سازی می‌شود.
        </p>
      ) : null}

      <SellerAlternatives alternatives={alternatives} />
    </section>
  );
}
