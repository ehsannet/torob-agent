import { formatDistanceKm } from "@/lib/geo";
import {
  formatNumber,
  formatPriceAge,
  formatToman,
  formatRelativeTime,
} from "@/lib/price";
import type { OfferView } from "@/lib/search-types";
import {
  FEATURE_LABELS,
  OPEN_CLASSES,
  OPEN_LABELS,
  STOCK_CLASSES,
  STOCK_LABELS,
} from "@/lib/ui-labels";
import { cn } from "@/lib/cn";
import { ClockIcon, PinIcon, StoreIcon } from "@/components/ui/icons";

type ShopOfferCardProps = {
  offer: OfferView;
  isBest?: boolean;
};

function locationLine(offer: OfferView): string {
  if (offer.mallName) {
    const parts = [offer.mallName, offer.floor, offer.unit].filter(Boolean);
    return parts.join("، ");
  }
  return offer.street ?? offer.addressText;
}

export function ShopOfferCard({ offer, isBest = false }: ShopOfferCardProps) {
  const features = Object.entries(offer.features).filter(([, value]) => value);
  const lowConfidence = offer.addressConfidence < 0.5;

  return (
    <div
      className={cn(
        "rounded-2xl border p-3",
        isBest
          ? "border-brand-200 bg-brand-50/50"
          : "border-line bg-page/60",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <StoreIcon className="size-3.5 text-muted" />
            <p className="truncate text-xs font-bold">{offer.shopName}</p>
            {isBest ? (
              <span className="rounded-full bg-brand-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                کمترین قیمت
              </span>
            ) : null}
          </div>
          <p className="mt-1 line-clamp-1 text-[10px] text-muted">
            {locationLine(offer)}
          </p>
        </div>
        <span
          title={offer.openStatus.label}
          className={cn(
            "shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold",
            OPEN_CLASSES[offer.openStatus.state],
          )}
        >
          {OPEN_LABELS[offer.openStatus.state]}
        </span>
      </div>

      <div className="mt-2.5 grid grid-cols-2 gap-2 rounded-xl border border-line/70 bg-white/80 p-2">
        <div>
          <p className="text-[9px] text-muted">قیمت ثبت‌شده</p>
          <p className="mt-0.5 text-xs font-extrabold text-ink">
            {formatToman(offer.priceToman)}
          </p>
        </div>
        <div>
          <p className="text-[9px] text-muted">آخرین تغییر قیمت</p>
          <p
            className={cn(
              "mt-0.5 text-[10px] font-semibold",
              offer.stalePrice ? "text-warning" : "text-ink",
            )}
            title={formatPriceAge(offer.lastPriceChangeAt)}
          >
            {offer.lastPriceChangeAt
              ? formatRelativeTime(offer.lastPriceChangeAt)
              : "نامشخص"}
          </p>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px]">
        <span className={STOCK_CLASSES[offer.stockStatus]}>
          موجودی تأییدشده: {STOCK_LABELS[offer.stockStatus]}
        </span>
        {offer.distanceKm !== null ? (
          <span className="flex items-center gap-1 text-muted">
            <PinIcon className="size-3" />
            {formatDistanceKm(offer.distanceKm)}
          </span>
        ) : null}
        {offer.openStatus.closesAt &&
        (offer.openStatus.state === "open" ||
          offer.openStatus.state === "closing_soon") ? (
          <span className="flex items-center gap-1 text-muted">
            <ClockIcon className="size-3" />
            تا {offer.openStatus.closesAt}
          </span>
        ) : null}
      </div>

      {features.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {features.map(([key]) => (
            <span
              key={key}
              className="rounded-full border border-line bg-white px-1.5 py-0.5 text-[9px] text-muted"
            >
              {FEATURE_LABELS[key as keyof typeof FEATURE_LABELS]}
            </span>
          ))}
        </div>
      ) : null}

      {offer.stalePrice || lowConfidence ? (
        <div className="mt-2 flex flex-wrap gap-2 text-[9px]">
          {offer.stalePrice ? (
            <span className="rounded-md bg-warning/10 px-1.5 py-0.5 text-warning">
              قیمت قدیمی‌تر از ۱۴ روز
            </span>
          ) : null}
          {lowConfidence ? (
            <span className="rounded-md bg-warning/10 px-1.5 py-0.5 text-warning">
              آدرس نیازمند تأیید
            </span>
          ) : null}
        </div>
      ) : null}

      {offer.warrantyProvider ? (
        <p className="mt-2 text-[9px] text-muted">
          گارانتی {offer.warrantyProvider}
          {offer.warrantyDurationMonths
            ? ` · ${formatNumber(offer.warrantyDurationMonths)} ماه`
            : ""}
        </p>
      ) : null}
    </div>
  );
}
