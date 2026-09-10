/**
 * MCP Доходы list loader (SIDE-02).
 * Default = income page next-open parity; optional from+to → listAllInRange.
 * Read-only prisma — never BalanceSnapshot mutate / app actions (INISO).
 */

import { ensureSqlitePragmas, prisma } from "@/lib/db";
import {
  isIncomeOverdue,
  listAllInRange,
  nextOpenPlannedAsOf,
  occurrenceKeyString,
  type IncomeOccurrence,
  type OneTimeIncomeActualSlot,
  type OneTimeIncomeDef,
  type RecurringIncomeActualSlot,
  type RecurringIncomeDef,
} from "@/lib/income";
import { minorToJson } from "@/lib/mcp/serialize";

export type IncomeNextOpenRowInput = {
  id: number;
  kind: "recurring" | "oneTime";
  currencyCode: string;
  currencyScale: number;
  plannedAmountMinor: bigint;
  dayOfMonth: number | null;
  startAsOf: string | null;
  plannedAsOf: string | null;
  note: string | null;
  nextPlannedAsOf: string;
  hasActual: boolean;
  overdue: boolean;
  actualId?: number;
  actualAmountMinor?: bigint;
  actualAsOf?: string;
  actualNote: string | null;
};

export type IncomeNextOpenPersonInput = {
  id: number;
  name: string;
  incomes: IncomeNextOpenRowInput[];
};

export type SerializedIncomeNextOpenRow = {
  id: number;
  kind: "recurring" | "oneTime";
  currencyCode: string;
  currencyScale: number;
  plannedAmountMinor: string;
  dayOfMonth: number | null;
  startAsOf: string | null;
  plannedAsOf: string | null;
  note: string | null;
  nextPlannedAsOf: string;
  hasActual: boolean;
  overdue: boolean;
  actualId?: number;
  actualAmountMinor?: string;
  actualAsOf?: string;
  actualNote: string | null;
};

export type SerializedIncomeNextOpenPayload = {
  mode: "next_open";
  today: string;
  people: Array<{
    id: number;
    name: string;
    incomes: SerializedIncomeNextOpenRow[];
  }>;
};

export type IncomeRangeOccurrenceInput = {
  kind: "recurring" | "oneTime";
  parentId: number;
  personId: number;
  personName: string;
  currencyCode: string;
  currencyScale: number;
  plannedAsOf: string;
  plannedAmountMinor: bigint;
  hasActual: boolean;
  overdue: boolean;
  actualAmountMinor?: bigint;
  actualAsOf?: string;
};

export type SerializedIncomeRangePayload = {
  mode: "range";
  today: string;
  from: string;
  to: string;
  occurrences: Array<{
    kind: "recurring" | "oneTime";
    parentId: number;
    personId: number;
    personName: string;
    currencyCode: string;
    currencyScale: number;
    plannedAsOf: string;
    plannedAmountMinor: string;
    hasActual: boolean;
    overdue: boolean;
    actualAmountMinor?: string;
    actualAsOf?: string;
  }>;
};

/** Pure adapter: next-open page-parity rows → string minors (SQLite-free). */
export function serializeIncomeNextOpenPayload(args: {
  today: string;
  people: IncomeNextOpenPersonInput[];
}): SerializedIncomeNextOpenPayload {
  return {
    mode: "next_open",
    today: args.today,
    people: args.people.map((p) => ({
      id: p.id,
      name: p.name,
      incomes: p.incomes.map((r) => ({
        id: r.id,
        kind: r.kind,
        currencyCode: r.currencyCode,
        currencyScale: r.currencyScale,
        plannedAmountMinor: minorToJson(r.plannedAmountMinor)!,
        dayOfMonth: r.dayOfMonth,
        startAsOf: r.startAsOf,
        plannedAsOf: r.plannedAsOf,
        note: r.note,
        nextPlannedAsOf: r.nextPlannedAsOf,
        hasActual: r.hasActual,
        overdue: r.overdue,
        ...(r.actualId !== undefined ? { actualId: r.actualId } : {}),
        ...(r.actualAmountMinor !== undefined
          ? { actualAmountMinor: minorToJson(r.actualAmountMinor)! }
          : {}),
        ...(r.actualAsOf !== undefined ? { actualAsOf: r.actualAsOf } : {}),
        actualNote: r.actualNote,
      })),
    })),
  };
}

/** Pure adapter: range occurrences → string minors (SQLite-free). */
export function serializeIncomeRangePayload(args: {
  today: string;
  from: string;
  to: string;
  occurrences: IncomeRangeOccurrenceInput[];
}): SerializedIncomeRangePayload {
  return {
    mode: "range",
    today: args.today,
    from: args.from,
    to: args.to,
    occurrences: args.occurrences.map((o) => ({
      kind: o.kind,
      parentId: o.parentId,
      personId: o.personId,
      personName: o.personName,
      currencyCode: o.currencyCode,
      currencyScale: o.currencyScale,
      plannedAsOf: o.plannedAsOf,
      plannedAmountMinor: minorToJson(o.plannedAmountMinor)!,
      hasActual: o.hasActual,
      overdue: o.overdue,
      ...(o.actualAmountMinor !== undefined
        ? { actualAmountMinor: minorToJson(o.actualAmountMinor)! }
        : {}),
      ...(o.actualAsOf !== undefined ? { actualAsOf: o.actualAsOf } : {}),
    })),
  };
}

function occurrenceHasActual(
  o: IncomeOccurrence,
  recurringFilled: Set<string>,
): boolean {
  if (o.kind === "oneTime") return o.actual != null;
  return recurringFilled.has(
    occurrenceKeyString({ parentId: o.parentId, plannedAsOf: o.plannedAsOf }),
  );
}

/**
 * Income-page-parity loader for list_income.
 * Default next-open; optional from+to both required → listAllInRange dump.
 */
export async function loadIncome(args: {
  today: string;
  from?: string;
  to?: string;
}): Promise<SerializedIncomeNextOpenPayload | SerializedIncomeRangePayload> {
  const { today, from, to } = args;
  await ensureSqlitePragmas();

  const peopleRaw = await prisma.person.findMany({
    orderBy: { name: "asc" },
    include: {
      recurringIncomes: {
        orderBy: { id: "desc" },
        include: {
          currency: {
            select: { code: true, name: true, scale: true },
          },
          actuals: {
            select: {
              id: true,
              plannedAsOf: true,
              amountMinor: true,
              actualAsOf: true,
              note: true,
              recurringIncomeId: true,
            },
          },
        },
      },
      oneTimeIncomes: {
        orderBy: { id: "desc" },
        include: {
          currency: {
            select: { code: true, name: true, scale: true },
          },
          actuals: {
            select: {
              id: true,
              plannedAsOf: true,
              amountMinor: true,
              actualAsOf: true,
              note: true,
              oneTimeIncomeId: true,
            },
          },
        },
      },
    },
  });

  if (from !== undefined && to !== undefined) {
    const recurring: RecurringIncomeDef[] = [];
    const recurringActuals: RecurringIncomeActualSlot[] = [];
    const oneTime: OneTimeIncomeDef[] = [];
    const oneTimeActuals: OneTimeIncomeActualSlot[] = [];
    const metaByRecurring = new Map<
      number,
      { personId: number; personName: string; currencyCode: string; currencyScale: number }
    >();
    const metaByOneTime = new Map<
      number,
      { personId: number; personName: string; currencyCode: string; currencyScale: number }
    >();
    const recurringFilled = new Set<string>();

    for (const p of peopleRaw) {
      for (const r of p.recurringIncomes) {
        recurring.push({
          id: r.id,
          plannedAmountMinor: r.plannedAmountMinor,
          dayOfMonth: r.dayOfMonth,
          startAsOf: r.startAsOf,
        });
        metaByRecurring.set(r.id, {
          personId: p.id,
          personName: p.name,
          currencyCode: r.currencyCode,
          currencyScale: r.currency.scale,
        });
        for (const a of r.actuals) {
          recurringActuals.push({
            recurringIncomeId: a.recurringIncomeId,
            plannedAsOf: a.plannedAsOf,
          });
          recurringFilled.add(
            occurrenceKeyString({
              parentId: a.recurringIncomeId,
              plannedAsOf: a.plannedAsOf,
            }),
          );
        }
      }
      for (const o of p.oneTimeIncomes) {
        oneTime.push({
          id: o.id,
          plannedAmountMinor: o.plannedAmountMinor,
          plannedAsOf: o.plannedAsOf,
        });
        metaByOneTime.set(o.id, {
          personId: p.id,
          personName: p.name,
          currencyCode: o.currencyCode,
          currencyScale: o.currency.scale,
        });
        for (const a of o.actuals) {
          oneTimeActuals.push({
            oneTimeIncomeId: a.oneTimeIncomeId,
            plannedAsOf: a.plannedAsOf,
            amountMinor: a.amountMinor,
            actualAsOf: a.actualAsOf,
          });
        }
      }
    }

    const raw = listAllInRange(
      { recurring, recurringActuals, oneTime, oneTimeActuals },
      from,
      to,
    );

    const occurrences: IncomeRangeOccurrenceInput[] = [];
    for (const o of raw) {
      const meta =
        o.kind === "recurring"
          ? metaByRecurring.get(o.parentId)
          : metaByOneTime.get(o.parentId);
      if (!meta) continue;
      const hasActual = occurrenceHasActual(o, recurringFilled);
      const actualAmountMinor =
        o.kind === "oneTime" && o.actual != null
          ? o.actual.amountMinor
          : undefined;
      const actualAsOf =
        o.kind === "oneTime" && o.actual != null
          ? o.actual.actualAsOf
          : undefined;
      occurrences.push({
        kind: o.kind,
        parentId: o.parentId,
        personId: meta.personId,
        personName: meta.personName,
        currencyCode: meta.currencyCode,
        currencyScale: meta.currencyScale,
        plannedAsOf: o.plannedAsOf,
        plannedAmountMinor: o.plannedAmountMinor,
        hasActual,
        overdue: isIncomeOverdue(o.plannedAsOf, hasActual, today),
        ...(actualAmountMinor !== undefined ? { actualAmountMinor } : {}),
        ...(actualAsOf !== undefined ? { actualAsOf } : {}),
      });
    }

    return serializeIncomeRangePayload({ today, from, to, occurrences });
  }

  const people: IncomeNextOpenPersonInput[] = peopleRaw
    .map((p) => {
      const recurringRows: IncomeNextOpenRowInput[] = p.recurringIncomes.map(
        (r) => {
          const nextPlannedAsOf = nextOpenPlannedAsOf(
            {
              id: r.id,
              plannedAmountMinor: r.plannedAmountMinor,
              dayOfMonth: r.dayOfMonth,
              startAsOf: r.startAsOf,
            },
            r.actuals,
            today,
          );
          const slotActual = r.actuals.find(
            (a) => a.plannedAsOf === nextPlannedAsOf,
          );
          const hasActual = slotActual != null;
          return {
            id: r.id,
            kind: "recurring" as const,
            currencyCode: r.currencyCode,
            currencyScale: r.currency.scale,
            plannedAmountMinor: r.plannedAmountMinor,
            dayOfMonth: r.dayOfMonth,
            startAsOf: r.startAsOf,
            plannedAsOf: null,
            note: r.note,
            nextPlannedAsOf,
            hasActual,
            overdue: isIncomeOverdue(nextPlannedAsOf, hasActual, today),
            ...(slotActual
              ? {
                  actualId: slotActual.id,
                  actualAmountMinor: slotActual.amountMinor,
                  actualAsOf: slotActual.actualAsOf,
                }
              : {}),
            actualNote: slotActual?.note ?? null,
          };
        },
      );

      const oneTimeRows: IncomeNextOpenRowInput[] = p.oneTimeIncomes.map(
        (o) => {
          const nextPlannedAsOf = o.plannedAsOf;
          const slotActual = o.actuals.find(
            (a) => a.plannedAsOf === o.plannedAsOf,
          );
          const hasActual = slotActual != null;
          return {
            id: o.id,
            kind: "oneTime" as const,
            currencyCode: o.currencyCode,
            currencyScale: o.currency.scale,
            plannedAmountMinor: o.plannedAmountMinor,
            dayOfMonth: null,
            startAsOf: null,
            plannedAsOf: o.plannedAsOf,
            note: o.note,
            nextPlannedAsOf,
            hasActual,
            overdue: isIncomeOverdue(nextPlannedAsOf, hasActual, today),
            ...(slotActual
              ? {
                  actualId: slotActual.id,
                  actualAmountMinor: slotActual.amountMinor,
                  actualAsOf: slotActual.actualAsOf,
                }
              : {}),
            actualNote: slotActual?.note ?? null,
          };
        },
      );

      const incomes = [...recurringRows, ...oneTimeRows].sort((a, b) =>
        a.nextPlannedAsOf < b.nextPlannedAsOf
          ? -1
          : a.nextPlannedAsOf > b.nextPlannedAsOf
            ? 1
            : a.id - b.id,
      );

      return { id: p.id, name: p.name, incomes };
    })
    .filter((p) => p.incomes.length > 0);

  return serializeIncomeNextOpenPayload({ today, people });
}
