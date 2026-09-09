"use client";

import { useMemo, useState } from "react";

import { DashboardAccountList } from "@/components/dashboard/DashboardAccountList";
import type { DashboardAccountRow } from "@/components/dashboard/DashboardAccountList";
import { DashboardRangeControl } from "@/components/dashboard/DashboardRangeControl";
import {
  NetWorthHistoryChart,
  type NetWorthChartPoint,
} from "@/components/dashboard/NetWorthHistoryChart";
import { addCalendarDays, windowStartForPreset, type RangePreset } from "@/lib/dates";
import { openGraceForecastMembership } from "@/lib/credit-grace";
import {
  buildNetWorthSeries,
  type SeriesAccount,
  type SeriesRate,
  type SeriesSnapshot,
} from "@/lib/historical-series";
import {
  listAllInRange,
  occurrenceKeyString,
} from "@/lib/income";
import type { NetWorthAccountType } from "@/lib/net-worth";
import {
  buildNetWorthForecastSeries,
  forecastHorizonEnd,
  type ForecastEvent,
  type ForecastSlot,
} from "@/lib/nw-forecast";

export type ChartAccountPayload = {
  id: number;
  name: string;
  type: NetWorthAccountType;
  currencyCode: string;
  currencyScale: number;
  isPrimaryCurrency: boolean;
  creditLimitMinor: string | null;
};

export type ChartSnapshotPayload = {
  accountId: number;
  asOfDate: string;
  amountMinor: string;
};

export type ChartRatePayload = {
  currencyCode: string;
  asOfDate: string;
  rateToPrimaryScaled: string;
};

export type ForecastIncomePayload = {
  recurring: {
    id: number;
    plannedAmountMinor: string;
    dayOfMonth: number;
    startAsOf: string;
    currencyCode: string;
    currencyScale: number;
    isPrimaryCurrency: boolean;
  }[];
  recurringActuals: {
    recurringIncomeId: number;
    plannedAsOf: string;
  }[];
  oneTime: {
    id: number;
    plannedAmountMinor: string;
    plannedAsOf: string;
    currencyCode: string;
    currencyScale: number;
    isPrimaryCurrency: boolean;
  }[];
  oneTimeActuals: {
    oneTimeIncomeId: number;
    plannedAsOf: string;
    amountMinor: string;
    actualAsOf: string;
  }[];
};

/** OPEN grace rows for overlay — string minors across RSC boundary (C-07). */
export type ForecastGracePayload = {
  obligations: {
    id: number;
    dueAsOf: string;
    amountMinor: string;
    status: "OPEN" | "CLOSED";
    accountId: number;
    accountName: string;
    currencyCode: string;
    currencyScale: number;
    isPrimaryCurrency: boolean;
  }[];
};

type DashboardChartsShellProps = {
  accounts: ChartAccountPayload[];
  snapshots: ChartSnapshotPayload[];
  rates: ChartRatePayload[];
  primaryScale: number;
  today: string;
  listAccounts: DashboardAccountRow[];
  primaryCode: string;
  anchorPrimaryMinor: string;
  forecastIncome: ForecastIncomePayload;
  forecastGrace: ForecastGracePayload;
};

function reviveAccounts(rows: ChartAccountPayload[]): SeriesAccount[] {
  return rows.map((a) => ({
    id: a.id,
    type: a.type,
    currencyCode: a.currencyCode,
    currencyScale: a.currencyScale,
    isPrimaryCurrency: a.isPrimaryCurrency,
    creditLimitMinor:
      a.creditLimitMinor == null ? null : BigInt(a.creditLimitMinor),
  }));
}

function reviveSnapshots(rows: ChartSnapshotPayload[]): SeriesSnapshot[] {
  return rows.map((s) => ({
    accountId: s.accountId,
    asOfDate: s.asOfDate,
    amountMinor: BigInt(s.amountMinor),
  }));
}

function reviveRates(rows: ChartRatePayload[]): SeriesRate[] {
  return rows.map((r) => ({
    currencyCode: r.currencyCode,
    asOfDate: r.asOfDate,
    rateToPrimaryScaled: BigInt(r.rateToPrimaryScaled),
  }));
}

function mergeFactAndForecast(
  fact: NetWorthChartPoint[],
  forecastPoints: {
    asOfDate: string;
    forecast: number;
    forecastEvents?: ForecastEvent[];
  }[],
  today: string,
  showForecast: boolean,
): NetWorthChartPoint[] {
  if (!showForecast || forecastPoints.length === 0) {
    return fact;
  }

  const byDate = new Map<string, NetWorthChartPoint>();
  for (const p of fact) {
    byDate.set(p.asOfDate, { ...p });
  }

  for (const fp of forecastPoints) {
    const events =
      fp.forecastEvents && fp.forecastEvents.length > 0
        ? fp.forecastEvents
        : undefined;
    const existing = byDate.get(fp.asOfDate);
    if (existing) {
      existing.forecast = fp.forecast;
      if (events) {
        existing.forecastEvents = events;
      }
    } else if (fp.asOfDate >= today) {
      // D-07/D-12: today hinge + horizonEnd + future pay dates must stay on axis
      byDate.set(fp.asOfDate, {
        asOfDate: fp.asOfDate,
        nw: fp.asOfDate === today ? fp.forecast : Number.NaN,
        forecast: fp.forecast,
        ...(events ? { forecastEvents: events } : {}),
      });
    }
  }

  return [...byDate.values()].sort((a, b) =>
    a.asOfDate < b.asOfDate ? -1 : a.asOfDate > b.asOfDate ? 1 : 0,
  );
}

export function DashboardChartsShell({
  accounts,
  snapshots,
  rates,
  primaryScale,
  today,
  listAccounts,
  primaryCode,
  anchorPrimaryMinor,
  forecastIncome,
  forecastGrace,
}: DashboardChartsShellProps) {
  const [range, setRange] = useState<RangePreset>("30d");

  const seriesAccounts = useMemo(() => reviveAccounts(accounts), [accounts]);
  const seriesSnapshots = useMemo(
    () => reviveSnapshots(snapshots),
    [snapshots],
  );
  const seriesRates = useMemo(() => reviveRates(rates), [rates]);
  const anchorMinor = useMemo(
    () => BigInt(anchorPrimaryMinor),
    [anchorPrimaryMinor],
  );

  const factPoints = useMemo(
    () =>
      buildNetWorthSeries({
        accounts: seriesAccounts,
        snapshots: seriesSnapshots,
        rates: seriesRates,
        primaryScale,
        preset: range,
        today,
      }).map(({ asOfDate, nw, stacks }) => ({
        asOfDate,
        nw,
        ...stacks,
      })),
    [
      seriesAccounts,
      seriesSnapshots,
      seriesRates,
      primaryScale,
      range,
      today,
    ],
  );

  const forecastMeta = useMemo(() => {
    const horizonEnd = forecastHorizonEnd(range, today);
    const from = addCalendarDays(today, 1);

    const recurringDefs = forecastIncome.recurring.map((r) => ({
      id: r.id,
      plannedAmountMinor: BigInt(r.plannedAmountMinor),
      dayOfMonth: r.dayOfMonth,
      startAsOf: r.startAsOf,
    }));
    const recurringActuals = forecastIncome.recurringActuals.map((a) => ({
      recurringIncomeId: a.recurringIncomeId,
      plannedAsOf: a.plannedAsOf,
    }));
    const oneTimeDefs = forecastIncome.oneTime.map((o) => ({
      id: o.id,
      plannedAmountMinor: BigInt(o.plannedAmountMinor),
      plannedAsOf: o.plannedAsOf,
    }));
    const oneTimeActuals = forecastIncome.oneTimeActuals.map((a) => ({
      oneTimeIncomeId: a.oneTimeIncomeId,
      plannedAsOf: a.plannedAsOf,
      amountMinor: BigInt(a.amountMinor),
      actualAsOf: a.actualAsOf,
    }));

    const currencyByRecurring = new Map(
      forecastIncome.recurring.map((r) => [
        r.id,
        {
          currencyCode: r.currencyCode,
          currencyScale: r.currencyScale,
          isPrimaryCurrency: r.isPrimaryCurrency,
        },
      ]),
    );
    const currencyByOneTime = new Map(
      forecastIncome.oneTime.map((o) => [
        o.id,
        {
          currencyCode: o.currencyCode,
          currencyScale: o.currencyScale,
          isPrimaryCurrency: o.isPrimaryCurrency,
        },
      ]),
    );

    // D-02: filled recurring via occurrenceKeyString against actual keys (Pitfall 3).
    const filledRecurring = new Set(
      recurringActuals.map((a) =>
        occurrenceKeyString({
          parentId: a.recurringIncomeId,
          plannedAsOf: a.plannedAsOf,
        }),
      ),
    );

    const raw = listAllInRange(
      {
        recurring: recurringDefs,
        recurringActuals,
        oneTime: oneTimeDefs,
        oneTimeActuals,
      },
      from,
      horizonEnd,
    );

    // Open membership at boundary (D-01..D-03): recurring+one-time; strict > today; no actual.
    const openSlots: ForecastSlot[] = [];
    for (const o of raw) {
      if (!(o.plannedAsOf > today)) continue;
      if (o.kind === "oneTime") {
        if (o.actual != null) continue;
        const cur = currencyByOneTime.get(o.parentId);
        if (!cur) continue;
        openSlots.push({
          kind: "income",
          parentId: o.parentId,
          plannedAsOf: o.plannedAsOf,
          plannedAmountMinor: o.plannedAmountMinor,
          currencyCode: cur.currencyCode,
          currencyScale: cur.currencyScale,
          isPrimaryCurrency: cur.isPrimaryCurrency,
        });
        continue;
      }
      const key = occurrenceKeyString({
        parentId: o.parentId,
        plannedAsOf: o.plannedAsOf,
      });
      if (filledRecurring.has(key)) continue;
      const cur = currencyByRecurring.get(o.parentId);
      if (!cur) continue;
      openSlots.push({
        kind: "income",
        parentId: o.parentId,
        plannedAsOf: o.plannedAsOf,
        plannedAmountMinor: o.plannedAmountMinor,
        currencyCode: cur.currencyCode,
        currencyScale: cur.currencyScale,
        isPrimaryCurrency: cur.isPrimaryCurrency,
      });
    }

    // C-03 / D-01…D-05: OPEN grace membership → kind grace slots; concat with income.
    const graceSlots: ForecastSlot[] = openGraceForecastMembership(
      forecastGrace.obligations.map((o) => ({
        id: o.id,
        dueAsOf: o.dueAsOf,
        amountMinor: BigInt(o.amountMinor),
        status: o.status,
        accountId: o.accountId,
        accountName: o.accountName,
        currencyCode: o.currencyCode,
        currencyScale: o.currencyScale,
        isPrimaryCurrency: o.isPrimaryCurrency,
      })),
      today,
      horizonEnd,
    ).map((m) => ({
      kind: "grace" as const,
      parentId: m.obligationId,
      plannedAsOf: m.sampleAsOf,
      plannedAmountMinor: m.amountMinor,
      currencyCode: m.currencyCode,
      currencyScale: m.currencyScale,
      isPrimaryCurrency: m.isPrimaryCurrency,
      accountId: m.accountId,
      accountName: m.accountName,
      dueAsOf: m.dueAsOf,
    }));

    const built = buildNetWorthForecastSeries({
      anchorPrimaryMinor: anchorMinor,
      slots: [...openSlots, ...graceSlots],
      rates: seriesRates,
      primaryScale,
      today,
      horizonEnd,
    });

    return built;
  }, [
    forecastIncome,
    forecastGrace,
    range,
    today,
    anchorMinor,
    seriesRates,
    primaryScale,
  ]);

  // D-07 / D-08 / D-16: hide Line when no includable slots (grace-only flat still counts);
  // keep banner if FX exclusions (D-18).
  const showForecast = forecastMeta.includedSlotCount > 0;
  const showPartialBanner =
    forecastMeta.isPartialForecast || forecastMeta.excludedMissingFxCount > 0;
  const missingFxCodes = forecastMeta.excludedMissingFxCurrencies;

  const points = useMemo(
    () =>
      mergeFactAndForecast(
        factPoints,
        forecastMeta.points,
        today,
        showForecast,
      ),
    [factPoints, forecastMeta.points, today, showForecast],
  );

  const windowStart = windowStartForPreset(range, today);
  const stackAccounts = useMemo(
    () => accounts.map((a) => ({ id: a.id, name: a.name })),
    [accounts],
  );

  return (
    <>
      <section className="flex flex-col gap-2">
        <DashboardRangeControl value={range} onChange={setRange} />
        <NetWorthHistoryChart
          data={points}
          accounts={stackAccounts}
          windowStart={windowStart}
          today={today}
          showForecast={showForecast}
        />
        {showPartialBanner ? (
          <p
            className="rounded-lg border border-border bg-muted/60 p-4 text-sm"
            role="status"
          >
            <span className="font-semibold text-foreground">
              Прогноз неполный
            </span>
            <span className="text-muted-foreground">
              {" · нет курса"}
              {missingFxCodes.length > 0
                ? ` ${missingFxCodes.join(", ")}`
                : ""}
            </span>
          </p>
        ) : null}
      </section>
      <DashboardAccountList
        accounts={listAccounts}
        primaryCode={primaryCode}
        range={range}
        today={today}
        snapshots={seriesSnapshots}
        rates={seriesRates}
        primaryScale={primaryScale}
      />
    </>
  );
}
