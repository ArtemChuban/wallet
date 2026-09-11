---
phase: "26"
slug: "connect-docs-policy"
status: compliant
nyquist_compliant: true
wave_0_complete: true
created: "2026-09-11"
---

# Phase 26 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/lib/mcp/isolation-contract.test.ts` |
| **Full suite command** | `npx vitest run src/lib/mcp` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/lib/mcp/isolation-contract.test.ts` (+ touched tool `*.test.ts`)
- **After every plan wave:** Run `npx vitest run src/lib/mcp`
- **Before `/gsd-verify-work`:** Full MCP suite green + dual-client UAT
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 26-01-01 | 01 | 0 | CLI-01 | — | Named DISOL/INISO/GRISO required in contract tests | unit | `npx vitest run src/lib/mcp/isolation-contract.test.ts` | ✅ extend | ✅ green |
| 26-01-01b | 01 | 0 | CLI-01 | — | list_debts DESCRIPTION exports DISOL-01 | unit | `npx vitest run src/lib/mcp/tools/debts.test.ts` | ✅ update | ✅ green |
| 26-02-* | 02 | 0 | CLI-01 | — | income/grace/forecast SIDE descriptions contain rule ids | unit | `npx vitest run src/lib/mcp/tools/income.test.ts src/lib/mcp/tools/grace.test.ts src/lib/mcp/tools/forecast.test.ts` | ✅ update | ✅ green |
| 26-*-* | * | * | CLI-02 | — | README has Claude+Cursor configs + URL | docs/UAT | phase UAT dual-client (`26-UAT.md`) | ✅ README | ⬜ UAT pending |
| 26-04-01 | 04 | 3 | PARITY-01 | — | AGENTS.md BEGIN/END parity block | docs | grep AGENTS.md / plan verify | ✅ present | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Flip `src/lib/mcp/isolation-contract.test.ts` — require named DISOL-01/INISO-01/GRISO-01 + `wallet_ping` annotations (was asserting absence) — **tracer-done (26-01)**
- [x] Debts description regexes for DISOL-01 / do-not-fold — **tracer-done (26-01)**
- [x] Update SIDE description regexes in income/grace/forecast tests for rule ids — **Plan-02-done**
- [x] Optional fold `wallet_ping` annotation assert into isolation-contract — **tracer-done (26-01)**

*wave_0_complete true after Plan 02 closed remaining SIDE regex bullets. Unit contracts Nyquist-compliant; dual-client connect remains manual UAT (CLI-02).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Claude Code live MCP connect | CLI-02 / D-16 | External CLI | See `.planning/phases/26-connect-docs-policy/26-UAT.md` Test 1 — app running; Claude `type: http` to `http://127.0.0.1:3000/api/mcp` |
| Cursor live MCP connect | CLI-02 / D-16 | External CLI | See `.planning/phases/26-connect-docs-policy/26-UAT.md` Test 2 — Cursor `type: http` + `url`; mcp-remote only after real fail note |
| PROJECT Active checkboxes | CLI-01/02, PARITY-01 | Docs | Closed in 26-04 — CLI-01/02 + PARITY-01 `[x]`; Constraints PARITY text retained |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** unit contracts approved (26-02); dual-client UAT still pending
