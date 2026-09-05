---
phase: "10"
slug: "repayments-close-write-off"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-05"
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.11 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/app/debts/actions.test.ts src/lib/validations/debts.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/app/debts/actions.test.ts src/lib/validations/debts.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 0 | REPAY-01 | T-10-01 | Over-repay rejected by assert | unit | `npx vitest run src/app/debts/actions.test.ts` | ❌ W0 | ⬜ pending |
| 10-01-02 | 01 | 1 | REPAY-01, DEBT-04 | T-10-01 | createRepayment + CLOSED at zero | unit | `npx vitest run src/app/debts/actions.test.ts` | ❌ W0 | ⬜ pending |
| 10-02-01 | 02 | 1 | REPAY-03 | T-10-03 | deleteRecalc + reopen OPEN | unit | `npx vitest run src/app/debts/actions.test.ts` | ❌ W0 | ⬜ pending |
| 10-02-02 | 02 | 2 | DEBT-05 | T-10-02 | forgive server-side −remaining | unit | `npx vitest run src/app/debts/actions.test.ts` | ❌ W0 | ⬜ pending |
| 10-03-01 | 03 | 2 | REPAY-02 | — | Mixed timeline + labels | unit/smoke | grep + vitest | ❌ | ⬜ pending |
| 10-03-02 | 03 | 3 | D-11..D-13 | — | CLOSED subsection UX | smoke | grep DebtsList | ❌ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/app/debts/actions.test.ts` — stubs/extend for create/delete/forgive + status sync + over-repay + revalidatePath("/debts") only
- [ ] `src/lib/validations/debts.test.ts` — deleteRepaymentSchema / deleteSizeChangeSchema (+ forgive if separate)
- [ ] Optional: pure helper test for timeline sort / label mapping
- [ ] Framework install: none — vitest already present

*Existing infrastructure covers framework; Wave 0 extends phase-specific tests.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Debt row opens detail Dialog | D-01/D-02 | Dialog open UX | Click debt row on /debts → detail Dialog with forms + history |
| «Простить остаток» confirm copy | D-09 | RU copy + amount | Confirm shows remaining amount and that debt will close |
| «Закрытые (N)» collapsed default | D-11/D-12 | Accordion UX | CLOSED debts under collapsed subsection; expand to open detail |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
