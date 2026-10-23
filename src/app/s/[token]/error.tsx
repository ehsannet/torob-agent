"use client";

import { RouteError } from "@/components/ui/route-error";

export default function SellerErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      error={error}
      reset={reset}
      title="درخواست باز نشد"
      description="لینک فروشنده در دسترس نیست یا داده‌ها موقتاً قطع شده‌اند. دوباره تلاش کن."
      backHref="/"
      backLabel="بازگشت به خانه"
    />
  );
}
