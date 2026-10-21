import { describe, expect, it } from "vitest";
import {
  parseWeeklyHours,
  isValidClockTime,
  WEEKDAYS,
  type WeeklyHours,
} from "./hours";

describe("isValidClockTime", () => {
  it("accepts 24-hour clock values", () => {
    expect(isValidClockTime("00:00")).toBe(true);
    expect(isValidClockTime("09:30")).toBe(true);
    expect(isValidClockTime("23:59")).toBe(true);
  });

  it("rejects malformed or out-of-range values", () => {
    expect(isValidClockTime("24:00")).toBe(false);
    expect(isValidClockTime("9:30")).toBe(false);
    expect(isValidClockTime("12:60")).toBe(false);
    expect(isValidClockTime("")).toBe(false);
  });
});

describe("parseWeeklyHours", () => {
  it("returns null for missing values", () => {
    expect(parseWeeklyHours(null)).toBeNull();
    expect(parseWeeklyHours(undefined)).toBeNull();
  });

  it("parses a valid object", () => {
    const input: WeeklyHours = {
      saturday: [{ open: "09:00", close: "21:00" }],
      friday: [],
    };
    expect(parseWeeklyHours(input)).toEqual(input);
  });

  it("parses a JSON string", () => {
    const input = JSON.stringify({
      monday: [{ open: "10:00", close: "20:30" }],
    });
    expect(parseWeeklyHours(input)).toEqual({
      monday: [{ open: "10:00", close: "20:30" }],
    });
  });

  it("rejects invalid JSON and invalid shapes", () => {
    expect(parseWeeklyHours("{")).toBeNull();
    expect(parseWeeklyHours([])).toBeNull();
    expect(parseWeeklyHours({ saturday: "09:00-21:00" })).toBeNull();
    expect(parseWeeklyHours({ saturday: [{ open: "9:00", close: "21:00" }] })).toBeNull();
  });

  it("treats an empty weekly object as unknown-free but valid", () => {
    expect(parseWeeklyHours({})).toEqual({});
  });

  it("exposes all weekdays in order", () => {
    expect(WEEKDAYS[0]).toBe("saturday");
    expect(WEEKDAYS[6]).toBe("friday");
    expect(WEEKDAYS).toHaveLength(7);
  });
});
