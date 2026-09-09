/**
 * Credit grace schedule domain (Phase 19+).
 * Pure TypeScript — no Prisma, no net-worth / historical-series imports (CYCLE-01 isolation).
 * Helpers emit candidates only — never write obligation rows (D-12).
 */

import { clampDayOfMonth } from "@/lib/dates";

/** Both DOM set — null means no schedule (D-13). */
export type CreditGraceSchedule = {
  statementDayOfMonth: number;
  dueDayOfMonth: number;
};

export type CycleWindow = {
  cycleStartAsOf: string;
  dueAsOf: string;
};

export type CurrentAndNext = {
  current: CycleWindow | null;
  next: CycleWindow | null;
};

/**
 * Statement date for calendar month M: clamp statement DOM onto that month (D-09).
 */
export function cycleStartAsOf(
  year: number,
  month1to12: number,
  statementDayOfMonth: number,
): string {
  return clampDayOfMonth(year, month1to12, statementDayOfMonth);
}

/**
 * Due date for a cycle: next calendar month + due DOM, clamped (D-10).
 * Not sole addCalendarDays — bank 21→15 is next-month DOM, not fixed duration.
 */
export function dueAsOfForCycle(
  cycleStart: string,
  dueDayOfMonth: number,
): string {
  const [y, m] = cycleStart.split("-").map(Number) as [number, number];
  let ny = y;
  let nm = m + 1;
  if (nm === 13) {
    nm = 1;
    ny += 1;
  }
  return clampDayOfMonth(ny, nm, dueDayOfMonth);
}

/** Inclusive month walk like income.monthsOverlapping — local copy (no income import). */
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

function shiftMonth(
  year: number,
  month1to12: number,
  delta: number,
): { y: number; m: number } {
  let y = year;
  let m = month1to12 + delta;
  while (m < 1) {
    m += 12;
    y -= 1;
  }
  while (m > 12) {
    m -= 12;
    y += 1;
  }
  return { y, m };
}

function ymd(y: number, m: number, day: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Candidate cycle windows whose cycleStartAsOf ∈ inclusive [from, to] (D-11).
 * Membership is cycleStartAsOf (not due-only overlap). Sorted ascending.
 * Null schedule → [] (D-13). No Prisma / no auto-create (D-12).
 */
export function listCycleWindows(
  schedule: CreditGraceSchedule | null,
  from: string,
  to: string,
): CycleWindow[] {
  if (schedule === null) return [];

  const out: CycleWindow[] = [];
  for (const { y, m } of monthsOverlapping(from, to)) {
    const start = cycleStartAsOf(y, m, schedule.statementDayOfMonth);
    if (start < from || start > to) continue;
    out.push({
      cycleStartAsOf: start,
      dueAsOf: dueAsOfForCycle(start, schedule.dueDayOfMonth),
    });
  }

  out.sort((a, b) =>
    a.cycleStartAsOf < b.cycleStartAsOf
      ? -1
      : a.cycleStartAsOf > b.cycleStartAsOf
        ? 1
        : 0,
  );
  return out;
}

/**
 * Deterministic current/next candidates for injected today (Pattern 3).
 * Gap after due before next statement → current null, next = upcoming cycle.
 * Null schedule → empty (D-13).
 */
export function resolveCurrentAndNext(
  schedule: CreditGraceSchedule | null,
  today: string,
): CurrentAndNext {
  if (schedule === null) return { current: null, next: null };

  const [ty, tm] = today.split("-").map(Number) as [number, number];
  const fromM = shiftMonth(ty, tm, -2);
  const toM = shiftMonth(ty, tm, 3);
  const from = ymd(fromM.y, fromM.m, 1);
  const to = ymd(toM.y, toM.m, 28);

  const windows = listCycleWindows(schedule, from, to);

  let current: CycleWindow | null = null;
  for (const w of windows) {
    if (w.cycleStartAsOf <= today && today <= w.dueAsOf) {
      current = w;
      break;
    }
  }

  if (current) {
    const idx = windows.findIndex(
      (w) => w.cycleStartAsOf === current!.cycleStartAsOf,
    );
    return { current, next: windows[idx + 1] ?? null };
  }

  const next = windows.find((w) => w.cycleStartAsOf > today) ?? null;
  return { current: null, next };
}

/**
 * Calendar overdue vs injected today (D-07 / Phase 18 D-04).
 * Inclusive due day is not overdue — dueAsOf < today via YYYY-MM-DD compare.
 * Does not read the clock; overdue is not a persisted status enum.
 */
export function isGraceOverdue(dueAsOf: string, today: string): boolean {
  return dueAsOf < today;
}

/** Persisted obligation shape for hybrid list merge (serialized minors OK). */
export type GraceObligationListItem = {
  id: number;
  cycleStartAsOf: string;
  dueAsOf: string;
  amountMinor: string;
  status: "OPEN" | "CLOSED";
  note: string | null;
};

export type GraceListRow =
  | {
      kind: "open";
      obligation: {
        id: number;
        cycleStartAsOf: string;
        dueAsOf: string;
        amountMinor: string;
        note: string | null;
      };
    }
  | { kind: "cta"; cycleStartAsOf: string; dueAsOf: string };

/** D-08: overdue OPEN first, then nearest dueAsOf, then cycleStartAsOf. */
function compareOpenByDue(
  a: { dueAsOf: string; cycleStartAsOf: string },
  b: { dueAsOf: string; cycleStartAsOf: string },
  today: string,
): number {
  const ao = isGraceOverdue(a.dueAsOf, today) ? 0 : 1;
  const bo = isGraceOverdue(b.dueAsOf, today) ? 0 : 1;
  if (ao !== bo) return ao - bo;
  if (a.dueAsOf !== b.dueAsOf) {
    return a.dueAsOf < b.dueAsOf ? -1 : 1;
  }
  return a.cycleStartAsOf < b.cycleStartAsOf ? -1 : 1;
}

/**
 * Merge resolveCurrentAndNext candidates with persisted rows (D-05).
 * Missing candidate window → CTA only — never invents DB placeholders.
 * All OPEN sorted per D-08 (overdue first); gap-day orphans retained (Pitfall 7).
 * CLOSED omitted here (collapsed history is Plan 02).
 */
export function mergeGraceListRows(
  schedule: CreditGraceSchedule | null,
  today: string,
  obligations: GraceObligationListItem[],
): GraceListRow[] {
  const { current, next } = resolveCurrentAndNext(schedule, today);
  const byStart = new Map(
    obligations.map((o) => [o.cycleStartAsOf, o] as const),
  );

  const openRows: Extract<GraceListRow, { kind: "open" }>[] = [];
  for (const o of obligations) {
    if (o.status !== "OPEN") continue;
    openRows.push({
      kind: "open",
      obligation: {
        id: o.id,
        cycleStartAsOf: o.cycleStartAsOf,
        dueAsOf: o.dueAsOf,
        amountMinor: o.amountMinor,
        note: o.note,
      },
    });
  }
  openRows.sort((a, b) =>
    compareOpenByDue(a.obligation, b.obligation, today),
  );

  const openStarts = new Set(openRows.map((r) => r.obligation.cycleStartAsOf));
  const ctaRows: Extract<GraceListRow, { kind: "cta" }>[] = [];
  for (const w of [current, next]) {
    if (!w) continue;
    if (openStarts.has(w.cycleStartAsOf)) continue;
    const existing = byStart.get(w.cycleStartAsOf);
    // CLOSED (or other non-OPEN) at candidate start → no CTA invent
    if (existing) continue;
    ctaRows.push({
      kind: "cta",
      cycleStartAsOf: w.cycleStartAsOf,
      dueAsOf: w.dueAsOf,
    });
  }

  return [...openRows, ...ctaRows];
}

/** Input row for Капитал forecast membership (OPEN filter + today-fold). */
export type GraceForecastObligationInput = {
  id: number;
  dueAsOf: string;
  amountMinor: bigint;
  status: "OPEN" | "CLOSED";
  accountId: number;
  accountName: string;
  currencyCode: string;
  currencyScale: number;
  isPrimaryCurrency: boolean;
};

/** Lean membership DTO — shell maps to ForecastSlot kind grace (no nw-forecast import). */
export type GraceForecastMembership = {
  obligationId: number;
  dueAsOf: string;
  sampleAsOf: string;
  amountMinor: bigint;
  accountId: number;
  accountName: string;
  currencyCode: string;
  currencyScale: number;
  isPrimaryCurrency: boolean;
};

/**
 * OPEN obligations in overlay window with overdue folded onto today (D-01…D-04, C-07).
 * Pure YYYY-MM-DD compare — no Date clock. Does not import nw-forecast.
 */
export function openGraceForecastMembership(
  obligations: readonly GraceForecastObligationInput[],
  today: string,
  horizonEnd: string,
): GraceForecastMembership[] {
  const out: GraceForecastMembership[] = [];
  for (const o of obligations) {
    if (o.status !== "OPEN") continue;

    let sampleAsOf: string;
    if (o.dueAsOf < today) {
      sampleAsOf = today;
    } else if (o.dueAsOf === today) {
      sampleAsOf = today;
    } else if (o.dueAsOf <= horizonEnd) {
      sampleAsOf = o.dueAsOf;
    } else {
      continue;
    }

    out.push({
      obligationId: o.id,
      dueAsOf: o.dueAsOf,
      sampleAsOf,
      amountMinor: o.amountMinor,
      accountId: o.accountId,
      accountName: o.accountName,
      currencyCode: o.currencyCode,
      currencyScale: o.currencyScale,
      isPrimaryCurrency: o.isPrimaryCurrency,
    });
  }
  return out;
}
