import {
  WEEKDAYS,
  type TimeRange,
  type Weekday,
  type WeeklyHours,
} from "./hours";

export const TEHRAN_TIME_ZONE = "Asia/Tehran";
export const CLOSING_SOON_MINUTES = 60;

export type OpenState = "open" | "closing_soon" | "closed" | "unknown";

export type OpenStatus = {
  state: OpenState;
  label: string;
  todayRanges: TimeRange[];
  closesAt: string | null;
  minutesUntilClose: number | null;
};

const STATE_LABELS: Record<OpenState, string> = {
  open: "باز است",
  closing_soon: "به‌زودی بسته می‌شود",
  closed: "بسته است",
  unknown: "ساعت کاری نامشخص",
};

const clockFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TEHRAN_TIME_ZONE,
  weekday: "long",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const WEEKDAY_BY_ENGLISH: Record<string, Weekday> = {
  Saturday: "saturday",
  Sunday: "sunday",
  Monday: "monday",
  Tuesday: "tuesday",
  Wednesday: "wednesday",
  Thursday: "thursday",
  Friday: "friday",
};

export function getTehranClock(at = new Date()): {
  weekday: Weekday;
  minutes: number;
  time: string;
} {
  const parts = clockFormatter.formatToParts(at);
  const weekdayName = parts.find((part) => part.type === "weekday")?.value ?? "";
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(
    parts.find((part) => part.type === "minute")?.value ?? "0",
  );

  return {
    weekday: WEEKDAY_BY_ENGLISH[weekdayName] ?? "saturday",
    minutes: hour * 60 + minute,
    time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
  };
}

export function clockToMinutes(value: string): number {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function closedStatus(todayRanges: TimeRange[]): OpenStatus {
  return {
    state: "closed",
    label: STATE_LABELS.closed,
    todayRanges,
    closesAt: null,
    minutesUntilClose: null,
  };
}

function previousWeekday(weekday: Weekday): Weekday {
  const index = WEEKDAYS.indexOf(weekday);
  return WEEKDAYS[(index + WEEKDAYS.length - 1) % WEEKDAYS.length];
}

function findOpenRange(
  ranges: TimeRange[],
  minutes: number,
  nextDayClose: boolean,
): { range: TimeRange; minutesUntilClose: number } | null {
  for (const range of ranges) {
    const open = clockToMinutes(range.open);
    const close = clockToMinutes(range.close);

    if (close === open) {
      return { range, minutesUntilClose: 24 * 60 };
    }

    if (nextDayClose) {
      if (close < open && minutes < close) {
        return { range, minutesUntilClose: close - minutes };
      }
      continue;
    }

    if (minutes >= open && minutes < close) {
      return { range, minutesUntilClose: close - minutes };
    }

    if (close < open && minutes >= open) {
      return {
        range,
        minutesUntilClose: 24 * 60 - minutes + close,
      };
    }
  }

  return null;
}

export function getOpenStatus(
  hours: WeeklyHours | null | undefined,
  at = new Date(),
): OpenStatus {
  if (hours === null || hours === undefined) {
    return {
      state: "unknown",
      label: STATE_LABELS.unknown,
      todayRanges: [],
      closesAt: null,
      minutesUntilClose: null,
    };
  }

  const clock = getTehranClock(at);
  const todayRanges = hours[clock.weekday] ?? [];

  const currentOpen = findOpenRange(todayRanges, clock.minutes, false);
  const overnightOpen = findOpenRange(
    hours[previousWeekday(clock.weekday)] ?? [],
    clock.minutes,
    true,
  );
  const openResult = currentOpen ?? overnightOpen;

  if (!openResult) return closedStatus(todayRanges);

  const openRange = openResult.range;
  const minutesUntilClose = openResult.minutesUntilClose;

  const state: OpenState =
    minutesUntilClose <= CLOSING_SOON_MINUTES ? "closing_soon" : "open";

  return {
    state,
    label: STATE_LABELS[state],
    todayRanges,
    closesAt: openRange.close,
    minutesUntilClose,
  };
}

export function isOpenNow(
  hours: WeeklyHours | null | undefined,
  at = new Date(),
): boolean {
  const status = getOpenStatus(hours, at);
  return status.state === "open" || status.state === "closing_soon";
}

export function formatTodayRanges(ranges: TimeRange[]): string {
  if (ranges.length === 0) return "امروز تعطیل";
  return ranges.map((range) => `${range.open} تا ${range.close}`).join("، ");
}

export function getWeekdayLabel(weekday: Weekday): string {
  const labels: Record<Weekday, string> = {
    saturday: "شنبه",
    sunday: "یکشنبه",
    monday: "دوشنبه",
    tuesday: "سه‌شنبه",
    wednesday: "چهارشنبه",
    thursday: "پنجشنبه",
    friday: "جمعه",
  };
  return labels[weekday];
}

export function getWeekdayOrder(): readonly Weekday[] {
  return WEEKDAYS;
}
