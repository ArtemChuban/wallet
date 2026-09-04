---
phase: 08-debts-schema-domain-math
plan: 02
subsystem: domain
tags: [debts, bigint, vitest, fx, asserts, primary-totals]

requires:
  - phase: 08-debts-schema-domain-math
    provides: remainingMinor / statusForRemaining / DISOL-01 scan (08-01)
  - phase: 04-dated-fx
    provides: convertOtherMinorToPrimaryMinor + RATE_SCALE_E8
  - phase: 05-net-worth-dashboard
    provides: computeNetWorthRows shape analog (isPartial / no_fx)
provides:
  - assertRepaymentAmount / assertSizeDelta / assertInitialImmutable / assertStatusSynced
  - computeDebtPrimaryTotals with iOwePrimaryMinor / theyOwePrimaryMinor / isPartial
affects:
  - 08-03 debts Zod validations
  - Phase 9–11 Server Actions and /debts hero totals

actuals:
  tokens: 3135
  tasks: 2
  commits: 4

tech-stack:
  added: []
  patterns:
    - domain asserts throw Error (money.ts style); no clamp-to-zero
    - caller-resolved rateToPrimaryScaled for totals (A6 / D-18 adaptation)
    - OPEN-only filter before NW-style row + split aggregates

key-files:
  created: []
  modified:
    - src/lib/debts.ts
    - src/lib/debts.test.ts

key-decisions:
  - "A6: computeDebtPrimaryTotals takes rateToPrimaryScaled not asOfDate (LOCF at call site)"
  - "assertInitialImmutable(stored, proposed) rejects unequal create-time principal"

patterns-established:
  - "Pattern: repay/size asserts before persist; status synced via assertStatusSynced"
  - "Pattern: debt primary totals mirror NW rows without importing net-worth"

requirements-completed: [DEBT-02, DEBT-03]

coverage:
  - id: D1
    description: assertRepaymentAmount / assertSizeDelta reject illegal amounts and accept boundaries
    requirement: DEBT-02
    verification:
      - kind: unit
        ref: src/lib/debts.test.ts#assertRepaymentAmount (D-15)
        status: pass
      - kind: unit
        ref: src/lib/debts.test.ts#assertSizeDelta (D-05, D-15)
        status: pass
    human_judgment: false
  - id: D2
    description: assertInitialImmutable rejects mutation of create-time principal
    requirement: DEBT-03
    verification:
      - kind: unit
        ref: src/lib/debts.test.ts#assertInitialImmutable (DEBT-03 / D-03)
        status: pass
    human_judgment: false
  - id: D3
    description: assertStatusSynced throws on OPEN/0n desync
    requirement: DEBT-02
    verification:
      - kind: unit
        ref: src/lib/debts.test.ts#assertStatusSynced (D-13)
        status: pass
    human_judgment: false
  - id: D4
    description: computeDebtPrimaryTotals OPEN-only with identity / no_fx isPartial / direction buckets
    requirement: DEBT-02
    verification:
      - kind: unit
        ref: src/lib/debts.test.ts#computeDebtPrimaryTotals (D-16–D-19)
        status: pass
    human_judgment: false

duration: 3min
completed: 2026-09-04
status: complete
---

# Phase 08 Plan 02: Debts schema + domain math Summary

**Domain asserts for over-repay / illegal size-down / initial immutability / status sync, plus OPEN-only primary totals with NW-style FX honesty (caller-resolved rates, A6).**

## Performance

- **Duration:** 3 min
- **Started:** 2026-09-04T16:14:53Z
- **Completed:** 2026-09-04T16:17:24Z
- **Tasks:** 2/2
- **Files modified:** 2

## Accomplishments

- Locked repay/size/initial/status asserts (D-05, D-12–D-15, DEBT-03) with boundary Vitest coverage
- Shipped `computeDebtPrimaryTotals` — OPEN-only, primary identity, `no_fx` + `isPartial`, `iOwe`/`theyOwe` buckets
- Kept DISOL-01 isolation scan green; debts imports money only (not net-worth)

## Task Commits

1. **Task 1: Domain asserts** - `dfb5b79` (test) + `40fdc81` (feat)
2. **Task 2: computeDebtPrimaryTotals** - `756670f` (test) + `794cdc6` (feat)

**Plan metadata:** `d329e41` (docs: complete plan)

## Files Created/Modified

- `src/lib/debts.ts` — four asserts + totals types/API + `convertOtherMinorToPrimaryMinor` import
- `src/lib/debts.test.ts` — reject/boundary/immutability + OPEN/partial/identity/mixed totals cases

## Decisions Made

- **A6 / D-18 adaptation:** totals helper takes caller-resolved `rateToPrimaryScaled`; no `asOfDate` on input (LOCF stays at Phase 11 call site)
- **assertInitialImmutable(stored, proposed):** throws when proposed ≠ stored; identical proposed is a no-op pass

## Deviations from Plan

None - plan executed exactly as written.

## Auth Gates

None.

## Known Stubs

None — asserts and totals complete for plan scope.

## Threat Flags

None — assert throws and FX honesty match T-08-01 / T-08-07; no NW coupling (T-08-04); no new packages.

## Self-Check: PASSED

- FOUND: src/lib/debts.ts, src/lib/debts.test.ts
- FOUND commits: dfb5b79, 40fdc81, 756670f, 794cdc6
- vitest debts.test.ts PASS (27); greps for assert* + computeDebtPrimaryTotals + aggregate fields OK
