import { describe, expect, it } from "vitest";
import {
  buildSearchParams,
  countActiveFilters,
  parseSearchFilters,
  searchHref,
} from "./search-params";
import type { SearchFilters } from "./search-types";

function filtersFrom(query: string): SearchFilters {
  const parsed = parseSearchFilters(new URLSearchParams(query));
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.filters;
}

describe("parseSearchFilters", () => {
  it("returns safe defaults", () => {
    const filters = filtersFrom("");
    expect(filters).toMatchObject({
      q: "",
      category: null,
      minPrice: null,
      maxPrice: null,
      district: null,
      lat: null,
      lng: null,
      radiusKm: 5,
      openNow: false,
      sort: "relevance",
      page: 1,
      limit: 12,
    });
  });

  it("parses text, budget, district and location", () => {
    const filters = filtersFrom(
      "q=آیفون&category=موبایل&minPrice=۱۰٬۰۰۰٬۰۰۰&maxPrice=50000000&district=vanak&lat=35.7&lng=51.4&radiusKm=3&openNow=1&torobPay=true&sort=price&page=2&limit=6",
    );
    expect(filters.q).toBe("آیفون");
    expect(filters.category).toBe("موبایل");
    expect(filters.minPrice).toBe(10_000_000);
    expect(filters.maxPrice).toBe(50_000_000);
    expect(filters.district).toBe("vanak");
    expect(filters.lat).toBeCloseTo(35.7);
    expect(filters.lng).toBeCloseTo(51.4);
    expect(filters.radiusKm).toBe(3);
    expect(filters.openNow).toBe(true);
    expect(filters.torobPay).toBe(true);
    expect(filters.sort).toBe("price");
    expect(filters.page).toBe(2);
    expect(filters.limit).toBe(6);
  });

  it("rejects invalid filters", () => {
    expect(parseSearchFilters(new URLSearchParams("minPrice=abc")).ok).toBe(false);
    expect(
      parseSearchFilters(new URLSearchParams("minPrice=100&maxPrice=10")).ok,
    ).toBe(false);
    expect(
      parseSearchFilters(new URLSearchParams("district=nowhere")).ok,
    ).toBe(false);
    expect(parseSearchFilters(new URLSearchParams("lat=35.7")).ok).toBe(false);
    expect(parseSearchFilters(new URLSearchParams("lat=100&lng=51")).ok).toBe(
      false,
    );
    expect(parseSearchFilters(new URLSearchParams("sort=random")).ok).toBe(false);
    expect(parseSearchFilters(new URLSearchParams("page=0")).ok).toBe(false);
    expect(parseSearchFilters(new URLSearchParams("limit=100")).ok).toBe(false);
    expect(
      parseSearchFilters(new URLSearchParams(`q=${"x".repeat(101)}`)).ok,
    ).toBe(false);
  });
});

describe("buildSearchParams", () => {
  it("round-trips a search URL", () => {
    const original = filtersFrom(
      "q=iPhone+15&category=موبایل&minPrice=10000000&maxPrice=50000000&district=vanak&openNow=1&sort=price&page=2&limit=6",
    );
    const rebuilt = parseSearchFilters(buildSearchParams(original));
    expect(rebuilt.ok).toBe(true);
    if (rebuilt.ok) expect(rebuilt.filters).toEqual(original);
  });

  it("builds clean default and non-default hrefs", () => {
    const filters = filtersFrom("");
    expect(searchHref(filters)).toBe("/search");
    expect(
      searchHref(filters, { q: "گوشی سامسونگ", category: "موبایل" }),
    ).toContain("q=%DA%AF%D9%88%D8%B4%DB%8C");
    expect(searchHref(filters, { page: 2 })).toContain("page=2");
  });

  it("counts active filters", () => {
    expect(countActiveFilters(filtersFrom(""))).toBe(0);
    expect(
      countActiveFilters(
        filtersFrom("category=موبایل&openNow=1&lat=35.7&lng=51.4"),
      ),
    ).toBe(3);
  });
});
