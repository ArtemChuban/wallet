---
phase: 06-historical-charts
plan: 02
subsystem: ui
tags: [recharts, account-chart, LOCF, native-primary-toggle, CHART-02, vitest]

requires:
  - phase: 06-historical-charts
    provides: buildNetWorthSeries, DashboardChartsShell shared RangePreset, chart.tsx
provides:
  - buildAccountSeries native/primary with D-16 FX skip
  - AccountHistoryChart client LineChart with native↔primary toggle
  - DashboardAccountList expand chart-only on / with shared range (D-08)
affects:
  - 06-historical-charts plan 03 (credit stacked Areas)

actuals:
  tokens: 6004
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - Per-account sparse series via buildAccountSeries (native snapshots∪today; primary + FX dates)
    - DashboardChartsShell owns shared range and hosts list so expand charts recompute on preset
    - Chart-only expand body bg-muted/40; no mutation controls on /

key-files:
  created:
    - src/components/dashboard/AccountHistoryChart.tsx
  modified:
    - src/lib/historical-series.ts
    - src/lib/historical-series.test.ts
    - src/components/dashboard/DashboardAccountList.tsx
    - src/components/dashboard/DashboardChartsShell.tsx
    - src/app/page.tsx

key-decisions:
  - "Moved account list inside DashboardChartsShell so D-08 shared range reaches expand charts without lifting state to RSC"
  - "Credit rows use Line path with isCredit prop reserved for Plan 03 stacked Areas"

patterns-established:
  - "Account expand aria Показать/Скрыть график счёта mirroring AccountList chevron pattern"
  - "Native↔primary toggle Buttons; hide when isPrimaryCurrency (D-10)"

requirements-completed: [CHART-02, CHART-03]

coverage:
  - id: D1
    description: Expand account row on / shows chart-only body with Russian aria labels
    requirement: CHART-02
    verification:
      - kind: other
        ref: grep AccountHistoryChart and aria labels in DashboardAccountList.tsx
        status: pass
    human_judgment: true
    rationale: Expand interaction and chart paint need visual UAT
  - id: D2
    description: buildAccountSeries native/primary with D-16 null-FX skip and primary identity
    requirement: CHART-03
    verification:
      - kind: unit
        ref: src/lib/historical-series.test.ts#buildAccountSeries
        status: pass
    human_judgment: false
  - id: D3
    description: Native↔primary toggle hidden for primary-currency accounts; connectNulls false
    requirement: CHART-02
    verification:
      - kind: other
        ref: grep toggle copy and isPrimaryCurrency in AccountHistoryChart.tsx
        status: pass
      - kind: unit
        ref: src/lib/historical-series.test.ts#D-16
        status: pass
    human_judgment: false

duration: 5min
completed: 2026-09-04
status: complete
---

# Phase 06 Plan 02: Account Expand Charts Summary

**Per-account native/primary LOCF LineChart on `/` expand with shared range, D-16 FX skip, and toggle hidden for primary currency.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-09-03T22:49:51Z
- **Completed:** 2026-09-03T22:55:00Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- `buildAccountSeries` with native events, primary FX conversion, D-16 skip, primary-currency identity
- Chart-only expand on dashboard list (`bg-muted/40`); shared `RangePreset` from shell (D-08)
- Native↔primary toggle (`В валюте счёта` / `В {PRIMARY}`); hidden when primary currency (D-10)

## Task Commits

1. **Task 1 RED: buildAccountSeries failing tests** - `934af56` (test)
2. **Task 1 GREEN: implement buildAccountSeries** - `9fd6d91` (feat)
3. **Task 2: Account expand chart-only with native LineChart** - `648c63e` (feat)
4. **Task 3: Native↔primary toggle hide when primary currency** - `2f570a9` (feat)

**Plan metadata:** `a585222` (docs: complete plan)

## Files Created/Modified

- `src/lib/historical-series.ts` — `buildAccountSeries` native/primary
- `src/lib/historical-series.test.ts` — CHART-02/D-16/identity cases
- `src/components/dashboard/AccountHistoryChart.tsx` — client LineChart + toggle
- `src/components/dashboard/DashboardAccountList.tsx` — client expand hosting chart
- `src/components/dashboard/DashboardChartsShell.tsx` — hosts list; passes shared range
- `src/app/page.tsx` — list metadata through shell; empty CTA unchanged

## Decisions Made

- Nest `DashboardAccountList` inside `DashboardChartsShell` so one `useState` RangePreset drives NW and account charts (D-08) without RSC searchParams.
- Credit accounts keep Line LOCF path this plan; `isCredit` reserved for Plan 03 stack.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 03 can replace credit Line branch with stacked Area (долг/доступно) and empty/single-point polish. NW chart from Plan 01 unchanged.

---
*Phase: 06-historical-charts*
*Completed: 2026-09-04*

## Self-Check: PASSED
