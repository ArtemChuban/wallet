import { describe, expect, it } from "vitest";
import { cycleStartAsOf, dueAsOfForCycle } from "@/lib/credit-grace";

describe("cycleStartAsOf / dueAsOfForCycle (CYCLE-01 / D-09 / D-10)", () => {
  it("maps T-Bank 21→15 next-month due", () => {
    expect(cycleStartAsOf(2026, 1, 21)).toBe("2026-01-21");
    expect(dueAsOfForCycle("2026-01-21", 15)).toBe("2026-02-15");
  });

  it("clamps statement DOM 31 onto Feb non-leap then dues next month", () => {
    expect(cycleStartAsOf(2025, 2, 31)).toBe("2025-02-28");
    expect(dueAsOfForCycle("2025-02-28", 15)).toBe("2025-03-15");
  });

  it("rolls December cycle into January due year", () => {
    expect(cycleStartAsOf(2026, 12, 21)).toBe("2026-12-21");
    expect(dueAsOfForCycle("2026-12-21", 15)).toBe("2027-01-15");
  });
});
