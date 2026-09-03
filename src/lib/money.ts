/** FX rate fixed scale: store rate × 10^8 as BigInt (D-09). */
export const RATE_SCALE_E8 = 100000000n;

const MAJOR_PATTERN = /^([+-]?)(\d+)(?:\.(\d+))?$/;

/** Strip ordinary / NBSP / narrow NBSP spaces so display strings remain parseable. */
function stripGroupingSpaces(s: string): string {
  return s.replace(/[\s\u00A0\u202F]/g, "");
}

function assertScale(scale: number): void {
  if (!Number.isInteger(scale) || scale < 0 || scale > 18) {
    throw new Error("scale must be an integer from 0 to 18");
  }
}

/** Group integer digits from the right with spaces: 1234567 → 1 234 567. */
function groupThousands(intDigits: string): string {
  const reversed = intDigits.split("").reverse();
  const parts: string[] = [];
  for (let i = 0; i < reversed.length; i += 3) {
    parts.push(reversed.slice(i, i + 3).reverse().join(""));
  }
  return parts.reverse().join(" ");
}

/**
 * Display major from exact "[-]int.frac" or "[-]int":
 * - strip trailing fractional zeros (and the dot if frac empty)
 * - space-separate thousands in the integer part only
 */
export function formatMajorForDisplay(exact: string): string {
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(exact);
  if (!match) return exact;
  const sign = match[1]!;
  const intPart = match[2]!;
  let frac = match[3] ?? "";
  frac = frac.replace(/0+$/, "");
  const grouped = groupThousands(intPart);
  return frac.length > 0 ? `${sign}${grouped}.${frac}` : `${sign}${grouped}`;
}

/**
 * Parse major-unit decimal string → minor BigInt using currency scale (0–18).
 * BigInt only — no Number/parseFloat; rejects scientific notation.
 * Accepts display grouping spaces in the integer part.
 */
export function parseMajorToMinor(major: string, scale: number): bigint {
  assertScale(scale);
  const trimmed = stripGroupingSpaces(major.trim());
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

/**
 * Exact major string at full currency scale (no grouping, pad frac zeros).
 * Use for Number() / math boundaries — not for UI labels.
 */
export function formatMinorToMajorExact(minor: bigint, scale: number): string {
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
 * Display major from minor BigInt: strip trailing frac zeros + thousand spaces.
 * Site-wide money/rate labels go through this.
 */
export function formatMinorToMajor(minor: bigint, scale: number): string {
  return formatMajorForDisplay(formatMinorToMajorExact(minor, scale));
}

/** Chart Y tick / tooltip number → same display rules (dot decimal, space thousands). */
export function formatChartNumber(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  if (Object.is(value, -0) || value === 0) return "0";
  const neg = value < 0;
  const abs = Math.abs(value);
  // Prefer shortest JS decimal (avoids toFixed float noise like …789122999995).
  let raw = abs.toString();
  if (/e/i.test(raw)) {
    raw = abs.toFixed(18).replace(/0+$/, "").replace(/\.$/, "");
  }
  const exact = neg ? `-${raw}` : raw;
  return formatMajorForDisplay(exact);
}

/** Exact major → JS number (chart series). Never pass display-grouped strings to Number(). */
export function minorToMajorNumber(minor: bigint, scale: number): number {
  return Number(formatMinorToMajorExact(minor, scale));
}

/** Format scaled rate BigInt → display major at scale 8. */
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
