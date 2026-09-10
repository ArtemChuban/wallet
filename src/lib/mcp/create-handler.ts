import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { registerListAccounts } from "./tools/accounts";
import { registerGetAccountBalance } from "./tools/balances";
import { registerListFxRates } from "./tools/fx";
import { registerGetNetWorth } from "./tools/net-worth";
import { registerWalletPing } from "./tools/wallet-ping";

/**
 * Wallet Streamable HTTP MCP handler.
 * Uses @modelcontextprotocol/server createMcpHandler (not mcp-handler create —
 * mcp-handler@2.1.1 does not forward responseMode).
 */
export function createWalletMcpHandler() {
  return createMcpHandler(
    () => {
      const server = new McpServer(
        { name: "wallet-mcp", version: "1.4.0" },
        {
          instructions:
            "Read-only localhost wallet MCP for capital tools (Капитал). " +
            "Net worth is accounts-only — no debts or income. " +
            "FX list tools are transparency only, not a currency converter; " +
            "primary amounts come from get_net_worth / get_account_balance. " +
            "Side ledgers (debts/income/grace) come later.",
        },
      );
      registerWalletPing(server);
      registerGetNetWorth(server);
      registerListAccounts(server);
      registerGetAccountBalance(server);
      registerListFxRates(server);
      return server;
    },
    { responseMode: "json", legacy: "stateless" },
  );
}
