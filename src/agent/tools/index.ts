import type { AgentToolContext } from "./context";
import { createCompareProductsTool } from "./compare-products";
import { createFindShopsTool } from "./find-shops";
import { createSearchProductsTool } from "./search-products";
import { createSellerCheckTool } from "./create-seller-check";
import { getSellerCheckStatusTool } from "./get-seller-check-status";
import { suggestAlternativesTool } from "./suggest-alternatives";

export function createAgentTools(context: AgentToolContext) {
  return {
    search_products: createSearchProductsTool(context),
    compare_products: createCompareProductsTool(context),
    find_shops: createFindShopsTool(context),
    create_seller_check: createSellerCheckTool(context),
    get_seller_check_status: getSellerCheckStatusTool(context),
    suggest_alternatives: suggestAlternativesTool(context),
  };
}

export type AgentTools = ReturnType<typeof createAgentTools>;
export type { AgentToolContext } from "./context";
