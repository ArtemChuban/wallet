---
phase: 10-repayments-close-write-off
plan: 02
subsystem: debts
tags: [repayment, delete, timeline, closed-subsection, prisma, server-action, vitest]

requires:
  - phase: 10-01
    provides: createRepayment, DebtDetailDialog, DebtsList row-click detail
  - phase: 08-debts-schema-domain-math
    provides: remainingMinor, statusForRemaining
provides:
  - deleteRepaymentSchema / deleteSizeChangeSchema
  - deleteRepayment with status reopen
  - mixed newest-first event timeline in DebtDetailDialog
  - per-person collapsed «Закрытые (N)» subsection
affects:
  - 10-03 forgive/size-change delete and «Списание» labels

actuals:
  tokens: 4895
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - delete-by-id Zod + interactive $transaction reload ledger before statusForRemaining
    - in-dialog DestructiveConfirmStep for repayment delete (no window.confirm)

key-files:
  created: []
  modified:
    - src/lib/validations/debts.ts
    - src/lib/validations/debts.test.ts
    - src/app/debts/actions.ts
    - src/app/debts/actions.test.ts
    - src/app/debts/page.tsx
    - src/components/debts/DebtDetailDialog.tsx
    - src/components/debts/DebtFormDialog.tsx
    - src/components/debts/DebtsList.tsx

key-decisions:
  - "Size-change rows show «Изменение суммы» and no delete UI yet; deleteSizeChangeSchema stub for Plan 03"
  - "CLOSED split uses debt.status === CLOSED inside each person group, collapsed by default"

patterns-established:
  - "deleteRepayment: findUnique → delete → reload ledger → statusForRemaining → revalidate /debts only"
  - "Timeline sort: asOfDate DESC then id DESC; React text for notes (T-10-05)"

requirements-completed: [REPAY-02, REPAY-03]

coverage:
  - id: D1
    description: Mixed newest-first timeline with «Погашение» / «Изменение суммы» labels
    requirement: REPAY-02
    verification:
      - kind: other
        ref: grep Погашение + timeline merge in DebtDetailDialog.tsx
        status: pass
    human_judgment: true
    rationale: Visual order and RU labels need end-of-phase human-verify
  - id: D2
    description: deleteRepayment reopens OPEN when remaining > 0; miss/invalid skip revalidate; /debts only
    requirement: REPAY-03
    verification:
      - kind: unit
        ref: src/app/debts/actions.test.ts#deleteRepayment (REPAY-03 / DEBT-04)
        status: pass
    human_judgment: false
  - id: D3
    description: Per-person collapsed «Закрытые (N)» with detail still openable
    requirement: REPAY-02
    verification:
      - kind: other
        ref: grep Закрытые + DebtDetailDialog in DebtsList.tsx
        status: pass
    human_judgment: true
    rationale: Collapse UX and CLOSED detail access need visual confirm

duration: 5min
completed: 2026-09-05
status: complete
---

# Phase 10 Plan 02: History, delete, CLOSED grouping Summary

**Mixed newest-first debt event timeline with repayment delete+reopen and per-person collapsed «Закрытые (N)».**

## Performance

- **Duration:** 5min
- **Started:** 2026-09-05T12:07:33Z
- **Completed:** 2026-09-05T12:12:14Z
- **Tasks:** 3/3
- **Files modified:** 8

## Accomplishments

- deleteRepaymentSchema / deleteSizeChangeSchema (.strict() coerce id) + green deleteRepayment reopen suite
- DebtDetailDialog mixed timeline («Погашение» / «Изменение суммы») with DestructiveConfirmStep delete
- DebtsList per-person «Закрытые (N)» default-collapsed; CLOSED rows still open detail

## Task Commits

1. **Task 1: deleteRepaymentSchema + red delete/reopen action tests** - `f316dbe` (test)
2. **Task 2: deleteRepayment action + mixed timeline + delete confirm** - `3a59048` (feat)
3. **Task 3: Per-person collapsed «Закрытые (N)» subsection** - `e1a1aed` (feat)

**Plan metadata:** `5c9cbcf` (docs: complete plan)

## Files Created/Modified

- `src/lib/validations/debts.ts` — deleteRepaymentSchema, deleteSizeChangeSchema
- `src/lib/validations/debts.test.ts` — coerce / strict reject cases
- `src/app/debts/actions.ts` — deleteRepayment transactional status sync
- `src/app/debts/actions.test.ts` — reopen, miss, invalid id + DISOL
- `src/app/debts/page.tsx` — serialize repayment/size-change event rows
- `src/components/debts/DebtDetailDialog.tsx` — timeline + delete confirm
- `src/components/debts/DebtFormDialog.tsx` — DebtRow event types
- `src/components/debts/DebtsList.tsx` — «Закрытые (N)» disclosure

## Decisions Made

- Plan 03 owns size-change delete UI and «Списание» forgive label; schema stub landed here
- OPEN filter treats missing status as open (`status !== "CLOSED"`)

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

| File | Line | Stub | Reason |
|------|------|------|--------|
| src/lib/validations/debts.ts | deleteSizeChangeSchema | schema only, no action | Plan 03 owns deleteSizeChange |
| src/components/debts/DebtDetailDialog.tsx | size-change rows | no delete button | Plan 03 wires size-change delete |
| src/components/debts/DebtDetailDialog.tsx | size-change label | always «Изменение суммы» | «Списание» waits Plan 03 isForgive |

## Threat Flags

None — surface matches plan threat_model (deleteRepayment FormData id + /debts revalidate only + React text notes).

## Self-Check: PASSED

- FOUND: src/lib/validations/debts.ts, DebtDetailDialog, DebtsList, deleteRepayment, Закрытые
- FOUND: f316dbe, 3a59048, e1a1aed in git log
