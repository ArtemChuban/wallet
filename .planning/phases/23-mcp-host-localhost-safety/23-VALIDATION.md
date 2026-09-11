---
phase: "23"
slug: "mcp-host-localhost-safety"
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-09-10"
validated: "2026-09-11"
---

# Phase 23 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.11 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/lib/mcp/localhost-guard.test.ts src/app/api/mcp/route.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick Vitest on MCP test files above
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green + curl initialize
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 23-01-01 | 01 | 1 | HOST-01 | T-23-SC | Human confirms mcp-handler SUS before install | gate | RESEARCH present + mcp-handler citation | ✅ | ✅ green |
| 23-01-02 | 01 | 1 | HOST-01, HOST-02 | — | Wave 0 stubs for guard + route smoke | unit | `npx vitest run src/lib/mcp/localhost-guard.test.ts src/app/api/mcp/route.test.ts` | ✅ | ✅ green |
| 23-01-03 | 01 | 1 | HOST-01 | T-23-SC | mcp-handler + server ^2 in package.json | install | node assert deps + node_modules dirs | ✅ pkg | ✅ green |
| 23-02-01 | 02 | 2 | HOST-01, HOST-02 | T-23-01…05 | Tracer: guarded /api/mcp + wallet_ping | unit/smoke | `npx vitest run src/lib/mcp/localhost-guard.test.ts src/app/api/mcp/route.test.ts` | ✅ | ✅ green |
| 23-02-02 | 02 | 2 | HOST-02 | T-23-01,03,04 | Full Host/Origin/port matrix + route mock | unit | `npx vitest run src/lib/mcp/localhost-guard.test.ts src/app/api/mcp/route.test.ts` | ✅ | ✅ green |
| 23-02-03 | 02 | 2 | HOST-01, HOST-02 | T-23-02,05 | Suite green + Compose checklist | suite + manual | `npm test` + grep Compose ports | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Requirement coverage (reconcile 2026-09-11):** HOST-01, HOST-02 → COVERED (10/10 vitest; 23-UAT complete for live initialize/tools/list + bad_host).

---

## Wave 0 Requirements

- [x] `src/lib/mcp/localhost-guard.test.ts` — stubs → real expects for HOST-02
- [x] `src/app/api/mcp/route.test.ts` — stubs → real expects for HOST-01 route smoke with mocks
- [x] Framework install: none — Vitest already present

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions | Status |
|----------|-------------|------------|-------------------|--------|
| curl initialize + tools/list on loopback | HOST-01 | External protocol smoke (D-13) | With app running: MCP initialize + tools/list against `http://127.0.0.1:$PORT/api/mcp` | ✅ closed in 23-UAT |
| Compose publish `127.0.0.1:3000:3000` | HOST-02 | D-14 checklist | Confirm `docker-compose.yml` ports line unchanged | ✅ verified (L5) |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated 2026-09-11 — no MISSING/PARTIAL gaps; map reconciled from green suites + UAT

## Validation Audit 2026-09-11

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 (already covered) |
| Escalated | 0 |
| Map rows greened | 3 (23-02-01…03 were stale pending) |
