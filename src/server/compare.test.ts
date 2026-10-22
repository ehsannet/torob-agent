import { describe, expect, it } from "vitest";
import type { ProductGroup } from "@/lib/search-types";
import { recommendGroup } from "./compare";

function group(
  id: string,
  patch: Partial<ProductGroup> = {},
): ProductGroup {
  return {
    product: {
      id,
      titleFa: `محصول ${id}`,
      titleEn: null,
      brand: "برند",
      category: "موبایل",
      specs: {},
      images: [],
    },
    offers: [],
    offerCount: 1,
    shopCount: 1,
    priceMin: 10_000_000,
    priceMax: 10_000_000,
    nearestDistanceKm: 5,
    openNowCount: 0,
    confirmedStockCount: 0,
    confirmedCount: 0,
    bestOffer: null,
    latestPriceChangeAt: null,
    stalePrice: false,
    reasons: [],
    ...patch,
  };
}

describe("recommendGroup", () => {
  it("returns null when there is nothing to compare", () => {
    expect(recommendGroup([])).toBeNull();
    expect(recommendGroup([group("a")])).toBeNull();
  });

  it("prefers the cheaper option when other factors are equal", () => {
    const result = recommendGroup([
      group("cheap", { priceMin: 10_000_000, priceMax: 10_000_000 }),
      group("expensive", { priceMin: 20_000_000, priceMax: 20_000_000 }),
    ]);
    expect(result?.productId).toBe("cheap");
    expect(result?.reasons.join(" ")).toContain("کمترین قیمت");
  });

  it("prefers the closer option when prices are equal", () => {
    const result = recommendGroup([
      group("far", { nearestDistanceKm: 8 }),
      group("near", { nearestDistanceKm: 1 }),
    ]);
    expect(result?.productId).toBe("near");
    expect(result?.reasons.join(" ")).toContain("نزدیک‌ترین");
  });

  it("prefers more open shops when price and distance are equal", () => {
    const result = recommendGroup([
      group("closed", { openNowCount: 0 }),
      group("open", { openNowCount: 3 }),
    ]);
    expect(result?.productId).toBe("open");
    expect(result?.reasons.join(" ")).toContain("فروشگاه باز");
  });
});
