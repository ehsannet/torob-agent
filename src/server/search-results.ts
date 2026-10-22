import { formatDistanceKm, haversineKm } from "@/lib/geo";
import { parseWeeklyHours } from "@/lib/hours";
import { getOpenStatus } from "@/lib/opening-hours";
import { formatNumber, formatToman, isStalePrice, toToman } from "@/lib/price";
import { normalizePersian } from "@/lib/persian";
import type {
  OfferView,
  ProductGroup,
  ProductSummary,
  SearchFilters,
} from "@/lib/search-types";
import type { CatalogOffer, OfferRow } from "./search-query";

type MapCenter = { latitude: number; longitude: number } | null;

export function mapOffer(
  row: OfferRow,
  now: Date,
  center: MapCenter,
): CatalogOffer {
  const recordedPrice =
    row.recorded_price === null ? null : Number(row.recorded_price);
  const priceToman = toToman(recordedPrice, row.price_unit);
  const lastPriceChangeAt = row.last_price_change_at
    ? new Date(row.last_price_change_at).toISOString()
    : null;
  const latitude = row.latitude === null ? null : Number(row.latitude);
  const longitude = row.longitude === null ? null : Number(row.longitude);
  const distanceKm =
    center && latitude !== null && longitude !== null
      ? haversineKm(center, { latitude, longitude })
      : null;

  const offer: OfferView = {
    id: row.offer_id,
    shopId: row.shop_id,
    shopName: row.shop_name,
    addressText: row.address_text,
    mallName: row.mall_name,
    floor: row.floor,
    unit: row.unit,
    street: row.street,
    landmark: row.landmark,
    addressConfidence: Number(row.address_confidence ?? 0),
    latitude,
    longitude,
    distanceKm,
    recordedPrice,
    priceUnit: row.price_unit,
    priceToman,
    lastPriceChangeAt,
    stalePrice: isStalePrice(lastPriceChangeAt, now),
    openStatus: getOpenStatus(parseWeeklyHours(row.weekly_hours), now),
    stockStatus: row.stock_status ?? "unknown",
    confirmedPriceToman: toToman(row.confirmed_price, row.price_unit),
    stockConfirmedAt: row.confirmed_at
      ? new Date(row.confirmed_at).toISOString()
      : null,
    features: {
      torobPay: row.accepts_torob_pay,
      installments: row.offers_installments,
      kalabarg: row.accepts_kalabarg,
      fastDelivery: row.has_fast_delivery,
    },
    warrantyProvider: row.warranty_provider,
    warrantyDurationMonths: row.warranty_duration_months,
  };

  return {
    offer,
    product: {
      id: row.product_id,
      titleFa: row.title_fa,
      titleEn: row.title_en,
      brand: row.brand,
      category: row.category,
      specs: row.specs ?? {},
      images: row.images ?? [],
    },
  };
}

export function areaMatches(
  offer: OfferView,
  center: MapCenter,
  radiusKm: number,
  districtName: string | null,
  districtOnly: boolean,
): boolean {
  if (!center) return true;

  if (districtOnly && districtName) {
    const normalizedName = normalizePersian(districtName);
    return (
      normalizePersian(offer.landmark ?? "") === normalizedName ||
      normalizePersian(offer.addressText).includes(normalizedName)
    );
  }

  if (offer.distanceKm === null) return false;
  return offer.distanceKm <= radiusKm;
}

function openRank(offer: OfferView): number {
  if (offer.openStatus.state === "open") return 0;
  if (offer.openStatus.state === "closing_soon") return 1;
  if (offer.openStatus.state === "unknown") return 2;
  return 3;
}

function compareNullableNumbers(a: number | null, b: number | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a - b;
}

function sortOffers(offers: OfferView[]): OfferView[] {
  return [...offers].sort((a, b) => {
    const byPrice = compareNullableNumbers(a.priceToman, b.priceToman);
    if (byPrice !== 0) return byPrice;
    const byOpen = openRank(a) - openRank(b);
    if (byOpen !== 0) return byOpen;
    const byDistance = compareNullableNumbers(a.distanceKm, b.distanceKm);
    if (byDistance !== 0) return byDistance;
    return a.shopName.localeCompare(b.shopName, "fa");
  });
}

function buildReasons(group: Omit<ProductGroup, "reasons">): string[] {
  const reasons: string[] = [];
  if (group.stalePrice) {
    reasons.push("قیمت‌های ثبت‌شده قدیمی‌اند؛ قبل از رفتن بپرس");
  }
  if (group.priceMin !== null) {
    reasons.push(`قیمت از ${formatToman(group.priceMin)}`);
  }
  if (group.openNowCount > 0) {
    reasons.push(`${formatNumber(group.openNowCount)} فروشگاه همین حالا باز است`);
  }
  if (group.nearestDistanceKm !== null) {
    reasons.push(`نزدیک‌ترین فروشگاه ${formatDistanceKm(group.nearestDistanceKm)}`);
  }
  if (group.offers.some((offer) => offer.features.torobPay)) {
    reasons.push("پرداخت توروب پذیرفته می‌شود");
  }
  if (group.confirmedStockCount > 0) {
    reasons.push(`${formatNumber(group.confirmedStockCount)} موجودی تأییدشده`);
  }
  if (reasons.length === 0) {
    reasons.push("اطلاعات فروشگاه‌ها را ببین و خودت مقایسه کن");
  }
  return reasons.slice(0, 3);
}

export function groupCatalogOffers(items: CatalogOffer[]): ProductGroup[] {
  const map = new Map<
    string,
    { product: ProductSummary; offers: OfferView[] }
  >();

  for (const item of items) {
    const existing = map.get(item.product.id);
    if (existing) {
      existing.offers.push(item.offer);
    } else {
      map.set(item.product.id, {
        product: item.product,
        offers: [item.offer],
      });
    }
  }

  return Array.from(map.values()).map(({ product, offers }) => {
    const sorted = sortOffers(offers);
    const prices = sorted
      .map((offer) => offer.priceToman)
      .filter((price): price is number => price !== null);
    const distances = sorted
      .map((offer) => offer.distanceKm)
      .filter((distance): distance is number => distance !== null);
    const datedOffers = sorted.filter(
      (offer) => offer.priceToman !== null && offer.lastPriceChangeAt !== null,
    );
    const latest =
      datedOffers
        .map((offer) => offer.lastPriceChangeAt as string)
        .sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null;

    const shownOffers = sorted.slice(0, 6);
    const base: Omit<ProductGroup, "reasons"> = {
      product,
      offers: shownOffers,
      offerCount: sorted.length,
      shopCount: new Set(sorted.map((offer) => offer.shopId)).size,
      priceMin: prices.length > 0 ? Math.min(...prices) : null,
      priceMax: prices.length > 0 ? Math.max(...prices) : null,
      nearestDistanceKm: distances.length > 0 ? Math.min(...distances) : null,
      openNowCount: sorted.filter(
        (offer) =>
          offer.openStatus.state === "open" ||
          offer.openStatus.state === "closing_soon",
      ).length,
      confirmedStockCount: sorted.filter(
        (offer) => offer.stockStatus === "in_stock",
      ).length,
      confirmedCount: sorted.filter(
        (offer) => offer.stockStatus !== "unknown",
      ).length,
      bestOffer: sorted[0] ?? null,
      latestPriceChangeAt: latest,
      stalePrice:
        datedOffers.length > 0 &&
        datedOffers.every((offer) => offer.stalePrice),
    };

    return { ...base, reasons: buildReasons(base) };
  });
}

export function sortGroups(
  groups: ProductGroup[],
  sort: SearchFilters["sort"],
): ProductGroup[] {
  return [...groups].sort((a, b) => {
    if (sort === "price") {
      const byPrice = compareNullableNumbers(a.priceMin, b.priceMin);
      if (byPrice !== 0) return byPrice;
    }
    if (sort === "distance") {
      const byDistance = compareNullableNumbers(
        a.nearestDistanceKm,
        b.nearestDistanceKm,
      );
      if (byDistance !== 0) return byDistance;
    }
    if (sort === "newest") {
      const aTime = a.latestPriceChangeAt
        ? Date.parse(a.latestPriceChangeAt)
        : 0;
      const bTime = b.latestPriceChangeAt
        ? Date.parse(b.latestPriceChangeAt)
        : 0;
      if (aTime !== bTime) return bTime - aTime;
    }
    if (sort === "relevance") {
      if (a.openNowCount !== b.openNowCount) {
        return b.openNowCount - a.openNowCount;
      }
      const byDistance = compareNullableNumbers(
        a.nearestDistanceKm,
        b.nearestDistanceKm,
      );
      if (byDistance !== 0) return byDistance;
      if (a.shopCount !== b.shopCount) return b.shopCount - a.shopCount;
      const byPrice = compareNullableNumbers(a.priceMin, b.priceMin);
      if (byPrice !== 0) return byPrice;
    }
    return a.product.titleFa.localeCompare(b.product.titleFa, "fa");
  });
}
