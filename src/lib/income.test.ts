import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  listAllInRange,
  listOneTimeOccurrences,
  listRecurringOccurrences,
} from "@/lib/income";

describe("listRecurringOccurrences tracer (FND-OCC / D-13 / D-15 / D-16)", () => {
  it("returns one Feb slot with DOM-31 clamped and bigint plannedAmountMinor", () => {
    const slots = listRecurringOccurrences(
      [
        {
          id: 1,
          plannedAmountMinor: 100_00n,
          dayOfMonth: 31,
          startAsOf: "2026-01-01",
        },
      ],
      [],
      "2026-02-01",
      "2026-02-28",
    );
    expect(slots).toHaveLength(1);
    expect(slots[0]?.plannedAsOf).toBe("2026-02-28");
    expect(slots[0]?.parentId).toBe(1);
    expect(slots[0]?.plannedAmountMinor).toBe(100_00n);
    expect(typeof slots[0]?.plannedAmountMinor).toBe("bigint");
  });
});

describe("listRecurringOccurrences freeze + inclusive range (D-06 / D-07 / D-15)", () => {
  it("keeps Jan frozen plannedAsOf after DOM change; Feb uses new clamp (A2)", () => {
    const slots = listRecurringOccurrences(
      [
        {
          id: 1,
          plannedAmountMinor: 50_000n,
          dayOfMonth: 28,
          startAsOf: "2026-01-01",
        },
      ],
      [{ recurringIncomeId: 1, plannedAsOf: "2026-01-31" }],
      "2026-01-01",
      "2026-02-28",
    );
    const byMonth = Object.fromEntries(
      slots.map((s) => [s.plannedAsOf.slice(0, 7), s.plannedAsOf]),
    );
    expect(byMonth["2026-01"]).toBe("2026-01-31");
    expect(byMonth["2026-02"]).toBe("2026-02-28");
    expect(slots).toHaveLength(2);
    expect(slots.every((s) => typeof s.plannedAmountMinor === "bigint")).toBe(
      true,
    );
    expect(slots[0]?.plannedAmountMinor).toBe(50_000n);
  });

  it("empty month without actual uses current dayOfMonth clamp", () => {
    const slots = listRecurringOccurrences(
      [
        {
          id: 2,
          plannedAmountMinor: 10_00n,
          dayOfMonth: 15,
          startAsOf: "2026-03-01",
        },
      ],
      [],
      "2026-03-01",
      "2026-03-31",
    );
    expect(slots).toEqual([
      {
        parentId: 2,
        plannedAsOf: "2026-03-15",
        plannedAmountMinor: 10_00n,
      },
    ]);
  });

  it("from==to includes single day when plannedAsOf equals it", () => {
    const slots = listRecurringOccurrences(
      [
        {
          id: 3,
          plannedAmountMinor: 1n,
          dayOfMonth: 10,
          startAsOf: "2026-01-01",
        },
      ],
      [],
      "2026-04-10",
      "2026-04-10",
    );
    expect(slots).toHaveLength(1);
    expect(slots[0]?.plannedAsOf).toBe("2026-04-10");
    expect(typeof slots[0]?.plannedAmountMinor).toBe("bigint");
  });

  it("includes boundary plannedAsOf == from and == to; excludes outside", () => {
    const slots = listRecurringOccurrences(
      [
        {
          id: 4,
          plannedAmountMinor: 99n,
          dayOfMonth: 5,
          startAsOf: "2026-01-01",
        },
      ],
      [],
      "2026-05-05",
      "2026-06-05",
    );
    const dates = slots.map((s) => s.plannedAsOf);
    expect(dates).toContain("2026-05-05");
    expect(dates).toContain("2026-06-05");
    expect(dates).not.toContain("2026-04-05");
    expect(dates).not.toContain("2026-07-05");
  });
});

describe("listOneTimeOccurrences + listAllInRange (D-13 / D-14 / D-15)", () => {
  it("emits one-time slot when plannedAsOf in inclusive range with bigint amount", () => {
    const slots = listOneTimeOccurrences(
      [
        {
          id: 10,
          plannedAmountMinor: 1000_00n,
          plannedAsOf: "2026-03-05",
        },
      ],
      [],
      "2026-03-01",
      "2026-03-31",
    );
    expect(slots).toHaveLength(1);
    expect(slots[0]?.parentId).toBe(10);
    expect(slots[0]?.plannedAsOf).toBe("2026-03-05");
    expect(slots[0]?.plannedAmountMinor).toBe(1000_00n);
    expect(typeof slots[0]?.plannedAmountMinor).toBe("bigint");
  });

  it("yields none when one-time plannedAsOf outside range", () => {
    const slots = listOneTimeOccurrences(
      [
        {
          id: 11,
          plannedAmountMinor: 1n,
          plannedAsOf: "2026-04-01",
        },
      ],
      [],
      "2026-03-01",
      "2026-03-31",
    );
    expect(slots).toHaveLength(0);
  });

  it("joins optional actual by (parentId, plannedAsOf) without mutating plan fields", () => {
    const slots = listOneTimeOccurrences(
      [
        {
          id: 12,
          plannedAmountMinor: 500n,
          plannedAsOf: "2026-05-10",
        },
      ],
      [
        {
          oneTimeIncomeId: 12,
          plannedAsOf: "2026-05-10",
          amountMinor: 480n,
          actualAsOf: "2026-05-11",
        },
      ],
      "2026-05-01",
      "2026-05-31",
    );
    expect(slots).toHaveLength(1);
    expect(slots[0]?.plannedAsOf).toBe("2026-05-10");
    expect(slots[0]?.plannedAmountMinor).toBe(500n);
    expect(slots[0]?.actual).toEqual({
      amountMinor: 480n,
      actualAsOf: "2026-05-11",
    });
  });

  it("listAllInRange merges recurring + one-time for explicit from/to", () => {
    const all = listAllInRange(
      {
        recurring: [
          {
            id: 1,
            plannedAmountMinor: 100n,
            dayOfMonth: 15,
            startAsOf: "2026-01-01",
          },
        ],
        recurringActuals: [],
        oneTime: [
          {
            id: 20,
            plannedAmountMinor: 200n,
            plannedAsOf: "2026-06-20",
          },
        ],
        oneTimeActuals: [],
      },
      "2026-06-01",
      "2026-06-30",
    );
    const recurring = all.filter((s) => s.kind === "recurring");
    const oneTime = all.filter((s) => s.kind === "oneTime");
    expect(recurring).toHaveLength(1);
    expect(recurring[0]?.plannedAsOf).toBe("2026-06-15");
    expect(oneTime).toHaveLength(1);
    expect(oneTime[0]?.plannedAsOf).toBe("2026-06-20");
    expect(all.every((s) => typeof s.plannedAmountMinor === "bigint")).toBe(
      true,
    );
  });
});

describe("income schema conventions (D-01..D-05, D-09..D-11)", () => {
  const schema = readFileSync("prisma/schema.prisma", "utf8");

  it("defines four income models with BigInt money and optional note", () => {
    expect(schema).toMatch(/model RecurringIncome\b/);
    expect(schema).toMatch(/model OneTimeIncome\b/);
    expect(schema).toMatch(/model RecurringIncomeActual\b/);
    expect(schema).toMatch(/model OneTimeIncomeActual\b/);
    expect(schema).toMatch(/plannedAmountMinor\s+BigInt/);
    expect(schema).toMatch(/amountMinor\s+BigInt/);
    expect(schema).not.toMatch(/model RecurringIncome[\s\S]*?\bactive\b/);
    expect(schema).not.toMatch(/model RecurringIncome[\s\S]*?\bendAsOf\b/);
  });

  it("uses Restrict on Person/Currency and Cascade on actuals with unique slots", () => {
    expect(schema).toMatch(
      /RecurringIncome[\s\S]*?person[\s\S]*?onDelete:\s*Restrict/,
    );
    expect(schema).toMatch(
      /RecurringIncome[\s\S]*?currency[\s\S]*?onDelete:\s*Restrict/,
    );
    expect(schema).toMatch(
      /RecurringIncomeActual[\s\S]*?onDelete:\s*Cascade/,
    );
    expect(schema).toMatch(
      /OneTimeIncomeActual[\s\S]*?onDelete:\s*Cascade/,
    );
    expect(schema).toMatch(/@@unique\(\[recurringIncomeId,\s*plannedAsOf\]\)/);
    expect(schema).toMatch(/@@unique\(\[oneTimeIncomeId,\s*plannedAsOf\]\)/);
  });
});

describe("income isolation (ISO-01 light)", () => {
  it("income.ts does not import net-worth, historical-series, or Prisma", () => {
    const src = readFileSync("src/lib/income.ts", "utf8");
    expect(src).not.toMatch(
      /from\s+["']@\/lib\/(?:net-worth|historical-series)["']/,
    );
    expect(src).not.toMatch(
      /from\s+["']@\/generated\/prisma|from\s+["'][^"']*prisma["']/,
    );
  });
});
