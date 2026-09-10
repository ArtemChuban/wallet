# Project Research Summary

**Project:** Wallet (v1.4 Local MCP)
**Domain:** In-app read-only MCP host (Streamable HTTP) inside Next.js + Prisma SQLite personal-finance app
**Researched:** 2026-09-10
**Confidence:** HIGH

## Executive Summary

Wallet v1.4 is **not** a greenfield finance MCP and **not** a stdio sidecar. Peers (Beancount / GnuCash / Firefly) usually spawn a child process over a ledger file; Wallet already runs as a long-lived Next.js + SQLite Docker app on `127.0.0.1:3000`. Experts ship MCP as a **same-process Streamable HTTP route** that external Claude Code / Cursor CLIs call — wallet never spawns agents, never adds chat UI, never opens write tools.

**Recommended approach:** Add only `mcp-handler@^2` + `@modelcontextprotocol/server@^2` on the existing stack (Next 16.3.4, Prisma 7, Zod 4, Node 24). Mount `/api/mcp` as a Node Route Handler with Host/Origin localhost guards, `responseMode: 'json'`, and ~6–10 read-only tools that wrap existing `@/lib/*` (accounts, NW/balances, FX, debts, income, grace). Keep Compose publish `127.0.0.1:3000:3000`; document Claude `type: http` + Cursor `url` snippets.

**Key risks:** (1) Docker “localhost” confusion / widening host publish → LAN finance leak; (2) missing Origin/Host checks → DNS-rebinding exfil; (3) ad-hoc tool SQL that breaks DISOL/INISO/GRISO; (4) wrong transport or client `type` → “connected” but dead. Mitigate by shipping **host+guards before tools**, reuse domain libs only, CI-ban mutate imports under `lib/mcp/`, and UAT real CLI configs.

## Key Findings

### Recommended Stack

Reuse the app; do not replace core runtime. New deps are thin: official Vercel `mcp-handler` 2.x over MCP TS server v2 Streamable HTTP. No Redis, no custom server, no sidecar, no OAuth for v1.4. Edge runtime forbidden (better-sqlite3). Prefer documenting `127.0.0.1` over `localhost` (IPv6). Stdio clients get `mcp-remote` bridge docs only — server stays HTTP.

**Core technologies:**
- **Next.js 16.3.4 App Router** — same-process Route Handler host — already Dockerized; matches `/api/health`
- **Prisma 7 + better-sqlite3** — read-only tool backends — one SQLite path; no second opener
- **Zod 4.5.4** — tool `inputSchema` — app standard; MCP server peer `zod@^4.2.0`
- **mcp-handler ^2 + @modelcontextprotocol/server ^2** — Fetch MCP mount + Host/Origin helpers — SSE/Redis removed; Claude/Cursor expect Streamable HTTP
- **Vitest** — adapter + guard unit tests — keep Prisma out of pure math tests

Details: [STACK.md](./STACK.md)

### Expected Features

Table stakes = in-app Streamable HTTP on localhost + narrow typed read tools covering **all shipped domains** + isolation copy in instructions + dual-client connect docs. Differentiators = in-process (no sidecar), domain-honest DISOL/INISO/GRISO contracts, optional forecast overlay, partial-FX honesty. Anti-features = write tools, chat UI, stdio-only server, `0.0.0.0` publish, raw SQL tool, Firefly-scale tool dumps, OAuth.

**Must have (table stakes):**
- In-app Streamable HTTP MCP on same Next lifecycle — agents need a live URL
- Localhost bind + Host/Origin guards — spec security; Docker already loopback-publish
- Read-only tools: accounts, NW/balances as-of, FX, debts+totals, income, grace — peers always expose capital + side ledgers
- `readOnlyHint: true` + DISOL/INISO/GRISO in server/tool descriptions — stop agent invention
- Claude Code + Cursor connect docs (`type: http` / `url`) — PROJECT Active requirement

**Should have (competitive):**
- Forecast overlay tool (`get_forecast_overlay`) — “what happens to NW next?” without fake BalanceSnapshots
- Partial-FX / exclude reasons in JSON — same honesty as UI banners
- Optional bilingual (RU) descriptions — match product vocabulary

**Defer (v2+):**
- Write/mutate MCP tools — trust read path first
- In-app chat / agent spawn — Out of Scope
- OAuth / multi-user auth — single local user
- Stdio adapter package — only if a required client cannot HTTP

Details: [FEATURES.md](./FEATURES.md)

### Architecture Approach

Single Node process: external CLI → Streamable HTTP → `/api/mcp` → Host/Origin guard → mcp-handler per-request factory → `lib/mcp` tool registry → read assemblers → existing domain libs → Prisma singleton. Mutations stay in Server Actions only — never called from MCP. Prefer `src/lib/mcp/{create-handler,localhost-guard,register-tools,tools/*,reads/*}`; optional extract of page-parity loaders so UI and MCP share LOCF math.

**Major components:**
1. **`/api/mcp` Route Handler** — protocol mount (GET/POST/DELETE), `runtime=nodejs`, `force-dynamic`
2. **Localhost guard** — Host/Origin allowlist before handler (DNS-rebinding defense)
3. **Tool registry + reads** — thin adapters over `@/lib/*`; BigInt serialize; no actions
4. **Domain libs (unchanged contracts)** — net-worth, balances, fx, debts, income, credit-grace, nw-forecast
5. **Docker publish** — host `127.0.0.1:3000`; container still `HOSTNAME=0.0.0.0`

Details: [ARCHITECTURE.md](./ARCHITECTURE.md)

### Critical Pitfalls

1. **Docker bind confusion** — keep container `0.0.0.0` listen + host publish `127.0.0.1:3000:3000`; never open a second MCP port or widen publish
2. **No Origin/Host validation** — wrap every MCP request with SDK Host/Origin helpers before handler; no CORS `*`
3. **Wrong transport (legacy SSE-only / missing methods)** — one Streamable HTTP path; export GET+POST+DELETE; prefer `responseMode: 'json'`
4. **Reimplement domain math in tools** — call existing libs only; twin DISOL/INISO/GRISO tests
5. **Client docs wrong (`type` / path / app not running)** — copy-paste per-client snippets; prerequisite “start wallet first”; smoke initialize with curl

Details: [PITFALLS.md](./PITFALLS.md)

## Implications for Roadmap

Based on research, suggested phase structure (dependency-aware; matches pitfalls mapping + architecture build order):

### Phase 1: MCP Host + Transport + Localhost Safety
**Rationale:** Nothing else matters if endpoint, Node runtime, publish lock, or rebinding guards are wrong — pitfalls say security is not a later pass.
**Delivers:** Deps installed; `/api/mcp` with `wallet_ping`; Host/Origin guard; Compose verify still `127.0.0.1:3000:3000`; curl/Inspector initialize smoke.
**Addresses:** In-app Streamable HTTP endpoint; localhost bind + rebinding guards; health/discoverability path.
**Avoids:** Docker bind confusion; missing Origin/Host; incomplete Streamable HTTP; Edge/Redis/sidecar.
**Uses:** `mcp-handler@^2`, `@modelcontextprotocol/server@^2`, SDK Host/Origin helpers.

### Phase 2: Capital Read Tools (Accounts + NW/Balances + FX)
**Rationale:** Foundation every peer starts with; NW honesty is Core Value; FX honesty feeds conversion.
**Delivers:** `list_accounts`, `get_net_worth` / `get_account_balance`, `list_fx_rates`; BigInt serialize; page-parity read assemblers; `readOnlyHint` + isolation instructions scaffold.
**Addresses:** Accounts + NW/balances + FX tools (P1).
**Avoids:** Domain math fork; float money; unbounded dumps (as-of params).
**Implements:** `lib/mcp/tools/{accounts,net-worth,fx}` + shared reads.

### Phase 3: Side-Ledger Read Tools (Debts + Income + Grace) + Isolation Tests
**Rationale:** Agents will ask about Долги / Доход / Грейс; isolation locks must be enforced in same wave as tools.
**Delivers:** `list_debts`, `get_debt_totals`, `list_income`, `list_grace_obligations`; CI/path ban on `actions` / mutate under `mcp/`; DISOL/INISO/GRISO fixture tests; optional thin `get_forecast_overlay` if cheap.
**Addresses:** Debts + income + grace read tools; isolation copy; P2 forecast if thin.
**Avoids:** Mutate bleed; folding debts into NW; income/grace rewriting historical LOCF.
**Implements:** `lib/mcp/tools/{debts,income,grace}` (+ optional forecast).

### Phase 4: Connect Docs + Multi-Client UAT
**Rationale:** Endpoint without verified Claude/Cursor configs fails Active requirement; client quirks are MEDIUM confidence until smoked.
**Delivers:** Copy-paste Claude Code (`type: http`) + Cursor (`type: http` + `url`) docs; prerequisite “app must be running”; optional `mcp-remote` fallback note; real-client UAT.
**Addresses:** Dual-client connect docs (P1).
**Avoids:** Docs/`type` confusion; stdio-spawn docs; path drift (`/mcp` vs `/api/mcp`).

### Phase Ordering Rationale

- Host+guards before tools — unauthenticated finance MCP without Host/Origin is unsafe even if read-only
- Capital tools before side ledgers — shared LOCF/NW assemblers; debts/income/grace assert isolation against that foundation
- Docs last but same milestone — needs stable URL + proven transport; UAT catches Cursor `streamable-http` CLI quirks
- Grouping follows `lib/mcp` boundaries and pitfall-to-phase map: transport → tools+isolation → connect UAT

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** Exact `mcp-handler` vs `@modelcontextprotocol/server` `createMcpHandler` export shape at install; standalone NFT tracing of MCP pkgs into `.next/standalone`
- **Phase 4:** Whether this machine’s Cursor CLI needs `mcp-remote`; verify `type: http` vs `streamable-http` parser behavior live

Phases with standard patterns (skip research-phase):
- **Phase 2:** Thin wrappers over known `@/lib/net-worth|balances|fx` — well-documented in-repo
- **Phase 3:** Same pattern for debts/income/grace; isolation rules already locked in PROJECT/domain libs — plan with existing fixtures, not new ecosystem research

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official mcp-handler 2 / server 2 / MCP HTTP docs + pinned wallet package.json |
| Features | HIGH (locks) / MEDIUM (peers) | PROJECT.md + domain libs HIGH; peer/tool-count + client quirks MEDIUM |
| Architecture | MEDIUM-HIGH | Integration pattern HIGH from SDK + codebase; client-config quirks MEDIUM |
| Pitfalls | HIGH | Spec security warning + existing Compose pattern; CLI type strings MEDIUM |

**Overall confidence:** HIGH

### Gaps to Address

- **mcp-handler export shape** — verify at Phase 1 install; both are Fetch handlers; do not block roadmap
- **Cursor CLI transport string** — smoke in Phase 4; document `mcp-remote` only on real fail
- **Standalone NFT** — confirm MCP packages in production image after first build
- **Optional bearer header** — not required for loopback single-user; revisit only if bind widens
- **Forecast tool placement** — P2; ship in Phase 3 if thin, else v1.4.x after agent UAT pain
- **Exact route path** — research agrees `/api/mcp`; lock in Phase 1 and never drift docs

## Sources

### Primary (HIGH confidence)
- npm `mcp-handler@2.1.1` + `@modelcontextprotocol/server@2.0.0` — Next Route Handler, Streamable HTTP, Host/Origin exports
- MCP Spec transports (Streamable HTTP security: Origin, localhost) — https://modelcontextprotocol.io/specification/
- MCP TS docs — Serve over HTTP — https://ts.sdk.modelcontextprotocol.io/v2/serving/http.html
- Claude Code MCP docs — `--transport http`, `type: http` — https://code.claude.com/docs/en/mcp-servers
- Cursor MCP docs — remote `url` — https://cursor.com/docs/mcp
- Wallet codebase — `package.json`, `Dockerfile`, `docker-compose.yml` `127.0.0.1:3000:3000`, `src/lib/*`, `/api/health`
- `.planning/PROJECT.md` v1.4 locks — in-app, read-only, no sidecar/chat/writes

### Secondary (MEDIUM confidence)
- Vercel mcp-handler 2.0 changelog — SDK v2 / zod4
- Peer MCPs: mcp-beancount, gnucash-mcp, fireflyiii-mcp — tool-surface anti-patterns
- MCP tool annotations post — `readOnlyHint`
- Tenable WAS-114885 — DNS rebinding class issue for HTTP/SSE MCP
- Community Next.js MCP posts — GET/POST/DELETE, stateless sessionIdGenerator

### Tertiary (LOW confidence)
- Cursor forum / CLI quirks (`streamable-http` parse failures, SSE POST 405) — treat as Phase 4 UAT risk flags

---
*Research completed: 2026-09-10*
*Ready for roadmap: yes*
