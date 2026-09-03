"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
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
  type AccountSeriesMode,
  type SeriesAccount,
  type SeriesRate,
  type SeriesSnapshot,
} from "@/lib/historical-series";
import { formatChartNumber } from "@/lib/money";
import type { NetWorthAccountType } from "@/lib/net-worth";

export type AccountHistoryChartProps = {
  accountId: number;
  accountName: string;
  currencyCode: string;
  currencyScale: number;
  isPrimaryCurrency: boolean;
  type: NetWorthAccountType;
  creditLimitMinor: string | null;
  isCredit: boolean;
  snapshots: SeriesSnapshot[];
  rates: SeriesRate[];
  primaryScale: number;
  primaryCode: string;
  range: RangePreset;
  today: string;
};

const creditChartConfig = {
  debt: {
    label: "долг",
    color: "var(--chart-5)",
  },
  available: {
    label: "доступно",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function AccountHistoryChart({
  accountId,
  accountName,
  currencyCode,
  currencyScale,
  isPrimaryCurrency,
  type,
  creditLimitMinor,
  isCredit,
  snapshots,
  rates,
  primaryScale,
  primaryCode,
  range,
  today,
}: AccountHistoryChartProps) {
  const [mode, setMode] = useState<AccountSeriesMode>("native");

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

  const effectiveMode: AccountSeriesMode = isPrimaryCurrency
    ? "native"
    : mode;

  const series = useMemo(
    () =>
      buildAccountSeries({
        account,
        snapshots,
        rates,
        primaryScale,
        preset: range,
        today,
        mode: effectiveMode,
      }),
    [account, snapshots, rates, primaryScale, range, today, effectiveMode],
  );

  const lineData = useMemo(
    () => series.map(({ asOfDate, value }) => ({ asOfDate, value })),
    [series],
  );

  const creditData = useMemo(
    () =>
      series.map(({ asOfDate, debt = 0, available = 0 }) => ({
        asOfDate,
        debt,
        available,
      })),
    [series],
  );

  const data = isCredit ? creditData : lineData;
  const windowStart = windowStartForPreset(range, today);
  const empty = data.length === 0;
  const xTicks =
    empty && windowStart != null
      ? [windowStart, today]
      : empty
        ? [today]
        : undefined;
  // D-13 empty axes / D-15 single-point dots via data.length below

  const lineConfig = {
    value: {
      label: accountName,
      color: "var(--chart-3)",
    },
  } satisfies ChartConfig;

  const seriesConfig = isCredit ? creditChartConfig : lineConfig;

  return (
    <div className="flex flex-col gap-2">
      {!isPrimaryCurrency ? (
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Валюта графика"
        >
          <Button
            type="button"
            size="sm"
            variant={effectiveMode === "native" ? "default" : "outline"}
            className="min-h-11 text-sm"
            aria-pressed={effectiveMode === "native"}
            onClick={() => setMode("native")}
          >
            В валюте счёта
          </Button>
          <Button
            type="button"
            size="sm"
            variant={effectiveMode === "primary" ? "default" : "outline"}
            className="min-h-11 text-sm"
            aria-pressed={effectiveMode === "primary"}
            onClick={() => setMode("primary")}
          >
            {`В ${primaryCode}`}
          </Button>
        </div>
      ) : null}
      <ChartContainer config={seriesConfig} className="h-[200px] w-full">
        {isCredit ? (
          <AreaChart
            accessibilityLayer
            data={creditData}
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
                  ? formatChartNumber(value)
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
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              dataKey="debt"
              type="linear"
              stackId="credit"
              fill="var(--color-debt)"
              stroke="var(--color-debt)"
              fillOpacity={0.4}
              dot={data.length <= 1}
              connectNulls={false}
              activeDot={{ r: 4 }}
            />
            <Area
              dataKey="available"
              type="linear"
              stackId="credit"
              fill="var(--color-available)"
              stroke="var(--color-available)"
              fillOpacity={0.4}
              dot={data.length <= 1}
              connectNulls={false}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        ) : (
          <LineChart
            accessibilityLayer
            data={lineData}
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
                  ? formatChartNumber(value)
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
        )}
      </ChartContainer>
    </div>
  );
}
