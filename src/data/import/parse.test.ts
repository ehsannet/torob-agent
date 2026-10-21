import { describe, expect, it } from "vitest";
import {
  asBoolean,
  asInteger,
  asNumber,
  asStringArray,
  parseHours,
  parsePrice,
} from "./parse";

describe("parsePrice", () => {
  it("parses Persian-formatted Toman prices", () => {
    expect(parsePrice("۲۵٬۰۰۰٬۰۰۰ تومان")).toEqual({
      amount: 25_000_000,
      unit: "TOMAN",
    });
  });

  it("detects RIAL", () => {
    expect(parsePrice("۲۵۰,۰۰۰,۰۰۰ ریال")).toEqual({
      amount: 250_000_000,
      unit: "RIAL",
    });
    expect(parsePrice("250000000 IRR")).toEqual({
      amount: 250_000_000,
      unit: "RIAL",
    });
  });

  it("defaults to Toman", () => {
    expect(parsePrice(12_500_000)).toEqual({
      amount: 12_500_000,
      unit: "TOMAN",
    });
    expect(parsePrice(null)).toEqual({ amount: null, unit: "TOMAN" });
  });
});

describe("asNumber and asInteger", () => {
  it("normalizes grouping separators and digits", () => {
    expect(asNumber("۱۲۳٬۴۵۶")).toBe(123_456);
    expect(asNumber("1,234.5")).toBe(1234.5);
    expect(asInteger("۱۲۳.۶")).toBe(124);
  });

  it("returns null for invalid values", () => {
    expect(asNumber("نامشخص")).toBeNull();
    expect(asNumber(null)).toBeNull();
  });
});

describe("asBoolean", () => {
  it("accepts Persian and English values", () => {
    expect(asBoolean("بله")).toBe(true);
    expect(asBoolean("خیر")).toBe(false);
    expect(asBoolean("true")).toBe(true);
    expect(asBoolean(1)).toBe(true);
    expect(asBoolean(0)).toBe(false);
  });

  it("returns null for unknown values", () => {
    expect(asBoolean("شاید")).toBeNull();
    expect(asBoolean(undefined)).toBeNull();
  });
});

describe("asStringArray", () => {
  it("parses arrays, JSON strings and comma-separated text", () => {
    expect(asStringArray(["a", " b ", 3])).toEqual(["a", "b", "3"]);
    expect(asStringArray('["x","y"]')).toEqual(["x", "y"]);
    expect(asStringArray("x، y")).toEqual(["x", "y"]);
  });
});

describe("parseHours", () => {
  it("parses English keys and range objects", () => {
    expect(
      parseHours({
        saturday: [{ open: "09:00", close: "21:00" }],
        friday: [],
      }),
    ).toEqual({
      saturday: [{ open: "09:00", close: "21:00" }],
      friday: [],
    });
  });

  it("maps Persian day names and normalizes times", () => {
    expect(
      parseHours({
        "سه‌شنبه": "۹:۰۰-۲۱:۰۰",
        جمعه: [],
        "پنج شنبه": ["10:00", "20:30"],
      }),
    ).toEqual({
      tuesday: [{ open: "09:00", close: "21:00" }],
      friday: [],
      thursday: [{ open: "10:00", close: "20:30" }],
    });
  });

  it("parses a JSON string and split shifts", () => {
    expect(
      parseHours(
        JSON.stringify({
          monday: ["09:00-13:30", "15:00-21:00"],
        }),
      ),
    ).toEqual({
      monday: [
        { open: "09:00", close: "13:30" },
        { open: "15:00", close: "21:00" },
      ],
    });
  });

  it("rejects invalid hours", () => {
    expect(parseHours({ saturday: "25:00-21:00" })).toBeNull();
    expect(parseHours("{")).toBeNull();
    expect(parseHours("not-json")).toBeNull();
  });
});
