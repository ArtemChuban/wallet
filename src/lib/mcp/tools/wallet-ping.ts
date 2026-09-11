import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

export function registerWalletPing(server: McpServer) {
  server.registerTool(
    "wallet_ping",
    {
      description: "Liveness check for wallet MCP transport",
      inputSchema: z.object({}),
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      const payload = {
        ok: true as const,
        service: "wallet-mcp",
        timestamp: new Date().toISOString(),
      };
      return {
        content: [{ type: "text", text: JSON.stringify(payload) }],
      };
    },
  );
}
