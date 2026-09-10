import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { registerListAccounts } from "./tools/accounts";
import { registerGetAccountBalance } from "./tools/balances";
import { registerListDebts } from "./tools/debts";
import { registerGetForecastOverlay } from "./tools/forecast";
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
            "Read-only localhost capital MCP (Капитал): wallet_ping, list_accounts, " +
            "get_net_worth, get_account_balance, list_fx_rates, get_forecast_overlay, list_debts. " +
            "Net worth / Капитал is accounts-only — no debts or income. " +
            "list_fx_rates is transparency only, not a currency converter; " +
            "do not multiply rates — primary amounts come from get_net_worth / get_account_balance. " +
            "SIDE: get_forecast_overlay + list_debts available now; list_income / list_grace_obligations next. " +
            "Капитал forecast overlay (Прогноз): income + A′ grace; not historical NW LOCF. " +
            "list_debts is Долги side ledger — not historical NW.",
        },
      );
      registerWalletPing(server);
      registerGetNetWorth(server);
      registerListAccounts(server);
      registerGetAccountBalance(server);
      registerListFxRates(server);
      registerGetForecastOverlay(server);
      registerListDebts(server);
      return server;
    },
    { responseMode: "json", legacy: "stateless" },
  );
}
