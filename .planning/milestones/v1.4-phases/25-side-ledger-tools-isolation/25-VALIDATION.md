---
phase: "25"
slug: "side-ledger-tools-isolation"
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-09-10"
validated: "2026-09-11"
---

# Phase 25 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.11 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/lib/mcp/tools/debts.test.ts src/lib/mcp/tools/income.test.ts src/lib/mcp/tools/grace.test.ts src/lib/mcp/tools/forecast.test.ts src/lib/mcp/isolation-contract.test.ts` |
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
| 25-01-W0 | 01 | 0 | SIDE-01…04 | — | Wave 0 stubs + horizon/income schemas + disol MCP walls | unit | `npx vitest run src/lib/mcp/tools/debts.test.ts src/lib/mcp/tools/income.test.ts src/lib/mcp/tools/grace.test.ts src/lib/mcp/tools/forecast.test.ts src/lib/mcp/as-of.test.ts src/lib/disol.test.ts` | ✅ | ✅ green |
| 25-02-T1 | 02 | 2 | SIDE-04 | — | Sparse forecast overlay parity | unit | `npx vitest run src/lib/mcp/tools/forecast.test.ts` | ✅ | ✅ green |
| 25-03-T1 | 03 | 3 | SIDE-01 | T-25-DISOL | Debts never fold into NW MCP paths | unit | `npx vitest run src/lib/mcp/tools/debts.test.ts src/lib/disol.test.ts` | ✅ | ✅ green |
| 25-04-T1 | 04 | 4 | SIDE-02 | T-25-INISO | No BalanceSnapshot write via income MCP | unit | `npx vitest run src/lib/mcp/tools/income.test.ts src/lib/iniso.test.ts src/lib/mcp/isolation-contract.test.ts` | ✅ | ✅ green |
| 25-04-T2 | 04 | 4 | SIDE-03 | T-25-GRISO | Grace not in historical LOCF | unit | `npx vitest run src/lib/mcp/tools/grace.test.ts src/lib/griso.test.ts src/lib/mcp/isolation-contract.test.ts` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

**Requirement coverage (reconcile 2026-09-11):** SIDE-01…04 → COVERED (debts/income/grace/forecast + disol/iniso/griso + isolation-contract; 54 tests green in targeted run).

---

## Wave 0 Requirements

- [x] `src/lib/mcp/tools/debts.test.ts` — SIDE-01 serialize + totals + OPEN
- [x] `src/lib/mcp/tools/income.test.ts` — SIDE-02 overdue/actual + no-write
- [x] `src/lib/mcp/tools/grace.test.ts` — SIDE-03 OPEN/CTA + overdue
- [x] `src/lib/mcp/tools/forecast.test.ts` — SIDE-04 sparse / default horizon / events
- [x] Extend `src/lib/disol.test.ts` walls to `src/lib/mcp/reads/load-net-worth-asof.ts` + `tools/net-worth.ts`
- [x] `src/lib/mcp/isolation-contract.test.ts` — BalanceSnapshot never-write + named isolation presence (Phase 26 flipped asserts)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions | Status |
|----------|-------------|------------|-------------------|--------|
| MCP tools/list shows SIDE tools after app boot | SIDE-01…04 | Needs running Next + MCP initialize | Start `npm run dev`; curl MCP initialize + tools/list; confirm debts/income/grace/forecast tools present | ✅ closed in v1.4 integration + 26-UAT catalog |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 90s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated 2026-09-11 — no MISSING/PARTIAL gaps; TBD map rows replaced with plan-aligned IDs

## Validation Audit 2026-09-11

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 (already covered) |
| Escalated | 0 |
| Map rows greened | 4 (were stale pending / TBD) |
| Wave 0 isolation-contract | checked |
