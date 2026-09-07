---
phase: 13-income-schema-domain-math
plan: 03
subsystem: domain
tags: [income, overdue, immutability, bigint, prisma, vitest, isolation]

requires:
  - phase: 13-income-schema-domain-math
    provides: list* occurrence helpers + income types from plans 01–02
provides:
  - isIncomeOverdue with injected today (FND-OVER / D-08 / D-13)
  - assertOneTimePlanImmutable after-actual plan lock (D-08)
  - Schema file locks + bidirectional ISO-01 light scan + UI-00 absence
affects:
  - 14-income-crud
  - 15-actual-overdue
  - 17-forecast-isolation

actuals:
  tokens: 1145
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Caller-injected today for overdue — never calendarDateToday in list APIs"
    - "assertOneTimePlanImmutable mirrors debts assertInitialImmutable throw style"
    - "Bidirectional file-scan ISO-01 (income ↔ net-worth / historical-series)"

key-files:
  created: []
  modified:
    - src/lib/income.ts
    - src/lib/income.test.ts

key-decisions:
  - "assertOneTimePlanImmutable throws when hasActual and plan date/amount differ; no-op when no actual"
  - "Schema locks from 13-01 retained; 13-03 adds NW↔income reverse scan + UI-00 existsSync"

patterns-established:
  - "Pattern: overdue = plannedAsOf < today && !hasActual"
  - "Pattern: pure plan-immutability gate before Server Actions (Phase 14+)"

requirements-completed: [FND-OVER, FND-MONEY, FND-SCHEMA, FND-OCC]

coverage:
  - id: D1
    description: isIncomeOverdue matrix (before/on/after today × hasActual) with injected today
    requirement: FND-OVER
    verification:
      - kind: unit
        ref: "src/lib/income.test.ts#isIncomeOverdue (FND-OVER / D-08 / D-13)"
        status: pass
    human_judgment: false
  - id: D2
    description: One-time plan immutability after actual exists (plannedAsOf / plannedAmountMinor)
    requirement: FND-OVER
    verification:
      - kind: unit
        ref: "src/lib/income.test.ts#assertOneTimePlanImmutable (D-08)"
        status: pass
    human_judgment: false
  - id: D3
    description: Schema locks for four models, BigInt, Restrict/Cascade, both @@unique slots
    requirement: FND-SCHEMA
    verification:
      - kind: unit
        ref: "src/lib/income.test.ts#income schema conventions"
        status: pass
    human_judgment: false
  - id: D4
    description: Light ISO-01 isolation + UI-00 no src/app/income; full npm test green
    requirement: FND-SCHEMA
    verification:
      - kind: unit
        ref: "src/lib/income.test.ts#income isolation (ISO-01 light)"
        status: pass
      - kind: other
        ref: "npm test (296 passed)"
        status: pass
    human_judgment: false

duration: 2min
completed: 2026-09-07
status: complete
---

# Phase 13 Plan 03: Overdue + schema/ISO locks Summary

**isIncomeOverdue + assertOneTimePlanImmutable on pure income.ts; schema/ISO/UI-00 locks; npm test 296 green.**

## Performance

- **Duration:** 2min
- **Started:** 2026-09-07T11:31:04Z
- **Completed:** 2026-09-07T11:33:22Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Overdue predicate with injected `today` (FND-OVER / D-08 / D-13)
- One-time plan immutability helper after actual (D-08), debts-style throw
- Schema + bidirectional ISO-01 scan + UI-00; full suite green

## Task Commits

Each task was committed atomically:

1. **Task 1: isIncomeOverdue + one-time plan immutability helper** - `653fd7d` (test) → `e14aafd` (feat)
2. **Task 2: Schema file locks + light ISO isolation scan + full suite** - `ef5654e` (test)

**Plan metadata:** (pending docs commit)

_Note: TDD tasks may have multiple commits (test → feat → refactor)_

## Files Created/Modified
- `src/lib/income.ts` - `isIncomeOverdue`, `assertOneTimePlanImmutable`, `OneTimePlanFields`
- `src/lib/income.test.ts` - overdue matrix, immutability cases, reverse ISO scan, UI-00

## Decisions Made
- Named helper `assertOneTimePlanImmutable` (throw) to mirror `assertInitialImmutable`
- Left FCST-01 REQUIREMENTS text and full INISO property suite to Phase 17 (plan assumptions)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
Phase 13 domain surface complete for Phase 14 CRUD (Server Actions / Zod / UI). No BalanceSnapshot writers; no `/income` routes.

## Self-Check: PASSED

- FOUND: src/lib/income.ts, income.test.ts, 13-03-SUMMARY.md
- FOUND: isIncomeOverdue, assertOneTimePlanImmutable
- FOUND: commits 653fd7d, e14aafd, ef5654e
- UI-00: src/app/income absent

---
*Phase: 13-income-schema-domain-math*
*Completed: 2026-09-07*
