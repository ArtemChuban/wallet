import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { isCreditType } from "@/lib/account-type";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
import { minorToJson } from "@/lib/mcp/serialize";
import { formatBpsToPercentMajor } from "@/lib/savings-rate";

export type ListAccountInput = {
  id: number;
  name: string;
  type: string;
  currencyCode: string;
  currencyScale: number;
  creditLimitMinor: bigint | null;
  annualRateBps: number | null;
  accrualDayOfMonth: number | null;
};

export type ListAccountRow = {
  id: number;
  name: string;
  type: string;
  currencyCode: string;
  currencyScale: number;
  creditLimitMinor: string | null;
  isCredit: boolean;
  annualRateBps: number | null;
  accrualDayOfMonth: number | null;
  annualRatePercent: number | null;
};

export type SerializedListAccountsPayload = {
  accounts: ListAccountRow[];
};

/**
 * Pure CAP-01 / MCP-01 adapter — metadata only (D-04). SQLite-free for tests.
 * Rate fields always present: values for SAVINGS, null otherwise (D-01, D-02).
 */
export function serializeListAccountsPayload(
  accounts: ListAccountInput[],
): SerializedListAccountsPayload {
  return {
    accounts: accounts.map((a) => {
      const isSavings = a.type === "SAVINGS";
      const annualRateBps = isSavings ? a.annualRateBps : null;
      const accrualDayOfMonth = isSavings ? a.accrualDayOfMonth : null;
      const annualRatePercent =
        isSavings && annualRateBps != null
          ? Number(formatBpsToPercentMajor(annualRateBps))
          : null;
      return {
        id: a.id,
        name: a.name,
        type: a.type,
        currencyCode: a.currencyCode,
        currencyScale: a.currencyScale,
        creditLimitMinor: minorToJson(a.creditLimitMinor),
        isCredit: isCreditType(a.type),
        annualRateBps,
        accrualDayOfMonth,
        annualRatePercent,
      };
    }),
  };
}

/** Load account catalog for list_accounts (no LOCF balances). */
export async function loadListAccounts(): Promise<SerializedListAccountsPayload> {
  await ensureSqlitePragmas();
  const accounts = await prisma.account.findMany({
    include: { currency: true },
    orderBy: { name: "asc" },
  });
  return serializeListAccountsPayload(
    accounts.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      currencyCode: a.currencyCode,
      currencyScale: a.currency.scale,
      creditLimitMinor: a.creditLimitMinor,
      annualRateBps: a.annualRateBps,
      accrualDayOfMonth: a.accrualDayOfMonth,
    })),
  );
}

export function registerListAccounts(server: McpServer) {
  server.registerTool(
    "list_accounts",
    {
      description:
        "List wallet accounts / счета (accounts-only catalog): type, currency, creditLimitMinor, isCredit. " +
        "For type SAVINGS also annualRateBps, accrualDayOfMonth, and annualRatePercent (null on other types). " +
        "Metadata only — no live available or debt balances (use get_account_balance).",
      inputSchema: z.object({}),
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      const payload = await loadListAccounts();
      return {
        content: [{ type: "text" as const, text: JSON.stringify(payload) }],
      };
    },
  );
}
