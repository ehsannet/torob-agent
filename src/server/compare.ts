import { formatDistanceKm } from "@/lib/geo";
import { formatNumber, formatToman } from "@/lib/price";
import type {
  CompareResult,
  ProductGroup,
  Recommendation,
  SearchFilters,
} from "@/lib/search-types";
import { loadCatalogOffers } from "./search";
import { groupCatalogOffers } from "./search-results";

function scoreGroup(
  group: ProductGroup,
  max: {
    price: number;
    distance: number;
    open: number;
    shops: number;
    latest: number;
  },
): number {
  let score = 0;
  if (group.priceMin !== null && max.price > 0) {
    score += 40 * (1 - group.priceMin / max.price);
  }
  if (group.nearestDistanceKm !== null && max.distance > 0) {
    score += 25 * (1 - group.nearestDistanceKm / max.distance);
  }
  if (max.open > 0) score += 20 * (group.openNowCount / max.open);
  if (max.shops > 0) score += 10 * (group.shopCount / max.shops);
  if (group.confirmedStockCount > 0) score += 5;
  if (group.latestPriceChangeAt && max.latest > 0) {
    score += 5 * (Date.parse(group.latestPriceChangeAt) / max.latest);
  }
  return score;
}

export function recommendGroup(groups: ProductGroup[]): Recommendation | null {
  if (groups.length < 2) return null;

  const prices = groups
    .map((group) => group.priceMin)
    .filter((price): price is number => price !== null);
  const distances = groups
    .map((group) => group.nearestDistanceKm)
    .filter((distance): distance is number => distance !== null);
  const latestValues = groups
    .map((group) => (group.latestPriceChangeAt ? Date.parse(group.latestPriceChangeAt) : null))
    .filter((value): value is number => value !== null);

  const max = {
    price: prices.length > 0 ? Math.max(...prices) : 0,
    distance: distances.length > 0 ? Math.max(...distances) : 0,
    open: Math.max(...groups.map((group) => group.openNowCount), 1),
    shops: Math.max(...groups.map((group) => group.shopCount), 1),
    latest: latestValues.length > 0 ? Math.max(...latestValues) : 0,
  };

  const winner = groups.reduce((best, group) =>
    scoreGroup(group, max) > scoreGroup(best, max) ? group : best,
  );

  const reasons: string[] = [];
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const minDistance =
    distances.length > 0 ? Math.min(...distances) : null;
  const maxOpen = Math.max(...groups.map((group) => group.openNowCount));
  const maxShops = Math.max(...groups.map((group) => group.shopCount));

  if (minPrice !== null && winner.priceMin === minPrice) {
    reasons.push(`کمترین قیمت ثبت‌شده: ${formatToman(winner.priceMin)}`);
  }
  if (minDistance !== null && winner.nearestDistanceKm === minDistance) {
    reasons.push(`نزدیک‌ترین گزینه: ${formatDistanceKm(winner.nearestDistanceKm)}`);
  }
  if (winner.openNowCount > 0 && winner.openNowCount === maxOpen) {
    reasons.push(`${formatNumber(winner.openNowCount)} فروشگاه باز`);
  }
  if (winner.shopCount === maxShops && winner.shopCount > 1) {
    reasons.push(`بیشترین تنوع فروشنده: ${formatNumber(winner.shopCount)} فروشگاه`);
  }
  if (winner.confirmedStockCount > 0) {
    reasons.push(
      `${formatNumber(winner.confirmedStockCount)} موجودی تأییدشده`,
    );
  }
  if (reasons.length === 0) {
    reasons.push("تعادل بهتری از قیمت، فاصله و تعداد فروشنده دارد");
  }

  return {
    productId: winner.product.id,
    title: winner.product.titleFa,
    reasons: reasons.slice(0, 4),
  };
}

export async function compareProducts(
  productIds: string[],
  filters: SearchFilters,
): Promise<CompareResult> {
  const uniqueIds = Array.from(new Set(productIds));
  const cleanFilters: SearchFilters = {
    ...filters,
    q: "",
    category: null,
    minPrice: null,
    maxPrice: null,
    openNow: false,
    torobPay: false,
    installments: false,
    kalabarg: false,
    fastDelivery: false,
  };

  if (uniqueIds.length === 0) {
    return { groups: [], recommendation: null, demo: false };
  }

  const items = await loadCatalogOffers(cleanFilters, uniqueIds);
  const allGroups = groupCatalogOffers(items);
  const byId = new Map(allGroups.map((group) => [group.product.id, group]));
  const groups = uniqueIds
    .map((id) => byId.get(id))
    .filter((group): group is ProductGroup => Boolean(group));

  return {
    groups,
    recommendation: recommendGroup(groups),
    demo: false,
  };
}
