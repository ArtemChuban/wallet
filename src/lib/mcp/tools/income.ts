import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { calendarDateToday } from "@/lib/dates";
import {
  optionalIncomeRangeSchema,
  yyyyMmDdSchema,
} from "@/lib/mcp/as-of";
import { loadIncome } from "@/lib/mcp/reads/load-income";

/** D-08/INISO-01 Доходы side-ledger — isolation in description, not payload meta. */
export const LIST_INCOME_DESCRIPTION =
  "List Доходы / income defs with nextPlannedAsOf, hasActual, overdue (income page parity). " +
  "Optional paired from+to (YYYY-MM-DD both required) dumps listAllInRange occurrences with overdue. " +
  "INISO-01: Доходы side ledger — do not fold into historical NW / Капитал LOCF.";

export function registerListIncome(server: McpServer) {
  server.registerTool(
    "list_income",
    {
      description: LIST_INCOME_DESCRIPTION,
      inputSchema: z
        .object({
          from: yyyyMmDdSchema.optional(),
          to: yyyyMmDdSchema.optional(),
        })
        .superRefine((val, ctx) => {
          const parsed = optionalIncomeRangeSchema.safeParse(val);
          if (!parsed.success) {
            for (const issue of parsed.error.issues) {
              ctx.addIssue(issue);
            }
          }
        }),
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async ({ from, to }) => {
      const today = calendarDateToday("Europe/Moscow");
      const payload = await loadIncome({
        today,
        from,
        to,
      });
      return {
        content: [{ type: "text" as const, text: JSON.stringify(payload) }],
      };
    },
  );
}
