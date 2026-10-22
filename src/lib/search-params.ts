import { toEnglishDigits } from "./persian";
import type { SearchFilters, SortKey } from "./search-types";
import { SORT_KEYS } from "./search-types";
import { getDistrict } from "./tehran";

export type SearchParamsRecord = Record<
  string,
  string | string[] | undefined
>;

export type ParseResult =
  | { ok: true; filters: SearchFilters }
  | { ok: false; error: string };

export const DEFAULT_RADIUS_KM = 5;
export const DEFAULT_LIMIT = 12;
export const MAX_LIMIT = 24;

function readValue(
  input: URLSearchParams | SearchParamsRecord,
  key: string,
): string | null {
  if (input instanceof URLSearchParams) {
    return input.get(key);
  }
  const value = input[key];
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function clean(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseNumber(value: string | null): number | null {
  if (!value) return null;
  const normalized = toEnglishDigits(value)
    .replace(/[,\s٬،]/g, "")
    .trim();
  if (!/^\d+$/.test(normalized)) return null;
  const number = Number(normalized);
  return Number.isSafeInteger(number) ? number : null;
}

function parseBoolean(value: string | null): boolean {
  return value === "1" || value === "true";
}

function parseCoordinate(
  value: string | null,
  min: number,
  max: number,
): number | null {
  if (!value) return null;
  const number = Number(toEnglishDigits(value));
  if (!Number.isFinite(number) || number < min || number > max) return null;
  return number;
}

function parseSort(value: string | null): SortKey | null {
  if (!value) return null;
  return SORT_KEYS.includes(value as SortKey) ? (value as SortKey) : null;
}

export function parseSearchFilters(
  input: URLSearchParams | SearchParamsRecord,
): ParseResult {
  const q = clean(readValue(input, "q")) ?? "";
  if (q.length > 100) {
    return { ok: false, error: "عبارت جست‌وجو بیش از حد طولانی است." };
  }

  const category = clean(readValue(input, "category"));
  if (category && category.length > 60) {
    return { ok: false, error: "دستهٔ انتخابی معتبر نیست." };
  }

  const minPriceRaw = clean(readValue(input, "minPrice"));
  const maxPriceRaw = clean(readValue(input, "maxPrice"));
  const minPrice = parseNumber(minPriceRaw);
  const maxPrice = parseNumber(maxPriceRaw);
  if ((minPriceRaw && minPrice === null) || (maxPriceRaw && maxPrice === null)) {
    return { ok: false, error: "بازهٔ بودجه معتبر نیست." };
  }
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    return { ok: false, error: "حداقل بودجه نباید بیشتر از حداکثر باشد." };
  }

  const districtSlug = clean(readValue(input, "district"));
  const district = districtSlug ? getDistrict(districtSlug) : null;
  if (districtSlug && !district) {
    return { ok: false, error: "محلهٔ انتخابی معتبر نیست." };
  }

  const latValue = clean(readValue(input, "lat"));
  const lngValue = clean(readValue(input, "lng"));
  if ((latValue && !lngValue) || (!latValue && lngValue)) {
    return { ok: false, error: "موقعیت مکانی ناقص است." };
  }
  const lat = parseCoordinate(latValue, -90, 90);
  const lng = parseCoordinate(lngValue, -180, 180);
  if ((latValue && lat === null) || (lngValue && lng === null)) {
    return { ok: false, error: "مختصات موقعیت مکانی معتبر نیست." };
  }

  const radiusRaw = readValue(input, "radiusKm");
  const radiusNumber = radiusRaw ? Number(toEnglishDigits(radiusRaw)) : NaN;
  const radiusKm =
    Number.isFinite(radiusNumber) && radiusNumber >= 0.5 && radiusNumber <= 30
      ? radiusNumber
      : DEFAULT_RADIUS_KM;

  const sort = parseSort(clean(readValue(input, "sort"))) ?? "relevance";
  const sortRaw = clean(readValue(input, "sort"));
  if (sortRaw && !parseSort(sortRaw)) {
    return { ok: false, error: "ترتیب نمایش معتبر نیست." };
  }

  const pageRaw = readValue(input, "page");
  const page = pageRaw ? Number(toEnglishDigits(pageRaw)) : 1;
  if (!Number.isInteger(page) || page < 1 || page > 1000) {
    return { ok: false, error: "شمارهٔ صفحه معتبر نیست." };
  }

  const limitRaw = readValue(input, "limit");
  const limit = limitRaw ? Number(toEnglishDigits(limitRaw)) : DEFAULT_LIMIT;
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    return { ok: false, error: "تعداد نتایج در هر صفحه معتبر نیست." };
  }

  return {
    ok: true,
    filters: {
      q,
      category,
      minPrice,
      maxPrice,
      district: district?.slug ?? null,
      lat,
      lng,
      radiusKm,
      openNow: parseBoolean(readValue(input, "openNow")),
      torobPay: parseBoolean(readValue(input, "torobPay")),
      installments: parseBoolean(readValue(input, "installments")),
      kalabarg: parseBoolean(readValue(input, "kalabarg")),
      fastDelivery: parseBoolean(readValue(input, "fastDelivery")),
      sort,
      page,
      limit,
    },
  };
}

export function buildSearchParams(
  filters: SearchFilters,
  overrides: Partial<SearchFilters> = {},
): URLSearchParams {
  const merged = { ...filters, ...overrides };
  const params = new URLSearchParams();

  if (merged.q) params.set("q", merged.q);
  if (merged.category) params.set("category", merged.category);
  if (merged.minPrice !== null) params.set("minPrice", String(merged.minPrice));
  if (merged.maxPrice !== null) params.set("maxPrice", String(merged.maxPrice));
  if (merged.district) params.set("district", merged.district);
  if (merged.lat !== null && merged.lng !== null) {
    params.set("lat", String(merged.lat));
    params.set("lng", String(merged.lng));
    params.set("radiusKm", String(merged.radiusKm));
  }
  if (merged.openNow) params.set("openNow", "1");
  if (merged.torobPay) params.set("torobPay", "1");
  if (merged.installments) params.set("installments", "1");
  if (merged.kalabarg) params.set("kalabarg", "1");
  if (merged.fastDelivery) params.set("fastDelivery", "1");
  if (merged.sort !== "relevance") params.set("sort", merged.sort);
  if (merged.page > 1) params.set("page", String(merged.page));
  if (merged.limit !== DEFAULT_LIMIT) params.set("limit", String(merged.limit));

  return params;
}

export function searchHref(
  filters: SearchFilters,
  overrides: Partial<SearchFilters> = {},
): string {
  const params = buildSearchParams(filters, overrides);
  const query = params.toString();
  return query ? `/search?${query}` : "/search";
}

export function countActiveFilters(filters: SearchFilters): number {
  return [
    filters.category,
    filters.minPrice,
    filters.maxPrice,
    filters.district,
    filters.lat,
    filters.openNow,
    filters.torobPay,
    filters.installments,
    filters.kalabarg,
    filters.fastDelivery,
  ].filter((value) => value !== null && value !== false).length;
}

export function hasActiveFilters(filters: SearchFilters): boolean {
  return countActiveFilters(filters) > 0;
}
