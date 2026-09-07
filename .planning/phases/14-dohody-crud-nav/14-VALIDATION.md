---
phase: "14"
slug: "dohody-crud-nav"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-07"
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/components/nav.test.ts src/lib/income.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run targeted vitest files touched by the task
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 14-W0-01 | 01 | 0 | UI-01 | — | Flip UI-00 absence assertion before route create | unit | `npx vitest run src/lib/income.test.ts` | ✅ must change | ⬜ pending |
| 14-W0-02 | 01 | 0 | SRC-01, SRC-02 | — | Zod income validations | unit | `npx vitest run src/lib/validations/income.test.ts` | ❌ W0 | ⬜ pending |
| 14-01-01 | 01 | 1 | UI-01 | — | Nav order `/income` after accounts | unit | `npx vitest run src/components/nav.test.ts` | ✅ | ⬜ pending |
| 14-01-02 | 01 | 1 | D-02/D-10 | — | nextOpenPlannedAsOf past unfilled slot | unit | `npx vitest run src/lib/income.test.ts` | ❌ W0 | ⬜ pending |
| 14-02-01 | 02 | 2 | SRC-01, SRC-02 | — | Create/edit Zod + actions | unit | `npx vitest run src/lib/validations/income.test.ts src/app/income/actions.test.ts` | ❌ W0 | ⬜ pending |
| 14-02-02 | 02 | 2 | UI-01 / ISO | T-14-01 | income actions never mention BalanceSnapshot | file-scan | `npx vitest run src/app/income/actions.test.ts` | ❌ W0 | ⬜ pending |
| 14-03-01 | 03 | 3 | UI-01 | — | DestructiveConfirmStep; no window.confirm | file-scan/unit | vitest on income components | ❌ W0 | ⬜ pending |
| 14-03-02 | 03 | 3 | D-16 | — | deletePerson blocked when income refs | unit | extend `src/app/debts/actions.test.ts` | ✅ extend | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Replace UI-00 in `src/lib/income.test.ts` (blocker for creating `src/app/income`)
- [ ] `src/lib/validations/income.ts` + `.test.ts`
- [ ] `nextOpenPlannedAsOf` (or chosen name) + tests in `income.test.ts`
- [ ] Update `nav.test.ts` expectations for Доходы
- [ ] `src/app/income/actions.test.ts` — isolation file-scan + happy-path validation errors
- [ ] Extend `deletePerson` tests for income Restrict

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| RU header copy: income does not change balances | SRC/ISO | Copy judgment | Open `/income`; confirm header honesty copy visible |
| Person-grouped list UX parity with debts | D-01..D-04 | Visual/UX | Compare `/income` list grouping to `/debts` |
| DestructiveConfirmStep delete flow | UI-01 | Interaction | Delete income source; confirm step appears, no `window.confirm` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
