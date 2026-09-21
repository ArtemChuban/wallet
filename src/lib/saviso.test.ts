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

/** SAVISO-01 / SAVISO-02: savings interest must not couple into historical NW (D-12). */
describe("SAVISO isolation", () => {
  for (const file of ["src/lib/net-worth.ts", "src/lib/historical-series.ts"]) {
    it(`${file} does not import savings-interest or nw-forecast (SAVISO-01, D-12)`, () => {
      const src = readFileSync(file, "utf8");
      expect(src).not.toMatch(
        /@\/lib\/savings-interest|from ["']\.\/savings-interest["']/,
      );
      expect(src).not.toMatch(/@\/lib\/nw-forecast|from ["']\.\/nw-forecast["']/);
    });
  }

  for (const file of [
    "src/lib/savings-interest.ts",
    "src/lib/nw-forecast.ts",
    "src/components/dashboard/DashboardChartsShell.tsx",
    "src/app/page.tsx",
  ]) {
    it(`${file} never calls balanceSnapshot mutate (SAVISO-01)`, () => {
      const src = readFileSync(file, "utf8");
      expect(src).not.toMatch(/balanceSnapshot\.(create|update|upsert|delete)/);
    });
  }

  it("SAVINGS past series golden equals snapshot minors; unused interest fixture voided (SAVISO-02)", () => {
    const accounts: SeriesAccount[] = [
      {
        id: 1,
        type: "SAVINGS",
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

    // Conceptual interest fixture — never passed into NW math (isolation wall).
    const _interestPresentConceptually = {
      interestMinor: 5_000n,
      annualRateBps: 12_00,
    };
    void _interestPresentConceptually;

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

    const input: BuildNetWorthSeriesInput = {
      accounts,
      snapshots,
      rates,
      primaryScale: 2,
      preset: "all",
      today: "2026-01-31",
    };
    const keys = Object.keys(input).sort();
    expect(keys).toEqual(
      ["accounts", "preset", "primaryScale", "rates", "snapshots", "today"].sort(),
    );
    expect(keys).not.toContain("interest");

    // Type-level wall: interest key is not part of the public input type
    type ForbiddenInterestKeys = Extract<
      keyof BuildNetWorthSeriesInput,
      "interest"
    >;
    type AssertNever<T extends never> = T;
    type _NoInterestOnApi = AssertNever<ForbiddenInterestKeys>;
    const _typeCheck: _NoInterestOnApi = undefined as never;
    void _typeCheck;
  });
});
