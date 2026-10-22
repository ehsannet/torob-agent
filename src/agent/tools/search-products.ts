import { tool } from "ai";
import { z } from "zod";
import { searchCatalog } from "@/server/search";
import { compactGroups } from "../compact";
import { mergeAgentFilters } from "../filters";
import type { AgentToolContext } from "./context";

export const searchProductsInputSchema = z.object({
  q: z.string().max(100).optional().default(""),
  category: z.string().max(60).optional(),
  minPrice: z.coerce.number().int().min(0).max(1_000_000_000_000).optional(),
  maxPrice: z.coerce.number().int().min(0).max(1_000_000_000_000).optional(),
  district: z.string().max(60).optional(),
  openNow: z.boolean().optional(),
  torobPay: z.boolean().optional(),
  installments: z.boolean().optional(),
  kalabarg: z.boolean().optional(),
  fastDelivery: z.boolean().optional(),
  sort: z.enum(["relevance", "price", "distance", "newest"]).optional(),
  radiusKm: z.number().min(0.5).max(30).optional(),
});

export type SearchProductsInput = z.infer<typeof searchProductsInputSchema>;

function appliedFilters(filters: ReturnType<typeof mergeAgentFilters>) {
  return {
    q: filters.q,
    category: filters.category,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    district: filters.district,
    openNow: filters.openNow,
    torobPay: filters.torobPay,
    installments: filters.installments,
    kalabarg: filters.kalabarg,
    fastDelivery: filters.fastDelivery,
    sort: filters.sort,
  };
}

export function createSearchProductsTool(context: AgentToolContext) {
  return tool({
    description:
      "جست‌وجوی محصولات در فروشگاه‌های حضوری تهران. برای هر درخواست خرید یک بار با فیلترهای استخراج‌شده از جمله متن، دسته، بودجهٔ تومانی، محله و شرایط صدا بزن. خروجی شامل گروه محصول، قیمت‌های ثبت‌شده، تعداد فروشگاه، فاصله و دلیل شفاف است.",
    inputSchema: searchProductsInputSchema,
    execute: async (input: SearchProductsInput) => {
      const filters = mergeAgentFilters(input, context.baseFilters);
      try {
        const result = await searchCatalog(filters);
        context.search = { filters, result };
        context.error = null;
        context.lastAction = "search";

        return {
          ok: true,
          totalGroups: result.totalGroups,
          totalOffers: result.totalOffers,
          appliedFilters: appliedFilters(filters),
          products: compactGroups(result.groups, 5),
          note: "قیمت‌ها ثبت‌شده‌اند و موجودی فقط در صورت تأیید فروشنده مشخص است.",
        };
      } catch (error) {
        context.error =
          error instanceof Error ? error.message : "search_failed";
        return {
          ok: false,
          error: "جست‌وجوی فروشگاه‌ها انجام نشد. فیلترها را ساده‌تر کن.",
        };
      }
    },
  });
}
