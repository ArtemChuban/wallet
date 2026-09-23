---
phase: 28-interest-math-forecast-kind
plan: 01
subsystem: testing
tags: [vitest, interest, forecast, bigint, wave-0, INT-01]

requires:
  - phase: 27-savings-schema-crud
    provides: SAVINGS rate/DOM fields and nextAccrualAsOf calendar (not imported by these tests)
provides:
  - Red monthlyInterestMinor and listInterestSlotsInRange contracts (÷12 truncate, D-02 compound chain, D-07 future-only calendar)
  - Red ForecastSlot kind interest ΔNW and today-exclusion contracts
affects:
  - 28-02 savings-interest.ts and slotInWindow GREEN

actuals:
  tokens: 1800
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - Wave 0 imports ./savings-interest before the module exists so the suite fails to load
    - Interest forecast fixtures omit dueAsOf and set parentId equal to accountId

key-files:
  created:
    - src/lib/savings-interest.test.ts
  modified:
    - src/lib/nw-forecast.test.ts

key-decisions:
  - "Month-2 compound expect is 10100n, not a second flat 10000n (D-02 overrides research flat LOCF)"
  - "InterestAccountInput and InterestForecastSlot field names match Plan 28-02 so GREEN does not rewrite expects"
  - "Today-dated interest includedSlotCount 0 is the hard fail; future +ΔNW already passes on the non-grace addend"

patterns-established:
  - "Interest membership tests pass only today LOCF balanceMinor, annualRateBps, and accrualDayOfMonth"
  - "Source smoke rejects Math.pow plus nw-forecast, historical-series, net-worth, and prisma imports"

requirements-completed: [INT-01]

coverage:
  - id: D1
    description: Failing INT-01 ÷12 truncate, compound chain, calendar clamp, and zero-skip contracts
    requirement: INT-01
    verification:
      - kind: unit
        ref: "src/lib/savings-interest.test.ts — vitest exits non-zero (missing ./savings-interest); file contains 13750n, 10100n, 2026-02-28, listInterestSlotsInRange"
        status: pass
    human_judgment: false
  - id: D2
    description: Failing today-dated interest membership plus locked future +ΔNW and grace-flat regression
    requirement: INT-01
    verification:
      - kind: unit
        ref: "src/lib/nw-forecast.test.ts#interest plannedAsOf equal to today is excluded — includedSlotCount expected 0 received 1"
        status: pass
    human_judgment: false

duration: 6min
completed: 2026-09-21
status: complete
---

# Phase 28 Plan 01: Wave 0 Interest Contracts Summary

**Red Vitest locks ÷12 truncate, compound month-2 10100n, February accrual clamps, and future-only interest ΔNW before savings-interest.ts exists**

## Performance

- **Duration:** 6 min
- **Started:** 2026-09-21T11:13:51Z
- **Completed:** 2026-09-21T11:20:01Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `src/lib/savings-interest.test.ts` imports `monthlyInterestMinor` and `listInterestSlotsInRange` and fails to load because the module is absent
- Golden minors locked: `13750n`, `10000n` then `10100n`, `8n` then `9n`, and `0n` for non-positive inputs
- Calendar locks: DOM 31 on 2026-02-10 emits 2026-02-28 and 2026-03-31; on 2026-02-28 emits only 2026-03-31; leap day 2024-02-29 is included
- `nw-forecast.test.ts` future interest point expects `1_050_000n`; today-dated interest expects `includedSlotCount` 0 and fails today (got 1)
- Grace-only ΔNW=0 case unchanged and still green

## Task Commits

Each task was committed atomically:

1. **Task 1: Wave 0 red savings-interest contracts** - `70b8e4c` (test)
2. **Task 2: Wave 0 red interest forecast-kind contracts** - `46d89f5` (test)

**Plan metadata:** docs commit with SUMMARY, STATE, ROADMAP, REQUIREMENTS

## Files Created/Modified

- `src/lib/savings-interest.test.ts` - INT-01 formula, compound chain, calendar, multi-account, currency pass-through, isolation smoke
- `src/lib/nw-forecast.test.ts` - `interestSlot` helper, +ΔNW, today exclusion, same-day grace mix, kind list includes interest

## Decisions Made

- Month 2 of a 12% chain on `1_000_000n` is `10100n`. A second `10000n` fails the contract.
- Slot DTO fields are `plannedAsOf`, `interestMinor`, `parentId`, `accountId`, optional `accountName`, and the account currency fields. `parentId` equals `accountId`.
- Negative LOCF emits no slot, matching T-28-04, in addition to the helper returning `0n`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Negative LOCF emits no interest slot**
- **Found during:** Task 1 (Wave 0 red savings-interest contracts)
- **Issue:** Behavior bullets assert `monthlyInterestMinor(-100n, 10000) === 0n` and empty slots for rate 0, balance 0, and 1n at 1 bps. T-28-04 also requires a negative balance to emit no slot.
- **Fix:** Added a `listInterestSlotsInRange` expect of `[]` for balance `-100n` at 10000 bps.
- **Files modified:** `src/lib/savings-interest.test.ts`
- **Verification:** Same missing-module failure as the rest of the file; expect is a hard `toEqual([])`
- **Committed in:** `70b8e4c`

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Locks the threat-register zero-skip. No production code. No scope creep.

## Issues Encountered

None. Future +ΔNW and same-day interest+grace passed on the current non-grace addend. The today-dated case failed with `includedSlotCount` 1, which is the required red.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 28-02 can implement `src/lib/savings-interest.ts` and widen `slotInWindow` for kind `interest` against these expects. Do not rewrite the golden minors. Production `nw-forecast.ts` is untouched.

## Self-Check: PASSED

- FOUND: src/lib/savings-interest.test.ts
- FOUND: src/lib/nw-forecast.test.ts
- FOUND: 70b8e4c
- FOUND: 46d89f5

---
*Phase: 28-interest-math-forecast-kind*
*Completed: 2026-09-21*
