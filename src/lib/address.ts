import { normalizePersian } from "./persian";

export type ExtractedAddress = {
  mallName: string | null;
  floor: string | null;
  unit: string | null;
  street: string | null;
  confidence: number;
};

export type AddressFields = {
  mallName: string | null;
  floor: string | null;
  unit: string | null;
  street: string | null;
  landmark: string | null;
  addressConfidence: number;
};

export type AddressInput = {
  addressText: string;
  mallName?: string | null;
  floor?: string | null;
  unit?: string | null;
  street?: string | null;
  landmark?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  addressConfidence?: number | null;
};

const UNKNOWN_ADDRESS = "آدرس نامشخص";

const REFERENCE_PREFIX =
  /^(?:نرسیده به|بالاتر از|پایین‌تر از|جنب|کنار|روبروی|روبه‌روی|بین|بعد از|قبل از|نبش)\b/;

const MALL_MARKER =
  /(?:^|\s)(پاساژ|مجتمع(?:\s+تجاری)?|مرکز(?:\s+خرید|\s+تجارت(?:\s+جهانی)?)|ساختمان|برج|گالری|بازار(?!چه))\s+[^،,]+$/;

const STREET_MARKER =
  /^(خیابان|بلوار|بزرگراه|میدان|کوچه|بن\s?بست|جاده)\s+.+$/;

const STREET_FALLBACK_BLOCK =
  /پاساژ|مجتمع|مرکز\s+خرید|ساختمان|برج|گالری|بازار|طبقه|واحد|پلاک|خیابان|کوچه|بلوار|میدان|بزرگراه|جنب|روبروی|بین|نرسیده|بالاتر|بعد از|قبل از|نبش|تهران/;

function clean(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const cleaned = value
    .replace(/[،,؛;]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length > 0 ? cleaned : null;
}

function segments(addressText: string): string[] {
  return addressText
    .split(/[،,؛;]/)
    .map((segment) => clean(segment))
    .filter((segment): segment is string => segment !== null);
}

function isUnknown(addressText: string): boolean {
  const normalized = normalizePersian(addressText);
  return normalized === normalizePersian(UNKNOWN_ADDRESS) || normalized.length < 6;
}

function mallFromSegment(segment: string): string | null {
  const normalized = normalizePersian(segment);
  if (REFERENCE_PREFIX.test(normalized)) return null;

  const match = MALL_MARKER.exec(normalized);
  if (!match) return null;

  const raw = segment.slice(match.index).trim();
  const cut = normalizePersian(raw).search(/\s+(?:طبقه|واحد|پلاک)\s/);
  return clean(cut >= 0 ? raw.slice(0, cut) : raw);
}

function floorFromSegment(segment: string): string | null {
  const normalized = normalizePersian(segment);
  if (/^طبقه\s*.+$/.test(normalized)) {
    return clean(segment.slice("طبقه".length));
  }
  if (normalized === "همکف" || normalized === "زیرهمکف" || normalized === "زیر همکف") {
    return clean(segment);
  }
  return null;
}

function unitFromSegment(segment: string): { value: string; priority: number } | null {
  const normalized = normalizePersian(segment);
  const match = normalized.match(/(?:^|\s)(واحد|مغازه|حجره)\s*(.+)$/);
  if (match) {
    const raw = segment.slice(match.index).trim();
    const value = raw.slice(match[1].length).trim();
    return {
      value: `${match[1]} ${value}`.trim(),
      priority: 2,
    };
  }
  const plaque = normalized.match(/^پلاک\s*(.+)$/);
  if (plaque) {
    return {
      value: `پلاک ${segment.slice("پلاک".length).trim()}`,
      priority: 1,
    };
  }
  return null;
}

function mainStreet(items: string[]): string | null {
  for (const segment of items) {
    const normalized = normalizePersian(segment);
    if (!STREET_MARKER.test(normalized)) continue;
    if (/^(خیابان|بلوار|بزرگراه|میدان)(?:\s|$)/.test(normalized)) {
      return clean(segment);
    }
  }
  return null;
}

function plainStreet(items: string[]): string | null {
  for (const segment of items) {
    const normalized = normalizePersian(segment);
    if (STREET_FALLBACK_BLOCK.test(normalized)) continue;
    if (normalized.length < 3 || normalized.length > 60) continue;
    return clean(segment);
  }
  return null;
}

function sideStreet(items: string[]): string | null {
  for (const segment of items) {
    const normalized = normalizePersian(segment);
    if (!STREET_MARKER.test(normalized)) continue;
    if (/^(کوچه|بن\s?بست|جاده)(?:\s|$)/.test(normalized)) return clean(segment);
  }
  return null;
}

function addressConfidence(
  fields: Pick<AddressFields, "mallName" | "floor" | "unit" | "street" | "landmark">,
  hasCoordinates: boolean,
): number {
  let confidence = 0.4;
  if (fields.mallName) confidence += 0.2;
  if (fields.floor) confidence += 0.12;
  if (fields.unit) confidence += 0.12;
  if (fields.street) confidence += 0.1;
  if (fields.landmark) confidence += 0.06;
  if (hasCoordinates) confidence += 0.05;
  return Math.min(0.95, Math.round(confidence * 100) / 100);
}

function hasValidCoordinates(input: AddressInput): boolean {
  return (
    typeof input.latitude === "number" &&
    typeof input.longitude === "number" &&
    Number.isFinite(input.latitude) &&
    Number.isFinite(input.longitude)
  );
}

export function extractAddressDetails(input: AddressInput): ExtractedAddress {
  const addressText = input.addressText.trim();
  if (isUnknown(addressText)) {
    return {
      mallName: null,
      floor: null,
      unit: null,
      street: null,
      confidence: 0.15,
    };
  }

  const items = segments(addressText);
  let mallName: string | null = null;
  let floor: string | null = null;
  let bestUnit: { value: string; priority: number } | null = null;

  for (const segment of items) {
    const mall = mallFromSegment(segment);
    if (mall) mallName = mall;

    const segmentFloor = floorFromSegment(segment);
    if (segmentFloor) floor = segmentFloor;

    const unit = unitFromSegment(segment);
    if (unit && (!bestUnit || unit.priority >= bestUnit.priority)) {
      bestUnit = unit;
    }
  }

  const street = mainStreet(items) ?? plainStreet(items) ?? sideStreet(items);
  const unit = bestUnit?.value ?? null;
  const landmark = clean(input.landmark);

  return {
    mallName,
    floor,
    unit,
    street,
    confidence: addressConfidence(
      { mallName, floor, unit, street, landmark },
      hasValidCoordinates(input),
    ),
  };
}

export function mergeAddressFields(input: AddressInput): AddressFields {
  const extracted = extractAddressDetails(input);
  const fields = {
    mallName: clean(input.mallName) ?? extracted.mallName,
    floor: clean(input.floor) ?? extracted.floor,
    unit: clean(input.unit) ?? extracted.unit,
    street: clean(input.street) ?? extracted.street,
    landmark: clean(input.landmark),
  };

  const unknown = isUnknown(input.addressText);
  return {
    ...fields,
    addressConfidence:
      input.addressConfidence === null || input.addressConfidence === undefined
        ? unknown
          ? 0.2
          : addressConfidence(fields, hasValidCoordinates(input))
        : Math.min(1, Math.max(0, input.addressConfidence)),
  };
}

export function isApproximateAddress(confidence: number): boolean {
  return confidence < 0.65;
}

export function formatFloor(floor: string | null | undefined): string | null {
  const value = clean(floor);
  if (!value) return null;
  return normalizePersian(value).startsWith("طبقه") ? value : `طبقه ${value}`;
}

export function formatUnit(unit: string | null | undefined): string | null {
  const value = clean(unit);
  if (!value) return null;
  return /^(?:واحد|پلاک|مغازه|حجره)(?:\s|$)/.test(normalizePersian(value))
    ? value
    : `واحد ${value}`;
}

export function addressComponents(
  input: Pick<AddressInput, "mallName" | "floor" | "unit" | "street">,
): string[] {
  const parts: string[] = [];
  const street = clean(input.street);
  const mall = clean(input.mallName);
  const floor = formatFloor(input.floor);
  const unit = formatUnit(input.unit);

  if (street) parts.push(street);
  if (mall) parts.push(mall);
  if (floor) parts.push(floor);
  if (unit) parts.push(unit);
  return parts;
}

export function formatAddressLine(
  input: Pick<
    AddressInput,
    "addressText" | "mallName" | "floor" | "unit" | "street"
  >,
): string {
  const parts = addressComponents(input);
  return parts.length > 0 ? parts.join("، ") : input.addressText;
}

export function mapsDirectionsUrl(
  input: Pick<AddressInput, "addressText" | "latitude" | "longitude">,
): string {
  const hasCoordinates =
    typeof input.latitude === "number" &&
    typeof input.longitude === "number" &&
    Number.isFinite(input.latitude) &&
    Number.isFinite(input.longitude);
  const destination = hasCoordinates
    ? `${input.latitude},${input.longitude}`
    : input.addressText;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}
