---
phase: 10-repayments-close-write-off
plan: 01
subsystem: debts
tags: [repayment, prisma, server-action, dialog, status-sync, vitest]

requires:
  - phase: 08-debts-schema-domain-math
    provides: remainingMinor, statusForRemaining, assertRepaymentAmount
  - phase: 09-people-debts-crud-nav
    provides: /debts list, DebtFormDialog, createRepaymentSchema
provides:
  - createRepayment Server Action with transactional status sync
  - DebtDetailDialog repayment form (D-01)
  - DebtsList row-click open + Изменить stopPropagation (D-02/D-04)
affects:
  - 10-02 delete/history
  - 10-03 forgive/size-change

actuals:
  tokens: 5035
  tasks: 3
  commits: 2

tech-stack:
  added: []
  patterns:
    - prisma.$transaction for event write + Debt.status sync
    - controlled DebtDetailDialog from list row click

key-files:
  created:
    - src/components/debts/DebtDetailDialog.tsx
  modified:
    - src/app/debts/actions.ts
    - src/app/debts/actions.test.ts
    - src/app/debts/page.tsx
    - src/components/debts/DebtsList.tsx
    - src/components/debts/DebtFormDialog.tsx

key-decisions:
  - "Over-repay maps assertRepaymentAmount to Russian amountMajor error «Сумма больше остатка долга»"
  - "History chrome placeholder «Пока нет событий» until Plan 02 (discretion A4)"
  - "DebtRow.status optional for RSC serialize; page passes stored Debt.status"

patterns-established:
  - "Interactive $transaction: load ledger → assert → create DebtRepayment → statusForRemaining"
  - "revalidatePath(\"/debts\") only on debt writes (DISOL-01)"

requirements-completed: [REPAY-01, DEBT-04]

coverage:
  - id: D1
    description: createRepayment partial pay stays OPEN; full pay CLOSED; over-repay blocked; future date rejected; revalidate /debts only
    requirement: REPAY-01
    verification:
      - kind: unit
        ref: src/app/debts/actions.test.ts#createRepayment (REPAY-01 / DEBT-04)
        status: pass
    human_judgment: false
  - id: D2
    description: Debt.status synced via statusForRemaining after repayment write
    requirement: DEBT-04
    verification:
      - kind: unit
        ref: src/app/debts/actions.test.ts#sets status CLOSED when repayment equals remaining
        status: pass
    human_judgment: false
  - id: D3
    description: DebtDetailDialog opens from row click; meta Изменить uses stopPropagation
    requirement: REPAY-01
    verification:
      - kind: other
        ref: grep DebtDetailDialog + stopPropagation in DebtsList.tsx
        status: pass
    human_judgment: true
    rationale: Dialog open UX needs visual confirm at end-of-phase human-verify

duration: 3min
completed: 2026-09-05
status: complete
---

# Phase 10 Plan 01: createRepayment tracer Summary

**Partial dated repayments via dedicated DebtDetailDialog with transactional status sync to CLOSED at zero.**

## Performance

- **Duration:** 3min
- **Started:** 2026-09-05T12:01:40Z
- **Completed:** 2026-09-05T12:05:00Z
- **Tasks:** 3/3
- **Files modified:** 6

## Accomplishments

- Wave 0 red then green createRepayment suite: partial OPEN, full CLOSED, over-repay, future asOfDate, DISOL revalidatePath
- DebtDetailDialog repayment form (amount/asOfDate/note) separate from DebtFormDialog
- DebtsList entire row opens detail; «Изменить» stopPropagation keeps meta edit path

## Task Commits

1. **Task 1: Wave 0 red createRepayment tests** - `c98f54c` (test)
2. **Task 2: End-to-end create repayment tracer** - `883c825` (feat)
3. **Task 3: Keep DISOL + debts action suite green** - verification only (no code commit)

**Plan metadata:** `a6663ba` (docs: complete plan)

## Files Created/Modified

- `src/app/debts/actions.ts` — createRepayment with Zod, future-date gate, $transaction status sync
- `src/app/debts/actions.test.ts` — createRepayment coverage + mocks
- `src/components/debts/DebtDetailDialog.tsx` — dedicated Dialog repayment form
- `src/components/debts/DebtsList.tsx` — row click → detail; stopPropagation on meta edit
- `src/app/debts/page.tsx` — serialize debt.status
- `src/components/debts/DebtFormDialog.tsx` — DebtRow.status optional field

## Decisions Made

- Russian over-repay copy: «Сумма больше остатка долга»
- Empty history placeholder until Plan 02 timeline
- Task 3 verification-only — no domain math changes; no empty commit

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

| File | Line | Stub | Reason |
|------|------|------|--------|
| src/components/debts/DebtDetailDialog.tsx | history section | «Пока нет событий» | Plan 02 owns timeline (discretion A4) |

## Threat Flags

None — surface matches plan threat_model (createRepayment FormData + /debts revalidate only).

## Self-Check: PASSED

- FOUND: src/components/debts/DebtDetailDialog.tsx
- FOUND: createRepayment in src/app/debts/actions.ts
- FOUND: c98f54c, 883c825 in git log
