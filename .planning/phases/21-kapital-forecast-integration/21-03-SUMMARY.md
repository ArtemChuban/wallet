---
phase: 21-kapital-forecast-integration
plan: 03
subsystem: forecast
tags: [nw-forecast, tooltip, grace, NetWorthHistoryChart, C-04]

requires:
  - phase: 21-02
    provides: forecastEvents on merged chart points + banner FX codes
provides:
  - two-block Капитал tooltip (forecast/fact then grace C-04)
  - displayPrimaryMajor on ForecastEvent for D-11 amounts
  - Plan 03 UI file-scan greens (C-04 + single dashed Line)
affects:
  - gsd-verify-work Phase 21 UAT (tooltip feel with OPEN grace)

actuals:
  tokens: 1237
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "ForecastGraceTooltipBlock: border-t separator; C-04 heading+sub once; one row per grace event"
    - "Future tooltip = Прогноз aggregate then grace; today = stack+Итого then grace (D-09/D-10)"

key-files:
  created: []
  modified:
    - src/components/dashboard/NetWorthHistoryChart.tsx
    - src/components/dashboard/nw-forecast-ui.test.ts
    - src/lib/nw-forecast.ts

key-decisions:
  - "Subcopy «NW без изменения (оплата карты)» once under grace heading (UI-SPEC prefer)"
  - "Rule 2: ForecastEvent.displayPrimaryMajor from FX-gated displayPrimaryMinor for D-11"

patterns-established:
  - "Grace visibility = tooltip metadata only; paint stays one strokeDasharray Line"
  - "Omit grace block when no kind=grace events (0 OPEN / FX-excluded already dropped by builder)"

requirements-completed: [GRFCST-01]

coverage:
  - id: D1
    description: Two-block tooltip chrome with C-04 RU + single dashed Прогноз Line
    requirement: GRFCST-01
    verification:
      - kind: unit
        ref: "src/components/dashboard/nw-forecast-ui.test.ts#plan-03 tooltip RU"
        status: pass
      - kind: unit
        ref: "npx vitest run nw-forecast-ui + nw-forecast"
        status: pass
    human_judgment: false
  - id: D2
    description: Phase sampling suite green (math + UI + GRISO)
    requirement: GRFCST-01
    verification:
      - kind: unit
        ref: "npx vitest run nw-forecast.test.ts nw-forecast-ui.test.ts credit-grace.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: Operator tooltip feel — future/today two-block readability
    requirement: GRFCST-01
    verification:
      - kind: automated_ui
        ref: "orca-ide tab http://localhost:3000/ hover chart (1г)"
        status: pass
    human_judgment: true
    rationale: Layout/tooltip feel subjective; live DB had 0 OPEN grace so grace block B not on screen — verify-work should recheck with OPEN obligation

duration: 6min
completed: 2026-09-09
status: complete
---

# Phase 21 Plan 03: Tooltip grace chrome Summary

**Капитал chart tooltip reads `forecastEvents` — forecast/fact block then C-04 grace rows; one dashed «Прогноз» Line only.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-09-09T20:36:32Z
- **Completed:** 2026-09-09T20:42:15Z
- **Tasks:** 2/2
- **Files modified:** 3

## Accomplishments

- Future tooltip: «Прогноз» + amount, then grace block when ≥1 FX-included grace event
- Today tooltip: account stack + «Итого», then same grace block (folded overdue / due-today)
- Locked RU: «Платёж для беспроцентного» + «NW без изменения (оплата карты)»; Plan 03 file-scan green

## Task Commits

1. **Task 1: End-to-end tooltip two-block grace chrome** - `8dc5b50` (feat)
2. **Task 2: Phase sampling gate + operator tooltip feel check** - no code delta (sampling + Orca); notes in this SUMMARY

**Plan metadata:** (pending docs commit)

## Files Created/Modified

- `src/components/dashboard/NetWorthHistoryChart.tsx` — `ForecastGraceTooltipBlock` + wire today/future
- `src/components/dashboard/nw-forecast-ui.test.ts` — Plan 03 C-04 expects; drop skip/todo
- `src/lib/nw-forecast.ts` — `displayPrimaryMajor` on `ForecastEvent` (D-11)

## Decisions Made

- Prefer subcopy once under grace heading (UI-SPEC discretion)
- Amounts via `displayPrimaryMajor` (primary after FX), not native minor without scale

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] `displayPrimaryMajor` on ForecastEvent**
- **Found during:** Task 1 (tooltip amounts D-11)
- **Issue:** Events only carried `plannedAmountMinor`; chart lacked currencyScale/rates to format primary major after FX
- **Fix:** Builder sets `displayPrimaryMajor` from FX-gated `displayPrimaryMinor` via `minorToMajorNumber`
- **Files modified:** `src/lib/nw-forecast.ts` (outside plan `files` list — required for correct amounts)
- **Commit:** `8dc5b50`

## Human-check notes (Task 2 / OPERATOR)

- Dev: `next dev :3000`; Orca tab `http://localhost:3000/`
- 1г: legend shows single «Прогноз»; future hover → date + «Прогноз» + amount (readable)
- 30д today hover → stack + «Итого»
- Live `forecastGrace.obligations=[]` — grace C-04 block not visible (correct omit); recheck in `/gsd-verify-work` with OPEN obligation
- No partial banner on this dataset (no FX exclusions)

## Threat Flags

None — no new endpoints; tooltip stays React text nodes; FX-excluded still builder-gated (T-21-10).

## Self-Check: PASSED

- FOUND: `src/components/dashboard/NetWorthHistoryChart.tsx`
- FOUND: `src/components/dashboard/nw-forecast-ui.test.ts`
- FOUND: `src/lib/nw-forecast.ts`
- FOUND: commit `8dc5b50`
