import { getPool } from "@/lib/db";
import type {
  CategoryFacet,
  SearchFilters,
  SearchResult,
} from "@/lib/search-types";
import { getDistrict } from "@/lib/tehran";
import { loadOfferRows, type CatalogOffer } from "./search-query";
import {
  areaMatches,
  groupCatalogOffers,
  mapOffer,
  sortGroups,
} from "./search-results";

type CategoryRow = {
  category: string;
  count: number;
};

async function loadCategories(): Promise<CategoryFacet[]> {
  const result = await getPool().query<CategoryRow>(
    `select category, count(*)::int as count
     from products
     group by category
     order by count desc, category asc`,
  );
  return result.rows.map((row) => ({
    value: row.category,
    label: row.category,
    count: Number(row.count),
  }));
}

export async function loadCatalogOffers(
  filters: SearchFilters,
  productIds?: string[],
): Promise<CatalogOffer[]> {
  const rows = await loadOfferRows(filters, productIds);
  const district = getDistrict(filters.district);
  const center =
    filters.lat !== null && filters.lng !== null
      ? { latitude: filters.lat, longitude: filters.lng }
      : district
        ? { latitude: district.latitude, longitude: district.longitude }
        : null;
  const now = new Date();

  const mapped = rows.map((row) => mapOffer(row, now, center));

  return mapped.filter(({ offer }) => {
    if (filters.minPrice !== null) {
      if (offer.priceToman === null || offer.priceToman < filters.minPrice) {
        return false;
      }
    }
    if (filters.maxPrice !== null) {
      if (offer.priceToman === null || offer.priceToman > filters.maxPrice) {
        return false;
      }
    }
    if (
      filters.openNow &&
      offer.openStatus.state !== "open" &&
      offer.openStatus.state !== "closing_soon"
    ) {
      return false;
    }
    return areaMatches(
      offer,
      center,
      filters.radiusKm,
      district?.name ?? null,
      filters.lat === null && district !== null,
    );
  });
}

export async function searchCatalog(
  filters: SearchFilters,
): Promise<SearchResult> {
  const startedAt = Date.now();
  const [items, categories] = await Promise.all([
    loadCatalogOffers(filters),
    loadCategories(),
  ]);
  const groups = sortGroups(groupCatalogOffers(items), filters.sort);
  const prices = items
    .map(({ offer }) => offer.priceToman)
    .filter((price): price is number => price !== null);
  const start = (filters.page - 1) * filters.limit;

  return {
    filters,
    groups: groups.slice(start, start + filters.limit),
    totalGroups: groups.length,
    totalOffers: items.length,
    categories,
    priceBounds: {
      min: prices.length > 0 ? Math.min(...prices) : null,
      max: prices.length > 0 ? Math.max(...prices) : null,
    },
    tookMs: Date.now() - startedAt,
    demo: true,
  };
}
