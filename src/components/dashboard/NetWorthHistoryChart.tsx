"use client";

import type { TooltipContentProps } from "recharts";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
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
import { accountStackKey } from "@/lib/historical-series";
import { formatChartNumber } from "@/lib/money";
import type { ForecastEvent } from "@/lib/nw-forecast";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

const FORECAST_KEY = "forecast";

export type NetWorthStackAccount = {
  id: number;
  name: string;
};

export type NetWorthChartPoint = {
  asOfDate: string;
  nw: number;
  /** Optional dashed-series major (Plan 17+). */
  forecast?: number;
  /** Builder metadata for today + future tooltips (Plan 21 / D-06, D-09). */
  forecastEvents?: ForecastEvent[];
  /** Flattened stack majors keyed by accountStackKey(id). */
  [stackKey: string]: string | number | ForecastEvent[] | undefined;
};

type NetWorthHistoryChartProps = {
  data: NetWorthChartPoint[];
  accounts: NetWorthStackAccount[];
  /** Inclusive window start ISO, or null for all — used for empty-axes X ticks (D-13). */
  windowStart: string | null;
  today: string;
  /** When true, paint dashed «Прогноз» Line (D-09 / D-10). */
  showForecast?: boolean;
};

/** Interest block — D-01/D-04/D-05/D-08; future accrual day only (D-03). */
function ForecastInterestTooltipBlock({ events }: { events: ForecastEvent[] }) {
  const interestRows = events.filter((e) => e.kind === "interest");
  if (interestRows.length === 0) return null;

  return (
    <div className="mt-1 grid gap-1 border-t border-border/50 pt-1">
      <span className="text-muted-foreground">Накопительный</span>
      <span className="text-muted-foreground">Ожидаемое начисление</span>
      {interestRows.map((ev) => (
        <div
          key={`${ev.parentId}-${ev.accountId ?? ""}-${ev.displayPrimaryMajor}`}
          className="flex w-full items-start gap-2"
        >
          <span className="min-w-0 flex-1 break-words text-muted-foreground">
            {ev.accountName ?? `счёт ${ev.accountId}`}
          </span>
          <span className="shrink-0 font-mono font-semibold text-foreground tabular-nums">
            {`+${formatChartNumber(ev.displayPrimaryMajor)}`}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Grace block B — C-04 / D-09…D-13; omit when no FX-included grace events. */
function ForecastGraceTooltipBlock({ events }: { events: ForecastEvent[] }) {
  const graceRows = events.filter((e) => e.kind === "grace");
  if (graceRows.length === 0) return null;

  return (
    <div className="mt-1 grid gap-1 border-t border-border/50 pt-1">
      <span className="text-muted-foreground">Платёж для беспроцентного</span>
      <span className="text-muted-foreground">Ожидаемый платёж</span>
      {graceRows.map((ev) => (
        <div
          key={`${ev.parentId}-${ev.dueAsOf ?? ""}-${ev.accountId ?? ""}`}
          className="flex w-full items-start gap-2"
        >
          <span className="min-w-0 flex-1 break-words text-muted-foreground">
            {ev.accountName ?? `обязательство ${ev.parentId}`}
          </span>
          <span className="shrink-0 font-mono font-semibold text-foreground tabular-nums">
            {`-${formatChartNumber(ev.displayPrimaryMajor)}`}
          </span>
        </div>
      ))}
    </div>
  );
}

function NetWorthChartTooltip({
  active,
  payload,
  label,
  accounts,
  today,
}: TooltipContentProps & {
  accounts: NetWorthStackAccount[];
  today: string;
}) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload as NetWorthChartPoint | undefined;
  const asOfDate =
    typeof point?.asOfDate === "string"
      ? point.asOfDate
      : typeof label === "string"
        ? label
        : "";
  const labelText = asOfDate
    ? formatAsOfDisplay(asOfDate)
    : String(label ?? "");
  const forecastEvents = point?.forecastEvents ?? [];

  // D-10/D-11: future → «Прогноз» aggregate first; grace block below when events
  if (asOfDate > today) {
    const forecastVal =
      typeof point?.[FORECAST_KEY] === "number" &&
      !Number.isNaN(point[FORECAST_KEY])
        ? (point[FORECAST_KEY] as number)
        : null;
    if (forecastVal == null) return null;
    return (
      <div className="grid min-w-40 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
        <div className="font-medium">{labelText}</div>
        <div className="flex w-full items-center gap-2">
          <div
            className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
            style={{ backgroundColor: "var(--muted-foreground)" }}
          />
          <span className="flex-1 text-muted-foreground">Прогноз</span>
          <span className="font-mono font-medium text-foreground tabular-nums">
            {formatChartNumber(forecastVal)}
          </span>
        </div>
        <ForecastInterestTooltipBlock events={forecastEvents} />
        <ForecastGraceTooltipBlock events={forecastEvents} />
      </div>
    );
  }

  const total =
    typeof point?.nw === "number" && !Number.isNaN(point.nw) ? point.nw : null;

  const nameByKey = new Map(
    accounts.map((a) => [accountStackKey(a.id), a.name]),
  );

  const rows = payload.filter(
    (item) =>
      item.type !== "none" &&
      item.dataKey !== FORECAST_KEY &&
      item.value != null &&
      !(typeof item.value === "number" && Number.isNaN(item.value)),
  );

  return (
    <div className="grid min-w-40 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
      <div className="font-medium">{labelText}</div>
      <div className="grid gap-1.5">
        {rows.map((item, index) => {
          const key = String(item.dataKey ?? item.name ?? "");
          const color = item.color;
          return (
            <div key={index} className="flex w-full items-center gap-2">
              <div
                className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                style={{ backgroundColor: color }}
              />
              <span className="flex-1 text-muted-foreground">
                {nameByKey.get(key) ?? key}
              </span>
              <span className="font-mono font-medium text-foreground tabular-nums">
                {typeof item.value === "number"
                  ? formatChartNumber(item.value)
                  : String(item.value)}
              </span>
            </div>
          );
        })}
        {total != null ? (
          <div className="mt-0.5 flex w-full items-center justify-between border-t border-border/50 pt-1.5">
            <span className="font-medium text-foreground">Итого</span>
            <span className="font-mono font-semibold text-foreground tabular-nums">
              {formatChartNumber(total)}
            </span>
          </div>
        ) : null}
      </div>
      {/* D-09: folded overdue / due-today grace beside stack */}
      <ForecastGraceTooltipBlock events={forecastEvents} />
    </div>
  );
}

export function NetWorthHistoryChart({
  data,
  accounts,
  windowStart,
  today,
  showForecast = false,
}: NetWorthHistoryChartProps) {
  const empty = data.length === 0;
  const xTicks =
    empty && windowStart != null
      ? [windowStart, today]
      : empty
        ? [today]
        : undefined;

  const chartConfig = {
    ...Object.fromEntries(
      accounts.map((account, index) => [
        accountStackKey(account.id),
        {
          label: account.name,
          color: CHART_COLORS[index % CHART_COLORS.length],
        },
      ]),
    ),
    ...(showForecast
      ? {
          [FORECAST_KEY]: {
            label: "Прогноз",
            color: "var(--muted-foreground)",
          },
        }
      : {}),
  } satisfies ChartConfig;

  const stackKeys = accounts.map((a) => accountStackKey(a.id));
  // D-10: legend when multi-account OR forecast shown (single account still needs «Прогноз»)
  const showLegend = !empty && (accounts.length > 1 || showForecast);

  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
      <ComposedChart
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
            typeof value === "number" ? formatChartNumber(value) : String(value)
          }
        />
        <ChartTooltip
          content={(props) => (
            <NetWorthChartTooltip
              {...props}
              accounts={accounts}
              today={today}
            />
          )}
        />
        {showLegend ? (
          <ChartLegend content={<ChartLegendContent />} />
        ) : null}
        {showForecast ? (
          <ReferenceLine x={today} stroke="var(--border)" />
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
        {showForecast ? (
          <Line
            dataKey={FORECAST_KEY}
            type="stepAfter"
            stroke="var(--muted-foreground)"
            strokeDasharray="5 5"
            strokeWidth={1.5}
            dot={false}
            connectNulls={false}
            name="Прогноз"
            isAnimationActive={false}
          />
        ) : null}
      </ComposedChart>
    </ChartContainer>
  );
}
