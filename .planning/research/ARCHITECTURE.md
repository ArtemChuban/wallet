# Architecture Research

**Domain:** In-app MCP host (Streamable HTTP) inside Next.js wallet
**Researched:** 2026-09-10
**Confidence:** MEDIUM-HIGH (integration pattern HIGH from official SDK + mcp-handler; client-config quirks MEDIUM)

## Standard Architecture

### System Overview

Wallet already is a **single Node process**: Next.js App Router + Prisma 7 SQLite. v1.4 adds an MCP **route** in that same process — no sidecar container, no stdio child, no second port.

```
┌─────────────────────────────────────────────────────────────────┐
│  External CLI agent (Claude Code / Cursor) — OUTSIDE Docker     │
│  URL: http://127.0.0.1:3000/api/mcp  (type: http)               │
└───────────────────────────────┬─────────────────────────────────┘
                                │ Streamable HTTP
                                │ (JSON-RPC; optional SSE upgrade
                                │  only if notifications emit)
┌───────────────────────────────▼─────────────────────────────────┐
│  Docker Compose `web`  OR  `npm run dev`                        │
│  Host publish: 127.0.0.1:3000 → container :3000                 │
│  HOSTNAME=0.0.0.0 inside container (existing)                   │
├─────────────────────────────────────────────────────────────────┤
│  Next.js 16 App Router (same process)                           │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────────┐ │
│  │ RSC pages /    │  │ Server Actions │  │ Route: /api/mcp   │ │
│  │ Капитал, etc.  │  │ (mutations)    │  │ + /api/health     │ │
│  └───────┬────────┘  └───────┬────────┘  └─────────┬─────────┘ │
│          │                   │ mutate              │ read-only │
│          │                   ▼                     ▼           │
│          │            src/app/*/actions.ts   localhost guard   │
│          │                   │              mcp-handler        │
│          │                   │              tool registry      │
│          └───────────────────┴──────────────┬──────────────────┘ │
│                                             ▼                    │
│  Domain libs (UNCHANGED contracts)                               │
│  net-worth · balances · fx · debts · income · credit-grace ·    │
│  nw-forecast · locf · money · dates · db                         │
│  Isolation locks: DISOL / INISO / GRISO (read paths only)        │
│                                             ▼                    │
│  Prisma 7 + better-sqlite3 → SQLite volume                       │
└─────────────────────────────────────────────────────────────────┘
```

**Transport naming (important):** Milestone wording “HTTP/SSE” maps to **Streamable HTTP**. Legacy dual-endpoint HTTP+SSE (`/sse` + `/message`, 2024-11-05) is **removed** in `mcp-handler` 2.x. Prefer `responseMode: 'json'` for read-only tools so responses stay single JSON bodies (SSE only if a tool emits mid-call notifications).

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| External MCP client | Discover tools; call read tools | Claude Code `type: http` / Cursor `url` |
| Docker port publish | Localhost-only exposure | Existing `127.0.0.1:3000:3000` |
| `/api/mcp` route | Mount MCP in Next process | `src/app/api/mcp/route.ts` |
| Localhost guard | DNS-rebinding / Host+Origin | Wrapper before `handler.fetch` |
| MCP adapter | Protocol era negotiation | `mcp-handler` `createMcpHandler` → SDK v2 |
| Tool registry | Register read-only tools | `src/lib/mcp/register-tools.ts` |
| Read assemblers | Prisma load + LOCF + domain compute | `src/lib/mcp/reads/*` (mirror pages) |
| Domain libs | Pure / shared business math | Existing `src/lib/*` — **reuse, don’t fork** |
| Server actions | Mutations only | **Never called from MCP tools** |
| Prisma / SQLite | Persistence | Existing `@/lib/db` |

## Recommended Project Structure

```
src/
├── app/
│   └── api/
│       ├── health/
│       │   └── route.ts          # existing readiness (unchanged)
│       └── mcp/
│           └── route.ts          # NEW — GET/POST → guarded MCP handler
├── lib/
│   ├── db.ts                     # reuse
│   ├── net-worth.ts              # reuse
│   ├── balances.ts / fx.ts / locf.ts / debts.ts / income.ts
│   ├── credit-grace.ts / nw-forecast.ts / money.ts / dates.ts
│   └── mcp/                      # NEW — MCP host layer only
│       ├── create-handler.ts     # createMcpHandler + responseMode json
│       ├── localhost-guard.ts    # Host/Origin allowlist → 403 else
│       ├── serialize.ts          # BigInt → string (same as RSC pages)
│       ├── register-tools.ts     # wires all tools onto server
│       ├── tools/
│       │   ├── accounts.ts
│       │   ├── net-worth.ts
│       │   ├── fx.ts
│       │   ├── debts.ts
│       │   ├── income.ts
│       │   └── grace.ts
│       └── reads/                # optional extract; page-parity loaders
│           ├── load-accounts-asof.ts
│           ├── load-net-worth-asof.ts
│           └── ...
├── app/*/actions.ts              # MODIFY? no — stay mutation-only
└── package.json                  # ADD mcp-handler + @modelcontextprotocol/server
```

### Structure Rationale

- **`app/api/mcp`:** Same seam as existing `/api/health` — Fetch-native Route Handler, no custom server.
- **`lib/mcp`:** Keeps protocol/adapter out of domain libs; tools are thin adapters over reads.
- **`lib/mcp/reads`:** Prefer extracting page-parity loaders here (or later refactor pages to import them) so MCP and UI share LOCF + isolation math.
- **Do not put tools under `actions.ts`:** Actions are write surface; MCP v1.4 is read-only.

## Architectural Patterns

### Pattern 1: In-process Route Handler host (no sidecar)

**What:** MCP lives as `route.ts` exporting `GET`/`POST` (optionally `DELETE` if client expects it; stateless handler may 405). Same Node lifecycle as Next / Docker `entrypoint`.
**When to use:** Always for this milestone — PROJECT locks “same Next.js process”.
**Trade-offs:** Pros: one port, one SQLite connection path, no Compose service. Cons: MCP availability = app availability; must not block UI with long tool work (keep queries bounded).

**Example:**
```typescript
// src/app/api/mcp/route.ts
import { createWalletMcpHandler } from "@/lib/mcp/create-handler";
import { withLocalhostGuard } from "@/lib/mcp/localhost-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const mcp = createWalletMcpHandler();
const handle = withLocalhostGuard((req) => mcp(req));

export { handle as GET, handle as POST };
```

### Pattern 2: Per-request server factory + shared Prisma singleton

**What:** `createMcpHandler` factory builds a **fresh** tool-registered server per HTTP request (stateless). Close over module-scoped `prisma` from `@/lib/db` — do not create a new PrismaClient per tool call.
**When to use:** Always with SDK v2 / mcp-handler 2.
**Trade-offs:** Stateless = easy Docker scale-of-one; no Redis/session store. Tool registration must stay cheap.

**Example:**
```typescript
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { registerWalletTools } from "./register-tools";

export function createWalletMcpHandler() {
  return createMcpHandler(
    (server) => {
      registerWalletTools(server);
    },
    { responseMode: "json" }, // read-only: avoid SSE upgrade
  );
}
```

### Pattern 3: Read assemblers over domain libs (page parity)

**What:** Each tool loads Prisma rows the same way pages do (`ensureSqlitePragmas` → batch findMany → `firstHitLocfMap` → `computeNetWorthRows` / debt totals / income list / grace membership), then serializes BigInt.
**When to use:** Every domain tool. Never reimplement LOCF or NW inclusion in the tool body.
**Trade-offs:** Shared assemblers prevent UI↔MCP drift; extracting from fat `page.tsx` is a small refactor but pays for tests.

**Example:**
```typescript
// tool handler sketch
async ({ asOfDate }) => {
  const rows = await loadNetWorthAsOf(asOfDate ?? calendarDateToday("Europe/Moscow"));
  // DISOL: debts never enter computeNetWorthRows inputs
  // INISO/GRISO: forecast tools separate; historical NW loader never pulls income/grace into LOCF
  return { content: [{ type: "text", text: JSON.stringify(rows) }] };
};
```

### Pattern 4: Localhost-safe binding (defense in depth)

**What:** Compose already publishes `127.0.0.1:3000`. Inside the app, reject non-loopback `Host` / bad `Origin` before MCP handler (SDK does **not** validate these). Optional shared secret header later — OOS for single-user local v1.4 unless phase research demands it.
**When to use:** Before shipping connect docs.
**Trade-offs:** Header checks stop browser DNS-rebinding; they do not replace wrong Compose bind (`0.0.0.0:3000` on host would be a deploy mistake).

## Data Flow

### Request Flow

```
CLI agent tool call
    ↓
HTTP POST http://127.0.0.1:3000/api/mcp  (Streamable HTTP / JSON-RPC)
    ↓
Next Route Handler (nodejs, force-dynamic)
    ↓
localhost Host/Origin guard → 403 if fail
    ↓
mcp-handler createMcpHandler → per-request McpServer
    ↓
registerTool handler (read-only)
    ↓
lib/mcp/reads → prisma + locf + domain pure fn
    ↓
serialize BigInt → JSON text content[]
    ↓
HTTP 200 JSON body (responseMode json)
```

### State Management

MCP host is **stateless**. No session store. App UI state unchanged. SQLite remains single writer via existing Prisma client; MCP only reads.

### Key Data Flows

1. **Accounts / balances / NW:** Same as `/` and `/accounts` — LOCF snapshots + FX → `computeNetWorthRows`. Credit debt reduces NW; available never asset.
2. **FX:** Dated rates via existing LOCF maps / `getRateAsOf`; honesty flags when rate missing (exclude reason).
3. **Debts:** `computeDebtPrimaryTotals` / remaining helpers — **never** mixed into NW (DISOL-01).
4. **Income:** `listAllInRange` / stats — **never** writes BalanceSnapshot; NW history tools must not call income into LOCF (INISO-01). Forecast tool may use `buildNetWorthForecastSeries` as overlay-only.
5. **Grace:** Obligation list / `openGraceForecastMembership` — forecast overlay only; never into historical NW LOCF (GRISO-01).

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Single local user (this product) | Monolith Route Handler is correct; no sidecar |
| Multiple CLI clients on same host | Stateless handler OK; SQLite busy_timeout already set |
| Remote / multi-user | Out of scope — would need auth + HTTPS; do not widen Compose bind |

### Scaling Priorities

1. **First bottleneck:** Accidental full-table / unbounded history in tools — cap date ranges; reuse page batch queries.
2. **Second bottleneck:** SQLite lock contention if future write tools appear — keep v1.4 read-only.

## Anti-Patterns

### Anti-Pattern 1: Sidecar / second process MCP

**What people do:** Separate `mcp-server` Compose service or `npx` stdio server that opens its own Prisma.
**Why it's wrong:** Violates milestone lock; dual DB handles; lifecycle desync; extra port.
**Do this instead:** One Route Handler in the web container.

### Anti-Pattern 2: Tools calling Server Actions

**What people do:** `await updateBalance(...)` from MCP “for convenience”.
**Why it's wrong:** Breaks read-only milestone; couples agent to mutation UX/revalidation.
**Do this instead:** Tools → `lib/mcp/reads` + domain libs only.

### Anti-Pattern 3: Forking domain math inside tools

**What people do:** Ad-hoc “sum balances” in tool code.
**Why it's wrong:** Diverges from `computeNetWorthRows` / DISOL / LOCF honesty.
**Do this instead:** Call existing `src/lib/*` exports used by pages.

### Anti-Pattern 4: Edge runtime or legacy `/sse`+`/message`

**What people do:** `runtime = 'edge'` or mcp-handler 1.x Redis SSE paths.
**Why it's wrong:** better-sqlite3 needs Node; legacy HTTP+SSE removed in mcp-handler 2.x.
**Do this instead:** `runtime = 'nodejs'` + Streamable HTTP single mount `/api/mcp`.

### Anti-Pattern 5: Publishing `0.0.0.0:3000` on the host for “easier MCP”

**What people do:** Change Compose ports to expose LAN.
**Why it's wrong:** Unauthenticated personal finance data.
**Do this instead:** Keep `127.0.0.1:3000:3000` + in-app Host/Origin guard.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Claude Code | `claude mcp add --transport http wallet http://127.0.0.1:3000/api/mcp` | JSON must include `"type":"http"` + `url` |
| Cursor IDE / CLI | `.cursor/mcp.json` → `{ "url": "http://127.0.0.1:3000/api/mcp", "type": "http" }` | Prefer `type: http` over `streamable-http` for CLI parsers |
| Stdio-only clients | `npx -y mcp-remote http://127.0.0.1:3000/api/mcp` | Bridge only; app still does not spawn agents |
| MCP Inspector | Point at same URL | Dev smoke before docs |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| MCP route ↔ domain libs | Direct import | Read-only; no actions |
| MCP reads ↔ Prisma | `@/lib/db` singleton | Same WAL pragmas as pages |
| Pages ↔ MCP reads | Optional shared assemblers | Extract when first tool duplicates page loader |
| Mutations ↔ MCP | **None** | Write tools deferred |
| Docker ↔ host agents | Loopback port map | Agents on host → published 127.0.0.1:3000 |

### New vs Modified (explicit)

| Path | Change |
|------|--------|
| `src/app/api/mcp/route.ts` | **NEW** |
| `src/lib/mcp/**` | **NEW** |
| `package.json` / lockfile | **MODIFY** — add `mcp-handler@^2`, `@modelcontextprotocol/server@^2` (zod already 4.5.4) |
| `next.config.ts` | **MODIFY only if** NFT/tracing needs MCP pkgs (likely unnecessary; watch standalone) |
| `docker-compose.yml` | **NO change** if bind stays `127.0.0.1:3000:3000` |
| `Dockerfile` / entrypoint | **NO change** — same process |
| `src/lib/{net-worth,debts,income,credit-grace,...}.ts` | **NO contract change**; maybe tiny shared helper extract |
| `src/app/*/actions.ts` | **NO MCP wiring** |
| `src/app/page.tsx` etc. | **OPTIONAL** refactor to import shared reads |
| Docs (OPERATOR / README / connect snippet) | **NEW** client connect section |

### Suggested Build Order (dependency-aware)

1. **Deps + empty mount** — install `mcp-handler` + `@modelcontextprotocol/server`; `/api/mcp` with one `wallet_ping` tool; `runtime=nodejs` + `force-dynamic`; smoke via curl/Inspector.
2. **Localhost guard + Compose verify** — Host/Origin wrapper; confirm agents hit `127.0.0.1:3000` (dev + Docker); document URL.
3. **Serialize + read skeleton** — BigInt JSON helpers; `ensureSqlitePragmas` in tool path (mirror health/pages).
4. **Accounts + balances/NW tools** — reuse LOCF + `computeNetWorthRows` (foundation for everything else).
5. **FX tools** — rates as-of + honesty/exclude reasons.
6. **Debts tools** — totals/remaining; assert DISOL (no NW coupling).
7. **Income tools** — occurrences/stats; assert INISO (no BalanceSnapshot / historical LOCF writes or rewrites).
8. **Grace + forecast tools** — obligations / A′ overlay via `nw-forecast`; assert GRISO twin of income.
9. **Client connect docs** — Claude Code + Cursor snippets (`type: http`); optional `mcp-remote` fallback.
10. **Nyquist tests** — route smoke, guard 403, tool fixtures, isolation never-calls where applicable.

## Sources

- MCP TypeScript SDK — Serve over HTTP / `createMcpHandler` (Host/Origin must be mounted in front; per-request factory; `responseMode`) — https://ts.sdk.modelcontextprotocol.io/v2/serving/http — confidence MEDIUM (official docs fetch)
- `mcp-handler` 2.1 README — Next.js Route Handler mount; Streamable HTTP; legacy SSE removed; client URL + `mcp-remote` — https://cdn.jsdelivr.net/npm/mcp-handler@2.1.0/README.md — confidence MEDIUM
- Vercel changelog — mcp-handler 2.0 / SDK v2 / zod4 — https://vercel.com/changelog/latest-mcp-spec-now-supported-in-mcp-handler — confidence MEDIUM
- Claude Code MCP docs — `claude mcp add --transport http`; JSON `type: http` — https://code.claude.com/docs/en/mcp — confidence MEDIUM
- Cursor MCP help — remote `url` in `mcp.json` — https://cursor.com/help/customization/mcp — confidence MEDIUM
- Wallet codebase — `src/app/api/health/route.ts`, `src/lib/*`, `docker-compose.yml` `127.0.0.1:3000:3000`, `next.config.ts` standalone + `serverExternalPackages` for sqlite — confidence HIGH (local)
- PROJECT.md v1.4 locks — in-app host, read-only, no sidecar/subprocess/chat UI — confidence HIGH

## Gaps / Phase Research Flags

- Exact `mcp-handler` export shape vs raw `@modelcontextprotocol/server` `createMcpHandler` (callback-vs-factory) — verify at install time; both are Fetch handlers.
- Whether Cursor CLI on this machine needs `mcp-remote` bridge — smoke during connect-docs phase.
- Standalone NFT: confirm MCP packages traced into `.next/standalone` after first production build.
- Optional shared-secret header — not required for loopback single-user; revisit if bind ever widens.

---
*Architecture research for: in-app MCP host in Next.js wallet*
*Researched: 2026-09-10*
