# Phase 23: MCP Host + Localhost Safety - Research

**Researched:** 2026-09-10
**Domain:** In-process Streamable HTTP MCP host + Host/Origin localhost guards (Next.js App Router)
**Confidence:** HIGH (export shapes + guards verified from npm tarballs; NFT post-build verify remains MEDIUM)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
#### Localhost allowlist
- **D-01:** Accept Host values `127.0.0.1`, `localhost`, and `[::1]` (full loopback). — **Reversibility:** reversible
- **D-02:** Origin uses the same allowlist; missing Origin is allowed (curl/CLI); non-loopback Origin is rejected even when Host is good.
- **D-03:** Host port must equal the app listen port (`PORT`, default `3000`) — not any loopback port.
- **D-04:** Smoke may use either `127.0.0.1` or `localhost`; Phase 26 connect docs prefer documenting `http://127.0.0.1:3000/api/mcp`.

#### Host-phase tool surface
- **D-05:** Phase 23 registers only `wallet_ping` (no capital/domain tools).
- **D-06:** `wallet_ping` returns `{ ok: true, service: "wallet-mcp", timestamp: <ISO> }`.
- **D-07:** Server instructions are minimal (“read-only localhost wallet MCP; tools expand later”) — no DISOL/INISO/GRISO copy (Phase 26 / CLI-01).
- **D-08:** Layout: `src/lib/mcp/*` (handler, guard, tools) + thin `src/app/api/mcp/route.ts` — Node runtime, `force-dynamic`, Streamable HTTP with `responseMode: "json"`, export GET/POST/DELETE as required by mcp-handler 2.x.

#### Reject behavior
- **D-09:** Bad Host/Origin → HTTP `403 Forbidden`.
- **D-10:** Body JSON includes reason discriminant `bad_host` or `bad_origin`.
- **D-11:** Log rejects at warn with Host/Origin header values (local single-user debug).
- **D-12:** No CORS headers on `/api/mcp` (CLI clients; non-loopback Origin already 403).

#### Done bar / smoke
- **D-13:** Phase done when curl can complete MCP initialize (+ tools/list) on loopback; MCP Inspector optional, not a blocker.
- **D-14:** Compose publish `127.0.0.1:3000:3000` verified via UAT checklist only (no file-assert test required this phase).
- **D-15:** Vitest this phase: localhost-guard unit tests (good/bad Host/Origin) + route smoke with mocked handler.
- **D-16:** Do not change `/api/health` — MCP discoverability stays Phase 26 docs.

### Claude's Discretion
- Origin policy (D-02), tool/layout choices (D-05, D-08), reject logging (D-11), CORS (D-12), UAT bar (D-13), health untouched (D-16) — user deferred to Claude; locked as above from research defaults.

### Folded Todos
- **Integrate local AI agent via subprocess** (`.planning/todos/pending/2026-09-05-integrate-local-ai-agent-via-subprocess.md`): superseded by v1.4 in-app MCP host — external CLI connects to localhost MCP; app must not spawn agent subprocess. Folded as explicit anti-goal for this phase / milestone.

### Deferred Ideas (OUT OF SCOPE)
- **Savings account type** with interest rate + accrual date → NW «Прогноз» chart — captured as `.planning/todos/pending/2026-09-10-savings-account-type-with-interest-nw-forecast.md` (not v1.4 MCP)
- Capital read tools (CAP-*) → Phase 24
- Side-ledger tools + isolation (SIDE-*, DISOL/INISO/GRISO in tool copy) → Phase 25–26
- Connect docs Claude/Cursor (CLI-02) → Phase 26
- Optional bearer AUTH-MCP-01, writes, in-app chat — Future Requirements / OOS
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HOST-01 | Running wallet app exposes in-process Streamable HTTP MCP at `/api/mcp` (same Next.js lifecycle as the UI; no sidecar, no agent subprocess) | Mount Node Route Handler via SDK/mcp-handler; `runtime=nodejs` + `force-dynamic`; only `wallet_ping`; curl initialize + tools/list |
| HOST-02 | MCP accepts only localhost clients (Host/Origin guard + Compose host publish stays `127.0.0.1`) | Custom `localhost-guard` (hostname allowlist + PORT match + `bad_host`/`bad_origin`); Compose already `127.0.0.1:3000:3000` — UAT checklist only |
</phase_requirements>

## Summary

Phase 23 adds an in-process Streamable HTTP MCP endpoint at `/api/mcp` inside the existing Next 16.3.4 App Router process. No sidecar, no agent spawn, no `/api/health` changes, no capital tools. Compose already publishes `127.0.0.1:3000:3000` with container `HOSTNAME=0.0.0.0` — keep that; defense is Host/Origin (+ port) in app code.

**Critical adapter finding:** `mcp-handler@2.1.1` exports `createMcpRouteHandler as createMcpHandler` returning a bare `(Request) => Promise<Response>`, but its options object does **not** include `responseMode` and its implementation never forwards `responseMode` to the SDK (hardcodes `{ legacy: "stateless", onerror, maxSubscriptions }`). D-08 requires `responseMode: "json"`. **Primary recommendation:** implement the wallet handler with `@modelcontextprotocol/server` `createMcpHandler(factory, { responseMode: "json", legacy: "stateless" })` and mount `handler.fetch`; still install `mcp-handler@^2` per lock (peer/docs alignment) but do not use its create path until it exposes `responseMode`. Custom `localhost-guard` is required: SDK `hostHeaderValidationResponse` / `originValidationResponse` are port-agnostic and return JSON-RPC bodies without `bad_host` / `bad_origin`.

**Primary recommendation:** `src/lib/mcp/{create-handler,localhost-guard,tools/wallet-ping}.ts` + thin `src/app/api/mcp/route.ts` exporting guarded GET/POST/DELETE; Vitest guard units + mocked route smoke; curl initialize UAT; leave Compose + health alone.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Streamable HTTP MCP mount `/api/mcp` | Frontend Server (SSR) / Node Route Handler | — | Same Next process as UI; Fetch Route Handler |
| Host/Origin/port allowlist | Frontend Server (SSR) | — | Must run before handler; DNS-rebinding defense |
| `wallet_ping` tool | API / Backend (in-process) | — | Protocol liveness only; no DB |
| Compose loopback publish | CDN / Static / Deploy | — | Already `127.0.0.1:3000:3000`; UAT verify only |
| SQLite / Prisma | Database / Storage | — | Not used Phase 23 beyond existing app |

## Project Constraints (from .cursor/rules/)

No `.cursor/rules/` files present in this repo. Actionable constraints from `AGENTS.md`:

- This Next.js has breaking changes vs training data — read `node_modules/next/dist/docs/` before writing route/runtime code. `[VERIFIED: AGENTS.md]`
- Before UAT / `/gsd-verify-work`: read `.planning/OPERATOR.md`; agent drives `npm run dev` + Orca. `[VERIFIED: AGENTS.md]`

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.3.4 (pinned) | App Router Route Handler host | Existing app; `/api/health` pattern |
| `@modelcontextprotocol/server` | **2.0.0** (`^2`) | `createMcpHandler`, `McpServer`, `registerTool`, Host/Origin validators | Official MCP TS server v2; Streamable HTTP; `responseMode` |
| `mcp-handler` | **2.1.1** (`^2`) | Locked install; Next-oriented adapter | Peer of server ^2; **do not use create path for D-08** until responseMode forwarded |
| Zod | 4.5.4 (pinned) | Tool `inputSchema` | App standard; server peer `zod@^4.2.0` |
| Vitest | 4.1.11 (pinned) | Guard unit + route smoke | Existing `src/**/*.test.ts` |
| Node | 24 (Dockerfile + local v24.5.0) | Runtime | MCP packages require Node ≥20 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `validateHostHeader` / `validateOriginHeader` | 2.0.0 | Parse + hostname allowlist | Inside custom guard (reuse parse logic) |
| `localhostAllowedHostnames()` / `localhostAllowedOrigins()` | 2.0.0 | Default allowlist `localhost`, `127.0.0.1`, `[::1]` | Seed D-01/D-02 allowlist — then add port check |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| SDK `createMcpHandler` + `.fetch` | `mcp-handler` `createMcpHandler` | Simpler Next function export, but **cannot set `responseMode: "json"`** in 2.1.1 |
| Custom Host/Origin guard | Raw `hostHeaderValidationResponse` | Wrong body (JSON-RPC only) + **port-agnostic** — violates D-03/D-10 |
| Sidecar / stdio MCP | — | Forbidden by HOST-01 / milestone |

**Installation:**

```bash
npm install mcp-handler@^2 @modelcontextprotocol/server@^2
```

**Version verification (this session):**

- `mcp-handler@2.1.1` — published `2026-08-13`; peer `@modelcontextprotocol/server@^2`, `next>=13`; engines `node>=20`; no `postinstall`. `[VERIFIED: npm registry]`
- `@modelcontextprotocol/server@2.0.0` — published `2026-07-27`; no `postinstall`. `[VERIFIED: npm registry]`

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `mcp-handler` | npm | ~1 yr lineage; 2.1.1 Aug 2026 | ~708k/wk | github.com/vercel/mcp-handler | **SUS** (`too-new`) | Flagged — planner `checkpoint:human-verify` before install |
| `@modelcontextprotocol/server` | npm | 2.0.0 Jul 2026 | ~3.5M/wk | github.com/modelcontextprotocol/typescript-sdk | **OK** | Approved |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** `mcp-handler` — real Vercel package + high downloads; SUS reason is age heuristic only. Still gate install with human-verify per protocol.

## Architecture Patterns

### System Architecture Diagram

```
External CLI / curl (host loopback)
        │  POST/GET/DELETE http://127.0.0.1:PORT/api/mcp
        │  Host: 127.0.0.1:PORT | Origin absent or loopback
        ▼
┌──────────────────────────────────────────────┐
│ Next.js Node process (dev or Compose web)    │
│ Compose host publish: 127.0.0.1:3000:3000    │
│ Container listen: HOSTNAME=0.0.0.0           │
│                                              │
│  route.ts (nodejs, force-dynamic)            │
│       │                                      │
│       ▼                                      │
│  withLocalhostGuard                          │
│   ├─ Host hostname ∈ {127.0.0.1,localhost,   │
│   │                  [::1]}                  │
│   ├─ Host port === PORT (default 3000)       │
│   ├─ Origin missing OK; else same hostnames  │
│   └─ fail → 403 + {reason:bad_host|bad_origin}│
│              + console.warn                  │
│       │ pass                                 │
│       ▼                                      │
│  SDK createMcpHandler.fetch                  │
│   (responseMode: json, legacy: stateless)    │
│       │                                      │
│       ▼                                      │
│  per-request McpServer + wallet_ping only    │
└──────────────────────────────────────────────┘
```

### Recommended Project Structure

```
src/
├── app/api/
│   ├── health/route.ts          # DO NOT TOUCH (D-16)
│   └── mcp/
│       ├── route.ts             # NEW — thin guarded exports
│       └── route.test.ts        # NEW — smoke w/ mocked handler
└── lib/mcp/
    ├── create-handler.ts        # SDK createMcpHandler + wallet tools
    ├── localhost-guard.ts       # Host/Origin/port + 403 body
    ├── localhost-guard.test.ts  # NEW — good/bad Host/Origin/port
    └── tools/
        └── wallet-ping.ts       # register wallet_ping only
```

### Pattern 1: Thin route + guarded SDK fetch

**What:** Route only exports segment config + wraps guard around `handler.fetch`.
**When to use:** Always for Phase 23.
**Example:**

```typescript
// Source: mcp-handler README shape adapted to SDK .fetch (responseMode)
// Official SDK: https://ts.sdk.modelcontextprotocol.io/v2/serving/http.html
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
```

### Pattern 2: SDK per-request factory + responseMode json

**What:** Factory builds fresh `McpServer`, registers tools, returns server; options pin JSON responses.
**When to use:** Always (D-08).
**Example:**

```typescript
// Source: @modelcontextprotocol/server@2.0.0 CreateMcpHandlerOptions
// PerRequestResponseMode = 'auto' | 'sse' | 'json'
import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { registerWalletPing } from "./tools/wallet-ping";

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
```

### Pattern 3: Custom localhost guard (port + discriminant)

**What:** Reuse SDK validators for hostname parse; add PORT equality; return D-09/D-10 body; warn-log.
**When to use:** Always — do not call `hostHeaderValidationResponse` / `originValidationResponse` for the final Response (wrong body; no port).
**Example:**

```typescript
// Source: validateHostHeader docs — allowlist hostnames only, port-agnostic
// [VERIFIED: @modelcontextprotocol/server@2.0.0 index.d.mts:149-178]
import {
  validateHostHeader,
  validateOriginHeader,
  localhostAllowedHostnames,
  localhostAllowedOrigins,
} from "@modelcontextprotocol/server";

export type GuardRejectReason = "bad_host" | "bad_origin";

function listenPort(): string {
  return process.env.PORT ?? "3000";
}

function hostPortOk(hostHeader: string | null): boolean {
  // Parse hostname+port from Host; require port === listenPort()
  // Missing port: reject unless listenPort is default for scheme [ASSUMED — see Open Questions]
  ...
}

export function withLocalhostGuard(req: Request): Response | undefined {
  const host = req.headers.get("host");
  const origin = req.headers.get("origin");
  const hostResult = validateHostHeader(host, localhostAllowedHostnames());
  if (!hostResult.ok || !hostPortOk(host)) {
    console.warn("[mcp] reject bad_host", { host, origin });
    return Response.json(
      { error: "Forbidden", reason: "bad_host" },
      { status: 403 },
    );
  }
  const originResult = validateOriginHeader(origin, localhostAllowedOrigins());
  if (!originResult.ok) {
    console.warn("[mcp] reject bad_origin", { host, origin });
    return Response.json(
      { error: "Forbidden", reason: "bad_origin" },
      { status: 403 },
    );
  }
  return undefined;
}
```

### Anti-Patterns to Avoid

- **Using `mcp-handler` create path expecting `responseMode: "json"`:** 2.1.1 does not forward it. `[VERIFIED: mcp-handler@2.1.1 dist/index.mjs]`
- **Relying only on SDK `*ValidationResponse` helpers:** JSON-RPC body; no `bad_host`/`bad_origin`; port ignored. `[VERIFIED: server@2.0.0 index.mjs]`
- **`runtime = 'edge'`:** better-sqlite3 / future tools need Node; Edge forbidden. `[VERIFIED: research/STACK.md + health Node pattern]`
- **Widening Compose to `0.0.0.0:3000`:** HOST-02 / OOS LAN expose.
- **Spawning agent subprocess / stdio sidecar:** folded anti-goal.
- **Extending `/api/health`:** D-16.
- **Adding CORS `Access-Control-*`:** D-12.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| MCP Streamable HTTP protocol | Custom JSON-RPC router | `@modelcontextprotocol/server` `createMcpHandler` | Era negotiation, Accept handling, session 405s |
| Host header parsing (IPv6 brackets) | Ad-hoc split | `validateHostHeader` | Documented `[::1]:port` handling |
| Origin missing-vs-invalid rules | Ad-hoc | `validateOriginHeader` | Missing Origin passes; opaque `null` rejects |
| Next Route Handler plumbing | Custom server.js | App Router `route.ts` | Matches Docker standalone |

**Key insight:** Hand-roll only the **policy layer** (port + reject discriminant + warn log). Protocol + header parsing stay in the SDK.

## Common Pitfalls

### Pitfall 1: mcp-handler vs SDK `createMcpHandler` shape mismatch
**What goes wrong:** Code copies STACK.md sketch `createMcpHandler((server)=>…, { responseMode })` from wrong package; TypeScript fails or `responseMode` silently ignored.
**Why it happens:** Same export name, different APIs — mcp-handler takes initialize callback on pre-built server and returns a function; SDK takes factory returning `McpServer` and returns `{ fetch, close, … }`.
**How to avoid:** Import create from `@modelcontextprotocol/server`; mount `.fetch`. Treat mcp-handler as install-only until responseMode lands upstream.
**Warning signs:** Options type has no `responseMode`; handler has no `.fetch`.

### Pitfall 2: Port-agnostic Host allowlist
**What goes wrong:** `Host: 127.0.0.1:9999` accepted while app listens on 3000.
**Why it happens:** SDK docs: allowlist is hostname-only / port-agnostic. `[VERIFIED: server@2.0.0 index.d.mts:161-165]`
**How to avoid:** Explicit PORT check in `localhost-guard` (D-03).
**Warning signs:** Guard unit tests omit wrong-port cases.

### Pitfall 3: Wrong 403 body shape
**What goes wrong:** Clients/tests expect `reason: bad_host|bad_origin`; SDK helper returns `{ jsonrpc, error: { code: -32000, message }, id: null }`.
**How to avoid:** Custom Response.json per D-10.
**Warning signs:** Tests assert JSON-RPC error code instead of `reason`.

### Pitfall 4: Docker localhost confusion
**What goes wrong:** Change container bind or widen host publish “so MCP works”.
**How to avoid:** Keep `HOSTNAME=0.0.0.0` inside + `127.0.0.1:3000:3000` on host; agents hit published loopback. `[VERIFIED: docker-compose.yml:4-10]`
**Warning signs:** Diff in `docker-compose.yml` ports.

### Pitfall 5: Standalone NFT miss
**What goes wrong:** Production image `Cannot find module '@modelcontextprotocol/server'`.
**How to avoid:** After first `npm run build` / Docker build, confirm packages under `.next/standalone/node_modules`; if missing, extend `outputFileTracingIncludes` (existing pattern for prisma). `[CITED: nextjs.org/docs outputFileTracingIncludes]`
**Warning signs:** Works in `next dev`, fails in Compose.

### Pitfall 6: Expecting GET/DELETE to do more than 405
**What goes wrong:** Smoke fails on GET SSE.
**Why it happens:** Stateless legacy mode answers GET/DELETE session ops with 405. `[VERIFIED: server CreateMcpHandlerOptions legacy:'stateless']`
**How to avoid:** Export methods anyway (D-08 / client compatibility); curl smoke focuses on POST initialize + tools/list.

## Code Examples

### wallet_ping registration

```typescript
// Source: mcp-handler README registerTool + D-06 payload
import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

export function registerWalletPing(server: McpServer) {
  server.registerTool(
    "wallet_ping",
    {
      description: "Liveness check for wallet MCP transport",
      inputSchema: z.object({}),
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
```

### curl initialize smoke (D-13)

```bash
# Host must include listen port (D-03). Prefer 127.0.0.1 (D-04 / Phase 26 docs).
curl -sS -D- \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'Host: 127.0.0.1:3000' \
  --data '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"curl","version":"0.0.0"}}}' \
  http://127.0.0.1:3000/api/mcp

# Then tools/list (same headers; include MCP-Protocol-Version if initialize negotiated one)
curl -sS \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'Host: 127.0.0.1:3000' \
  --data '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' \
  http://127.0.0.1:3000/api/mcp
```

### Vitest guard cases (D-15)

Mirror `src/app/api/health/route.test.ts` style (`vi.mock` + `Request` construction):

| Case | Expect |
|------|--------|
| `Host: 127.0.0.1:3000`, no Origin | pass |
| `Host: localhost:3000`, no Origin | pass |
| `Host: [::1]:3000`, no Origin | pass |
| `Host: evil.com:3000` | 403 `bad_host` |
| `Host: 127.0.0.1:9999` | 403 `bad_host` |
| Good Host + `Origin: https://evil.com` | 403 `bad_origin` |
| Good Host + `Origin: http://127.0.0.1:3000` | pass |

Route smoke: mock `createWalletMcpHandler` / `.fetch` to return `Response.json({ ok: true })`; assert guard short-circuits before fetch on bad Host.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| HTTP+SSE dual `/sse`+`/message` | Single Streamable HTTP mount | mcp-handler 2.x / MCP 2025+ | One `/api/mcp` |
| `@modelcontextprotocol/sdk` monolith | `@modelcontextprotocol/server` v2 | 2026 | New import paths |
| `mcp-handler` Redis / SSE options | Stateless; Redis removed | mcp-handler 2.x | No session store |
| Sidecar stdio finance MCP | In-app Route Handler | Wallet v1.4 lock | Same process as UI |

**Deprecated/outdated:**

- `SSEServerTransport` as primary remote transport
- `@vercel/mcp-adapter` rename → `mcp-handler`
- Assuming `mcp-handler` options ≡ SDK `CreateMcpHandlerOptions` (responseMode gap)

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Missing Host port should be rejected when `PORT` is not 80/443 (require explicit `:PORT`) | localhost-guard | Strictness may break odd proxies that strip port — unlikely on loopback curl |
| A2 | Reject JSON body shape `{ error: "Forbidden", reason: "bad_host" \| "bad_origin" }` is acceptable (CONTEXT specifies discriminant, not full schema) | Reject behavior | Tests/docs may need exact key names if user prefers different envelope |
| A3 | Pure-JS MCP packages auto-trace into standalone without `outputFileTracingIncludes` | NFT | Docker prod break until includes added |
| A4 | `serverInfo.version: "1.4.0"` is fine for initialize (not tied to package.json `0.1.0`) | create-handler | Cosmetic only |

## Open Questions

1. **Missing Host port when PORT=3000**
   - What we know: SDK ignores port; D-03 requires port === PORT.
   - What's unclear: Should `Host: localhost` (no port) pass when listening on 3000?
   - Recommendation: **Reject** missing/non-matching port (A1). Curl with full URL always sends `:3000`.

2. **mcp-handler install vs import**
   - What we know: Locked to install both; create path cannot honor `responseMode: "json"`.
   - What's unclear: Whether human wants unused dependency.
   - Recommendation: Install both; implement with SDK; optional tiny comment in create-handler citing gap. SUS checkpoint on mcp-handler.

3. **Exact 403 JSON schema beyond `reason`**
   - Recommendation: Minimal `{ error: "Forbidden", reason }` unless discuss-phase reopens.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | MCP Node ≥20 | ✓ | v24.5.0 | — |
| npm | install | ✓ | 10.9.3 | — |
| curl | initialize smoke | ✓ | 8.20.0 | — |
| Docker | Compose UAT | ✓ | 29.5.3 | — |
| Vitest | D-15 tests | ✓ | 4.1.11 (package.json) | — |
| Context7 CLI | docs lookup | ✗ | — | npm pack + official WebFetch (used) |

**Missing dependencies with no fallback:** none for Phase 23 implementation.

**Missing dependencies with fallback:** Context7 → tarball + official docs.

Step 2.6: external tools identified and probed above.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.11 |
| Config file | `vitest.config.ts` (`environment: "node"`, `include: ["src/**/*.test.ts"]`) |
| Quick run command | `npx vitest run src/lib/mcp/localhost-guard.test.ts src/app/api/mcp/route.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HOST-01 | `/api/mcp` route exports call guarded MCP handler | unit/smoke | `npx vitest run src/app/api/mcp/route.test.ts` | ❌ Wave 0 |
| HOST-01 | `wallet_ping` registered / returns D-06 shape | unit | `npx vitest run src/lib/mcp/...` (optional thin) | ❌ Wave 0 |
| HOST-02 | Good Host/Origin pass; bad Host/Origin/port → 403 + reason | unit | `npx vitest run src/lib/mcp/localhost-guard.test.ts` | ❌ Wave 0 |
| HOST-02 | Compose `127.0.0.1:3000:3000` | manual UAT checklist | — | N/A (D-14) |
| HOST-01 | curl initialize + tools/list | manual smoke | curl (D-13) | N/A |

### Sampling Rate

- **Per task commit:** quick Vitest on new mcp test files
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green + curl initialize before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/lib/mcp/localhost-guard.test.ts` — HOST-02
- [ ] `src/app/api/mcp/route.test.ts` — HOST-01/02 route smoke with mocks
- [ ] Framework install: none — Vitest already present

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no (v1.4 localhost; AUTH-MCP-01 future) | — |
| V3 Session Management | no (stateless MCP) | `legacy: "stateless"` |
| V4 Access Control | yes (localhost-only) | Host/Origin/port guard → 403 |
| V5 Input Validation | yes | Zod tool schemas; Host/Origin parsers |
| V6 Cryptography | no | — |

### Known Threat Patterns for Streamable HTTP MCP on Next

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| DNS rebinding exfil via browser | Spoofing / Information Disclosure | Host + Origin allowlist (spec MUST Origin) |
| LAN exposure of finance MCP | Information Disclosure | Compose `127.0.0.1` publish; never `0.0.0.0` host bind |
| Wrong-port loopback service confusion | Spoofing | D-03 PORT match |
| CSRF from foreign Origin | Spoofing | Reject non-loopback Origin even if Host good |
| Accidental CORS widen | Elevation | No CORS headers (D-12) |

## Sources

### Primary (HIGH confidence)

- npm tarball `mcp-handler@2.1.1` — README Next mount; `export { createMcpRouteHandler as createMcpHandler }`; initializeMcpApiHandler hardcodes SDK options without `responseMode`
- npm tarball `@modelcontextprotocol/server@2.0.0` — `createMcpHandler` / `CreateMcpHandlerOptions.responseMode`; `localhostAllowedHostnames` → `["localhost","127.0.0.1","[::1]"]`; Host/Origin helpers + JSON-RPC 403 bodies
- Official MCP TS docs — Serve over HTTP / Host+Origin in front / `responseMode: 'json'` — https://ts.sdk.modelcontextprotocol.io/v2/serving/http.html
- MCP Spec Streamable HTTP security — Origin 403; prefer localhost bind — https://modelcontextprotocol.io/specification/2025-11-25/basic/transports
- Next.js route docs — `runtime = 'nodejs'`, HTTP methods including DELETE — `node_modules/next/dist/docs/.../route.md`
- In-repo: `package.json`, `docker-compose.yml` (`"127.0.0.1:3000:3000"`), `Dockerfile` (`PORT=3000`, `HOSTNAME=0.0.0.0`), `next.config.ts` standalone + NFT includes, `src/app/api/health/route.ts` + `route.test.ts`

### Secondary (MEDIUM confidence)

- Next.js `outputFileTracingIncludes` docs — https://nextjs.org/docs/app/api-reference/config/next-config-js/output
- Milestone research SUMMARY / ARCHITECTURE / STACK (aligned; responseMode gap is new vs STACK sketch)

### Tertiary (LOW confidence)

- None material for Phase 23 host planning

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — npm versions + peers verified
- Architecture: HIGH — route/guard layout matches locks; adapter gap verified in tarball
- Pitfalls: HIGH — export mismatch, port-agnostic SDK, NFT, Compose bind

**Research date:** 2026-09-10
**Valid until:** 2026-10-10 (MCP packages moving quickly — re-check mcp-handler responseMode forwarding on upgrade)
