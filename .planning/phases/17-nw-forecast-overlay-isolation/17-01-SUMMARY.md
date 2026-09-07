---
phase: 17-nw-forecast-overlay-isolation
plan: 01
subsystem: dashboard
tags: [nw-forecast, recharts, ComposedChart, vitest, income-overlay, FX-LOCF]

requires:
  - phase: 16-counterparty-income-stats
    provides: income occurrence listing + FX exclude honesty patterns
  - phase: 13-income-schema-domain-math
    provides: listAllInRange / occurrenceKeyString / freeze-merge
provides:
  - Pure buildNetWorthForecastSeries + forecastHorizonEnd (D-04..D-06, D-13..D-16)
  - Капитал page/shell merge of open income slots into dashed Прогноз Line
  - Wave 0 INISO + chart file-scan scaffolds (INISO green → Plan 02; ReferenceLine → Plan 03)
affects:
  - 17-02 INISO green + FCST-01 docs sync
  - 17-03 chart chrome (ReferenceLine, tooltip split, partial banner)

actuals:
  tokens: 8694
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Pure nw-forecast.ts (dates/locf/money only); membership at shell boundary"
    - "Horizon mirrors RangePreset; all→+365"
    - "ComposedChart Area stacks + dashed stepAfter Line «Прогноз»"

key-files:
  created:
    - src/lib/nw-forecast.ts
    - src/lib/nw-forecast.test.ts
    - src/lib/iniso.test.ts
    - src/components/dashboard/nw-forecast-ui.test.ts
  modified:
    - src/app/page.tsx
    - src/components/dashboard/DashboardChartsShell.tsx
    - src/components/dashboard/NetWorthHistoryChart.tsx

key-decisions:
  - "Shell recomputes forecast in useMemo on range (page preloads max 1y income)"
  - "Forecast stroke var(--muted-foreground); type stepAfter; strokeDasharray 5 5"
  - "INISO import-wall regex matches imports/identifiers — not prose comments"

patterns-established:
  - "Pattern: open slots = listAllInRange(today+1..horizon) then filter no-actual + currency enrich"
  - "Pattern: merge fact+forecast rows; today hinge carries forecast; future rows forecast-only"

requirements-completed: [FCST-01, ISO-01]

coverage:
  - id: D1
    description: Pure cumulative NW forecast builder with horizon mirror + FX@today exclude
    requirement: FCST-01
    verification:
      - kind: unit
        ref: src/lib/nw-forecast.test.ts
        status: pass
    human_judgment: false
  - id: D2
    description: Капитал shell merges open planned income into dashed Прогноз Line
    requirement: FCST-01
    verification:
      - kind: unit
        ref: src/lib/nw-forecast.test.ts
        status: pass
      - kind: other
        ref: "grep ComposedChart/Прогноз NetWorthHistoryChart.tsx"
        status: pass
    human_judgment: false
  - id: D3
    description: net-worth/historical-series stay free of income/nw-forecast imports
    requirement: ISO-01
    verification:
      - kind: unit
        ref: src/lib/iniso.test.ts#INISO-01 isolation
        status: pass
    human_judgment: false

duration: 7min
completed: 2026-09-07
status: complete
---

# Phase 17 Plan 01: NW forecast overlay tracer Summary

**Pure `nw-forecast` cumulative overlay from open planned income, wired through `/` page+shell into dashed «Прогноз» Line on ComposedChart — historical LOCF path stays income-free.**

## Performance

- **Duration:** 7min
- **Started:** 2026-09-07T20:19:34Z
- **Completed:** 2026-09-07T20:26:44Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Wave 0 RED → green `forecastHorizonEnd` + `buildNetWorthForecastSeries` (membership/cumulative/horizon/FX)
- RSC page loads income defs/actuals + `anchorPrimaryMinor`; shell filters open slots and merges fact/forecast
- `NetWorthHistoryChart` → `ComposedChart` with dashed stepAfter «Прогноз» Line; INISO/UI scaffolds for Plans 02–03

## Task Commits

1. **Task 1: Wave 0 — RED scaffolds** - `b9ec03f` (test)
2. **Task 2: End-to-end tracer** - `44d91a3` (feat)
3. **Task 3: Domain expansion** - `098e7c1` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified
- `src/lib/nw-forecast.ts` — pure forecast builder + horizon helper
- `src/lib/nw-forecast.test.ts` — Wave 0→green domain suite
- `src/lib/iniso.test.ts` — INISO file-scan + past-series stub (Plan 02)
- `src/components/dashboard/nw-forecast-ui.test.ts` — chart chrome file-scan
- `src/app/page.tsx` — income load + forecast props (no income into NW math)
- `src/components/dashboard/DashboardChartsShell.tsx` — range-keyed forecast merge
- `src/components/dashboard/NetWorthHistoryChart.tsx` — ComposedChart + dashed Line

## Decisions Made
- Shell `useMemo` recomputes overlay per range preset (discretion pick from RESEARCH)
- Forecast Line: `stepAfter`, `strokeDasharray="5 5"`, `var(--muted-foreground)`
- ReferenceLine / partial banner / tooltip split deferred to Plan 03 (per plan)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] INISO false positive on comment tokens**
- **Found during:** Task 2 (tracer)
- **Issue:** File-scan `/prisma|BalanceSnapshot/` matched header comment prose
- **Fix:** Softened module comment; tightened regex to import paths + `\bBalanceSnapshot\b`
- **Files modified:** `src/lib/nw-forecast.ts`, `src/lib/iniso.test.ts`
- **Verification:** `npx vitest run src/lib/iniso.test.ts` green
- **Committed in:** `44d91a3`

---

**Total deviations:** 1 auto-fixed (Rule 1)
**Impact on plan:** Necessary for honest import-wall scan; no scope creep.

## Known Stubs

| Stub | File | Reason |
|------|------|--------|
| `it.todo` past-series identity with/without income | `src/lib/iniso.test.ts` | Greens in Plan 02 |
| `ReferenceLine` today hinge | `NetWorthHistoryChart.tsx` | Plan 03 chrome (UI test still RED) |
| Partial forecast banner | shell/chart | Plan 03 (D-15) |

## Issues Encountered
None beyond INISO comment false positive.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 02: green INISO past-series identity + FCST-01 docs sync
- Plan 03: ReferenceLine, tooltip split, partial banner; wave merge suite

---
*Phase: 17-nw-forecast-overlay-isolation*
*Completed: 2026-09-07*

## Self-Check: PASSED
