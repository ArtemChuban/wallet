# Stack Research

**Domain:** In-app read-only MCP host (HTTP Streamable) inside Next.js wallet
**Researched:** 2026-09-10
**Confidence:** HIGH
**Milestone:** v1.4 Local MCP (subsequent — ADD to existing app; do not replace core stack)

## Recommended Stack

### Core Technologies (reuse — do NOT replace)

| Technology | Version (pinned in `package.json`) | Purpose for v1.4 | Why recommended |
|------------|--------------------------------------|------------------|-----------------|
| Next.js | 16.3.4 App Router | Host MCP at Route Handler in same process as UI + Prisma | Already Dockerized; no custom server; matches `src/app/api/health/route.ts` pattern |
| Prisma | 7.10.0 + better-sqlite3 13.0.3 | Read-only tool backends (accounts, NW, FX, debts, income, grace) | Same SQLite + domain libs; no second data path |
| Zod | 4.5.4 | Tool `inputSchema` (MCP SDK v2 Standard Schema) | Already app standard; satisfies `@modelcontextprotocol/server` peer `zod@^4.2.0` |
| Vitest | 4.1.11 | Pure tests for tool adapters + Host/Origin guards | Keep Prisma out of unit math; mirror existing domain tests |
| Docker | existing `node:24-bookworm-slim` | Ship MCP with app lifecycle (`npm run dev` / container) | Image already Node 24 (≥20 required by MCP SDK v2); `EXPOSE 3000` + `HOSTNAME=0.0.0.0` |

### New packages (v1.4 additions)

| Technology | Version | Purpose | Why recommended |
|------------|---------|---------|-----------------|
| `mcp-handler` | **2.1.1** (`^2`) | Next.js-friendly wrapper around SDK `createMcpHandler` → `(Request) => Promise<Response>` | Official Vercel adapter; mounts as App Router exports; dual-era (2026-07-28 + 2025 Streamable HTTP fallback); **no Redis**; legacy HTTP+SSE endpoints removed |
| `@modelcontextprotocol/server` | **2.0.0** (`^2`) | `McpServer`, `createMcpHandler`, `registerTool`, Host/Origin helpers | Current MCP TypeScript server package (v2 split from monolith `@modelcontextprotocol/sdk`); Streamable HTTP is the remote transport Claude Code / Cursor expect |

Transitive (do not pin unless needed): `@modelcontextprotocol/core@2.0.0` via server package.

### Supporting Libraries (prefer in-repo over new npm)

| Library / module | Version | Purpose | When to use |
|------------------|---------|---------|-------------|
| Existing `@/lib/*` domain reads | — | Tool handlers call same LOCF / NW / debts / income / grace paths as pages | **Always** — MCP is a thin transport over existing reads |
| `@modelcontextprotocol/server` Host/Origin guards | 2.0.0 | `hostHeaderValidationResponse` + `originValidationResponse` + `localhostAllowedHostnames` / `localhostAllowedOrigins` | Wrap MCP route **before** handler — DNS-rebinding defense while container binds `0.0.0.0` |
| Optional shared-secret header | env only | Lightweight local auth (`Authorization: Bearer …`) | Only if docs need non-browser CLI lock; **not** OAuth/CIMD for v1.4 |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| MCP Inspector / `curl` JSON-RPC | Smoke Streamable HTTP endpoint | Verify POST initialize + tools/list before CLI wiring |
| Claude Code CLI | External agent client | `claude mcp add --transport http wallet http://127.0.0.1:3000/api/mcp` |
| Cursor (`mcp.json` / CLI) | External agent client | Prefer `"type": "http"` + `url` (CLI rejects/`streamable-http` can drop whole file) |
| Vitest | Tool adapter + guard unit tests | No live MCP client required for domain math |

## Installation

```bash
# v1.4 — only these new runtime deps
npm install mcp-handler@^2 @modelcontextprotocol/server@^2

# Already present — do not bump for MCP alone
# next@16.3.4 zod@4.5.4 prisma@7.10.0 vitest@4.1.11
```

**Integration sketch (opinionated):**

```typescript
// src/app/api/mcp/route.ts
import { createMcpHandler } from "mcp-handler";
import {
  hostHeaderValidationResponse,
  localhostAllowedHostnames,
  localhostAllowedOrigins,
  originValidationResponse,
} from "@modelcontextprotocol/server";
import { z } from "zod";
// register read-only tools that call @/lib/* — no mutations

export const runtime = "nodejs"; // Prisma / better-sqlite3
export const dynamic = "force-dynamic";

const mcp = createMcpHandler(
  (server) => {
    server.registerTool(
      "wallet_ping",
      {
        description: "Liveness check for wallet MCP",
        inputSchema: z.object({}),
      },
      async () => ({ content: [{ type: "text", text: "ok" }] }),
    );
    // …accounts, balances/NW, FX, debts, income, grace — read-only
  },
  { serverInfo: { name: "wallet", version: "1.4.0" } },
);

async function handle(req: Request) {
  const rejected =
    hostHeaderValidationResponse(req, localhostAllowedHostnames()) ??
    originValidationResponse(req, localhostAllowedOrigins());
  if (rejected) return rejected;
  return mcp(req);
}

export { handle as GET, handle as POST, handle as DELETE };
```

**Client docs targets (localhost):**

| Client | Config |
|--------|--------|
| Claude Code | `claude mcp add --transport http wallet http://127.0.0.1:3000/api/mcp` — JSON: `"type": "http"`, `"url": "…"` (`streamable-http` alias OK in Claude) |
| Cursor IDE / CLI | `.cursor/mcp.json` → `"type": "http"`, `"url": "http://127.0.0.1:3000/api/mcp"` — avoid `"type": "streamable-http"` on Cursor CLI |

**Docker:** no new image stages. Publish host `3000→3000` (already). CLI agents on host hit `127.0.0.1:3000`; container still listens `0.0.0.0` — Host/Origin guards required.

## Alternatives Considered

| Recommended | Alternative | When alternative wins |
|-------------|-------------|------------------------|
| `mcp-handler@2` + `@modelcontextprotocol/server@2` | Raw `@modelcontextprotocol/sdk@1.30.0` + `WebStandardStreamableHTTPServerTransport` per-request | Only if forced to stay on SDK v1; more wiring, dual-package risk, weaker Next DX |
| App Router Route Handler (same process) | Sidecar Express/Hono MCP on second port | Never for v1.4 goal — breaks “same Next.js process” + Docker simplicity |
| Streamable HTTP (single `/api/mcp`) | Legacy HTTP+SSE (`SSEServerTransport` + `/sse` + `/message`) | Never as primary — Claude Code marks SSE deprecated; mcp-handler 2.x removed it |
| Stateless factory per request | Stateful sessions + Redis | Never for local single-user read-only; mcp-handler 2.x dropped Redis |
| Host/Origin localhost guards | Full OAuth / CIMD | Defer — single local user; OAuth is for public remote MCP |
| Direct HTTP clients | `mcp-remote` stdio bridge | Only document as fallback for **stdio-only** clients; Claude Code + Cursor speak HTTP |

## What NOT to Use

| Avoid | Why | Use instead |
|-------|-----|-------------|
| `@modelcontextprotocol/sdk` 1.x **and** server 2.x together | Two protocol stacks; confusing imports; zod peer drift | Only `@modelcontextprotocol/server@^2` (+ `mcp-handler@^2`) |
| `@vercel/mcp-adapter` | Renamed/superseded by `mcp-handler` | `mcp-handler@2.1.1` |
| `mcp-handler@1.x` | Still tied to SDK 1.x + old SSE/Redis options | `mcp-handler@^2` |
| Next.js **custom server** / `server.js` | Breaks standalone Docker output; fights App Router | Route Handler only |
| Express / Fastify / Hono **sidecar** process | Second port, second lifecycle, not “in-app” | Same-process `/api/mcp` |
| `SSEServerTransport` as main surface | Deprecated remote transport; dual endpoints | Streamable HTTP via `createMcpHandler` |
| Redis / session stores | Useless for stateless read-only local MCP | Stateless handler (default) |
| OAuth / CIMD / `withMcpAuth` as MVP | Overkill for localhost single-user | Host/Origin guards (+ optional bearer later) |
| AI SDK / chat UI / agent spawn packages | Explicitly OOS (no chat, no subprocess agent) | External CLI connects to URL |
| Write/mutate MCP tools | Locked OOS for v1.4 | Read-only `registerTool` over existing libs |
| `window.confirm` / new UI | No in-app assistant UI this milestone | Docs only |

## Stack Patterns by Variant

**If `npm run dev` on host (no Docker):**
- MCP URL `http://127.0.0.1:3000/api/mcp` (or whatever `next dev` port)
- Same Route Handler; Host headers are already localhost

**If Docker published port:**
- Same URL from host CLI via published port
- Keep `HOSTNAME=0.0.0.0` for container listen; **do not** expose MCP without Host/Origin checks
- Prefer documenting `127.0.0.1` over `localhost` to avoid IPv6 surprises

**If a client only supports stdio:**
- Document `npx mcp-remote http://127.0.0.1:3000/api/mcp` as bridge — do **not** change server transport

**If tools need mid-call progress streams:**
- Leave default Streamable HTTP streaming; otherwise consider `responseMode: 'json'` on handler for simpler read-only JSON responses (SDK drops mid-call notifications in json mode)

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `mcp-handler@2.1.1` | `@modelcontextprotocol/server@^2.0.0`, `next@>=13`, Node **≥20** | Wallet: Next 16.3.4 + Node 24 image — OK |
| `@modelcontextprotocol/server@2.0.0` | `zod@^4.2.0` | Wallet `zod@4.5.4` — OK |
| Claude Code `--transport http` | Streamable HTTP endpoint | Prefer over `--transport sse` |
| Cursor CLI MCP | `"type": "http"` | `"streamable-http"` can break CLI config parse |
| Prisma / better-sqlite3 | `runtime = 'nodejs'` on MCP route | Edge runtime incompatible with native SQLite |

## Sources

- npm `mcp-handler@2.1.1` README — Next.js `createMcpHandler` mount; Streamable HTTP; SSE removed in 2.x; peer `@modelcontextprotocol/server@^2` — **HIGH** (registry + package tarball)
- npm `@modelcontextprotocol/server@2.0.0` — `createMcpHandler`, Host/Origin validation exports — **HIGH**
- Official MCP TS docs — [Serve over HTTP](https://ts.sdk.modelcontextprotocol.io/v2/serving/http.html) — factory per request, Streamable HTTP, localhost guards — **HIGH**
- Claude Code docs — [MCP servers](https://code.claude.com/docs/en/mcp-servers) — `--transport http`, SSE deprecated, `type: http` / `streamable-http` alias — **HIGH**
- Cursor docs — [MCP](https://cursor.com/docs/mcp) + help — remote `url` Streamable HTTP; forum note: CLI wants `type: http` not `streamable-http` — **HIGH** / CLI quirk **MEDIUM**
- Existing wallet `package.json` + `Dockerfile` — Next 16.3.4, Zod 4.5.4, Node 24, port 3000 — **HIGH**

---
*Stack research for: Wallet v1.4 in-app read-only MCP (HTTP Streamable)*
*Researched: 2026-09-10*
