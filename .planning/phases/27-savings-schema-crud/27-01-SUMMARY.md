---
phase: 27-savings-schema-crud
plan: 01
subsystem: testing
tags: [vitest, savings, zod, net-worth, wave-0, nyquist]

requires: []
provides:
  - Wave 0 red createAccountSchema SAVINGS refine contracts (ACCT-01)
  - Wave 0 red isAssetType/label Накопительный + NW SAVINGS LOCF (ACCT-02/03)
  - Wave 0 red savings-accrual-display clamp + countdown contracts (ACCT-03)
  - Hard-fail createAccount SAVINGS persist; update/D-16 as skip/todo for Plan 03
affects:
  - 27-02 tracer schema + create GREEN
  - 27-03 updateAccount unskip
  - 27-04 list display + D-16 snapshot

actuals:
  tokens: 2511
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - Wave 0 hard-fail create + describe.skip/it.todo for later-plan update (Phase 20 poison-fix)
    - Display helper tests import unimplemented module (suite fail until Plan 04)

key-files:
  created:
    - src/lib/savings-accrual-display.test.ts
  modified:
    - src/lib/validations/account.test.ts
    - src/lib/account-type.test.ts
    - src/lib/net-worth.test.ts
    - src/app/accounts/actions.test.ts

key-decisions:
  - "Update/D-16 planted as describe.skip + it.todo only — no hard-fail until Plan 03"
  - "formatAccrualCountdown(today, nextAsOf) two-arg signature locked in Wave 0 tests"
  - "NW SAVINGS fixture uses cast until NetWorthAccountType extends in Plan 02"

patterns-established:
  - "SAVINGS create Zod cases live in createAccountSchema SAVINGS describe block"
  - "Plan-owned skip/todo blocks named with Plan 03 / D-08 / D-16 in title"

requirements-completed: [ACCT-01, ACCT-02, ACCT-03]

coverage:
  - id: D1
    description: Failing createAccountSchema SAVINGS rate/DOM refine cases (happy + reject matrix)
    requirement: ACCT-01
    verification:
      - kind: unit
        ref: "npx vitest run src/lib/validations/account.test.ts # exits non-zero; SAVINGS describe present"
        status: pass
    human_judgment: false
  - id: D2
    description: Failing isAssetType("SAVINGS") + accountTypeLabel «Накопительный»
    requirement: ACCT-03
    verification:
      - kind: unit
        ref: "src/lib/account-type.test.ts#SAVINGS is asset soft-read with label Накопительный"
        status: pass
    human_judgment: false
  - id: D3
    description: SAVINGS LOCF NW inclusion contract planted (runtime already asset-like; type union Plan 02)
    requirement: ACCT-02
    verification:
      - kind: unit
        ref: "src/lib/net-worth.test.ts#SAVINGS LOCF contributes positive like ASSET"
        status: pass
    human_judgment: false
  - id: D4
    description: Red nextAccrualAsOf Feb-31 clamp + formatAccrualCountdown «сегодня»/«через N дн.»
    requirement: ACCT-03
    verification:
      - kind: unit
        ref: "npx vitest run src/lib/savings-accrual-display.test.ts # module missing → suite fail"
        status: pass
    human_judgment: false
  - id: D5
    description: Hard-fail createAccount SAVINGS bps+DOM; update/D-16 as skip/todo for Plan 03
    requirement: ACCT-01
    verification:
      - kind: unit
        ref: "npx vitest run src/app/accounts/actions.test.ts # create red; describe.skip|it.todo present"
        status: pass
    human_judgment: false

duration: 3min
completed: 2026-09-11
status: complete
---

# Phase 27 Plan 01: Wave 0 SAVINGS Red Contracts Summary

**Nyquist Wave 0 Vitest contracts for SAVINGS Zod/soft-read/NW/display/create — red until Plans 02–04; update/D-16 skip/todo only**

## Performance

- **Duration:** 3 min
- **Started:** 2026-09-11T16:08:11Z
- **Completed:** 2026-09-11T16:11:33Z
- **Tasks:** 2/2
- **Files modified:** 5

## Accomplishments

- Extended `createAccountSchema` tests for SAVINGS happy (16.50% / 0%), missing rate/DOM, negative rate, D-15 cross-type rejects
- Soft-read «Накопительный» + `isAssetType("SAVINGS")`; NW SAVINGS LOCF inclusion fixture
- New `savings-accrual-display.test.ts` (imports missing module → suite fail); createAccount hard-fail; Plan 03 update/D-16 as `describe.skip` + `it.todo`

## Task Commits

1. **Task 1: Wave 0 red Zod + soft-read + NW SAVINGS contracts** - `3d1f268` (test)
2. **Task 2: Wave 0 red accrual-display + actions SAVINGS contracts** - `470fe02` (test)

**Plan metadata:** (pending docs commit)

## Files Created/Modified

- `src/lib/validations/account.test.ts` - SAVINGS createAccountSchema refine matrix
- `src/lib/account-type.test.ts` - SAVINGS soft-read + Накопительный label
- `src/lib/net-worth.test.ts` - SAVINGS LOCF positive contribution
- `src/lib/savings-accrual-display.test.ts` - nextAccrualAsOf clamp + countdown copy
- `src/app/accounts/actions.test.ts` - create SAVINGS hard-fail; update/D-16 skip/todo

## Decisions Made

- Locked `formatAccrualCountdown(today, nextAsOf)` in Wave 0 tests (Plan 04 implements)
- Both `describe.skip` block and `it.todo` stubs for Plan 03 update/D-16 (poison-fix)
- NW fixture casts `"SAVINGS"` until Plan 02 extends `NetWorthAccountType` (runtime already non-credit asset path)

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

| File | Line | Stub | Reason |
|------|------|------|--------|
| `src/app/accounts/actions.test.ts` | describe.skip | updateAccount SAVINGS + D-16 | Owned by Plan 03 |
| `src/app/accounts/actions.test.ts` | it.todo ×2 | same contracts | Owned by Plan 03 |

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 27-02 can GREEN Zod/soft/NW/createAccount + schema migration. Plan 03 unskips update. Plan 04 implements `savings-accrual-display.ts`.

## Self-Check: PASSED

- FOUND: all five must_haves.artifacts test paths
- FOUND: commits `3d1f268`, `470fe02`

---
*Phase: 27-savings-schema-crud*
*Completed: 2026-09-11*
