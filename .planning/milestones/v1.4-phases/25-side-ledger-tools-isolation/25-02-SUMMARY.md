---
phase: 25-side-ledger-tools-isolation
plan: 02
subsystem: api
tags: [mcp, forecast, side-ledger, SIDE-04, vitest, buildNetWorthForecastSeries]

requires:
  - phase: 25-side-ledger-tools-isolation
    provides: optionalHorizonEndSchema + Wave 0 forecast.test stub (25-01)
  - phase: 24-capital-read-tools
    provides: loadNetWorthAsOf + CAP registerTool pattern
provides:
  - get_forecast_overlay MCP tool (sparse series + income/grace events)
  - loadForecastOverlay + serializeForecastPayload + resolveForecastHorizonEnd
  - SIDE instructions past capital-era come-later wall
affects:
  - 25-03 list_debts
  - 25-04 list_income / list_grace_obligations
  - Phase 26 CLI isolation prose

actuals:
  tokens: 2682
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - Shell forecastMeta fold ported to loadForecastOverlay (membership → buildNetWorthForecastSeries only)
    - resolveForecastHorizonEnd(today, arg?) = arg ?? addCalendarDays(today, 365) (D-04)
    - Pure serializeForecastPayload for SQLite-free adapter tests

key-files:
  created:
    - src/lib/mcp/reads/load-forecast-overlay.ts
    - src/lib/mcp/tools/forecast.ts
  modified:
    - src/lib/mcp/create-handler.ts
    - src/lib/mcp/tools/forecast.test.ts

key-decisions:
  - "Anchor via loadNetWorthAsOf(today) accounts-only; rates/income/grace batched beside it"
  - "Horizon default stays in resolveForecastHorizonEnd — not resolveAsOf (D-04)"
  - "Instructions list get_forecast_overlay now; list_* tools named as next (Plan 03–04)"

patterns-established:
  - "SIDE forecast = page/shell fold + domain builder + minorToJson serialize"
  - "D-05 never-write / never-actions / no historical-series call asserts on MCP forecast sources"

requirements-completed: [SIDE-04]

coverage:
  - id: D1
    description: get_forecast_overlay registered with readOnlyHint; shell-parity sparse series
    requirement: SIDE-04
    verification:
      - kind: unit
        ref: "npx vitest run src/lib/mcp/tools/forecast.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: Serialized points include string minors + income|grace forecastEvents; default horizon today+365
    requirement: SIDE-04
    verification:
      - kind: unit
        ref: "src/lib/mcp/tools/forecast.test.ts#includes income + A′ grace"
        status: pass
    human_judgment: false
  - id: D3
    description: Forecast MCP sources have no BalanceSnapshot mutates / app actions / buildNetWorthSeries calls
    requirement: SIDE-04
    verification:
      - kind: unit
        ref: "src/lib/mcp/tools/forecast.test.ts#never write BalanceSnapshot"
        status: pass
    human_judgment: false

duration: 4min
completed: 2026-09-10
status: complete
---

# Phase 25 Plan 02: get_forecast_overlay SIDE-04 tracer Summary

**Капитал Прогноз MCP live: get_forecast_overlay returns sparse points[] with income + A′ grace events; default horizon today+365; CAP tools retained.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-09-10T17:38:24Z
- **Completed:** 2026-09-10T17:42:24Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- `loadForecastOverlay` ports DashboardChartsShell forecast membership fold → `buildNetWorthForecastSeries` only
- `registerGetForecastOverlay` + handler instructions past “side ledgers come later”
- Adapter tests green: serialize shape, event kinds, D-04 horizon, D-05 never-write walls

## Task Commits

Each task was committed atomically:

1. **Task 1: End-to-end get_forecast_overlay — SIDE-04 tracer** - `e37835d` (feat)
2. **Task 2: Green SIDE-04 forecast adapter tests** - `2d926c6` (test)

**Plan metadata:** `c64327b` (docs: complete plan)

_Note: Tracer shipped before adapter tests (plan order); TDD task is GREEN-only against tracer._

## Files Created/Modified
- `src/lib/mcp/reads/load-forecast-overlay.ts` — loader + serialize + horizon helper
- `src/lib/mcp/tools/forecast.ts` — registerGetForecastOverlay
- `src/lib/mcp/create-handler.ts` — register + SIDE instructions
- `src/lib/mcp/tools/forecast.test.ts` — SIDE-04 adapter expects (Wave 0 todos replaced)

## Decisions Made
- Anchor = `loadNetWorthAsOf(today)` (accounts-only); never fold debts into overlay math
- Free `horizonEnd` wire field; 30d/90d/1y mentioned in description only (D-02)
- Keep `forecast` / `displayPrimaryMajor` numbers beside string minors (A3 / Капитал parity)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Never-write assert matched comment substring**
- **Found during:** Task 2
- **Issue:** Comment text contained `buildNetWorthSeries`; naive regex failed the D-05 wall test
- **Fix:** Reword comment; tighten assert to import/call patterns only
- **Files modified:** `load-forecast-overlay.ts`, `forecast.test.ts`
- **Commit:** `2d926c6`

## Known Stubs

None for this plan — Wave 0 `forecast.test.ts` it.todos replaced. Debts/income/grace Wave 0 stubs remain for Plans 03–04 (out of scope).

## Threat Flags

None — surfaces match plan threat model (T-25-04…T-25-08 mitigations via builder-only path + honesty fields + readOnlyHint + never-write tests).

## Issues Encountered
None

## User Setup Required
None

## Next Phase Readiness
Plans 03–04 can register list_debts / list_income / list_grace_obligations and expand handler catalog past the “list tools next” note.

## Self-Check: PASSED

All created files present; commits e37835d, 2d926c6 found; get_forecast_overlay + registerGetForecastOverlay present.
