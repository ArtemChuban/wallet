import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { calendarDateToday } from "@/lib/dates";
import { loadDebts } from "@/lib/mcp/reads/load-debts";

/** D-08/DISOL-01 Долги side-ledger — isolation in description, not payload meta. */
export const LIST_DEBTS_DESCRIPTION =
  "List Долги / debts with remainingMinor and colocated primary totals " +
  "(iOwePrimaryMinor / theyOwePrimaryMinor / isPartial). " +
  "Optional includeClosed (default false = OPEN only, DebtsList focus). " +
  "DISOL-01: Долги side ledger — do not fold into historical NW / Капитал LOCF.";

export function registerListDebts(server: McpServer) {
  server.registerTool(
    "list_debts",
    {
      description: LIST_DEBTS_DESCRIPTION,
      inputSchema: z.object({
        includeClosed: z.boolean().optional(),
      }),
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async ({ includeClosed }) => {
      const today = calendarDateToday("Europe/Moscow");
      const payload = await loadDebts({
        includeClosed: includeClosed ?? false,
        today,
      });
      return {
        content: [{ type: "text" as const, text: JSON.stringify(payload) }],
      };
    },
  );
}
