import { describe, it } from "vitest";

/**
 * Wave 0 Nyquist stubs (SIDE-01).
 * Later plans green list_debts totals + OPEN filter against debts.ts.
 */
describe("list_debts (SIDE-01)", () => {
  it.todo("returns debt rows with remaining/totals as string minors + scale");

  it.todo("defaults to OPEN debts; includeClosed optional widen");

  it.todo("NW / CAP payloads never include debt-ledger fields (DISOL contract)");
});
