import { tool } from "ai";
import { z } from "zod";
import { compareProducts } from "@/server/compare";
import { searchCatalog } from "@/server/search";
import { compactGroups } from "../compact";
import { mergeAgentFilters } from "../filters";
import type { AgentToolContext } from "./context";

export const compareProductsInputSchema = z.object({
  queries: z.array(z.string().min(1).max(100)).min(2).max(4).optional(),
  ids: z
    .array(z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/))
    .min(2)
    .max(4)
    .optional(),
});

export function createCompareProductsTool(context: AgentToolContext) {
  return tool({
    description:
      "مقایسهٔ ۲ تا ۴ محصول. برای مقایسه با نام، queries را با نام دقیق هر محصول بده (مثلاً [\"PlayStation 5\", \"Xbox Series X\"]). ids را فقط وقتی بده که شناسهٔ product-xxxxx را از نتیجهٔ ابزار قبلی داری. خروجی پیشنهاد قاعده‌محور و دلیل‌های داده‌ای است.",
    inputSchema: compareProductsInputSchema,
    execute: async ({ queries, ids }) => {
      const collected = new Set(ids ?? []);

      for (const query of queries ?? []) {
        const filters = mergeAgentFilters({ q: query.slice(0, 100) }, context.baseFilters);
        try {
          const search = await searchCatalog({ ...filters, limit: 3 });
          const top = search.groups[0];
          if (top) collected.add(top.product.id);
        } catch {
          return { ok: false, error: "جست‌وجوی یکی از محصولات مقایسه ممکن نشد." };
        }
      }

      const unique = Array.from(collected).slice(0, 4);
      if (unique.length < 2) {
        return {
          ok: false,
          error: "برای مقایسه حداقل دو محصول متمایز لازم است.",
        };
      }

      try {
        const result = await compareProducts(unique, context.baseFilters);
        if (result.groups.length < 2) {
          return {
            ok: false,
            error: "یکی از محصولات انتخاب‌شده در این محدوده پیدا نشد.",
          };
        }
        context.compare = { filters: context.baseFilters, result };
        context.lastAction = "compare";
        return {
          ok: true,
          groups: compactGroups(result.groups, 4),
          recommendation: result.recommendation,
          note: "پیشنهاد فقط بر اساس داده‌های ثبت‌شده است؛ موجودی تأییدنشده را موجود فرض نکن.",
        };
      } catch {
        return { ok: false, error: "مقایسه انجام نشد. دوباره تلاش کن." };
      }
    },
  });
}
