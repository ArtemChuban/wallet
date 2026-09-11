import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { optionalAsOfSchema, resolveAsOf } from "@/lib/mcp/as-of";
import { loadAccountBalanceAsOf } from "@/lib/mcp/reads/load-account-balance-asof";

export function registerGetAccountBalance(server: McpServer) {
  server.registerTool(
    "get_account_balance",
    {
      description:
        "Read one account's native and primary balance as-of a calendar date (YYYY-MM-DD). " +
        "Accounts-only transparency: server converts FX; returns conversionOk false + null primaryAmountMinor when snapshot/FX missing. " +
        "Do not multiply rates yourself. Unknown accountId → success with error account_not_found.",
      inputSchema: z.object({
        accountId: z.number().int().positive(),
        asOf: optionalAsOfSchema,
      }),
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async ({ accountId, asOf }) => {
      const resolved = resolveAsOf(asOf);
      const payload = await loadAccountBalanceAsOf(accountId, resolved);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(payload) }],
      };
    },
  );
}
