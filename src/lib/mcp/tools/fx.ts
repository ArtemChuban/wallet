import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { optionalAsOfSchema, resolveAsOf } from "@/lib/mcp/as-of";
import { loadFxRatesAsOf } from "@/lib/mcp/reads/load-fx-rates-asof";

/** Exported for CAP-04 description contract tests (D-03). */
export const LIST_FX_RATES_DESCRIPTION =
  "List FX rates / Курсы as-of a calendar date (YYYY-MM-DD): primary↔other LOCF snapshot. " +
  "Transparency only — not a currency converter; do not convert or multiply rates. " +
  "Primary amounts come only from get_net_worth or get_account_balance. " +
  "Optional currencyCode filters one non-primary code.";

export function registerListFxRates(server: McpServer) {
  server.registerTool(
    "list_fx_rates",
    {
      description: LIST_FX_RATES_DESCRIPTION,
      inputSchema: z.object({
        asOf: optionalAsOfSchema,
        currencyCode: z.string().min(1).optional(),
      }),
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async ({ asOf, currencyCode }) => {
      const resolved = resolveAsOf(asOf);
      const payload = await loadFxRatesAsOf(resolved, currencyCode);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(payload) }],
      };
    },
  );
}
