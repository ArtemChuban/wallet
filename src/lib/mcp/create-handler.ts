import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
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
            "read-only localhost wallet MCP; tools expand later",
        },
      );
      registerWalletPing(server);
      return server;
    },
    { responseMode: "json", legacy: "stateless" },
  );
}
