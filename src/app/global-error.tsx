"use client";

import { RouteError } from "@/components/ui/route-error";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <RouteError error={error} reset={reset} backHref="/" backLabel="بازگشت به خانه" />
      </body>
    </html>
  );
}
