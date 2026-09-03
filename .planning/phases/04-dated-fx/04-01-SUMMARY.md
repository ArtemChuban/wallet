---
phase: 04-dated-fx
plan: 01
subsystem: database
tags: [prisma, sqlite, fx, locf, bigint, zod, vitest]

requires:
  - phase: 03-dated-balance-snapshots
    provides: LOCF pattern, asOfDate YYYY-MM-DD convention, ensureSqlitePragmas
  - phase: 01-docker-sqlite-foundation
    provides: RATE_SCALE_E8, BigInt money contract, Prisma migrate deploy gate
provides:
  - FxRate Prisma model with currencyCode_asOfDate unique
  - getRateAsOf LOCF helper (null before first rate)
  - convertOtherMinorToPrimaryMinor truncating convert helper
  - parseRateToScaled, formatRateScaled, invertRateScaled on money.ts
  - setFxRateSchema and deleteFxRateSchema Zod contracts
affects: [04-02-rates-ui, 04-03, phase-5-net-worth, phase-6-charts]

actuals:
  tokens: 3600
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "LOCF findFirst asOfDate lte orderBy desc (mirrors BalanceSnapshot)"
    - "Rate storage as rateToPrimaryScaled BigInt at scale 8"
    - "Compound unique upsert identity currencyCode_asOfDate"

key-files:
  created:
    - prisma/migrations/20260903140000_fx_rate/migration.sql
    - src/lib/fx.ts
    - src/lib/fx.test.ts
    - src/lib/validations/fx.ts
    - src/lib/validations/fx.test.ts
  modified:
    - prisma/schema.prisma
    - src/lib/money.ts
    - src/lib/money.test.ts
    - src/lib/foundation.test.ts

key-decisions:
  - "FxRate replaces FxRateStub with FK to Currency and named unique currencyCode_asOfDate"
  - "getRateAsOf returns null before first rate — never 0 or 1 (D-15)"
  - "invertRateScaled truncates toward zero; rejects result <= 0n after invert"
  - "Future-date and primary-pair rejection deferred to Plan 02 Server Actions"

patterns-established:
  - "FX LOCF: prisma.fxRate.findFirst where asOfDate lte D orderBy desc"
  - "Rate parse/format via parseMajorToMinor/formatMinorToMajor at scale 8"

requirements-completed: [FX-01, FX-02]

coverage:
  - id: D1
    description: "FxRate schema with unique (currencyCode, asOfDate) replaces FxRateStub"
    requirement: FX-01
    verification:
      - kind: unit
        ref: "src/lib/foundation.test.ts#applies committed migration to a fresh file DB"
        status: pass
    human_judgment: false
  - id: D2
    description: "getRateAsOf LOCF returns latest rate <= D or null before first"
    requirement: FX-02
    verification:
      - kind: unit
        ref: "src/lib/fx.test.ts#getRateAsOf LOCF"
        status: pass
    human_judgment: false
  - id: D3
    description: "Rate scale helpers parseRateToScaled, formatRateScaled, invertRateScaled at scale 8"
    requirement: FX-01
    verification:
      - kind: unit
        ref: "src/lib/money.test.ts#parseRateToScaled / formatRateScaled / invertRateScaled"
        status: pass
    human_judgment: false
  - id: D4
    description: "setFxRateSchema and deleteFxRateSchema Zod shape contracts"
    requirement: FX-01
    verification:
      - kind: unit
        ref: "src/lib/validations/fx.test.ts"
        status: pass
    human_judgment: false
  - id: D5
    description: "convertOtherMinorToPrimaryMinor truncating BigInt conversion"
    requirement: FX-02
    verification:
      - kind: unit
        ref: "src/lib/fx.test.ts#convertOtherMinorToPrimaryMinor"
        status: pass
    human_judgment: false

duration: 4min
completed: 2026-09-03
status: complete
---

# Phase 4 Plan 01: FxRate Data Contract Summary

**Dated FxRate model with LOCF getRateAsOf, scale-8 rate helpers, and Zod contracts — FxRateStub gone after host migrate deploy**

## Performance

- **Duration:** 4 min
- **Started:** 2026-09-03T14:58:00Z
- **Completed:** 2026-09-03T15:02:00Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- Replaced `FxRateStub` with `FxRate` model (FK to Currency, `currencyCode_asOfDate` unique)
- Implemented `getRateAsOf` LOCF helper — null before first rate, never invents 0/1
- Added `parseRateToScaled`, `formatRateScaled`, `invertRateScaled` on `money.ts`
- Added `convertOtherMinorToPrimaryMinor` with truncating BigInt division
- Zod `setFxRateSchema` / `deleteFxRateSchema` with Russian validation messages
- Host `prisma migrate deploy` applied; foundation gate expects `FxRate` table

## Task Commits

1. **Task 1: Wave 0 FX Zod + LOCF + rate-helper tests (red-first)** - `8f48ae8` (test)
2. **Task 2: End-to-end FxRate schema + LOCF helpers + Zod + rate scale helpers** - `afd940b` (feat)
3. **Task 3: prisma migrate deploy host gate** - `b884732` (feat)

## Files Created/Modified

- `prisma/schema.prisma` - FxRate model + Currency.fxRates relation; stub removed
- `prisma/migrations/20260903140000_fx_rate/migration.sql` - DROP FxRateStub, CREATE FxRate
- `src/lib/fx.ts` - getRateAsOf, convertOtherMinorToPrimaryMinor
- `src/lib/fx.test.ts` - LOCF, overwrite, forward-effective, convert tests
- `src/lib/money.ts` - parseRateToScaled, formatRateScaled, invertRateScaled
- `src/lib/money.test.ts` - rate helper unit tests
- `src/lib/validations/fx.ts` - Zod schemas
- `src/lib/validations/fx.test.ts` - Zod validation tests
- `src/lib/foundation.test.ts` - FxRate table + fx_rate migration assertions

## Decisions Made

- FxRate model name and `currencyCode_asOfDate` unique per RESEARCH A1/D-11
- `rateToPrimaryScaled` = primary major per 1 other major × 10^8 (A3)
- invertRateScaled truncates toward zero; double-invert not exact due to truncation (documented in test)
- Future-date, rate > 0, primary rejection left for Plan 02 Server Actions per plan

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed invertRateScaled test expectation**
- **Found during:** Task 2
- **Issue:** Wave 0 test expected 11111111n but correct truncation yields 1111111n for 1/90 at scale 8
- **Fix:** Corrected expected value; replaced flawed double-invert assertion with formatRateScaled check
- **Files modified:** src/lib/money.test.ts
- **Committed in:** afd940b

---

**Total deviations:** 1 auto-fixed (1 bug in test expectation)
**Impact on plan:** Test-only fix; implementation matched RESEARCH formula.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- FxRate data path live on host DB; ready for Plan 02 rates UI + Server Actions
- `getRateAsOf` and convert helper available for Phase 5–6 consumers
- No blockers

## Self-Check: PASSED

- FOUND: prisma/migrations/20260903140000_fx_rate/migration.sql
- FOUND: src/lib/fx.ts
- FOUND: src/lib/validations/fx.ts
- FOUND: 8f48ae8
- FOUND: afd940b
- FOUND: b884732

---
*Phase: 04-dated-fx*
*Completed: 2026-09-03*
