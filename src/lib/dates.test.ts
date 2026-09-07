import { describe, expect, it } from "vitest";
import {
  addCalendarDays,
  clampDayOfMonth,
  formatAsOfDisplay,
  parseAsOfDisplay,
  windowStartForPreset,
} from "@/lib/dates";

describe("formatAsOfDisplay", () => {
  it("formats YYYY-MM-DD as DD.MM.YYYY", () => {
    expect(formatAsOfDisplay("2026-09-03")).toBe("03.09.2026");
  });
});

describe("parseAsOfDisplay", () => {
  it("parses DD.MM.YYYY to YYYY-MM-DD", () => {
    expect(parseAsOfDisplay("03.09.2026")).toBe("2026-09-03");
  });

  it("rejects US-shaped and garbage", () => {
    expect(parseAsOfDisplay("09/03/2026")).toBeNull();
    expect(parseAsOfDisplay("2026-09-03")).toBeNull();
    expect(parseAsOfDisplay("31.02.2026")).toBeNull();
  });
});

describe("addCalendarDays", () => {
  it("subtracts across month boundary", () => {
    expect(addCalendarDays("2026-03-03", -30)).toBe("2026-02-01");
  });

  it("handles leap-day safe subtract", () => {
    expect(addCalendarDays("2024-03-01", -1)).toBe("2024-02-29");
    expect(addCalendarDays("2025-03-01", -1)).toBe("2025-02-28");
  });
});

describe("clampDayOfMonth (D-16 / FND-CLAMP)", () => {
  it("maps DOM 31 to Feb last day (non-leap)", () => {
    expect(clampDayOfMonth(2025, 2, 31)).toBe("2025-02-28");
  });

  it("maps DOM 31 to Feb last day (leap)", () => {
    expect(clampDayOfMonth(2024, 2, 31)).toBe("2024-02-29");
  });

  it("maps DOM 31 to Apr 30", () => {
    expect(clampDayOfMonth(2026, 4, 31)).toBe("2026-04-30");
  });
});

describe("windowStartForPreset", () => {
  it("returns 30 calendar days before today for 30d", () => {
    expect(windowStartForPreset("30d", "2026-09-03")).toBe("2026-08-04");
  });

  it("returns 90 calendar days before today for 90d", () => {
    expect(windowStartForPreset("90d", "2026-09-03")).toBe("2026-06-05");
  });

  it("returns null for all", () => {
    expect(windowStartForPreset("all", "2026-09-03")).toBeNull();
  });

  it("uses 365 calendar days for 1y (A4)", () => {
    expect(windowStartForPreset("1y", "2026-09-03")).toBe("2025-09-03");
  });

  it("leap-year 1y from day after leap day", () => {
    expect(windowStartForPreset("1y", "2025-03-01")).toBe("2024-03-01");
  });
});
