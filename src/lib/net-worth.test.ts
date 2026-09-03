import { describe, expect, it } from "vitest";
import type { NetWorthAccountInput } from "./net-worth";
import { computeNetWorthRows } from "./net-worth";

function input(
  overrides: Partial<NetWorthAccountInput> & Pick<NetWorthAccountInput, "id" | "type">,
): NetWorthAccountInput {
  return {
    currencyCode: "RUB",
    currencyScale: 2,
    isPrimaryCurrency: true,
    creditLimitMinor: null,
    locfAmountMinor: 0n,
    rateToPrimaryScaled: null,
    primaryScale: 2,
    ...overrides,
  };
}

describe("computeNetWorthRows (NW-01–03, ACCT-03)", () => {
  it("sums asset in primary currency", () => {
    const { totalPrimaryMinor, isPartial, rows } = computeNetWorthRows([
      input({
        id: 1,
        type: "FIAT_DEBIT",
        locfAmountMinor: 100_000n,
      }),
    ]);
    expect(totalPrimaryMinor).toBe(100_000n);
    expect(isPartial).toBe(false);
    expect(rows[0]!.contributionPrimaryMinor).toBe(100_000n);
    expect(rows[0]!.includedInTotal).toBe(true);
  });

  it("subtracts credit debt only, never available", () => {
    const { rows, totalPrimaryMinor } = computeNetWorthRows([
      input({
        id: 2,
        type: "FIAT_CREDIT",
        creditLimitMinor: 500_000n,
        locfAmountMinor: 300_000n,
      }),
    ]);
    expect(rows[0]!.contributionPrimaryMinor).toBe(-200_000n);
    expect(totalPrimaryMinor).toBe(-200_000n);
    expect(rows[0]!.nativeDisplayMinor).toBe(300_000n);
    expect(rows[0]!.debtNativeMinor).toBe(200_000n);
    expect(rows[0]!.primaryDisplayMinor).toBe(200_000n);
  });

  it("increasing available decreases debt and makes total less negative", () => {
    const lowAvailable = computeNetWorthRows([
      input({
        id: 20,
        type: "FIAT_CREDIT",
        creditLimitMinor: 500_000n,
        locfAmountMinor: 200_000n,
      }),
    ]);
    const highAvailable = computeNetWorthRows([
      input({
        id: 21,
        type: "FIAT_CREDIT",
        creditLimitMinor: 500_000n,
        locfAmountMinor: 400_000n,
      }),
    ]);
    expect(lowAvailable.rows[0]!.debtNativeMinor).toBe(300_000n);
    expect(highAvailable.rows[0]!.debtNativeMinor).toBe(100_000n);
    expect(highAvailable.totalPrimaryMinor).toBeGreaterThan(
      lowAvailable.totalPrimaryMinor,
    );
    expect(highAvailable.totalPrimaryMinor).toBe(-100_000n);
  });

  it("increasing credit limit alone does not inflate hero with available", () => {
    const base = computeNetWorthRows([
      input({
        id: 22,
        type: "FIAT_CREDIT",
        creditLimitMinor: 500_000n,
        locfAmountMinor: 300_000n,
      }),
    ]);
    const higherLimit = computeNetWorthRows([
      input({
        id: 23,
        type: "FIAT_CREDIT",
        creditLimitMinor: 800_000n,
        locfAmountMinor: 300_000n,
      }),
    ]);
    // Higher limit with same available ⇒ more debt (more negative), never +available as asset
    expect(base.totalPrimaryMinor).toBe(-200_000n);
    expect(higherLimit.totalPrimaryMinor).toBe(-500_000n);
    expect(higherLimit.rows[0]!.nativeDisplayMinor).toBe(300_000n);
    expect(higherLimit.rows[0]!.contributionPrimaryMinor).toBeLessThan(0n);
  });

  it("excludes account without LOCF with excludeReason no_balance", () => {
    const { rows, totalPrimaryMinor, isPartial } = computeNetWorthRows([
      input({
        id: 4,
        type: "CASH",
        locfAmountMinor: null,
      }),
    ]);
    expect(rows[0]!.includedInTotal).toBe(false);
    expect(rows[0]!.excludeReason).toBe("no_balance");
    expect(rows[0]!.contributionPrimaryMinor).toBe(0n);
    expect(rows[0]!.nativeDisplayMinor).toBeNull();
    expect(totalPrimaryMinor).toBe(0n);
    expect(isPartial).toBe(true);
  });

  it("excludes non-primary asset without FX with excludeReason no_fx", () => {
    const { totalPrimaryMinor, isPartial, rows } = computeNetWorthRows([
      input({
        id: 3,
        type: "CRYPTO",
        currencyCode: "USDT",
        isPrimaryCurrency: false,
        locfAmountMinor: 50_000n,
        rateToPrimaryScaled: null,
      }),
    ]);
    expect(totalPrimaryMinor).toBe(0n);
    expect(isPartial).toBe(true);
    expect(rows[0]!.excludeReason).toBe("no_fx");
    expect(rows[0]!.includedInTotal).toBe(false);
    expect(rows[0]!.contributionPrimaryMinor).toBe(0n);
    expect(rows[0]!.nativeDisplayMinor).toBe(50_000n);
    expect(rows[0]!.primaryDisplayMinor).toBeNull();
  });

  it("uses primary currency identity without rateToPrimaryScaled", () => {
    const { rows, totalPrimaryMinor, isPartial } = computeNetWorthRows([
      input({
        id: 5,
        type: "FIAT_DEBIT",
        locfAmountMinor: 42_00n,
        rateToPrimaryScaled: null,
      }),
    ]);
    expect(rows[0]!.includedInTotal).toBe(true);
    expect(rows[0]!.excludeReason).toBe("none");
    expect(rows[0]!.contributionPrimaryMinor).toBe(42_00n);
    expect(rows[0]!.primaryDisplayMinor).toBe(42_00n);
    expect(totalPrimaryMinor).toBe(42_00n);
    expect(isPartial).toBe(false);
  });

  it("populates nativeDisplayMinor and primaryDisplayMinor per account type", () => {
    const { rows } = computeNetWorthRows([
      input({
        id: 6,
        type: "FIAT_DEBIT",
        locfAmountMinor: 10_000n,
      }),
      input({
        id: 7,
        type: "CRYPTO",
        currencyCode: "USDT",
        isPrimaryCurrency: false,
        locfAmountMinor: 10_000n,
        rateToPrimaryScaled: 90_00000000n,
      }),
      input({
        id: 8,
        type: "FIAT_CREDIT",
        creditLimitMinor: 500_000n,
        locfAmountMinor: 250_000n,
      }),
    ]);
    expect(rows[0]!.nativeDisplayMinor).toBe(10_000n);
    expect(rows[0]!.primaryDisplayMinor).toBe(10_000n);
    expect(rows[0]!.debtNativeMinor).toBeNull();
    expect(rows[1]!.nativeDisplayMinor).toBe(10_000n);
    expect(rows[1]!.primaryDisplayMinor).toBe(900_000n);
    expect(rows[2]!.nativeDisplayMinor).toBe(250_000n);
    expect(rows[2]!.debtNativeMinor).toBe(250_000n);
    expect(rows[2]!.primaryDisplayMinor).toBe(250_000n);
    expect(rows[2]!.contributionPrimaryMinor).toBe(-250_000n);
  });

  it("mixed portfolio total equals sum of included contributions only", () => {
    const { rows, totalPrimaryMinor, isPartial } = computeNetWorthRows([
      input({
        id: 10,
        type: "FIAT_DEBIT",
        locfAmountMinor: 100_000n,
      }),
      input({
        id: 11,
        type: "CRYPTO",
        currencyCode: "USDT",
        isPrimaryCurrency: false,
        locfAmountMinor: 10_000n,
        rateToPrimaryScaled: 90_00000000n,
      }),
      input({
        id: 12,
        type: "FIAT_CREDIT",
        creditLimitMinor: 500_000n,
        locfAmountMinor: 300_000n,
      }),
      input({
        id: 13,
        type: "CASH",
        locfAmountMinor: null,
      }),
      input({
        id: 14,
        type: "CRYPTO",
        currencyCode: "USDT",
        isPrimaryCurrency: false,
        locfAmountMinor: 1n,
        rateToPrimaryScaled: null,
      }),
    ]);
    const included = rows.filter((row) => row.includedInTotal);
    expect(included.map((row) => row.accountId)).toEqual([10, 11, 12]);
    expect(rows.find((row) => row.accountId === 10)!.contributionPrimaryMinor).toBe(
      100_000n,
    );
    expect(rows.find((row) => row.accountId === 11)!.contributionPrimaryMinor).toBe(
      900_000n,
    );
    expect(rows.find((row) => row.accountId === 12)!.contributionPrimaryMinor).toBe(
      -200_000n,
    );
    expect(rows.find((row) => row.accountId === 13)!.excludeReason).toBe(
      "no_balance",
    );
    expect(rows.find((row) => row.accountId === 14)!.excludeReason).toBe("no_fx");
    expect(totalPrimaryMinor).toBe(800_000n);
    expect(isPartial).toBe(true);
  });
});
