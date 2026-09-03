"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
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
  type AccountSeriesMode,
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

  const data = useMemo(
    () =>
      buildAccountSeries({
        account,
        snapshots,
        rates,
        primaryScale,
        preset: range,
        today,
        mode: effectiveMode,
      }).map(({ asOfDate, value }) => ({ asOfDate, value })),
    [account, snapshots, rates, primaryScale, range, today, effectiveMode],
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
    <div className="flex flex-col gap-2">
      {!isPrimaryCurrency ? (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Валюта графика">
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
    </div>
  );
}
