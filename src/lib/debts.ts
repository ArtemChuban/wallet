import { convertOtherMinorToPrimaryMinor } from "@/lib/money";

/** Debt status mirrored from Prisma DebtStatus enum (pure helpers — no Prisma). */
export type DebtStatus = "OPEN" | "CLOSED";

/**
 * Current principal = create-time initial + Σ signed size deltas (D-04).
 * Order-independent sum — Phase 8 remaining does not cross-sort event ids (D-10 deferred).
 */
export function currentPrincipalMinor(
  initialAmountMinor: bigint,
  sizeDeltas: readonly bigint[],
): bigint {
  return sizeDeltas.reduce((sum, d) => sum + d, initialAmountMinor);
}

/**
 * Remaining = currentPrincipal − Σ repayment amounts (CONTEXT D-04 / DEBT-02 override).
 * No writeOff term — size-change downs replace forgive-amount.
 */
export function remainingMinor(
  initialAmountMinor: bigint,
  sizeDeltas: readonly bigint[],
  repaymentAmounts: readonly bigint[],
): bigint {
  const principal = currentPrincipalMinor(initialAmountMinor, sizeDeltas);
  const paid = repaymentAmounts.reduce((sum, a) => sum + a, 0n);
  return principal - paid;
}

/**
 * Status synced from remaining (D-11–D-13): CLOSED iff remaining === 0n, else OPEN.
 * Negative remaining is a hard invariant violation (D-15) — callers assert before apply.
 */
export function statusForRemaining(remaining: bigint): DebtStatus {
  if (remaining < 0n) {
    throw new Error("remaining must never be < 0");
  }
  return remaining === 0n ? "CLOSED" : "OPEN";
}

/** Hard invariant: stored status must match statusForRemaining(remaining) (D-13). */
export function assertStatusSynced(
  status: DebtStatus,
  remaining: bigint,
): void {
  const expected = statusForRemaining(remaining);
  if (status !== expected) {
    throw new Error(`status desync: have ${status}, want ${expected}`);
  }
}

/**
 * Reject over-repayment and non-positive amounts (D-15, A2).
 * remainingBefore comes from current ledger state before applying the event.
 */
export function assertRepaymentAmount(
  amountMinor: bigint,
  remainingBefore: bigint,
): void {
  if (amountMinor <= 0n) {
    throw new Error("repayment amount must be > 0");
  }
  if (amountMinor > remainingBefore) {
    throw new Error("repayment exceeds remaining");
  }
}

/**
 * Reject zero delta and downs that would make remaining < 0 (D-05, D-15).
 * nextPrincipal = currentPrincipal + delta must be >= sumRepayments.
 */
export function assertSizeDelta(
  deltaMinor: bigint,
  currentPrincipal: bigint,
  sumRepayments: bigint,
): void {
  if (deltaMinor === 0n) {
    throw new Error("size delta must not be 0");
  }
  const nextPrincipal = currentPrincipal + deltaMinor;
  if (nextPrincipal < sumRepayments) {
    throw new Error("size change would make remaining < 0");
  }
}

/**
 * Reject mutation of create-time principal (DEBT-03 / D-03).
 * Size-change events are the only adjustment path after create.
 */
export function assertInitialImmutable(
  storedInitialMinor: bigint,
  proposedInitialMinor: bigint,
): void {
  if (proposedInitialMinor !== storedInitialMinor) {
    throw new Error("initialAmountMinor is immutable after create");
  }
}

/** Debt direction mirrored from Prisma DebtDirection enum. */
export type DebtDirection = "I_OWE" | "THEY_OWE";

/**
 * OPEN debt + caller-resolved LOCF rate (A6 / D-18 adaptation).
 * asOfDate stays at the call site — helper takes rateToPrimaryScaled only.
 */
export type DebtPrimaryTotalsInput = {
  id: number;
  direction: DebtDirection;
  status: DebtStatus;
  remainingMinor: bigint;
  currencyScale: number;
  isPrimaryCurrency: boolean;
  /** Null = missing FX for non-primary; ignored when isPrimaryCurrency. */
  rateToPrimaryScaled: bigint | null;
  primaryScale: number;
};

export type DebtExcludeReason = "none" | "no_fx";

export type DebtPrimaryTotalsRow = {
  debtId: number;
  direction: DebtDirection;
  includedInTotal: boolean;
  excludeReason: DebtExcludeReason;
  /** Primary-minor contribution to the matching side aggregate (0n if excluded). */
  contributionPrimaryMinor: bigint;
  remainingNativeMinor: bigint;
};

function toPrimaryMinor(
  debt: DebtPrimaryTotalsInput,
  nativeMinor: bigint,
): bigint | null {
  if (debt.isPrimaryCurrency) {
    return nativeMinor;
  }
  if (debt.rateToPrimaryScaled === null) {
    return null;
  }
  return convertOtherMinorToPrimaryMinor(
    nativeMinor,
    debt.rateToPrimaryScaled,
    debt.currencyScale,
    debt.primaryScale,
  );
}

function rowForOpen(debt: DebtPrimaryTotalsInput): DebtPrimaryTotalsRow {
  const primary = toPrimaryMinor(debt, debt.remainingMinor);
  if (primary === null) {
    return {
      debtId: debt.id,
      direction: debt.direction,
      includedInTotal: false,
      excludeReason: "no_fx",
      contributionPrimaryMinor: 0n,
      remainingNativeMinor: debt.remainingMinor,
    };
  }
  return {
    debtId: debt.id,
    direction: debt.direction,
    includedInTotal: true,
    excludeReason: "none",
    contributionPrimaryMinor: primary,
    remainingNativeMinor: debt.remainingMinor,
  };
}

/**
 * OPEN-only primary totals with NW-style FX honesty (D-16–D-19).
 * CLOSED omitted from rows and aggregates. Missing non-primary FX → exclude + isPartial.
 */
export function computeDebtPrimaryTotals(
  debts: readonly DebtPrimaryTotalsInput[],
): {
  rows: DebtPrimaryTotalsRow[];
  iOwePrimaryMinor: bigint;
  theyOwePrimaryMinor: bigint;
  isPartial: boolean;
} {
  const open = debts.filter((d) => d.status === "OPEN");
  const rows = open.map((d) => rowForOpen(d));
  let iOwePrimaryMinor = 0n;
  let theyOwePrimaryMinor = 0n;
  for (const row of rows) {
    if (!row.includedInTotal) continue;
    if (row.direction === "I_OWE") {
      iOwePrimaryMinor += row.contributionPrimaryMinor;
    } else {
      theyOwePrimaryMinor += row.contributionPrimaryMinor;
    }
  }
  const isPartial = rows.some((row) => !row.includedInTotal);
  return { rows, iOwePrimaryMinor, theyOwePrimaryMinor, isPartial };
}
