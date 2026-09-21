---
phase: 29-kapital-overlay-saviso
plan: 02
subsystem: ui
tags: [nw-forecast, interest, grace, D-11, INT-02, INT-03, SAVISO, tooltip, DashboardChartsShell]

requires:
  - phase: 29-kapital-overlay-saviso
    provides: Wave 0 red contracts for signed grace, INT-03 FX, tooltip/shell scan
  - phase: 28-interest-math-forecast-kind
    provides: listInterestSlotsInRange and ForecastSlot kind interest
provides:
  - Grace forecastDeltaMinor returns -displayPrimaryMinor (D-11)
  - forecastSavings RSC prop + shell BigInt InterestAccountInput adapter
  - ForecastInterestTooltipBlock (Накопительный / Ожидаемое начисление / plus rows)
  - Grace subtitle Ожидаемый платёж with minus prefix; Wave 0 tests green
affects:
  - Phase 30 MCP forecast overlay copy/events (shared builder numbers already dipped)
  - /gsd-verify-work agent UAT on Капитал hover

actuals:
  tokens: 2664
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - Interest slots concat income → interest → grace inside existing forecast useMemo
    - Tooltip signs via formatChartNumber prefix; displayPrimaryMajor stays unsigned
    - Interest row sort display-only (not in nw-forecast builder)

key-files:
  created: []
  modified:
    - src/lib/nw-forecast.ts
    - src/app/page.tsx
    - src/components/dashboard/DashboardChartsShell.tsx
    - src/components/dashboard/NetWorthHistoryChart.tsx

key-decisions:
  - "D-11 grace line addend is -displayPrimaryMinor; plannedAmountMinor and displayPrimaryMajor stay positive"
  - "forecastSavings uses InterestAccountInput keys; balanceMinor string on RSC, BigInt in shell"
  - "Interest block mounts only on future tooltip between Прогноз level and grace (D-06)"

patterns-established:
  - "listInterestSlotsInRange fed only adapted savings rows — never income/grace"
  - "Tooltip sort: amount desc then localeCompare ru sensitivity base"

requirements-completed: [INT-02, INT-03, SAVISO-01, SAVISO-02]

coverage:
  - id: D1
    description: Grace dips dashed Прогноз by payment primary; Wave 0 signed totals green
    requirement: INT-02
    verification:
      - kind: unit
        ref: "src/lib/nw-forecast.test.ts — vitest exits 0 (signed grace + interest−grace)"
        status: pass
    human_judgment: false
  - id: D2
    description: Future SAVINGS interest slots raise line; FX miss lists currency codes only
    requirement: INT-03
    verification:
      - kind: unit
        ref: "src/lib/nw-forecast.test.ts — FX boundary; shell listInterestSlotsInRange + annualRateBps/accrualDayOfMonth"
        status: pass
    human_judgment: false
  - id: D3
    description: SAVISO — no snapshot writes; historical series unchanged by interest wiring
    requirement: SAVISO-01
    verification:
      - kind: unit
        ref: "src/lib/saviso.test.ts — vitest exits 0"
        status: pass
    human_judgment: false
  - id: D4
    description: Tooltip interest/grace copy, plus/minus, sort, text-sm (file-scan green)
    requirement: INT-02
    verification:
      - kind: unit
        ref: "src/components/dashboard/nw-forecast-ui.test.ts — vitest exits 0"
        status: pass
    human_judgment: false
  - id: D5
    description: Live hover UAT — accrual day plus, grace minus, today Итого unchanged
    requirement: INT-02
    verification: []
    human_judgment: true
    rationale: End-of-phase agent UAT via /gsd-verify-work; mid-plan stop deferred per plan human-check

duration: 3min
completed: 2026-09-21
status: complete
---

# Phase 29 Plan 02: Капитал Overlay Interest + Grace Dip Summary

**Dashed Прогноз rises on future SAVINGS accrual days and falls on grace payments; interest tooltip block ships with sorted plus rows**

## Performance

- **Duration:** 3 min
- **Started:** 2026-09-21T16:28:17Z
- **Completed:** 2026-09-21T16:31:30Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- `forecastDeltaMinor` grace arm returns `-displayPrimaryMinor`; income/interest stay positive; comments match D-11
- `forecastSavings` on page → shell `listInterestSlotsInRange` → `kind: "interest"` slots between income and grace
- `ForecastInterestTooltipBlock` (Накопительный / Ожидаемое начисление) + grace «Ожидаемый платёж» with minus; Wave 0 tests green

## Task Commits

Each task was committed atomically:

1. **Task 1: End-to-end interest credit and grace dip on Прогноз** - `d1d4a5f` (feat)
2. **Task 2: Tooltip sort, type size, and accrual-day-only rows** - `16b8d6a` (feat)

**Plan metadata:** `6260aa5` (docs: complete plan)

## Files Created/Modified

- `src/lib/nw-forecast.ts` - signed grace addend + comment rewrites
- `src/app/page.tsx` - `forecastSavings` RSC prop (InterestAccountInput keys, string balanceMinor)
- `src/components/dashboard/DashboardChartsShell.tsx` - BigInt adapter + interest slot concat
- `src/components/dashboard/NetWorthHistoryChart.tsx` - interest block, grace copy/sign, sort, text-sm

## Decisions Made

- Grace line sign is builder-owned; tooltip minus is format prefix on unsigned major
- Sort stays in tooltip only (D-02); builder does not reorder events
- MCP files untouched (C-05); shared builder numbers flow through loaders automatically

## Deviations from Plan

None - plan executed exactly as written.

## Auth Gates

None.

## Known Stubs

None.

## Threat Flags

None beyond plan threat model (T-29-01…T-29-SC mitigated as specified).

## Self-Check: PASSED

- FOUND: src/lib/nw-forecast.ts, src/app/page.tsx, src/components/dashboard/DashboardChartsShell.tsx, src/components/dashboard/NetWorthHistoryChart.tsx
- FOUND: commits d1d4a5f, 16b8d6a
- FOUND: vitest nw-forecast + saviso + nw-forecast-ui all green (52 passed)
- FOUND: no src/lib/mcp/ edits
