import { tool } from "ai";
import { z } from "zod";
import { loadAlternativesForOffer } from "@/server/seller/alternatives";
import { getSellerCheckView } from "@/server/seller/view";
import type { AgentToolContext } from "./context";

export const suggestAlternativesInputSchema = z
  .object({
    offerId: z
      .string()
      .regex(/^[a-zA-Z0-9_-]{1,64}$/)
      .optional(),
    token: z
      .string()
      .regex(/^(?:lnk|sim)_[a-zA-Z0-9_-]{16,64}$/)
      .optional(),
  })
  .refine((value) => Boolean(value.offerId || value.token), {
    message: "offerId یا token لازم است.",
  });

export function suggestAlternativesTool(context: AgentToolContext) {
  return tool({
    description:
      "برای آفر ناموجود یا بی‌پاسخ، جایگزین‌های همان محصول در فروشگاه‌های دیگر و محصولات مشابه را با دلیل برمی‌گرداند. از offerId خروجی find_shops یا token درخواست استفاده کن.",
    inputSchema: suggestAlternativesInputSchema,
    execute: async ({ offerId, token }) => {
      try {
        let alternatives = null;
        if (token) {
          const view = await getSellerCheckView(token);
          alternatives = view?.alternatives ?? null;
        } else if (offerId) {
          alternatives = await loadAlternativesForOffer(offerId);
        }
        if (!alternatives) {
          return { ok: false, error: "آفر یا درخواست پیدا نشد." };
        }
        context.alternatives = alternatives;
        return {
          ok: true,
          alternatives: alternatives.map((alternative) => ({
            offerId: alternative.offerId,
            title: alternative.productTitle,
            shopName: alternative.shopName,
            priceToman: alternative.priceToman,
            stockStatus: alternative.stockStatus,
            openLabel: alternative.openLabel,
            distanceKm: alternative.distanceKm,
            reason: alternative.reason,
          })),
          note: "این گزینه‌ها از دادهٔ ثبت‌شده‌اند و موجودی‌شان تأیید نشده است.",
        };
      } catch {
        return { ok: false, error: "ساخت گزینه‌های جایگزین ممکن نشد." };
      }
    },
  });
}
