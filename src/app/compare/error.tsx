"use client";

import { RouteError } from "@/components/ui/route-error";

export default function CompareErrorPage({
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
      title="مقایسه ممکن نشد"
      backLabel="بازگشت به نتایج"
    />
  );
}
