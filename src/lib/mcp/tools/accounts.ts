import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { isCreditType } from "@/lib/account-type";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
import { minorToJson } from "@/lib/mcp/serialize";

export type ListAccountInput = {
  id: number;
  name: string;
  type: string;
  currencyCode: string;
  currencyScale: number;
  creditLimitMinor: bigint | null;
};

export type ListAccountRow = {
  id: number;
  name: string;
  type: string;
  currencyCode: string;
  currencyScale: number;
  creditLimitMinor: string | null;
  isCredit: boolean;
};

export type SerializedListAccountsPayload = {
  accounts: ListAccountRow[];
};

/**
 * Pure CAP-01 adapter — metadata only (D-04). SQLite-free for tests.
 */
export function serializeListAccountsPayload(
  accounts: ListAccountInput[],
): SerializedListAccountsPayload {
  return {
    accounts: accounts.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      currencyCode: a.currencyCode,
      currencyScale: a.currencyScale,
      creditLimitMinor: minorToJson(a.creditLimitMinor),
      isCredit: isCreditType(a.type),
    })),
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
    })),
  );
}

export function registerListAccounts(server: McpServer) {
  server.registerTool(
    "list_accounts",
    {
      description:
        "List wallet accounts / счета (accounts-only catalog): type, currency, creditLimitMinor, isCredit. " +
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
