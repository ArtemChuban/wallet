---
phase: 05-net-worth-dashboard
plan: 02
subsystem: ui
tags: [net-worth, credit, fiat-credit, isPartial, dashboard, vitest]

requires:
  - phase: 05-net-worth-dashboard
    provides: computeNetWorthRows, DashboardAccountList, / hero Капитал
provides:
  - FIAT_CREDIT native доступно/долг and primary debt-only display (ACCT-03, D-15)
  - no_balance / no_fx row copy with excludeReason wiring (D-09, D-10)
  - isPartial «Итог неполный» callout between hero and list (D-11)
affects: [05-03, phase-6-charts]

actuals:
  tokens: 2253
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "DashboardAccountList variants: credit labels + exclusion hints; amounts pre-formatted on RSC"
    - "isPartial from computeNetWorthRows drives banner; hero always rendered"
    - "Primary credit column is долг only — available never in hero math or primary column"

key-files:
  created: []
  modified:
    - src/lib/net-worth.test.ts
    - src/components/dashboard/DashboardAccountList.tsx
    - src/app/page.tsx

key-decisions:
  - "Credit/exclusion labels live in DashboardAccountList with literal UI-SPEC Russian strings; page passes formatted majors + excludeReason/isCredit"
  - "Partial banner omitted when isPartial false; body copy verbatim from UI-SPEC"

patterns-established:
  - "Row display mode = excludeReason + isCredit; never invent zero balance or rate on dashboard"
  - "ACCT-03: available is display-only; contributionPrimaryMinor stays −debt"

requirements-completed: [NW-01, NW-02, NW-03, ACCT-03]

coverage:
  - id: D1
    description: "FIAT_CREDIT native shows доступно + долг; primary shows debt only; hero subtracts debt"
    requirement: ACCT-03
    verification:
      - kind: unit
        ref: "src/lib/net-worth.test.ts#subtracts credit debt only, never available"
        status: pass
      - kind: other
        ref: "grep доступно|долг src/components/dashboard/DashboardAccountList.tsx"
        status: pass
    human_judgment: false
  - id: D2
    description: "no_balance and no_fx rows show UI-SPEC hints and stay excluded from total"
    requirement: NW-03
    verification:
      - kind: unit
        ref: "src/lib/net-worth.test.ts#excludes|no_fx|no_balance"
        status: pass
      - kind: other
        ref: "grep нет баланса|нет курса DashboardAccountList.tsx"
        status: pass
    human_judgment: false
  - id: D3
    description: "isPartial true shows «Итог неполный» callout; hero amount still rendered"
    requirement: NW-01
    verification:
      - kind: other
        ref: "grep Итог неполный|isPartial src/app/page.tsx"
        status: pass
      - kind: unit
        ref: "src/lib/net-worth.test.ts (isPartial cases)"
        status: pass
    human_judgment: false

duration: 4min
completed: 2026-09-03
status: complete
---

# Phase 05 Plan 02: Credit, exclusions, partial warning Summary

**Dashboard credit rows show доступно/долг with debt-only primary; missing LOCF/FX use honest hints; isPartial surfaces «Итог неполный» without hiding the hero total.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-09-03T16:47:48Z
- **Completed:** 2026-09-03T16:51:20Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Extended credit unit coverage (available↑ lowers debt; limit↑ alone does not add available as asset)
- DashboardAccountList renders credit native/primary per D-15 and exclusion copy per D-09/D-10
- Wired `isPartial` callout on `/` with UI-SPEC heading and body between hero and list

## Task Commits

Each task was committed atomically:

1. **Task 1: Credit rows — available native, debt primary, NW subtraction** - `e8490bf` (feat)
2. **Task 2: Missing balance and missing FX row states** - `1dd9238` (test; UI shipped in Task 1)
3. **Task 3: Partial-total warning callout when isPartial** - `322e2e6` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified
- `src/lib/net-worth.test.ts` - Available/limit sensitivity + credit no_fx exclusion tests
- `src/components/dashboard/DashboardAccountList.tsx` - Credit and exclusion display variants
- `src/app/page.tsx` - excludeReason/isCredit props + isPartial banner

## Decisions Made
- Keep formatting of majors on the RSC; list owns Russian label composition so grep/UI-SPEC strings stay in the component
- Skip linking «нет курса» to rates CRUD (CONTEXT deferral)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Exclusion row UI shipped with Task 1 credit display**
- **Found during:** Task 1 (Credit rows)
- **Issue:** Credit and exclusion variants share DashboardAccountList props; implementing credit without no_balance/no_fx left incomplete list semantics
- **Fix:** Added excludeReason-driven native/primary columns in the same Task 1 commit
- **Files modified:** `src/components/dashboard/DashboardAccountList.tsx`, `src/app/page.tsx`
- **Verification:** Task 2 automated verify green without further UI edits
- **Committed in:** `e8490bf`

**Total deviations:** 1 auto-fixed (Rule 2)
**Impact on plan:** Task 2 commit is test-only reinforcement; no scope creep beyond PLAN must_haves

## TDD Gate Compliance
- Lib credit math already green from 05-01 (`computeNetWorthRows` + `creditDebtMinor`); RED skipped for existing subtracts-debt cases
- Added GREEN-side sensitivity tests in Task 1; Task 2 added credit no_fx exclusion test

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
Ready for 05-03 (empty state, DB error handling, human smoke). Credit, exclusion, and partial-warning chrome complete.

## Self-Check: PASSED

- FOUND: `.planning/phases/05-net-worth-dashboard/05-02-SUMMARY.md`
- FOUND: `src/components/dashboard/DashboardAccountList.tsx`
- FOUND: commits `e8490bf`, `1dd9238`, `322e2e6`
- FOUND: credit/exclusion/partial UI-SPEC copy + 10/10 net-worth tests

---
*Phase: 05-net-worth-dashboard*
*Completed: 2026-09-03*
