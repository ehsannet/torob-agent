import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandHeader } from "@/components/ui/brand-header";
import {
  CheckIcon,
  ClockIcon,
  NavigationIcon,
  PinIcon,
  ShieldIcon,
  StoreIcon,
} from "@/components/ui/icons";
import {
  formatAddressLine,
  formatFloor,
  formatUnit,
  isApproximateAddress,
} from "@/lib/address";
import { formatRelativeTime, formatToman } from "@/lib/price";
import { getTehranClock, formatTodayRanges } from "@/lib/opening-hours";
import { getWeekdayLabel, getWeekdayOrder } from "@/lib/opening-hours";
import {
  FEATURE_LABELS,
  OPEN_CLASSES,
  OPEN_LABELS,
  STOCK_CLASSES,
  STOCK_LABELS,
} from "@/lib/ui-labels";
import { cn } from "@/lib/cn";
import { getShopDetail } from "@/server/shop-detail";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "جزئیات فروشگاه | ترب‌یار",
};

type PageProps = { params: Promise<{ id: string }> };

const WARNING_CLASSES = {
  info: "border-line bg-page text-muted",
  warning: "border-warning/20 bg-warning/10 text-warning",
  danger: "border-danger/20 bg-danger/10 text-danger",
} as const;

function rangesLabel(ranges: { open: string; close: string }[] | null): string {
  if (ranges === null) return "نامشخص";
  if (ranges.length === 0) return "تعطیل";
  return formatTodayRanges(ranges);
}

export default async function ShopPage({ params }: PageProps) {
  const { id } = await params;
  let detail;
  try {
    detail = await getShopDetail(id);
  } catch (error) {
    console.error("Shop page failed", error);
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-lg font-extrabold">فروشگاه باز نشد</h1>
        <p className="text-base leading-7 text-muted">
          ارتباط با داده‌ها برقرار نشد. چند لحظه بعد دوباره تلاش کن.
        </p>
        <Link
          href="/search"
          className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white"
        >
          بازگشت به جست‌وجو
        </Link>
      </main>
    );
  }
  if (!detail) notFound();

  const addressParts = [
    ["پاساژ یا مجتمع", detail.mallName],
    ["طبقه", formatFloor(detail.floor)],
    ["واحد", formatUnit(detail.unit)],
    ["خیابان", detail.street],
    ["نشانه", detail.landmark],
  ].filter(([, value]) => Boolean(value)) as [string, string][];
  const features = Object.entries(detail.features).filter(([, value]) => value);
  const today = getTehranClock().weekday;
  const confidenceApproximate = isApproximateAddress(detail.addressConfidence);
  const activeWarnings = detail.plan.warnings;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 px-4 pb-10 pt-5">
      <BrandHeader backHref="/search" backLabel="بازگشت به نتایج" />

      <section className="rounded-card border border-line bg-surface p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-brand-600">
              {detail.activityCategory ?? "فروشگاه"}
            </p>
            <h1 className="mt-1 text-lg font-black leading-7">{detail.name}</h1>
            <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-muted">
              {formatAddressLine(detail)}
              {detail.landmark ? ` · ${detail.landmark}` : ""}
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-1 text-[11px] font-bold",
              confidenceApproximate
                ? "bg-warning/10 text-warning"
                : "bg-success/10 text-success",
            )}
          >
            {confidenceApproximate ? "آدرس تقریبی" : "آدرس ساختاریافته"}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold",
              OPEN_CLASSES[detail.openStatus.state],
            )}
          >
            <ClockIcon className="size-3" />
            {OPEN_LABELS[detail.openStatus.state]}
            {detail.openStatus.closesAt &&
            (detail.openStatus.state === "open" ||
              detail.openStatus.state === "closing_soon")
              ? ` · تا ${detail.openStatus.closesAt}`
              : ""}
          </span>
          <span className="rounded-full bg-page px-2.5 py-1 text-[11px] text-muted">
            {formatTodayRanges(detail.openStatus.todayRanges)}
          </span>
          {detail.hoursConfirmedAt ? (
            <span className="flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-[11px] text-success">
              <CheckIcon className="size-3" />
              ساعت تأییدشده
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={detail.plan.routeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-ink px-3 py-2.5 text-[12px] font-bold text-white"
          >
            <NavigationIcon className="size-3.5" />
            مسیریابی با نقشه
          </a>
          <Link
            href={`/search?q=${encodeURIComponent(detail.name)}`}
            className="flex items-center justify-center rounded-xl border border-line px-3 py-2.5 text-[12px] font-bold text-muted"
          >
            جست‌وجوی این فروشگاه
          </Link>
        </div>
      </section>

      {activeWarnings.length > 0 ? (
        <section className="space-y-1.5" aria-label="شرایط بازدید">
          {activeWarnings.map((warning) => (
            <p
              key={warning.key}
              className={cn(
                "rounded-xl border px-3 py-2 text-[12px] leading-5",
                WARNING_CLASSES[warning.tone],
              )}
            >
              {warning.label}
            </p>
          ))}
        </section>
      ) : (
        <p className="flex items-center gap-1.5 rounded-xl bg-success/5 px-3 py-2 text-[12px] leading-5 text-success">
          <CheckIcon className="size-3.5" />
          اطلاعات این فروشگاه برای یک بازدید حضوری کامل است.
        </p>
      )}

      <section className="rounded-card border border-line bg-surface p-4">
        <h2 className="flex items-center gap-1.5 text-sm font-extrabold">
          <PinIcon className="size-4 text-brand-600" />
          نشانی و جزئیات مراجعه
        </h2>
        <dl className="mt-3 space-y-2">
          {addressParts.map(([label, value]) => (
            <div
              key={label}
              className="flex items-start justify-between gap-3 border-b border-line/60 pb-2 text-[12px] last:border-0 last:pb-0"
            >
              <dt className="shrink-0 text-muted">{label}</dt>
              <dd className="text-left font-semibold leading-5">{value}</dd>
            </div>
          ))}
          {addressParts.length === 0 ? (
            <p className="text-[12px] leading-5 text-muted">
              جزئیات ساختاریافته ثبت نشده است؛ متن نشانی را ببین.
            </p>
          ) : null}
        </dl>
        <p className="mt-3 rounded-xl bg-page/70 px-3 py-2 text-[12px] leading-5 text-muted">
          {detail.addressText}
        </p>
        {detail.plan.warnings.some(
          (warning) => warning.key === "approximate_address",
        ) ? (
          <p className="mt-2 text-[11px] leading-4 text-warning">
            موقعیت تقریبی است؛ پیش از حرکت، نشانی دقیق را از فروشنده بپرس.
          </p>
        ) : null}
      </section>

      <section className="rounded-card border border-line bg-surface p-4">
        <h2 className="flex items-center gap-1.5 text-sm font-extrabold">
          <ClockIcon className="size-4 text-brand-600" />
          ساعت کاری هفته
        </h2>
        {detail.weeklyHours ? (
          <div className="mt-3 space-y-1.5">
            {getWeekdayOrder().map((day) => (
              <div
                key={day}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-[12px]",
                  day === today ? "bg-brand-50 text-brand-700" : "text-muted",
                )}
              >
                <span className={day === today ? "font-bold" : ""}>
                  {getWeekdayLabel(day)}
                </span>
                <span dir="ltr">
                  {rangesLabel(detail.weeklyHours?.[day] ?? [])}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-[12px] leading-5 text-muted">
            ساعت کاری ثبت نشده است. وضعیت «باز است» را به‌عنوان قطعی در نظر نگیر.
          </p>
        )}
      </section>

      <section className="rounded-card border border-line bg-surface p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-1.5 text-sm font-extrabold">
            <StoreIcon className="size-4 text-brand-600" />
            آفرهای این فروشگاه
          </h2>
          <span className="text-[11px] text-muted">
            {detail.totalOffers > detail.offers.length
              ? `نمایش ${detail.offers.length} از ${detail.totalOffers}`
              : `${detail.totalOffers} آفر`}
          </span>
        </div>
        <div className="mt-3 space-y-2">
          {detail.offers.map(({ offer, product }) => (
            <article
              key={offer.id}
              className="rounded-xl border border-line/80 bg-page/40 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="line-clamp-2 text-[12px] font-bold leading-5">
                    {product.titleFa}
                  </h3>
                  <p className="mt-1 text-[11px] text-muted">
                    {product.brand ?? product.category}
                  </p>
                </div>
                <p className="shrink-0 text-[12px] font-extrabold text-ink">
                  {formatToman(offer.priceToman)}
                </p>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted">
                <span className={STOCK_CLASSES[offer.stockStatus]}>
                  {STOCK_LABELS[offer.stockStatus]}
                </span>
                <span>{OPEN_LABELS[offer.openStatus.state]}</span>
                <span>
                  تغییر قیمت: {formatRelativeTime(offer.lastPriceChangeAt)}
                </span>
                <Link
                  href={`/search?q=${encodeURIComponent(product.titleFa)}`}
                  className="ms-auto font-bold text-brand-700"
                >
                  دیدن در نتایج
                </Link>
              </div>
            </article>
          ))}
          {detail.offers.length === 0 ? (
            <p className="text-[12px] leading-5 text-muted">
              برای این فروشگاه آفری ثبت نشده است.
            </p>
          ) : null}
        </div>
      </section>

      {features.length > 0 || detail.phone || detail.website || detail.instagram ? (
        <section className="rounded-card border border-line bg-surface p-4">
          <h2 className="flex items-center gap-1.5 text-sm font-extrabold">
            <ShieldIcon className="size-4 text-brand-600" />
            شرایط و راه ارتباط
          </h2>
          {features.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {features.map(([key]) => (
                <span
                  key={key}
                  className="rounded-full bg-brand-50 px-2 py-1 text-[11px] font-semibold text-brand-700"
                >
                  {FEATURE_LABELS[key as keyof typeof FEATURE_LABELS]}
                </span>
              ))}
            </div>
          ) : null}
          <div className="mt-2 space-y-1.5 text-[12px] text-muted">
            {detail.phone ? <p dir="ltr">{detail.phone}</p> : null}
            {detail.website ? <p dir="ltr">{detail.website}</p> : null}
            {detail.instagram ? <p dir="ltr">{detail.instagram}</p> : null}
          </div>
          {detail.description ? (
            <p className="mt-2 text-[11px] leading-5 text-muted">
              {detail.description}
            </p>
          ) : null}
        </section>
      ) : null}

      <p className="text-center text-[11px] leading-5 text-muted">
        قیمت‌ها از دادهٔ ثبت‌شدهٔ ترب هستند؛ موجودی فقط بعد از تأیید فروشنده
        قطعی می‌شود.
      </p>
    </main>
  );
}
