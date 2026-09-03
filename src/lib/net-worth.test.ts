import { describe, expect, it } from "vitest";
import { computeNetWorthRows } from "./net-worth";

describe("computeNetWorthRows (NW-01–03, ACCT-03)", () => {
  it("sums asset in primary currency", () => {
    const { totalPrimaryMinor, isPartial, rows } = computeNetWorthRows([
      {
        id: 1,
        type: "FIAT_DEBIT",
        currencyCode: "RUB",
        currencyScale: 2,
        isPrimaryCurrency: true,
        creditLimitMinor: null,
        locfAmountMinor: 100_000n,
        rateToPrimaryScaled: null,
        primaryScale: 2,
      },
    ]);
    expect(totalPrimaryMinor).toBe(100_000n);
    expect(isPartial).toBe(false);
    expect(rows[0]!.contributionPrimaryMinor).toBe(100_000n);
    expect(rows[0]!.includedInTotal).toBe(true);
  });
});
