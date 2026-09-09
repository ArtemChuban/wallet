---
phase: 19-schema-pure-grace-domain-math
plan: 02
subsystem: domain
tags: [credit-grace, cycle-windows, vitest, pure-helpers, GRISO]

requires:
  - phase: 19-schema-pure-grace-domain-math
    provides: cycleStartAsOf / dueAsOfForCycle tracers + dual-DOM schema (19-01)
provides:
  - listCycleWindows month-walk candidates (cycleStart membership)
  - resolveCurrentAndNext with gap-day current=null lock
  - isGraceOverdue inclusive-due calendar predicate
  - GRISO isolation smoke (NW / historical-series)
affects:
  - Phase 20 cycle list + overdue highlight
  - Phase 21 forecast prep
  - 19-03 Zod/action schedule surface (consumes schedule type)

actuals:
  tokens: 1721
  tasks: 2
  commits: 4

tech-stack:
  added: []
  patterns:
    - income-style monthsOverlapping local to credit-grace (no income/Prisma/NW imports)
    - Gap-day discretion locked: current null, next = upcoming statement cycle

key-files:
  created: []
  modified:
    - src/lib/credit-grace.ts
    - src/lib/credit-grace.test.ts

key-decisions:
  - "Window membership = cycleStartAsOf ∈ [from,to] (not due-only overlap)"
  - "Gap after due before next statement: current=null, next=M+1 (Pattern 3 lock)"
  - "isGraceOverdue = dueAsOf < today string compare; today injected"

patterns-established:
  - "credit-grace exports candidates only — no Prisma writes / no obligation invent"
  - "GRISO: file-scan test keeps NW/historical-series free of credit-grace"

requirements-completed: [CYCLE-01]

coverage:
  - id: D1
    description: listCycleWindows emits sorted {cycleStartAsOf,dueAsOf}; null→[]; adjacency + ordering probes
    requirement: CYCLE-01
    verification:
      - kind: unit
        ref: "src/lib/credit-grace.test.ts#listCycleWindows (D-11 / D-12 / D-13)"
        status: pass
    human_judgment: false
  - id: D2
    description: resolveCurrentAndNext deterministic on-cycle / mid-cycle / gap / inclusive due
    requirement: CYCLE-01
    verification:
      - kind: unit
        ref: "src/lib/credit-grace.test.ts#resolveCurrentAndNext (RESEARCH Pattern 3)"
        status: pass
    human_judgment: false
  - id: D3
    description: isGraceOverdue false on due day, true day after; today injected
    requirement: CYCLE-01
    verification:
      - kind: unit
        ref: "src/lib/credit-grace.test.ts#isGraceOverdue (D-07)"
        status: pass
    human_judgment: false
  - id: D4
    description: net-worth.ts and historical-series.ts do not import credit-grace (T-19-03)
    requirement: CYCLE-01
    verification:
      - kind: unit
        ref: "src/lib/credit-grace.test.ts#GRISO isolation smoke (T-19-03)"
        status: pass
      - kind: other
        ref: "grep -E credit-grace src/lib/net-worth.ts src/lib/historical-series.ts (expect no match)"
        status: pass
    human_judgment: false

duration: 3min
completed: 2026-09-09
status: complete
---

# Phase 19 Plan 02: Cycle window helpers Summary

**Pure credit-grace API: listCycleWindows, resolveCurrentAndNext, isGraceOverdue — candidates only, null-empty, gap locked, GRISO smoke green.**

## Performance

- **Duration:** 3min
- **Started:** 2026-09-09T09:11:16Z
- **Completed:** 2026-09-09T09:14:26Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Month-walk `listCycleWindows` with cycleStart membership, ascending order, null→[]
- `resolveCurrentAndNext` Pattern 3 table incl. gap-day `current: null`
- `isGraceOverdue` inclusive due day; NW/historical isolation smoke

## Task Commits

1. **Task 1 RED:** `2b50fdb` (test) — failing window / resolve tests
2. **Task 1 GREEN:** `5b96847` (feat) — listCycleWindows + resolveCurrentAndNext
3. **Task 2 RED:** `abef817` (test) — isGraceOverdue + GRISO smoke
4. **Task 2 GREEN:** `f2a6bd0` (feat) — isGraceOverdue

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/lib/credit-grace.ts` — schedule type, listCycleWindows, resolveCurrentAndNext, isGraceOverdue
- `src/lib/credit-grace.test.ts` — null/adjacency/ordering/gap/overdue/GRISO matrix

## Decisions Made

- Membership = `cycleStartAsOf` in range (due-only overlap not included)
- Gap-day: `current = null`, `next = M+1` (not “last” for overdue UI)
- Local `monthsOverlapping` copy — no import from `income.ts`

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 20 can consume window + overdue helpers for cycle list UI
- Plan 19-03 still owns Zod/action schedule writes
- STATE/ROADMAP not updated per executor dispatch instruction

## Known Stubs

None

## Self-Check: PASSED

- FOUND: `src/lib/credit-grace.ts` exports listCycleWindows, resolveCurrentAndNext, isGraceOverdue
- FOUND: `src/lib/credit-grace.test.ts` matrix green (14 passed)
- FOUND commits: `2b50fdb`, `5b96847`, `abef817`, `f2a6bd0`

---
*Phase: 19-schema-pure-grace-domain-math*
*Completed: 2026-09-09*
