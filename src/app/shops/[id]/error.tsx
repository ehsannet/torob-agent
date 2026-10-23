"use client";

import { RouteError } from "@/components/ui/route-error";

export default function ShopErrorPage({
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
      title="فروشگاه باز نشد"
      description="اطلاعات این فروشگاه در دسترس نیست. یک بار دیگر تلاش کن یا از نتایج جست‌وجو فروشگاه دیگری انتخاب کن."
    />
  );
}
