---
phase: "11"
slug: "charts-primary-totals"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-09-06"
validated: "2026-09-07"
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.11 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/lib/debts.test.ts src/lib/validations/debts.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/lib/debts.test.ts src/lib/validations/debts.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 0 | DCHART-01/02 | — | N/A | unit | `npx vitest run src/lib/debts.test.ts -t stack` | ✅ | ✅ green |
| 11-01-02 | 01 | 0 | D-08/D-09 | T-11-01 | openedAsOf Zod + immutable on update | unit | `npx vitest run src/lib/validations/debts.test.ts` | ✅ | ✅ green |
| 11-02-01 | 02 | 1 | DCHART-01/02 | — | N/A | unit | `npx vitest run src/lib/debts.test.ts` | ✅ | ✅ green |
| 11-03-01 | 03 | 2 | DTOTAL-01 | — | N/A | unit | `npx vitest run src/lib/debts.test.ts -t computeDebtPrimaryTotals` | ✅ | ✅ green |
| 11-04-01 | 04 | 2 | DISOL-01 | — | No debt imports in NW modules | unit + grep | `npx vitest run src/lib/net-worth.test.ts` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Extend `src/lib/debts.test.ts` — `buildDebtPrincipalStackSeries` cases (open→today, repay step, size-change height, multi-day, today flat)
- [x] Extend `src/lib/validations/debts.test.ts` — required `openedAsOf`; update schema omits field
- [x] Optional: forbid `@/lib/debts` in `net-worth.ts` / `historical-series.ts`
- [x] No new framework install

*Existing infrastructure (Vitest) covers phase requirements once Wave 0 stubs land.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Debt detail «История» shows stacked chart (repaid+remaining) | DCHART-01/02 | Recharts visual | Open debt → История → chart above timeline; stack sum = principal |
| `/debts` hero always visible including 0/0 | DTOTAL-01 | Layout | Empty and non-empty list; columns «Я должен» / «Мне должны» |
| Partial banner + excluded debt list | DTOTAL-01 | FX fixture | Debt in foreign currency without FX → «Итог неполный» + excluded rows |
| Капитал excluded-account list parity | D-14 | Visual | Account missing balance/FX → list with reason |
| NW totals unchanged with debts present | DISOL-01 | Isolation | Compare `/` NW with/without open debts |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-09-07 (evidence-first reconcile Phase 12 Plan 03 / NYQ-11)

---

## Validation Audit 2026-09-07

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

**Evidence:** quick smoke `npx vitest run src/app/debts/actions.test.ts src/lib/debts.test.ts` → PASS (75). Full suite `npm test` → 25 files / 265 tests PASS (0 FAIL).

State A audit: draft VALIDATION map was stale (Wave 0 ❌ pending on stack / openedAsOf rows). Filesystem evidence: `buildDebtPrincipalStackSeries` suite in `src/lib/debts.test.ts`, `openedAsOf` Zod cases in `src/lib/validations/debts.test.ts`, `computeDebtPrimaryTotals` coverage, `net-worth.test.ts` + `disol.test.ts` present. No MISSING Wave 0 paths — auditor not spawned. Historical task IDs preserved; File Exists / Status → present/green; Wave 0 boxes checked.
