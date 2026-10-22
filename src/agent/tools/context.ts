import type {
  AgentShop,
} from "@/lib/agent-types";
import type {
  CompareResult,
  SearchFilters,
  SearchResult,
} from "@/lib/search-types";

export type AgentToolContext = {
  baseFilters: SearchFilters;
  search?: {
    filters: SearchFilters;
    result: SearchResult;
  };
  compare?: {
    filters: SearchFilters;
    result: CompareResult;
  };
  shops: AgentShop[];
  error: string | null;
  lastAction: "search" | "compare" | null;
};
