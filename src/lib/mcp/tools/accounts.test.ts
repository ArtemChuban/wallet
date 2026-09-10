import { describe, it } from "vitest";

/**
 * Wave 0 Nyquist stubs (CAP-01).
 * Later plans green list_accounts metadata list against accounts.ts.
 */
describe("list_accounts (CAP-01)", () => {
  it.todo("returns account type, currency, creditLimitMinor string, isCredit");

  it.todo("omits live available/debt balance fields (metadata only)");

  it.todo("empty wallet returns success with empty accounts array");
});
