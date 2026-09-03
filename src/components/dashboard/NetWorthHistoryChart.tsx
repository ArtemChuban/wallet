"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatAsOfDisplay } from "@/lib/dates";
import { accountStackKey } from "@/lib/historical-series";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

export type NetWorthStackAccount = {
  id: number;
  name: string;
};

export type NetWorthChartPoint = {
  asOfDate: string;
  nw: number;
  /** Flattened stack majors keyed by accountStackKey(id). */
  [stackKey: string]: string | number;
};

type NetWorthHistoryChartProps = {
  data: NetWorthChartPoint[];
  accounts: NetWorthStackAccount[];
  /** Inclusive window start ISO, or null for all — used for empty-axes X ticks (D-13). */
  windowStart: string | null;
  today: string;
};

export function NetWorthHistoryChart({
  data,
  accounts,
  windowStart,
  today,
}: NetWorthHistoryChartProps) {
  const empty = data.length === 0;
  const xTicks =
    empty && windowStart != null
      ? [windowStart, today]
      : empty
        ? [today]
        : undefined;

  const chartConfig = Object.fromEntries(
    accounts.map((account, index) => [
      accountStackKey(account.id),
      {
        label: account.name,
        color: CHART_COLORS[index % CHART_COLORS.length],
      },
    ]),
  ) satisfies ChartConfig;

  const stackKeys = accounts.map((a) => accountStackKey(a.id));

  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
      <AreaChart
        accessibilityLayer
        data={data}
        margin={{ left: 8, right: 8, top: 8, bottom: 0 }}
        stackOffset="sign"
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
            typeof value === "number" ? value.toLocaleString("ru-RU") : String(value)
          }
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(value) =>
                typeof value === "string" ? formatAsOfDisplay(value) : String(value ?? "")
              }
              indicator="dot"
            />
          }
        />
        {!empty && accounts.length > 1 ? (
          <ChartLegend content={<ChartLegendContent />} />
        ) : null}
        {stackKeys.map((key) => (
          <Area
            key={key}
            dataKey={key}
            type="linear"
            stackId="nw"
            stroke={`var(--color-${key})`}
            fill={`var(--color-${key})`}
            fillOpacity={0.55}
            strokeWidth={1}
            // D-15: one point → paint dots; Recharts draws no connecting segment
            dot={data.length <= 1}
            connectNulls={false}
            activeDot={{ r: 3 }}
          />
        ))}
      </AreaChart>
    </ChartContainer>
  );
}
