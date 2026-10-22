import {
  OPEN_LABELS,
  STOCK_LABELS,
} from "@/lib/ui-labels";
import type {
  CompareResult,
  OfferView,
  ProductGroup,
  SearchFilters,
  SearchResult,
} from "@/lib/search-types";
import type {
  AgentBestOffer,
  AgentMode,
  AgentProduct,
  AgentResult,
  AgentShop,
} from "@/lib/agent-types";

function compactOffer(offer: OfferView | null): AgentBestOffer | null {
  if (!offer) return null;
  return {
    shopName: offer.shopName,
    priceToman: offer.priceToman,
    distanceKm: offer.distanceKm,
    openState: offer.openStatus.state,
    openLabel: OPEN_LABELS[offer.openStatus.state],
    stockStatus: offer.stockStatus,
    stockLabel: STOCK_LABELS[offer.stockStatus],
  };
}

export function compactGroup(group: ProductGroup): AgentProduct {
  return {
    id: group.product.id,
    titleFa: group.product.titleFa,
    brand: group.product.brand,
    category: group.product.category,
    priceMin: group.priceMin,
    priceMax: group.priceMax,
    shopCount: group.shopCount,
    openNowCount: group.openNowCount,
    nearestDistanceKm: group.nearestDistanceKm,
    stalePrice: group.stalePrice,
    reasons: group.reasons.slice(0, 3),
    bestOffer: compactOffer(group.bestOffer),
  };
}

export function compactGroups(groups: ProductGroup[], limit = 5): AgentProduct[] {
  return groups.slice(0, limit).map(compactGroup);
}

export function compactOfferShops(offers: OfferView[]): AgentShop[] {
  return offers.slice(0, 5).map((offer) => ({
    offerId: offer.id,
    name: offer.shopName,
    distanceKm: offer.distanceKm,
    openState: offer.openStatus.state,
    openLabel: OPEN_LABELS[offer.openStatus.state],
    priceToman: offer.priceToman,
    stockStatus: offer.stockStatus,
  }));
}

export function toAgentSearchResult(
  result: SearchResult,
  mode: AgentMode,
  tookMs: number,
  fallbackReason?: string,
  shops: AgentShop[] = [],
): AgentResult {
  const groups = result.groups.slice(0, 8);
  const products = groups.slice(0, 3).map(compactGroup);
  const winner = groups[0] ?? null;
  const compareIds = groups
    .slice(0, 3)
    .map((group) => group.product.id);

  return {
    kind: "search",
    filters: result.filters,
    products,
    shops,
    recommendation: winner
      ? {
          productId: winner.product.id,
          title: winner.product.titleFa,
          reasons: winner.reasons.slice(0, 3),
        }
      : null,
    compareIds,
    totalGroups: result.totalGroups,
    totalOffers: result.totalOffers,
    mode,
    fallbackReason,
    tookMs,
  };
}

export function toAgentCompareResult(
  result: CompareResult,
  filters: SearchFilters,
  mode: AgentMode,
  tookMs: number,
  fallbackReason?: string,
): AgentResult {
  const products = result.groups.map(compactGroup);
  return {
    kind: "compare",
    filters,
    products,
    shops: [],
    recommendation: result.recommendation
      ? {
          productId: result.recommendation.productId,
          title: result.recommendation.title,
          reasons: result.recommendation.reasons.slice(0, 4),
        }
      : null,
    compareIds: result.groups.map((group) => group.product.id).slice(0, 4),
    totalGroups: result.groups.length,
    totalOffers: result.groups.reduce(
      (sum, group) => sum + group.offerCount,
      0,
    ),
    mode,
    fallbackReason,
    tookMs,
  };
}
