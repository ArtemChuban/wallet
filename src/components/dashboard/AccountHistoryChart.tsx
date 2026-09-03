"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  formatAsOfDisplay,
  windowStartForPreset,
  type RangePreset,
} from "@/lib/dates";
import {
  buildAccountSeries,
  type SeriesAccount,
  type SeriesRate,
  type SeriesSnapshot,
} from "@/lib/historical-series";
import type { NetWorthAccountType } from "@/lib/net-worth";

export type AccountHistoryChartProps = {
  accountId: number;
  accountName: string;
  currencyCode: string;
  currencyScale: number;
  isPrimaryCurrency: boolean;
  type: NetWorthAccountType;
  creditLimitMinor: string | null;
  /** Plan 03 replaces Line with stacked Areas when true. */
  isCredit: boolean;
  snapshots: SeriesSnapshot[];
  rates: SeriesRate[];
  primaryScale: number;
  primaryCode: string;
  range: RangePreset;
  today: string;
};

export function AccountHistoryChart({
  accountId,
  accountName,
  currencyCode,
  currencyScale,
  isPrimaryCurrency,
  type,
  creditLimitMinor,
  isCredit: _isCredit,
  snapshots,
  rates,
  primaryScale,
  primaryCode: _primaryCode,
  range,
  today,
}: AccountHistoryChartProps) {
  const account: SeriesAccount = useMemo(
    () => ({
      id: accountId,
      type,
      currencyCode,
      currencyScale,
      isPrimaryCurrency,
      creditLimitMinor:
        creditLimitMinor == null ? null : BigInt(creditLimitMinor),
    }),
    [
      accountId,
      type,
      currencyCode,
      currencyScale,
      isPrimaryCurrency,
      creditLimitMinor,
    ],
  );

  // Task 2: native default only; Task 3 adds native↔primary toggle.
  const data = useMemo(
    () =>
      buildAccountSeries({
        account,
        snapshots,
        rates,
        primaryScale,
        preset: range,
        today,
        mode: "native",
      }).map(({ asOfDate, value }) => ({ asOfDate, value })),
    [account, snapshots, rates, primaryScale, range, today],
  );

  const windowStart = windowStartForPreset(range, today);
  const empty = data.length === 0;
  const xTicks =
    empty && windowStart != null
      ? [windowStart, today]
      : empty
        ? [today]
        : undefined;

  const seriesConfig = {
    value: {
      label: accountName,
      color: "var(--chart-3)",
    },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={seriesConfig} className="h-[200px] w-full">
      <LineChart
        accessibilityLayer
        data={data}
        margin={{ left: 8, right: 8, top: 8, bottom: 0 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="asOfDate"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          ticks={xTicks}
          tickFormatter={(value: string) => formatAsOfDisplay(value)}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={48}
          domain={empty ? [0, 1] : ["auto", "auto"]}
          tickFormatter={(value: number) =>
            typeof value === "number"
              ? value.toLocaleString("ru-RU")
              : String(value)
          }
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(value) =>
                typeof value === "string"
                  ? formatAsOfDisplay(value)
                  : String(value ?? "")
              }
            />
          }
        />
        <Line
          dataKey="value"
          type="linear"
          stroke="var(--color-value)"
          strokeWidth={2}
          dot={data.length <= 1}
          connectNulls={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
