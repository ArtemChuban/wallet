import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { registerListAccounts } from "./tools/accounts";
import { registerGetAccountBalance } from "./tools/balances";
import { registerListDebts } from "./tools/debts";
import { registerGetForecastOverlay } from "./tools/forecast";
import { registerListFxRates } from "./tools/fx";
import { registerListGraceObligations } from "./tools/grace";
import { registerListIncome } from "./tools/income";
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
            "get_net_worth, get_account_balance, list_fx_rates, get_forecast_overlay, " +
            "list_debts, list_income, list_grace_obligations. " +
            "Net worth / Капитал is accounts-only — no debts or income. " +
            "list_fx_rates is transparency only, not a currency converter; " +
            "do not multiply rates — primary amounts come from get_net_worth / get_account_balance. " +
            "SIDE: get_forecast_overlay, list_debts, list_income, list_grace_obligations. " +
            "INISO-01/GRISO-01/SAVISO-01: Капитал forecast overlay (Прогноз) is income + interest + grace — " +
            "do not fold into historical NW LOCF. " +
            "DISOL-01: Долги side ledger — do not fold into historical NW / Капитал LOCF. " +
            "INISO-01: Доходы side ledger — do not fold into historical NW / Капитал LOCF. " +
            "GRISO-01: Грейс side ledger — do not fold into historical NW / Капитал LOCF. " +
            "SAVISO-01: Savings interest overlay — do not fold into historical NW / Капитал LOCF.",
        },
      );
      registerWalletPing(server);
      registerGetNetWorth(server);
      registerListAccounts(server);
      registerGetAccountBalance(server);
      registerListFxRates(server);
      registerGetForecastOverlay(server);
      registerListDebts(server);
      registerListIncome(server);
      registerListGraceObligations(server);
      return server;
    },
    { responseMode: "json", legacy: "stateless" },
  );
}
