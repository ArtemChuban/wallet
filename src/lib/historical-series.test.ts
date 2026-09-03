import { describe, expect, it } from "vitest";
import { RATE_SCALE_E8 } from "@/lib/money";
import {
  buildNetWorthSeries,
  type SeriesAccount,
  type SeriesRate,
  type SeriesSnapshot,
} from "./historical-series";

const primaryDebit = (id: number): SeriesAccount => ({
  id,
  type: "FIAT_DEBIT",
  currencyCode: "RUB",
  currencyScale: 2,
  isPrimaryCurrency: true,
  creditLimitMinor: null,
});

const usdDebit = (id: number): SeriesAccount => ({
  id,
  type: "FIAT_DEBIT",
  currencyCode: "USD",
  currencyScale: 2,
  isPrimaryCurrency: false,
  creditLimitMinor: null,
});

describe("buildNetWorthSeries (CHART-01/CHART-03)", () => {
  it("past NW point ignores a later FX change (CHART-03)", () => {
    const accounts = [usdDebit(1)];
    const snapshots: SeriesSnapshot[] = [
      { accountId: 1, asOfDate: "2026-01-01", amountMinor: 10_000n },
      { accountId: 1, asOfDate: "2026-01-15", amountMinor: 10_000n },
    ];
    const rates: SeriesRate[] = [
      {
        currencyCode: "USD",
        asOfDate: "2026-01-01",
        rateToPrimaryScaled: 50n * RATE_SCALE_E8,
      },
      {
        currencyCode: "USD",
        asOfDate: "2026-02-01",
        rateToPrimaryScaled: 60n * RATE_SCALE_E8,
      },
    ];

    const points = buildNetWorthSeries({
      accounts,
      snapshots,
      rates,
      primaryScale: 2,
      preset: "all",
      today: "2026-02-15",
    });

    const mid = points.find((p) => p.asOfDate === "2026-01-15");
    expect(mid?.totalPrimaryMinor).toBe(500_000n);

    const afterFx = points.find((p) => p.asOfDate === "2026-02-01");
    expect(afterFx?.totalPrimaryMinor).toBe(600_000n);
  });

  it("windowStartForPreset 30d excludes event one day before start", () => {
    const accounts = [primaryDebit(1)];
    const snapshots: SeriesSnapshot[] = [
      { accountId: 1, asOfDate: "2026-01-01", amountMinor: 100_000n },
      { accountId: 1, asOfDate: "2026-02-01", amountMinor: 200_000n },
    ];
    // today 2026-03-03 → 30d start = 2026-02-01; 2026-01-01 excluded
    const points = buildNetWorthSeries({
      accounts,
      snapshots,
      rates: [],
      primaryScale: 2,
      preset: "30d",
      today: "2026-03-03",
    });

    expect(points.every((p) => p.asOfDate >= "2026-02-01")).toBe(true);
    expect(points.some((p) => p.asOfDate === "2026-01-01")).toBe(false);
    expect(points.some((p) => p.asOfDate === "2026-03-03")).toBe(true);
  });

  it("primary-currency accounts use identity without FxRate", () => {
    const points = buildNetWorthSeries({
      accounts: [primaryDebit(1)],
      snapshots: [
        { accountId: 1, asOfDate: "2026-01-01", amountMinor: 123_45n },
      ],
      rates: [],
      primaryScale: 2,
      preset: "all",
      today: "2026-01-10",
    });

    const first = points.find((p) => p.asOfDate === "2026-01-01");
    expect(first?.totalPrimaryMinor).toBe(123_45n);
    expect(first?.nw).toBe(123.45);
  });
});
