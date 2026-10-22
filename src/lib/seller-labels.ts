import type { SellerCheckStatus } from "./seller-types";

export const SELLER_STATUS_LABELS: Record<SellerCheckStatus, string> = {
  created: "ساخته شد",
  sent: "در انتظار پاسخ",
  answered: "پاسخ داده شد",
  expired: "بدون پاسخ",
};

export const SELLER_STATUS_CLASSES: Record<SellerCheckStatus, string> = {
  created: "bg-page text-muted",
  sent: "bg-warning/10 text-warning",
  answered: "bg-success/10 text-success",
  expired: "bg-danger/10 text-danger",
};
