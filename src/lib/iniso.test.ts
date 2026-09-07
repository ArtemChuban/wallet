import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RATE_SCALE_E8 } from "@/lib/money";
import {
  buildNetWorthSeries,
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

  it("nw-forecast.ts (when present) bans prisma / BalanceSnapshot / net-worth / historical-series", () => {
    let src: string;
    try {
      src = readFileSync("src/lib/nw-forecast.ts", "utf8");
    } catch {
      // Wave 0 RED: module may not exist yet — fail until Plan 01 tracer creates it.
      expect.fail("src/lib/nw-forecast.ts missing — create in tracer task");
      return;
    }
    expect(src).not.toMatch(/prisma|BalanceSnapshot/);
    expect(src).not.toMatch(/@\/lib\/(?:net-worth|historical-series)/);
    expect(src).not.toMatch(/from ["']\.\/(?:net-worth|historical-series)["']/);
  });

  /**
   * Past-series golden identity — full with/without income fixture green in Plan 02.
   * Wave 0 stub: baseline golden for account-only path (API has no income param).
   */
  it.todo(
    "past buildNetWorthSeries golden identity identical with/without income fixtures (D-17) — Plan 02",
  );

  it("past buildNetWorthSeries golden baseline (account-only, no income API) (D-17 stub)", () => {
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
    // Sanity: RATE_SCALE unused here but keeps money import live for Plan 02 FX fixtures
    expect(RATE_SCALE_E8).toBeGreaterThan(0n);
  });
});
