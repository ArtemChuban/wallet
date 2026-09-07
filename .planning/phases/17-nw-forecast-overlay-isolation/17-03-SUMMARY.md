---
phase: 17-nw-forecast-overlay-isolation
plan: 03
subsystem: dashboard
tags: [nw-forecast, ComposedChart, ReferenceLine, tooltip, partial-banner, Nyquist]

requires:
  - phase: 17-nw-forecast-overlay-isolation
    provides: Pure nw-forecast builder + shell merge tracer (Plan 01); INISO green (Plan 02)
provides:
  - ComposedChart Line + ReferenceLine + D-11 tooltip split + «Прогноз» legend
  - Quiet partial banner «Прогноз неполный · нет курса» near NW chart
  - Nyquist 17-VALIDATION task map + wave_0_complete
affects:
  - Phase 17 verify-work / UAT (Orca visual)
  - Milestone v1.2 close-out

actuals:
  tokens: 3546
  tasks: 3
  commits: 5

tech-stack:
  added: []
  patterns:
    - "Tooltip splits on asOfDate > today — future = Прогноз amount only"
    - "Partial banner independent of account hero; role=status compact one-liner"
    - "ReferenceLine at today only when showForecast"

key-files:
  created: []
  modified:
    - src/components/dashboard/NetWorthHistoryChart.tsx
    - src/components/dashboard/DashboardChartsShell.tsx
    - src/components/dashboard/nw-forecast-ui.test.ts
    - .planning/phases/17-nw-forecast-overlay-isolation/17-VALIDATION.md

key-decisions:
  - "Future tooltip omits stack keys + Итого; fact branch filters forecast payload row"
  - "Banner after chart in flex gap-2 section; hide Line when includedSlotCount=0 keep banner on FX exclude"
  - "Merge promotes today hinge + horizonEnd even when fact row missing"

patterns-established:
  - "Pattern: forecast chrome = dashed Line + border ReferenceLine + muted-foreground stroke"
  - "Pattern: D-16 all-FX-excluded → banner only, no Line"

requirements-completed: [FCST-01]

coverage:
  - id: D1
    description: ComposedChart dashed Line + ReferenceLine hinge + D-11 tooltip/legend split
    requirement: FCST-01
    verification:
      - kind: unit
        ref: src/components/dashboard/nw-forecast-ui.test.ts#forecast chart chrome file-scan
        status: pass
    human_judgment: false
  - id: D2
    description: Partial honesty banner near NW chart with hide/showForecast wiring
    requirement: FCST-01
    verification:
      - kind: unit
        ref: src/components/dashboard/nw-forecast-ui.test.ts#partial banner
        status: pass
    human_judgment: false
  - id: D3
    description: Nyquist VALIDATION map closed; wave merge suite green
    requirement: FCST-01
    verification:
      - kind: unit
        ref: "wave merge vitest (nw-forecast/iniso/historical-series/income/actions/nw-forecast-ui)"
        status: pass
      - kind: other
        ref: .planning/phases/17-nw-forecast-overlay-isolation/17-VALIDATION.md#wave_0_complete
        status: pass
    human_judgment: false
  - id: D4
    description: Orca visual — dashed Прогноз + today hinge + partial banner tone
    requirement: FCST-01
    verification: []
    human_judgment: true
    rationale: Visual readability of hinge/dash and banner layout need human/Orca judgment

duration: 3min
completed: 2026-09-07
status: complete
---

# Phase 17 Plan 03: Chart chrome + VALIDATION gate Summary

**Капитал forecast chrome complete: ComposedChart dashed «Прогноз» Line, today ReferenceLine, fact/future tooltip split, quiet partial banner; Nyquist VALIDATION mapped green.**

## Performance

- **Duration:** 3min
- **Started:** 2026-09-07T20:33:11Z
- **Completed:** 2026-09-07T20:36:19Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- ReferenceLine hinge + D-11 tooltip (future = Прогноз only; fact = stack + Итого)
- Partial banner «Прогноз неполный · нет курса» `role=status`; Line hide rules D-08/D-16
- 17-VALIDATION task IDs filled; `wave_0_complete: true` / `nyquist_compliant: true`; wave suite 99 pass

## Task Commits

1. **Task 1 RED: Chart chrome file-scan** - `ebeda77` (test)
2. **Task 1 GREEN: ReferenceLine + tooltip split** - `3efd676` (feat)
3. **Task 2 RED: Partial banner file-scan** - `cffa6e6` (test)
4. **Task 2 GREEN: Banner + showForecast wiring** - `00c5eb9` (feat)
5. **Task 3: VALIDATION map + suite gate** - `0fe4734` (docs)

**Plan metadata:** `1681a2f` (docs: complete plan)

## Files Created/Modified
- `src/components/dashboard/NetWorthHistoryChart.tsx` — ReferenceLine, tooltip split, legend D-10
- `src/components/dashboard/DashboardChartsShell.tsx` — partial banner, merge hinge/horizon, showForecast
- `src/components/dashboard/nw-forecast-ui.test.ts` — file-scan chrome + banner
- `.planning/phases/17-nw-forecast-overlay-isolation/17-VALIDATION.md` — task map + Nyquist close

## Decisions Made
- Compact one-liner banner (UI-SPEC default), not long Капитал hero alternate
- Filter forecast key from fact tooltip payload so Line does not pollute stack rows
- Merge `fp.asOfDate >= today` so missing fact today still anchors hinge

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Critical] Ensure today + horizonEnd always in merged chart data**
- **Found during:** Task 2 (partial banner + wiring)
- **Issue:** Merge only appended `asOfDate > today`; if fact lacked today row, ReferenceLine/xaxis hinge discarded (Pitfall 6 / D-07/D-12)
- **Fix:** Promote all forecast points with `asOfDate >= today` into merge map
- **Files modified:** `DashboardChartsShell.tsx`
- **Verification:** file-scan + nw-forecast suite green
- **Committed in:** `00c5eb9`

---

**Total deviations:** 1 auto-fixed (Rule 2)
**Impact on plan:** Correctness for hinge/future axis; no scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 17 plans 01–03 complete — ready for `/gsd-verify-work` Orca visual (human-check in plan)
- FCST-01 + ISO-01 automated gates green; manual hinge/banner judgment remains

## Known Stubs
None

## Threat Flags
None — chrome stays within plan threat model (T-17-03/02/01/07/SC)

## Self-Check: PASSED
- FOUND: NetWorthHistoryChart.tsx, DashboardChartsShell.tsx, nw-forecast-ui.test.ts, 17-VALIDATION.md, 17-03-SUMMARY.md
- FOUND commits: ebeda77, 3efd676, cffa6e6, 00c5eb9, 0fe4734

---
*Phase: 17-nw-forecast-overlay-isolation*
*Completed: 2026-09-07*
