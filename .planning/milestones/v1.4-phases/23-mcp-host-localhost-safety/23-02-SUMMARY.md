---
phase: 23-mcp-host-localhost-safety
plan: 02
subsystem: api
tags: [mcp, streamable-http, localhost-guard, createMcpHandler, wallet_ping, vitest]

requires:
  - phase: 23-01
    provides: mcp-handler@^2 + @modelcontextprotocol/server@^2 install; Wave 0 Vitest stubs
provides:
  - Custom withLocalhostGuard (Host/Origin/PORT + 403 bad_host|bad_origin)
  - createWalletMcpHandler via SDK createMcpHandler responseMode json + wallet_ping only
  - Thin /api/mcp route (nodejs, force-dynamic, GET/POST/DELETE)
  - Green D-15 Vitest matrix + curl initialize/tools/list smoke evidence
affects:
  - Phase 24 capital MCP tools
  - Phase 26 connect docs / CLI-01

actuals:
  tokens: 2318
  tasks: 3
  commits: 2

tech-stack:
  added: []
  patterns:
    - SDK createMcpHandler + .fetch (not mcp-handler create) for responseMode json
    - Custom localhost-guard reuses validateHostHeader/Origin + PORT equality + discriminant 403 body
    - Thin route: withLocalhostGuard then mcp.fetch; export GET/POST/DELETE

key-files:
  created:
    - src/lib/mcp/localhost-guard.ts
    - src/lib/mcp/create-handler.ts
    - src/lib/mcp/tools/wallet-ping.ts
    - src/app/api/mcp/route.ts
  modified:
    - src/lib/mcp/localhost-guard.test.ts
    - src/app/api/mcp/route.test.ts

key-decisions:
  - "Import createMcpHandler from @modelcontextprotocol/server; mcp-handler remains install-only (responseMode gap)"
  - "Reject Host without explicit :PORT when listen PORT is 3000 (A1)"
  - "403 body { error: Forbidden, reason: bad_host|bad_origin }; no SDK ValidationResponse helpers"

patterns-established:
  - "MCP mount: src/lib/mcp/* + thin src/app/api/mcp/route.ts"
  - "Route smoke mocks createWalletMcpHandler via vi.hoisted fetch"

requirements-completed: [HOST-01, HOST-02]

coverage:
  - id: D1
    description: In-process /api/mcp Streamable HTTP mount with nodejs + force-dynamic + wallet_ping
    requirement: HOST-01
    verification:
      - kind: unit
        ref: "npx vitest run src/app/api/mcp/route.test.ts"
        status: pass
      - kind: other
        ref: "curl initialize + tools/list http://127.0.0.1:3000/api/mcp"
        status: pass
    human_judgment: false
  - id: D2
    description: Localhost Host/Origin/port guard rejects non-loopback and wrong port with 403 reason
    requirement: HOST-02
    verification:
      - kind: unit
        ref: "src/lib/mcp/localhost-guard.test.ts#D-15 matrix"
        status: pass
    human_judgment: false
  - id: D3
    description: Compose host publish remains 127.0.0.1:3000:3000; curl initialize UAT harvest
    requirement: HOST-02
    verification:
      - kind: other
        ref: "grep 127.0.0.1:3000:3000 docker-compose.yml"
        status: pass
      - kind: other
        ref: "curl initialize/tools/list smoke (agent-driven)"
        status: pass
    human_judgment: true
    rationale: Plan human-check for UAT harvest — operator confirms loopback publish + initialize bar at verify-work

duration: 4min
completed: 2026-09-10
status: complete
---

# Phase 23 Plan 02: Guarded MCP Host Tracer Summary

**In-process `/api/mcp` serves `wallet_ping` behind Host/Origin/PORT localhost guard; curl initialize + tools/list green on loopback**

## Performance

- **Duration:** 4 min
- **Started:** 2026-09-10T13:33:47Z
- **Completed:** 2026-09-10T13:37:54Z
- **Tasks:** 3/3
- **Files modified:** 6

## Accomplishments

- Custom `withLocalhostGuard` allowlists `127.0.0.1` / `localhost` / `[::1]`, requires Host port === `PORT` (default 3000), missing Origin OK, foreign Origin → `bad_origin`
- SDK `createWalletMcpHandler` with `responseMode: "json"`, `legacy: "stateless"`, only `wallet_ping` (D-05/D-06)
- Thin Node route exports GET/POST/DELETE; Vitest 10/10 MCP + full suite 497 passed; curl initialize + tools/list smoke recorded

## Task Commits

1. **Task 1: End-to-end guarded /api/mcp + wallet_ping** - `f8a49f5` (feat)
2. **Task 2: Expand localhost-guard matrix + route mock smoke** - `0e6857f` (test)
3. **Task 3: Curl initialize smoke + Compose publish checklist** - (verify-only; no code commit)

**Plan metadata:** (docs commit after SUMMARY — STATE/ROADMAP intentionally skipped per orchestrator)

## Curl smoke evidence (D-13)

```text
POST http://127.0.0.1:3000/api/mcp Host:127.0.0.1:3000
initialize → 200 SSE message: serverInfo.name=wallet-mcp version=1.4.0
tools/list → tools[0].name=wallet_ping
Host:evil.com:3000 → 403 {"error":"Forbidden","reason":"bad_host"}
```

Compose: `docker-compose.yml` line still `"127.0.0.1:3000:3000"` (D-14). Health route untouched (D-16).

## TDD Gate Compliance

Task 2 marked `tdd="true"`. RED skipped as fail-fast N/A: full guard + route smoke already landed in tracer Task 1; Task 2 converted remaining `it.todo` → real expects (all green). Single `test(23-02)` commit documents expansion.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Route test TDZ on fetchMock**
- **Found during:** Task 1 verify
- **Issue:** `vi.mock` hoisted before `const fetchMock = vi.fn()` → "Cannot access 'fetchMock' before initialization"
- **Fix:** `vi.hoisted(() => ({ fetchMock: vi.fn() }))`
- **Files modified:** `src/app/api/mcp/route.test.ts`
- **Commit:** `f8a49f5`

## Auth Gates

None.

## Known Stubs

None — Wave 0 todos converted; no placeholder MCP tools.

## Threat Flags

None beyond plan `<threat_model>` (T-23-01…05 mitigated in guard + Compose checklist).

## Self-Check: PASSED

- FOUND: src/lib/mcp/localhost-guard.ts, create-handler.ts, tools/wallet-ping.ts, src/app/api/mcp/route.ts
- FOUND: commits f8a49f5, 0e6857f
- FOUND: vitest MCP 10 passed; npm test 497 passed
- FOUND: curl initialize + wallet_ping tools/list; Compose 127.0.0.1:3000:3000
