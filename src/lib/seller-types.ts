import type { OpenState } from "./opening-hours";
import type { StockStatus } from "./search-types";

export type SellerCheckStatus = "created" | "sent" | "answered" | "expired";

export type SellerQuestionView = {
  key: "stock" | "price" | "hours" | "warranty";
  label: string;
};

export type SellerTimelineStep = {
  key: "created" | "sent" | "viewed" | "answered" | "expired";
  label: string;
  at: string | null;
  state: "done" | "active" | "pending" | "failed";
};

export type SellerShopView = {
  id: string;
  name: string;
  addressText: string;
  mallName: string | null;
  floor: string | null;
  unit: string | null;
  street: string | null;
  landmark: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type SellerProductView = {
  id: string;
  titleFa: string;
  brand: string | null;
  category: string;
  images: string[];
};

export type SellerOfferView = {
  id: string;
  priceToman: number | null;
  priceUnit: string;
  lastPriceChangeAt: string | null;
  stockStatus: StockStatus;
  confirmedPriceToman: number | null;
  stockConfirmedAt: string | null;
  openState: OpenState;
  openLabel: string;
  closesAt: string | null;
  hoursConfirmedAt: string | null;
  warrantyProvider: string | null;
  warrantyDurationMonths: number | null;
};

export type SellerObservationView = {
  stockStatus: StockStatus;
  confirmedPriceToman: number | null;
  confirmedAt: string;
  source: "seller_response" | "simulator";
  note: string | null;
};

export type SellerAlternative = {
  kind: "same_product" | "similar";
  offerId: string;
  productId: string;
  productTitle: string;
  shopId: string;
  shopName: string;
  addressText: string;
  priceToman: number | null;
  stockStatus: StockStatus;
  openState: OpenState;
  openLabel: string;
  distanceKm: number | null;
  reason: string;
};

export type SellerCheckView = {
  token: string;
  status: SellerCheckStatus;
  simulated: boolean;
  demoMode: boolean;
  createdAt: string;
  sentAt: string | null;
  viewedAt: string | null;
  answeredAt: string | null;
  expiresAt: string | null;
  shop: SellerShopView;
  product: SellerProductView;
  offer: SellerOfferView;
  questions: SellerQuestionView[];
  timeline: SellerTimelineStep[];
  latestObservation: SellerObservationView | null;
  alternatives: SellerAlternative[];
  linkPath: string;
};

export type SellerCheckSummary = {
  token: string;
  status: SellerCheckStatus;
  simulated: boolean;
  createdAt: string;
  answeredAt: string | null;
  shopName: string;
  productTitle: string;
  offerId: string;
  priceToman: number | null;
  linkPath: string;
};

export type SellerResponseInput = {
  stockStatus: "in_stock" | "out_of_stock";
  confirmedPriceToman?: number | null;
  hoursConfirmed?: boolean;
  warrantyConfirmed?: boolean;
  note?: string | null;
};

export type SellerResponseResult = {
  ok: true;
  status: SellerCheckStatus;
  observation: SellerObservationView | null;
  linkPath: string;
};

export type SellerResponseError = {
  ok: false;
  error: string;
  code: "not_found" | "closed" | "invalid";
};

export type SubmitSellerResponse = SellerResponseResult | SellerResponseError;

export type SellerCheckCreateResult = {
  checks: SellerCheckSummary[];
  skipped: string[];
  demoMode: boolean;
};

export type SellerCheckStatusPayload = {
  check: SellerCheckView;
};

export type SellerCheckListPayload = {
  checks: SellerCheckSummary[];
};
