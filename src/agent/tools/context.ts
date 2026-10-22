import type {
  AgentShop,
} from "@/lib/agent-types";
import type {
  SellerAlternative,
  SellerCheckSummary,
} from "@/lib/seller-types";
import type {
  CompareResult,
  SearchFilters,
  SearchResult,
} from "@/lib/search-types";

export type AgentToolContext = {
  baseFilters: SearchFilters;
  hints: SearchFilters;
  search?: {
    filters: SearchFilters;
    result: SearchResult;
  };
  compare?: {
    filters: SearchFilters;
    result: CompareResult;
  };
  shops: AgentShop[];
  sellerChecks: SellerCheckSummary[];
  alternatives: SellerAlternative[];
  error: string | null;
  lastAction: "search" | "compare" | null;
};
