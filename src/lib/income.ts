/**
 * Income side-ledger domain (Phase 13).
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

/** Actual row shape for freeze-merge (D-06 / D-07). */
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

function monthKey(iso: string): string {
  return iso.slice(0, 7);
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
 * Month-keyed freeze: actual plannedAsOf in YYYY-MM wins over differing candidate (D-06, D-07, A2).
 */
export function listRecurringOccurrences(
  defs: readonly RecurringIncomeDef[],
  actuals: readonly RecurringIncomeActualSlot[],
  from: string,
  to: string,
): RecurringOccurrence[] {
  const byKey = new Map<string, RecurringOccurrence>();

  const actualsByParentMonth = new Map<string, string>();
  for (const a of actuals) {
    const mk = `${a.recurringIncomeId}:${monthKey(a.plannedAsOf)}`;
    actualsByParentMonth.set(mk, a.plannedAsOf);
  }

  for (const def of defs) {
    for (const { y, m } of monthsOverlapping(from, to)) {
      const ym = `${y}-${String(m).padStart(2, "0")}`;
      const freezeKey = `${def.id}:${ym}`;
      const frozen = actualsByParentMonth.get(freezeKey);
      const candidate = clampDayOfMonth(y, m, def.dayOfMonth);

      let plannedAsOf: string | null = null;
      if (frozen !== undefined) {
        if (frozen >= from && frozen <= to) {
          plannedAsOf = frozen;
        }
      } else if (candidate >= def.startAsOf && candidate >= from && candidate <= to) {
        plannedAsOf = candidate;
      }

      if (plannedAsOf === null) continue;
      const key = occurrenceKeyString({
        parentId: def.id,
        plannedAsOf,
      });
      if (!byKey.has(key)) {
        byKey.set(key, {
          parentId: def.id,
          plannedAsOf,
          plannedAmountMinor: def.plannedAmountMinor,
        });
      }
    }

    // Orphaned actuals in range (same parent) not covered by month walk edge cases
    for (const a of actuals) {
      if (a.recurringIncomeId !== def.id) continue;
      if (a.plannedAsOf < from || a.plannedAsOf > to) continue;
      const key = occurrenceKeyString({
        parentId: def.id,
        plannedAsOf: a.plannedAsOf,
      });
      if (!byKey.has(key)) {
        byKey.set(key, {
          parentId: def.id,
          plannedAsOf: a.plannedAsOf,
          plannedAmountMinor: def.plannedAmountMinor,
        });
      }
    }
  }

  return [...byKey.values()].sort((a, b) =>
    a.plannedAsOf < b.plannedAsOf
      ? -1
      : a.plannedAsOf > b.plannedAsOf
        ? 1
        : a.parentId - b.parentId,
  );
}
