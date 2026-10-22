import { describe, expect, it } from "vitest";
import {
  getOpenStatus,
  getTehranClock,
  isOpenNow,
  type OpenStatus,
} from "./opening-hours";
import type { WeeklyHours } from "./hours";

const THURSDAY_10_AM = new Date("2026-10-22T06:30:00Z");
const THURSDAY_8_30_PM = new Date("2026-10-22T17:00:00Z");
const THURSDAY_9_PM = new Date("2026-10-22T17:30:00Z");
const THURSDAY_11_PM = new Date("2026-10-22T19:30:00Z");
const FRIDAY_1_AM = new Date("2026-10-22T21:30:00Z");
const FRIDAY_2_AM = new Date("2026-10-22T22:30:00Z");
const FRIDAY_10_AM = new Date("2026-10-23T06:30:00Z");

function thursdayHours(ranges: WeeklyHours["thursday"]): WeeklyHours {
  return { thursday: ranges };
}

function stateOf(status: OpenStatus): string {
  return status.state;
}

describe("getTehranClock", () => {
  it("uses Asia/Tehran time and Persian weekdays", () => {
    expect(getTehranClock(THURSDAY_10_AM)).toEqual({
      weekday: "thursday",
      minutes: 600,
      time: "10:00",
    });
  });

  it("handles the Tehran midnight boundary", () => {
    const clock = getTehranClock(new Date("2026-10-22T20:45:00Z"));
    expect(clock.weekday).toBe("friday");
    expect(clock.time).toBe("00:15");
  });
});

describe("getOpenStatus", () => {
  it("returns unknown for missing hours", () => {
    expect(getOpenStatus(null, THURSDAY_10_AM).state).toBe("unknown");
    expect(getOpenStatus(undefined, THURSDAY_10_AM).state).toBe("unknown");
  });

  it("returns closed when a day has no ranges", () => {
    const status = getOpenStatus({ thursday: [] }, THURSDAY_10_AM);
    expect(status.state).toBe("closed");
    expect(stateOf(status)).toBe("closed");
  });

  it("is open during a normal range", () => {
    const status = getOpenStatus(
      thursdayHours([{ open: "09:00", close: "21:00" }]),
      THURSDAY_10_AM,
    );
    expect(status.state).toBe("open");
    expect(status.closesAt).toBe("21:00");
    expect(status.minutesUntilClose).toBe(660);
  });

  it("marks a shop closing within 60 minutes as closing soon", () => {
    const status = getOpenStatus(
      thursdayHours([{ open: "09:00", close: "21:00" }]),
      THURSDAY_8_30_PM,
    );
    expect(status.state).toBe("closing_soon");
    expect(status.minutesUntilClose).toBe(30);
  });

  it("is closed at the exact closing minute and before opening", () => {
    const hours = thursdayHours([{ open: "09:00", close: "21:00" }]);
    expect(getOpenStatus(hours, THURSDAY_9_PM).state).toBe("closed");
    expect(
      getOpenStatus(hours, new Date("2026-10-22T05:15:00Z")).state,
    ).toBe("closed");
  });

  it("supports ranges that close after midnight", () => {
    const hours = thursdayHours([{ open: "22:00", close: "02:00" }]);
    expect(getOpenStatus(hours, THURSDAY_11_PM).state).toBe("open");
    expect(getOpenStatus(hours, THURSDAY_11_PM).minutesUntilClose).toBe(180);
    expect(getOpenStatus(hours, FRIDAY_1_AM).state).toBe("closing_soon");
    expect(getOpenStatus(hours, FRIDAY_1_AM).minutesUntilClose).toBe(60);
    expect(getOpenStatus(hours, FRIDAY_2_AM).state).toBe("closed");
  });

  it("does not treat yesterday's daytime range as open today", () => {
    const hours: WeeklyHours = {
      thursday: [{ open: "09:00", close: "21:00" }],
      friday: [],
    };
    expect(getOpenStatus(hours, FRIDAY_10_AM).state).toBe("closed");
  });

  it("supports multiple ranges in one day", () => {
    const hours = thursdayHours([
      { open: "09:00", close: "13:00" },
      { open: "17:00", close: "21:00" },
    ]);
    expect(getOpenStatus(hours, THURSDAY_10_AM).state).toBe("open");
    expect(
      getOpenStatus(hours, new Date("2026-10-22T11:00:00Z")).state,
    ).toBe("closed");
  });

  it("is OpenNow for open and closing-soon shops only", () => {
    const hours = thursdayHours([{ open: "09:00", close: "21:00" }]);
    expect(isOpenNow(hours, THURSDAY_10_AM)).toBe(true);
    expect(isOpenNow(hours, THURSDAY_8_30_PM)).toBe(true);
    expect(isOpenNow(hours, THURSDAY_9_PM)).toBe(false);
    expect(isOpenNow(null, THURSDAY_10_AM)).toBe(false);
  });
});
