import { describe, expect, it } from "vitest";
import { calendarDateToday } from "@/lib/dates";
import { optionalAsOfSchema, resolveAsOf } from "./as-of";

/**
 * Shared asOf wire + today default (D-05, D-06, D-08).
 */
describe("resolveAsOf", () => {
  it("defaults omitted asOf via calendarDateToday Europe/Moscow", () => {
    expect(resolveAsOf(undefined)).toBe(calendarDateToday("Europe/Moscow"));
  });

  it("returns explicit YYYY-MM-DD unchanged", () => {
    expect(resolveAsOf("2020-01-15")).toBe("2020-01-15");
  });
});

describe("optionalAsOfSchema", () => {
  it("accepts undefined (optional)", () => {
    expect(optionalAsOfSchema.safeParse(undefined).success).toBe(true);
  });

  it("accepts valid YYYY-MM-DD including future dates", () => {
    expect(optionalAsOfSchema.safeParse("2099-12-31").success).toBe(true);
    expect(optionalAsOfSchema.safeParse("2026-09-10").success).toBe(true);
  });

  it("rejects non YYYY-MM-DD with English message", () => {
    const bad = optionalAsOfSchema.safeParse("10.09.2026");
    expect(bad.success).toBe(false);
    if (!bad.success) {
      expect(bad.error.issues[0]?.message).toBe("asOf must be YYYY-MM-DD");
    }
    const garbage = optionalAsOfSchema.safeParse("not-a-date");
    expect(garbage.success).toBe(false);
    if (!garbage.success) {
      expect(garbage.error.issues[0]?.message).toBe("asOf must be YYYY-MM-DD");
    }
  });
});
