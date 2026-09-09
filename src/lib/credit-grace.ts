/**
 * Credit grace schedule domain (Phase 19+).
 * Pure TypeScript — no Prisma, no net-worth / historical-series imports (CYCLE-01 isolation).
 */

import { clampDayOfMonth } from "@/lib/dates";

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
