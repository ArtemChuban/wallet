/**
 * MCP JSON helpers for money / FX fields (D-09).
 * Never coerce bigint minors or rates to JS number.
 */

/** Minor units as JSON string, or null when absent. Pair with `scale` at call site. */
export function minorToJson(value: bigint | null): string | null {
  if (value === null) return null;
  return value.toString();
}

/**
 * FX rateToPrimaryScaled as JSON string.
 * Callers pair with `rateScale: 8` (RATE_SCALE_E8 = 10^8).
 */
export function rateToJson(rateToPrimaryScaled: bigint): string {
  return rateToPrimaryScaled.toString();
}
