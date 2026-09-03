/** FX rate fixed scale: store rate × 10^8 as BigInt (D-09). */
export const RATE_SCALE_E8 = 100000000n;

const MAJOR_PATTERN = /^([+-]?)(\d+)(?:\.(\d+))?$/;

function assertScale(scale: number): void {
  if (!Number.isInteger(scale) || scale < 0 || scale > 18) {
    throw new Error("scale must be an integer from 0 to 18");
  }
}

/**
 * Parse major-unit decimal string → minor BigInt using currency scale (0–18).
 * BigInt only — no Number/parseFloat; rejects scientific notation.
 */
export function parseMajorToMinor(major: string, scale: number): bigint {
  assertScale(scale);
  const trimmed = major.trim();
  if (!trimmed || /[eE]/.test(trimmed)) {
    throw new Error("invalid major amount");
  }
  const match = MAJOR_PATTERN.exec(trimmed);
  if (!match) {
    throw new Error("invalid major amount");
  }
  const sign = match[1] === "-" ? -1n : 1n;
  const intPart = match[2]!;
  let frac = match[3] ?? "";
  if (frac.length > scale) {
    throw new Error("too many fractional digits");
  }
  frac = frac.padEnd(scale, "0");
  const digits = `${intPart}${frac}`.replace(/^0+(?=\d)/, "") || "0";
  return sign * BigInt(digits);
}

/** Parse major-unit rate string → scaled BigInt at fixed scale 8. */
export function parseRateToScaled(major: string): bigint {
  return parseMajorToMinor(major, 8);
}

/** Format scaled rate BigInt → major decimal string at scale 8. */
export function formatRateScaled(scaled: bigint): string {
  return formatMinorToMajor(scaled, 8);
}

/**
 * Invert primary-per-other ↔ other-per-primary at fixed scale 8.
 * Truncates toward zero; rejects result <= 0n.
 */
export function invertRateScaled(rateToPrimaryScaled: bigint): bigint {
  if (rateToPrimaryScaled <= 0n) {
    throw new Error("rate must be > 0");
  }
  const inverted =
    (RATE_SCALE_E8 * RATE_SCALE_E8) / rateToPrimaryScaled;
  if (inverted <= 0n) {
    throw new Error("rate must be > 0");
  }
  return inverted;
}

/** Exact decimal string for display/input from minor BigInt. */
export function formatMinorToMajor(minor: bigint, scale: number): string {
  assertScale(scale);
  const neg = minor < 0n;
  const abs = neg ? -minor : minor;
  if (scale === 0) {
    return `${neg ? "-" : ""}${abs.toString()}`;
  }
  const padded = abs.toString().padStart(scale + 1, "0");
  const intPart = padded.slice(0, -scale);
  const frac = padded.slice(-scale);
  return `${neg ? "-" : ""}${intPart}.${frac}`;
}

/**
 * primaryMinor = otherMinor * rateToPrimaryScaled * 10^primaryScale
 *              / (10^otherScale * 10^8)
 * Truncates toward zero. Caller handles missing rate (null LOCF).
 * Client-safe — no Prisma / Node fs.
 */
export function convertOtherMinorToPrimaryMinor(
  otherMinor: bigint,
  rateToPrimaryScaled: bigint,
  otherScale: number,
  primaryScale: number,
): bigint {
  const num =
    otherMinor * rateToPrimaryScaled * 10n ** BigInt(primaryScale);
  const den = 10n ** BigInt(otherScale) * RATE_SCALE_E8;
  return num / den;
}

/** Credit debt = limit − available (D-05–D-08). Pure; bounds enforced in actions. */
export function creditDebtMinor(
  creditLimitMinor: bigint,
  availableMinor: bigint,
): bigint {
  return creditLimitMinor - availableMinor;
}
