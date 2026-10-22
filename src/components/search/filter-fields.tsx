"use client";

import type { CategoryFacet, SearchFilters, SortKey } from "@/lib/search-types";
import { toEnglishDigits } from "@/lib/persian";
import { formatNumber } from "@/lib/price";
import { TEHRAN_DISTRICTS } from "@/lib/tehran";
import { cn } from "@/lib/cn";

export const inputClass =
  "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100";

const SORT_LABELS: Record<SortKey, string> = {
  relevance: "مرتبط‌ترین",
  price: "ارزان‌ترین",
  distance: "نزدیک‌ترین",
  newest: "به‌روزترین قیمت",
};

export function parseBudget(value: string): number | null {
  const normalized = toEnglishDigits(value).replace(/[,\s٬،]/g, "");
  if (!normalized) return null;
  if (!/^\d+$/.test(normalized)) return NaN;
  return Number(normalized);
}

function FeatureToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex items-center justify-between rounded-xl border px-3 py-2.5 text-xs font-semibold transition",
        checked
          ? "border-brand-300 bg-brand-50 text-brand-700"
          : "border-line bg-white text-muted",
      )}
    >
      {label}
      <span
        className={cn(
          "relative h-4 w-7 rounded-full transition",
          checked ? "bg-brand-500" : "bg-line",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-3 rounded-full bg-white shadow-sm transition-all",
            checked ? "right-0.5" : "right-3.5",
          )}
        />
      </span>
    </button>
  );
}

export function SortField({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (value: SortKey) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold">ترتیب نمایش</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as SortKey)}
        className={inputClass}
      >
        {Object.entries(SORT_LABELS).map(([sort, label]) => (
          <option key={sort} value={sort}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function CategoryField({
  value,
  categories,
  onChange,
}: {
  value: string | null;
  categories: CategoryFacet[];
  onChange: (value: string | null) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold">دستهٔ کالا</p>
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => onChange(null)}
          className={cn(
            "rounded-xl border px-2.5 py-2 text-right text-[11px] transition",
            value === null
              ? "border-brand-300 bg-brand-50 font-bold text-brand-700"
              : "border-line bg-white text-muted",
          )}
        >
          همه
        </button>
        {categories.map((category) => (
          <button
            key={category.value}
            type="button"
            onClick={() => onChange(category.value)}
            className={cn(
              "flex items-center justify-between gap-1 rounded-xl border px-2.5 py-2 text-[11px] transition",
              value === category.value
                ? "border-brand-300 bg-brand-50 font-bold text-brand-700"
                : "border-line bg-white text-muted",
            )}
          >
            <span>{category.label}</span>
            <span className="text-[9px] opacity-60">
              {formatNumber(category.count)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function BudgetField({
  minText,
  maxText,
  onMinChange,
  onMaxChange,
}: {
  minText: string;
  maxText: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold">بودجه (تومان)</p>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-[10px] text-muted">از</span>
          <input
            inputMode="numeric"
            value={minText}
            onChange={(event) => onMinChange(event.target.value)}
            placeholder="مثلاً ۱۰٬۰۰۰٬۰۰۰"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] text-muted">تا</span>
          <input
            inputMode="numeric"
            value={maxText}
            onChange={(event) => onMaxChange(event.target.value)}
            placeholder="مثلاً ۵۰٬۰۰۰٬۰۰۰"
            className={inputClass}
          />
        </label>
      </div>
    </div>
  );
}

export function DistrictField({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold">محله</p>
      <select
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value || null)}
        className={inputClass}
      >
        <option value="">همهٔ تهران</option>
        {TEHRAN_DISTRICTS.map((district) => (
          <option key={district.slug} value={district.slug}>
            {district.name}
          </option>
        ))}
      </select>
    </div>
  );
}

type FeatureKey =
  | "openNow"
  | "torobPay"
  | "installments"
  | "kalabarg"
  | "fastDelivery";

const FEATURES: { key: FeatureKey; label: string }[] = [
  { key: "openNow", label: "همین حالا باز" },
  { key: "torobPay", label: "پرداخت توروب" },
  { key: "installments", label: "خرید اقساطی" },
  { key: "kalabarg", label: "کالابارگ" },
  { key: "fastDelivery", label: "ارسال سریع" },
];

export function FeaturesField({
  filters,
  onChange,
}: {
  filters: SearchFilters;
  onChange: (patch: Partial<SearchFilters>) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold">شرایط خرید</p>
      <div className="grid grid-cols-2 gap-1.5">
        {FEATURES.map((feature) => (
          <FeatureToggle
            key={feature.key}
            label={feature.label}
            checked={filters[feature.key]}
            onChange={(checked) =>
              onChange({ [feature.key]: checked } as Pick<
                SearchFilters,
                FeatureKey
              >)
            }
          />
        ))}
      </div>
    </div>
  );
}
