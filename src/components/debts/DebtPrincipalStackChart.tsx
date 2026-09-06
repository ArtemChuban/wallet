"use client";

import type { TooltipContentProps } from "recharts";
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
  type ChartConfig,
} from "@/components/ui/chart";
import { formatAsOfDisplay } from "@/lib/dates";
import {
  buildDebtPrincipalStackSeries,
  type DebtPrincipalStackPoint,
} from "@/lib/debts";
import { formatChartNumber } from "@/lib/money";

const chartConfig = {
  repaidMajor: {
    label: "Погашено",
    color: "var(--chart-2)",
  },
  remainingMajor: {
    label: "Остаток",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

type DebtPrincipalStackChartProps = {
  openedAsOf: string;
  initialAmountMinor: string;
  repayments: readonly {
    id: number;
    asOfDate: string;
    amountMinor: string;
  }[];
  sizeChanges: readonly {
    id: number;
    asOfDate: string;
    deltaMinor: string;
  }[];
  today: string;
  scale: number;
};

function DebtStackTooltip({
  active,
  payload,
  label,
}: TooltipContentProps) {
  if (!active || !payload?.length) return null;

  const labelText =
    typeof label === "string" ? formatAsOfDisplay(label) : String(label ?? "");

  const rows = payload.filter(
    (item) => item.type !== "none" && item.value != null,
  );

  return (
    <div className="grid min-w-40 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
      <div className="font-medium">{labelText}</div>
      <div className="grid gap-1.5">
        {rows.map((item, index) => {
          const key = String(item.dataKey ?? "");
          const name =
            key === "repaidMajor"
              ? "Погашено"
              : key === "remainingMajor"
                ? "Остаток"
                : key;
          return (
            <div key={index} className="flex w-full items-center gap-2">
              <div
                className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                style={{ backgroundColor: item.color }}
              />
              <span className="flex-1 text-muted-foreground">{name}</span>
              <span className="font-mono font-medium text-foreground tabular-nums">
                {typeof item.value === "number"
                  ? formatChartNumber(item.value)
                  : String(item.value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DebtPrincipalStackChart({
  openedAsOf,
  initialAmountMinor,
  repayments,
  sizeChanges,
  today,
  scale,
}: DebtPrincipalStackChartProps) {
  const data: DebtPrincipalStackPoint[] = buildDebtPrincipalStackSeries({
    openedAsOf,
    initialAmountMinor: BigInt(initialAmountMinor),
    repayments: repayments.map((r) => ({
      id: r.id,
      asOfDate: r.asOfDate,
      amountMinor: BigInt(r.amountMinor),
    })),
    sizeChanges: sizeChanges.map((s) => ({
      id: s.id,
      asOfDate: s.asOfDate,
      deltaMinor: BigInt(s.deltaMinor),
    })),
    today,
    scale,
  });

  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
      <AreaChart
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
          tickFormatter={(value: string) => formatAsOfDisplay(value)}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(value: number) =>
            typeof value === "number" ? formatChartNumber(value) : String(value)
          }
        />
        <ChartTooltip content={(props) => <DebtStackTooltip {...props} />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Area
          dataKey="repaidMajor"
          type="stepAfter"
          stackId="principal"
          stroke="var(--color-repaidMajor)"
          fill="var(--color-repaidMajor)"
          fillOpacity={0.55}
          strokeWidth={1}
          dot={data.length <= 1}
        />
        <Area
          dataKey="remainingMajor"
          type="stepAfter"
          stackId="principal"
          stroke="var(--color-remainingMajor)"
          fill="var(--color-remainingMajor)"
          fillOpacity={0.55}
          strokeWidth={1}
          dot={data.length <= 1}
        />
      </AreaChart>
    </ChartContainer>
  );
}
