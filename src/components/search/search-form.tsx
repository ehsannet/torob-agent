import { cn } from "@/lib/cn";
import type { SearchFilters } from "@/lib/search-types";
import { SearchIcon } from "@/components/ui/icons";

type SearchFormProps = {
  defaultValue?: string;
  compact?: boolean;
  preserve?: SearchFilters;
};

export function SearchForm({
  defaultValue = "",
  compact = false,
  preserve,
}: SearchFormProps) {
  return (
    <form action="/search" role="search" className="relative">
      {preserve?.district ? (
        <input type="hidden" name="district" value={preserve.district} />
      ) : null}
      {preserve && preserve.lat !== null && preserve.lng !== null ? (
        <>
          <input type="hidden" name="lat" value={preserve.lat} />
          <input type="hidden" name="lng" value={preserve.lng} />
          <input type="hidden" name="radiusKm" value={preserve.radiusKm} />
        </>
      ) : null}
      <SearchIcon
        className={cn(
          "pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted",
          compact ? "size-4" : "size-5",
        )}
      />
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="مثلاً iPhone 15 یا گوشی سامسونگ"
        aria-label="جست‌وجوی محصول"
        className={cn(
          "w-full rounded-2xl border border-line bg-surface pr-11 pl-24 text-ink shadow-sm outline-none transition placeholder:text-muted/70 focus:border-brand-300 focus:ring-4 focus:ring-brand-100",
          compact ? "h-11 text-sm" : "h-14 text-base",
        )}
      />
      <button
        type="submit"
        className={cn(
          "absolute left-1.5 top-1/2 -translate-y-1/2 rounded-xl bg-brand-500 font-bold text-white transition hover:bg-brand-600",
          compact ? "px-3 py-2 text-[12px]" : "px-4 py-2.5 text-sm",
        )}
      >
        جست‌وجو
      </button>
    </form>
  );
}
