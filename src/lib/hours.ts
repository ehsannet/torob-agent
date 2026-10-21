export const WEEKDAYS = [
  "saturday",
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
] as const;

export type Weekday = (typeof WEEKDAYS)[number];

export type TimeRange = {
  open: string;
  close: string;
};

export type WeeklyHours = Partial<Record<Weekday, TimeRange[]>>;

export function isValidClockTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function parseWeeklyHours(input: unknown): WeeklyHours | null {
  if (input === null || input === undefined) return null;

  let value: unknown = input;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }

  if (typeof value !== "object" || Array.isArray(value)) return null;

  const result: WeeklyHours = {};

  for (const day of WEEKDAYS) {
    const rawRanges = (value as Record<string, unknown>)[day];
    if (rawRanges === undefined) continue;
    if (!Array.isArray(rawRanges)) return null;

    const ranges: TimeRange[] = [];
    for (const rawRange of rawRanges) {
      if (typeof rawRange !== "object" || rawRange === null) return null;
      const open = (rawRange as Record<string, unknown>).open;
      const close = (rawRange as Record<string, unknown>).close;

      if (
        typeof open !== "string" ||
        typeof close !== "string" ||
        !isValidClockTime(open) ||
        !isValidClockTime(close)
      ) {
        return null;
      }

      ranges.push({ open, close });
    }

    result[day] = ranges;
  }

  return result;
}
