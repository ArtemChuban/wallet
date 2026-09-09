import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  cycleStartAsOf,
  dueAsOfForCycle,
  isGraceOverdue,
  listCycleWindows,
  mergeGraceListRows,
  openGraceForecastMembership,
  resolveCurrentAndNext,
  type GraceForecastObligationInput,
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

  it("sorts OPEN overdue first then nearest dueAsOf (D-08)", () => {
    const rows = mergeGraceListRows(schedule21_15, "2026-02-20", [
      {
        id: 1,
        cycleStartAsOf: "2026-02-21",
        dueAsOf: "2026-03-15",
        amountMinor: "200",
        status: "OPEN",
        note: null,
      },
      {
        id: 2,
        cycleStartAsOf: "2026-01-21",
        dueAsOf: "2026-02-15",
        amountMinor: "100",
        status: "OPEN",
        note: null,
      },
    ]);
    const opens = rows.filter((r) => r.kind === "open");
    expect(opens.map((r) => (r.kind === "open" ? r.obligation.id : null))).toEqual(
      [2, 1],
    );
  });
});

describe("openGraceForecastMembership (D-01…D-04 / C-07)", () => {
  const today = "2026-03-01";
  const horizonEnd = "2026-03-31";

  function row(
    partial: Partial<GraceForecastObligationInput> &
      Pick<GraceForecastObligationInput, "id" | "dueAsOf" | "status">,
  ): GraceForecastObligationInput {
    return {
      amountMinor: 50_000n,
      accountId: 1,
      accountName: "Карта",
      currencyCode: "RUB",
      currencyScale: 2,
      isPrimaryCurrency: true,
      ...partial,
    };
  }

  it("excludes CLOSED / non-OPEN (C-07)", () => {
    const members = openGraceForecastMembership(
      [
        row({ id: 1, dueAsOf: "2026-03-15", status: "CLOSED" }),
        row({ id: 2, dueAsOf: "2026-03-10", status: "OPEN" }),
      ],
      today,
      horizonEnd,
    );
    expect(members.map((m) => m.obligationId)).toEqual([2]);
  });

  it("folds overdue OPEN of any age onto today (D-01, D-02, D-03)", () => {
    const members = openGraceForecastMembership(
      [
        row({ id: 1, dueAsOf: "2026-02-15", status: "OPEN" }),
        row({ id: 2, dueAsOf: "2025-01-01", status: "OPEN" }),
      ],
      today,
      horizonEnd,
    );
    expect(members).toHaveLength(2);
    expect(members.every((m) => m.sampleAsOf === today)).toBe(true);
    expect(members.map((m) => m.dueAsOf).sort()).toEqual([
      "2025-01-01",
      "2026-02-15",
    ]);
  });

  it("dueAsOf === today lands on today bucket (D-04)", () => {
    const members = openGraceForecastMembership(
      [row({ id: 1, dueAsOf: today, status: "OPEN" })],
      today,
      horizonEnd,
    );
    expect(members).toEqual([
      expect.objectContaining({
        obligationId: 1,
        dueAsOf: today,
        sampleAsOf: today,
        amountMinor: 50_000n,
        accountId: 1,
        accountName: "Карта",
        currencyCode: "RUB",
        currencyScale: 2,
        isPrimaryCurrency: true,
      }),
    ]);
  });

  it("future dues in (today, horizonEnd] keep dueAsOf as sampleAsOf (D-04)", () => {
    const members = openGraceForecastMembership(
      [row({ id: 1, dueAsOf: "2026-03-15", status: "OPEN" })],
      today,
      horizonEnd,
    );
    expect(members).toEqual([
      expect.objectContaining({
        obligationId: 1,
        dueAsOf: "2026-03-15",
        sampleAsOf: "2026-03-15",
      }),
    ]);
  });

  it("excludes dueAsOf beyond horizonEnd (D-04)", () => {
    const members = openGraceForecastMembership(
      [row({ id: 1, dueAsOf: "2026-04-15", status: "OPEN" })],
      today,
      horizonEnd,
    );
    expect(members).toEqual([]);
  });
});

describe("GRISO isolation smoke (T-19-03 / Phase 21)", () => {
  it("net-worth and historical-series do not import credit-grace", () => {
    const root = join(process.cwd(), "src/lib");
    for (const file of ["net-worth.ts", "historical-series.ts"]) {
      const src = readFileSync(join(root, file), "utf8");
      expect(src).not.toMatch(/credit-grace/);
    }
  });

  it("page overlay: computeNetWorthRows call site has no grace inputs (T-21-06)", () => {
    const pageSrc = readFileSync(
      join(process.cwd(), "src/app/page.tsx"),
      "utf8",
    );
    expect(pageSrc).toMatch(/computeNetWorthRows\(inputs\)/);
    expect(pageSrc).toMatch(/forecastGrace=/);
    const inputsStart = pageSrc.indexOf("const inputs: NetWorthAccountInput[]");
    const callStart = pageSrc.indexOf("computeNetWorthRows(inputs)");
    expect(inputsStart).toBeGreaterThan(-1);
    expect(callStart).toBeGreaterThan(inputsStart);
    const inputsBlock = pageSrc.slice(inputsStart, callStart);
    expect(inputsBlock).not.toMatch(/grace|Grace|obligation/i);
  });
});
