import { createWalletMcpHandler } from "@/lib/mcp/create-handler";
import { withLocalhostGuard } from "@/lib/mcp/localhost-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const mcp = createWalletMcpHandler();

async function handle(req: Request): Promise<Response> {
  const rejected = withLocalhostGuard(req);
  if (rejected) return rejected;
  return mcp.fetch(req);
}

export { handle as GET, handle as POST, handle as DELETE };
