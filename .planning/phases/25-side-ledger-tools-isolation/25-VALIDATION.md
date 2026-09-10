---
phase: "25"
slug: "side-ledger-tools-isolation"
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-10"
---

# Phase 25 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.11 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/lib/mcp/tools/debts.test.ts src/lib/mcp/tools/income.test.ts src/lib/mcp/tools/grace.test.ts src/lib/mcp/tools/forecast.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30–90 seconds |

---

## Sampling Rate

- **After every task commit:** Run targeted SIDE `*.test.ts` + related isolation twin
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 25-W0 | 01 | 0 | SIDE-01…04 | — | N/A | unit | `npx vitest run src/lib/mcp/tools/debts.test.ts src/lib/mcp/tools/income.test.ts src/lib/mcp/tools/grace.test.ts src/lib/mcp/tools/forecast.test.ts` | ❌ W0 | ⬜ pending |
| 25-SIDE-01 | TBD | TBD | SIDE-01 | T-25-DISOL | Debts never fold into NW MCP paths | unit | `npx vitest run src/lib/mcp/tools/debts.test.ts src/lib/disol.test.ts` | ❌ / ✅ disol | ⬜ pending |
| 25-SIDE-02 | TBD | TBD | SIDE-02 | T-25-INISO | No BalanceSnapshot write via income MCP | unit | `npx vitest run src/lib/mcp/tools/income.test.ts src/lib/iniso.test.ts` | ❌ / ✅ iniso | ⬜ pending |
| 25-SIDE-03 | TBD | TBD | SIDE-03 | T-25-GRISO | Grace not in historical LOCF | unit | `npx vitest run src/lib/mcp/tools/grace.test.ts src/lib/griso.test.ts` | ❌ / ✅ griso | ⬜ pending |
| 25-SIDE-04 | TBD | TBD | SIDE-04 | — | Sparse forecast overlay parity | unit | `npx vitest run src/lib/mcp/tools/forecast.test.ts src/lib/nw-forecast.test.ts` | ❌ / ✅ nw-forecast | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/mcp/tools/debts.test.ts` — stubs for SIDE-01 serialize + totals + OPEN
- [ ] `src/lib/mcp/tools/income.test.ts` — stubs for SIDE-02 overdue/actual + no-write
- [ ] `src/lib/mcp/tools/grace.test.ts` — stubs for SIDE-03 OPEN/CTA + overdue
- [ ] `src/lib/mcp/tools/forecast.test.ts` — stubs for SIDE-04 sparse / default horizon / events
- [ ] Extend `src/lib/disol.test.ts` walls to `src/lib/mcp/reads/load-net-worth-asof.ts` + `tools/net-worth.ts`
- [ ] Optional `src/lib/mcp/isolation-contract.test.ts` — BalanceSnapshot never-write across SIDE files

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| MCP tools/list shows SIDE tools after app boot | SIDE-01…04 | Needs running Next + MCP initialize | Start `npm run dev`; curl MCP initialize + tools/list; confirm debts/income/grace/forecast tools present |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
