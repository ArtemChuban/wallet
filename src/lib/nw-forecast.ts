/**
 * Pure NW forecast overlay (Phase 17+21).
 * Cumulative stair-step from accounts-only today anchor + open future planned income,
 * future SAVINGS interest credits (+ΔNW), and A′ NW-neutral OPEN grace slots (ΔNW=0 after FX gate).
 * Import wall (D-18): money / locf / dates only — never NW history, credit-grace, or DB clients.
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

export type ForecastSlotKind = "income" | "grace" | "interest";

export type ForecastSlot = {
  kind: ForecastSlotKind;
  parentId: number;
  /** Sample date after membership fold (income and interest: > today; grace: today or future due). */
  plannedAsOf: string;
  plannedAmountMinor: bigint;
  currencyCode: string;
  currencyScale: number;
  isPrimaryCurrency: boolean;
  /** Grace tooltip metadata (optional on income). */
  accountId?: number;
  accountName?: string;
  /** Original due before fold. */
  dueAsOf?: string;
};

export type ForecastEvent = {
  kind: ForecastSlotKind;
  parentId: number;
  plannedAmountMinor: bigint;
  /** Primary major after FX gate — tooltip amount even when ΔNW=0 (D-11). */
  displayPrimaryMajor: number;
  currencyCode: string;
  accountId?: number;
  accountName?: string;
  dueAsOf?: string;
};

export type ForecastPoint = {
  asOfDate: string;
  forecastPrimaryMinor: bigint;
  forecast: number;
  forecastEvents?: ForecastEvent[];
};

export type BuildNetWorthForecastSeriesResult = {
  points: ForecastPoint[];
  isPartialForecast: boolean;
  includedSlotCount: number;
  excludedMissingFxCount: number;
  /** Unique missing FX codes, alphabetical (D-15 / D-17). */
  excludedMissingFxCurrencies: string[];
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

function forecastDeltaMinor(
  kind: ForecastSlotKind,
  displayPrimaryMinor: bigint,
): bigint {
  switch (kind) {
    case "income":
    case "interest":
      return displayPrimaryMinor;
    case "grace":
      return 0n;
    default: {
      const _exhaustive: never = kind;
      throw new Error(`unknown kind: ${_exhaustive}`);
    }
  }
}

function slotInWindow(
  kind: ForecastSlotKind,
  plannedAsOf: string,
  today: string,
  horizonEnd: string,
): boolean {
  if (plannedAsOf > horizonEnd) return false;
  switch (kind) {
    case "income":
    case "interest":
      return plannedAsOf > today;
    case "grace":
      // grace: allows today after overdue fold (D-01, D-04)
      return plannedAsOf >= today;
    default: {
      const _exhaustive: never = kind;
      throw new Error(`unknown kind: ${_exhaustive}`);
    }
  }
}

/**
 * Cumulative sparse forecast from today's NW anchor through horizon end.
 * Caller passes membership-filtered slots — income open future; grace OPEN with fold (D-18).
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

  type Converted = {
    plannedAsOf: string;
    /** NW cumulative addend — 0n for grace (A′ / C-01). */
    primaryMinor: bigint;
    event: ForecastEvent;
  };
  const converted: Converted[] = [];
  let excludedMissingFxCount = 0;
  const missingFxCodes = new Set<string>();

  for (const slot of slots) {
    if (!slotInWindow(slot.kind, slot.plannedAsOf, today, horizonEnd)) {
      continue;
    }

    let displayPrimaryMinor: bigint;
    if (slot.isPrimaryCurrency) {
      displayPrimaryMinor = slot.plannedAmountMinor;
    } else {
      const rate = locfRateAsOf(rates, slot.currencyCode, today);
      if (rate === null) {
        excludedMissingFxCount += 1;
        missingFxCodes.add(slot.currencyCode);
        continue;
      }
      displayPrimaryMinor = convertOtherMinorToPrimaryMinor(
        slot.plannedAmountMinor,
        rate,
        slot.currencyScale,
        primaryScale,
      );
    }

    const primaryMinor = forecastDeltaMinor(slot.kind, displayPrimaryMinor);
    converted.push({
      plannedAsOf: slot.plannedAsOf,
      primaryMinor,
      event: {
        kind: slot.kind,
        parentId: slot.parentId,
        plannedAmountMinor: slot.plannedAmountMinor,
        displayPrimaryMajor: minorToMajorNumber(
          displayPrimaryMinor,
          primaryScale,
        ),
        currencyCode: slot.currencyCode,
        accountId: slot.accountId,
        accountName: slot.accountName,
        dueAsOf: slot.dueAsOf,
      },
    });
  }

  const includedSlotCount = converted.length;
  const isPartialForecast = excludedMissingFxCount > 0;
  const excludedMissingFxCurrencies = [...missingFxCodes].sort();

  if (includedSlotCount === 0) {
    return {
      points: [],
      isPartialForecast,
      includedSlotCount,
      excludedMissingFxCount,
      excludedMissingFxCurrencies,
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

  const addByDate = new Map<string, bigint>();
  const eventsByDate = new Map<string, ForecastEvent[]>();
  for (const c of converted) {
    addByDate.set(
      c.plannedAsOf,
      (addByDate.get(c.plannedAsOf) ?? 0n) + c.primaryMinor,
    );
    const list = eventsByDate.get(c.plannedAsOf) ?? [];
    list.push(c.event);
    eventsByDate.set(c.plannedAsOf, list);
  }

  let running = anchorPrimaryMinor;
  const points: ForecastPoint[] = [];
  for (const asOfDate of sampleDates) {
    const add = addByDate.get(asOfDate) ?? 0n;
    running += add;
    const events = eventsByDate.get(asOfDate);
    points.push({
      asOfDate,
      forecastPrimaryMinor: running,
      forecast: minorToMajorNumber(running, primaryScale),
      ...(events && events.length > 0 ? { forecastEvents: events } : {}),
    });
  }

  return {
    points,
    isPartialForecast,
    includedSlotCount,
    excludedMissingFxCount,
    excludedMissingFxCurrencies,
  };
}
