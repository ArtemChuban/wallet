---
phase: 03-dated-balance-snapshots
plan: 03
subsystem: ui
tags: [balance-snapshot, history, delete, server-action, account-list, vitest]

requires:
  - phase: 03-dated-balance-snapshots
    provides: upsertBalanceSnapshot, SetBalanceDialog, LOCF row display, deleteBalanceSchema
provides:
  - deleteBalanceSnapshot Server Action with Russian error path
  - Inline expandable newest-first snapshot history on AccountList
  - History-only delete with dated confirm; honest empty CTA after last delete
affects:
  - Phase 04+ FX and net worth as-of reads
  - Phase 03 verification / UAT

actuals:
  tokens: 4360
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - Inline expand history under account row (no Sheet/Dialog-only history)
    - deleteBalanceSnapshot only from history controls; SetBalanceDialog stays delete-free
    - Client-safe creditDebtMinor for history/row debt display

key-files:
  created: []
  modified:
    - src/app/accounts/actions.ts
    - src/app/accounts/actions.test.ts
    - src/app/accounts/page.tsx
    - src/components/accounts/AccountList.tsx

key-decisions:
  - "Human-verify PASS for Russian /accounts balance chrome (set, LOCF, credit, history delete)"
  - "History panel bg-muted/40; delete destructive; expand aria Показать/Скрыть историю балансов"

patterns-established:
  - "page.tsx serializes per-account snapshots newest-first as strings for AccountList"
  - "window.confirm «Удалить снимок за {DD.MM.YYYY}? Это нельзя отменить.» before delete"

requirements-completed: [BAL-01, BAL-02]

coverage:
  - id: D1
    description: deleteBalanceSnapshot validates id, deletes row, revalidatePath; Russian error on failure
    requirement: BAL-01
    verification:
      - kind: unit
        ref: src/app/accounts/actions.test.ts#deleteBalanceSnapshot
        status: pass
    human_judgment: false
  - id: D2
    description: Inline expand history newest-first; non-credit date+amount; credit date+available only; no текущий badge
    requirement: BAL-02
    verification:
      - kind: other
        ref: grep Показать историю балансов / Удалить AccountList; ! grep deleteBalanceSnapshot SetBalanceDialog
        status: pass
    human_judgment: false
  - id: D3
    description: After last snapshot delete, expand gone and «Задать первый баланс» returns with no invented 0
    requirement: BAL-02
    verification:
      - kind: other
        ref: grep Задать первый баланс / bg-muted AccountList; npm test
        status: pass
    human_judgment: false
  - id: D4
    description: Russian UI smoke on /accounts — set-balance, LOCF, credit, history delete match UI-SPEC
    requirement: BAL-01
    verification: []
    human_judgment: true
    rationale: Locale copy, LOCF visual correctness, and confirm dialog wording require human judgment on live UI

duration: 15min
completed: 2026-09-03
status: complete
---

# Phase 03 Plan 03: History Expand + Delete Summary

**Inline newest-first balance history with history-only deleteBalanceSnapshot and human-verified Russian /accounts chrome**

## Performance

- **Duration:** 15 min (implementation + human-verify close-out)
- **Started:** 2026-09-03T11:15:00Z
- **Completed:** 2026-09-03T11:29:22Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- `deleteBalanceSnapshot` Server Action + tests; delete only from expanded history
- AccountList inline expand/collapse with muted panel, destructive delete, honest empty CTA
- Human-verify PASS: Russian set-balance, LOCF, credit available/debt, history delete on /accounts

## Task Commits

Each task was committed atomically:

1. **Task 1: End-to-end expand history + delete one snapshot** - `e53a85b` (feat)
2. **Task 2: History empty/overflow polish + full automated suite** - `b68f639` (feat)
3. **Task 3: Russian UI smoke on /accounts balances** - human-verify PASS (no code commit)

**Plan metadata:** `e9b00f8` (docs: complete plan)

_Note: Task 3 was checkpoint:human-verify; user response `pass`._

## Files Created/Modified
- `src/app/accounts/actions.ts` - `deleteBalanceSnapshot` with Zod id + Russian error
- `src/app/accounts/actions.test.ts` - delete success/error coverage
- `src/app/accounts/page.tsx` - newest-first snapshot histories serialized for list
- `src/components/accounts/AccountList.tsx` - expand UI, history rows D-14–D-16, confirm delete

## Decisions Made
- Human-verify PASS for Russian /accounts balance chrome
- History stays under the row (D-13); delete stays out of SetBalanceDialog (D-11)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 03 BAL-01/BAL-02 UI complete (schema + set-balance + history delete)
- Ready for Phase 03 verification / Phase 04 FX work
- No stubs blocking phase goal

## Self-Check: PASSED

- FOUND: `src/app/accounts/actions.ts` (`deleteBalanceSnapshot`)
- FOUND: `src/components/accounts/AccountList.tsx` (expand + Удалить + first-balance CTA)
- FOUND: commits `e53a85b`, `b68f639` on HEAD ancestry
- Human Task 3: approved (`pass`)

---
*Phase: 03-dated-balance-snapshots*
*Completed: 2026-09-03*
