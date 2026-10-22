"use client";

import Link from "next/link";
import { compareHref } from "@/lib/compare-params";
import { formatNumber } from "@/lib/price";
import type { SearchFilters } from "@/lib/search-types";
import { CloseIcon, ScaleIcon } from "@/components/ui/icons";
import { useCompare } from "./compare-provider";

export function CompareBar({ filters }: { filters: SearchFilters }) {
  const { selected, clear } = useCompare();
  if (selected.length === 0) return null;

  const ready = selected.length >= 2;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto flex w-full max-w-lg items-center gap-3 rounded-2xl border border-ink/10 bg-ink px-3 py-2.5 text-white shadow-2xl shadow-ink/25">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10">
          <ScaleIcon className="size-5" />
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="text-xs font-bold">
            {ready
              ? `${formatNumber(selected.length)} محصول انتخاب شده`
              : "یک محصول دیگر انتخاب کن"}
          </p>
          <p className="mt-0.5 truncate text-[10px] text-white/60">
            {ready
              ? "قیمت، فاصله و شفافیت را کنار هم ببین"
              : "برای مقایسه حداقل دو محصول لازم است"}
          </p>
        </div>
        {ready ? (
          <Link
            href={compareHref(selected, filters)}
            className="shrink-0 rounded-xl bg-brand-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-brand-600"
          >
            مقایسه
          </Link>
        ) : (
          <span className="shrink-0 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white/50">
            مقایسه
          </span>
        )}
        <button
          type="button"
          onClick={clear}
          aria-label="پاک کردن انتخاب‌ها"
          className="grid size-8 shrink-0 place-items-center rounded-lg text-white/50 transition hover:bg-white/10 hover:text-white"
        >
          <CloseIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}
