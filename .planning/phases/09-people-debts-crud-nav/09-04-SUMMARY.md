---
phase: 09-people-debts-crud-nav
plan: 04
subsystem: ui
tags: [accounts, confirm, destructive-ux, d-17, window-confirm]

requires:
  - phase: 09-people-debts-crud-nav
    provides: DestructiveConfirmStep Dialog second-step pattern (D-16)
provides:
  - AccountList balance-snapshot delete via in-dialog DestructiveConfirmStep (D-17)
  - Source regression test blocking browser native confirm in AccountList
affects:
  - Phase 09 verification / UAT
  - Future RateList confirm migration (explicitly out of scope here)

actuals:
  tokens: 1274
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - AccountList opens Dialog + DestructiveConfirmStep for snapshot delete (same as DebtsList person delete)
    - Source-scan vitest gate against window.confirm in AccountList

key-files:
  created:
    - src/components/accounts/AccountList.test.ts
  modified:
    - src/components/accounts/AccountList.tsx

key-decisions:
  - "Reuse DestructiveConfirmStep from debts for accounts snapshot delete (D-17)"
  - "AccountList.test.ts (not .tsx) so vitest include src/**/*.test.ts picks it up"
  - "RateList window.confirm left untouched per D-17 scope"

patterns-established:
  - "List-row destructive entry opens dedicated confirm Dialog wrapping DestructiveConfirmStep"
  - "Snapshot confirm copy: Удалить снимок за {date}? Это нельзя отменить."

requirements-completed: [PERSON-02, DNAV-01]

coverage:
  - id: D1
    description: AccountList snapshot delete no longer references browser native confirm
    requirement: PERSON-02
    verification:
      - kind: unit
        ref: src/components/accounts/AccountList.test.ts#does not use a browser native confirm API
        status: pass
    human_judgment: false
  - id: D2
    description: UI-SPEC Russian snapshot confirm copy and DestructiveConfirmStep wired
    requirement: PERSON-02
    verification:
      - kind: unit
        ref: src/components/accounts/AccountList.test.ts#uses UI-SPEC Russian snapshot confirm copy template
        status: pass
    human_judgment: false
  - id: D3
    description: DNAV-01 nav order/labels still green after accounts confirm migration
    requirement: DNAV-01
    verification:
      - kind: unit
        ref: src/components/nav.test.ts#orders Главная · Счета · Долги · Валюты with correct hrefs
        status: pass
    human_judgment: false
  - id: D4
    description: In-dialog confirm pending disable and entry/confirm labels for snapshot delete
    requirement: PERSON-02
    verification:
      - kind: other
        ref: "grep DestructiveConfirmStep + Удалить снимок + pending={isPending}; ! grep window.confirm AccountList"
        status: pass
    human_judgment: true
    rationale: Visual confirm step and pending disable need human UAT beyond source gates

duration: 2min
completed: 2026-09-04
status: complete
---

# Phase 09 Plan 04: AccountList Confirm Migration Summary

**Balance-snapshot delete on `/accounts` uses in-dialog DestructiveConfirmStep (D-17) with UI-SPEC Russian loss copy; AccountList no longer calls window.confirm; RateList untouched; DNAV-01 still green.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-09-04T21:43:55Z
- **Completed:** 2026-09-04T21:45:57Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Red source-scan regression for D-17 (`AccountList.test.ts`)
- Migrated snapshot delete to Dialog + `DestructiveConfirmStep` with pending disable
- Kept `deleteBalanceSnapshot` FormData `id` contract and `role="alert"` errors; RateList unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: Regression test: AccountList must not use browser native confirm** - `0614f8b` (test)
2. **Task 2: Migrate snapshot delete to in-dialog second-step confirm** - `7f64332` (feat)

**Plan metadata:** `8813b61` (docs: complete plan)

## Files Created/Modified

- `src/components/accounts/AccountList.test.ts` - D-17 / PERSON-02 source gates
- `src/components/accounts/AccountList.tsx` - Dialog + DestructiveConfirmStep; entry/confirm «Удалить снимок»

## Decisions Made

- Reused shared `DestructiveConfirmStep` rather than duplicating local confirm UI
- Named test `AccountList.test.ts` to match vitest `include: ["src/**/*.test.ts"]` (plan said `.tsx`)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Test file extension `.ts` instead of `.tsx`**
- **Found during:** Task 1
- **Issue:** Plan specified `AccountList.test.tsx`, but `vitest.config.ts` only includes `src/**/*.test.ts`, so a `.tsx` file ran 0 tests
- **Fix:** Created `src/components/accounts/AccountList.test.ts`
- **Files modified:** `src/components/accounts/AccountList.test.ts`
- **Commit:** `0614f8b`

## Verification Results

- `npx vitest run src/components/accounts/AccountList.test.ts src/components/nav.test.ts src/app/accounts/actions.test.ts` — PASS (16)
- `! grep window.confirm src/components/accounts/AccountList.tsx` — OK
- `grep Удалить снимок за src/components/accounts/AccountList.tsx` — OK
- RateList still has `window.confirm` (intentionally out of scope)

## TDD Gate Compliance

1. RED: `test(09-04): ...` (`0614f8b`) — present
2. GREEN: `feat(09-04): ...` (`7f64332`) — present
3. REFACTOR: not needed

## Known Stubs

None.

## Threat Flags

None — no new trust-boundary surface beyond planned confirm UI gate (T-09-10).

## Self-Check: PASSED

- FOUND: `src/components/accounts/AccountList.test.ts`, `AccountList.tsx`, `09-04-SUMMARY.md`
- FOUND: commits `0614f8b`, `7f64332`
- FOUND: no `window.confirm`; `DestructiveConfirmStep` present
