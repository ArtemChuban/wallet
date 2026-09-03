"use client";

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
import { formatAsOfDisplay } from "@/lib/dates";

const chartConfig = {
  nw: {
    label: "Капитал",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export type NetWorthChartPoint = {
  asOfDate: string;
  nw: number;
};

type NetWorthHistoryChartProps = {
  data: NetWorthChartPoint[];
  /** Inclusive window start ISO, or null for all — used for empty-axes X ticks (D-13). */
  windowStart: string | null;
  today: string;
};

export function NetWorthHistoryChart({
  data,
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

  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
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
            typeof value === "number" ? value.toLocaleString("ru-RU") : String(value)
          }
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(value) =>
                typeof value === "string" ? formatAsOfDisplay(value) : String(value ?? "")
              }
            />
          }
        />
        <Line
          dataKey="nw"
          type="linear"
          stroke="var(--color-nw)"
          strokeWidth={2}
          dot={data.length <= 1}
          connectNulls={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
