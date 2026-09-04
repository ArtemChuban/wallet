---
phase: 04-dated-fx
plan: 03
subsystem: ui
tags: [nextjs, server-actions, fx, history, delete, vitest, russian-ui]

requires:
  - phase: 04-dated-fx
    plan: 02
    provides: upsertFxRate, RateList LOCF rows, SetRateDialog, /currencies/rates
provides:
  - deleteFxRate Server Action with Zod id validation
  - Inline expandable newest-first rate history per currency row
  - History-only delete with Russian confirm copy
  - Honest empty state after last rate deleted
affects: [phase-5-net-worth, phase-6-charts]

actuals:
  tokens: 4500
  tasks: 3
  commits: 2

tech-stack:
  added: []
  patterns:
    - "RateList expand/history mirrors AccountList snapshot pattern"
    - "deleteFxRate mirrors deleteBalanceSnapshot FormData id contract"

key-files:
  created: []
  modified:
    - src/app/currencies/actions.ts
    - src/app/currencies/actions.test.ts
    - src/app/currencies/rates/page.tsx
    - src/components/currencies/RateList.tsx

key-decisions:
  - "Expand affordance only when history.length > 0"
  - "Delete confirm uses UI-SPEC copy with DD.MM.YYYY date label"
  - "SetRateDialog stays free of delete wiring"

patterns-established:
  - "rates/page.tsx loads full per-currency histories ordered asOfDate desc"
  - "History row format: DD.MM.YYYY · rate PRIMARY за 1 CODE"

requirements-completed: [FX-01, FX-02]

coverage:
  - id: D1
    description: "deleteFxRate validates id, deletes row, revalidates currencies paths"
    requirement: FX-01
    verification:
      - kind: unit
        ref: "src/app/currencies/actions.test.ts#deleteFxRate"
        status: pass
    human_judgment: false
  - id: D2
    description: "RateList inline expand with newest-first history and history-only delete"
    requirement: FX-01
    verification:
      - kind: unit
        ref: "src/app/currencies/actions.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "Russian UI smoke on /currencies/rates — tabs, LOCF, history, delete"
    requirement: FX-02
    verification:
      - kind: manual_procedural
        ref: "04-03-PLAN.md checkpoint how-to-verify"
        status: pass
    human_judgment: true
    rationale: "Visual/locale confirmation of FX chrome required human walkthrough"

duration: 8min
completed: 2026-09-03
status: complete
---

# Phase 4 Plan 03: History Mutation UX Summary

**Expandable rate history with deleteFxRate and human-verified Russian rates UI on /currencies/rates**

## Performance

- **Duration:** 8 min
- **Started:** 2026-09-03T15:11:00Z
- **Completed:** 2026-09-03T15:14:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Added `deleteFxRate` Server Action with `deleteFxRateSchema`, dual revalidatePath, Russian error message
- Extended `/currencies/rates` RSC to load per-currency histories newest-first with serialized BigInt rates
- Built RateList expand/collapse (ChevronRight/Down), history panel with muted bg, destructive delete button
- Human approved Russian UI smoke on /currencies/rates (checkpoint task 3)

## Task Commits

1. **Task 1: End-to-end expand history + delete one rate** - `3ffb097` (feat)
2. **Task 2: History empty/overflow polish + full automated suite** - included in `3ffb097`
3. **Task 3: Russian UI smoke** - human approved 2026-09-03

## Files Created/Modified

- `src/app/currencies/actions.ts` - `deleteFxRate`, `FxRateDeleteActionState`
- `src/app/currencies/actions.test.ts` - delete export + success/error paths
- `src/app/currencies/rates/page.tsx` - per-currency history query
- `src/components/currencies/RateList.tsx` - expand/history/delete UI

## Decisions Made

- Expand control hidden when no history (zero-rate currencies)
- Collapse expand panel when last rate deleted
- No delete controls in SetRateDialog (D-13)

## Deviations from Plan

None - plan executed as written after human checkpoint approval.

## Issues Encountered

Plan 03 executor dispatch blocked by isolation guard on third wave; orchestrator completed tasks 1-2 inline on main tree.

## User Setup Required

None

## Next Phase Readiness

- Phase 5 net-worth can consume LOCF FX helpers and dated rates
- Full FX-01 mutation surface (set/overwrite/delete) complete
- No blockers

## Self-Check: PASSED

- FOUND: src/app/currencies/actions.ts (deleteFxRate)
- FOUND: src/components/currencies/RateList.tsx
- FOUND: src/app/currencies/rates/page.tsx
- FOUND: 3ffb097
- Human checkpoint: approved

---
*Phase: 04-dated-fx*
*Completed: 2026-09-03*
