import { describe, expect, it } from "vitest";
import { RATE_SCALE_E8 } from "@/lib/money";
import {
  buildAccountSeries,
  buildNetWorthSeries,
  type NetWorthSeriesPoint,
  type SeriesAccount,
  type SeriesRate,
  type SeriesSnapshot,
} from "./historical-series";

const primaryAsset = (id: number): SeriesAccount => ({
  id,
  type: "ASSET",
  currencyCode: "RUB",
  currencyScale: 2,
  isPrimaryCurrency: true,
  creditLimitMinor: null,
});

/** Legacy soft-read fixture — unmigrated FIAT_DEBIT still works. */
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

  it("stacks per-account primary contributions; sum equals nw (incl. credit negative)", () => {
    const accounts: SeriesAccount[] = [
      primaryAsset(1),
      {
        id: 2,
        type: "FIAT_CREDIT",
        currencyCode: "RUB",
        currencyScale: 2,
        isPrimaryCurrency: true,
        creditLimitMinor: 100_000n,
      },
    ];
    const snapshots: SeriesSnapshot[] = [
      { accountId: 1, asOfDate: "2026-01-10", amountMinor: 200_000n },
      { accountId: 2, asOfDate: "2026-01-10", amountMinor: 40_000n }, // debt 60_000
    ];
    const points = buildNetWorthSeries({
      accounts,
      snapshots,
      rates: [],
      primaryScale: 2,
      preset: "all",
      today: "2026-01-10",
    });
    expect(points).toHaveLength(1);
    const p = points[0]!;
    expect(p.stacks.a1).toBe(2000);
    expect(p.stacks.a2).toBe(-600);
    expect(p.nw).toBe(1400);
    const stackSum = Object.values(p.stacks).reduce((a, b) => a + b, 0);
    expect(stackSum).toBeCloseTo(p.nw);
  });

  it("series length equals distinct event∪today dates not calendar day count (D-07)", () => {
    const accounts = [primaryAsset(1)];
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
    const accounts = [primaryAsset(1), usdDebit(2)];
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
    const accounts = [primaryAsset(1)];
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
      accounts: [primaryAsset(1)],
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

describe("buildAccountSeries (CHART-02/CHART-03)", () => {
  it("native mode events = account snapshots ∪ today with native majors", () => {
    const account = usdDebit(1);
    const snapshots: SeriesSnapshot[] = [
      { accountId: 1, asOfDate: "2026-01-01", amountMinor: 10_000n },
      { accountId: 1, asOfDate: "2026-01-20", amountMinor: 20_000n },
      { accountId: 2, asOfDate: "2026-01-15", amountMinor: 99_999n },
    ];
    const rates: SeriesRate[] = [
      {
        currencyCode: "USD",
        asOfDate: "2026-01-10",
        rateToPrimaryScaled: 50n * RATE_SCALE_E8,
      },
    ];

    const points = buildAccountSeries({
      account,
      snapshots,
      rates,
      primaryScale: 2,
      preset: "all",
      today: "2026-01-31",
      mode: "native",
    });

    // Native: snapshots for this account ∪ today — FX date 01-10 not included
    expect(points.map((p) => p.asOfDate)).toEqual([
      "2026-01-01",
      "2026-01-20",
      "2026-01-31",
    ]);
    expect(points[0]!.valueMinor).toBe(10_000n);
    expect(points[0]!.value).toBe(100);
    expect(points[1]!.valueMinor).toBe(20_000n);
    expect(points[1]!.value).toBe(200);
    expect(points[2]!.valueMinor).toBe(20_000n);
  });

  it("primary mode converts with as-of FX and unions FX event dates", () => {
    const account = usdDebit(1);
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
        rateToPrimaryScaled: 60n * RATE_SCALE_E8,
      },
    ];

    const points = buildAccountSeries({
      account,
      snapshots,
      rates,
      primaryScale: 2,
      preset: "all",
      today: "2026-01-31",
      mode: "primary",
    });

    expect(points.map((p) => p.asOfDate)).toEqual([
      "2026-01-01",
      "2026-01-20",
      "2026-01-31",
    ]);
    expect(points[0]!.valueMinor).toBe(500_000n);
    expect(points[1]!.valueMinor).toBe(600_000n);
    expect(points[2]!.valueMinor).toBe(600_000n);
  });

  it("primary mode skips dates with null LOCF FX (D-16); native still includes", () => {
    const account = usdDebit(1);
    const snapshots: SeriesSnapshot[] = [
      { accountId: 1, asOfDate: "2026-01-01", amountMinor: 10_000n },
      { accountId: 1, asOfDate: "2026-01-15", amountMinor: 10_000n },
    ];
    // FX starts only on 01-20 — earlier balance events have null FX
    const rates: SeriesRate[] = [
      {
        currencyCode: "USD",
        asOfDate: "2026-01-20",
        rateToPrimaryScaled: 50n * RATE_SCALE_E8,
      },
    ];

    const native = buildAccountSeries({
      account,
      snapshots,
      rates,
      primaryScale: 2,
      preset: "all",
      today: "2026-01-31",
      mode: "native",
    });
    expect(native.map((p) => p.asOfDate)).toEqual([
      "2026-01-01",
      "2026-01-15",
      "2026-01-31",
    ]);

    const primary = buildAccountSeries({
      account,
      snapshots,
      rates,
      primaryScale: 2,
      preset: "all",
      today: "2026-01-31",
      mode: "primary",
    });
    // 01-01 and 01-15 skipped (null FX); 01-20 FX event + today remain
    expect(primary.map((p) => p.asOfDate)).toEqual([
      "2026-01-20",
      "2026-01-31",
    ]);
    expect(primary[0]!.valueMinor).toBe(500_000n);
  });

  it("primary-currency account primary mode equals native without FxRate", () => {
    const account = primaryAsset(1);
    const snapshots: SeriesSnapshot[] = [
      { accountId: 1, asOfDate: "2026-01-01", amountMinor: 123_45n },
    ];

    const native = buildAccountSeries({
      account,
      snapshots,
      rates: [],
      primaryScale: 2,
      preset: "all",
      today: "2026-01-10",
      mode: "native",
    });
    const primary = buildAccountSeries({
      account,
      snapshots,
      rates: [],
      primaryScale: 2,
      preset: "all",
      today: "2026-01-10",
      mode: "primary",
    });

    expect(primary).toEqual(native);
    expect(primary[0]!.valueMinor).toBe(123_45n);
    expect(primary[0]!.value).toBe(123.45);
  });

  it("window filter matches buildNetWorthSeries via windowStartForPreset", () => {
    const account = primaryAsset(1);
    const snapshots: SeriesSnapshot[] = [
      { accountId: 1, asOfDate: "2025-06-01", amountMinor: 10_000n },
      { accountId: 1, asOfDate: "2026-01-01", amountMinor: 20_000n },
      { accountId: 1, asOfDate: "2026-02-01", amountMinor: 30_000n },
    ];
    const today = "2026-03-03";

    const windowed = buildAccountSeries({
      account,
      snapshots,
      rates: [],
      primaryScale: 2,
      preset: "30d",
      today,
      mode: "native",
    });
    expect(windowed.some((p) => p.asOfDate === "2026-01-01")).toBe(false);
    expect(windowed.some((p) => p.asOfDate === "2026-02-01")).toBe(true);
    expect(windowed.some((p) => p.asOfDate === today)).toBe(true);
  });

  it("FIAT_CREDIT native emits stacked debt+available via creditDebtMinor (D-11)", () => {
    const account: SeriesAccount = {
      id: 1,
      type: "FIAT_CREDIT",
      currencyCode: "USD",
      currencyScale: 2,
      isPrimaryCurrency: false,
      creditLimitMinor: 500_000n, // 5000.00
    };
    const snapshots: SeriesSnapshot[] = [
      { accountId: 1, asOfDate: "2026-01-01", amountMinor: 200_000n }, // available 2000
    ];

    const points = buildAccountSeries({
      account,
      snapshots,
      rates: [],
      primaryScale: 2,
      preset: "all",
      today: "2026-01-10",
      mode: "native",
    });

    expect(points).toHaveLength(2); // event + today
    expect(points[0]!.availableMinor).toBe(200_000n);
    expect(points[0]!.debtMinor).toBe(300_000n); // limit − available
    expect(points[0]!.available).toBe(2000);
    expect(points[0]!.debt).toBe(3000);
    // Stack heights are both positive — not NW debt-only contribution
    expect(points[0]!.debt! + points[0]!.available!).toBe(5000);
  });

  it("FIAT_CREDIT primary converts both stack segments; skips null FX (D-12, D-16)", () => {
    const account: SeriesAccount = {
      id: 1,
      type: "FIAT_CREDIT",
      currencyCode: "USD",
      currencyScale: 2,
      isPrimaryCurrency: false,
      creditLimitMinor: 500_000n,
    };
    const snapshots: SeriesSnapshot[] = [
      { accountId: 1, asOfDate: "2026-01-01", amountMinor: 200_000n },
      { accountId: 1, asOfDate: "2026-01-15", amountMinor: 100_000n },
    ];
    const rates: SeriesRate[] = [
      {
        currencyCode: "USD",
        asOfDate: "2026-01-20",
        rateToPrimaryScaled: 50n * RATE_SCALE_E8,
      },
    ];

    const primary = buildAccountSeries({
      account,
      snapshots,
      rates,
      primaryScale: 2,
      preset: "all",
      today: "2026-01-31",
      mode: "primary",
    });

    // 01-01 and 01-15 skipped (null FX); FX event 01-20 + today
    expect(primary.map((p) => p.asOfDate)).toEqual([
      "2026-01-20",
      "2026-01-31",
    ]);
    // LOCF available 100_000, debt 400_000 at rate 50 → primary majors
    expect(primary[0]!.availableMinor).toBe(5_000_000n);
    expect(primary[0]!.debtMinor).toBe(20_000_000n);
    expect(primary[0]!.available).toBe(50_000);
    expect(primary[0]!.debt).toBe(200_000);
  });
});
