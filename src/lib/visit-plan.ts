import {
  addressComponents,
  formatAddressLine,
  isApproximateAddress,
  mapsDirectionsUrl,
} from "./address";
import type { OpenState, OpenStatus } from "./opening-hours";
import type { StockStatus } from "./search-types";

export type VisitWarningTone = "info" | "warning" | "danger";

export type VisitWarning = {
  key: string;
  label: string;
  tone: VisitWarningTone;
};

export type VisitPlanInput = {
  shopId: string;
  shopName: string;
  addressText: string;
  mallName: string | null;
  floor: string | null;
  unit: string | null;
  street: string | null;
  landmark: string | null;
  addressConfidence: number;
  latitude: number | null;
  longitude: number | null;
  openStatus: OpenStatus;
  stockStatus?: StockStatus | null;
  stalePrice?: boolean;
  hoursConfirmedAt?: string | null;
  priceToman?: number | null;
  productTitle?: string | null;
  offerId?: string | null;
};

export type VisitPlan = {
  shopId: string;
  shopName: string;
  addressText: string;
  addressLine: string;
  addressParts: string[];
  approximateAddress: boolean;
  routeUrl: string;
  openState: OpenState;
  openLabel: string;
  closesAt: string | null;
  hoursConfirmedAt: string | null;
  warnings: VisitWarning[];
  productTitle: string | null;
  offerId: string | null;
  priceToman: number | null;
  stockStatus: StockStatus | null;
};

type WarningInput = Pick<
  VisitPlanInput,
  | "mallName"
  | "floor"
  | "unit"
  | "addressConfidence"
  | "openStatus"
  | "stockStatus"
  | "stalePrice"
  | "hoursConfirmedAt"
>;

export function buildVisitWarnings(input: WarningInput): VisitWarning[] {
  const warnings: VisitWarning[] = [];

  if (input.stockStatus === "out_of_stock") {
    warnings.push({
      key: "out_of_stock",
      label: "این آفر ناموجود اعلام شده است.",
      tone: "danger",
    });
  } else if (input.stockStatus === "unknown") {
    warnings.push({
      key: "stock_unknown",
      label: "موجودی تأییدشده نیست؛ قبل از مراجعه تأیید بگیر.",
      tone: "warning",
    });
  }

  if (isApproximateAddress(input.addressConfidence)) {
    warnings.push({
      key: "approximate_address",
      label: "آدرس تقریبی است؛ نشانی دقیق را با فروشنده چک کن.",
      tone: "warning",
    });
  }

  if (input.mallName && (!input.floor || !input.unit)) {
    warnings.push({
      key: "incomplete_unit",
      label: "طبقه یا واحد کامل ثبت نشده است.",
      tone: "warning",
    });
  }

  if (input.openStatus.state === "closed") {
    warnings.push({
      key: "closed",
      label: "همین حالا بسته است؛ ساعت کاری را ببین.",
      tone: "info",
    });
  } else if (input.openStatus.state === "unknown") {
    warnings.push({
      key: "hours_unknown",
      label: "ساعت کاری تأیید نشده است.",
      tone: "warning",
    });
  } else if (input.openStatus.state === "closing_soon") {
    warnings.push({
      key: "closing_soon",
      label: "کمتر از یک ساعت تا بستن مغازه مانده.",
      tone: "info",
    });
  }

  if (input.stalePrice) {
    warnings.push({
      key: "stale_price",
      label: "قیمت ثبت‌شده قدیمی‌تر از ۱۴ روز است.",
      tone: "warning",
    });
  }

  return warnings.slice(0, 5);
}

export function buildVisitPlan(input: VisitPlanInput): VisitPlan {
  return {
    shopId: input.shopId,
    shopName: input.shopName,
    addressText: input.addressText,
    addressLine: formatAddressLine(input),
    addressParts: addressComponents(input),
    approximateAddress: isApproximateAddress(input.addressConfidence),
    routeUrl: mapsDirectionsUrl(input),
    openState: input.openStatus.state,
    openLabel: input.openStatus.label,
    closesAt: input.openStatus.closesAt,
    hoursConfirmedAt: input.hoursConfirmedAt ?? null,
    warnings: buildVisitWarnings(input),
    productTitle: input.productTitle ?? null,
    offerId: input.offerId ?? null,
    priceToman: input.priceToman ?? null,
    stockStatus: input.stockStatus ?? null,
  };
}
