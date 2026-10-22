import { tool } from "ai";
import { z } from "zod";
import { searchCatalog } from "@/server/search";
import { compactOfferShops } from "../compact";
import { mergeAgentFilters } from "../filters";
import type { AgentToolContext } from "./context";

export const findShopsInputSchema = z.object({
  query: z.string().min(1).max(100),
  district: z.string().max(60).optional(),
  openNow: z.boolean().optional(),
  sort: z.enum(["relevance", "price", "distance"]).optional(),
});

export function createFindShopsTool(context: AgentToolContext) {
  return tool({
    description:
      "لیست فروشگاه‌های یک محصول را با قیمت، فاصله و وضعیت باز بودن برمی‌گرداند. وقتی کاربر می‌پرسد «کجا موجوده؟» یا «کدوم فروشگاه؟» از این ابزار استفاده کن.",
    inputSchema: findShopsInputSchema,
    execute: async (input) => {
      const filters = mergeAgentFilters(
        {
          q: input.query,
          district: input.district,
          openNow: input.openNow,
          sort: input.sort ?? "distance",
        },
        context.baseFilters,
      );

      try {
        const result = await searchCatalog(filters);
        const group = result.groups[0];
        if (!group) {
          return {
            ok: false,
            error: "برای این محصول فروشگاهی در محدودهٔ انتخابی پیدا نشد.",
          };
        }

        if (!context.search) {
          context.search = { filters, result };
          context.lastAction = "search";
        }
        context.shops = compactOfferShops(group.offers);
        return {
          ok: true,
          productId: group.product.id,
          title: group.product.titleFa,
          shops: context.shops,
          note: "قیمت و موجودی را قبل از مراجعه از فروشنده تأیید کن.",
        };
      } catch {
        return { ok: false, error: "دریافت فهرست فروشگاه‌ها ممکن نشد." };
      }
    },
  });
}
