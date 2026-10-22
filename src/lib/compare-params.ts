import { buildSearchParams } from "./search-params";
import type { SearchFilters } from "./search-types";

export const MIN_COMPARE = 2;
export const MAX_COMPARE = 4;

export type CompareIdsResult =
  | { ok: true; ids: string[] }
  | { ok: false; error: string };

export function parseCompareIds(value: string | null): CompareIdsResult {
  if (!value) {
    return { ok: false, error: "برای مقایسه حداقل دو محصول انتخاب کن." };
  }

  const ids = Array.from(
    new Set(
      value
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  );

  if (ids.length < MIN_COMPARE) {
    return { ok: false, error: "برای مقایسه حداقل دو محصول انتخاب کن." };
  }
  if (ids.length > MAX_COMPARE) {
    return { ok: false, error: "حداکثر چهار محصول را می‌توانی مقایسه کنی." };
  }
  if (ids.some((id) => !/^[a-zA-Z0-9_-]{1,64}$/.test(id))) {
    return { ok: false, error: "شناسهٔ محصول معتبر نیست." };
  }

  return { ok: true, ids };
}

export function compareHref(ids: string[], filters?: SearchFilters): string {
  if (!filters) {
    return `/compare?ids=${encodeURIComponent(ids.join(","))}`;
  }

  const params = buildSearchParams(filters);
  params.set("ids", ids.join(","));
  return `/compare?${params.toString()}`;
}
