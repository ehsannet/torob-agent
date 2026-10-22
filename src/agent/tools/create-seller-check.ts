import { tool } from "ai";
import { z } from "zod";
import { createSellerChecks } from "@/server/seller/checks";
import type { AgentToolContext } from "./context";

export const createSellerCheckInputSchema = z.object({
  offerIds: z
    .array(z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/))
    .min(1)
    .max(5),
  sessionId: z
    .string()
    .regex(/^[a-zA-Z0-9_-]{8,80}$/)
    .optional(),
});

export function createSellerCheckTool(context: AgentToolContext) {
  return tool({
    description:
      "برای یک محصول، برای ۱ تا ۵ فروشگاه درخواست تأیید قیمت و موجودی می‌سازد. فقط وقتی کاربر صریحاً می‌خواهد از فروشنده بپرسد یا تأیید بگیرد. offerIds را فقط از خروجی find_shops بردار. خروجی لینک اختصاصی هر درخواست و وضعیت اولیه است.",
    inputSchema: createSellerCheckInputSchema,
    execute: async (input) => {
      if (context.sellerChecks.length > 0) {
        return {
          ok: true,
          cached: true,
          checks: context.sellerChecks.map((check) => ({
            token: check.token,
            shopName: check.shopName,
            status: check.status,
            linkPath: check.linkPath,
          })),
          note: "درخواست‌های این گفتگو قبلاً ساخته شده‌اند.",
        };
      }
      try {
        const result = await createSellerChecks(
          input.offerIds,
          input.sessionId,
        );
        context.sellerChecks = result.checks;
        return {
          ok: true,
          demoMode: result.demoMode,
          checks: result.checks.map((check) => ({
            token: check.token,
            shopName: check.shopName,
            productTitle: check.productTitle,
            status: check.status,
            simulated: check.simulated,
            linkPath: check.linkPath,
          })),
          skipped: result.skipped,
          note: result.demoMode
            ? "حالت دمو فعال است؛ پاسخ فروشنده شبیه‌سازی می‌شود."
            : "لینک‌ها را برای فروشنده بفرست؛ موجودی تا پاسخ او تأییدشده نیست.",
        };
      } catch {
        return {
          ok: false,
          error: "ساخت درخواست تأیید فروشنده ممکن نشد.",
        };
      }
    },
  });
}
