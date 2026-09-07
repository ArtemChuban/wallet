/**
 * Income side-ledger domain (Phase 13+).
 * Pure TypeScript — no Prisma, no net-worth / historical-series / debts imports (ISO-01).
 */

import { addCalendarDays, clampDayOfMonth } from "@/lib/dates";
import { locfRateAsOf, type RateRow } from "@/lib/locf";
import { convertOtherMinorToPrimaryMinor } from "@/lib/money";

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

export type OneTimeIncomeDef = {
  id: number;
  plannedAmountMinor: bigint;
  plannedAsOf: string;
};

export type OneTimeIncomeActualSlot = {
  oneTimeIncomeId: number;
  plannedAsOf: string;
  amountMinor: bigint;
  actualAsOf: string;
};

export type OneTimeOccurrence = {
  parentId: number;
  plannedAsOf: string;
  plannedAmountMinor: bigint;
  /** Joined actual when key matches; plan fields stay immutable (D-08 readiness). */
  actual?: {
    amountMinor: bigint;
    actualAsOf: string;
  };
};

export type IncomeOccurrence =
  | (RecurringOccurrence & { kind: "recurring" })
  | (OneTimeOccurrence & { kind: "oneTime" });

export type ListAllInRangeInput = {
  recurring: readonly RecurringIncomeDef[];
  recurringActuals: readonly RecurringIncomeActualSlot[];
  oneTime: readonly OneTimeIncomeDef[];
  oneTimeActuals: readonly OneTimeIncomeActualSlot[];
};

export function occurrenceKeyString(k: IncomeOccurrenceKey): string {
  return `${k.parentId}:${k.plannedAsOf}`;
}

/**
 * Overdue when plan date is before injected today and no actual exists (FND-OVER / D-08).
 * Callers pass today — never reads the clock (D-13).
 */
export function isIncomeOverdue(
  plannedAsOf: string,
  hasActual: boolean,
  today: string,
): boolean {
  return plannedAsOf < today && !hasActual;
}

/**
 * Plan vs actual delta in source-currency minor units (ACT-03 / D-13 / D-14).
 * Formula: actual − plan. No FX conversion.
 */
export function incomeVarianceMinor(
  actualAmountMinor: bigint,
  plannedAmountMinor: bigint,
): bigint {
  return actualAmountMinor - plannedAmountMinor;
}

/**
 * RU variance phrase for UI chrome (D-14 / UI-SPEC).
 * positive → больше плана; negative → меньше плана; zero → как план.
 */
export function incomeVariancePhrase(deltaMinor: bigint): string {
  if (deltaMinor > 0n) return "больше плана";
  if (deltaMinor < 0n) return "меньше плана";
  return "как план";
}

export type OneTimePlanFields = {
  plannedAsOf: string;
  plannedAmountMinor: bigint;
};

/**
 * After an actual exists, one-time plan date/amount are immutable (D-08).
 * Actual amount/date/note changes are out of scope for this predicate.
 */
export function assertOneTimePlanImmutable(
  hasActual: boolean,
  stored: OneTimePlanFields,
  proposed: OneTimePlanFields,
): void {
  if (!hasActual) return;
  if (
    proposed.plannedAsOf !== stored.plannedAsOf ||
    proposed.plannedAmountMinor !== stored.plannedAmountMinor
  ) {
    throw new Error(
      "one-time plan fields are immutable after an actual exists",
    );
  }
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

/**
 * Earliest unfilled recurring plan slot for list sort/display (D-02, D-09, D-10).
 * Horizon: addCalendarDays(max(todayAsOf, startAsOf), 400). Past unfilled slots count.
 * If every slot in the window is filled, returns startAsOf as sort fallback (A3).
 */
export function nextOpenPlannedAsOf(
  def: RecurringIncomeDef,
  actuals: readonly RecurringIncomeActualSlot[],
  todayAsOf: string,
): string {
  const from = def.startAsOf;
  const horizonBase = todayAsOf > def.startAsOf ? todayAsOf : def.startAsOf;
  const to = addCalendarDays(horizonBase, 400);
  const filled = new Set(
    actuals
      .filter((a) => a.recurringIncomeId === def.id)
      .map((a) =>
        occurrenceKeyString({
          parentId: a.recurringIncomeId,
          plannedAsOf: a.plannedAsOf,
        }),
      ),
  );
  const slots = listRecurringOccurrences([def], actuals, from, to);
  for (const slot of slots) {
    const key = occurrenceKeyString({
      parentId: slot.parentId,
      plannedAsOf: slot.plannedAsOf,
    });
    if (!filled.has(key)) {
      return slot.plannedAsOf;
    }
  }
  return def.startAsOf;
}

/**
 * One-time plan slot when definition plannedAsOf ∈ inclusive [from, to] (D-14, D-15).
 * Optional actual joined by (parentId, plannedAsOf); plan fields unchanged (D-08 readiness).
 */
export function listOneTimeOccurrences(
  defs: readonly OneTimeIncomeDef[],
  actuals: readonly OneTimeIncomeActualSlot[],
  from: string,
  to: string,
): OneTimeOccurrence[] {
  const actualByKey = new Map<string, OneTimeIncomeActualSlot>();
  for (const a of actuals) {
    actualByKey.set(
      occurrenceKeyString({
        parentId: a.oneTimeIncomeId,
        plannedAsOf: a.plannedAsOf,
      }),
      a,
    );
  }

  const out: OneTimeOccurrence[] = [];
  for (const def of defs) {
    if (def.plannedAsOf < from || def.plannedAsOf > to) continue;
    const key = occurrenceKeyString({
      parentId: def.id,
      plannedAsOf: def.plannedAsOf,
    });
    const matched = actualByKey.get(key);
    const row: OneTimeOccurrence = {
      parentId: def.id,
      plannedAsOf: def.plannedAsOf,
      plannedAmountMinor: def.plannedAmountMinor,
    };
    if (matched) {
      row.actual = {
        amountMinor: matched.amountMinor,
        actualAsOf: matched.actualAsOf,
      };
    }
    out.push(row);
  }
  return out;
}

/**
 * Thin merge of recurring + one-time for the same explicit window (D-13, D-14).
 * Callers always pass from/to — no default horizon.
 */
export function listAllInRange(
  input: ListAllInRangeInput,
  from: string,
  to: string,
): IncomeOccurrence[] {
  const recurring = listRecurringOccurrences(
    input.recurring,
    input.recurringActuals,
    from,
    to,
  ).map((o) => ({ ...o, kind: "recurring" as const }));
  const oneTime = listOneTimeOccurrences(
    input.oneTime,
    input.oneTimeActuals,
    from,
    to,
  ).map((o) => ({ ...o, kind: "oneTime" as const }));
  return [...recurring, ...oneTime].sort((a, b) =>
    a.plannedAsOf < b.plannedAsOf
      ? -1
      : a.plannedAsOf > b.plannedAsOf
        ? 1
        : a.parentId - b.parentId,
  );
}

/** One recorded income actual for counterparty Σ (CPTY-01 / D-01 / D-14). */
export type IncomeActualFactInput = {
  personId: number;
  currencyCode: string;
  currencyScale: number;
  isPrimaryCurrency: boolean;
  amountMinor: bigint;
  /** YYYY-MM-DD — FX as-of + membership (D-05, D-14). */
  actualAsOf: string;
};

export type PersonIncomeStats = {
  personId: number;
  nativeByCurrency: {
    currencyCode: string;
    scale: number;
    totalMinor: bigint;
  }[];
  primaryTotalMinor: bigint;
  isPartial: boolean;
  /** Facts excluded from primary only; native still counted (D-08). */
  excludedFactCount: number;
};

/**
 * Per-Person dual native+primary Σ over all actual facts (D-01..D-08, D-13).
 * LOCF per fact `actualAsOf` — never today-first map. Null rate → exclude primary only.
 */
export function computePersonIncomeStats(
  facts: readonly IncomeActualFactInput[],
  rates: readonly RateRow[],
  primaryScale: number,
): Map<number, PersonIncomeStats> {
  type Acc = {
    native: Map<string, { scale: number; totalMinor: bigint }>;
    primaryTotalMinor: bigint;
    isPartial: boolean;
    excludedFactCount: number;
  };

  const byPerson = new Map<number, Acc>();

  for (const fact of facts) {
    let acc = byPerson.get(fact.personId);
    if (!acc) {
      acc = {
        native: new Map(),
        primaryTotalMinor: 0n,
        isPartial: false,
        excludedFactCount: 0,
      };
      byPerson.set(fact.personId, acc);
    }

    const bucket = acc.native.get(fact.currencyCode);
    if (bucket) {
      bucket.totalMinor += fact.amountMinor;
    } else {
      acc.native.set(fact.currencyCode, {
        scale: fact.currencyScale,
        totalMinor: fact.amountMinor,
      });
    }

    if (fact.isPrimaryCurrency) {
      acc.primaryTotalMinor += fact.amountMinor;
      continue;
    }

    const rate = locfRateAsOf(rates, fact.currencyCode, fact.actualAsOf);
    if (rate === null) {
      acc.isPartial = true;
      acc.excludedFactCount += 1;
      continue;
    }

    acc.primaryTotalMinor += convertOtherMinorToPrimaryMinor(
      fact.amountMinor,
      rate,
      fact.currencyScale,
      primaryScale,
    );
  }

  const out = new Map<number, PersonIncomeStats>();
  for (const [personId, acc] of byPerson) {
    const nativeByCurrency = [...acc.native.entries()]
      .map(([currencyCode, v]) => ({
        currencyCode,
        scale: v.scale,
        totalMinor: v.totalMinor,
      }))
      .sort((a, b) =>
        a.currencyCode < b.currencyCode
          ? -1
          : a.currencyCode > b.currencyCode
            ? 1
            : 0,
      );
    out.set(personId, {
      personId,
      nativeByCurrency,
      primaryTotalMinor: acc.primaryTotalMinor,
      isPartial: acc.isPartial,
      excludedFactCount: acc.excludedFactCount,
    });
  }
  return out;
}
