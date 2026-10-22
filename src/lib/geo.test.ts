import { describe, expect, it } from "vitest";
import { formatDistanceKm, haversineKm } from "./geo";

describe("haversineKm", () => {
  it("returns zero for the same point", () => {
    expect(haversineKm({ latitude: 35.7, longitude: 51.4 }, { latitude: 35.7, longitude: 51.4 })).toBe(0);
  });

  it("matches a known one-degree distance at the equator", () => {
    const distance = haversineKm(
      { latitude: 0, longitude: 0 },
      { latitude: 0, longitude: 1 },
    );
    expect(distance).toBeCloseTo(111.2, 1);
  });

  it("measures Tehran district distances in kilometres", () => {
    const distance = haversineKm(
      { latitude: 35.7573, longitude: 51.4102 },
      { latitude: 35.8, longitude: 51.434 },
    );
    expect(distance).toBeGreaterThan(4);
    expect(distance).toBeLessThan(6);
  });
});

describe("formatDistanceKm", () => {
  it("formats short, normal and missing distances", () => {
    expect(formatDistanceKm(null)).toBe("نامشخص");
    expect(formatDistanceKm(0.4)).toBe("کمتر از ۱ کیلومتر");
    expect(formatDistanceKm(2.44)).toContain("کیلومتر");
  });
});
