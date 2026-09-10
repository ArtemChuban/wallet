# Phase 23: MCP Host + Localhost Safety - Pattern Map

**Mapped:** 2026-09-10
**Files analyzed:** 8
**Analogs found:** 7 / 8

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/app/api/mcp/route.ts` | route | request-response | `src/app/api/health/route.ts` | exact |
| `src/app/api/mcp/route.test.ts` | test | request-response | `src/app/api/health/route.test.ts` | exact |
| `src/lib/mcp/localhost-guard.ts` | middleware / utility | request-response | `src/app/api/health/route.ts` (JSON status body) + `src/lib/account-type.ts` (pure predicates) | partial |
| `src/lib/mcp/localhost-guard.test.ts` | test | request-response | `src/lib/account-type.test.ts` | role-match |
| `src/lib/mcp/create-handler.ts` | service / factory | request-response | `src/lib/db.ts` | role-match |
| `src/lib/mcp/tools/wallet-ping.ts` | service / utility | transform | `src/lib/validations/balance.ts` | partial |
| `package.json` (+ lock) | config | — | `package.json` | exact |
| `next.config.ts` | config | — | `next.config.ts` | exact (NFT only if needed) |

**Verify-only (no code change this phase):** `docker-compose.yml` ports `127.0.0.1:3000:3000`, `Dockerfile` `PORT=3000` / `HOSTNAME=0.0.0.0`, `src/app/api/health/route.ts` (D-16 do not touch).

## Pattern Assignments

### `src/app/api/mcp/route.ts` (route, request-response)

**Analog:** `src/app/api/health/route.ts`

**Imports + segment config** (lines 1–4):
```typescript
import { NextResponse } from "next/server";
import { ensureSqlitePragmas, prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
```

**Adapt for MCP:**
- Keep `export const dynamic = "force-dynamic"`.
- Add `export const runtime = "nodejs"` (Edge forbidden; health omits it because no native MCP deps yet).
- Prefer thin wrapper: import `@/lib/mcp/*`, no Prisma.
- Prefer Web `Response` / `Response.json` for guard rejects (matches RESEARCH D-09/D-10); health uses `NextResponse.json` — either OK for App Router; stay consistent within mcp module (`Response.json` in guard, route forwards).

**Core handler shape** (lines 10–24) — copy: async export, status + JSON body, no query params:
```typescript
export async function GET() {
  try {
    // ...
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch {
    return NextResponse.json({ status: "not_ready" }, { status: 503 });
  }
}
```

**MCP variant (from RESEARCH — mount pattern):** single `handle` → export as GET/POST/DELETE; guard short-circuit before `mcp.fetch`.

---

### `src/app/api/mcp/route.test.ts` (test, request-response)

**Analog:** `src/app/api/health/route.test.ts`

**Imports + mock-before-import** (lines 1–11):
```typescript
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
  ensureSqlitePragmas: vi.fn(),
}));

import { GET } from "./route";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
```

**Core smoke pattern** (lines 13–49):
```typescript
describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 503 when database is unreachable", async () => {
    vi.mocked(ensureSqlitePragmas).mockRejectedValue(new Error("db missing"));
    const res = await GET();
    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual({ status: "not_ready" });
  });
});
```

**Adapt for MCP route smoke (D-15):**
- `vi.mock("@/lib/mcp/create-handler", …)` returning `{ fetch: vi.fn() }` → `Response.json({ ok: true })`.
- Call exported `POST`/`GET` with `new Request("http://127.0.0.1:3000/api/mcp", { method, headers })`.
- Assert bad Host → 403 `{ reason: "bad_host" }` and `fetch` **not** called; good Host → `fetch` called.

---

### `src/lib/mcp/localhost-guard.ts` (middleware / utility, request-response)

**No exact Host/Origin guard in app.** Closest pieces:

**Analog A — JSON status responses:** `src/app/api/health/route.ts` lines 18–23:
```typescript
if (count < 1) {
  return NextResponse.json({ status: "not_ready" }, { status: 503 });
}
return NextResponse.json({ status: "ok" }, { status: 200 });
```
→ Guard returns `Response.json({ error: "Forbidden", reason: "bad_host" | "bad_origin" }, { status: 403 })` (D-09/D-10). Prefer plain `Response` so guard stays Next-agnostic.

**Analog B — pure allowlist predicates:** `src/lib/account-type.ts` lines 10–22:
```typescript
export function isCreditType(t: string): boolean {
  return t === "FIAT_CREDIT";
}

export function isAssetType(t: string): boolean {
  return (
    t === "ASSET" ||
    t === "FIAT_DEBIT" ||
    t === "CRYPTO" ||
    t === "CASH"
  );
}
```
→ Export small helpers (`listenPort`, host/port OK) + `withLocalhostGuard(req): Response | undefined`. Reuse SDK `validateHostHeader` / `validateOriginHeader` / `localhostAllowedHostnames()` for parse; **hand-roll only PORT match + discriminant body + `console.warn`**.

**Env default pattern** (from `src/lib/db.ts` line 11):
```typescript
const url = process.env.DATABASE_URL ?? "file:./data/wallet.db";
```
→ `process.env.PORT ?? "3000"` for D-03.

---

### `src/lib/mcp/localhost-guard.test.ts` (test, request-response)

**Analog:** `src/lib/account-type.test.ts`

**Table-style good/bad cases** (lines 1–22):
```typescript
import { describe, expect, it } from "vitest";
import {
  accountTypeLabel,
  isAssetType,
  isCreditType,
} from "./account-type";

describe("accountTypeLabel / soft-read helpers (QUICK-0i7)", () => {
  it("labels ASSET and legacy non-credit as Актив", () => {
    for (const t of ["ASSET", "FIAT_DEBIT", "CRYPTO", "CASH"] as const) {
      expect(accountTypeLabel(t)).toBe("Актив");
      expect(isAssetType(t)).toBe(true);
      expect(isCreditType(t)).toBe(false);
    }
  });
});
```

**Adapt:** build `Request` with Host/Origin headers; assert `undefined` vs 403 + `reason`. Cover RESEARCH matrix: loopback hosts, evil host, wrong port, evil Origin, missing Origin OK. Co-locate test next to module (`src/lib/**/*.test.ts` — already in `vitest.config.ts` include).

---

### `src/lib/mcp/create-handler.ts` (service / factory, request-response)

**Analog:** `src/lib/db.ts` (factory + module-level instance)

**Factory + export** (lines 9–16):
```typescript
function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? "file:./data/wallet.db";
  const adapter = new PrismaBetterSqlite3({ url, timeout: 5000 });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();
```

**Adapt:**
- `export function createWalletMcpHandler()` wrapping SDK `createMcpHandler(factory, { responseMode: "json", legacy: "stateless" })`.
- Factory: `new McpServer({ name: "wallet-mcp", version: "1.4.0" }, { instructions: "…" })` then `registerWalletPing(server)`.
- Import create from `@modelcontextprotocol/server` — **not** `mcp-handler` create path (responseMode gap).
- Module-level `const mcp = createWalletMcpHandler()` may live in route.ts (health-style) or here; prefer create once, reuse `.fetch`.

---

### `src/lib/mcp/tools/wallet-ping.ts` (service / utility, transform)

**Analog:** `src/lib/validations/balance.ts` (Zod `z.object` + named export)

**Zod import + schema** (lines 1–14):
```typescript
import { z } from "zod";

const asOfDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Укажите дату");

export const setBalanceSchema = z
  .object({
    accountId: z.coerce.number().int().positive(),
    amountMajor: z.string().trim().min(1, "Введите корректную сумму"),
    asOfDate: asOfDateSchema,
  })
  .strict();
```

**Adapt for tool:**
```typescript
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
No Prisma / domain libs. Empty `z.object({})` matches Zod-4 app pin (`zod@4.5.4`).

---

### `package.json` (config)

**Analog:** `package.json` dependencies block (lines 17–34)

**Pattern:** pin app deps beside `next` / `zod`; add:
```bash
npm install mcp-handler@^2 @modelcontextprotocol/server@^2
```
- Install both (lock); **implement with server SDK only**.
- SUS gate on `mcp-handler` before install (RESEARCH Package Legitimacy).
- Do not add Edge runtime packages.

---

### `next.config.ts` (config — conditional)

**Analog:** `next.config.ts` NFT includes (lines 10–17):
```typescript
outputFileTracingIncludes: {
  "/*": [
    "./node_modules/prisma/**/*",
    "./node_modules/@prisma/**/*",
    "./node_modules/better-sqlite3/**/*",
    "./src/generated/prisma/**/*",
  ],
},
```

**When:** only if standalone Docker miss `@modelcontextprotocol/server` after first build (Pitfall 5). Extend includes for MCP packages; keep `serverExternalPackages` for native sqlite only unless tracing proves otherwise.

---

## Shared Patterns

### App Router API segment config
**Source:** `src/app/api/health/route.ts` lines 4
**Apply to:** `src/app/api/mcp/route.ts`
```typescript
export const dynamic = "force-dynamic";
```
Plus MCP-only: `export const runtime = "nodejs"`.

### Path alias `@/`
**Source:** health route, vitest alias in `vitest.config.ts` lines 9–12
**Apply to:** all new `src/lib/mcp` and route imports
```typescript
resolve: {
  alias: {
    "@": path.resolve(__dirname, "./src"),
  },
},
```

### Vitest co-located `*.test.ts` + `vi.mock`
**Source:** `src/app/api/health/route.test.ts`, `vitest.config.ts` `include: ["src/**/*.test.ts"]`
**Apply to:** `localhost-guard.test.ts`, `route.test.ts`
- Mock at top before importing SUT.
- Assert `res.status` + `res.json()`.

### Env defaults
**Source:** `src/lib/db.ts` line 11; Compose/Dockerfile `PORT=3000`
**Apply to:** localhost-guard listen port
```typescript
process.env.PORT ?? "3000"
```

### Compose loopback publish (verify, do not widen)
**Source:** `docker-compose.yml` lines 4–10
```yaml
ports:
  - "127.0.0.1:3000:3000"
environment:
  HOSTNAME: "0.0.0.0"
  PORT: "3000"
```
**Apply to:** UAT checklist only (D-14). No file-assert test this phase.

### Error / reject body
**Source:** health status discriminant style (`status: "ok" | "not_ready"`)
**Apply to:** guard → `{ error: "Forbidden", reason: "bad_host" | "bad_origin" }` + HTTP 403. Log rejects with `console.warn("[mcp] reject …", { host, origin })` (no existing warn analog in `src/` — new but simple).

## No Analog Found

| File / concern | Role | Data Flow | Reason |
|----------------|------|-----------|--------|
| Host/Origin/port guard as first-class module | middleware | request-response | No `middleware.ts`; no header allowlist in `src/`. Copy health JSON responses + account-type predicates; protocol parse from SDK (RESEARCH Pattern 3). |
| MCP Streamable HTTP / `registerTool` | service | request-response | First MCP code in repo. Follow RESEARCH Patterns 1–2 + SDK docs; do not copy `.cursor/gsd-core` MCP server. |
| Optional `wallet-ping` unit test | test | transform | Not required by D-15; if added, mirror `account-type.test.ts` payload asserts. |

## Metadata

**Analog search scope:** `src/app/api/**`, `src/lib/**`, `vitest.config.ts`, `next.config.ts`, `docker-compose.yml`, `Dockerfile`, `package.json`; codegraph query/explore for route/force-dynamic/zod/vi.mock
**Files scanned:** ~45 under `src/lib` + 2 API routes + config files (tracked via `git ls-files`)
**Pattern extraction date:** 2026-09-10
**Tracked-source gate:** all named analogs verified tracked; excluded `.cursor/gsd-core` / `.claude/gsd-core` MCP mirrors
