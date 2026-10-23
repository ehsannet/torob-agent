import { describe, expect, it } from "vitest";
import {
  addressComponents,
  extractAddressDetails,
  formatAddressLine,
  formatFloor,
  formatUnit,
  isApproximateAddress,
  mapsDirectionsUrl,
  mergeAddressFields,
} from "./address";

describe("address extraction", () => {
  it("extracts mall, floor, unit and street from a full Persian address", () => {
    const extracted = extractAddressDetails({
      addressText:
        "خیابان جمهوری اسلامی، پاساژ علاءالدین ۲، طبقه همکف، پلاک ۲۰، واحد ۲۰",
      landmark: "شیخ هادی",
      latitude: 35.69,
      longitude: 51.41,
    });

    expect(extracted.mallName).toBe("پاساژ علاءالدین ۲");
    expect(extracted.floor).toBe("همکف");
    expect(extracted.unit).toBe("واحد ۲۰");
    expect(extracted.street).toBe("خیابان جمهوری اسلامی");
    expect(extracted.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it("keeps the actual mall and ignores a nearby reference mall", () => {
    const extracted = extractAddressDetails({
      addressText:
        "لاله زار جنوبی، نرسیده به کوچه برلن، بالاتر از پاساژ طلا، پاساژ بازارچه لاله زار، طبقه همکف، پلاک 81",
    });

    expect(extracted.mallName).toBe("پاساژ بازارچه لاله زار");
    expect(extracted.floor).toBe("همکف");
    expect(extracted.unit).toBe("پلاک 81");
  });

  it("falls back to a main street when the address has no street marker", () => {
    const extracted = extractAddressDetails({
      addressText: "لاله زار شمالی،کوچه گل پرور،پلاک20، واحد16",
    });

    expect(extracted.mallName).toBeNull();
    expect(extracted.floor).toBeNull();
    expect(extracted.unit).toBe("واحد 16");
    expect(extracted.street).toBe("لاله زار شمالی");
    expect(extracted.confidence).toBeLessThan(0.7);
  });

  it("marks an unknown address as low confidence", () => {
    const extracted = extractAddressDetails({ addressText: "آدرس نامشخص" });
    expect(extracted.confidence).toBe(0.15);
    expect(extracted.mallName).toBeNull();
    expect(extracted.street).toBeNull();
  });

  it("fills only missing fields and recomputes confidence", () => {
    const fields = mergeAddressFields({
      addressText: "خیابان فردوسی، ساختمان ایرانیان، طبقه 6، واحد 2",
      floor: "۶",
      landmark: "فردوسی",
      latitude: 35.69,
      longitude: 51.42,
    });

    expect(fields.mallName).toBe("ساختمان ایرانیان");
    expect(fields.floor).toBe("۶");
    expect(fields.unit).toBe("واحد 2");
    expect(fields.street).toBe("خیابان فردوسی");
    expect(fields.landmark).toBe("فردوسی");
    expect(fields.addressConfidence).toBeGreaterThan(0.8);
  });
});

describe("address formatting", () => {
  it("adds Persian labels without duplicating existing prefixes", () => {
    expect(formatFloor("۲")).toBe("طبقه ۲");
    expect(formatFloor("طبقه ۲")).toBe("طبقه ۲");
    expect(formatUnit("۱۲")).toBe("واحد ۱۲");
    expect(formatUnit("واحد ۱۲")).toBe("واحد ۱۲");
    expect(formatUnit("پلاک ۱۰")).toBe("پلاک ۱۰");
  });

  it("composes a readable structured address line", () => {
    const line = formatAddressLine({
      addressText: "متن خام",
      street: "خیابان جمهوری",
      mallName: "پاساژ علاءالدین",
      floor: "۲",
      unit: "واحد ۲۷۵",
    });
    expect(line).toBe("خیابان جمهوری، پاساژ علاءالدین، طبقه ۲، واحد ۲۷۵");
    expect(
      addressComponents({
        street: null,
        mallName: null,
        floor: null,
        unit: null,
      }),
    ).toEqual([]);
  });

  it("builds a maps route from coordinates, otherwise from the address", () => {
    expect(
      mapsDirectionsUrl({
        addressText: "تهران",
        latitude: 35.69,
        longitude: 51.42,
      }),
    ).toContain("destination=35.69%2C51.42");
    expect(
      mapsDirectionsUrl({
        addressText: "خیابان جمهوری",
        latitude: null,
        longitude: null,
      }),
    ).toContain(encodeURIComponent("خیابان جمهوری"));
  });

  it("uses the 0.65 threshold for approximate addresses", () => {
    expect(isApproximateAddress(0.64)).toBe(true);
    expect(isApproximateAddress(0.65)).toBe(false);
  });
});
