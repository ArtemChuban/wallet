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
