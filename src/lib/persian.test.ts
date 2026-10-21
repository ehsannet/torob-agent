import { describe, expect, it } from "vitest";
import {
  formatPersianNumber,
  normalizePersian,
  toEnglishDigits,
  toPersianDigits,
  tokenizePersian,
} from "./persian";

describe("normalizePersian", () => {
  it("unifies Arabic Yeh, Kaf and alef variants", () => {
    expect(normalizePersian("كتاب‌هاي آموزشي")).toBe("کتاب های اموزشی");
    expect(normalizePersian("أحمد إسلام آقا")).toBe("احمد اسلام اقا");
  });

  it("converts Persian and Arabic digits to ASCII", () => {
    expect(normalizePersian("قیمت ۱۲۳ و ٤٥٦ تومان")).toBe("قیمت 123 و 456 تومان");
  });

  it("removes diacritics and tatweel", () => {
    expect(normalizePersian("مُحَمَّد")).toBe("محمد");
    expect(normalizePersian("کتـــاب")).toBe("کتاب");
  });

  it("normalizes zero-width characters and whitespace", () => {
    expect(normalizePersian("گوشی\u200cهوشمند\u00a0  سامسونگ")).toBe(
      "گوشی هوشمند سامسونگ",
    );
  });

  it("lowercases Latin text", () => {
    expect(normalizePersian("iPhone 15 Pro")).toBe("iphone 15 pro");
  });

  it("is idempotent", () => {
    const once = normalizePersian("كتاب‌هاي ۱۲۳ آموزشي");
    expect(normalizePersian(once)).toBe(once);
  });
});

describe("digit helpers", () => {
  it("converts ASCII digits to Persian", () => {
    expect(toPersianDigits(1234567890)).toBe("۱۲۳۴۵۶۷۸۹۰");
    expect(toPersianDigits("قیمت 42")).toBe("قیمت ۴۲");
  });

  it("converts Persian and Arabic digits to English", () => {
    expect(toEnglishDigits("۱۲۳۴۵٦٧٨٩٠")).toBe("1234567890");
  });

  it("formats numbers with Persian locale digits", () => {
    expect(formatPersianNumber(1234567)).toContain("۴");
    expect(formatPersianNumber(0)).toBe("۰");
  });
});

describe("tokenizePersian", () => {
  it("normalizes and splits on whitespace", () => {
    expect(tokenizePersian("  گوشی‌های   سامسونگ  ")).toEqual([
      "گوشی",
      "های",
      "سامسونگ",
    ]);
  });

  it("returns an empty list for blank input", () => {
    expect(tokenizePersian("   ")).toEqual([]);
  });
});
