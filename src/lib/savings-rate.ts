import { formatMinorToMajor, parseMajorToMinor } from "@/lib/money";

/** Prisma Int max — annualRateBps column bound (D-03). */
const PRISMA_INT_MAX = 2147483647;

/**
 * Parse UI percent major (up to 2 frac digits) → annualRateBps Int.
 * "16.50" → 1650; "0" → 0. Rejects negatives and Int overflow (D-01…D-03).
 */
export function parsePercentToBps(major: string): number {
  const minor = parseMajorToMinor(major, 2);
  if (minor < 0n) {
    throw new Error("negative rate");
  }
  const n = Number(minor);
  if (!Number.isSafeInteger(n) || n > PRISMA_INT_MAX) {
    throw new Error("rate too large");
  }
  return n;
}

/** Display bps as percent major at scale 2 (D-01). */
export function formatBpsToPercentMajor(bps: number): string {
  return formatMinorToMajor(BigInt(bps), 2);
}
