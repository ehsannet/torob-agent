import Link from "next/link";
import { formatNumber, formatToman } from "@/lib/price";
import { searchHref } from "@/lib/search-params";
import type { SearchFilters } from "@/lib/search-types";
import { getDistrict } from "@/lib/tehran";
import { CloseIcon } from "@/components/ui/icons";

type ActiveFiltersProps = {
  filters: SearchFilters;
};

type Chip = {
  key: string;
  label: string;
  href: string;
};

export function ActiveFilters({ filters }: ActiveFiltersProps) {
  const district = getDistrict(filters.district);
  const chips: Chip[] = [];

  if (filters.category) {
    chips.push({
      key: "category",
      label: filters.category,
      href: searchHref(filters, { category: null, page: 1 }),
    });
  }

  if (filters.minPrice !== null || filters.maxPrice !== null) {
    const label =
      filters.minPrice !== null && filters.maxPrice !== null
        ? `${formatToman(filters.minPrice)} تا ${formatToman(filters.maxPrice)}`
        : filters.minPrice !== null
          ? `از ${formatToman(filters.minPrice)}`
          : `تا ${formatToman(filters.maxPrice)}`;
    chips.push({
      key: "budget",
      label,
      href: searchHref(filters, {
        minPrice: null,
        maxPrice: null,
        page: 1,
      }),
    });
  }

  if (district) {
    chips.push({
      key: "district",
      label: district.name,
      href: searchHref(filters, { district: null, page: 1 }),
    });
  }

  if (filters.lat !== null) {
    chips.push({
      key: "near",
      label: `نزدیک من · ${formatNumber(filters.radiusKm)} کیلومتر`,
      href: searchHref(filters, { lat: null, lng: null, page: 1 }),
    });
  }

  const features: Array<
    [
      "openNow" | "torobPay" | "installments" | "kalabarg" | "fastDelivery",
      string,
    ]
  > = [
    ["openNow", "همین حالا باز"],
    ["torobPay", "پرداخت توروب"],
    ["installments", "اقساطی"],
    ["kalabarg", "کالابارگ"],
    ["fastDelivery", "ارسال سریع"],
  ];

  for (const [key, label] of features) {
    if (filters[key] === true) {
      chips.push({
        key,
        label,
        href: searchHref(filters, { [key]: false, page: 1 }),
      });
    }
  }

  if (chips.length === 0) return null;

  const clearAll = searchHref(filters, {
    category: null,
    minPrice: null,
    maxPrice: null,
    district: null,
    lat: null,
    lng: null,
    radiusKm: 5,
    openNow: false,
    torobPay: false,
    installments: false,
    kalabarg: false,
    fastDelivery: false,
    sort: "relevance",
    page: 1,
  });

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((chip) => (
        <Link
          key={chip.key}
          href={chip.href}
          scroll={false}
          className="flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-2 py-1 text-[10px] font-semibold text-brand-700"
        >
          {chip.label}
          <CloseIcon className="size-3" />
        </Link>
      ))}
      {chips.length > 1 ? (
        <Link
          href={clearAll}
          scroll={false}
          className="px-1 text-[10px] font-semibold text-muted underline underline-offset-4"
        >
          پاک کردن همه
        </Link>
      ) : null}
    </div>
  );
}
