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
