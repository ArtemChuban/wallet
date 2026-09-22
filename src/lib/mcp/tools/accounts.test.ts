import { describe, expect, it } from "vitest";
import { isCreditType } from "@/lib/account-type";
import {
  registerListAccounts,
  serializeListAccountsPayload,
} from "@/lib/mcp/tools/accounts";

const LIST_ACCOUNT_KEYS = [
  "accrualDayOfMonth",
  "annualRateBps",
  "annualRatePercent",
  "creditLimitMinor",
  "currencyCode",
  "currencyScale",
  "id",
  "isCredit",
  "name",
  "type",
].sort();

/**
 * CAP-01 / MCP-01 list_accounts — metadata only (D-04).
 * Pure serialize helper keeps tests SQLite-free.
 */
describe("list_accounts (CAP-01 / MCP-01)", () => {
  it("returns account type, currency, creditLimitMinor string, isCredit", () => {
    const payload = serializeListAccountsPayload([
      {
        id: 1,
        name: "Cash",
        type: "ASSET",
        currencyCode: "RUB",
        currencyScale: 2,
        creditLimitMinor: null,
        annualRateBps: null,
        accrualDayOfMonth: null,
      },
      {
        id: 2,
        name: "Credit card",
        type: "FIAT_CREDIT",
        currencyCode: "RUB",
        currencyScale: 2,
        creditLimitMinor: 500_000n,
        annualRateBps: null,
        accrualDayOfMonth: null,
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
      annualRateBps: null,
      accrualDayOfMonth: null,
      annualRatePercent: null,
    });
    expect(payload.accounts[1]!.creditLimitMinor).toBe("500000");
    expect(typeof payload.accounts[1]!.creditLimitMinor).toBe("string");
    expect(payload.accounts[1]!.isCredit).toBe(true);
    expect(payload.accounts[1]!.isCredit).toBe(isCreditType("FIAT_CREDIT"));
    expect(payload.accounts[1]!.annualRateBps).toBeNull();
    expect(payload.accounts[1]!.accrualDayOfMonth).toBeNull();
    expect(payload.accounts[1]!.annualRatePercent).toBeNull();
  });

  it("SAVINGS row emits annualRateBps, accrualDayOfMonth, numeric annualRatePercent (D-01, D-02)", () => {
    const payload = serializeListAccountsPayload([
      {
        id: 10,
        name: "Накопительный",
        type: "SAVINGS",
        currencyCode: "RUB",
        currencyScale: 2,
        creditLimitMinor: null,
        annualRateBps: 1650,
        accrualDayOfMonth: 15,
      },
    ]);
    const row = payload.accounts[0]!;
    expect(row.annualRateBps).toBe(1650);
    expect(row.accrualDayOfMonth).toBe(15);
    expect(row.annualRatePercent).toBe(16.5);
    expect(typeof row.annualRatePercent).toBe("number");
    expect(row).not.toHaveProperty("isSavings");
  });

  it("non-SAVINGS rows force null rate fields even if input carried bps (MCP-01 boundary)", () => {
    const payload = serializeListAccountsPayload([
      {
        id: 1,
        name: "Cash",
        type: "ASSET",
        currencyCode: "RUB",
        currencyScale: 2,
        creditLimitMinor: null,
        annualRateBps: 1650,
        accrualDayOfMonth: 15,
      },
      {
        id: 2,
        name: "Credit",
        type: "FIAT_CREDIT",
        currencyCode: "RUB",
        currencyScale: 2,
        creditLimitMinor: 100n,
        annualRateBps: 900,
        accrualDayOfMonth: 1,
      },
    ]);
    for (const row of payload.accounts) {
      expect(row.annualRateBps).toBeNull();
      expect(row.accrualDayOfMonth).toBeNull();
      expect(row.annualRatePercent).toBeNull();
    }
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
        annualRateBps: null,
        accrualDayOfMonth: null,
      },
    ]);
    const row = payload.accounts[0]!;
    expect(row).not.toHaveProperty("nativeAmountMinor");
    expect(row).not.toHaveProperty("availableMinor");
    expect(row).not.toHaveProperty("debtNativeMinor");
    expect(row).not.toHaveProperty("statementDayOfMonth");
    expect(row).not.toHaveProperty("dueDayOfMonth");
    expect(row).not.toHaveProperty("isSavings");
    expect(Object.keys(row).sort()).toEqual(LIST_ACCOUNT_KEYS);
  });

  it("empty wallet returns success with empty accounts array", () => {
    const payload = serializeListAccountsPayload([]);
    expect(payload).toEqual({ accounts: [] });
  });

  it("registerListAccounts description names SAVINGS rate fields; no SAVISO-01 (D-04, D-12)", () => {
    const calls: Array<{ name: string; config: { description: string } }> = [];
    const fakeServer = {
      registerTool(
        name: string,
        config: { description: string },
        _handler: unknown,
      ) {
        calls.push({ name, config });
      },
    };
    registerListAccounts(fakeServer as never);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.name).toBe("list_accounts");
    const desc = calls[0]!.config.description;
    expect(desc).toMatch(/annualRateBps/);
    expect(desc).toMatch(/accrualDayOfMonth/);
    expect(desc).toMatch(/annualRatePercent/);
    expect(desc).toMatch(/SAVINGS/);
    expect(desc).not.toMatch(/SAVISO-01/);
  });
});
