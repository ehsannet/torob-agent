import { tool } from "ai";
import { z } from "zod";
import {
  getVisitPlanForOffer,
  getVisitPlanForShop,
} from "@/server/shop-detail";
import type { AgentToolContext } from "./context";

export const getVisitPlanSchema = z
  .object({
    offerId: z
      .string()
      .regex(/^[a-zA-Z0-9_-]{1,64}$/)
      .optional(),
    shopId: z
      .string()
      .regex(/^[a-zA-Z0-9_-]{1,64}$/)
      .optional(),
  })
  .refine((value) => Boolean(value.offerId || value.shopId), {
    message: "offerId یا shopId لازم است.",
  });

export function getVisitPlanTool(context: AgentToolContext) {
  return tool({
    description:
      "برنامهٔ بازدید حضوری یک آفر یا فروشگاه را می‌سازد: نشانی ساختاریافته، مسیریابی، وضعیت باز بودن، ساعت کاری و هشدارهای قبل از مراجعه. بعد از find_shops از offerId یا shopId خروجی استفاده کن.",
    inputSchema: getVisitPlanSchema,
    execute: async ({ offerId, shopId }) => {
      try {
        const plan = offerId
          ? await getVisitPlanForOffer(offerId)
          : shopId
            ? await getVisitPlanForShop(shopId)
            : null;
        if (!plan) {
          return { ok: false, error: "فروشگاه یا آفر پیدا نشد." };
        }

        context.visitPlans = [
          ...context.visitPlans.filter(
            (item) => item.shopId !== plan.shopId,
          ),
          plan,
        ];
        return {
          ok: true,
          shop: {
            id: plan.shopId,
            name: plan.shopName,
            address: plan.addressLine,
            addressNote: plan.addressText,
            routeUrl: plan.routeUrl,
            openState: plan.openState,
            openLabel: plan.openLabel,
            closesAt: plan.closesAt,
            hoursConfirmed: Boolean(plan.hoursConfirmedAt),
            approximateAddress: plan.approximateAddress,
          },
          product: plan.productTitle,
          offer: plan.offerId
            ? { id: plan.offerId, priceToman: plan.priceToman }
            : null,
          warnings: plan.warnings.map((warning) => warning.label),
          note: "قیمت و موجودی ثبت‌شده را قبل از حرکت از فروشنده تأیید کن.",
        };
      } catch {
        return { ok: false, error: "ساخت برنامهٔ بازدید ممکن نشد." };
      }
    },
  });
}
