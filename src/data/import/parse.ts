import { WEEKDAYS, type Weekday, type WeeklyHours, type TimeRange } from "../../lib/hours";
import { normalizePersian, toEnglishDigits } from "../../lib/persian";

export type PriceUnit = "TOMAN" | "RIAL";

const DAY_ALIASES: Record<string, Weekday> = {
  saturday: "saturday",
  sunday: "sunday",
  monday: "monday",
  tuesday: "tuesday",
  wednesday: "wednesday",
  thursday: "thursday",
  friday: "friday",
  شنبه: "saturday",
  یکشنبه: "sunday",
  "یک شنبه": "sunday",
  دوشنبه: "monday",
  "دو شنبه": "monday",
  سه‌شنبه: "tuesday",
  "سه شنبه": "tuesday",
  چهارشنبه: "wednesday",
  "چهار شنبه": "wednesday",
  پنجشنبه: "thursday",
  "پنج شنبه": "thursday",
  جمعه: "friday",
};

const TRUE_VALUES = new Set(["true", "1", "yes", "y", "بله", "دارد", "فعال"]);
const FALSE_VALUES = new Set(["false", "0", "no", "n", "خیر", "ندارد", "غیرفعال"]);

export function asString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

export function asNumber(value: unknown): number | null {
  const text = asString(value);
  if (!text) return null;
  const cleaned = toEnglishDigits(text)
    .replace(/[,\s٬،]/g, "")
    .replace(/[^\d.+-]/g, "");
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export function asInteger(value: unknown): number | null {
  const parsed = asNumber(value);
  return parsed === null ? null : Math.round(parsed);
}

export function asBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
    return null;
  }
  const text = asString(value);
  if (!text) return null;
  const normalized = normalizePersian(text);
  if (TRUE_VALUES.has(normalized)) return true;
  if (FALSE_VALUES.has(normalized)) return false;
  return null;
}

export function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => asString(item))
      .filter((item): item is string => item !== null);
  }
  const text = asString(value);
  if (!text) return [];
  if (text.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(text);
      if (Array.isArray(parsed)) return asStringArray(parsed);
    } catch {
      return [];
    }
  }
  return text
    .split(/[,،]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function asRecord(value: unknown): Record<string, string> {
  let source: unknown = value;
  if (typeof source === "string") {
    try {
      source = JSON.parse(source);
    } catch {
      return {};
    }
  }
  if (typeof source !== "object" || source === null || Array.isArray(source)) {
    return {};
  }
  const result: Record<string, string> = {};
  for (const [key, rawValue] of Object.entries(source)) {
    const text = asString(rawValue);
    if (text !== null) result[key] = text;
  }
  return result;
}

export function asDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const text = asString(value);
  if (!text) return null;
  const date = new Date(toEnglishDigits(text));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function parsePrice(value: unknown): {
  amount: number | null;
  unit: PriceUnit;
} {
  const text = asString(value) ?? "";
  const normalized = normalizePersian(text);
  const unit: PriceUnit =
    normalized.includes("ریال") || normalized.includes("rial") || normalized.includes("irr")
      ? "RIAL"
      : "TOMAN";
  return { amount: asInteger(text), unit };
}

function normalizeTime(value: unknown): string | null {
  const text = asString(value);
  if (!text) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(toEnglishDigits(text).trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function parseRange(value: unknown): TimeRange | null {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    const open = normalizeTime(record.open);
    const close = normalizeTime(record.close);
    return open && close ? { open, close } : null;
  }

  if (Array.isArray(value) && value.length === 2) {
    const open = normalizeTime(value[0]);
    const close = normalizeTime(value[1]);
    return open && close ? { open, close } : null;
  }

  const text = asString(value);
  if (!text) return null;
  const parts = text.split(/\s*(?:-|–|—|تا)\s*/).filter(Boolean);
  if (parts.length !== 2) return null;
  const open = normalizeTime(parts[0]);
  const close = normalizeTime(parts[1]);
  return open && close ? { open, close } : null;
}

function looksLikeTime(value: unknown): boolean {
  const text = asString(value);
  return text !== null && /^\d{1,2}:\d{2}$/.test(toEnglishDigits(text).trim());
}

function parseDayRanges(value: unknown): TimeRange[] | null {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) {
    if (value.length === 0) return [];
    if (value.length === 2 && looksLikeTime(value[0]) && looksLikeTime(value[1])) {
      const range = parseRange(value);
      return range ? [range] : null;
    }
    const ranges: TimeRange[] = [];
    for (const item of value) {
      const range = parseRange(item);
      if (!range) return null;
      ranges.push(range);
    }
    return ranges;
  }
  const range = parseRange(value);
  return range ? [range] : null;
}

export function parseHours(value: unknown): WeeklyHours | null {
  if (value === null || value === undefined) return null;

  let source: unknown = value;
  if (typeof source === "string") {
    try {
      source = JSON.parse(source);
    } catch {
      return null;
    }
  }
  if (typeof source !== "object" || source === null || Array.isArray(source)) {
    return null;
  }

  const result: WeeklyHours = {};
  for (const [rawKey, rawValue] of Object.entries(source)) {
    const key = normalizePersian(rawKey);
    const day = DAY_ALIASES[key];
    if (!day) continue;
    const ranges = parseDayRanges(rawValue);
    if (ranges === null) return null;
    result[day] = ranges;
  }
  return result;
}

export function isWeekday(value: string): value is Weekday {
  return (WEEKDAYS as readonly string[]).includes(value);
}
