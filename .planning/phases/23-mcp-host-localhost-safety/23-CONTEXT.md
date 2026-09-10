# Phase 23: MCP Host + Localhost Safety - Context

**Gathered:** 2026-09-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Running wallet exposes in-process Streamable HTTP MCP at `/api/mcp` inside the same Next.js process (no sidecar, no agent spawn), with localhost Host/Origin guards and Compose host publish remaining `127.0.0.1:3000:3000`. Requirements: HOST-01, HOST-02. Capital/side-ledger tools, connect docs, and isolation copy are later phases (24–26).

</domain>

<decisions>
## Implementation Decisions

### Localhost allowlist
- **D-01:** Accept Host values `127.0.0.1`, `localhost`, and `[::1]` (full loopback). — **Reversibility:** reversible
- **D-02:** Origin uses the same allowlist; missing Origin is allowed (curl/CLI); non-loopback Origin is rejected even when Host is good.
- **D-03:** Host port must equal the app listen port (`PORT`, default `3000`) — not any loopback port.
- **D-04:** Smoke may use either `127.0.0.1` or `localhost`; Phase 26 connect docs prefer documenting `http://127.0.0.1:3000/api/mcp`.

### Host-phase tool surface
- **D-05:** Phase 23 registers only `wallet_ping` (no capital/domain tools).
- **D-06:** `wallet_ping` returns `{ ok: true, service: "wallet-mcp", timestamp: <ISO> }`.
- **D-07:** Server instructions are minimal (“read-only localhost wallet MCP; tools expand later”) — no DISOL/INISO/GRISO copy (Phase 26 / CLI-01).
- **D-08:** Layout: `src/lib/mcp/*` (handler, guard, tools) + thin `src/app/api/mcp/route.ts` — Node runtime, `force-dynamic`, Streamable HTTP with `responseMode: "json"`, export GET/POST/DELETE as required by mcp-handler 2.x.

### Reject behavior
- **D-09:** Bad Host/Origin → HTTP `403 Forbidden`.
- **D-10:** Body JSON includes reason discriminant `bad_host` or `bad_origin`.
- **D-11:** Log rejects at warn with Host/Origin header values (local single-user debug).
- **D-12:** No CORS headers on `/api/mcp` (CLI clients; non-loopback Origin already 403).

### Done bar / smoke
- **D-13:** Phase done when curl can complete MCP initialize (+ tools/list) on loopback; MCP Inspector optional, not a blocker.
- **D-14:** Compose publish `127.0.0.1:3000:3000` verified via UAT checklist only (no file-assert test required this phase).
- **D-15:** Vitest this phase: localhost-guard unit tests (good/bad Host/Origin) + route smoke with mocked handler.
- **D-16:** Do not change `/api/health` — MCP discoverability stays Phase 26 docs.

### Claude's Discretion
- Origin policy (D-02), tool/layout choices (D-05, D-08), reject logging (D-11), CORS (D-12), UAT bar (D-13), health untouched (D-16) — user deferred to Claude; locked as above from research defaults.

### Folded Todos
- **Integrate local AI agent via subprocess** (`.planning/todos/pending/2026-09-05-integrate-local-ai-agent-via-subprocess.md`): superseded by v1.4 in-app MCP host — external CLI connects to localhost MCP; app must not spawn agent subprocess. Folded as explicit anti-goal for this phase / milestone.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` — HOST-01, HOST-02; OOS (stdio-only, `0.0.0.0`, writes, chat, OAuth)
- `.planning/ROADMAP.md` — Phase 23 goal, success criteria
- `.planning/PROJECT.md` — v1.4 Local MCP goal, Key Decisions (in-app host, read-only HTTP)

### Research (milestone)
- `.planning/research/SUMMARY.md` — Phase 1 host+guards deliverable; stack pins; pitfalls
- `.planning/research/ARCHITECTURE.md` — `/api/mcp` mount, `localhost-guard`, `responseMode: json`, folder layout
- `.planning/research/STACK.md` — `mcp-handler@^2`, `@modelcontextprotocol/server@^2`

### Existing code
- `docker-compose.yml` — host publish `127.0.0.1:3000:3000`; container `HOSTNAME=0.0.0.0`
- `src/app/api/health/route.ts` — existing Node App Router API pattern (`force-dynamic`); do not extend this phase
- `Dockerfile` — `PORT=3000`, standalone Next image

### External (verify at install)
- MCP Spec Streamable HTTP security (Origin / localhost) — https://modelcontextprotocol.io/specification/
- mcp-handler / MCP TS SDK v2 HTTP serving docs — confirm `createMcpHandler` export shape at install (STATE research flag)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/api/health/route.ts`: pattern for Node App Router route + JSON responses
- Prisma singleton / domain libs: **not** wired in Phase 23 beyond ping (Phase 24+)

### Established Patterns
- Compose already loopback-publishes; keep container listen `0.0.0.0` + host bind `127.0.0.1`
- No existing middleware.ts — guard lives as wrapper around MCP handler
- Next 16.3.4 App Router; Edge forbidden for MCP (better-sqlite3 / Node)

### Integration Points
- New: `src/app/api/mcp/route.ts` → `src/lib/mcp/create-handler.ts` + `localhost-guard.ts` + `wallet_ping` tool
- Deps: add `mcp-handler` + `@modelcontextprotocol/server` (verify export shape)
- Do not widen Compose ports; do not spawn agents; do not add write tools

</code_context>

<specifics>
## Specific Ideas

- Prefer documenting `127.0.0.1` over `localhost` in Phase 26 (IPv6); Phase 23 smoke accepts both.
- `wallet_ping` is transport proof only — not a finance read.

</specifics>

<deferred>
## Deferred Ideas

- **Savings account type** with interest rate + accrual date → NW «Прогноз» chart — captured as `.planning/todos/pending/2026-09-10-savings-account-type-with-interest-nw-forecast.md` (not v1.4 MCP)
- Capital read tools (CAP-*) → Phase 24
- Side-ledger tools + isolation (SIDE-*, DISOL/INISO/GRISO in tool copy) → Phase 25–26
- Connect docs Claude/Cursor (CLI-02) → Phase 26
- Optional bearer AUTH-MCP-01, writes, in-app chat — Future Requirements / OOS

</deferred>

---

*Phase: 23-MCP Host + Localhost Safety*
*Context gathered: 2026-09-10*
