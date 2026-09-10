import { describe, it } from "vitest";

/**
 * Wave 0 Nyquist stubs (CAP-03).
 * Later plans green get_account_balance conversionOk false path.
 */
describe("get_account_balance (CAP-03)", () => {
  it.todo("missing FX returns conversionOk false with primary null, native present");

  it.todo("unknown accountId returns success payload with account_not_found");

  it.todo("omitted asOf defaults via resolveAsOf");
});
