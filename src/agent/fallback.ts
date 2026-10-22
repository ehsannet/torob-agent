import { formatPersianNumber } from "@/lib/persian";
import { getDistrict } from "@/lib/tehran";
import type { AgentContext, AgentResult } from "@/lib/agent-types";
import type { SearchFilters } from "@/lib/search-types";
import { searchCatalog } from "@/server/search";
import { parseRequestFilters } from "./tools/parse-request";
import { toAgentSearchResult } from "./compact";

export type FallbackOutcome = {
  result: AgentResult;
  text: string;
};

export function fallbackText(result: AgentResult, reason: string): string {
  const product = result.products[0];
  if (!product) {
    return `برای این درخواست نتیجه‌ای در فروشگاه‌های حضوری پیدا نکردم. بودجه، محله یا مدل را کمی بازتر بگو تا دوباره جست‌وجو کنم. ${reason}`;
  }

  const price =
    product.priceMin !== null
      ? `${formatPersianNumber(product.priceMin)} تومان`
      : "قیمت نامشخص";
  const shopText = `${formatPersianNumber(product.shopCount)} فروشگاه`;
  const district = result.filters.district
    ? getDistrict(result.filters.district)?.name
    : null;
  const place = district ? ` در ${district}` : "";
  const reasonLine =
    product.reasons.find((reason) => !reason.includes("قیمت")) ??
    product.reasons[0];

  return `پیشنهاد اول: ${product.titleFa} با کمترین قیمت ثبت‌شدهٔ ${price} از ${shopText}${place}.${reasonLine ? ` ${reasonLine}` : ""} ${reason}`;
}

export async function runFallback(
  message: string,
  context: AgentContext | undefined,
  reason: string,
  filters?: SearchFilters,
): Promise<FallbackOutcome> {
  const started = Date.now();
  const resolved = filters ?? parseRequestFilters(message, context);
  const result = await searchCatalog(resolved);
  const agentResult = toAgentSearchResult(
    result,
    "fallback",
    Date.now() - started,
    reason,
  );
  return {
    result: agentResult,
    text: fallbackText(agentResult, reason),
  };
}
