/**
 * Pure NW forecast overlay (Phase 17).
 * Cumulative stair-step from accounts-only today anchor + open future planned income.
 * Import wall (D-18): money / locf / dates only — never NW history or DB clients.
 */

import {
  type RangePreset,
  addCalendarDays,
} from "@/lib/dates";
import { locfRateAsOf, type RateRow } from "@/lib/locf";
import {
  convertOtherMinorToPrimaryMinor,
  minorToMajorNumber,
} from "@/lib/money";

export type ForecastSlot = {
  parentId: number;
  plannedAsOf: string;
  plannedAmountMinor: bigint;
  currencyCode: string;
  currencyScale: number;
  isPrimaryCurrency: boolean;
};

export type ForecastPoint = {
  asOfDate: string;
  forecastPrimaryMinor: bigint;
  forecast: number;
};

export type BuildNetWorthForecastSeriesResult = {
  points: ForecastPoint[];
  isPartialForecast: boolean;
  includedSlotCount: number;
  excludedMissingFxCount: number;
};

/** Horizon mirrors dashboard lookback magnitudes; all → 1y cap (D-05). */
export function forecastHorizonEnd(preset: RangePreset, today: string): string {
  switch (preset) {
    case "30d":
      return addCalendarDays(today, 30);
    case "90d":
      return addCalendarDays(today, 90);
    case "1y":
    case "all":
      return addCalendarDays(today, 365);
    default: {
      const _exhaustive: never = preset;
      throw new Error(`unknown preset: ${_exhaustive}`);
    }
  }
}

/**
 * Cumulative sparse forecast from today's NW anchor through horizon end.
 * Caller passes already-open slots in (today, horizonEnd] — no listAllInRange here (D-18).
 */
export function buildNetWorthForecastSeries(input: {
  anchorPrimaryMinor: bigint;
  slots: readonly ForecastSlot[];
  rates: readonly RateRow[];
  primaryScale: number;
  today: string;
  horizonEnd: string;
}): BuildNetWorthForecastSeriesResult {
  const {
    anchorPrimaryMinor,
    slots,
    rates,
    primaryScale,
    today,
    horizonEnd,
  } = input;

  type Converted = { plannedAsOf: string; primaryMinor: bigint };
  const converted: Converted[] = [];
  let excludedMissingFxCount = 0;

  for (const slot of slots) {
    if (!(slot.plannedAsOf > today) || slot.plannedAsOf > horizonEnd) {
      continue;
    }

    let primaryMinor: bigint;
    if (slot.isPrimaryCurrency) {
      primaryMinor = slot.plannedAmountMinor;
    } else {
      const rate = locfRateAsOf(rates, slot.currencyCode, today);
      if (rate === null) {
        excludedMissingFxCount += 1;
        continue;
      }
      primaryMinor = convertOtherMinorToPrimaryMinor(
        slot.plannedAmountMinor,
        rate,
        slot.currencyScale,
        primaryScale,
      );
    }
    converted.push({ plannedAsOf: slot.plannedAsOf, primaryMinor });
  }

  const includedSlotCount = converted.length;
  const isPartialForecast = excludedMissingFxCount > 0;

  if (includedSlotCount === 0) {
    return {
      points: [],
      isPartialForecast,
      includedSlotCount,
      excludedMissingFxCount,
    };
  }

  converted.sort((a, b) =>
    a.plannedAsOf < b.plannedAsOf
      ? -1
      : a.plannedAsOf > b.plannedAsOf
        ? 1
        : 0,
  );

  const dateSet = new Set<string>();
  dateSet.add(today);
  dateSet.add(horizonEnd);
  for (const c of converted) {
    dateSet.add(c.plannedAsOf);
  }

  const sampleDates = [...dateSet]
    .filter((d) => d >= today && d <= horizonEnd)
    .sort();

  // Cumulative additions by date (same-day slots sum)
  const addByDate = new Map<string, bigint>();
  for (const c of converted) {
    addByDate.set(
      c.plannedAsOf,
      (addByDate.get(c.plannedAsOf) ?? 0n) + c.primaryMinor,
    );
  }

  let running = anchorPrimaryMinor;
  const points: ForecastPoint[] = [];
  for (const asOfDate of sampleDates) {
    const add = addByDate.get(asOfDate) ?? 0n;
    running += add;
    points.push({
      asOfDate,
      forecastPrimaryMinor: running,
      forecast: minorToMajorNumber(running, primaryScale),
    });
  }

  return {
    points,
    isPartialForecast,
    includedSlotCount,
    excludedMissingFxCount,
  };
}
