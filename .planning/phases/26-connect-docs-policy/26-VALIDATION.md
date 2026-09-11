---
phase: "26"
slug: "connect-docs-policy"
status: draft
nyquist_compliant: false
wave_0_complete: false
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
| 26-01-01 | 01 | 0 | CLI-01 | — | Named DISOL/INISO/GRISO required in contract tests | unit | `npx vitest run src/lib/mcp/isolation-contract.test.ts` | ✅ extend | ⬜ pending |
| 26-*-* | * | * | CLI-01 | — | SIDE descriptions contain rule ids | unit | `npx vitest run src/lib/mcp/tools/debts.test.ts src/lib/mcp/tools/income.test.ts src/lib/mcp/tools/grace.test.ts src/lib/mcp/tools/forecast.test.ts` | ✅ update | ⬜ pending |
| 26-*-* | * | * | CLI-02 | — | README has Claude+Cursor configs + URL | docs/UAT | phase UAT dual-client | ❌ UAT | ⬜ pending |
| 26-*-* | * | * | PARITY-01 | — | AGENTS.md BEGIN/END parity block | docs | grep AGENTS.md / plan verify | ❌ create | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Flip `src/lib/mcp/isolation-contract.test.ts` — require named DISOL-01/INISO-01/GRISO-01 + `wallet_ping` annotations (was asserting absence)
- [ ] Update SIDE description regexes in debts/income/grace/forecast tests for rule ids
- [ ] Optional fold `wallet_ping` annotation assert into isolation-contract

*Existing Vitest infrastructure covers unit verification; dual-client connect is manual UAT.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Claude Code live MCP connect | CLI-02 / D-16 | External CLI | `26-UAT.md` — app running; Claude `type: http` to `http://127.0.0.1:3000/api/mcp` |
| Cursor live MCP connect | CLI-02 / D-16 | External CLI | `26-UAT.md` — Cursor `type: http` + `url`; mcp-remote only if native fails |
| PROJECT Active checkboxes | CLI-01/02, PARITY-01 | Docs | Mark `[x]` when materialization done |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
