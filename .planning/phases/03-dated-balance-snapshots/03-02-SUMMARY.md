---
phase: 03-dated-balance-snapshots
plan: 02
subsystem: ui
tags: [server-action, dialog, locf, balance-snapshot, credit, vitest]

requires:
  - phase: 03-dated-balance-snapshots
    provides: BalanceSnapshot schema, getBalanceAsOf, calendarDateToday, setBalanceSchema
provides:
  - upsertBalanceSnapshot Server Action with future-date and credit bounds
  - SetBalanceDialog with formKey remount and Russian copy
  - /accounts LOCF-as-of-today row display + first-balance CTA
affects:
  - 03-03 snapshot history delete UI
  - Phase 04+ FX and net worth as-of reads

actuals:
  tokens: 6044
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - Dialog formKey remount + useActionState for set-balance
    - Batch LOCF via findMany asOfDate lte today then first-per-accountId
    - FIAT_CREDIT available stored in amountMinor; debt derived via creditDebtMinor

key-files:
  created:
    - src/components/accounts/SetBalanceDialog.tsx
    - src/components/accounts/SetBalanceDialog.test.ts
  modified:
    - src/app/accounts/actions.ts
    - src/app/accounts/actions.test.ts
    - src/app/accounts/page.tsx
    - src/components/accounts/AccountList.tsx

key-decisions:
  - "Batch LOCF on page with findMany lte today (not N getBalanceAsOf calls)"
  - "Credit labels shipped in tracer dialog; bounds enforced in Task 2 TDD"

patterns-established:
  - "upsertBalanceSnapshot: Zod → future check → parseMajorToMinor → credit 0..limit → upsert accountId_asOfDate"
  - "AccountList LOCF null → accent «Задать первый баланс»; else outline «Задать баланс»"

requirements-completed: [BAL-01, BAL-02]

coverage:
  - id: D1
    description: upsertBalanceSnapshot rejects future asOfDate and upserts on accountId_asOfDate
    requirement: BAL-01
    verification:
      - kind: unit
        ref: src/app/accounts/actions.test.ts#upsertBalanceSnapshot (BAL-01 / D-09 / D-12)
        status: pass
    human_judgment: false
  - id: D2
    description: SetBalanceDialog formKey remount, type=date, pending Сохранить баланс
    requirement: BAL-01
    verification:
      - kind: unit
        ref: src/components/accounts/SetBalanceDialog.test.ts
        status: pass
    human_judgment: false
  - id: D3
    description: FIAT_CREDIT available 0..limit; no debt field in upsert payload
    requirement: BAL-01
    verification:
      - kind: unit
        ref: src/app/accounts/actions.test.ts#upsertBalanceSnapshot credit available
        status: pass
    human_judgment: false
  - id: D4
    description: AccountList LOCF display + first-balance CTA; page batch LOCF today
    requirement: BAL-02
    verification:
      - kind: other
        ref: grep Задать первый баланс AccountList; calendarDateToday page.tsx
        status: pass
    human_judgment: true
    rationale: Visual LOCF layout and CTA hierarchy need human glance on /accounts

duration: 6min
completed: 2026-09-03
status: complete
---

# Phase 03 Plan 02: Dated Balance Snapshots Summary

**Set-balance Dialog → upsertBalanceSnapshot → LOCF-as-of-today on /accounts, including FIAT_CREDIT available/debt (BAL-01, BAL-02).**

## Performance

- **Duration:** 6 min
- **Started:** 2026-09-03T11:10:00Z
- **Completed:** 2026-09-03T11:15:44Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- End-to-end non-credit set-balance via Dialog with future-date reject and compound upsert
- FIAT_CREDIT available 0..limit validation; debt derived on list row only
- Pending UX + Russian error surfaces; first-balance vs secondary CTAs

## Task Commits

Each task was committed atomically:

1. **Task 1: End-to-end set non-credit balance via Dialog + LOCF on list** - `8981dc0` (feat, tracer)
2. **Task 2 RED: Credit available bounds tests** - `12e5acd` (test)
3. **Task 2 GREEN: FIAT_CREDIT available 0..limit** - `4f06b52` (feat)
4. **Task 3: Set-balance pending UX + Russian error copy smoke** - `ab42d2d` (feat)

**Plan metadata:** `e92bb54` (docs: complete plan)

## Files Created/Modified

- `src/app/accounts/actions.ts` — `upsertBalanceSnapshot` + `BalanceActionState`
- `src/app/accounts/actions.test.ts` — future-date, upsert, credit bounds, no-debt payload
- `src/app/accounts/page.tsx` — `calendarDateToday` + batch LOCF props
- `src/components/accounts/SetBalanceDialog.tsx` — Dialog + formKey + date/amount
- `src/components/accounts/SetBalanceDialog.test.ts` — source-contract tests
- `src/components/accounts/AccountList.tsx` — LOCF display + set-balance CTAs

## Decisions Made

- Batch LOCF with one `findMany` ordered desc, first hit per `accountId`.
- Credit dialog labels included in tracer; bounds gated by Task 2 TDD (CONTEXT-lock waiver, no checkpoint).

## Deviations from Plan

None - plan executed exactly as written.

## Auth Gates

None.

## Threat Flags

None — mitigations T-03-01/05/06/07/08 covered by Zod + account findUnique + future check + credit bounds + amountMinor-only upsert.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: SetBalanceDialog.tsx; SetBalanceDialog.test.ts; actions.ts upsert; AccountList CTA; page calendarDateToday
- FOUND commits: 8981dc0, 12e5acd, 4f06b52, ab42d2d
- VERIFY: actions + SetBalanceDialog + balances tests passed
