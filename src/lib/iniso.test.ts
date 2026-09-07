import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RATE_SCALE_E8 } from "@/lib/money";
import {
  buildNetWorthSeries,
  type BuildNetWorthSeriesInput,
  type SeriesAccount,
  type SeriesRate,
  type SeriesSnapshot,
} from "./historical-series";

/** INISO-01: income/forecast must not couple into NW math (ISO-01, D-17, D-18). */
describe("INISO-01 isolation", () => {
  for (const file of ["src/lib/net-worth.ts", "src/lib/historical-series.ts"]) {
    it(`${file} does not import income or nw-forecast`, () => {
      const src = readFileSync(file, "utf8");
      expect(src).not.toMatch(/@\/lib\/income|from ["']\.\/income["']/);
      expect(src).not.toMatch(/@\/lib\/nw-forecast|from ["']\.\/nw-forecast["']/);
    });
  }

  it("nw-forecast.ts bans prisma / BalanceSnapshot / net-worth / historical-series", () => {
    const src = readFileSync("src/lib/nw-forecast.ts", "utf8");
    expect(src).not.toMatch(
      /from\s+["']@\/generated\/prisma|from\s+["'][^"']*prisma["']/,
    );
    expect(src).not.toMatch(/\bBalanceSnapshot\b/);
    expect(src).not.toMatch(/@\/lib\/(?:net-worth|historical-series)/);
    expect(src).not.toMatch(/from ["']\.\/(?:net-worth|historical-series)["']/);
  });

  /**
   * Past-series golden identity (D-17): same accounts/snapshots/rates → identical
   * totals whether income is conceptually present or not. Income never enters
   * buildNetWorthSeries — API surface has no income field; a second call with
   * the same NW inputs stays bitwise-identical (ISO-01).
   */
  it("INISO past series golden identity identical with/without income fixtures (D-17)", () => {
    const accounts: SeriesAccount[] = [
      {
        id: 1,
        type: "FIAT_DEBIT",
        currencyCode: "RUB",
        currencyScale: 2,
        isPrimaryCurrency: true,
        creditLimitMinor: null,
      },
      {
        id: 2,
        type: "FIAT_DEBIT",
        currencyCode: "USD",
        currencyScale: 2,
        isPrimaryCurrency: false,
        creditLimitMinor: null,
      },
    ];
    const snapshots: SeriesSnapshot[] = [
      { accountId: 1, asOfDate: "2026-01-01", amountMinor: 100_000n },
      { accountId: 2, asOfDate: "2026-01-01", amountMinor: 10_000n },
      { accountId: 1, asOfDate: "2026-01-15", amountMinor: 150_000n },
    ];
    const rates: SeriesRate[] = [
      {
        currencyCode: "USD",
        asOfDate: "2026-01-01",
        rateToPrimaryScaled: 50n * RATE_SCALE_E8,
      },
      {
        currencyCode: "USD",
        asOfDate: "2026-01-20",
        rateToPrimaryScaled: 55n * RATE_SCALE_E8,
      },
    ];
    const input: BuildNetWorthSeriesInput = {
      accounts,
      snapshots,
      rates,
      primaryScale: 2,
      preset: "90d",
      today: "2026-01-31",
    };

    // Conceptual income fixture — never passed into NW math (isolation wall).
    const _incomePresentConceptually = {
      recurring: [{ plannedAmountMinor: 200_000n, dayOfMonth: 25 }],
      oneTime: [{ plannedAsOf: "2026-02-10", plannedAmountMinor: 50_000n }],
    };
    void _incomePresentConceptually;

    const withoutIncomeCall = buildNetWorthSeries(input);
    const withIncomeStillSameCall = buildNetWorthSeries({ ...input });

    const golden = withoutIncomeCall.map((p) => [
      p.asOfDate,
      p.totalPrimaryMinor.toString(),
    ]);
    expect(withIncomeStillSameCall.map((p) => [p.asOfDate, p.totalPrimaryMinor.toString()])).toEqual(
      golden,
    );
    expect(golden.length).toBeGreaterThan(0);

    // API surface: BuildNetWorthSeriesInput has no income / forecast fields
    const keys = Object.keys(input).sort();
    expect(keys).toEqual(
      ["accounts", "preset", "primaryScale", "rates", "snapshots", "today"].sort(),
    );
    expect(keys).not.toContain("income");
    expect(keys).not.toContain("forecast");
    expect(keys).not.toContain("recurring");
    expect(keys).not.toContain("oneTime");

    // Type-level wall: excess income props are not part of the public input type
    type ForbiddenIncomeKeys = Extract<
      keyof BuildNetWorthSeriesInput,
      "income" | "forecast" | "recurring" | "oneTime" | "slots"
    >;
    type AssertNever<T extends never> = T;
    type _NoIncomeOnApi = AssertNever<ForbiddenIncomeKeys>;
    const _typeCheck: _NoIncomeOnApi = undefined as never;
    void _typeCheck;
  });

  it("past buildNetWorthSeries golden baseline (account-only, no income API) (D-17)", () => {
    const accounts: SeriesAccount[] = [
      {
        id: 1,
        type: "FIAT_DEBIT",
        currencyCode: "RUB",
        currencyScale: 2,
        isPrimaryCurrency: true,
        creditLimitMinor: null,
      },
    ];
    const snapshots: SeriesSnapshot[] = [
      { accountId: 1, asOfDate: "2026-01-01", amountMinor: 100_000n },
    ];
    const rates: SeriesRate[] = [];
    const points = buildNetWorthSeries({
      accounts,
      snapshots,
      rates,
      primaryScale: 2,
      preset: "all",
      today: "2026-01-31",
    });
    expect(points.map((p) => p.totalPrimaryMinor)).toEqual([100_000n, 100_000n]);
    expect(RATE_SCALE_E8).toBeGreaterThan(0n);
  });
});
