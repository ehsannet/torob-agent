import { describe, expect, it } from "vitest";
import type { AgentToolContext } from "./tools";
import type { SellerAlternative, SellerCheckSummary } from "@/lib/seller-types";
import type { SearchFilters } from "@/lib/search-types";
import { pickResult } from "./run-agent-result";

const filters: SearchFilters = {
  q: "",
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
  limit: 12,
};

const check: SellerCheckSummary = {
  token: "sim_abcdefghijklmnop",
  status: "answered",
  simulated: true,
  createdAt: "2026-10-22T10:00:00.000Z",
  answeredAt: "2026-10-22T10:01:00.000Z",
  shopName: "فروشگاه نمونه",
  productTitle: "محصول نمونه",
  offerId: "offer-1",
  priceToman: 1_000_000,
  linkPath: "/s/sim_abcdefghijklmnop",
};

const alternative: SellerAlternative = {
  kind: "same_product",
  offerId: "offer-2",
  productId: "product-1",
  productTitle: "محصول نمونه",
  shopId: "shop-2",
  shopName: "فروشگاه دوم",
  addressText: "خیابان جمهوری",
  priceToman: 1_100_000,
  stockStatus: "unknown",
  openState: "open",
  openLabel: "باز است",
  distanceKm: 2,
  reason: "همین محصول در فروشگاه دیگر",
};

function context(): AgentToolContext {
  return {
    baseFilters: filters,
    hints: filters,
    shops: [],
    sellerChecks: [],
    alternatives: [],
    error: null,
    lastAction: null,
  };
}

describe("agent seller result", () => {
  it("keeps a status-only answer when no product search happened", () => {
    const value = context();
    value.sellerChecks = [check];
    const result = pickResult(value, 15);
    expect(result?.kind).toBe("seller");
    expect(result?.sellerChecks).toHaveLength(1);
    expect(result?.products).toHaveLength(0);
  });

  it("keeps alternatives when only the alternatives tool ran", () => {
    const value = context();
    value.alternatives = [alternative];
    const result = pickResult(value, 15);
    expect(result?.kind).toBe("seller");
    expect(result?.alternatives).toHaveLength(1);
  });

  it("still returns null for an empty tool context", () => {
    expect(pickResult(context(), 15)).toBeNull();
  });
});
