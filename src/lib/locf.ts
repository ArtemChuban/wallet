/**
 * Shared LOCF (last observation carried forward) helpers.
 * Semantics: latest row with asOfDate <= D; null before first row (D-03).
 */

/**
 * Pure pick: latest matching row with asOfOf(row) <= asOfDate, or null.
 */
export function pickLatestAsOf<T>(
  rows: readonly T[],
  matchesKey: (row: T) => boolean,
  asOfOf: (row: T) => string,
  asOfDate: string,
): T | null {
  let best: T | null = null;
  for (const row of rows) {
    if (!matchesKey(row)) continue;
    if (asOfOf(row) > asOfDate) continue;
    if (!best || asOfOf(row) > asOfOf(best)) {
      best = row;
    }
  }
  return best;
}

/**
 * Batch Map: first hit per key wins.
 * Precondition: rows already filtered asOfDate <= D and sorted asOfDate desc.
 */
export function firstHitLocfMap<K, T>(
  rows: readonly T[],
  keyOf: (row: T) => K,
): Map<K, T> {
  const map = new Map<K, T>();
  for (const row of rows) {
    const key = keyOf(row);
    if (!map.has(key)) {
      map.set(key, row);
    }
  }
  return map;
}

type AmountRow = {
  accountId: number;
  asOfDate: string;
  amountMinor: bigint;
};

export type RateRow = {
  currencyCode: string;
  asOfDate: string;
  rateToPrimaryScaled: bigint;
};

/** Typed wrapper: amountMinor of latest snapshot for accountId as of D, or null. */
export function locfAmountAsOf(
  snapshots: readonly AmountRow[],
  accountId: number,
  asOfDate: string,
): bigint | null {
  const best = pickLatestAsOf(
    snapshots,
    (s) => s.accountId === accountId,
    (s) => s.asOfDate,
    asOfDate,
  );
  return best?.amountMinor ?? null;
}

/** Typed wrapper: rateToPrimaryScaled of latest FX row for currency as of D, or null. */
export function locfRateAsOf(
  rates: readonly RateRow[],
  currencyCode: string,
  asOfDate: string,
): bigint | null {
  const best = pickLatestAsOf(
    rates,
    (r) => r.currencyCode === currencyCode,
    (r) => r.asOfDate,
    asOfDate,
  );
  return best?.rateToPrimaryScaled ?? null;
}
