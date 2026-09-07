---
phase: 13-income-schema-domain-math
plan: 02
subsystem: domain
tags: [income, occurrences, freeze, bigint, vitest]

requires:
  - phase: 13-income-schema-domain-math
    provides: listRecurringOccurrences tracer + income types in income.ts
provides:
  - Freeze-aware listRecurringOccurrences (month-keyed A2)
  - listOneTimeOccurrences with optional actual join
  - Thin listAllInRange merge for explicit inclusive windows
affects:
  - 13-03 overdue / plan-immutability helpers
  - Phases 14–17 income UI and forecast listing

actuals:
  tokens: 2335
  tasks: 2
  commits: 4

tech-stack:
  added: []
  patterns:
    - Month-keyed freeze merge (parent×YYYY-MM) — frozen plannedAsOf wins over candidate
    - Strict from/to occurrence APIs with no default horizon
    - Kind-tagged listAllInRange merge of recurring + one-time

key-files:
  created: []
  modified:
    - src/lib/income.ts
    - src/lib/income.test.ts

key-decisions:
  - "A2 month-keyed freeze: one slot per parent×month; frozen actual plannedAsOf replaces differing DOM candidate"
  - "listAllInRange takes structured input + explicit from/to; sorts by plannedAsOf then parentId"
  - "One-time actual join attaches optional actual blob without mutating plan fields"

patterns-established:
  - "Pattern: listRecurringOccurrences freeze-merge before candidate emit"
  - "Pattern: listOneTimeOccurrences emits definition plannedAsOf only when in inclusive range"

requirements-completed: [FND-OCC, FND-MONEY]

coverage:
  - id: D1
    description: Freeze after DOM change keeps Jan actual plannedAsOf; Feb uses new clamp
    requirement: FND-OCC
    verification:
      - kind: unit
        ref: "src/lib/income.test.ts#keeps Jan frozen plannedAsOf after DOM change; Feb uses new clamp (A2)"
        status: pass
    human_judgment: false
  - id: D2
    description: Inclusive range bounds (from==to, boundary inclusion) with bigint amounts
    requirement: FND-MONEY
    verification:
      - kind: unit
        ref: "src/lib/income.test.ts#from==to includes single day when plannedAsOf equals it"
        status: pass
      - kind: unit
        ref: "src/lib/income.test.ts#includes boundary plannedAsOf == from and == to; excludes outside"
        status: pass
    human_judgment: false
  - id: D3
    description: listOneTimeOccurrences in/out of range + optional actual join
    requirement: FND-OCC
    verification:
      - kind: unit
        ref: "src/lib/income.test.ts#emits one-time slot when plannedAsOf in inclusive range with bigint amount"
        status: pass
      - kind: unit
        ref: "src/lib/income.test.ts#joins optional actual by (parentId, plannedAsOf) without mutating plan fields"
        status: pass
    human_judgment: false
  - id: D4
    description: listAllInRange merges recurring + one-time for explicit window
    requirement: FND-OCC
    verification:
      - kind: unit
        ref: "src/lib/income.test.ts#listAllInRange merges recurring + one-time for explicit from/to"
        status: pass
    human_judgment: false

duration: 2min
completed: 2026-09-07
status: complete
---

# Phase 13 Plan 02: Occurrence freeze + one-time merge Summary

**Freeze-aware recurring listing (month-keyed A2) plus listOneTimeOccurrences and thin listAllInRange with inclusive windows and bigint plan amounts**

## Performance

- **Duration:** 2min
- **Started:** 2026-09-07T11:25:56Z
- **Completed:** 2026-09-07T11:28:21Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Month-keyed freeze keeps actual `plannedAsOf` when DOM changes; empty months use current clamp
- Inclusive `[from, to]` boundaries and `from==to` single-day coverage
- `listOneTimeOccurrences` + `listAllInRange` complete virtual plan surface for Phases 14–17

## Task Commits

Each task was committed atomically:

1. **Task 1: Freeze-aware recurring occurrences + inclusive range** - `e937807` (test) → `6cee0cb` (feat)
2. **Task 2: listOneTimeOccurrences + listAllInRange merge** - `b3a493c` (test) → `85e79f8` (feat)

**Plan metadata:** `247186e` (docs: complete plan)

## Files Created/Modified
- `src/lib/income.ts` — freeze-merge `listRecurringOccurrences`; `listOneTimeOccurrences`; `listAllInRange`
- `src/lib/income.test.ts` — freeze/DOM, inclusive bounds, one-time, merge cases

## Decisions Made
- A2 month-keyed freeze (not dual-row months)
- Structured `ListAllInRangeInput` with required `from`/`to`
- One-time optional `actual` join preserves plan fields

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Occurrence API ready for Plan 03 (`isIncomeOverdue`, one-time plan immutability)
- Still no `/income` UI; no BalanceSnapshot / NW imports

## TDD Gate Compliance
- RED commits: `e937807`, `b3a493c`
- GREEN commits: `6cee0cb`, `85e79f8`

## Self-Check: PASSED
- FOUND: `src/lib/income.ts` (`listOneTimeOccurrences`, `listAllInRange`, freeze-aware `listRecurringOccurrences`)
- FOUND: `src/lib/income.test.ts`
- FOUND commits: `e937807`, `6cee0cb`, `b3a493c`, `85e79f8`

---
*Phase: 13-income-schema-domain-math*
*Completed: 2026-09-07*
