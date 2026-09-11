import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { optionalAsOfSchema, resolveAsOf } from "@/lib/mcp/as-of";
import { loadNetWorthAsOf } from "@/lib/mcp/reads/load-net-worth-asof";

export function registerGetNetWorth(server: McpServer) {
  server.registerTool(
    "get_net_worth",
    {
      description:
        "Read net worth / Капитал as-of a calendar date (YYYY-MM-DD). " +
        "Returns totalPrimaryMinor (string) + isPartial + per-account rows with excludeReason. " +
        "Accounts-only historical LOCF — no debts/income/grace. Server converts FX; do not multiply rates yourself.",
      inputSchema: z.object({
        asOf: optionalAsOfSchema,
      }),
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async ({ asOf }) => {
      const resolved = resolveAsOf(asOf);
      const payload = await loadNetWorthAsOf(resolved);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(payload) }],
      };
    },
  );
}
