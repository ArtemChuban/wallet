---
phase: 07-address-tech-debt-locf-consolidation-nyquist-3-6
plan: 01
subsystem: data
tags: [locf, vitest, rsc, prisma, batch-map]

requires:
  - phase: 03-dated-balance-snapshots
    provides: Batch findMany lte today + null-before-first LOCF contract
  - phase: 04-dated-fx
    provides: FX LOCF null-before-first and rates page Map pattern
  - phase: 05-net-worth-dashboard
    provides: Dashboard dual balance/FX Maps into NW
  - phase: 06-historical-charts
    provides: Shared prefetch arrays for chart serialization
provides:
  - Shared pickLatestAsOf / firstHitLocfMap / locfAmountAsOf / locfRateAsOf in locf.ts
  - Pure↔map parity Vitest coverage (LOCF-05)
  - Three RSC pages using firstHitLocfMap for current LOCF Maps
affects:
  - 07-02 historical-series rewire
  - balances/fx thin wrappers keep-green

actuals:
  tokens: 2150
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - Hybrid LOCF API: pure pickLatestAsOf + batch firstHitLocfMap + typed wrappers
    - Callers keep findMany asOfDate lte D + orderBy asOfDate desc precondition

key-files:
  created:
    - src/lib/locf.ts
    - src/lib/locf.test.ts
  modified:
    - src/app/accounts/page.tsx
    - src/app/currencies/rates/page.tsx
    - src/app/page.tsx

key-decisions:
  - "Hybrid API: pickLatestAsOf + firstHitLocfMap + typed amount/rate wrappers (RESEARCH Q2)"
  - "firstHitLocfMap returns full row T; pages keep existing Map value shape via row fields"

patterns-established:
  - "RSC current LOCF: one findMany (lte today, desc) then firstHitLocfMap(keyOf)"
  - "Pure locf.test.ts: describe/it/expect only — no Prisma mocks"

requirements-completed: [LOCF-01, LOCF-02, LOCF-05]

coverage:
  - id: D1
    description: Shared pickLatestAsOf returns null when no row has asOfDate <= D
    requirement: LOCF-01
    verification:
      - kind: unit
        ref: src/lib/locf.test.ts#returns null when all rows are after D (null-before-first)
        status: pass
    human_judgment: false
  - id: D2
    description: firstHitLocfMap on desc-sorted batches matches pickLatestAsOf (pure↔map parity)
    requirement: LOCF-05
    verification:
      - kind: unit
        ref: src/lib/locf.test.ts#first hit on desc-sorted rows equals pickLatestAsOf after newest
        status: pass
    human_judgment: false
  - id: D3
    description: /accounts, /currencies/rates, and / build current LOCF Maps via firstHitLocfMap
    requirement: LOCF-02
    verification:
      - kind: other
        ref: grep firstHitLocfMap src/app/accounts/page.tsx src/app/currencies/rates/page.tsx src/app/page.tsx
        status: pass
      - kind: unit
        ref: npm test -- src/lib/locf.test.ts
        status: pass
    human_judgment: false

duration: 2min
completed: 2026-09-04
status: complete
---

# Phase 07 Plan 01: Shared LOCF Module + Page Batch Maps Summary

**Shared `locf.ts` with pickLatestAsOf / firstHitLocfMap and three RSC pages rewired off triplicate Map loops**

## Performance

- **Duration:** 2 min
- **Started:** 2026-09-04T09:56:49Z
- **Completed:** 2026-09-04T09:58:58Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created pure `src/lib/locf.ts` exporting pickLatestAsOf, firstHitLocfMap, locfAmountAsOf, locfRateAsOf
- Green Vitest suite for null-before-first and firstHitLocfMap↔pickLatestAsOf parity
- Rewired /accounts, /currencies/rates, and / to use firstHitLocfMap; findMany lte+desc unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: failing LOCF tests** - `6bd944e` (test)
2. **Task 1 GREEN: locf.ts + /accounts batch Map** - `598b063` (feat)
3. **Task 2: rates and home Maps** - `8e127e8` (feat)

**Plan metadata:** (pending docs commit)

_Note: TDD tracer produced RED then GREEN commits before expansion task._

## Files Created/Modified
- `src/lib/locf.ts` - Shared pure LOCF pick, batch Map builder, typed wrappers
- `src/lib/locf.test.ts` - Null-before-first + pure↔map parity (no Prisma)
- `src/app/accounts/page.tsx` - locfByAccount via firstHitLocfMap
- `src/app/currencies/rates/page.tsx` - locfByCurrency via firstHitLocfMap
- `src/app/page.tsx` - Dual Maps via firstHitLocfMap; same prefetch feeds charts

## Decisions Made
- Hybrid API per RESEARCH discretion: generic pick + first-hit Map + thin typed wrappers returning field or null
- firstHitLocfMap stores full row; callers read `.amountMinor` / `.rateToPrimaryScaled` as before

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Ready for 07-02: rewire historical-series to shared locfAmountAsOf/locfRateAsOf; keep balances/fx Prisma wrappers green
- Full suite deferred to Plan 02 after series rewire

## Self-Check: PASSED
- FOUND: src/lib/locf.ts, src/lib/locf.test.ts
- FOUND commits: 6bd944e, 598b063, 8e127e8
- npm test -- src/lib/locf.test.ts: 6 passed
- Three pages reference firstHitLocfMap

---
*Phase: 07-address-tech-debt-locf-consolidation-nyquist-3-6*
*Completed: 2026-09-04*
