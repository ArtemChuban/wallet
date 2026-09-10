---
phase: "23"
slug: "mcp-host-localhost-safety"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-10"
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
| 23-xx-xx | TBD | TBD | HOST-01 | — | Route serves guarded MCP handler | unit/smoke | `npx vitest run src/app/api/mcp/route.test.ts` | ❌ W0 | ⬜ pending |
| 23-xx-xx | TBD | TBD | HOST-02 | T-23-01 | Bad Host/Origin/port → 403 + reason | unit | `npx vitest run src/lib/mcp/localhost-guard.test.ts` | ❌ W0 | ⬜ pending |
| 23-xx-xx | TBD | TBD | HOST-01 | — | wallet_ping D-06 shape | unit | `npx vitest run` (mcp lib) | ❌ W0 | ⬜ pending |

*Planner fills concrete Task IDs. Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/mcp/localhost-guard.test.ts` — stubs for HOST-02
- [ ] `src/app/api/mcp/route.test.ts` — stubs for HOST-01 route smoke with mocks
- [ ] Framework install: none — Vitest already present

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| curl initialize + tools/list on loopback | HOST-01 | External protocol smoke (D-13) | With app running: MCP initialize + tools/list against `http://127.0.0.1:$PORT/api/mcp` |
| Compose publish `127.0.0.1:3000:3000` | HOST-02 | D-14 checklist only | Confirm `docker-compose.yml` ports line unchanged |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
