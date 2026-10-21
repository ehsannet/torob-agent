import { describe, expect, it } from "vitest";
import { generateSampleDataset } from "./generate";

const dataset = generateSampleDataset(12345);

describe("generateSampleDataset", () => {
  it("produces the expected catalog size", () => {
    expect(dataset.shops).toHaveLength(300);
    expect(dataset.products).toHaveLength(2000);
    expect(dataset.offers).toHaveLength(4000);
  });

  it("uses unique identifiers", () => {
    expect(new Set(dataset.shops.map((shop) => shop.id)).size).toBe(300);
    expect(new Set(dataset.products.map((product) => product.id)).size).toBe(2000);
    expect(new Set(dataset.offers.map((offer) => offer.id)).size).toBe(4000);
  });

  it("marks every row as sample data", () => {
    expect(dataset.shops.every((shop) => shop.isSample)).toBe(true);
    expect(dataset.products.every((product) => product.isSample)).toBe(true);
    expect(dataset.offers.every((offer) => offer.isSample)).toBe(true);
  });

  it("keeps all offer references valid", () => {
    const shopIds = new Set(dataset.shops.map((shop) => shop.id));
    const productIds = new Set(dataset.products.map((product) => product.id));
    expect(dataset.offers.every((offer) => shopIds.has(offer.shopId))).toBe(true);
    expect(dataset.offers.every((offer) => productIds.has(offer.productId))).toBe(true);
  });

  it("gives the first 100 shops 14 offers and the rest 13", () => {
    const counts = new Map<string, number>();
    for (const offer of dataset.offers) {
      counts.set(offer.shopId, (counts.get(offer.shopId) ?? 0) + 1);
    }
    for (const [index, shop] of dataset.shops.entries()) {
      expect(counts.get(shop.id)).toBe(index < 100 ? 14 : 13);
    }
  });

  it("does not duplicate a product within a shop", () => {
    const seen = new Set<string>();
    for (const offer of dataset.offers) {
      const key = `${offer.shopId}|${offer.productId}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it("produces 250 products per category", () => {
    const counts = new Map<string, number>();
    for (const product of dataset.products) {
      counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
    }
    expect(counts.size).toBe(8);
    expect([...counts.values()].every((value) => value === 250)).toBe(true);
  });

  it("includes deliberate data gaps", () => {
    expect(dataset.shops.some((shop) => shop.weeklyHours === null)).toBe(true);
    expect(dataset.shops.some((shop) => shop.latitude === null)).toBe(true);
    expect(dataset.shops.some((shop) => (shop.addressConfidence ?? 1) < 0.6)).toBe(true);
    expect(dataset.offers.some((offer) => offer.price === null)).toBe(true);
    expect(dataset.offers.some((offer) => offer.lastPriceChangeAt === null)).toBe(true);
    expect(
      dataset.offers.some(
        (offer) =>
          offer.lastPriceChangeAt != null &&
          Date.now() - offer.lastPriceChangeAt.getTime() > 14 * 86_400_000,
      ),
    ).toBe(true);
  });

  it("is deterministic for ids and titles with a fixed seed", () => {
    const again = generateSampleDataset(12345);
    expect(again.shops.map((shop) => shop.id)).toEqual(dataset.shops.map((shop) => shop.id));
    expect(again.products.map((product) => product.titleFa)).toEqual(
      dataset.products.map((product) => product.titleFa),
    );
    expect(again.offers.map((offer) => offer.id)).toEqual(
      dataset.offers.map((offer) => offer.id),
    );
  });
});
