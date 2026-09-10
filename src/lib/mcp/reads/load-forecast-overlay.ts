/**
 * MCP forecast overlay loader (SIDE-04).
 * Ports DashboardChartsShell forecastMeta fold → buildNetWorthForecastSeries.
 * Accounts-only NW anchor via loadNetWorthAsOf — never debts / buildNetWorthSeries.
 */

import { openGraceForecastMembership } from "@/lib/credit-grace";
import { addCalendarDays } from "@/lib/dates";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
import {
  listAllInRange,
  occurrenceKeyString,
} from "@/lib/income";
import { type RateRow } from "@/lib/locf";
import { loadNetWorthAsOf } from "@/lib/mcp/reads/load-net-worth-asof";
import { minorToJson } from "@/lib/mcp/serialize";
import {
  buildNetWorthForecastSeries,
  type BuildNetWorthForecastSeriesResult,
  type ForecastSlot,
} from "@/lib/nw-forecast";

/** Default horizon when wire horizonEnd omitted (D-04 = UI 1y/all). */
export function resolveForecastHorizonEnd(
  today: string,
  horizonEnd?: string,
): string {
  return horizonEnd ?? addCalendarDays(today, 365);
}

export type SerializedForecastEvent = {
  kind: "income" | "grace";
  parentId: number;
  plannedAmountMinor: string;
  displayPrimaryMajor: number;
  currencyCode: string;
  accountId?: number;
  accountName?: string;
  dueAsOf?: string;
};

export type SerializedForecastPoint = {
  asOfDate: string;
  forecastPrimaryMinor: string;
  forecast: number;
  forecastEvents?: SerializedForecastEvent[];
};

export type SerializedForecastPayload = {
  today: string;
  horizonEnd: string;
  primaryCurrencyCode: string;
  primaryScale: number;
  anchorPrimaryMinor: string;
  isPartialForecast: boolean;
  includedSlotCount: number;
  excludedMissingFxCount: number;
  excludedMissingFxCurrencies: string[];
  points: SerializedForecastPoint[];
};

/**
 * Pure adapter: stringify buildNetWorthForecastSeries output (SQLite-free).
 */
export function serializeForecastPayload(
  built: BuildNetWorthForecastSeriesResult,
  meta: {
    today: string;
    horizonEnd: string;
    anchorPrimaryMinor: bigint;
    primaryScale: number;
    primaryCurrencyCode: string;
  },
): SerializedForecastPayload {
  return {
    today: meta.today,
    horizonEnd: meta.horizonEnd,
    primaryCurrencyCode: meta.primaryCurrencyCode,
    primaryScale: meta.primaryScale,
    anchorPrimaryMinor: minorToJson(meta.anchorPrimaryMinor)!,
    isPartialForecast: built.isPartialForecast,
    includedSlotCount: built.includedSlotCount,
    excludedMissingFxCount: built.excludedMissingFxCount,
    excludedMissingFxCurrencies: built.excludedMissingFxCurrencies,
    points: built.points.map((p) => ({
      asOfDate: p.asOfDate,
      forecastPrimaryMinor: minorToJson(p.forecastPrimaryMinor)!,
      forecast: p.forecast,
      ...(p.forecastEvents && p.forecastEvents.length > 0
        ? {
            forecastEvents: p.forecastEvents.map((e) => ({
              kind: e.kind,
              parentId: e.parentId,
              plannedAmountMinor: minorToJson(e.plannedAmountMinor)!,
              displayPrimaryMajor: e.displayPrimaryMajor,
              currencyCode: e.currencyCode,
              ...(e.accountId !== undefined ? { accountId: e.accountId } : {}),
              ...(e.accountName !== undefined
                ? { accountName: e.accountName }
                : {}),
              ...(e.dueAsOf !== undefined ? { dueAsOf: e.dueAsOf } : {}),
            })),
          }
        : {}),
    })),
  };
}

/**
 * Page/shell-parity forecast overlay (Капитал Прогноз).
 * Membership: open income slots + openGraceForecastMembership; domain builder only.
 */
export async function loadForecastOverlay(args: {
  today: string;
  horizonEnd: string;
}): Promise<SerializedForecastPayload> {
  const { today, horizonEnd } = args;
  await ensureSqlitePragmas();

  const [
    nw,
    ratesLte,
    recurringIncomes,
    oneTimeIncomes,
    recurringActuals,
    oneTimeActuals,
    openGraceObligations,
  ] = await Promise.all([
    loadNetWorthAsOf(today),
    prisma.fxRate.findMany({
      where: { asOfDate: { lte: today } },
      orderBy: { asOfDate: "desc" },
      select: {
        currencyCode: true,
        asOfDate: true,
        rateToPrimaryScaled: true,
      },
    }),
    prisma.recurringIncome.findMany({
      include: {
        currency: {
          select: { code: true, scale: true, isPrimary: true },
        },
      },
    }),
    prisma.oneTimeIncome.findMany({
      include: {
        currency: {
          select: { code: true, scale: true, isPrimary: true },
        },
      },
    }),
    prisma.recurringIncomeActual.findMany({
      select: {
        recurringIncomeId: true,
        plannedAsOf: true,
      },
    }),
    prisma.oneTimeIncomeActual.findMany({
      select: {
        oneTimeIncomeId: true,
        plannedAsOf: true,
        amountMinor: true,
        actualAsOf: true,
      },
    }),
    prisma.creditGraceObligation.findMany({
      where: { status: "OPEN" },
      select: {
        id: true,
        dueAsOf: true,
        amountMinor: true,
        status: true,
        accountId: true,
        account: {
          select: {
            name: true,
            currency: {
              select: { code: true, scale: true, isPrimary: true },
            },
          },
        },
      },
    }),
  ]);

  const rates: RateRow[] = ratesLte.map((r) => ({
    currencyCode: r.currencyCode,
    asOfDate: r.asOfDate,
    rateToPrimaryScaled: r.rateToPrimaryScaled,
  }));

  const anchorPrimaryMinor = BigInt(nw.totalPrimaryMinor);
  const from = addCalendarDays(today, 1);

  const recurringDefs = recurringIncomes.map((r) => ({
    id: r.id,
    plannedAmountMinor: r.plannedAmountMinor,
    dayOfMonth: r.dayOfMonth,
    startAsOf: r.startAsOf,
  }));
  const recurringActualSlots = recurringActuals.map((a) => ({
    recurringIncomeId: a.recurringIncomeId,
    plannedAsOf: a.plannedAsOf,
  }));
  const oneTimeDefs = oneTimeIncomes.map((o) => ({
    id: o.id,
    plannedAmountMinor: o.plannedAmountMinor,
    plannedAsOf: o.plannedAsOf,
  }));
  const oneTimeActualSlots = oneTimeActuals.map((a) => ({
    oneTimeIncomeId: a.oneTimeIncomeId,
    plannedAsOf: a.plannedAsOf,
    amountMinor: a.amountMinor,
    actualAsOf: a.actualAsOf,
  }));

  const currencyByRecurring = new Map(
    recurringIncomes.map((r) => [
      r.id,
      {
        currencyCode: r.currency.code,
        currencyScale: r.currency.scale,
        isPrimaryCurrency: r.currency.isPrimary,
      },
    ]),
  );
  const currencyByOneTime = new Map(
    oneTimeIncomes.map((o) => [
      o.id,
      {
        currencyCode: o.currency.code,
        currencyScale: o.currency.scale,
        isPrimaryCurrency: o.currency.isPrimary,
      },
    ]),
  );

  const filledRecurring = new Set(
    recurringActualSlots.map((a) =>
      occurrenceKeyString({
        parentId: a.recurringIncomeId,
        plannedAsOf: a.plannedAsOf,
      }),
    ),
  );

  const raw = listAllInRange(
    {
      recurring: recurringDefs,
      recurringActuals: recurringActualSlots,
      oneTime: oneTimeDefs,
      oneTimeActuals: oneTimeActualSlots,
    },
    from,
    horizonEnd,
  );

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

  const graceSlots: ForecastSlot[] = openGraceForecastMembership(
    openGraceObligations.map((o) => ({
      id: o.id,
      dueAsOf: o.dueAsOf,
      amountMinor: o.amountMinor,
      status: o.status as "OPEN" | "CLOSED",
      accountId: o.accountId,
      accountName: o.account.name,
      currencyCode: o.account.currency.code,
      currencyScale: o.account.currency.scale,
      isPrimaryCurrency: o.account.currency.isPrimary,
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
    anchorPrimaryMinor,
    slots: [...openSlots, ...graceSlots],
    rates,
    primaryScale: nw.primaryScale,
    today,
    horizonEnd,
  });

  return serializeForecastPayload(built, {
    today,
    horizonEnd,
    anchorPrimaryMinor,
    primaryScale: nw.primaryScale,
    primaryCurrencyCode: nw.primaryCurrencyCode,
  });
}
