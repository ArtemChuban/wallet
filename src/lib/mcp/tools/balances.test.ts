import { describe, expect, it } from "vitest";
import { convertOtherMinorToPrimaryMinor } from "@/lib/money";
import {
  assembleAccountBalancePayload,
} from "@/lib/mcp/reads/load-account-balance-asof";
import { optionalAsOfSchema, resolveAsOf } from "@/lib/mcp/as-of";

/**
 * CAP-03 get_account_balance — D-11 honesty + soft account_not_found (A1).
 */
describe("get_account_balance (CAP-03)", () => {
  it("missing FX returns conversionOk false with primary null, native present", () => {
    const payload = assembleAccountBalancePayload({
      asOf: "2026-09-10",
      accountId: 2,
      account: {
        name: "USD wallet",
        type: "ASSET",
        currencyCode: "USD",
        currencyScale: 2,
        isPrimaryCurrency: false,
      },
      nativeAmountMinor: 50_00n,
      rateToPrimaryScaled: null,
      primaryScale: 2,
    });

    expect(payload.conversionOk).toBe(false);
    expect(payload.primaryAmountMinor).toBeNull();
    expect(payload.nativeAmountMinor).toBe("5000");
    expect(payload.excludeReason).toBe("no_fx");
    expect(payload.accountName).toBe("USD wallet");
    expect(payload.currencyCode).toBe("USD");
    expect(payload.type).toBe("ASSET");
    expect(payload.currencyScale).toBe(2);
    expect(payload.primaryScale).toBe(2);
  });

  it("unknown accountId returns success payload with account_not_found", () => {
    const payload = assembleAccountBalancePayload({
      asOf: "2026-09-10",
      accountId: 999,
      account: null,
      nativeAmountMinor: null,
      rateToPrimaryScaled: null,
      primaryScale: 2,
    });

    expect(payload.error).toBe("account_not_found");
    expect(payload.conversionOk).toBe(false);
    expect(payload.nativeAmountMinor).toBeNull();
    expect(payload.primaryAmountMinor).toBeNull();
    expect(payload.accountName).toBeNull();
    expect(payload.excludeReason).toBe("account_not_found");
  });

  it("omitted asOf defaults via resolveAsOf", () => {
    expect(optionalAsOfSchema.safeParse(undefined).success).toBe(true);
    expect(optionalAsOfSchema.safeParse("2026-09-10").success).toBe(true);
    expect(optionalAsOfSchema.safeParse("nope").success).toBe(false);
    expect(resolveAsOf("2020-01-15")).toBe("2020-01-15");
    expect(resolveAsOf(undefined)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("server convertOtherMinorToPrimaryMinor fills primary when FX present", () => {
    const native = 100_00n;
    const rate = 90_000_000_00n; // 90.0 at e8
    const primary = convertOtherMinorToPrimaryMinor(native, rate, 2, 2);
    const payload = assembleAccountBalancePayload({
      asOf: "2026-09-10",
      accountId: 5,
      account: {
        name: "USD",
        type: "ASSET",
        currencyCode: "USD",
        currencyScale: 2,
        isPrimaryCurrency: false,
      },
      nativeAmountMinor: native,
      rateToPrimaryScaled: rate,
      primaryScale: 2,
    });
    expect(payload.conversionOk).toBe(true);
    expect(payload.primaryAmountMinor).toBe(primary.toString());
    expect(payload.excludeReason).toBe("none");
  });
});
