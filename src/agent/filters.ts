import { normalizePersian } from "@/lib/persian";
import type { SearchFilters, SortKey } from "@/lib/search-types";
import { SORT_KEYS } from "@/lib/search-types";
import { getDistrict, TEHRAN_DISTRICTS } from "@/lib/tehran";
import type { AgentContext } from "@/lib/agent-types";

export const AGENT_CATEGORIES = [
  "موبایل",
  "لپ‌تاپ",
  "هدفون و هندزفری",
  "ساعت هوشمند",
  "کنسول بازی",
  "تلویزیون",
  "دوربین",
  "لوازم خانگی",
] as const;

const CATEGORY_ALIASES: Record<string, string> = {
  "موبایل": "موبایل",
  "گوشی": "موبایل",
  "گوشی موبایل": "موبایل",
  "تلفن": "موبایل",
  "لپ تاپ": "لپ‌تاپ",
  "لپ‌تاپ": "لپ‌تاپ",
  "لپتاب": "لپ‌تاپ",
  "هدفون": "هدفون و هندزفری",
  "هندزفری": "هدفون و هندزفری",
  "ایرپاد": "هدفون و هندزفری",
  "ساعت": "ساعت هوشمند",
  "ساعت هوشمند": "ساعت هوشمند",
  "کنسول": "کنسول بازی",
  "کنسول بازی": "کنسول بازی",
  "تلویزیون": "تلویزیون",
  "تی وی": "تلویزیون",
  "دوربین": "دوربین",
  "لوازم خانگی": "لوازم خانگی",
};

export type AgentFilterInput = {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  district?: string;
  openNow?: boolean;
  torobPay?: boolean;
  installments?: boolean;
  kalabarg?: boolean;
  fastDelivery?: boolean;
  sort?: SortKey;
  radiusKm?: number;
};

export function contextToBaseFilters(context?: AgentContext): SearchFilters {
  const district = context?.district ? getDistrict(context.district) : null;
  const lat =
    context?.lat !== null &&
    context?.lat !== undefined &&
    Number.isFinite(context.lat)
      ? context.lat
      : null;
  const lng =
    context?.lng !== null &&
    context?.lng !== undefined &&
    Number.isFinite(context.lng)
      ? context.lng
      : null;
  const radius =
    context?.radiusKm !== undefined &&
    Number.isFinite(context.radiusKm) &&
    context.radiusKm >= 0.5 &&
    context.radiusKm <= 30
      ? context.radiusKm
      : 5;

  return {
    q: "",
    category: null,
    minPrice: null,
    maxPrice: null,
    district: district?.slug ?? null,
    lat,
    lng,
    radiusKm: radius,
    openNow: false,
    torobPay: false,
    installments: false,
    kalabarg: false,
    fastDelivery: false,
    sort: "relevance",
    page: 1,
    limit: 8,
  };
}

export function resolveDistrict(value: string | undefined): string | null {
  if (!value) return null;
  const direct = getDistrict(value);
  if (direct) return direct.slug;

  const normalized = normalizePersian(value);
  const exact = TEHRAN_DISTRICTS.find(
    (district) => normalizePersian(district.name) === normalized,
  );
  if (exact) return exact.slug;

  const padded = ` ${normalized.replace(/[،,؛;]/g, " ")} `;
  const match = TEHRAN_DISTRICTS.find((district) =>
    padded.includes(` ${normalizePersian(district.name)} `),
  );
  return match?.slug ?? null;
}

export function resolveCategory(value: string | undefined): string | null {
  if (!value) return null;
  const normalized = normalizePersian(value);
  if (CATEGORY_ALIASES[normalized]) return CATEGORY_ALIASES[normalized];

  const match = AGENT_CATEGORIES.find(
    (category) => normalizePersian(category) === normalized,
  );
  return match ?? null;
}

function sanitizeBudget(value: number | undefined): number | null {
  if (value === undefined || !Number.isFinite(value) || value < 0) return null;
  return Math.min(Math.round(value), 1_000_000_000_000);
}

export function mergeAgentFilters(
  input: AgentFilterInput,
  base: SearchFilters,
): SearchFilters {
  const requestedDistrict = resolveDistrict(input.district);
  const district = requestedDistrict ?? base.district;
  const usingRequestedDistrict = Boolean(requestedDistrict);

  let minPrice = sanitizeBudget(input.minPrice);
  let maxPrice = sanitizeBudget(input.maxPrice);
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    [minPrice, maxPrice] = [maxPrice, minPrice];
  }

  const sort =
    input.sort && SORT_KEYS.includes(input.sort) ? input.sort : "relevance";
  const radiusKm =
    input.radiusKm !== undefined &&
    Number.isFinite(input.radiusKm) &&
    input.radiusKm >= 0.5 &&
    input.radiusKm <= 30
      ? input.radiusKm
      : base.radiusKm;

  return {
    q: (input.q ?? "").trim().slice(0, 100),
    category: resolveCategory(input.category),
    minPrice,
    maxPrice,
    district,
    lat: usingRequestedDistrict ? null : base.lat,
    lng: usingRequestedDistrict ? null : base.lng,
    radiusKm,
    openNow: Boolean(input.openNow),
    torobPay: Boolean(input.torobPay),
    installments: Boolean(input.installments),
    kalabarg: Boolean(input.kalabarg),
    fastDelivery: Boolean(input.fastDelivery),
    sort,
    page: 1,
    limit: 8,
  };
}
