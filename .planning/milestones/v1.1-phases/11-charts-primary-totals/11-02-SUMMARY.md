---
phase: 11-charts-primary-totals
plan: 02
subsystem: debts
tags: [zod, openedAsOf, debt-chart, immutability, recharts, tdd]

requires:
  - phase: 11-charts-primary-totals
    provides: openedAsOf schema omit + DebtPrincipalStackChart tracer from 11-01
provides:
  - Action-path proof that updateDebtMeta never writes smuggled openedAsOf
  - Edit UI read-only open date (create-only writable Дата)
  - ChartConfig-sourced RU tooltip labels on debt stack chart
affects:
  - 11-03 /debts hero totals
  - 11-04 Капитал excluded list
  - phase UAT for D-09 / chart chrome

actuals:
  tokens: 907
  tasks: 3
  commits: 2

tech-stack:
  added: []
  patterns:
    - Edit mirrors initial-amount: read-only Дата via formatAsOfDisplay; never name=openedAsOf
    - Tooltip series names from ChartConfig (single source with legend)

key-files:
  created: []
  modified:
    - src/app/debts/actions.test.ts
    - src/components/debts/DebtFormDialog.tsx
    - src/components/debts/DebtPrincipalStackChart.tsx

key-decisions:
  - "Edit shows read-only openedAsOf (not omit) for honesty; still never posts the field (D-09 A-edge)"
  - "TDD RED skipped for schema/action immutability — 11-01 already green; Task 1 added missing action smuggle assertion only"

patterns-established:
  - "Pattern: FormData smuggle tests assert prisma update data keys exclude immutable columns"
  - "Pattern: Chart tooltip labels read ChartConfig, not duplicated string literals"

requirements-completed: [DCHART-01, DCHART-02]

coverage:
  - id: D1
    description: updateDebtMetaSchema omits openedAsOf; .strict() rejects smuggle; action never writes it
    requirement: DCHART-01
    verification:
      - kind: unit
        ref: "src/lib/validations/debts.test.ts#rejects smuggled openedAsOf via .strict() (D-09)"
        status: pass
      - kind: unit
        ref: "src/app/debts/actions.test.ts#never passes smuggled openedAsOf to prisma.debt.update (D-09 / T-11-02)"
        status: pass
    human_judgment: false
  - id: D2
    description: Edit UI create-only writable Дата; edit shows read-only open date
    requirement: DCHART-01
    verification:
      - kind: other
        ref: "grep name=openedAsOf DebtFormDialog (exactly one, create branch)"
        status: pass
    human_judgment: true
    rationale: Read-only display honesty needs brief human glance in edit dialog
  - id: D3
    description: Single stepAfter stack chart; RU tooltip text; empty timeline still mounts chart
    requirement: DCHART-02
    verification:
      - kind: unit
        ref: "npx vitest run src/lib/debts.test.ts src/lib/validations/debts.test.ts"
        status: pass
      - kind: other
        ref: "grep stepAfter + DebtPrincipalStackChart mount; no RangePreset/30д/90д/1г"
        status: pass
    human_judgment: true
    rationale: Visual stack composition and tooltip chrome need human UAT glance
  - id: D4
    description: Debts domain + validations + actions suites green after polish
    requirement: DCHART-01
    verification:
      - kind: unit
        ref: "npx vitest run src/lib/debts.test.ts src/lib/validations/debts.test.ts src/app/debts/actions.test.ts"
        status: pass
    human_judgment: false

duration: 2min
completed: 2026-09-06
status: complete
---

# Phase 11 Plan 02: Open-date immutability + chart polish Summary

**D-09 hardened with action smuggle test + read-only edit Дата; debt stack tooltip labels unified via ChartConfig**

## Performance

- **Duration:** 2 min
- **Started:** 2026-09-06T16:19:28Z
- **Completed:** 2026-09-06T16:21:48Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Action test proves FormData `openedAsOf` never reaches `prisma.debt.update` data (T-11-02)
- Edit dialog shows read-only open date; create keeps required writable «Дата»
- Chart tooltip labels sourced from ChartConfig («Погашено» / «Остаток»); empty-history chart mount unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: D-09 update path rejects openedAsOf mutation** - `ee29070` (test)
2. **Task 2: Edit UI create-only Дата + chart empty-history polish** - `7bb70ef` (feat)
3. **Task 3: Keep debts chart suites green** - no commit (verify-only; 98 tests pass, no code changes)

**Plan metadata:** `16c0615` / `454fe95` / `920f5ce` (docs: complete plan)

_Note: Task 1 was coverage TDD — RED could not fail because 11-01 already implemented schema omit + action ignore._

## Files Created/Modified
- `src/app/debts/actions.test.ts` - Explicit D-09 smuggle assertion for updateDebtMeta
- `src/components/debts/DebtFormDialog.tsx` - Edit read-only Дата via formatAsOfDisplay
- `src/components/debts/DebtPrincipalStackChart.tsx` - Tooltip labels from chartConfig

## Decisions Made
- Chose read-only open date on edit (not omit) for honesty, matching initial-amount pattern
- Documented skipped RED for Task 1: immutability already shipped in 11-01; this plan closed the action-path assertion gap

## Deviations from Plan

None - plan executed exactly as written (Task 1 GREEN already present from 11-01; added missing test only).

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
Ready for 11-03 (/debts hero totals) and 11-04 (Капитал excluded list). D-09 and chart chrome closed for wave-2 polish.

## Self-Check: PASSED
- FOUND: `src/app/debts/actions.test.ts`, `src/components/debts/DebtFormDialog.tsx`, `src/components/debts/DebtPrincipalStackChart.tsx`
- FOUND: commits `ee29070`, `7bb70ef`
- FOUND: `npx vitest run src/lib/debts.test.ts src/lib/validations/debts.test.ts src/app/debts/actions.test.ts` exit 0 (98 pass)

---
*Phase: 11-charts-primary-totals*
*Completed: 2026-09-06*
