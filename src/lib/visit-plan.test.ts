import { describe, expect, it } from "vitest";
import { getOpenStatus } from "./opening-hours";
import type { WeeklyHours } from "./hours";
import { buildVisitPlan, buildVisitWarnings } from "./visit-plan";

const openHours: WeeklyHours = {
  saturday: [{ open: "09:00", close: "21:00" }],
  sunday: [{ open: "09:00", close: "21:00" }],
  monday: [{ open: "09:00", close: "21:00" }],
  tuesday: [{ open: "09:00", close: "21:00" }],
  wednesday: [{ open: "09:00", close: "21:00" }],
  thursday: [{ open: "09:00", close: "21:00" }],
  friday: [{ open: "09:00", close: "21:00" }],
};

const atNoon = new Date("2026-10-23T08:30:00.000Z");

const base = {
  shopId: "shop-1",
  shopName: "فروشگاه نمونه",
  addressText: "خیابان جمهوری، پاساژ علاءالدین، طبقه ۲، واحد ۲۷۵",
  mallName: "پاساژ علاءالدین",
  floor: "۲",
  unit: "واحد ۲۷۵",
  street: "خیابان جمهوری",
  landmark: "شیخ هادی",
  addressConfidence: 0.93,
  latitude: 35.69,
  longitude: 51.42,
  openStatus: getOpenStatus(openHours, atNoon),
};

describe("visit warnings", () => {
  it("flags unconfirmed stock and a missing unit", () => {
    const warnings = buildVisitWarnings({
      ...base,
      mallName: "پاساژ علاءالدین",
      floor: null,
      unit: null,
      stockStatus: "unknown",
    });
    expect(warnings.map((warning) => warning.key)).toEqual([
      "stock_unknown",
      "incomplete_unit",
    ]);
  });

  it("flags approximate addresses, closed hours and stale prices", () => {
    const warnings = buildVisitWarnings({
      ...base,
      addressConfidence: 0.61,
      openStatus: { ...base.openStatus, state: "closed", label: "بسته است" },
      stockStatus: "in_stock",
      stalePrice: true,
    });
    expect(warnings.map((warning) => warning.key)).toEqual([
      "approximate_address",
      "closed",
      "stale_price",
    ]);
  });

  it("returns no warnings when data is complete and confirmed", () => {
    const warnings = buildVisitWarnings({
      ...base,
      stockStatus: "in_stock",
      stalePrice: false,
      hoursConfirmedAt: "2026-10-23T08:00:00.000Z",
    });
    expect(warnings).toEqual([]);
  });
});

describe("visit plan", () => {
  it("combines address, route, hours and warnings", () => {
    const plan = buildVisitPlan({
      ...base,
      stockStatus: "unknown",
      stalePrice: true,
      productTitle: "گوشی موبایل",
      offerId: "offer-1",
      priceToman: 25_000_000,
    });

    expect(plan.addressLine).toBe(
      "خیابان جمهوری، پاساژ علاءالدین، طبقه ۲، واحد ۲۷۵",
    );
    expect(plan.routeUrl).toContain("destination=35.69%2C51.42");
    expect(plan.openState).toBe("open");
    expect(plan.warnings.map((warning) => warning.key)).toContain("stale_price");
    expect(plan.productTitle).toBe("گوشی موبایل");
    expect(plan.priceToman).toBe(25_000_000);
  });

  it("falls back to the raw address when no structured parts exist", () => {
    const plan = buildVisitPlan({
      ...base,
      mallName: null,
      floor: null,
      unit: null,
      street: null,
      addressText: "تهران، جمهوری",
      addressConfidence: 0.4,
      latitude: null,
      longitude: null,
      stockStatus: null,
    });
    expect(plan.addressLine).toBe("تهران، جمهوری");
    expect(plan.routeUrl).toContain(encodeURIComponent("تهران، جمهوری"));
    expect(plan.approximateAddress).toBe(true);
  });
});
