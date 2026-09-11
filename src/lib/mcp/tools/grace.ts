import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { calendarDateToday } from "@/lib/dates";
import { loadGrace } from "@/lib/mcp/reads/load-grace";

/** D-08/GRISO-01 Грейс side-ledger — isolation in description, not payload meta. */
export const LIST_GRACE_OBLIGATIONS_DESCRIPTION =
  "List Грейс / credit grace obligations: OPEN rows + CTA candidates (kind open|cta). " +
  "Overdue via isGraceOverdue; CLOSED omitted from list (CreditGraceDialog parity). " +
  "GRISO-01: Грейс side ledger — do not fold into historical NW / Капитал LOCF.";

export function registerListGraceObligations(server: McpServer) {
  server.registerTool(
    "list_grace_obligations",
    {
      description: LIST_GRACE_OBLIGATIONS_DESCRIPTION,
      inputSchema: z.object({}),
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      const today = calendarDateToday("Europe/Moscow");
      const payload = await loadGrace({ today });
      return {
        content: [{ type: "text" as const, text: JSON.stringify(payload) }],
      };
    },
  );
}
