import { z } from "zod";
import { normalizePersian } from "@/lib/persian";
import type { SearchFilters } from "@/lib/search-types";
import type { AgentContext } from "@/lib/agent-types";
import {
  contextToBaseFilters,
  mergeAgentFilters,
  type AgentFilterInput,
} from "../filters";
import {
  cleanQuery,
  detectCategory,
  detectDistrict,
  detectSort,
  extractBudget,
} from "./parse-request-text";

export const parseRequestInputSchema = z.object({
  message: z.string().min(1).max(500),
});

export function parseRequestFilters(
  message: string,
  context?: AgentContext,
): SearchFilters {
  const text = normalizePersian(message);
  const budget = extractBudget(text);
  const category = detectCategory(text);
  const district = detectDistrict(text);
  const nearMe = /نزدیک\s*من|همین\s*اطراف|اطراف\s*من/.test(text);
  const input: AgentFilterInput = {
    q: cleanQuery(text, budget),
    category: category ?? undefined,
    minPrice: budget?.min ?? undefined,
    maxPrice: budget?.max ?? undefined,
    district: district ?? undefined,
    openNow: /(^|\s)باز(\s|$)|همین\s*حالا\s*باز|الان\s*باز/.test(text),
    torobPay: /تورب\s*پی|پرداخت\s*تورب/.test(text),
    installments: /اقساط|قسطی/.test(text),
    kalabarg: /کالا\s*برگ|کالابارگ/.test(text),
    fastDelivery: /ارسال\s*سریع|تحویل\s*سریع|پیک/.test(text),
    sort: detectSort(text) ?? undefined,
  };

  const base = contextToBaseFilters(context);
  const filters = mergeAgentFilters(input, base);

  if (nearMe && base.lat !== null && base.lng !== null) {
    return {
      ...filters,
      district: null,
      lat: base.lat,
      lng: base.lng,
      radiusKm: base.radiusKm,
    };
  }

  return filters;
}
