import { describe, expect, it } from "vitest";
import { RATE_SCALE_E8 } from "@/lib/money";
import {
  buildNetWorthForecastSeries,
  forecastHorizonEnd,
  type ForecastSlot,
} from "./nw-forecast";

const today = "2026-03-01";

function primarySlot(
  parentId: number,
  plannedAsOf: string,
  amountMinor: bigint,
): ForecastSlot {
  return {
    parentId,
    plannedAsOf,
    plannedAmountMinor: amountMinor,
    currencyCode: "RUB",
    currencyScale: 2,
    isPrimaryCurrency: true,
  };
}

function usdSlot(
  parentId: number,
  plannedAsOf: string,
  amountMinor: bigint,
): ForecastSlot {
  return {
    parentId,
    plannedAsOf,
    plannedAmountMinor: amountMinor,
    currencyCode: "USD",
    currencyScale: 2,
    isPrimaryCurrency: false,
  };
}

describe("forecastHorizonEnd", () => {
  it("30d → +30 from today (D-05)", () => {
    expect(forecastHorizonEnd("30d", today)).toBe("2026-03-31");
  });

  it("90d → +90 from today (D-05)", () => {
    expect(forecastHorizonEnd("90d", today)).toBe("2026-05-30");
  });

  it("1y → +365 from today (D-05)", () => {
    expect(forecastHorizonEnd("1y", today)).toBe("2027-03-01");
  });

  it("all → +365 cap from today (D-05)", () => {
    expect(forecastHorizonEnd("all", today)).toBe("2027-03-01");
  });
});

describe("forecast membership/cumulative", () => {
  it("open recurring + one-time included; stair-step from anchor (D-01, D-04, D-06)", () => {
    const slots: ForecastSlot[] = [
      primarySlot(1, "2026-03-15", 100_000n),
      primarySlot(2, "2026-03-20", 50_000n),
    ];
    const result = buildNetWorthForecastSeries({
      anchorPrimaryMinor: 1_000_000n,
      slots,
      rates: [],
      primaryScale: 2,
      today,
      horizonEnd: "2026-03-31",
    });

    expect(result.includedSlotCount).toBe(2);
    expect(result.excludedMissingFxCount).toBe(0);
    expect(result.isPartialForecast).toBe(false);
    expect(result.points.map((p) => p.asOfDate)).toEqual([
      today,
      "2026-03-15",
      "2026-03-20",
      "2026-03-31",
    ]);
    expect(result.points.find((p) => p.asOfDate === today)?.forecastPrimaryMinor).toBe(
      1_000_000n,
    );
    expect(
      result.points.find((p) => p.asOfDate === "2026-03-15")?.forecastPrimaryMinor,
    ).toBe(1_100_000n);
    expect(
      result.points.find((p) => p.asOfDate === "2026-03-20")?.forecastPrimaryMinor,
    ).toBe(1_150_000n);
    expect(
      result.points.find((p) => p.asOfDate === "2026-03-31")?.forecastPrimaryMinor,
    ).toBe(1_150_000n);
    expect(result.points.find((p) => p.asOfDate === "2026-03-15")?.forecast).toBe(
      11_000,
    );
  });

  it("caller must not pass filled/overdue/today — builder trusts open slots only (D-02, D-03)", () => {
    // Membership filter is at boundary; builder still converts whatever is passed.
    // Wave 0 locks: empty open set → empty points (D-08).
    const result = buildNetWorthForecastSeries({
      anchorPrimaryMinor: 500_000n,
      slots: [],
      rates: [],
      primaryScale: 2,
      today,
      horizonEnd: "2026-03-31",
    });
    expect(result.includedSlotCount).toBe(0);
    expect(result.points).toEqual([]);
  });
});

describe("forecast membership edges", () => {
  it("same-day open slots sum into one stair step (D-04, D-06)", () => {
    const slots: ForecastSlot[] = [
      primarySlot(1, "2026-03-15", 100_000n),
      primarySlot(2, "2026-03-15", 25_000n),
    ];
    const result = buildNetWorthForecastSeries({
      anchorPrimaryMinor: 1_000_000n,
      slots,
      rates: [],
      primaryScale: 2,
      today,
      horizonEnd: "2026-03-31",
    });
    expect(result.includedSlotCount).toBe(2);
    expect(
      result.points.find((p) => p.asOfDate === "2026-03-15")?.forecastPrimaryMinor,
    ).toBe(1_125_000n);
  });

  it("slots on today or past / beyond horizon are ignored by builder (D-02, D-03)", () => {
    const slots: ForecastSlot[] = [
      primarySlot(1, today, 999_000n),
      primarySlot(2, "2026-02-01", 999_000n),
      primarySlot(3, "2026-04-15", 50_000n),
      primarySlot(4, "2026-03-10", 10_000n),
    ];
    const result = buildNetWorthForecastSeries({
      anchorPrimaryMinor: 100_000n,
      slots,
      rates: [],
      primaryScale: 2,
      today,
      horizonEnd: "2026-03-31",
    });
    expect(result.includedSlotCount).toBe(1);
    expect(
      result.points.find((p) => p.asOfDate === "2026-03-10")?.forecastPrimaryMinor,
    ).toBe(110_000n);
    expect(result.points.some((p) => p.forecastPrimaryMinor >= 999_000n)).toBe(
      false,
    );
  });

  it("isPartialForecast stays true when some slots convert and some miss FX (D-14)", () => {
    const slots: ForecastSlot[] = [
      usdSlot(1, "2026-03-10", 10_000n),
      primarySlot(2, "2026-03-12", 5_000n),
      {
        parentId: 3,
        plannedAsOf: "2026-03-20",
        plannedAmountMinor: 1_000n,
        currencyCode: "EUR",
        currencyScale: 2,
        isPrimaryCurrency: false,
      },
    ];
    const result = buildNetWorthForecastSeries({
      anchorPrimaryMinor: 0n,
      slots,
      rates: [
        {
          currencyCode: "USD",
          asOfDate: today,
          rateToPrimaryScaled: 80n * RATE_SCALE_E8,
        },
      ],
      primaryScale: 2,
      today,
      horizonEnd: "2026-03-31",
    });
    expect(result.excludedMissingFxCount).toBe(1);
    expect(result.isPartialForecast).toBe(true);
    expect(result.includedSlotCount).toBe(2);
    expect(
      result.points.find((p) => p.asOfDate === "2026-03-12")?.forecastPrimaryMinor,
    ).toBe(800_000n + 5_000n);
  });
});

describe("forecast FX", () => {
  it("locfRateAsOf(..., today); missing → exclude + isPartialForecast (D-13, D-14)", () => {
    const slots: ForecastSlot[] = [
      usdSlot(1, "2026-03-10", 10_000n),
      primarySlot(2, "2026-03-15", 100_000n),
    ];
    const result = buildNetWorthForecastSeries({
      anchorPrimaryMinor: 1_000_000n,
      slots,
      rates: [],
      primaryScale: 2,
      today,
      horizonEnd: "2026-03-31",
    });

    expect(result.excludedMissingFxCount).toBe(1);
    expect(result.isPartialForecast).toBe(true);
    expect(result.includedSlotCount).toBe(1);
    expect(
      result.points.find((p) => p.asOfDate === "2026-03-15")?.forecastPrimaryMinor,
    ).toBe(1_100_000n);
  });

  it("FX@today converts included foreign slots (D-13)", () => {
    const slots: ForecastSlot[] = [usdSlot(1, "2026-03-10", 10_000n)];
    const result = buildNetWorthForecastSeries({
      anchorPrimaryMinor: 1_000_000n,
      slots,
      rates: [
        {
          currencyCode: "USD",
          asOfDate: today,
          rateToPrimaryScaled: 90n * RATE_SCALE_E8,
        },
      ],
      primaryScale: 2,
      today,
      horizonEnd: "2026-03-31",
    });

    expect(result.includedSlotCount).toBe(1);
    expect(result.excludedMissingFxCount).toBe(0);
    expect(result.isPartialForecast).toBe(false);
    // 100 USD * 90 = 9000 RUB major → 900_000 minor
    expect(
      result.points.find((p) => p.asOfDate === "2026-03-10")?.forecastPrimaryMinor,
    ).toBe(1_900_000n);
  });

  it("includedSlotCount 0 → empty points even when FX excludes all (D-08, D-16)", () => {
    const slots: ForecastSlot[] = [usdSlot(1, "2026-03-10", 10_000n)];
    const result = buildNetWorthForecastSeries({
      anchorPrimaryMinor: 1_000_000n,
      slots,
      rates: [],
      primaryScale: 2,
      today,
      horizonEnd: "2026-03-31",
    });

    expect(result.includedSlotCount).toBe(0);
    expect(result.excludedMissingFxCount).toBe(1);
    expect(result.isPartialForecast).toBe(true);
    expect(result.points).toEqual([]);
  });
});

/** Plan 01 Wave 0 — tracer (Task 3) greens these; do not hard-fail. */
describe("grace A′ / membership / FX codes", () => {
  it.todo("future OPEN grace sampled with ΔNW=0 (A′ / C-01 / D-06 / GRFCST-01)");
  it.todo("overdue OPEN fold → today sampleAsOf (D-01 / D-02 / D-03)");
  it.todo("grace-only horizon → non-empty flat points (D-07)");
  it.todo("same-day income+grace: NW moves by income only (C-03 / D-06)");
  it.todo("FX miss codes unique alphabetical across income+grace (D-15 / D-17 / GRFCST-02)");
  it.todo("CLOSED never fed as grace ForecastSlot (C-07)");
});
