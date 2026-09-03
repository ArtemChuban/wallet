import { describe, expect, it } from "vitest";
import { RATE_SCALE_E8 } from "@/lib/money";
import {
  buildNetWorthSeries,
  type NetWorthSeriesPoint,
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

function assertNoPartialFlag(points: NetWorthSeriesPoint[]) {
  for (const point of points) {
    expect(point).not.toHaveProperty("isPartial");
    expect(point).not.toHaveProperty("partial");
  }
}

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

  it("series length equals distinct event∪today dates not calendar day count (D-07)", () => {
    const accounts = [primaryDebit(1)];
    const snapshots: SeriesSnapshot[] = [
      { accountId: 1, asOfDate: "2026-01-01", amountMinor: 100_000n },
      { accountId: 1, asOfDate: "2026-01-20", amountMinor: 200_000n },
    ];
    const today = "2026-01-31";
    const points = buildNetWorthSeries({
      accounts,
      snapshots,
      rates: [],
      primaryScale: 2,
      preset: "all",
      today,
    });

    // Events: 01-01, 01-20, today — not 31 calendar days
    expect(points).toHaveLength(3);
    expect(points.map((p) => p.asOfDate)).toEqual([
      "2026-01-01",
      "2026-01-20",
      today,
    ]);
    expect(points.length).toBeLessThan(31);
  });

  it("partial NW day still emits point without partial flag (D-14)", () => {
    const accounts = [primaryDebit(1), usdDebit(2)];
    const snapshots: SeriesSnapshot[] = [
      { accountId: 1, asOfDate: "2026-01-10", amountMinor: 50_000n },
      { accountId: 2, asOfDate: "2026-01-10", amountMinor: 10_000n },
    ];
    // USD has no FX → excluded; RUB still contributes
    const points = buildNetWorthSeries({
      accounts,
      snapshots,
      rates: [],
      primaryScale: 2,
      preset: "all",
      today: "2026-01-10",
    });

    expect(points).toHaveLength(1);
    expect(points[0]!.asOfDate).toBe("2026-01-10");
    expect(points[0]!.totalPrimaryMinor).toBe(50_000n);
    assertNoPartialFlag(points);
  });

  it("window excludes day before start; today always present; all includes earliest", () => {
    const accounts = [primaryDebit(1)];
    const snapshots: SeriesSnapshot[] = [
      { accountId: 1, asOfDate: "2025-06-01", amountMinor: 10_000n },
      { accountId: 1, asOfDate: "2026-01-01", amountMinor: 20_000n },
      { accountId: 1, asOfDate: "2026-02-01", amountMinor: 30_000n },
    ];
    const today = "2026-03-03";

    const windowed = buildNetWorthSeries({
      accounts,
      snapshots,
      rates: [],
      primaryScale: 2,
      preset: "30d",
      today,
    });
    // windowStart = 2026-02-01; day before excluded
    expect(windowed.some((p) => p.asOfDate === "2026-01-01")).toBe(false);
    expect(windowed.some((p) => p.asOfDate === "2026-02-01")).toBe(true);
    expect(windowed.some((p) => p.asOfDate === today)).toBe(true);
    expect(windowed.every((p) => p.asOfDate >= "2026-02-01")).toBe(true);
    expect(windowed.every((p) => p.asOfDate <= today)).toBe(true);

    const all = buildNetWorthSeries({
      accounts,
      snapshots,
      rates: [],
      primaryScale: 2,
      preset: "all",
      today,
    });
    expect(all.some((p) => p.asOfDate === "2025-06-01")).toBe(true);
    expect(all.some((p) => p.asOfDate === today)).toBe(true);
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

  it("unions FX event dates for non-primary currencies in play", () => {
    const accounts = [usdDebit(1)];
    const snapshots: SeriesSnapshot[] = [
      { accountId: 1, asOfDate: "2026-01-01", amountMinor: 10_000n },
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
      {
        currencyCode: "EUR",
        asOfDate: "2026-01-15",
        rateToPrimaryScaled: 90n * RATE_SCALE_E8,
      },
    ];

    const points = buildNetWorthSeries({
      accounts,
      snapshots,
      rates,
      primaryScale: 2,
      preset: "all",
      today: "2026-01-31",
    });

    const dates = points.map((p) => p.asOfDate);
    expect(dates).toContain("2026-01-20");
    expect(dates).not.toContain("2026-01-15");
  });

  it("returns empty series when no accounts", () => {
    expect(
      buildNetWorthSeries({
        accounts: [],
        snapshots: [],
        rates: [],
        primaryScale: 2,
        preset: "30d",
        today: "2026-01-31",
      }),
    ).toEqual([]);
  });
});
