---
phase: 10-repayments-close-write-off
plan: 04
subsystem: debts
tags: [prisma, server-actions, vitest, P2025, staleness, revalidatePath]

requires:
  - phase: 10-repayments-close-write-off
    provides: createRepayment / createSizeChange / forgiveRemaining / delete event actions
provides:
  - isRecordNotFound (Prisma P2025) helper + STALE_RECORD_REFRESH_MESSAGE
  - Mapped refresh RU + revalidatePath("/debts") on create/delete/forgive staleness
  - forgiveRemaining assertSizeDelta OVER_FLOOR / DELTA_ZERO mapped to actionable RU
affects:
  - phase-10 UAT concurrency smoke (G-10-5)
  - DebtDetailDialog stale-tab error UX (message only; dialog chrome unchanged)

actuals:
  tokens: 3241
  tasks: 2
  commits: 4

tech-stack:
  added: []
  patterns:
    - isRecordNotFound mirrors isUniqueNameViolation / isForeignKeyViolation
    - staleRecordRefreshState() revalidates /debts then returns fixed RU refresh copy
    - App-level REPAYMENT_NOT_FOUND / SIZE_CHANGE_NOT_FOUND treated as record-missing

key-files:
  created: []
  modified:
    - src/app/debts/actions.ts
    - src/app/debts/actions.test.ts

key-decisions:
  - "Shared staleRecordRefreshState for P2025 and app missing-record throws"
  - "forgiveRemaining wraps assertSizeDelta like createSizeChange; maps codes + raw messages"

patterns-established:
  - "Staleness catch: isRecordNotFound or *_NOT_FOUND → refresh RU + revalidatePath('/debts')"
  - "Never revalidatePath('/') on debt event failure paths (DISOL-01)"

requirements-completed: [REPAY-01, REPAY-03, DEBT-05]

coverage:
  - id: D1
    description: createRepayment maps Prisma P2025 to refresh RU and revalidates /debts
    requirement: REPAY-01
    verification:
      - kind: unit
        ref: "src/app/debts/actions.test.ts#maps P2025 not-found to refresh RU and revalidates /debts (G-10-5)"
        status: pass
    human_judgment: false
  - id: D2
    description: create/delete/forgive event actions map P2025 and missing-record to refresh RU + revalidate
    requirement: REPAY-03
    verification:
      - kind: unit
        ref: "src/app/debts/actions.test.ts#G-10-5 staleness cases"
        status: pass
      - kind: other
        ref: "npx vitest run src/app/debts/actions.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: forgiveRemaining maps assertSizeDelta OVER_FLOOR to actionable Russian (not opaque catch-all)
    requirement: DEBT-05
    verification:
      - kind: unit
        ref: "src/app/debts/actions.test.ts#maps assertSizeDelta OVER_FLOOR to actionable Russian (G-10-5)"
        status: pass
    human_judgment: false
  - id: D4
    description: deleteRepayment then createRepayment on same debt still succeeds
    requirement: REPAY-01
    verification:
      - kind: unit
        ref: "src/app/debts/actions.test.ts#then createRepayment on same debt still succeeds (G-10-5)"
        status: pass
    human_judgment: false

duration: 2min
completed: 2026-09-05
status: complete
---

# Phase 10 Plan 04: Staleness refresh mapping Summary

**Prisma P2025 / missing-record throws on debt event create/delete/forgive map to «Долг или запись не найдены. Обновите страницу.» with revalidatePath("/debts"); forgive assertSizeDelta no longer opaque**

## Performance

- **Duration:** 2 min
- **Started:** 2026-09-05T18:22:15Z
- **Completed:** 2026-09-05T18:24:50Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added `isRecordNotFound` (P2025) + shared `staleRecordRefreshState` for refresh RU + `/debts` revalidate
- Applied mapping on createRepayment, createSizeChange, forgiveRemaining, deleteRepayment, deleteSizeChange
- Mapped forgiveRemaining OVER_FLOOR / DELTA_ZERO (and raw assert messages) to createSizeChange RU field errors
- Vitest locks peer-delete→create success and P2025 ≠ generic save catch-all (G-10-5)

## Task Commits

Each task was committed atomically:

1. **Task 1 RED:** `f5b85d1` (test) — failing P2025 refresh mapping test
2. **Task 1 GREEN:** `6f90eff` (feat) — createRepayment P2025 → refresh RU
3. **Task 2 RED:** `8dbb6d7` (test) — staleness + peer-delete failing tests
4. **Task 2 GREEN:** `99c4c90` (feat) — expand mapping across create/delete/forgive

**Plan metadata:** (pending docs commit)

_Note: TDD tasks used test → feat commit pairs_

## Files Created/Modified
- `src/app/debts/actions.ts` — isRecordNotFound, stale refresh helper, catch branches
- `src/app/debts/actions.test.ts` — G-10-5 P2025, peer-delete, forgive OVER_FLOOR coverage

## Decisions Made
- Shared `staleRecordRefreshState()` for P2025 and `REPAYMENT_NOT_FOUND` / `SIZE_CHANGE_NOT_FOUND`
- forgiveRemaining wraps `assertSizeDelta` like createSizeChange; catch maps codes and raw English assert strings

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- G-10-5 closable; Phase 10 plans 01–04 have SUMMARYs
- Ready for verify-work / re-UAT concurrency smoke, then Phase 11

## Self-Check: PASSED

- FOUND: src/app/debts/actions.ts (`isRecordNotFound`, refresh RU)
- FOUND: src/app/debts/actions.test.ts (P2025 + peer-delete titles)
- FOUND commits: f5b85d1, 6f90eff, 8dbb6d7, 99c4c90
- vitest `src/app/debts/actions.test.ts`: PASS (35)

---
*Phase: 10-repayments-close-write-off*
*Completed: 2026-09-05*
