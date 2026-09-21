---
phase: 28-interest-math-forecast-kind
plan: 02
subsystem: domain-math
tags: [bigint, interest, forecast, INT-01, compound]

requires:
  - phase: 28-01
    provides: Red monthlyInterestMinor, listInterestSlotsInRange, and kind interest ΔNW contracts
  - phase: 27-savings-schema-crud
    provides: nextAccrualAsOf calendar reused by the enumerator
provides:
  - monthlyInterestMinor truncate-toward-0 and per-account compound listInterestSlotsInRange
  - ForecastSlotKind interest with income window and +displayPrimaryMinor
  - SerializedForecastEvent.kind includes interest without loader membership
affects:
  - 29-kapital-forecast overlay mapping of interest slots

actuals:
  tokens: 2281
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - Compound chain lives only in listInterestSlotsInRange; builder adds precomputed plannedAmountMinor
    - Kind window and ΔNW are exhaustive switches with a never default

key-files:
  created:
    - src/lib/savings-interest.ts
  modified:
    - src/lib/nw-forecast.ts
    - src/lib/mcp/reads/load-forecast-overlay.ts
    - src/lib/nw-forecast.test.ts

key-decisions:
  - "Month-2 credit is the truncated interest on principal grown by month 1 only (10000n then 10100n)"
  - "slotInWindow and ΔNW both exhaust ForecastSlotKind so interest cannot fall through to the grace predicate or a silent addend"

patterns-established:
  - "Interest slots start the day after today via nextAccrualAsOf and advance the day after each accrual"
  - "parentId equals accountId; currency fields pass through with no FX inside the enumerator"

requirements-completed: [INT-01]

coverage:
  - id: D1
    description: Compound monthly slots from today LOCF with ÷12 truncate and clamped future accrual dates
    requirement: INT-01
    verification:
      - kind: unit
        ref: "src/lib/savings-interest.test.ts — 38-test combined run passed; 1_000_000n at 1200 bps emits 10000n then 10100n"
        status: pass
    human_judgment: false
  - id: D2
    description: Kind interest uses the income window and adds display primary; today is excluded; grace ΔNW stays 0
    requirement: INT-01
    verification:
      - kind: unit
        ref: "src/lib/nw-forecast.test.ts#interest plannedAsOf equal to today is excluded; future interest slot adds planned amount to NW"
        status: pass
    human_judgment: false
  - id: D3
    description: Two SAVINGS accounts stair-step to 30000n from precomputed slots; builder does not import the interest module
    requirement: INT-01
    verification:
      - kind: unit
        ref: "src/lib/nw-forecast.test.ts#two accounts stair-step precomputed interest"
        status: pass
    human_judgment: false
  - id: D4
    description: Non-primary USD interest with an empty rate book is excluded as missing FX
    requirement: INT-01
    verification:
      - kind: unit
        ref: "src/lib/nw-forecast.test.ts#non-primary interest without a rate is excluded as missing FX"
        status: pass
    human_judgment: false
  - id: D5
    description: SerializedForecastEvent.kind accepts interest; overlay loader still builds only income and grace slots
    requirement: INT-01
    verification:
      - kind: unit
        ref: "npm test — 605 passed; load-forecast-overlay.ts slots remain [...openSlots, ...graceSlots] and does not call listInterestSlotsInRange"
        status: pass
    human_judgment: false

duration: 5min
completed: 2026-09-21
status: complete
---

# Phase 28 Plan 02: Interest Math + Forecast Kind Summary

**Compound monthly interest slots from today LOCF (10000n then 10100n) and ForecastSlotKind interest that stair-steps net worth without Dashboard or MCP membership**

## Performance

- **Duration:** 5 min
- **Started:** 2026-09-21T11:24:46Z
- **Completed:** 2026-09-21T11:29:14Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- `monthlyInterestMinor` is one bigint division by `12n * 10000n`; non-positive rate or balance returns `0n`
- `listInterestSlotsInRange` compounds each account from today LOCF, skips `<= today`, clamps via `nextAccrualAsOf`, and emits only credits `> 0n`
- `ForecastSlotKind` includes `interest`: window is `plannedAsOf > today`, ΔNW is `+displayPrimaryMinor`; grace stays `0n`
- Two-account hand-map sums to `30000n` on 2026-03-15; a USD slot with no rate is excluded and marks the forecast partial
- `SerializedForecastEvent.kind` includes `interest`; `loadForecastOverlay` still passes only income and grace slots

## Task Commits

Each task was committed atomically:

1. **Task 1: End-to-end interest slot: compound enumerator plus ΔNW kind** - `e258aed` (feat)
2. **Task 2: Prove independent accounts stair-step and missing FX excludes interest** - `90ce13c` (test)

**Plan metadata:** docs commit with SUMMARY, STATE, ROADMAP, REQUIREMENTS

## Files Created/Modified

- `src/lib/savings-interest.ts` - `monthlyInterestMinor` and `listInterestSlotsInRange`
- `src/lib/nw-forecast.ts` - kind `interest`, income-style window, exhaustive ΔNW switch
- `src/lib/mcp/reads/load-forecast-overlay.ts` - serialized kind union widened; membership unchanged
- `src/lib/nw-forecast.test.ts` - two-account stair-step, import-wall smoke, missing-FX exclusion

## Decisions Made

- Month 2 uses principal grown by the truncated month-1 credit only. `1_000_000n` at 1200 bps is `10000n` then `10100n`.
- Window and addend both switch on every `ForecastSlotKind` and assign `never` in `default`, so a later kind cannot inherit the grace `>= today` predicate or a silent non-grace addend.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. Tracer verify stayed green (35 tests) before the stair-step cases. Full `npm test` is 53 files, 605 tests, exit 0.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 29 can map `InterestForecastSlot` onto `ForecastSlot` (`kind: "interest"`, `parentId` = `accountId`, `plannedAmountMinor` = `interestMinor`) and concat those slots in the shell and `loadForecastOverlay`. FX conversion stays in `buildNetWorthForecastSeries`. Do not recompute principal in the builder.

## Self-Check: PASSED

- FOUND: src/lib/savings-interest.ts
- FOUND: src/lib/nw-forecast.ts
- FOUND: src/lib/mcp/reads/load-forecast-overlay.ts
- FOUND: src/lib/nw-forecast.test.ts
- FOUND: e258aed
- FOUND: 90ce13c

---
*Phase: 28-interest-math-forecast-kind*
*Completed: 2026-09-21*
