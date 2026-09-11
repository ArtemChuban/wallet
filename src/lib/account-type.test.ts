import { describe, expect, it } from "vitest";
import {
  accountTypeLabel,
  isAssetType,
  isCreditType,
} from "./account-type";

describe("accountTypeLabel / soft-read helpers (QUICK-0i7)", () => {
  it("labels ASSET and legacy non-credit as Актив", () => {
    for (const t of ["ASSET", "FIAT_DEBIT", "CRYPTO", "CASH"] as const) {
      expect(accountTypeLabel(t)).toBe("Актив");
      expect(isAssetType(t)).toBe(true);
      expect(isCreditType(t)).toBe(false);
    }
  });

  it("labels FIAT_CREDIT as Кредитный", () => {
    expect(accountTypeLabel("FIAT_CREDIT")).toBe("Кредитный");
    expect(isCreditType("FIAT_CREDIT")).toBe(true);
    expect(isAssetType("FIAT_CREDIT")).toBe(false);
  });

  it("SAVINGS is asset soft-read with label Накопительный (D-11 / D-14 / ACCT-02 / ACCT-03)", () => {
    expect(isAssetType("SAVINGS")).toBe(true);
    expect(isCreditType("SAVINGS")).toBe(false);
    expect(accountTypeLabel("SAVINGS")).toBe("Накопительный");
  });
});
