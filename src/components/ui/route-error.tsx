"use client";

import Link from "next/link";
import { useEffect } from "react";
import { StoreIcon } from "@/components/ui/icons";
import { PageStatus } from "./page-status";

type RouteErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
};

export function RouteError({
  error,
  reset,
  title = "این صفحه باز نشد",
  description = "ارتباط با داده‌ها برقرار نشد. یک بار دیگر تلاش کن؛ اگر ادامه داشت به جست‌وجو برگرد.",
  backHref = "/search",
  backLabel = "بازگشت به جست‌وجو",
}: RouteErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageStatus
      eyebrow="خطای موقت"
      title={title}
      description={description}
      icon={<StoreIcon className="size-6" />}
      actions={
        <>
          <button
            type="button"
            onClick={reset}
            className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600"
          >
            تلاش دوباره
          </button>
          <Link
            href={backHref}
            className="rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-muted transition hover:border-brand-200 hover:text-brand-700"
          >
            {backLabel}
          </Link>
        </>
      }
    />
  );
}
