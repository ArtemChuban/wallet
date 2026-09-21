/**
 * Pure monthly SAVINGS interest (Phase 28 / INT-01).
 * No database client, no forecast series builder, no historical NW, no FX module, no income, no grace.
 */

import { addCalendarDays } from "@/lib/dates";
import { nextAccrualAsOf } from "@/lib/savings-accrual-display";

/** One month: (balanceMinor × annualRateBps) / (12 × 10000), truncate toward 0 (D-08). */
export function monthlyInterestMinor(
  balanceMinor: bigint,
  annualRateBps: number,
): bigint {
  if (annualRateBps <= 0 || balanceMinor <= 0n) return 0n;
  return (balanceMinor * BigInt(annualRateBps)) / (12n * 10000n);
}

export type InterestAccountInput = {
  accountId: number;
  accountName?: string;
  /** This account's today LOCF minor only (D-02, D-03). */
  balanceMinor: bigint;
  annualRateBps: number;
  accrualDayOfMonth: number;
  currencyCode: string;
  currencyScale: number;
  isPrimaryCurrency: boolean;
};

export type InterestForecastSlot = {
  plannedAsOf: string;
  interestMinor: bigint;
  parentId: number;
  accountId: number;
  accountName?: string;
  currencyCode: string;
  currencyScale: number;
  isPrimaryCurrency: boolean;
};

/**
 * Future monthly credits on each account's accrual day.
 * Principal starts at today LOCF and grows only by that account's truncated credit (D-02, D-04, D-09).
 */
export function listInterestSlotsInRange(
  accounts: readonly InterestAccountInput[],
  today: string,
  horizonEnd: string,
): InterestForecastSlot[] {
  const slots: InterestForecastSlot[] = [];

  for (const account of accounts) {
    let principal = account.balanceMinor;
    let cursor = addCalendarDays(today, 1);

    while (cursor <= horizonEnd) {
      const accrual = nextAccrualAsOf(cursor, account.accrualDayOfMonth);
      if (accrual > horizonEnd) break;

      const interestMinor = monthlyInterestMinor(principal, account.annualRateBps);
      if (interestMinor > 0n) {
        slots.push({
          plannedAsOf: accrual,
          interestMinor,
          parentId: account.accountId,
          accountId: account.accountId,
          ...(account.accountName !== undefined
            ? { accountName: account.accountName }
            : {}),
          currencyCode: account.currencyCode,
          currencyScale: account.currencyScale,
          isPrimaryCurrency: account.isPrimaryCurrency,
        });
        principal += interestMinor;
      }

      cursor = addCalendarDays(accrual, 1);
    }
  }

  return slots.sort((a, b) =>
    a.plannedAsOf < b.plannedAsOf
      ? -1
      : a.plannedAsOf > b.plannedAsOf
        ? 1
        : a.accountId - b.accountId,
  );
}
