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

Aligned to executable PLAN task IDs and their `<automated>` commands (Wave 0 scaffolds folded into wave-1+ tasks — see Wave 0 note below).

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 14-01-T1 | 01 | 1 | UI-01 | — | Flip UI-00; nav «Доходы» + `/income` shell + D-11 copy | unit + file-scan | `npx vitest run src/lib/income.test.ts src/components/nav.test.ts && test -f src/app/income/page.tsx && grep -q 'Доходы' src/components/nav.tsx && grep -q 'href: "/income"' src/components/nav.tsx && grep -q 'Учёт доходов не меняет остатки на счетах.' src/app/income/page.tsx` | ✅ partial | ⬜ pending |
| 14-01-T2 | 01 | 1 | SRC-01, SRC-02 | — | Zod recurring + one-time create/update schemas | unit | `npx vitest run src/lib/validations/income.test.ts` | ❌ create | ⬜ pending |
| 14-01-T3 | 01 | 1 | D-02, D-09, D-10 | — | nextOpenPlannedAsOf past-unfilled + skip-filled | unit + file-scan | `npx vitest run src/lib/income.test.ts && grep -q 'nextOpenPlannedAsOf' src/lib/income.ts` | ✅ extend | ⬜ pending |
| 14-02-T1 | 02 | 2 | SRC-01, UI-01 | T-14-01 | createRecurringIncome + isolation scan scaffold | unit + file-scan | `npx vitest run src/app/income/actions.test.ts && test -f src/app/income/actions.ts && grep -q 'createRecurringIncome' src/app/income/actions.ts && grep -q 'revalidatePath("/income")' src/app/income/actions.ts` | ❌ create | ⬜ pending |
| 14-02-T2 | 02 | 2 | SRC-02, UI-01 | T-14-01 | One-time + update/delete + assertOneTimePlanImmutable | unit + file-scan | `npx vitest run src/app/income/actions.test.ts && grep -q 'createOneTimeIncome' src/app/income/actions.ts && grep -q 'assertOneTimePlanImmutable' src/app/income/actions.ts && grep -q 'deleteRecurringIncome\|deleteOneTimeIncome' src/app/income/actions.ts` | ❌ create | ⬜ pending |
| 14-02-T3 | 02 | 2 | D-16 | — | Person Restrict spans income + dual revalidatePath | unit + file-scan | `npx vitest run src/app/debts/actions.test.ts && grep -q 'долги или доходы' src/app/debts/actions.ts && grep -q 'revalidatePath("/income")' src/app/debts/actions.ts && grep -q 'долги или доходы' src/components/debts/DebtsList.tsx` | ✅ extend | ⬜ pending |
| 14-03-T1 | 03 | 3 | D-01..D-08, D-15 | — | Person-grouped list + create dialog + nextPlannedAsOf map | file-scan + unit | `test -f src/components/income/IncomeList.tsx && test -f src/components/income/IncomeFormDialog.tsx && grep -q 'defaultPersonId' src/components/income/IncomeList.tsx && grep -q 'primaryCurrencyCode' src/components/income/IncomeFormDialog.tsx && grep -q 'IncomeList' src/app/income/page.tsx && grep -q 'Новый доход' src/app/income/page.tsx && npx vitest run src/lib/validations/income.test.ts src/app/income/actions.test.ts src/components/nav.test.ts` | ❌ create | ⬜ pending |
| 14-03-T2 | 03 | 3 | D-12, D-16, UI-01 | — | DestructiveConfirmStep edit/delete; «Изменить» | unit + file-scan | `npx vitest run src/components/income/income-ui.test.ts && grep -q 'DestructiveConfirmStep' src/components/income/IncomeFormDialog.tsx && grep -q 'DestructiveConfirmStep' src/components/income/IncomeList.tsx && grep -q 'Изменить' src/components/income/IncomeList.tsx` | ❌ create | ⬜ pending |
| 14-03-T3 | 03 | 3 | UI-01 | — | Empty/error polish + full suite gate | full suite | `npm test` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

**Folded into wave 1+ executable plans** (no separate Wave 0 plan tasks). Former Wave 0 gaps map as follows:

- [x] Replace UI-00 in `src/lib/income.test.ts` — **14-01-T1**
- [x] `src/lib/validations/income.ts` + `.test.ts` — **14-01-T2**
- [x] `nextOpenPlannedAsOf` + tests in `income.test.ts` — **14-01-T3**
- [x] Update `nav.test.ts` expectations for Доходы — **14-01-T1**
- [x] `src/app/income/actions.test.ts` isolation + validation errors — **14-02-T1 / T2**
- [x] Extend `deletePerson` tests for income Restrict — **14-02-T3**

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
