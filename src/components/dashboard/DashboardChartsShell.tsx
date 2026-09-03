"use client";

import { useMemo, useState } from "react";

import { DashboardRangeControl } from "@/components/dashboard/DashboardRangeControl";
import { NetWorthHistoryChart } from "@/components/dashboard/NetWorthHistoryChart";
import { windowStartForPreset, type RangePreset } from "@/lib/dates";
import {
  buildNetWorthSeries,
  type SeriesAccount,
  type SeriesRate,
  type SeriesSnapshot,
} from "@/lib/historical-series";
import type { NetWorthAccountType } from "@/lib/net-worth";

export type ChartAccountPayload = {
  id: number;
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

type DashboardChartsShellProps = {
  accounts: ChartAccountPayload[];
  snapshots: ChartSnapshotPayload[];
  rates: ChartRatePayload[];
  primaryScale: number;
  today: string;
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

export function DashboardChartsShell({
  accounts,
  snapshots,
  rates,
  primaryScale,
  today,
}: DashboardChartsShellProps) {
  const [range, setRange] = useState<RangePreset>("30d");

  const seriesAccounts = useMemo(() => reviveAccounts(accounts), [accounts]);
  const seriesSnapshots = useMemo(
    () => reviveSnapshots(snapshots),
    [snapshots],
  );
  const seriesRates = useMemo(() => reviveRates(rates), [rates]);

  const points = useMemo(
    () =>
      buildNetWorthSeries({
        accounts: seriesAccounts,
        snapshots: seriesSnapshots,
        rates: seriesRates,
        primaryScale,
        preset: range,
        today,
      }).map(({ asOfDate, nw }) => ({ asOfDate, nw })),
    [
      seriesAccounts,
      seriesSnapshots,
      seriesRates,
      primaryScale,
      range,
      today,
    ],
  );

  const windowStart = windowStartForPreset(range, today);

  return (
    <section className="flex flex-col">
      <DashboardRangeControl value={range} onChange={setRange} />
      <NetWorthHistoryChart
        data={points}
        windowStart={windowStart}
        today={today}
      />
    </section>
  );
}
