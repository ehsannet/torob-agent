import { describe, expect, it } from "vitest";
import { contextToBaseFilters, mergeAgentFilters } from "../filters";
import { parseRequestFilters } from "./parse-request";

describe("parseRequestFilters", () => {
  it("extracts model, budget, and district from a Persian request", () => {
    const filters = parseRequestFilters(
      "یه گوشی آیفون ۱۵ تا ۴۵ میلیون در ونک می‌خوام",
    );

    expect(filters.category).toBe("موبایل");
    expect(filters.maxPrice).toBe(45_000_000);
    expect(filters.district).toBe("vanak");
    expect(filters.q).toContain("ایفون");
    expect(filters.q).toContain("گوشی");
    expect(filters.q).not.toContain("ونک");
    expect(filters.limit).toBe(8);
  });

  it("parses a range and a smartwatch category", () => {
    const filters = parseRequestFilters(
      "بین ۲۰ تا ۳۰ میلیون ساعت هوشمند می‌خوام",
    );

    expect(filters.category).toBe("ساعت هوشمند");
    expect(filters.minPrice).toBe(20_000_000);
    expect(filters.maxPrice).toBe(30_000_000);
  });

  it("detects delivery and open-now conditions", () => {
    const filters = parseRequestFilters(
      "لپ تاپ تا ۸۰ میلیون با ارسال سریع و باز الان",
    );

    expect(filters.category).toBe("لپ‌تاپ");
    expect(filters.maxPrice).toBe(80_000_000);
    expect(filters.fastDelivery).toBe(true);
    expect(filters.openNow).toBe(true);
  });

  it("keeps user location for near-me requests", () => {
    const context = {
      district: null,
      lat: 35.7573,
      lng: 51.4102,
      radiusKm: 4,
    };
    const filters = parseRequestFilters("هدفون نزدیک من", context);

    expect(filters.category).toBe("هدفون و هندزفری");
    expect(filters.district).toBeNull();
    expect(filters.lat).toBe(context.lat);
    expect(filters.lng).toBe(context.lng);
    expect(filters.radiusKm).toBe(4);
  });

  it("uses the cheapest sort when the user asks for it", () => {
    const filters = parseRequestFilters("ارزان‌ترین گوشی سامسونگ");
    expect(filters.sort).toBe("price");
    expect(filters.category).toBe("موبایل");
  });

  it("falls back to an open query without inventing a category", () => {
    const filters = parseRequestFilters("یک هدیه خوب برای تولد");
    expect(filters.category).toBeNull();
    expect(filters.q.length).toBeGreaterThan(0);
  });
});

describe("agent filter merging", () => {
  it("keeps base coordinates when no new district is named", () => {
    const base = contextToBaseFilters({
      district: "vanak",
      lat: 35.7573,
      lng: 51.4102,
      radiusKm: 6,
    });
    const filters = mergeAgentFilters({ q: "iphone" }, base);

    expect(filters.district).toBe("vanak");
    expect(filters.lat).toBe(base.lat);
    expect(filters.radiusKm).toBe(6);
  });

  it("replaces coordinates when a new district is named", () => {
    const base = contextToBaseFilters({
      district: "vanak",
      lat: 35.7573,
      lng: 51.4102,
      radiusKm: 6,
    });
    const filters = mergeAgentFilters({ district: "پونک" }, base);

    expect(filters.district).toBe("punak");
    expect(filters.lat).toBeNull();
    expect(filters.lng).toBeNull();
  });

  it("swaps reversed price bounds", () => {
    const base = contextToBaseFilters();
    const filters = mergeAgentFilters(
      { minPrice: 50_000_000, maxPrice: 20_000_000 },
      base,
    );

    expect(filters.minPrice).toBe(20_000_000);
    expect(filters.maxPrice).toBe(50_000_000);
  });
});
