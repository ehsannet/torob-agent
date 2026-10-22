import type { AgentToolContext } from "./context";
import { createCompareProductsTool } from "./compare-products";
import { createFindShopsTool } from "./find-shops";
import { createSearchProductsTool } from "./search-products";

export function createAgentTools(context: AgentToolContext) {
  return {
    search_products: createSearchProductsTool(context),
    compare_products: createCompareProductsTool(context),
    find_shops: createFindShopsTool(context),
  };
}

export type AgentTools = ReturnType<typeof createAgentTools>;
export type { AgentToolContext } from "./context";
