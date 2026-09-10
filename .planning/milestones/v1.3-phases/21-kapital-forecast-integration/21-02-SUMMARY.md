---
phase: 21-kapital-forecast-integration
plan: 02
subsystem: forecast
tags: [nw-forecast, credit-grace, forecastGrace, FX-banner, DashboardChartsShell]

requires:
  - phase: 21-01
    provides: openGraceForecastMembership + kind-aware builder + excludedMissingFxCurrencies
provides:
  - forecastGrace RSC prop on Капитал `/`
  - shell income+grace slot merge into one buildNetWorthForecastSeries
  - partial banner unique FX codes join
  - forecastEvents on merged chart points for Plan 03
affects:
  - 21-03 tooltip RU chrome

actuals:
  tokens: 2863
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "OPEN-only lean prisma.creditGraceObligation on `/` → forecastGrace overlay props"
    - "Shell: openGraceForecastMembership → kind grace slots concat income → one builder call"
    - "Banner: `Прогноз неполный · нет курса ${codes.join(\", \")}` — no доходы/грейс tags"

key-files:
  created: []
  modified:
    - src/app/page.tsx
    - src/components/dashboard/DashboardChartsShell.tsx
    - src/components/dashboard/NetWorthHistoryChart.tsx
    - src/components/dashboard/nw-forecast-ui.test.ts
    - src/lib/credit-grace.test.ts

key-decisions:
  - "Lean OPEN findMany on `/` (not nested accounts include of CLOSED)"
  - "forecastEvents copied in mergeFactAndForecast for today + future samples"
  - "NetWorthChartPoint widened for forecastEvents (Plan 03 prep)"

patterns-established:
  - "Grace overlay-only: computeNetWorthRows(inputs) stays account/LOCF; GRISO page scan"
  - "D-07 showForecast = includedSlotCount > 0 (grace-only flat keeps Line)"

requirements-completed: [GRFCST-01, GRFCST-02]

coverage:
  - id: D1
    description: OPEN grace load + forecastGrace RSC prop on `/`
    requirement: GRFCST-01
    verification:
      - kind: unit
        ref: "grep forecastGrace src/app/page.tsx + shell; vitest nw-forecast-ui"
        status: pass
    human_judgment: false
  - id: D2
    description: Shell merges income+grace; banner lists unique FX codes; D-18 banner without Line
    requirement: GRFCST-02
    verification:
      - kind: unit
        ref: "src/components/dashboard/nw-forecast-ui.test.ts#plan-02 banner FX codes"
        status: pass
    human_judgment: false
  - id: D3
    description: forecastEvents on merged chart points for Plan 03 tooltips
    requirement: GRFCST-01
    verification:
      - kind: unit
        ref: "mergeFactAndForecast + NetWorthChartPoint.forecastEvents wiring"
        status: pass
    human_judgment: false
  - id: D4
    description: Historical LOCF modules remain grace-free; page NW path overlay-only
    requirement: GRFCST-01
    verification:
      - kind: unit
        ref: "src/lib/credit-grace.test.ts#GRISO isolation smoke"
        status: pass
    human_judgment: false

duration: 3min
completed: 2026-09-09
status: complete
---

# Phase 21 Plan 02: Капитал forecastGrace shell wiring Summary

**OPEN grace RSC → shell membership merge → one «Прогноз» series + unique FX banner codes; forecastEvents on points for Plan 03.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-09-09T20:31:02Z
- **Completed:** 2026-09-09T20:34:27Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- `/` loads OPEN-only `creditGraceObligation` and passes `forecastGrace` (string minors)
- Shell maps membership → kind grace slots, concats income, single builder call; D-07 grace-only flat
- Banner appends `excludedMissingFxCurrencies.join(", ")` after «нет курса» (D-14…D-18, no kind tags)
- `mergeFactAndForecast` attaches `forecastEvents` for tooltip Plan 03

## Task Commits

1. **Task 1: End-to-end `/` OPEN grace → shell merge → banner codes** - `ec3df43` (feat)
2. **Task 2: Isolation smoke — page/shell stay off historical LOCF path** - `7d305c0` (test)

**Plan metadata:** `cde8477` (docs: complete plan)

## Files Created/Modified

- `src/app/page.tsx` — OPEN grace Promise.all + `forecastGrace` prop
- `src/components/dashboard/DashboardChartsShell.tsx` — ForecastGracePayload, merge, banner codes, events
- `src/components/dashboard/NetWorthHistoryChart.tsx` — `NetWorthChartPoint.forecastEvents` type
- `src/components/dashboard/nw-forecast-ui.test.ts` — Plan 02 banner code asserts (Plan 03 todos still skipped)
- `src/lib/credit-grace.test.ts` — GRISO + page overlay isolation scan

## Decisions Made

- Lean Prisma OPEN query on `/` (C-07 research Q1) — not nested CLOSED via accounts include
- Chart point type widened in NetWorthHistoryChart so merge can carry builder metadata without cast spam

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] NetWorthChartPoint type for forecastEvents**
- **Found during:** Task 1 (tracer)
- **Issue:** Plan `files_modified` omitted chart type file; merge attach needs typed `forecastEvents` on points
- **Fix:** Extended `NetWorthChartPoint` + imported `ForecastEvent`
- **Files modified:** `src/components/dashboard/NetWorthHistoryChart.tsx`
- **Commit:** `ec3df43`

## Auth Gates

None.

## Known Stubs

None — Plan 03 tooltip RU `describe.skip` / `it.todo` remain intentional Wave 0 owners (not this plan's goal).

## Self-Check: PASSED

- FOUND: `src/app/page.tsx`, `DashboardChartsShell.tsx`, `21-02-SUMMARY.md`
- FOUND commits: `ec3df43`, `7d305c0`
