/**
 * Display-only next accrual — no Prisma, no interest amount math (Phase 28 / D-16).
 */

import { addCalendarDays, clampDayOfMonth } from "@/lib/dates";

/** Next accrual calendar day (YYYY-MM-DD) using clampDayOfMonth (D-05). */
export function nextAccrualAsOf(today: string, dayOfMonth: number): string {
  const [ys, ms] = today.split("-");
  const y = Number(ys);
  const m = Number(ms);
  const thisMonth = clampDayOfMonth(y, m, dayOfMonth);
  if (thisMonth >= today) return thisMonth;
  const next = addCalendarDays(`${y}-${String(m).padStart(2, "0")}-01`, 32);
  const [ny, nm] = next.split("-");
  return clampDayOfMonth(Number(ny), Number(nm), dayOfMonth);
}

/** Whole calendar days from `from` to `to` (UTC date math). */
function calendarDaysBetween(from: string, to: string): number {
  const [y1, m1, d1] = from.split("-").map(Number);
  const [y2, m2, d2] = to.split("-").map(Number);
  const t1 = Date.UTC(y1!, m1! - 1, d1!);
  const t2 = Date.UTC(y2!, m2! - 1, d2!);
  return Math.round((t2 - t1) / 86_400_000);
}

/**
 * RU countdown chrome for list secondary (D-12).
 * «сегодня» when next === today; else «через N дн.» for N ≥ 1.
 */
export function formatAccrualCountdown(
  today: string,
  nextAsOf: string,
): string {
  if (nextAsOf === today) return "сегодня";
  const n = calendarDaysBetween(today, nextAsOf);
  return `через ${n} дн.`;
}
