import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { convertOtherMinorToPrimaryMinor } from "@/lib/money";
import type { IncomeActualFactInput } from "@/lib/income";
import {
  assertOneTimePlanImmutable,
  computePersonIncomeStats,
  incomeVarianceMinor,
  incomeVariancePhrase,
  isIncomeOverdue,
  listAllInRange,
  listOneTimeOccurrences,
  listRecurringOccurrences,
  nextOpenPlannedAsOf,
} from "@/lib/income";

function factInput(
  overrides: Partial<IncomeActualFactInput> &
    Pick<
      IncomeActualFactInput,
      "personId" | "currencyCode" | "amountMinor" | "actualAsOf"
    >,
): IncomeActualFactInput {
  return {
    currencyScale: 2,
    isPrimaryCurrency: true,
    ...overrides,
  };
}

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

describe("isIncomeOverdue (FND-OVER / D-08 / D-13)", () => {
  const today = "2026-03-10";

  it("true when plannedAsOf < today and no actual", () => {
    expect(isIncomeOverdue("2026-03-09", false, today)).toBe(true);
  });

  it("false when plannedAsOf == today and no actual", () => {
    expect(isIncomeOverdue("2026-03-10", false, today)).toBe(false);
  });

  it("false when plannedAsOf > today and no actual", () => {
    expect(isIncomeOverdue("2026-03-11", false, today)).toBe(false);
  });

  it("false when hasActual even if plannedAsOf < today", () => {
    expect(isIncomeOverdue("2026-03-01", true, today)).toBe(false);
  });

  it("does not call calendarDateToday — today is injected (D-13)", () => {
    expect(isIncomeOverdue("2020-01-01", false, "2019-12-31")).toBe(false);
    expect(isIncomeOverdue("2020-01-01", false, "2020-01-02")).toBe(true);
  });
});

describe("incomeVarianceMinor / incomeVariancePhrase (ACT-03 / D-14)", () => {
  it("returns actual − plan as bigint with no FX", () => {
    expect(incomeVarianceMinor(1200_00n, 1000_00n)).toBe(200_00n);
    expect(incomeVarianceMinor(800_00n, 1000_00n)).toBe(-200_00n);
    expect(incomeVarianceMinor(1000_00n, 1000_00n)).toBe(0n);
  });

  it("maps delta to RU phrases", () => {
    expect(incomeVariancePhrase(1n)).toBe("больше плана");
    expect(incomeVariancePhrase(-1n)).toBe("меньше плана");
    expect(incomeVariancePhrase(0n)).toBe("как план");
  });
});

describe("assertOneTimePlanImmutable (D-08)", () => {
  const stored = {
    plannedAsOf: "2026-03-05",
    plannedAmountMinor: 1000_00n,
  };

  it("rejects plannedAsOf change when actual exists", () => {
    expect(() =>
      assertOneTimePlanImmutable(true, stored, {
        plannedAsOf: "2026-03-06",
        plannedAmountMinor: 1000_00n,
      }),
    ).toThrow(/immutable/i);
  });

  it("rejects plannedAmountMinor change when actual exists", () => {
    expect(() =>
      assertOneTimePlanImmutable(true, stored, {
        plannedAsOf: "2026-03-05",
        plannedAmountMinor: 999_00n,
      }),
    ).toThrow(/immutable/i);
  });

  it("allows identical plan fields when actual exists", () => {
    expect(() =>
      assertOneTimePlanImmutable(true, stored, { ...stored }),
    ).not.toThrow();
  });

  it("allows plan field changes when no actual yet", () => {
    expect(() =>
      assertOneTimePlanImmutable(false, stored, {
        plannedAsOf: "2026-04-01",
        plannedAmountMinor: 1n,
      }),
    ).not.toThrow();
  });
});

describe("nextOpenPlannedAsOf (D-02 / D-09 / D-10)", () => {
  const def = {
    id: 1,
    plannedAmountMinor: 100_00n,
    dayOfMonth: 15,
    startAsOf: "2026-01-01",
  };

  it("returns earliest past unfilled slot when today is after start (D-10)", () => {
    const next = nextOpenPlannedAsOf(def, [], "2026-03-10");
    expect(next).toBe("2026-01-15");
  });

  it("skips filled earliest slot and returns next open (D-09)", () => {
    const next = nextOpenPlannedAsOf(
      def,
      [{ recurringIncomeId: 1, plannedAsOf: "2026-01-15" }],
      "2026-03-10",
    );
    expect(next).toBe("2026-02-15");
  });

  it("falls back to startAsOf when every slot in horizon is filled (A3)", () => {
    // Fill a long window so none remain open in the ~400d horizon.
    const actuals = [];
    for (let y = 2026; y <= 2028; y++) {
      for (let m = 1; m <= 12; m++) {
        const mm = String(m).padStart(2, "0");
        actuals.push({
          recurringIncomeId: 1,
          plannedAsOf: `${y}-${mm}-15`,
        });
      }
    }
    const next = nextOpenPlannedAsOf(def, actuals, "2026-03-10");
    expect(next).toBe("2026-01-01");
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

describe("computePersonIncomeStats", () => {
  const primaryScale = 2;

  it("sums native multi-ccy buckets sorted by currencyCode asc", () => {
    const byPerson = computePersonIncomeStats(
      [
        factInput({
          personId: 1,
          currencyCode: "USDT",
          amountMinor: 10_00n,
          actualAsOf: "2026-01-10",
          isPrimaryCurrency: false,
          currencyScale: 2,
        }),
        factInput({
          personId: 1,
          currencyCode: "EUR",
          amountMinor: 5_00n,
          actualAsOf: "2026-01-11",
          isPrimaryCurrency: false,
          currencyScale: 2,
        }),
        factInput({
          personId: 1,
          currencyCode: "USDT",
          amountMinor: 3_00n,
          actualAsOf: "2026-02-01",
          isPrimaryCurrency: false,
          currencyScale: 2,
        }),
      ],
      [
        {
          currencyCode: "USDT",
          asOfDate: "2026-01-01",
          rateToPrimaryScaled: 90_00000000n,
        },
        {
          currencyCode: "EUR",
          asOfDate: "2026-01-01",
          rateToPrimaryScaled: 100_00000000n,
        },
      ],
      primaryScale,
    );
    const stats = byPerson.get(1);
    expect(stats).toBeDefined();
    expect(stats!.nativeByCurrency.map((n) => n.currencyCode)).toEqual([
      "EUR",
      "USDT",
    ]);
    expect(stats!.nativeByCurrency[0]!.totalMinor).toBe(5_00n);
    expect(stats!.nativeByCurrency[1]!.totalMinor).toBe(13_00n);
  });

  it("converts primary via locfRateAsOf at each fact actualAsOf (not today)", () => {
    const rateJan = 90_00000000n;
    const rateFeb = 100_00000000n;
    const amount = 10_00n;
    const expected =
      convertOtherMinorToPrimaryMinor(amount, rateJan, 2, primaryScale) +
      convertOtherMinorToPrimaryMinor(amount, rateFeb, 2, primaryScale);
    const byPerson = computePersonIncomeStats(
      [
        factInput({
          personId: 2,
          currencyCode: "USD",
          amountMinor: amount,
          actualAsOf: "2026-01-15",
          isPrimaryCurrency: false,
        }),
        factInput({
          personId: 2,
          currencyCode: "USD",
          amountMinor: amount,
          actualAsOf: "2026-02-15",
          isPrimaryCurrency: false,
        }),
      ],
      [
        {
          currencyCode: "USD",
          asOfDate: "2026-01-01",
          rateToPrimaryScaled: rateJan,
        },
        {
          currencyCode: "USD",
          asOfDate: "2026-02-01",
          rateToPrimaryScaled: rateFeb,
        },
      ],
      primaryScale,
    );
    const stats = byPerson.get(2)!;
    expect(stats.primaryTotalMinor).toBe(expected);
    expect(stats.isPartial).toBe(false);
    expect(stats.excludedFactCount).toBe(0);
  });

  it("missing FX excludes from primary only, sets isPartial, native intact", () => {
    const byPerson = computePersonIncomeStats(
      [
        factInput({
          personId: 3,
          currencyCode: "USD",
          amountMinor: 50_00n,
          actualAsOf: "2026-03-01",
          isPrimaryCurrency: false,
        }),
      ],
      [],
      primaryScale,
    );
    const stats = byPerson.get(3)!;
    expect(stats.nativeByCurrency).toHaveLength(1);
    expect(stats.nativeByCurrency[0]!.totalMinor).toBe(50_00n);
    expect(stats.primaryTotalMinor).toBe(0n);
    expect(stats.isPartial).toBe(true);
    expect(stats.excludedFactCount).toBe(1);
  });

  it("empty facts → empty map (plan-only / no stats)", () => {
    const byPerson = computePersonIncomeStats([], [], primaryScale);
    expect(byPerson.size).toBe(0);
  });

  it("merges recurring + one-time facts for same personId into one Σ", () => {
    const byPerson = computePersonIncomeStats(
      [
        factInput({
          personId: 4,
          currencyCode: "RUB",
          amountMinor: 100_00n,
          actualAsOf: "2026-01-05",
          isPrimaryCurrency: true,
        }),
        factInput({
          personId: 4,
          currencyCode: "RUB",
          amountMinor: 25_00n,
          actualAsOf: "2026-01-20",
          isPrimaryCurrency: true,
        }),
      ],
      [],
      primaryScale,
    );
    const stats = byPerson.get(4)!;
    expect(stats.nativeByCurrency).toHaveLength(1);
    expect(stats.nativeByCurrency[0]!.totalMinor).toBe(125_00n);
    expect(stats.primaryTotalMinor).toBe(125_00n);
    expect(stats.isPartial).toBe(false);
  });

  it("counts ≥2 actuals all-time (not next-open slot only)", () => {
    const byPerson = computePersonIncomeStats(
      [
        factInput({
          personId: 5,
          currencyCode: "RUB",
          amountMinor: 10_00n,
          actualAsOf: "2026-01-15",
          isPrimaryCurrency: true,
        }),
        factInput({
          personId: 5,
          currencyCode: "RUB",
          amountMinor: 20_00n,
          actualAsOf: "2026-02-15",
          isPrimaryCurrency: true,
        }),
        factInput({
          personId: 5,
          currencyCode: "RUB",
          amountMinor: 30_00n,
          actualAsOf: "2026-03-15",
          isPrimaryCurrency: true,
        }),
      ],
      [],
      primaryScale,
    );
    const stats = byPerson.get(5)!;
    expect(stats.nativeByCurrency[0]!.totalMinor).toBe(60_00n);
    expect(stats.primaryTotalMinor).toBe(60_00n);
  });

  it("mixed: convertible + no_fx → partial primary sum only convertible; native both", () => {
    const rate = 90_00000000n;
    const converted = convertOtherMinorToPrimaryMinor(10_00n, rate, 2, primaryScale);
    const byPerson = computePersonIncomeStats(
      [
        factInput({
          personId: 6,
          currencyCode: "USD",
          amountMinor: 10_00n,
          actualAsOf: "2026-01-15",
          isPrimaryCurrency: false,
        }),
        factInput({
          personId: 6,
          currencyCode: "EUR",
          amountMinor: 20_00n,
          actualAsOf: "2026-01-20",
          isPrimaryCurrency: false,
        }),
      ],
      [
        {
          currencyCode: "USD",
          asOfDate: "2026-01-01",
          rateToPrimaryScaled: rate,
        },
      ],
      primaryScale,
    );
    const stats = byPerson.get(6)!;
    expect(stats.nativeByCurrency.map((n) => n.currencyCode)).toEqual([
      "EUR",
      "USD",
    ]);
    expect(stats.nativeByCurrency.find((n) => n.currencyCode === "USD")!.totalMinor).toBe(
      10_00n,
    );
    expect(stats.nativeByCurrency.find((n) => n.currencyCode === "EUR")!.totalMinor).toBe(
      20_00n,
    );
    expect(stats.primaryTotalMinor).toBe(converted);
    expect(stats.isPartial).toBe(true);
    expect(stats.excludedFactCount).toBe(1);
  });
});

describe("income isolation (ISO-01 light)", () => {
  it("income.ts does not import net-worth, historical-series, debts aggregates, or Prisma", () => {
    const src = readFileSync("src/lib/income.ts", "utf8");
    expect(src).not.toMatch(
      /from\s+["']@\/lib\/(?:net-worth|historical-series|debts)["']/,
    );
    expect(src).not.toMatch(
      /from\s+["']@\/generated\/prisma|from\s+["'][^"']*prisma["']/,
    );
  });

  for (const file of ["src/lib/net-worth.ts", "src/lib/historical-series.ts"]) {
    it(`${file} does not import income domain module`, () => {
      const src = readFileSync(file, "utf8");
      expect(src).not.toMatch(/@\/lib\/income|from ["']\.\/income["']/);
    });
  }

  it("UI-01: src/app/income/page.tsx exists", () => {
    expect(existsSync("src/app/income/page.tsx")).toBe(true);
  });
});
