---
phase: 07-address-tech-debt-locf-consolidation-nyquist-3-6
plan: 02
subsystem: data
tags: [locf, historical-series, vitest, prisma, charts]

requires:
  - phase: 07-address-tech-debt-locf-consolidation-nyquist-3-6
    provides: Shared locfAmountAsOf / locfRateAsOf in locf.ts (07-01)
  - phase: 06-historical-charts
    provides: CHART-03 / D-16 series builders and tests
provides:
  - historical-series builders call shared locf wrappers (LOCF-03)
  - getBalanceAsOf / getRateAsOf retained as Prisma thin wrappers (LOCF-04)
affects:
  - 07-03 Nyquist VALIDATION for phases 3–6

actuals:
  tokens: 637
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - Chart series LOCF via @/lib/locf imports; Prisma get*AsOf stay separate thin wrappers

key-files:
  created: []
  modified:
    - src/lib/historical-series.ts
    - src/lib/balances.ts
    - src/lib/fx.ts

key-decisions:
  - "Deleted private locfAmountAsOf/locfRateAsOf in historical-series; import shared wrappers"
  - "Kept getBalanceAsOf/getRateAsOf as Prisma findFirst; pointer comments to @/lib/locf only"

patterns-established:
  - "Series math imports typed locf wrappers; Prisma single-lookup helpers remain in balances/fx"

requirements-completed: [LOCF-03, LOCF-04]

coverage:
  - id: D1
    description: historical-series imports locfAmountAsOf/locfRateAsOf from @/lib/locf; no private duplicate scanners
    requirement: LOCF-03
    verification:
      - kind: unit
        ref: npm test -- src/lib/historical-series.test.ts src/lib/locf.test.ts
        status: pass
      - kind: other
        ref: grep from "@/lib/locf" src/lib/historical-series.ts
        status: pass
    human_judgment: false
  - id: D2
    description: getBalanceAsOf and getRateAsOf remain exported Prisma findFirst wrappers; BAL/FX/series/locf suites green
    requirement: LOCF-04
    verification:
      - kind: unit
        ref: npm test -- src/lib/balances.test.ts src/lib/fx.test.ts src/lib/historical-series.test.ts src/lib/locf.test.ts
        status: pass
      - kind: other
        ref: grep export async function getBalanceAsOf|getRateAsOf
        status: pass
    human_judgment: false

duration: 1min
completed: 2026-09-04
status: complete
---

# Phase 07 Plan 02: Historical-series LOCF rewire + Prisma wrappers Summary

**Chart series rewired to shared `locfAmountAsOf`/`locfRateAsOf`; Prisma `get*AsOf` kept as thin findFirst wrappers**

## Performance

- **Duration:** 1 min
- **Started:** 2026-09-04T10:01:44Z
- **Completed:** 2026-09-04T10:03:02Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Removed private LOCF scanners from `historical-series.ts`; builders call `@/lib/locf`
- CHART-03 / D-16 historical-series tests stay green (null FX skip preserved)
- Retained `getBalanceAsOf` / `getRateAsOf` with pointer comments; BAL/FX contracts green
- Full `npm test`: 153 passed

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewire historical-series to shared locf wrappers** - `8b51864` (feat)
2. **Task 2: Keep Prisma get*AsOf wrappers + pointer comments** - `b4a7410` (docs)

**Plan metadata:** (pending docs commit)

## Files Created/Modified
- `src/lib/historical-series.ts` - Import shared locf; delete private duplicates
- `src/lib/balances.ts` - Comment pointing pure/batch callers at `@/lib/locf`
- `src/lib/fx.ts` - Comment pointing pure/batch callers at `@/lib/locf`

## Decisions Made
- Rewire only: same call shapes and D-16 `continue` when rate null — no series sampling changes
- LOCF-04: keep Prisma wrappers; do not retarget pages to N× get*AsOf

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Ready for 07-03: Nyquist VALIDATION.md for phases 3–6
- LOCF consolidation code path complete (shared module + pages + series + wrappers)

## Self-Check: PASSED
- FOUND: src/lib/historical-series.ts imports from @/lib/locf
- FOUND: no private function locfAmountAsOf/locfRateAsOf in historical-series.ts
- FOUND: export async function getBalanceAsOf / getRateAsOf
- FOUND commits: 8b51864, b4a7410
- npm test LOCF suites: 34 passed; full suite: 153 passed

---
*Phase: 07-address-tech-debt-locf-consolidation-nyquist-3-6*
*Completed: 2026-09-04*
