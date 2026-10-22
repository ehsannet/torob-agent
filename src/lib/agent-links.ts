import type { SearchFilters } from "./search-types";

export function assistantHref(filters?: SearchFilters): string {
  if (!filters) return "/assistant";

  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.district) params.set("district", filters.district);
  if (filters.lat !== null && filters.lng !== null) {
    params.set("lat", String(filters.lat));
    params.set("lng", String(filters.lng));
    params.set("radiusKm", String(filters.radiusKm));
  }

  const query = params.toString();
  return query ? `/assistant?${query}` : "/assistant";
}
