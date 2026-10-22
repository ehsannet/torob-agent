import { describe, expect, it } from "vitest";
import type { OfferView, ProductSummary } from "@/lib/search-types";
import { areaMatches, groupCatalogOffers } from "./search-results";

function offer(id: string, shopId: string): OfferView {
  return {
    id,
    shopId,
    shopName: `فروشگاه ${shopId}`,
    addressText: "خیابان جمهوری، پاساژ علاءالدین",
    mallName: "علاءالدین",
    floor: "۲",
    unit: "۱۰",
    street: "جمهوری",
    landmark: "فردوسی",
    addressConfidence: 0.8,
    latitude: 35.69,
    longitude: 51.42,
    distanceKm: 1,
    recordedPrice: 1_000_000,
    priceUnit: "TOMAN",
    priceToman: 1_000_000,
    lastPriceChangeAt: "2026-10-01T10:00:00.000Z",
    stalePrice: false,
    openStatus: {
      state: "open",
      label: "باز است",
      todayRanges: [],
      closesAt: "21:00",
      minutesUntilClose: 120,
    },
    stockStatus: "unknown",
    confirmedPriceToman: null,
    stockConfirmedAt: null,
    features: {
      torobPay: false,
      installments: false,
      kalabarg: false,
      fastDelivery: false,
    },
    warrantyProvider: null,
    warrantyDurationMonths: null,
  };
}

const product: ProductSummary = {
  id: "product-1",
  titleFa: "گوشی آزمایشی",
  titleEn: null,
  brand: "برند",
  category: "گوشی موبایل",
  specs: {},
  images: [],
};

describe("real-data search grouping", () => {
  it("matches a district by the imported landmark before the address text", () => {
    const item = offer("offer-1", "shop-1");
    expect(
      areaMatches(item, { latitude: 35.69, longitude: 51.42 }, 5, "فردوسی", true),
    ).toBe(true);
  });

  it("keeps aggregate counts but caps displayed offers", () => {
    const offers = Array.from({ length: 9 }, (_, index) =>
      offer(`offer-${index}`, `shop-${index}`),
    );
    const group = groupCatalogOffers(
      offers.map((item) => ({ offer: item, product })),
    )[0];

    expect(group.offers).toHaveLength(6);
    expect(group.offerCount).toBe(9);
    expect(group.shopCount).toBe(9);
  });
});
