/**
 * Income side-ledger domain (Phase 13 tracer).
 * Pure TypeScript — no Prisma, no net-worth / historical-series imports (ISO-01).
 */

import { clampDayOfMonth } from "@/lib/dates";

export type IncomeOccurrenceKey = {
  parentId: number;
  plannedAsOf: string;
};

export type RecurringIncomeDef = {
  id: number;
  plannedAmountMinor: bigint;
  dayOfMonth: number;
  startAsOf: string;
};

/** Actual row shape for later freeze-merge (Plan 02); tracer may pass empty. */
export type RecurringIncomeActualSlot = {
  recurringIncomeId: number;
  plannedAsOf: string;
};

export type RecurringOccurrence = {
  parentId: number;
  plannedAsOf: string;
  plannedAmountMinor: bigint;
};

export function occurrenceKeyString(k: IncomeOccurrenceKey): string {
  return `${k.parentId}:${k.plannedAsOf}`;
}

function* monthsOverlapping(
  from: string,
  to: string,
): Generator<{ y: number; m: number }> {
  let [y, m] = from.split("-").map(Number) as [number, number];
  const [ty, tm] = to.split("-").map(Number) as [number, number];
  while (y < ty || (y === ty && m <= tm)) {
    yield { y, m };
    m += 1;
    if (m === 13) {
      m = 1;
      y += 1;
    }
  }
}

/**
 * Virtual recurring plan slots in inclusive [from, to] (D-13, D-15).
 * Tracer path: empty/ignored actuals; current DOM clamped per month (D-16).
 * Freeze-merge lands in Plan 02.
 */
export function listRecurringOccurrences(
  defs: readonly RecurringIncomeDef[],
  _actuals: readonly RecurringIncomeActualSlot[],
  from: string,
  to: string,
): RecurringOccurrence[] {
  const out: RecurringOccurrence[] = [];
  for (const def of defs) {
    for (const { y, m } of monthsOverlapping(from, to)) {
      const candidate = clampDayOfMonth(y, m, def.dayOfMonth);
      if (candidate < def.startAsOf) continue;
      if (candidate < from || candidate > to) continue;
      out.push({
        parentId: def.id,
        plannedAsOf: candidate,
        plannedAmountMinor: def.plannedAmountMinor,
      });
    }
  }
  return out;
}
