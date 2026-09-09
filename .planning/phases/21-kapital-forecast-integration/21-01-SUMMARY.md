---
phase: 21-kapital-forecast-integration
plan: 01
subsystem: forecast
tags: [nw-forecast, credit-grace, A-prime, FX-LOCF, vitest]

requires:
  - phase: 17-nw-forecast-overlay-isolation
    provides: buildNetWorthForecastSeries income stair-step + FX exclude
  - phase: 19-schema-pure-grace-domain-math
    provides: OPEN|CLOSED obligation identity + isGraceOverdue
provides:
  - openGraceForecastMembership (OPEN fold → sampleAsOf)
  - kind-aware ForecastSlot + A′ 0-addend grace in builder
  - excludedMissingFxCurrencies unique alphabetical list
affects:
  - 21-02 shell merge + banner codes
  - 21-03 tooltip RU chrome

actuals:
  tokens: 5608
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "A′ grace: FX gate then primaryMinor 0n; still dateSet.sample"
    - "Membership fold in credit-grace; builder kind-aware window"
    - "excludedMissingFxCurrencies Set→sort for banner (Plan 02)"

key-files:
  created: []
  modified:
    - src/lib/nw-forecast.ts
    - src/lib/nw-forecast.test.ts
    - src/lib/credit-grace.ts
    - src/lib/credit-grace.test.ts
    - src/components/dashboard/nw-forecast-ui.test.ts
    - src/components/dashboard/DashboardChartsShell.tsx

key-decisions:
  - "A′ = FX success then += 0n (not paired ± offset leg)"
  - "Membership DTO in credit-grace; no nw-forecast import (avoid cycle)"
  - "forecastEvents on ForecastPoint for same-day income+grace metadata"

patterns-established:
  - "Kind-aware slotInWindow: income plannedAsOf > today; grace >= today"
  - "openGraceForecastMembership folds overdue of any age onto today"

requirements-completed: [GRFCST-01, GRFCST-02]

coverage:
  - id: D1
    description: Wave 0 non-poisoning stubs for grace math + Plan 02/03 UI owners
    requirement: GRFCST-01
    verification:
      - kind: unit
        ref: "npx vitest run src/lib/nw-forecast.test.ts src/components/dashboard/nw-forecast-ui.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: OPEN grace membership fold + CLOSED/horizon exclusions
    requirement: GRFCST-01
    verification:
      - kind: unit
        ref: "src/lib/credit-grace.test.ts#openGraceForecastMembership"
        status: pass
    human_judgment: false
  - id: D3
    description: A′ ΔNW=0 grace slots, grace-only flat, same-day income-only delta, unique FX codes
    requirement: GRFCST-01
    verification:
      - kind: unit
        ref: "src/lib/nw-forecast.test.ts#grace A′ / membership / FX codes"
        status: pass
    human_judgment: false
  - id: D4
    description: FX miss never invents rates; excludedMissingFxCurrencies alphabetical unique
    requirement: GRFCST-02
    verification:
      - kind: unit
        ref: "src/lib/nw-forecast.test.ts#FX miss codes unique alphabetical"
        status: pass
    human_judgment: false

duration: 4min
completed: 2026-09-09
status: complete
---

# Phase 21 Plan 01: Капитал forecast A′ math Summary

**Kind-aware `buildNetWorthForecastSeries` with A′ 0-addend grace + `openGraceForecastMembership` today-fold; unique missing FX codes returned for Plan 02 banner.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-09-09T20:24:47Z
- **Completed:** 2026-09-09T20:29:00Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Wave 0 Nyquist stubs green (`it.todo` / `describe.skip`) without poisoning income regression
- `openGraceForecastMembership` folds overdue OPEN → today; CLOSED / beyond-horizon out
- Builder: grace FX gate then `0n` addend, samples date; `excludedMissingFxCurrencies` unique sorted; `forecastEvents` on points

## Task Commits

1. **Task 1: Wave 0 Nyquist stubs** - `6dc8600` (test)
2. **Task 2 RED: membership failing tests** - `ccfdbea` (test)
3. **Task 2 GREEN: openGraceForecastMembership** - `350fafc` (feat)
4. **Task 3: A′ kind-aware builder** - `b47773d` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified

- `src/lib/credit-grace.ts` — `openGraceForecastMembership` + membership DTOs
- `src/lib/credit-grace.test.ts` — fold / CLOSED / horizon unit cases
- `src/lib/nw-forecast.ts` — kind, A′ 0-addend, FX currency list, forecastEvents
- `src/lib/nw-forecast.test.ts` — Wave 0 → green A′ / FX / grace-only / same-day
- `src/components/dashboard/nw-forecast-ui.test.ts` — Plan 02/03 owner skips
- `src/components/dashboard/DashboardChartsShell.tsx` — `kind: "income"` on open slots (Rule 3)

## Decisions Made

- A′ represented as post-FX `0n` cumulative addend (discretion lock)
- Membership stays in `credit-grace` (lean DTO); shell maps to `ForecastSlot` in Plan 02
- Point-level `forecastEvents` carries income+grace for tooltip prep

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Shell required `kind` after ForecastSlot contract change**
- **Found during:** Task 3 (tracer)
- **Issue:** Making `kind` required broke `DashboardChartsShell` slot assembly types
- **Fix:** Set `kind: "income"` on both open-slot push sites (no grace wiring)
- **Files modified:** `src/components/dashboard/DashboardChartsShell.tsx`
- **Commit:** `b47773d`

## Auth Gates

None.

## Known Stubs

None in production libs. UI Plan 02/03 `describe.skip` / `it.todo` are intentional Wave 0 owners (non-poisoning).

## Threat Flags

None beyond plan threat model (FX gate + GRISO wall unchanged).

## Self-Check: PASSED

- FOUND: `src/lib/nw-forecast.ts`, `src/lib/credit-grace.ts`, membership + A′ tests
- FOUND: commits `6dc8600`, `ccfdbea`, `350fafc`, `b47773d`
