import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  listInterestSlotsInRange,
  monthlyInterestMinor,
  type InterestAccountInput,
} from "./savings-interest";

function account(
  partial: Partial<InterestAccountInput> &
    Pick<
      InterestAccountInput,
      "accountId" | "balanceMinor" | "annualRateBps" | "accrualDayOfMonth"
    >,
): InterestAccountInput {
  return {
    accountName: "Накопительный",
    currencyCode: "RUB",
    currencyScale: 2,
    isPrimaryCurrency: true,
    ...partial,
  };
}

describe("monthlyInterestMinor (INT-01 / D-08 / D-09 / D-10)", () => {
  it("truncates 16.50% of 1_000_000 minor toward 0", () => {
    expect(monthlyInterestMinor(1_000_000n, 1650)).toBe(13750n);
  });

  it("uses truncated credits as the next principal (D-02)", () => {
    expect(monthlyInterestMinor(1_000_000n, 1200)).toBe(10000n);
    expect(monthlyInterestMinor(1_010_000n, 1200)).toBe(10100n);
  });

  it("drops the fractional minor and does not carry it (D-09)", () => {
    expect(monthlyInterestMinor(100n, 10000)).toBe(8n);
    expect(monthlyInterestMinor(108n, 10000)).toBe(9n);
  });

  it("returns 0n for sub-minor, zero, and negative principal (D-10)", () => {
    expect(monthlyInterestMinor(1n, 1)).toBe(0n);
    expect(monthlyInterestMinor(0n, 1200)).toBe(0n);
    expect(monthlyInterestMinor(1_000_000n, 0)).toBe(0n);
    expect(monthlyInterestMinor(-100n, 10000)).toBe(0n);
  });
});

describe("listInterestSlotsInRange (D-01…D-10 / D-13)", () => {
  it("compounds month 2 above month 1 on the accrual DOM (D-01, D-02, D-05)", () => {
    const slots = listInterestSlotsInRange(
      [
        account({
          accountId: 7,
          balanceMinor: 1_000_000n,
          annualRateBps: 1200,
          accrualDayOfMonth: 15,
        }),
      ],
      "2026-03-01",
      "2026-04-30",
    );
    expect(slots.map((s) => s.plannedAsOf)).toEqual([
      "2026-03-15",
      "2026-04-15",
    ]);
    expect(slots.map((s) => s.interestMinor)).toEqual([10000n, 10100n]);
    expect(slots[1]?.interestMinor).not.toBe(10000n);
    expect(slots.every((s) => s.parentId === s.accountId && s.accountId === 7)).toBe(
      true,
    );
  });

  it("compounds the truncated 8n credit into 9n (D-09)", () => {
    const slots = listInterestSlotsInRange(
      [
        account({
          accountId: 7,
          balanceMinor: 100n,
          annualRateBps: 10000,
          accrualDayOfMonth: 15,
        }),
      ],
      "2026-03-01",
      "2026-04-30",
    );
    expect(slots.map((s) => [s.plannedAsOf, s.interestMinor])).toEqual([
      ["2026-03-15", 8n],
      ["2026-04-15", 9n],
    ]);
  });

  it("emits nothing when the truncated month is 0n (D-10)", () => {
    const today = "2026-03-01";
    const horizonEnd = "2026-04-30";
    const dom = 15;
    expect(
      listInterestSlotsInRange(
        [
          account({
            accountId: 1,
            balanceMinor: 1_000_000n,
            annualRateBps: 0,
            accrualDayOfMonth: dom,
          }),
        ],
        today,
        horizonEnd,
      ),
    ).toEqual([]);
    expect(
      listInterestSlotsInRange(
        [
          account({
            accountId: 1,
            balanceMinor: 0n,
            annualRateBps: 1200,
            accrualDayOfMonth: dom,
          }),
        ],
        today,
        horizonEnd,
      ),
    ).toEqual([]);
    expect(
      listInterestSlotsInRange(
        [
          account({
            accountId: 1,
            balanceMinor: 1n,
            annualRateBps: 1,
            accrualDayOfMonth: dom,
          }),
        ],
        today,
        horizonEnd,
      ),
    ).toEqual([]);
    expect(
      listInterestSlotsInRange(
        [
          account({
            accountId: 1,
            balanceMinor: -100n,
            annualRateBps: 10000,
            accrualDayOfMonth: dom,
          }),
        ],
        today,
        horizonEnd,
      ),
    ).toEqual([]);
  });

  it("clamps DOM 31 onto short February then March (D-07)", () => {
    const slots = listInterestSlotsInRange(
      [
        account({
          accountId: 1,
          balanceMinor: 1_000_000n,
          annualRateBps: 1200,
          accrualDayOfMonth: 31,
        }),
      ],
      "2026-02-10",
      "2026-03-31",
    );
    expect(slots.map((s) => s.plannedAsOf)).toEqual(["2026-02-28", "2026-03-31"]);
  });

  it("does not repeat a sticky accrual day that is today (D-07)", () => {
    const slots = listInterestSlotsInRange(
      [
        account({
          accountId: 1,
          balanceMinor: 1_000_000n,
          annualRateBps: 1200,
          accrualDayOfMonth: 31,
        }),
      ],
      "2026-02-28",
      "2026-03-31",
    );
    expect(slots.map((s) => s.plannedAsOf)).toEqual(["2026-03-31"]);
    expect(slots.some((s) => s.plannedAsOf === "2026-02-28")).toBe(false);
  });

  it("clamps DOM 31 onto leap day (D-07)", () => {
    const slots = listInterestSlotsInRange(
      [
        account({
          accountId: 1,
          balanceMinor: 1_000_000n,
          annualRateBps: 1200,
          accrualDayOfMonth: 31,
        }),
      ],
      "2024-02-01",
      "2024-02-29",
    );
    expect(slots.map((s) => s.plannedAsOf)).toEqual(["2024-02-29"]);
  });

  it("includes plannedAsOf equal to horizonEnd and drops the next accrual", () => {
    const slots = listInterestSlotsInRange(
      [
        account({
          accountId: 1,
          balanceMinor: 1_000_000n,
          annualRateBps: 1200,
          accrualDayOfMonth: 15,
        }),
      ],
      "2026-03-01",
      "2026-03-15",
    );
    expect(slots.map((s) => s.plannedAsOf)).toEqual(["2026-03-15"]);
  });

  it("compounds accounts independently and sorts by date then accountId (D-04, D-13)", () => {
    const slots = listInterestSlotsInRange(
      [
        account({
          accountId: 20,
          balanceMinor: 2_000_000n,
          annualRateBps: 1200,
          accrualDayOfMonth: 15,
        }),
        account({
          accountId: 4,
          balanceMinor: 1_000_000n,
          annualRateBps: 1200,
          accrualDayOfMonth: 15,
        }),
      ],
      "2026-03-01",
      "2026-04-30",
    );
    expect(
      slots.map((s) => [s.plannedAsOf, s.accountId, s.parentId, s.interestMinor]),
    ).toEqual([
      ["2026-03-15", 4, 4, 10000n],
      ["2026-03-15", 20, 20, 20000n],
      ["2026-04-15", 4, 4, 10100n],
      ["2026-04-15", 20, 20, 20200n],
    ]);
  });

  it("round-trips account currency and does not convert FX (D-06)", () => {
    const slots = listInterestSlotsInRange(
      [
        account({
          accountId: 3,
          accountName: "USD jar",
          balanceMinor: 1_000_000n,
          annualRateBps: 1200,
          accrualDayOfMonth: 15,
          currencyCode: "USD",
          currencyScale: 0,
          isPrimaryCurrency: false,
        }),
      ],
      "2026-03-01",
      "2026-03-31",
    );
    expect(slots).toEqual([
      {
        plannedAsOf: "2026-03-15",
        interestMinor: 10000n,
        parentId: 3,
        accountId: 3,
        accountName: "USD jar",
        currencyCode: "USD",
        currencyScale: 0,
        isPrimaryCurrency: false,
      },
    ]);
  });
});

describe("interest module isolation smoke (T-28-03)", () => {
  it("rejects an exponentiation call and forecast, historical NW, and database imports", () => {
    const src = readFileSync(
      join(process.cwd(), "src/lib/savings-interest.ts"),
      "utf8",
    );
    expect(src).not.toMatch(/Math\.pow/);
    expect(src).not.toMatch(/nw-forecast|historical-series|net-worth|prisma/);
  });
});
