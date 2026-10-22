"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { countActiveFilters, searchHref } from "@/lib/search-params";
import type { CategoryFacet, SearchFilters } from "@/lib/search-types";
import { formatNumber } from "@/lib/price";
import { CloseIcon, FilterIcon } from "@/components/ui/icons";
import {
  BudgetField,
  CategoryField,
  DistrictField,
  FeaturesField,
  SortField,
  parseBudget,
} from "./filter-fields";
import { LocationField } from "./filter-location";

type FilterSheetProps = {
  filters: SearchFilters;
  categories: CategoryFacet[];
  totalGroups: number;
};

export function FilterSheet({
  filters,
  categories,
  totalGroups,
}: FilterSheetProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<SearchFilters>(filters);
  const [minText, setMinText] = useState(
    filters.minPrice === null ? "" : String(filters.minPrice),
  );
  const [maxText, setMaxText] = useState(
    filters.maxPrice === null ? "" : String(filters.maxPrice),
  );
  const [error, setError] = useState<string | null>(null);
  const [geoMessage, setGeoMessage] = useState<string | null>(null);
  const [geoBusy, setGeoBusy] = useState(false);

  const activeCount = useMemo(() => countActiveFilters(filters), [filters]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function update(patch: Partial<SearchFilters>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function openSheet() {
    setDraft(filters);
    setMinText(filters.minPrice === null ? "" : String(filters.minPrice));
    setMaxText(filters.maxPrice === null ? "" : String(filters.maxPrice));
    setError(null);
    setOpen(true);
  }

  function resetAll() {
    const next = {
      ...filters,
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
      sort: "relevance" as const,
      page: 1,
    };
    setOpen(false);
    router.push(searchHref(next));
  }

  function locateMe() {
    if (!navigator.geolocation) {
      setGeoMessage("مرورگر از موقعیت مکانی پشتیبانی نمی‌کند.");
      return;
    }
    setGeoBusy(true);
    setGeoMessage(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        update({
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
          district: null,
          radiusKm: Math.max(draft.radiusKm, 3),
        });
        setGeoBusy(false);
      },
      () => {
        setGeoMessage("دسترسی به موقعیت ممکن نشد؛ محله را دستی انتخاب کن.");
        setGeoBusy(false);
      },
      { enableHighAccuracy: false, timeout: 8_000, maximumAge: 60_000 },
    );
  }

  function apply() {
    const minPrice = parseBudget(minText);
    const maxPrice = parseBudget(maxText);
    if (Number.isNaN(minPrice) || Number.isNaN(maxPrice)) {
      setError("بودجه را فقط با عدد وارد کن.");
      return;
    }
    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
      setError("حداقل بودجه نباید بیشتر از حداکثر باشد.");
      return;
    }

    const next: SearchFilters = {
      ...draft,
      minPrice,
      maxPrice,
      category: draft.category || null,
      district: draft.district || null,
      page: 1,
    };
    setOpen(false);
    router.push(searchHref(next));
  }

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        className="flex shrink-0 items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-2.5 text-xs font-bold text-ink shadow-sm transition hover:border-brand-200"
      >
        <FilterIcon className="size-4 text-brand-600" />
        فیلترها
        {activeCount > 0 ? (
          <span className="grid size-5 place-items-center rounded-full bg-brand-500 text-[9px] text-white">
            {formatNumber(activeCount)}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <button
            type="button"
            aria-label="بستن فیلترها"
            onClick={() => setOpen(false)}
            className="absolute inset-0 animate-[fade-in_150ms_ease-out] bg-ink/40 backdrop-blur-[2px]"
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="filter-title"
            className="relative flex max-h-[92dvh] w-full max-w-lg animate-[sheet-in_180ms_ease-out] flex-col overflow-hidden rounded-t-3xl border border-line bg-surface shadow-2xl sm:rounded-3xl"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <div>
                <h2 id="filter-title" className="text-sm font-extrabold">
                  فیلتر و مرتب‌سازی
                </h2>
                <p className="mt-0.5 text-[10px] text-muted">
                  {formatNumber(totalGroups)} محصول در نتایج فعلی
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="بستن"
                className="grid size-9 place-items-center rounded-xl bg-page text-muted transition hover:text-ink"
              >
                <CloseIcon className="size-4" />
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                apply();
              }}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
                <SortField
                  value={draft.sort}
                  onChange={(sort) => update({ sort })}
                />

                <CategoryField
                  value={draft.category}
                  categories={categories}
                  onChange={(category) => update({ category })}
                />

                <BudgetField
                  minText={minText}
                  maxText={maxText}
                  onMinChange={setMinText}
                  onMaxChange={setMaxText}
                />

                <DistrictField
                  value={draft.district}
                  onChange={(district) =>
                    update({ district, lat: null, lng: null })
                  }
                />

                <LocationField
                  lat={draft.lat}
                  radiusKm={draft.radiusKm}
                  busy={geoBusy}
                  message={geoMessage}
                  onLocate={locateMe}
                  onClear={() => update({ lat: null, lng: null, radiusKm: 5 })}
                  onRadiusChange={(radiusKm) => update({ radiusKm })}
                />

                <FeaturesField filters={draft} onChange={update} />

                {error ? (
                  <p className="rounded-xl bg-danger/10 px-3 py-2 text-[11px] text-danger">
                    {error}
                  </p>
                ) : null}
              </div>

              <div className="flex items-center gap-2 border-t border-line bg-surface px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <button
                  type="button"
                  onClick={resetAll}
                  className="rounded-xl border border-line px-3 py-2.5 text-xs font-semibold text-muted"
                >
                  پاک کردن
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-extrabold text-white transition hover:bg-brand-600"
                >
                  نمایش نتایج
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
