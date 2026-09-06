import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { convertOtherMinorToPrimaryMinor } from "./money";
import type { DebtPrimaryTotalsInput } from "./debts";
import {
  assertInitialImmutable,
  assertRepaymentAmount,
  assertSizeDelta,
  assertStatusSynced,
  buildDebtPrincipalStackSeries,
  computeDebtPrimaryTotals,
  currentPrincipalMinor,
  remainingMinor,
  statusForRemaining,
} from "./debts";

function debtInput(
  overrides: Partial<DebtPrimaryTotalsInput> &
    Pick<DebtPrimaryTotalsInput, "id" | "direction" | "remainingMinor">,
): DebtPrimaryTotalsInput {
  return {
    status: "OPEN",
    currencyScale: 2,
    isPrimaryCurrency: true,
    rateToPrimaryScaled: null,
    primaryScale: 2,
    ...overrides,
  };
}

describe("DEBT-02 remaining (CONTEXT D-04 size-change ledger)", () => {
  it("initial only: remaining equals initialAmountMinor", () => {
    expect(remainingMinor(10_000n, [], [])).toBe(10_000n);
    expect(currentPrincipalMinor(10_000n, [])).toBe(10_000n);
  });

  it("adds signed size deltas into current principal", () => {
    expect(currentPrincipalMinor(10_000n, [2_000n, -500n])).toBe(11_500n);
    expect(remainingMinor(10_000n, [2_000n, -500n], [])).toBe(11_500n);
  });

  it("subtracts repayments from current principal", () => {
    expect(remainingMinor(10_000n, [1_000n], [3_000n, 500n])).toBe(7_500n);
  });

  it("early-close style: down-delta to zero remaining", () => {
    const initial = 5_000n;
    const paid = [1_000n] as const;
    const remainingBeforeClose = remainingMinor(initial, [], paid);
    expect(remainingBeforeClose).toBe(4_000n);
    const closeDelta = -remainingBeforeClose;
    expect(remainingMinor(initial, [closeDelta], paid)).toBe(0n);
  });

  it("is idempotent for same bigint inputs", () => {
    const deltas = [100n, -20n] as const;
    const pays = [30n] as const;
    const a = remainingMinor(1_000n, deltas, pays);
    const b = remainingMinor(1_000n, deltas, pays);
    expect(a).toBe(b);
    expect(a).toBe(1_050n);
  });
});

describe("status sync (D-12, D-13)", () => {
  it("maps 0n to CLOSED and positive remaining to OPEN", () => {
    expect(statusForRemaining(0n)).toBe("CLOSED");
    expect(statusForRemaining(1n)).toBe("OPEN");
    expect(statusForRemaining(99_99n)).toBe("OPEN");
  });

  it("throws on negative remaining", () => {
    expect(() => statusForRemaining(-1n)).toThrow(/remaining must never be < 0/);
  });
});

describe("assertRepaymentAmount (D-15)", () => {
  it("accepts amount equal to remainingBefore", () => {
    expect(() => assertRepaymentAmount(5n, 5n)).not.toThrow();
  });

  it("rejects amount greater than remainingBefore", () => {
    expect(() => assertRepaymentAmount(6n, 5n)).toThrow(
      /repayment exceeds remaining/,
    );
  });

  it("rejects zero and negative amounts", () => {
    expect(() => assertRepaymentAmount(0n, 5n)).toThrow(
      /repayment amount must be > 0/,
    );
    expect(() => assertRepaymentAmount(-1n, 5n)).toThrow(
      /repayment amount must be > 0/,
    );
  });
});

describe("assertSizeDelta (D-05, D-15)", () => {
  it("rejects zero delta", () => {
    expect(() => assertSizeDelta(0n, 10n, 0n)).toThrow(
      /size delta must not be 0/,
    );
  });

  it("rejects size-down that would make principal below sum repayments", () => {
    expect(() => assertSizeDelta(-3n, 10n, 8n)).toThrow(
      /size change would make remaining < 0/,
    );
  });

  it("accepts size-down exactly to sumRepayments and ups", () => {
    expect(() => assertSizeDelta(-2n, 10n, 8n)).not.toThrow();
    expect(() => assertSizeDelta(5n, 10n, 8n)).not.toThrow();
  });
});

describe("assertInitialImmutable (DEBT-03 / D-03)", () => {
  it("rejects proposed new initial after create", () => {
    expect(() => assertInitialImmutable(10_000n, 9_000n)).toThrow(
      /initialAmountMinor is immutable/,
    );
  });

  it("allows identical proposed initial (no-op check)", () => {
    expect(() => assertInitialImmutable(10_000n, 10_000n)).not.toThrow();
  });
});

describe("assertStatusSynced (D-13)", () => {
  it("throws when OPEN with remaining 0n", () => {
    expect(() => assertStatusSynced("OPEN", 0n)).toThrow(/status desync/);
  });

  it("accepts CLOSED at 0n and OPEN at positive", () => {
    expect(() => assertStatusSynced("CLOSED", 0n)).not.toThrow();
    expect(() => assertStatusSynced("OPEN", 1n)).not.toThrow();
  });
});

describe("computeDebtPrimaryTotals (D-16–D-19)", () => {
  it("omits CLOSED debts from rows and aggregates", () => {
    const { rows, iOwePrimaryMinor, theyOwePrimaryMinor, isPartial } =
      computeDebtPrimaryTotals([
        debtInput({
          id: 1,
          direction: "I_OWE",
          remainingMinor: 0n,
          status: "CLOSED",
        }),
        debtInput({
          id: 2,
          direction: "I_OWE",
          remainingMinor: 1_000n,
        }),
      ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.debtId).toBe(2);
    expect(iOwePrimaryMinor).toBe(1_000n);
    expect(theyOwePrimaryMinor).toBe(0n);
    expect(isPartial).toBe(false);
  });

  it("uses primary currency identity without rateToPrimaryScaled", () => {
    const { rows, iOwePrimaryMinor, isPartial } = computeDebtPrimaryTotals([
      debtInput({
        id: 5,
        direction: "I_OWE",
        remainingMinor: 42_00n,
        rateToPrimaryScaled: null,
      }),
    ]);
    expect(rows[0]!.includedInTotal).toBe(true);
    expect(rows[0]!.excludeReason).toBe("none");
    expect(rows[0]!.contributionPrimaryMinor).toBe(42_00n);
    expect(iOwePrimaryMinor).toBe(42_00n);
    expect(isPartial).toBe(false);
  });

  it("excludes non-primary without FX with no_fx and isPartial", () => {
    const { rows, iOwePrimaryMinor, isPartial } = computeDebtPrimaryTotals([
      debtInput({
        id: 3,
        direction: "I_OWE",
        remainingMinor: 50_000n,
        isPrimaryCurrency: false,
        rateToPrimaryScaled: null,
      }),
    ]);
    expect(iOwePrimaryMinor).toBe(0n);
    expect(isPartial).toBe(true);
    expect(rows[0]!.excludeReason).toBe("no_fx");
    expect(rows[0]!.includedInTotal).toBe(false);
    expect(rows[0]!.contributionPrimaryMinor).toBe(0n);
  });

  it("converts non-primary with rate into direction buckets", () => {
    const rate = 90_00000000n;
    const remaining = 10_000n;
    const expected = convertOtherMinorToPrimaryMinor(remaining, rate, 2, 2);
    const { rows, iOwePrimaryMinor, theyOwePrimaryMinor, isPartial } =
      computeDebtPrimaryTotals([
        debtInput({
          id: 7,
          direction: "I_OWE",
          remainingMinor: remaining,
          isPrimaryCurrency: false,
          rateToPrimaryScaled: rate,
        }),
        debtInput({
          id: 8,
          direction: "THEY_OWE",
          remainingMinor: remaining,
          isPrimaryCurrency: false,
          rateToPrimaryScaled: rate,
        }),
      ]);
    expect(rows[0]!.contributionPrimaryMinor).toBe(expected);
    expect(rows[1]!.contributionPrimaryMinor).toBe(expected);
    expect(iOwePrimaryMinor).toBe(expected);
    expect(theyOwePrimaryMinor).toBe(expected);
    expect(isPartial).toBe(false);
  });

  it("mixed OPEN set: aggregates correct and isPartial if any excluded", () => {
    const rate = 90_00000000n;
    const { iOwePrimaryMinor, theyOwePrimaryMinor, isPartial, rows } =
      computeDebtPrimaryTotals([
        debtInput({
          id: 10,
          direction: "I_OWE",
          remainingMinor: 100n,
        }),
        debtInput({
          id: 11,
          direction: "THEY_OWE",
          remainingMinor: 200n,
          isPrimaryCurrency: false,
          rateToPrimaryScaled: null,
        }),
        debtInput({
          id: 12,
          direction: "THEY_OWE",
          remainingMinor: 50n,
          isPrimaryCurrency: false,
          rateToPrimaryScaled: rate,
        }),
        debtInput({
          id: 13,
          direction: "I_OWE",
          remainingMinor: 0n,
          status: "CLOSED",
        }),
      ]);
    const theyConverted = convertOtherMinorToPrimaryMinor(50n, rate, 2, 2);
    expect(iOwePrimaryMinor).toBe(100n);
    expect(theyOwePrimaryMinor).toBe(theyConverted);
    expect(isPartial).toBe(true);
    expect(rows).toHaveLength(3);
    expect(rows.find((r) => r.debtId === 11)!.includedInTotal).toBe(false);
  });
});

describe("schema conventions (Person/Debt/events)", () => {
  const schema = readFileSync("prisma/schema.prisma", "utf8");

  it("defines Person, Debt, DebtRepayment, DebtSizeChange with BigInt money", () => {
    expect(schema).toMatch(/model Person\b/);
    expect(schema).toMatch(/model Debt\b/);
    expect(schema).toMatch(/model DebtRepayment\b/);
    expect(schema).toMatch(/model DebtSizeChange\b/);
    expect(schema).toMatch(/initialAmountMinor\s+BigInt/);
    expect(schema).toMatch(/deltaMinor\s+BigInt/);
    expect(schema).toMatch(/amountMinor\s+BigInt/);
  });

  it("uses Restrict/Cascade onDelete and no writeOff/closedAt", () => {
    expect(schema).toMatch(/onDelete:\s*Restrict/);
    expect(schema).toMatch(/onDelete:\s*Cascade/);
    expect(schema).not.toMatch(/writeOffMinor/);
    expect(schema).not.toMatch(/closedAt/);
    expect(schema).not.toMatch(/@@unique\(\[debtId,\s*asOfDate\]/);
  });
});

describe("DISOL-01 isolation", () => {
  for (const file of [
    "src/lib/net-worth.ts",
    "src/lib/historical-series.ts",
    "src/app/page.tsx",
  ]) {
    it(`${file} does not import debts`, () => {
      const src = readFileSync(file, "utf8");
      expect(src).not.toMatch(/@\/lib\/debts|from ["']\.\/debts["']/);
    });
  }
});

describe("buildDebtPrincipalStackSeries", () => {
  const scale = 2;

  function assertStackInvariant(
    points: { repaidMajor: number; remainingMajor: number }[],
  ) {
    for (const p of points) {
      expect(p.remainingMajor).toBeGreaterThanOrEqual(0);
      expect(p.repaidMajor).toBeGreaterThanOrEqual(0);
      // principal-at-date = repaid + remaining (D-03); both legs non-negative
      expect(p.repaidMajor + p.remainingMajor).toBeGreaterThanOrEqual(0);
    }
  }

  it("seeds at openedAsOf and stays flat to today when no events", () => {
    const points = buildDebtPrincipalStackSeries({
      openedAsOf: "2026-08-01",
      initialAmountMinor: 10_000n,
      repayments: [],
      sizeChanges: [],
      today: "2026-09-06",
      scale,
    });
    expect(points).toEqual([
      { asOfDate: "2026-08-01", repaidMajor: 0, remainingMajor: 100 },
      { asOfDate: "2026-09-06", repaidMajor: 0, remainingMajor: 100 },
    ]);
    assertStackInvariant(points);
  });

  it("after repayment remaining drops and repaid rises", () => {
    const points = buildDebtPrincipalStackSeries({
      openedAsOf: "2026-08-01",
      initialAmountMinor: 10_000n,
      repayments: [
        { id: 1, asOfDate: "2026-08-15", amountMinor: 3_000n },
      ],
      sizeChanges: [],
      today: "2026-09-06",
      scale,
    });
    expect(points).toEqual([
      { asOfDate: "2026-08-01", repaidMajor: 0, remainingMajor: 100 },
      { asOfDate: "2026-08-15", repaidMajor: 30, remainingMajor: 70 },
      { asOfDate: "2026-09-06", repaidMajor: 30, remainingMajor: 70 },
    ]);
    for (const p of points) {
      expect(p.repaidMajor + p.remainingMajor).toBe(100);
    }
  });

  it("size-change changes stack height without a third series", () => {
    const points = buildDebtPrincipalStackSeries({
      openedAsOf: "2026-08-01",
      initialAmountMinor: 10_000n,
      repayments: [],
      sizeChanges: [
        { id: 1, asOfDate: "2026-08-10", deltaMinor: 2_000n },
      ],
      today: "2026-09-06",
      scale,
    });
    expect(points.map((p) => Object.keys(p).sort())).toEqual([
      ["asOfDate", "remainingMajor", "repaidMajor"],
      ["asOfDate", "remainingMajor", "repaidMajor"],
      ["asOfDate", "remainingMajor", "repaidMajor"],
    ]);
    expect(points).toEqual([
      { asOfDate: "2026-08-01", repaidMajor: 0, remainingMajor: 100 },
      { asOfDate: "2026-08-10", repaidMajor: 0, remainingMajor: 120 },
      { asOfDate: "2026-09-06", repaidMajor: 0, remainingMajor: 120 },
    ]);
    for (const p of points) {
      expect(p.repaidMajor + p.remainingMajor).toBe(
        p.asOfDate === "2026-08-01" ? 100 : 120,
      );
    }
  });

  it("emits one point per distinct asOfDate across multi-day sequence", () => {
    const points = buildDebtPrincipalStackSeries({
      openedAsOf: "2026-08-01",
      initialAmountMinor: 10_000n,
      repayments: [
        { id: 1, asOfDate: "2026-08-05", amountMinor: 1_000n },
        { id: 2, asOfDate: "2026-08-20", amountMinor: 2_000n },
      ],
      sizeChanges: [
        { id: 1, asOfDate: "2026-08-10", deltaMinor: 5_000n },
      ],
      today: "2026-09-06",
      scale,
    });
    const dates = points.map((p) => p.asOfDate);
    expect(dates).toEqual([
      "2026-08-01",
      "2026-08-05",
      "2026-08-10",
      "2026-08-20",
      "2026-09-06",
    ]);
    expect(new Set(dates).size).toBe(dates.length);
    expect(points.at(-2)).toEqual({
      asOfDate: "2026-08-20",
      repaidMajor: 30,
      remainingMajor: 120,
    });
  });

  it("collapses same-day multi-event to one point", () => {
    const points = buildDebtPrincipalStackSeries({
      openedAsOf: "2026-08-01",
      initialAmountMinor: 10_000n,
      repayments: [
        { id: 1, asOfDate: "2026-08-15", amountMinor: 1_000n },
        { id: 2, asOfDate: "2026-08-15", amountMinor: 500n },
      ],
      sizeChanges: [
        { id: 1, asOfDate: "2026-08-15", deltaMinor: 2_000n },
      ],
      today: "2026-08-15",
      scale,
    });
    const onDay = points.filter((p) => p.asOfDate === "2026-08-15");
    expect(onDay).toHaveLength(1);
    // Prefix sums: repaid=15, remaining=105 (order-independent)
    expect(onDay[0]).toEqual({
      asOfDate: "2026-08-15",
      repaidMajor: 15,
      remainingMajor: 105,
    });
    expect(onDay[0]!.repaidMajor + onDay[0]!.remainingMajor).toBe(120);
  });

  it("uses chronological prefix (size after repay date does not inflate that day)", () => {
    // CR-01: open 100 → size +100 on Aug 20 → repay 50 dated Aug 10
    const points = buildDebtPrincipalStackSeries({
      openedAsOf: "2026-08-01",
      initialAmountMinor: 10_000n,
      repayments: [
        { id: 1, asOfDate: "2026-08-10", amountMinor: 5_000n },
      ],
      sizeChanges: [
        { id: 1, asOfDate: "2026-08-20", deltaMinor: 10_000n },
      ],
      today: "2026-09-06",
      scale,
    });
    expect(points).toEqual([
      { asOfDate: "2026-08-01", repaidMajor: 0, remainingMajor: 100 },
      { asOfDate: "2026-08-10", repaidMajor: 50, remainingMajor: 50 },
      { asOfDate: "2026-08-20", repaidMajor: 50, remainingMajor: 150 },
      { asOfDate: "2026-09-06", repaidMajor: 50, remainingMajor: 150 },
    ]);
    assertStackInvariant(points);
    expect(points[0]!.repaidMajor + points[0]!.remainingMajor).toBe(100);
    expect(points[1]!.repaidMajor + points[1]!.remainingMajor).toBe(100);
    expect(points[2]!.repaidMajor + points[2]!.remainingMajor).toBe(200);
  });

  it("end-of-day totals are order-independent for same asOfDate", () => {
    const points = buildDebtPrincipalStackSeries({
      openedAsOf: "2026-08-01",
      initialAmountMinor: 10_000n,
      repayments: [
        { id: 5, asOfDate: "2026-08-15", amountMinor: 10_000n },
      ],
      sizeChanges: [
        { id: 5, asOfDate: "2026-08-15", deltaMinor: 5_000n },
      ],
      today: "2026-08-15",
      scale,
    });
    const day = points.find((p) => p.asOfDate === "2026-08-15")!;
    expect(day).toEqual({
      asOfDate: "2026-08-15",
      repaidMajor: 100,
      remainingMajor: 50,
    });
  });

  it("skips events before openedAsOf so X-axis stays monotonic (CR-02)", () => {
    const points = buildDebtPrincipalStackSeries({
      openedAsOf: "2026-09-01",
      initialAmountMinor: 10_000n,
      repayments: [
        { id: 1, asOfDate: "2026-08-01", amountMinor: 1_000n },
        { id: 2, asOfDate: "2026-09-05", amountMinor: 2_000n },
      ],
      sizeChanges: [],
      today: "2026-09-06",
      scale,
    });
    const dates = points.map((p) => p.asOfDate);
    expect(dates).toEqual(["2026-09-01", "2026-09-05", "2026-09-06"]);
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i]! >= dates[i - 1]!).toBe(true);
    }
    expect(points[0]).toEqual({
      asOfDate: "2026-09-01",
      repaidMajor: 0,
      remainingMajor: 100,
    });
  });
});
