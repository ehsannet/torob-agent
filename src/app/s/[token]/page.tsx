import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandHeader } from "@/components/ui/brand-header";
import { SellerAlternatives } from "@/components/seller/seller-alternatives";
import { SellerResponseForm } from "@/components/seller/seller-response-form";
import { SellerShare } from "@/components/seller/seller-share";
import { SellerTimeline } from "@/components/seller/seller-timeline";
import {
  formatAddressLine,
  mapsDirectionsUrl,
} from "@/lib/address";
import {
  formatAbsoluteDate,
  formatNumber,
  formatRelativeTime,
  formatToman,
} from "@/lib/price";
import {
  SELLER_STATUS_CLASSES,
  SELLER_STATUS_LABELS,
} from "@/lib/seller-labels";
import { isSellerToken } from "@/server/seller/tokens";
import { getSellerCheckView } from "@/server/seller/view";
import { markSellerCheckSeen } from "@/server/seller/seen";
import { OPEN_LABELS, STOCK_LABELS } from "@/lib/ui-labels";
import { cn } from "@/lib/cn";
import { NavigationIcon } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "تأیید قیمت و موجودی | ترب‌یار",
  robots: { index: false, follow: false },
};

type PageProps = { params: Promise<{ token: string }> };

export default async function SellerPage({ params }: PageProps) {
  const { token } = await params;
  if (!isSellerToken(token)) notFound();
  await markSellerCheckSeen(token).catch(() => undefined);
  const check = await getSellerCheckView(token).catch(() => null);
  if (!check) notFound();

  const active = check.status === "created" || check.status === "sent";
  const observation = check.latestObservation;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 px-4 pb-10 pt-5">
      <BrandHeader backHref="/search" backLabel="بازگشت به نتایج" />

      <section className="rounded-card border border-line bg-surface p-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-brand-600">
              درخواست تأیید از طرف خریدار
            </p>
            <h1 className="mt-1 line-clamp-2 text-base font-black leading-7">
              {check.product.titleFa}
            </h1>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-1 text-[11px] font-bold",
              SELLER_STATUS_CLASSES[check.status],
            )}
          >
            {SELLER_STATUS_LABELS[check.status]}
          </span>
        </div>

        <div className="mt-3 rounded-xl bg-page/70 p-3">
          <p className="text-sm font-bold">{check.shop.name}</p>
          <p
            className="mt-1 text-[12px] leading-5 text-muted"
            title={check.shop.addressText}
          >
            {formatAddressLine(check.shop)}
            {check.shop.landmark ? ` · ${check.shop.landmark}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px]">
            <span className="font-bold text-ink">
              {formatToman(check.offer.confirmedPriceToman ?? check.offer.priceToman)}
            </span>
            <span className="text-muted">
              {check.offer.confirmedPriceToman !== null
                ? "تأییدشده توسط فروشنده"
                : "قیمت ثبت‌شده در دیتاست"}
            </span>
            <span className="text-muted">
              {OPEN_LABELS[check.offer.openState]}
              {check.offer.hoursConfirmedAt ? " · ساعت تأییدشده" : ""}
            </span>
            <a
              href={mapsDirectionsUrl(check.shop)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-semibold text-brand-700"
            >
              <NavigationIcon className="size-3" />
              مسیریابی
            </a>
            {check.offer.warrantyProvider ? (
              <span className="text-muted">
                گارانتی {check.offer.warrantyProvider}
                {check.offer.warrantyDurationMonths
                  ? ` · ${formatNumber(check.offer.warrantyDurationMonths)} ماه`
                  : ""}
              </span>
            ) : null}
          </div>
        </div>

        {check.simulated ? (
          <p className="mt-3 rounded-xl border border-brand-100 bg-brand-50/70 px-3 py-2 text-[11px] leading-5 text-brand-700">
            این درخواست در حالت دمو ساخته شده است؛ ممکن است پاسخ فروشنده
            به‌صورت خودکار و پس از چند ثانیه ثبت شود.
          </p>
        ) : null}

        {observation ? (
          <div
            className={cn(
              "mt-3 rounded-xl px-3 py-2 text-[12px] leading-5",
              observation.stockStatus === "in_stock"
                ? "bg-success/10 text-success"
                : "bg-danger/10 text-danger",
            )}
          >
            {STOCK_LABELS[observation.stockStatus]}
            {observation.confirmedPriceToman !== null
              ? ` · ${formatToman(observation.confirmedPriceToman)}`
              : ""}
            <span className="block text-[11px] opacity-80">
              {formatRelativeTime(observation.confirmedAt)}
              {observation.note ? ` · ${observation.note}` : ""}
            </span>
          </div>
        ) : null}
      </section>

      {active ? (
        <SellerResponseForm
          token={check.token}
          questions={check.questions}
          priceToman={
            check.offer.confirmedPriceToman ?? check.offer.priceToman
          }
          simulated={check.simulated}
        />
      ) : null}

      <section className="rounded-card border border-line bg-surface p-4">
        <h2 className="text-sm font-extrabold">روند درخواست</h2>
        <div className="mt-3">
          <SellerTimeline steps={check.timeline} />
        </div>
        {check.expiresAt && active ? (
          <p className="mt-2 text-[11px] text-muted">
            اعتبار این لینک تا {formatAbsoluteDate(check.expiresAt)}
          </p>
        ) : null}
      </section>

      <SellerAlternatives alternatives={check.alternatives} />

      {check.shop.latitude !== null && check.shop.longitude !== null ? (
        <p className="text-center text-[11px] text-muted">
          موقعیت فروشگاه روی نقشه ثبت شده است؛ با دکمهٔ مسیریابی مقصد را باز کن.
        </p>
      ) : null}

      <SellerShare linkPath={check.linkPath} status={check.status} />

      <p className="text-center text-[11px] leading-5 text-muted">
        این لینک اختصاصی است و فقط برای همین درخواست استفاده می‌شود.
      </p>
      <Link
        href="/"
        className="text-center text-[12px] font-semibold text-brand-700 underline underline-offset-4"
      >
        ترب‌یار · دستیار خرید حضوری
      </Link>
    </main>
  );
}
