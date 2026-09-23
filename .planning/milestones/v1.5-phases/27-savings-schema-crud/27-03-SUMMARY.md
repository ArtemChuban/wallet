---
phase: 27-savings-schema-crud
plan: 03
subsystem: api
tags: [savings, zod, server-actions, AccountFormDialog, updateAccount]

requires:
  - phase: 27-02
    provides: SAVINGS create path, parsePercentToBps, gated create form fields
provides:
  - updateAccount coherent SAVINGS name+annualRateBps+accrualDayOfMonth
  - updateAccountSchema with optional rate/DOM (DB-type gate in action)
  - AccountFormDialog edit chrome D-09 + SAVINGS rate/DOM prefill
  - annualRateBps/DOM serialized through page→AccountList for edit
affects:
  - 27-04 list countdown + accrual display
  - Phases 28–30 interest / forecast / MCP

actuals:
  tokens: 4786
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - updateAccount loads Account.type from DB; ignores client type/currency
    - SAVINGS edit requires rate+DOM never-null; non-SAVINGS name-only data keys
    - updateAccountName alias → updateAccount for legacy callers

key-files:
  created: []
  modified:
    - src/lib/validations/account.ts
    - src/app/accounts/actions.ts
    - src/app/accounts/actions.test.ts
    - src/lib/validations/account.test.ts
    - src/components/accounts/AccountFormDialog.tsx
    - src/components/accounts/AccountList.tsx
    - src/app/accounts/page.tsx

key-decisions:
  - "Single updateAccount action; updateAccountName kept as alias"
  - "Zod updateAccountSchema optional rate/DOM; SAVINGS requiredness enforced after findUnique"
  - "Page/list pass annualRateBps+DOM for edit prefill (countdown still Plan 04)"

patterns-established:
  - "SAVINGS metadata update writes Account only — never BalanceSnapshot (D-16)"
  - "Edit title «Изменить счёт» / description «Тип и валюта не меняются.» (D-09)"

requirements-completed: [ACCT-01, ACCT-03]

coverage:
  - id: D1
    description: updateAccount persists SAVINGS name + annualRateBps + accrualDayOfMonth together
    requirement: ACCT-01
    verification:
      - kind: unit
        ref: "npx vitest run src/app/accounts/actions.test.ts — updateAccount SAVINGS"
        status: pass
    human_judgment: false
  - id: D2
    description: Metadata update never calls BalanceSnapshot upsert/delete (D-16)
    requirement: ACCT-01
    verification:
      - kind: unit
        ref: "actions.test.ts — does not call BalanceSnapshot on SAVINGS metadata update"
        status: pass
    human_judgment: false
  - id: D3
    description: Edit dialog title «Изменить счёт»; SAVINGS shows Годовой % + День начисления; legacy name-only copy gone
    requirement: ACCT-03
    verification:
      - kind: unit
        ref: "grep Изменить счёт / Годовой % / День начисления; !grep только название"
        status: pass
    human_judgment: false

duration: 4min
completed: 2026-09-11
status: complete
---

# Phase 27 Plan 03: SAVINGS edit + form chrome Summary

**Coherent `updateAccount` persists SAVINGS name+bps+DOM from DB type; edit dialog «Изменить счёт» with gated rate/DOM prefill.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-09-11T16:19:48Z
- **Completed:** 2026-09-11T16:23:46Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Unskipped Wave 0 Plan-03 `describe.skip` / `it.todo` → green Vitest for SAVINGS update + D-16
- `updateAccount` + `updateAccountSchema`; non-SAVINGS stays name-only; client type/currency ignored
- Form: D-09 chrome, edit SAVINGS fields prefilled via `formatBpsToPercentMajor`, type switch clears rate/DOM on create

## Task Commits

1. **Task 1 RED: Coherent updateAccount tests** - `d67e004` (test)
2. **Task 1 GREEN: updateAccount implementation** - `01cf269` (feat)
3. **Task 2: AccountFormDialog edit/create chrome** - `68d286b` (feat)

**Plan metadata:** `cb96f7d` (docs: complete plan)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] Wired annualRateBps/DOM through page→AccountList**
- **Found during:** Task 2
- **Issue:** Edit prefill needs row ints; `AccountRow` alone without list/page props would leave blank rate/DOM
- **Fix:** Serialize `annualRateBps` + `accrualDayOfMonth` on accounts page; extend `AccountListItem`
- **Files modified:** `src/app/accounts/page.tsx`, `src/components/accounts/AccountList.tsx`
- **Commit:** `68d286b`

## Deferred Issues

- `src/lib/savings-accrual-display.test.ts` — Wave 0 Plan-04 plant imports missing module (tsc TS2307). Owned by 27-04; recorded in WINDOWS.md.

## Auth Gates

None.

## Known Stubs

None.

## Threat Flags

None — update path covered by plan threat model T-27-01…T-27-05.

## Self-Check: PASSED

- FOUND: `src/lib/validations/account.ts` (`updateAccountSchema`)
- FOUND: `src/app/accounts/actions.ts` (`updateAccount`)
- FOUND: `src/components/accounts/AccountFormDialog.tsx` («Изменить счёт»)
- FOUND: commits `d67e004`, `01cf269`, `68d286b`
- FOUND: no `describe.skip` / `it.todo` for Plan-03 update contracts
