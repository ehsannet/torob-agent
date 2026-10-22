import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeftIcon, SparkIcon } from "./icons";

type BrandHeaderProps = {
  backHref?: string;
  backLabel?: string;
  children?: ReactNode;
};

export function BrandHeader({
  backHref,
  backLabel = "بازگشت",
  children,
}: BrandHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {backHref ? (
          <Link
            href={backHref}
            aria-label={backLabel}
            className="grid size-10 place-items-center rounded-2xl border border-line bg-surface text-muted transition hover:text-ink"
          >
            <ChevronLeftIcon className="size-5 rotate-180" />
          </Link>
        ) : (
          <span
            aria-hidden="true"
            className="grid size-11 place-items-center rounded-2xl bg-brand-500 text-2xl font-black text-white shadow-sm shadow-brand-500/25"
          >
            ت
          </span>
        )}
        <Link href="/" className="leading-tight">
          <span className="block text-lg font-extrabold">ترب‌یار</span>
          <span className="block text-[11px] text-muted">دستیار خرید حضوری</span>
        </Link>
      </div>
      <div className="flex items-center gap-2">
        {children}
        <Link
          href="/assistant"
          className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-white/70 px-2.5 py-1 text-[10px] font-bold text-brand-700"
        >
          <SparkIcon className="size-3" />
          دستیار
        </Link>
        <span className="rounded-full border border-brand-200 bg-white/70 px-2.5 py-1 text-[10px] font-semibold text-brand-700">
          فاز ۴
        </span>
      </div>
    </header>
  );
}
