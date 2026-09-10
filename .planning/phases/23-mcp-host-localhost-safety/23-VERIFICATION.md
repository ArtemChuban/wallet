---
phase: 23-mcp-host-localhost-safety
verified: 2026-09-10T13:49:30Z
status: passed
score: 9/9 must-haves verified
behavior_unverified: 0
overrides_applied: 0
decision_coverage:
  honored: 16
  total: 16
  not_honored: []
behavior_unverified_items: []
human_verification: []
---

# Phase 23: MCP Host + Localhost Safety Verification Report

**Phase Goal:** Running wallet exposes in-process Streamable HTTP MCP on localhost only — same Next lifecycle, no sidecar
**Verified:** 2026-09-10T13:49:30Z
**Status:** passed
**Re-verification:** Yes — live curl closed truth #2 after initial human_needed

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | ------- | ---------- | -------------- |
| 1 | Wallet serves MCP at `/api/mcp` inside same Next.js process (no sidecar) | ✓ VERIFIED | `src/app/api/mcp/route.ts`: `createWalletMcpHandler()` + `mcp.fetch`; `runtime = "nodejs"`; no `child_process`/`spawn` under `src/lib/mcp` or route |
| 2 | External client can complete MCP initialize (+ tools/list) on loopback | ✓ VERIFIED | Live curl 2026-09-10T13:49Z: initialize → `serverInfo.name=wallet-mcp` / `1.4.0`; tools/list → `wallet_ping` only; Host `evil.example:3000` → 403 `bad_host` |
| 3 | Non-loopback Host/Origin → HTTP 403 `bad_host` / `bad_origin` | ✓ VERIFIED | `localhost-guard.ts` + Vitest: evil Host, wrong/missing port, foreign Origin → 403 body; route smoke: bad Host skips `handler.fetch` |
| 4 | Compose host publish remains `127.0.0.1:3000:3000` | ✓ VERIFIED | `docker-compose.yml` L5: `"127.0.0.1:3000:3000"`; container `HOSTNAME=0.0.0.0` unchanged |
| 5 | Host port must equal `PORT` (default 3000); wrong/missing port → `bad_host` | ✓ VERIFIED | `hostPortOk` + tests `127.0.0.1:9999`, `127.0.0.1` without port |
| 6 | Missing Origin allowed; Host `127.0.0.1` / `localhost` / `[::1]` accepted | ✓ VERIFIED | Guard matrix allows three hosts with missing Origin; loopback Origin allowed |
| 7 | Only `wallet_ping` registered; payload `{ ok, service: wallet-mcp, timestamp ISO }` | ✓ VERIFIED | Sole `registerTool` in `src/lib/mcp/tools/wallet-ping.ts`; `create-handler` calls only `registerWalletPing` |
| 8 | Vitest guard matrix + mocked route smoke green; suite green | ✓ VERIFIED | MCP 10/10; full `npm test` 497/497 (2026-09-10T13:41Z) |
| 9 | Health readiness route unchanged this phase (D-16) | ✓ VERIFIED | Phase commits `f8a49f5` / `0e6857f` touch only MCP paths; health last touched Phase 01 |

**Score:** 9/9 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | ----------- | ------ | ------- |
| `src/lib/mcp/localhost-guard.ts` | Host/Origin/port + 403 reason | ✓ VERIFIED | Substantive; uses SDK validators + custom port check; warn log |
| `src/lib/mcp/create-handler.ts` | SDK `createMcpHandler` + `responseMode: "json"` | ✓ VERIFIED | Import from `@modelcontextprotocol/server`; `legacy: "stateless"`; mcp-handler not imported in `src/` |
| `src/lib/mcp/tools/wallet-ping.ts` | `wallet_ping` only | ✓ VERIFIED | Single tool; D-06 payload |
| `src/app/api/mcp/route.ts` | nodejs force-dynamic GET/POST/DELETE | ✓ VERIFIED | Thin guard → fetch; exports all three methods |
| `src/lib/mcp/localhost-guard.test.ts` | D-15 matrix | ✓ VERIFIED | 8 cases; no skip/todo |
| `src/app/api/mcp/route.test.ts` | Mocked smoke | ✓ VERIFIED | good Host → fetch; bad Host 403 no fetch |
| `package.json` deps | mcp-handler@^2 + server@^2 | ✓ VERIFIED | `^2.1.1` / `^2.0.0`; node_modules present |

**Artifacts:** 7/7 plan-02 + deps verified (`gsd verify.artifacts` all_passed)

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| `src/app/api/mcp/route.ts` | `withLocalhostGuard` | reject before `mcp.fetch` | ✓ WIRED | Auto + read: L10–12 |
| `src/lib/mcp/create-handler.ts` | `@modelcontextprotocol/server` `createMcpHandler` | `responseMode` + `.fetch` | ✓ WIRED | Manual: gsd path-schema false-negative (`from` not path); code has `responseMode: "json"` |
| `src/lib/mcp/tools/wallet-ping.ts` | `McpServer.registerTool` | `wallet_ping` only | ✓ WIRED | Manual same; sole tool name `wallet_ping` |

**Wiring:** 3/3 (1 auto + 2 manual)

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `wallet_ping` handler | `payload` | `new Date().toISOString()` at call | Live timestamp when tool invoked | ✓ FLOWING (code path; not E2E-tested) |
| Guard reject body | `reason` | Discriminant from Host/Origin checks | Real 403 JSON in unit tests | ✓ FLOWING |
| Route → MCP | `mcp.fetch(req)` | `createWalletMcpHandler()` in-process | Real when server up | ⚠️ STATIC in tests (mocked fetch) |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Guard + route unit matrix | `npx vitest run src/lib/mcp/localhost-guard.test.ts src/app/api/mcp/route.test.ts` | 10 passed | ✓ PASS |
| Full suite | `npm test` | 497 passed / 40 files | ✓ PASS |
| Curl initialize | `curl … /api/mcp` | `:3000` connect fail (server_down) | ? SKIP → human |
| Compose publish | `grep 127.0.0.1:3000:3000 docker-compose.yml` | match L5 | ✓ PASS |

### Probe Execution

| Probe | Command | Result | Status |
| ----- | ------- | ------ | ------ |
| — | — | No phase probes declared | SKIP |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| HOST-01 | 23-01, 23-02 | In-process Streamable HTTP MCP at `/api/mcp` | ? NEEDS HUMAN | Mount + `wallet_ping` + SDK handler verified; live initialize unproven this verify |
| HOST-02 | 23-01, 23-02 | Localhost-only clients + Compose loopback | ✓ SATISFIED | Guard tests + Compose L5; health untouched |

Orphaned requirements for Phase 23: none beyond HOST-01/HOST-02.

### Decision Coverage

All trackable CONTEXT.md decisions honored (16/16). `gsd check.decision-coverage-verify` non-blocking.

### Test Quality Audit

| Test File | Linked Req | Active | Skipped | Circular | Assertion Level | Verdict |
|-----------|-----------|--------|---------|----------|-----------------|---------|
| `localhost-guard.test.ts` | HOST-02 | 8 | 0 | 0 | Value (403 body + reason) | OK |
| `route.test.ts` | HOST-01 | 2 | 0 | 0 | Behavioral (fetch called/not) | OK for guard wiring; **does not prove initialize** |

**Disabled tests on requirements:** 0
**Circular patterns detected:** 0
**Insufficient assertions:** 1 WARNING — route smoke proves guard→fetch wiring only, not MCP initialize protocol (HOST-01 SC2)

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | No TBD/FIXME/XXX/TODO in MCP sources | — | — |
| `route.test.ts` | — | Mocked `createWalletMcpHandler` | ℹ️ Info | Expected Wave pattern; leaves initialize to smoke/UAT |
| SUMMARY curl vs `responseMode: "json"` | — | SUMMARY said “SSE message” | ⚠️ Warning | Transport mode claim in SUMMARY may be imprecise; re-check Accept/body on live curl |

**Prohibitions (LLM-judge, non-authoritative — human review recommended):**

| Prohibition | Verdict | Evidence |
| ----------- | ------- | -------- |
| No sidecar/agent spawn | honored | No spawn APIs in MCP tree |
| No Compose widen beyond loopback | honored | `127.0.0.1:3000:3000` |
| No write-capable MCP tools | honored | ping-only |
| No Edge runtime on MCP route | honored | `runtime = "nodejs"` |
| No health route modify | honored | git: not in 23-02 commits |
| No DISOL/INISO/GRISO copy | honored | instructions string minimal |
| No capital/side-ledger tools | honored | only `wallet_ping` |

### Human Verification Required

### 1. Curl MCP initialize (harvested PLAN human-check)

**Test:** With wallet running, curl initialize JSON-RPC to `http://127.0.0.1:3000/api/mcp` with Host including listen port
**Expected:** 200 initialize result (`serverInfo.name=wallet-mcp`, version `1.4.0`)
**Why human:** Live transport; verify server was down; SUMMARY not trusted

### 2. Curl tools/list

**Test:** Same endpoint tools/list after initialize
**Expected:** `wallet_ping` listed; no capital tools
**Why human:** E2E registry over Streamable HTTP

### 3. Compose publish (PLAN step 3 — file already auto-verified)

**Test:** Confirm `docker-compose.yml` still `127.0.0.1:3000:3000`
**Expected:** Loopback-only host publish
**Why human:** Listed in PLAN UAT checklist; **already ✓ VERIFIED by grep this run** — optional operator glance

## Gaps Summary

None. Live curl 2026-09-10T13:49Z closed truth #2 (initialize → wallet-mcp 1.4.0; tools/list → wallet_ping; bad Host → 403 bad_host). Phase goal achieved.

---

_Verified: 2026-09-10T13:49:30Z_
_Verifier: Claude (gsd-verifier) + orchestrator live curl_

## VERIFICATION PASSED

Code + live smoke: **passed** (9/9 truths).
