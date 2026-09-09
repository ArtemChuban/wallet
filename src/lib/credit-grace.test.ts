import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  cycleStartAsOf,
  dueAsOfForCycle,
  isGraceOverdue,
  listCycleWindows,
  mergeGraceListRows,
  resolveCurrentAndNext,
} from "@/lib/credit-grace";

const schedule21_15 = {
  statementDayOfMonth: 21,
  dueDayOfMonth: 15,
} as const;

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

describe("listCycleWindows (D-11 / D-12 / D-13)", () => {
  it("returns [] when schedule is null (empty probe / D-13)", () => {
    expect(listCycleWindows(null, "2026-01-01", "2026-02-28")).toEqual([]);
  });

  it("includes 21→15 Jan window in Jan–Feb range (membership = cycleStartAsOf)", () => {
    const windows = listCycleWindows(schedule21_15, "2026-01-01", "2026-02-28");
    expect(windows).toContainEqual({
      cycleStartAsOf: "2026-01-21",
      dueAsOf: "2026-02-15",
    });
    expect(windows).toContainEqual({
      cycleStartAsOf: "2026-02-21",
      dueAsOf: "2026-03-15",
    });
  });

  it("from===to on cycleStartAsOf yields exactly one window (adjacency)", () => {
    expect(
      listCycleWindows(schedule21_15, "2026-01-21", "2026-01-21"),
    ).toEqual([{ cycleStartAsOf: "2026-01-21", dueAsOf: "2026-02-15" }]);
  });

  it("two abutting months yield two windows ascending by cycleStartAsOf (ordering)", () => {
    const windows = listCycleWindows(schedule21_15, "2026-01-01", "2026-02-28");
    expect(windows.map((w) => w.cycleStartAsOf)).toEqual([
      "2026-01-21",
      "2026-02-21",
    ]);
  });
});

describe("resolveCurrentAndNext (RESEARCH Pattern 3)", () => {
  it("returns empty current/next when schedule is null (D-13)", () => {
    expect(resolveCurrentAndNext(null, "2026-02-01")).toEqual({
      current: null,
      next: null,
    });
  });

  it("on statement day: current = that cycle, next = M+1", () => {
    expect(resolveCurrentAndNext(schedule21_15, "2026-01-21")).toEqual({
      current: { cycleStartAsOf: "2026-01-21", dueAsOf: "2026-02-15" },
      next: { cycleStartAsOf: "2026-02-21", dueAsOf: "2026-03-15" },
    });
  });

  it("mid-cycle (after statement, before due): current = M, next = M+1", () => {
    expect(resolveCurrentAndNext(schedule21_15, "2026-02-01")).toEqual({
      current: { cycleStartAsOf: "2026-01-21", dueAsOf: "2026-02-15" },
      next: { cycleStartAsOf: "2026-02-21", dueAsOf: "2026-03-15" },
    });
  });

  it("gap after due before next statement: current null, next = M+1 (locked discretion)", () => {
    // Jan cycle due 2026-02-15; Feb statement 2026-02-21 — gap Feb 16–20
    expect(resolveCurrentAndNext(schedule21_15, "2026-02-16")).toEqual({
      current: null,
      next: { cycleStartAsOf: "2026-02-21", dueAsOf: "2026-03-15" },
    });
  });

  it("inclusive due day still current (not gap)", () => {
    expect(resolveCurrentAndNext(schedule21_15, "2026-02-15")).toEqual({
      current: { cycleStartAsOf: "2026-01-21", dueAsOf: "2026-02-15" },
      next: { cycleStartAsOf: "2026-02-21", dueAsOf: "2026-03-15" },
    });
  });
});

describe("isGraceOverdue (D-07)", () => {
  it("false on inclusive due day; true calendar day after", () => {
    expect(isGraceOverdue("2026-02-15", "2026-02-15")).toBe(false);
    expect(isGraceOverdue("2026-02-15", "2026-02-16")).toBe(true);
  });
});

describe("mergeGraceListRows (D-05 / CYCLE-02)", () => {
  it("emits CTA for candidate windows without persisted rows", () => {
    const rows = mergeGraceListRows(schedule21_15, "2026-02-01", []);
    expect(rows).toEqual([
      {
        kind: "cta",
        cycleStartAsOf: "2026-01-21",
        dueAsOf: "2026-02-15",
      },
      {
        kind: "cta",
        cycleStartAsOf: "2026-02-21",
        dueAsOf: "2026-03-15",
      },
    ]);
  });

  it("uses persisted OPEN instead of inventing CTA for that window", () => {
    const rows = mergeGraceListRows(schedule21_15, "2026-02-01", [
      {
        id: 9,
        cycleStartAsOf: "2026-01-21",
        dueAsOf: "2026-02-15",
        amountMinor: "50000",
        status: "OPEN",
        note: null,
      },
    ]);
    expect(rows).toEqual([
      {
        kind: "open",
        obligation: {
          id: 9,
          cycleStartAsOf: "2026-01-21",
          dueAsOf: "2026-02-15",
          amountMinor: "50000",
          note: null,
        },
      },
      {
        kind: "cta",
        cycleStartAsOf: "2026-02-21",
        dueAsOf: "2026-03-15",
      },
    ]);
  });

  it("lists orphan OPEN above CTAs on gap day (current null)", () => {
    const rows = mergeGraceListRows(schedule21_15, "2026-02-16", [
      {
        id: 3,
        cycleStartAsOf: "2026-01-21",
        dueAsOf: "2026-02-15",
        amountMinor: "100",
        status: "OPEN",
        note: null,
      },
    ]);
    expect(rows[0]).toMatchObject({
      kind: "open",
      obligation: { id: 3, cycleStartAsOf: "2026-01-21" },
    });
    expect(rows.some((r) => r.kind === "cta")).toBe(true);
  });
});

describe("GRISO isolation smoke (T-19-03)", () => {
  it("net-worth and historical-series do not import credit-grace", () => {
    const root = join(process.cwd(), "src/lib");
    for (const file of ["net-worth.ts", "historical-series.ts"]) {
      const src = readFileSync(join(root, file), "utf8");
      expect(src).not.toMatch(/credit-grace/);
    }
  });
});
