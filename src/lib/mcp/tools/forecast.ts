import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { calendarDateToday } from "@/lib/dates";
import { optionalHorizonEndSchema } from "@/lib/mcp/as-of";
import {
  loadForecastOverlay,
  resolveForecastHorizonEnd,
} from "@/lib/mcp/reads/load-forecast-overlay";

/** D-08/INISO-01+GRISO-01 forecast overlay — isolation in description, not payload meta. */
export const GET_FORECAST_OVERLAY_DESCRIPTION =
  "Read Капитал forecast overlay / Прогноз: sparse points[] with income + A′ grace forecastEvents. " +
  "Optional horizonEnd (YYYY-MM-DD); omit defaults to today+365 (same as UI 1y/all). " +
  "UI presets 30d/90d/1y are how to pick a date — not tool params. " +
  "INISO-01/GRISO-01: Капитал forecast overlay (Прогноз) is income + A′ grace — do not fold into historical NW LOCF.";

export function registerGetForecastOverlay(server: McpServer) {
  server.registerTool(
    "get_forecast_overlay",
    {
      description: GET_FORECAST_OVERLAY_DESCRIPTION,
      inputSchema: z.object({
        horizonEnd: optionalHorizonEndSchema,
      }),
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async ({ horizonEnd }) => {
      const today = calendarDateToday("Europe/Moscow");
      const resolvedHorizon = resolveForecastHorizonEnd(today, horizonEnd);
      const payload = await loadForecastOverlay({
        today,
        horizonEnd: resolvedHorizon,
      });
      return {
        content: [{ type: "text" as const, text: JSON.stringify(payload) }],
      };
    },
  );
}
