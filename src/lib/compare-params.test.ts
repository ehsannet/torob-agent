import { describe, expect, it } from "vitest";
import { compareHref, parseCompareIds } from "./compare-params";

describe("parseCompareIds", () => {
  it("parses two to four unique ids", () => {
    expect(parseCompareIds("product-00001,product-00002")).toEqual({
      ok: true,
      ids: ["product-00001", "product-00002"],
    });
    expect(
      parseCompareIds(
        "product-00001,product-00002,product-00003,product-00004",
      ),
    ).toMatchObject({ ok: true });
  });

  it("deduplicates ids", () => {
    expect(
      parseCompareIds("product-00001,product-00001,product-00002"),
    ).toEqual({
      ok: true,
      ids: ["product-00001", "product-00002"],
    });
  });

  it("rejects missing, too many or invalid ids", () => {
    expect(parseCompareIds(null).ok).toBe(false);
    expect(parseCompareIds("product-00001").ok).toBe(false);
    expect(
      parseCompareIds(
        "a,b,c,d,e",
      ).ok,
    ).toBe(false);
    expect(parseCompareIds("product-1,product 2").ok).toBe(false);
    expect(parseCompareIds("product-1,product%2").ok).toBe(false);
  });

  it("builds an encoded compare link", () => {
    expect(compareHref(["product-00001", "product-00002"])).toBe(
      "/compare?ids=product-00001%2Cproduct-00002",
    );
  });

  it("preserves search context in the compare link", () => {
    const href = compareHref(["product-00001", "product-00002"], {
      q: "iPhone",
      category: null,
      minPrice: null,
      maxPrice: null,
      district: "vanak",
      lat: 35.7,
      lng: 51.4,
      radiusKm: 3,
      openNow: false,
      torobPay: false,
      installments: false,
      kalabarg: false,
      fastDelivery: false,
      sort: "relevance",
      page: 1,
      limit: 12,
    });
    expect(href).toContain("ids=product-00001%2Cproduct-00002");
    expect(href).toContain("q=iPhone");
    expect(href).toContain("district=vanak");
    expect(href).toContain("lat=35.7");
    expect(href).toContain("radiusKm=3");
  });
});
