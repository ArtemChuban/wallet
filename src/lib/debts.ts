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
