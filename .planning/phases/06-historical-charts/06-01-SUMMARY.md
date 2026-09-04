---
phase: 06-historical-charts
plan: 01
subsystem: ui
tags: [recharts, shadcn-chart, LOCF, net-worth, vitest, historical-series]

requires:
  - phase: 05-net-worth-dashboard
    provides: computeNetWorthRows and dashboard hero/list layout on /
provides:
  - Pure buildNetWorthSeries event∪today LOCF builder with Vitest CHART-03 coverage
  - shadcn ChartContainer + recharts@3.10.1
  - NW LineChart under Капитал with shared 30д/90д/1г/всё range
affects:
  - 06-historical-charts plan 02 (account expand charts reuse shell/range)
  - 06-historical-charts plan 03 (empty axes polish)

actuals:
  tokens: 11836
  tasks: 3
  commits: 3

tech-stack:
  added: [recharts@3.10.1, shadcn chart.tsx]
  patterns:
    - RSC serializes snapshot/rate minors as strings; client revives BigInt and recomputes series
    - Sparse event∪today sampling via buildNetWorthSeries + computeNetWorthRows per date
    - Shared client RangePreset useState (default 30d) drives NW chart

key-files:
  created:
    - src/lib/historical-series.ts
    - src/lib/historical-series.test.ts
    - src/components/ui/chart.tsx
    - src/components/dashboard/DashboardChartsShell.tsx
    - src/components/dashboard/DashboardRangeControl.tsx
    - src/components/dashboard/NetWorthHistoryChart.tsx
  modified:
    - src/lib/dates.ts
    - src/lib/dates.test.ts
    - src/app/page.tsx
    - package.json
    - package-lock.json

key-decisions:
  - "Pinned recharts@3.10.1 exact; installed chart.tsx from official base-nova registry when shadcn CLI hung"
  - "RangePreset lives in dates.ts; historical-series re-exports it"
  - "NW stroke uses var(--chart-3) per UI-SPEC; ChartConfig key nw label Капитал"

patterns-established:
  - "Client chart island: string minors across RSC boundary, BigInt revive, buildNetWorthSeries on preset change"
  - "DashboardRangeControl aria-pressed Buttons with group name Период"

requirements-completed: [CHART-01, CHART-03]

coverage:
  - id: D1
    description: Historical NW LineChart under Капитал on / when accounts exist
    requirement: CHART-01
    verification:
      - kind: unit
        ref: src/lib/historical-series.test.ts
        status: pass
      - kind: other
        ref: grep DashboardChartsShell src/app/page.tsx
        status: pass
    human_judgment: true
    rationale: Chart paint height 200px and visible series need visual/backstop UAT
  - id: D2
    description: As-of LOCF series; later FX does not rewrite earlier points
    requirement: CHART-03
    verification:
      - kind: unit
        ref: "src/lib/historical-series.test.ts#past NW point ignores a later FX change (CHART-03)"
        status: pass
    human_judgment: false
  - id: D3
    description: Shared Russian range presets 30д 90д 1г всё default 30д
    requirement: CHART-01
    verification:
      - kind: other
        ref: grep presets in DashboardRangeControl.tsx
        status: pass
    human_judgment: false

duration: 14min
completed: 2026-09-04
status: complete
---

# Phase 06 Plan 01: NW History Tracer Summary

**Sparse event∪today LOCF net-worth LineChart on `/` under Капитал with shared 30д–всё range and recharts@3.10.1.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-09-03T22:31:43Z
- **Completed:** 2026-09-03T22:46:00Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments

- Pure `buildNetWorthSeries` with CHART-03 later-FX guard, D-07 sparse sampling, D-14 partial plot (no point badge)
- shadcn `chart.tsx` + pinned `recharts@3.10.1`; NW chart `h-[200px]` stroke `var(--chart-3)`
- `DashboardChartsShell` + `DashboardRangeControl` (Период / 30д 90д 1г всё) wired between hero/partial banner and account list

## Task Commits

1. **Task 1: End-to-end NW history on / — default 30d as-of series** - `f19d5a0` (feat)
2. **Task 2: Wave 0 historical-series.test.ts full CHART matrix** - `b0a99df` (test)
3. **Task 3: Shared range presets 30д 90д 1г всё on NW chart** - `d630d32` (feat)

**Plan metadata:** `16beb41` (docs: complete plan)

## Files Created/Modified

- `src/lib/dates.ts` — `addCalendarDays`, `windowStartForPreset`, `RangePreset`
- `src/lib/dates.test.ts` — window/leap edges
- `src/lib/historical-series.ts` — `buildNetWorthSeries`
- `src/lib/historical-series.test.ts` — CHART-01/03 matrix
- `src/components/ui/chart.tsx` — shadcn Chart primitives
- `src/components/dashboard/NetWorthHistoryChart.tsx` — NW LineChart
- `src/components/dashboard/DashboardChartsShell.tsx` — client range + series revive
- `src/components/dashboard/DashboardRangeControl.tsx` — Russian presets
- `src/app/page.tsx` — serialize payloads; hero → charts → list
- `package.json` / `package-lock.json` — recharts@3.10.1

## Decisions Made

- Installed `chart.tsx` from official `base-nova` registry JSON when `npx shadcn add chart` hung; pinned recharts exact `3.10.1` (Package Legitimacy OK per plan).
- Kept ChartConfig static in source (T-06-02); tooltip labels via React text (T-06-01). Upstream ChartStyle still injects CSS vars via `dangerouslySetInnerHTML` for theme tokens only — not user/DB strings.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] shadcn CLI hung during chart add**
- **Found during:** Task 1
- **Issue:** `npx shadcn@latest add chart --yes` produced no output for ~5+ minutes after packing recharts@3.8.0
- **Fix:** Killed hung process; `npm install recharts@3.10.1`; wrote `src/components/ui/chart.tsx` from official registry item with `@/lib/utils` alias
- **Files modified:** `src/components/ui/chart.tsx`, `package.json`, `package-lock.json`
- **Verification:** file exists; `recharts` version 3.10.1; tsc clean
- **Committed in:** `f19d5a0`

**Total deviations:** 1 auto-fixed (Rule 3)
**Impact on plan:** Same official chart component + required pin; no scope change.

## Issues Encountered

shadcn CLI hang (see deviation). Tests green without builder changes in Task 2 (coverage expansion only).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 02 can reuse `DashboardChartsShell` shared range and series serialization for per-account expand charts. No Prisma schema changes. No chart Server Actions.

---
*Phase: 06-historical-charts*
*Completed: 2026-09-04*

## Self-Check: PASSED
