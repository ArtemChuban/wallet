import { describe, expect, it } from "vitest";
import { isCreditType } from "@/lib/account-type";
import { serializeListAccountsPayload } from "@/lib/mcp/tools/accounts";

/**
 * CAP-01 list_accounts — metadata only (D-04).
 * Pure serialize helper keeps tests SQLite-free.
 */
describe("list_accounts (CAP-01)", () => {
  it("returns account type, currency, creditLimitMinor string, isCredit", () => {
    const payload = serializeListAccountsPayload([
      {
        id: 1,
        name: "Cash",
        type: "ASSET",
        currencyCode: "RUB",
        currencyScale: 2,
        creditLimitMinor: null,
      },
      {
        id: 2,
        name: "Credit card",
        type: "FIAT_CREDIT",
        currencyCode: "RUB",
        currencyScale: 2,
        creditLimitMinor: 500_000n,
      },
    ]);

    expect(payload.accounts).toHaveLength(2);
    expect(payload.accounts[0]).toEqual({
      id: 1,
      name: "Cash",
      type: "ASSET",
      currencyCode: "RUB",
      currencyScale: 2,
      creditLimitMinor: null,
      isCredit: false,
    });
    expect(payload.accounts[1]!.creditLimitMinor).toBe("500000");
    expect(typeof payload.accounts[1]!.creditLimitMinor).toBe("string");
    expect(payload.accounts[1]!.isCredit).toBe(true);
    expect(payload.accounts[1]!.isCredit).toBe(
      isCreditType("FIAT_CREDIT"),
    );
  });

  it("omits live available/debt balance fields (metadata only)", () => {
    const payload = serializeListAccountsPayload([
      {
        id: 3,
        name: "USD",
        type: "ASSET",
        currencyCode: "USD",
        currencyScale: 2,
        creditLimitMinor: null,
      },
    ]);
    const row = payload.accounts[0]!;
    expect(row).not.toHaveProperty("nativeAmountMinor");
    expect(row).not.toHaveProperty("availableMinor");
    expect(row).not.toHaveProperty("debtNativeMinor");
    expect(row).not.toHaveProperty("statementDayOfMonth");
    expect(row).not.toHaveProperty("dueDayOfMonth");
    expect(Object.keys(row).sort()).toEqual(
      [
        "creditLimitMinor",
        "currencyCode",
        "currencyScale",
        "id",
        "isCredit",
        "name",
        "type",
      ].sort(),
    );
  });

  it("empty wallet returns success with empty accounts array", () => {
    const payload = serializeListAccountsPayload([]);
    expect(payload).toEqual({ accounts: [] });
  });
});
