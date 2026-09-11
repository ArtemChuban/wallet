import { describe, expect, it } from "vitest";
import {
  formatAccrualCountdown,
  nextAccrualAsOf,
} from "./savings-accrual-display";

describe("nextAccrualAsOf (ACCT-03 / D-05 / D-12)", () => {
  it("clamps DOM 31 onto Feb non-leap when today is before clamp day", () => {
    expect(nextAccrualAsOf("2026-02-10", 31)).toBe("2026-02-28");
  });

  it("on Feb clamp day returns that day (inclusive)", () => {
    expect(nextAccrualAsOf("2026-02-28", 31)).toBe("2026-02-28");
  });

  it("after Feb clamp day rolls to March clamp for DOM 31", () => {
    expect(nextAccrualAsOf("2026-03-01", 31)).toBe("2026-03-31");
  });
});

describe("formatAccrualCountdown (UI-SPEC / D-12)", () => {
  it("returns сегодня when today equals next accrual calendar day", () => {
    expect(formatAccrualCountdown("2026-02-28", "2026-02-28")).toBe("сегодня");
  });

  it("returns через N дн. for N ≥ 1", () => {
    expect(formatAccrualCountdown("2026-02-10", "2026-02-28")).toBe(
      "через 18 дн.",
    );
    expect(formatAccrualCountdown("2026-03-01", "2026-03-31")).toBe(
      "через 30 дн.",
    );
  });
});
