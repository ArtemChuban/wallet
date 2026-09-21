---
phase: 29-kapital-overlay-saviso
plan: 01
subsystem: testing
tags: [vitest, saviso, grace, interest, fx, wave-0, INT-02, INT-03, SAVISO-01, SAVISO-02]

requires:
  - phase: 28-interest-math-forecast-kind
    provides: ForecastSlot kind interest and listInterestSlotsInRange membership math
  - phase: 22-griso-regression
    provides: GRISO import-wall / never-call isolation twin pattern
provides:
  - Green SAVISO isolation suite (import wall, never-call, SAVINGS golden minors)
  - Red signed grace D-11 expects (950_000n / 450_000n / 790_000n / 1_050_000n / 1_000_000n)
  - Red INT-03 FX boundary expects plus convertOtherMinorToPrimaryMinor source wall
  - Red tooltip/shell file-scan (Накопительный, Ожидаемое начисление, Ожидаемый платёж, listInterestSlotsInRange, annualRateBps/accrualDayOfMonth)
affects:
  - 29-02 nw-forecast grace arm, NetWorthHistoryChart tooltip, DashboardChartsShell interest wiring

actuals:
  tokens: 3952
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - SAVISO twin of GRISO/INISO: ban savings-interest on historical builders; void unused interest fixture
    - Wave 0 red grace expects lock negative primary addend while plannedAmountMinor stays positive
    - UI file-scan locks copy + shell membership before production chart/shell edits

key-files:
  created:
    - src/lib/saviso.test.ts
  modified:
    - src/lib/nw-forecast.test.ts
    - src/components/dashboard/nw-forecast-ui.test.ts

key-decisions:
  - "SAVINGS golden series expects snapshot minors only (100_000n×2), not snapshot+interest"
  - "D-11 red locks dipped totals; plannedAmountMinor stays the positive payment magnitude"
  - "INT-03: missing FX lists [USD]; rate asOf today includes; rate day-after-today drops (LOCF as of today)"
  - "UI scan requires annualRateBps and accrualDayOfMonth on both page.tsx and DashboardChartsShell.tsx"

patterns-established:
  - "Never-call balanceSnapshot.(create|update|upsert|delete) on savings-interest, nw-forecast, shell, page"
  - "BuildNetWorthSeriesInput Extract wall includes interest"
  - "Retired subtitle NW без изменения (оплата карты) must be absent from chart source"

requirements-completed: [INT-02, INT-03, SAVISO-01, SAVISO-02]

coverage:
  - id: D1
    description: SAVISO isolation suite green — import wall, snapshot mutator ban, SAVINGS golden equals snapshot minors
    requirement: SAVISO-01
    verification:
      - kind: unit
        ref: "src/lib/saviso.test.ts — vitest exits 0 (7 passed)"
        status: pass
    human_judgment: false
  - id: D2
    description: Red signed grace D-11 totals and INT-03 FX boundary/precision contracts
    requirement: INT-03
    verification:
      - kind: unit
        ref: "src/lib/nw-forecast.test.ts — vitest exits non-zero (5 grace fails); file contains 950_000n and 1_050_000n"
        status: pass
    human_judgment: false
  - id: D3
    description: Red tooltip copy, plus/minus prefixes, and shell interest membership file-scan
    requirement: INT-02
    verification:
      - kind: unit
        ref: "src/components/dashboard/nw-forecast-ui.test.ts — vitest exits non-zero; file contains Ожидаемое начисление, listInterestSlotsInRange, annualRateBps, accrualDayOfMonth"
        status: pass
    human_judgment: false

duration: 5min
completed: 2026-09-21
status: complete
---

# Phase 29 Plan 01: Wave 0 Overlay + SAVISO Contracts Summary

**Vitest locks SAVISO isolation green and D-11 signed-grace / INT-03 FX / tooltip-shell membership red before Plan 29-02 production edits**

## Performance

- **Duration:** 5 min
- **Started:** 2026-09-21T16:20:16Z
- **Completed:** 2026-09-21T16:25:25Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- New `saviso.test.ts` proves historical builders never import savings-interest/nw-forecast and forecast-path files never call snapshot mutators; SAVINGS series totals equal snapshot minors
- Five flat-grace expects rewritten to dipped primary minors; FX miss lists `["USD"]`; today-dated rate includes and next-day rate drops
- UI file-scan replaces retired grace subtitle with «Накопительный» / «Ожидаемое начисление» / «Ожидаемый платёж» and requires shell `listInterestSlotsInRange` plus rate/DOM fields on page and shell

## Task Commits

Each task was committed atomically:

1. **Task 1: Wave 0: SAVISO isolation suite** - `de86628` (test)
2. **Task 2: Wave 0: signed grace totals and FX boundary** - `854139d` (test)
3. **Task 3: Wave 0: tooltip and shell file-scan** - `a87ff88` (test)

**Plan metadata:** (pending docs commit)

## Files Created/Modified

- `src/lib/saviso.test.ts` - SAVISO-01/02 import wall, never-call scan, golden series, interest type wall
- `src/lib/nw-forecast.test.ts` - D-11 signed grace expects + INT-03 FX boundary/precision source expects
- `src/components/dashboard/nw-forecast-ui.test.ts` - tooltip copy, prefixes, shell membership, page rate/DOM scan

## Decisions Made

- Golden series voids unused `{ interestMinor, annualRateBps }` fixture the way GRISO voids grace
- Overdue and grace-only cases assert later samples stay at the dipped running total
- Banner scan rejects `накопительный` on shell source (C-03 kind-tag ban)
- No production, MCP, or savings-todo edits in this wave

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 29-02 can flip grace arm to `-displayPrimaryMinor`, wire `listInterestSlotsInRange` with `annualRateBps`/`accrualDayOfMonth`, and update tooltip copy without rewriting these expects.

---
*Phase: 29-kapital-overlay-saviso*
*Completed: 2026-09-21*

## Self-Check: PASSED

- Found: saviso.test.ts, nw-forecast.test.ts, nw-forecast-ui.test.ts, 29-01-SUMMARY.md
- Found commits: de86628, 854139d, a87ff88
