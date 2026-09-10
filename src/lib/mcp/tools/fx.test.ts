import { describe, it } from "vitest";

/**
 * Wave 0 Nyquist stubs (CAP-04).
 * Later plans green list_fx_rates LOCF snapshot + currencyCode filter.
 */
describe("list_fx_rates (CAP-04)", () => {
  it.todo("returns LOCF rates ≤ asOf with rateScale 8 string minors");

  it.todo("optional currencyCode filter narrows rates list");

  it.todo("tool description forbids agent-side conversion");
});
