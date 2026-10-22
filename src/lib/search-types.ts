import type { OpenStatus } from "./opening-hours";

export const SORT_KEYS = ["relevance", "price", "distance", "newest"] as const;
export type SortKey = (typeof SORT_KEYS)[number];

export type SearchFilters = {
  q: string;
  category: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  district: string | null;
  lat: number | null;
  lng: number | null;
  radiusKm: number;
  openNow: boolean;
  torobPay: boolean;
  installments: boolean;
  kalabarg: boolean;
  fastDelivery: boolean;
  sort: SortKey;
  page: number;
  limit: number;
};

export type StockStatus = "in_stock" | "out_of_stock" | "unknown";

export type ShopFeatures = {
  torobPay: boolean;
  installments: boolean;
  kalabarg: boolean;
  fastDelivery: boolean;
};

export type OfferView = {
  id: string;
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
  distanceKm: number | null;
  recordedPrice: number | null;
  priceUnit: string;
  priceToman: number | null;
  lastPriceChangeAt: string | null;
  stalePrice: boolean;
  openStatus: OpenStatus;
  stockStatus: StockStatus;
  confirmedPriceToman: number | null;
  stockConfirmedAt: string | null;
  features: ShopFeatures;
  warrantyProvider: string | null;
  warrantyDurationMonths: number | null;
};

export type ProductSummary = {
  id: string;
  titleFa: string;
  titleEn: string | null;
  brand: string | null;
  category: string;
  specs: Record<string, string>;
  images: string[];
};

export type ProductGroup = {
  product: ProductSummary;
  offers: OfferView[];
  offerCount: number;
  shopCount: number;
  priceMin: number | null;
  priceMax: number | null;
  nearestDistanceKm: number | null;
  openNowCount: number;
  confirmedStockCount: number;
  confirmedCount: number;
  bestOffer: OfferView | null;
  latestPriceChangeAt: string | null;
  stalePrice: boolean;
  reasons: string[];
};

export type CategoryFacet = {
  value: string;
  label: string;
  count: number;
};

export type SearchResult = {
  filters: SearchFilters;
  groups: ProductGroup[];
  totalGroups: number;
  totalOffers: number;
  categories: CategoryFacet[];
  priceBounds: { min: number | null; max: number | null };
  tookMs: number;
  demo: true;
};

export type Recommendation = {
  productId: string;
  title: string;
  reasons: string[];
};

export type CompareResult = {
  groups: ProductGroup[];
  recommendation: Recommendation | null;
  demo: true;
};
