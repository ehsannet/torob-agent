import { describe, expect, it } from "vitest";
import {
  formatAbsoluteDate,
  formatPriceAge,
  formatPriceRange,
  formatRelativeTime,
  formatToman,
  isStalePrice,
  toToman,
} from "./price";

describe("toToman", () => {
  it("keeps Toman prices unchanged", () => {
    expect(toToman(25_000_000, "TOMAN")).toBe(25_000_000);
    expect(toToman(25_000_000, null)).toBe(25_000_000);
  });

  it("converts Rial to Toman", () => {
    expect(toToman(250_000_000, "RIAL")).toBe(25_000_000);
    expect(toToman(25_000_005, "RIAL")).toBe(2_500_001);
  });

  it("returns null for missing prices", () => {
    expect(toToman(null, "TOMAN")).toBeNull();
    expect(toToman(undefined, "RIAL")).toBeNull();
    expect(toToman(Number.NaN, "TOMAN")).toBeNull();
  });
});

describe("price formatting", () => {
  it("formats prices and ranges with Persian digits", () => {
    expect(formatToman(25_000_000)).toContain("تومان");
    expect(formatToman(null)).toBe("نامشخص");
    expect(formatPriceRange(null, null)).toBe("قیمت ثبت نشده");
    expect(formatPriceRange(10_000_000, 12_000_000)).toContain("تا");
  });

  it("formats relative times", () => {
    const now = new Date("2026-10-22T12:00:00Z");
    expect(formatRelativeTime(null, now)).toBe("نامشخص");
    expect(
      formatRelativeTime(new Date("2026-10-22T11:30:00Z"), now),
    ).toBe("کمتر از یک ساعت پیش");
    expect(formatRelativeTime(new Date("2026-10-22T09:00:00Z"), now)).toContain(
      "ساعت پیش",
    );
    expect(formatRelativeTime(new Date("2026-10-19T12:00:00Z"), now)).toContain(
      "روز پیش",
    );
  });

  it("formats an age with both relative and absolute dates", () => {
    const now = new Date("2026-10-22T12:00:00Z");
    const age = formatPriceAge(new Date("2026-10-20T12:00:00Z"), now);
    expect(age).toContain("روز پیش");
    expect(age).toContain("(");
    expect(formatAbsoluteDate(null)).toBe("نامشخص");
  });
});

describe("isStalePrice", () => {
  const now = new Date("2026-10-22T12:00:00Z");

  it("treats prices older than 14 days as stale", () => {
    expect(isStalePrice(new Date("2026-10-08T12:00:00Z"), now)).toBe(false);
    expect(isStalePrice(new Date("2026-10-08T11:59:00Z"), now)).toBe(true);
  });

  it("does not mark missing or future dates stale", () => {
    expect(isStalePrice(null, now)).toBe(false);
    expect(isStalePrice(new Date("2026-10-23T12:00:00Z"), now)).toBe(false);
  });
});
