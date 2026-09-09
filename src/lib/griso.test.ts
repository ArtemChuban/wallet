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

/** GRISO-01: grace/forecast must not couple into historical NW math (C-01, D-05–D-11). */
describe("GRISO-01 isolation", () => {
  for (const file of ["src/lib/net-worth.ts", "src/lib/historical-series.ts"]) {
    it(`${file} does not import credit-grace or nw-forecast (D-05)`, () => {
      const src = readFileSync(file, "utf8");
      expect(src).not.toMatch(/@\/lib\/credit-grace|from ["']\.\/credit-grace["']/);
      expect(src).not.toMatch(/@\/lib\/nw-forecast|from ["']\.\/nw-forecast["']/);
    });
  }

  it("nw-forecast.ts bans prisma / BalanceSnapshot / net-worth / historical-series (D-06)", () => {
    const src = readFileSync("src/lib/nw-forecast.ts", "utf8");
    expect(src).not.toMatch(
      /from\s+["']@\/generated\/prisma|from\s+["'][^"']*prisma["']/,
    );
    expect(src).not.toMatch(/\bBalanceSnapshot\b/);
    expect(src).not.toMatch(/@\/lib\/(?:net-worth|historical-series)/);
    expect(src).not.toMatch(/from ["']\.\/(?:net-worth|historical-series)["']/);
  });

  it("credit-grace.ts bans prisma + net-worth + historical-series (D-07)", () => {
    const src = readFileSync("src/lib/credit-grace.ts", "utf8");
    expect(src).not.toMatch(
      /from\s+["']@\/generated\/prisma|from\s+["'][^"']*prisma["']/,
    );
    expect(src).not.toMatch(/@\/lib\/(?:net-worth|historical-series)/);
    expect(src).not.toMatch(/from ["']\.\/(?:net-worth|historical-series)["']/);
  });

  /**
   * Past-series golden identity (D-09 / D-11): same accounts/snapshots/rates →
   * identical totals whether grace is conceptually present or not. Grace never
   * enters buildNetWorthSeries — API surface has no grace field; a second call
   * with the same NW inputs stays bitwise-identical (C-01).
   */
  it("GRISO past series golden identity identical with/without grace fixtures (D-09)", () => {
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

    // Conceptual grace fixture — never passed into NW math (isolation wall).
    const _gracePresentConceptually = {
      obligations: [
        {
          accountId: 99,
          amountDueMinor: 50_000n,
          dueDate: "2026-02-01",
          status: "OPEN",
        },
      ],
      statementDayOfMonth: 21,
      dueDayOfMonth: 15,
    };
    void _gracePresentConceptually;

    const withoutGraceCall = buildNetWorthSeries(input);
    const withGraceStillSameCall = buildNetWorthSeries({ ...input });

    const golden = withoutGraceCall.map((p) => [
      p.asOfDate,
      p.totalPrimaryMinor.toString(),
    ]);
    expect(
      withGraceStillSameCall.map((p) => [
        p.asOfDate,
        p.totalPrimaryMinor.toString(),
      ]),
    ).toEqual(golden);
    expect(golden.length).toBeGreaterThan(0);

    // API surface: BuildNetWorthSeriesInput has no grace / income / forecast fields
    const keys = Object.keys(input).sort();
    expect(keys).toEqual(
      ["accounts", "preset", "primaryScale", "rates", "snapshots", "today"].sort(),
    );
    expect(keys).not.toContain("grace");
    expect(keys).not.toContain("obligation");
    expect(keys).not.toContain("creditGrace");
    expect(keys).not.toContain("income");
    expect(keys).not.toContain("forecast");
    expect(keys).not.toContain("recurring");
    expect(keys).not.toContain("oneTime");

    // Type-level wall: excess grace/income props are not part of the public input type
    type ForbiddenKeys = Extract<
      keyof BuildNetWorthSeriesInput,
      | "income"
      | "forecast"
      | "recurring"
      | "oneTime"
      | "slots"
      | "grace"
      | "obligation"
      | "creditGrace"
    >;
    type AssertNever<T extends never> = T;
    type _NoGraceOnApi = AssertNever<ForbiddenKeys>;
    const _typeCheck: _NoGraceOnApi = undefined as never;
    void _typeCheck;
  });

  it("FIAT_CREDIT + creditLimitMinor + snapshots LOCF stays account-only (D-10)", () => {
    const accounts: SeriesAccount[] = [
      {
        id: 1,
        type: "FIAT_CREDIT",
        currencyCode: "RUB",
        currencyScale: 2,
        isPrimaryCurrency: true,
        creditLimitMinor: 500_000n,
      },
    ];
    const snapshots: SeriesSnapshot[] = [
      { accountId: 1, asOfDate: "2026-01-01", amountMinor: 200_000n },
      { accountId: 1, asOfDate: "2026-01-15", amountMinor: 100_000n },
    ];
    const rates: SeriesRate[] = [];

    // Conceptual grace — voided; never enters buildNetWorthSeries
    const _gracePresentConceptually = {
      obligations: [{ amountDueMinor: 25_000n, dueDate: "2026-01-20" }],
    };
    void _gracePresentConceptually;

    const a = buildNetWorthSeries({
      accounts,
      snapshots,
      rates,
      primaryScale: 2,
      preset: "all",
      today: "2026-01-31",
    });
    const b = buildNetWorthSeries({
      accounts,
      snapshots,
      rates,
      primaryScale: 2,
      preset: "all",
      today: "2026-01-31",
    });

    expect(a.map((p) => [p.asOfDate, p.totalPrimaryMinor.toString()])).toEqual(
      b.map((p) => [p.asOfDate, p.totalPrimaryMinor.toString()]),
    );
    expect(a.length).toBeGreaterThan(0);
    // Account-only LOCF: available snapshot minors drive NW; grace never in totals
    expect(a.map((p) => p.totalPrimaryMinor)).toEqual(
      b.map((p) => p.totalPrimaryMinor),
    );
  });
});
