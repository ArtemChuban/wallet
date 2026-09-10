import { describe, expect, it } from "vitest";
import { calendarDateToday } from "@/lib/dates";
import {
  optionalAsOfSchema,
  optionalHorizonEndSchema,
  optionalIncomeRangeSchema,
  resolveAsOf,
} from "./as-of";

/**
 * Shared asOf wire + today default (D-05, D-06, D-08).
 * SIDE: optionalHorizonEndSchema + paired from/to (D-02, Plan 04).
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

describe("optionalHorizonEndSchema", () => {
  it("accepts undefined (optional)", () => {
    expect(optionalHorizonEndSchema.safeParse(undefined).success).toBe(true);
  });

  it("accepts valid YYYY-MM-DD", () => {
    expect(optionalHorizonEndSchema.safeParse("2027-09-10").success).toBe(true);
  });

  it("rejects garbage with English message horizonEnd must be YYYY-MM-DD", () => {
    const bad = optionalHorizonEndSchema.safeParse("10.09.2026");
    expect(bad.success).toBe(false);
    if (!bad.success) {
      expect(bad.error.issues[0]?.message).toBe(
        "horizonEnd must be YYYY-MM-DD",
      );
    }
    const garbage = optionalHorizonEndSchema.safeParse("not-a-date");
    expect(garbage.success).toBe(false);
    if (!garbage.success) {
      expect(garbage.error.issues[0]?.message).toBe(
        "horizonEnd must be YYYY-MM-DD",
      );
    }
  });
});

describe("optionalIncomeRangeSchema", () => {
  it("accepts both omitted", () => {
    expect(optionalIncomeRangeSchema.safeParse({}).success).toBe(true);
  });

  it("accepts both from and to YYYY-MM-DD", () => {
    expect(
      optionalIncomeRangeSchema.safeParse({
        from: "2026-01-01",
        to: "2026-12-31",
      }).success,
    ).toBe(true);
  });

  it("rejects only from or only to set", () => {
    const onlyFrom = optionalIncomeRangeSchema.safeParse({
      from: "2026-01-01",
    });
    expect(onlyFrom.success).toBe(false);
    const onlyTo = optionalIncomeRangeSchema.safeParse({ to: "2026-12-31" });
    expect(onlyTo.success).toBe(false);
  });

  it("rejects non YYYY-MM-DD from/to", () => {
    const bad = optionalIncomeRangeSchema.safeParse({
      from: "01.01.2026",
      to: "2026-12-31",
    });
    expect(bad.success).toBe(false);
  });
});
