import { tool } from "ai";
import { z } from "zod";
import { getSellerCheckView } from "@/server/seller/view";
import type { AgentToolContext } from "./context";

export const getSellerCheckStatusInputSchema = z.object({
  token: z.string().regex(/^(?:lnk|sim)_[a-zA-Z0-9_-]{16,64}$/),
});

export function getSellerCheckStatusTool(context: AgentToolContext) {
  return tool({
    description:
      "وضعیت یک درخواست تأیید فروشنده را با پاسخ اخیر و گزینه‌های جایگزین برمی‌گرداند. بعد از ساخت درخواست یا وقتی کاربر می‌پرسد فروشنده پاسخ داده، صدا بزن.",
    inputSchema: getSellerCheckStatusInputSchema,
    execute: async ({ token }) => {
      try {
        const view = await getSellerCheckView(token);
        if (!view) return { ok: false, error: "این درخواست پیدا نشد." };
        const summary = {
          token: view.token,
          status: view.status,
          shopName: view.shop.name,
          productTitle: view.product.titleFa,
          linkPath: view.linkPath,
          observation: view.latestObservation,
          alternatives: view.alternatives.map((alternative) => ({
            offerId: alternative.offerId,
            title: alternative.productTitle,
            shopName: alternative.shopName,
            priceToman: alternative.priceToman,
            stockStatus: alternative.stockStatus,
            reason: alternative.reason,
          })),
          note:
            view.status === "expired"
              ? "پاسخی نرسیده است؛ جایگزین‌ها را پیشنهاد بده."
              : view.latestObservation?.stockStatus === "out_of_stock"
                ? "فروشنده ناموجود اعلام کرده است؛ جایگزین پیشنهاد بده."
                : "وضعیت را از پاسخ فروشنده گزارش کن.",
        };
        context.sellerChecks = [
          {
            token: view.token,
            status: view.status,
            simulated: view.simulated,
            createdAt: view.createdAt,
            answeredAt: view.answeredAt,
            shopName: view.shop.name,
            productTitle: view.product.titleFa,
            offerId: view.offer.id,
            priceToman: view.offer.priceToman,
            linkPath: view.linkPath,
          },
        ];
        if (view.alternatives.length > 0) {
          context.alternatives = view.alternatives;
        }
        return { ok: true, ...summary };
      } catch {
        return {
          ok: false,
          error: "دریافت وضعیت درخواست تأیید ممکن نشد.",
        };
      }
    },
  });
}
