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
| 10-01-01 | 01 | 1 | REPAY-01 | T-10-01 | Over-repay rejected by assert | unit | `npx vitest run src/app/debts/actions.test.ts; test $? -ne 0` | ✅ | ⬜ pending |
| 10-01-02 | 01 | 1 | REPAY-01, DEBT-04 | T-10-01, T-10-04 | createRepayment + CLOSED at zero + detail Dialog | unit | `npx vitest run src/app/debts/actions.test.ts && grep -q createRepayment src/app/debts/actions.ts` | ✅ | ⬜ pending |
| 10-01-03 | 01 | 1 | DISOL-01 | T-10-04 | DISOL + suite green | unit | `npx vitest run src/lib/debts.test.ts && npx vitest run src/app/debts/actions.test.ts` | ✅ | ⬜ pending |
| 10-02-01 | 02 | 2 | REPAY-03 | T-10-03 | delete schemas + red reopen tests | unit | `npx vitest run src/lib/validations/debts.test.ts` | ✅ | ⬜ pending |
| 10-02-02 | 02 | 2 | REPAY-02, REPAY-03 | T-10-03 | deleteRepayment + timeline + confirm | unit | `npx vitest run src/app/debts/actions.test.ts src/lib/validations/debts.test.ts` | ✅ | ⬜ pending |
| 10-02-03 | 02 | 2 | D-11..D-13 | — | CLOSED subsection UX | smoke | `grep -q 'Закрытые' src/components/debts/DebtsList.tsx` | ✅ | ⬜ pending |
| 10-03-01 | 03 | 3 | DEBT-05 | — | Human lock isForgive persistence | checkpoint | decision `isForgive-boolean` | n/a | ⬜ pending |
| 10-03-02 | 03 | 3 | DEBT-05 | T-10-02 | migrate + forgive/size-change actions | unit+migrate | `DATABASE_URL=file:./data/wallet.db npx prisma migrate deploy` + vitest actions | ❌ W0 | ⬜ pending |
| 10-03-03 | 03 | 3 | DEBT-05 / D-07..D-10 | T-10-02 | Forgive UI + «Списание» labels | unit/smoke | vitest + grep Простить/Списание | ❌ | ⬜ pending |
| 10-04-01 | 04 | 4 | REPAY-01 / G-10-5 | T-10-G5-01 | createRepayment P2025 → refresh RU + revalidate /debts | unit | `grep -q 'maps P2025 not-found to refresh' src/app/debts/actions.test.ts && npx vitest run src/app/debts/actions.test.ts -t "maps P2025 not-found to refresh"` | ✅ | ⬜ pending |
| 10-04-02 | 04 | 4 | REPAY-03, DEBT-05 / G-10-5 | T-10-G5-02 | All event actions map staleness; peer-delete then create still succeeds | unit | `npx vitest run src/app/debts/actions.test.ts` | ✅ | ⬜ pending |

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
