import type { OpenState } from "./opening-hours";
import type {
  SellerAlternative,
  SellerCheckSummary,
} from "./seller-types";
import type {
  SearchFilters,
  StockStatus,
} from "./search-types";
import type { VisitPlan } from "./visit-plan";

export type AgentContext = {
  district: string | null;
  lat: number | null;
  lng: number | null;
  radiusKm: number;
};

export type AgentHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AgentMode = "llm" | "fallback" | "cache";

export type AgentBestOffer = {
  shopName: string;
  priceToman: number | null;
  distanceKm: number | null;
  openState: OpenState;
  openLabel: string;
  stockStatus: StockStatus;
  stockLabel: string;
};

export type AgentProduct = {
  id: string;
  titleFa: string;
  brand: string | null;
  category: string;
  priceMin: number | null;
  priceMax: number | null;
  shopCount: number;
  openNowCount: number;
  nearestDistanceKm: number | null;
  stalePrice: boolean;
  reasons: string[];
  bestOffer: AgentBestOffer | null;
};

export type AgentShop = {
  offerId: string;
  shopId: string;
  name: string;
  distanceKm: number | null;
  openState: OpenState;
  openLabel: string;
  priceToman: number | null;
  stockStatus: StockStatus;
};

export type AgentRecommendation = {
  productId: string;
  title: string;
  reasons: string[];
};

export type AgentResult = {
  kind: "search" | "compare" | "seller" | "visit";
  filters: SearchFilters;
  products: AgentProduct[];
  shops: AgentShop[];
  recommendation: AgentRecommendation | null;
  compareIds: string[];
  totalGroups: number;
  totalOffers: number;
  mode: AgentMode;
  fallbackReason?: string;
  sellerChecks?: SellerCheckSummary[];
  alternatives?: SellerAlternative[];
  visitPlans?: VisitPlan[];
  tookMs: number;
};

export type AgentQueueSnapshot = {
  active: boolean;
  queued: number;
  processed: number;
  failed: number;
  lastWaitMs: number | null;
};

export type AgentUsageSnapshot = {
  requests: number;
  cachedHits: number;
  failures: number;
  fallbacks: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  budgetUsd: number;
  remainingUsd: number;
  queue: AgentQueueSnapshot;
};

export type AgentStatusStage =
  | "queued"
  | "thinking"
  | "searching"
  | "answering"
  | "done";

export type AgentStreamEvent =
  | {
      type: "status";
      stage: AgentStatusStage;
      message: string;
    }
  | { type: "delta"; text: string }
  | { type: "result"; result: AgentResult }
  | { type: "usage"; usage: AgentUsageSnapshot }
  | { type: "done"; mode: AgentMode }
  | { type: "error"; message: string };

export type AgentRequest = {
  message: string;
  context?: AgentContext;
  history?: AgentHistoryMessage[];
};
