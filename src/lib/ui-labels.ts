import type { OpenState } from "./opening-hours";
import type { ProductGroup, StockStatus } from "./search-types";
import { formatNumber } from "./price";

export const FEATURE_LABELS = {
  torobPay: "پرداخت توروب",
  installments: "خرید اقساطی",
  kalabarg: "کالابارگ",
  fastDelivery: "ارسال سریع",
} as const;

export const OPEN_LABELS: Record<OpenState, string> = {
  open: "باز است",
  closing_soon: "به‌زودی می‌بندد",
  closed: "بسته است",
  unknown: "ساعت نامشخص",
};

export const OPEN_CLASSES: Record<OpenState, string> = {
  open: "border-success/20 bg-success/10 text-success",
  closing_soon: "border-warning/20 bg-warning/10 text-warning",
  closed: "border-line bg-page text-muted",
  unknown: "border-line bg-page text-muted",
};

export const STOCK_LABELS: Record<StockStatus, string> = {
  in_stock: "موجود (تأییدشده)",
  out_of_stock: "ناموجود (تأییدشده)",
  unknown: "نامشخص",
};

export const STOCK_CLASSES: Record<StockStatus, string> = {
  in_stock: "text-success",
  out_of_stock: "text-danger",
  unknown: "text-muted",
};

export const CATEGORY_ACCENTS: Record<string, string> = {
  "گوشی موبایل": "from-sky-100 to-sky-50 text-sky-700",
  "لپ تاپ و نوت بوک": "from-indigo-100 to-indigo-50 text-indigo-700",
  "هدفون، هدست و هندزفری": "from-fuchsia-100 to-fuchsia-50 text-fuchsia-700",
  "ساعت و مچ بند هوشمند": "from-emerald-100 to-emerald-50 text-emerald-700",
  "کنسول بازی  PS5": "from-violet-100 to-violet-50 text-violet-700",
  "تلویزیون": "from-amber-100 to-amber-50 text-amber-700",
  "دوربین عکاسی و فیلمبرداری": "from-rose-100 to-rose-50 text-rose-700",
  "دوربین مدار بسته": "from-teal-100 to-teal-50 text-teal-700",
};

export function categoryAccent(category: string): string {
  return (
    CATEGORY_ACCENTS[category] ??
    "from-brand-100 to-brand-50 text-brand-700"
  );
}

export function categoryInitial(category: string): string {
  return category.trim().charAt(0) || "ت";
}

export function summarizeStock(group: ProductGroup): string {
  if (group.confirmedStockCount > 0) {
    return `${formatNumber(group.confirmedStockCount)} تأیید موجودی`;
  }
  if (group.confirmedCount > 0) {
    return "تأییدشده، بدون موجودی";
  }
  return "موجودی نامشخص";
}
