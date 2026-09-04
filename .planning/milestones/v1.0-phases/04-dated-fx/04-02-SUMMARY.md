---
phase: 04-dated-fx
plan: 02
subsystem: ui
tags: [nextjs, server-actions, fx, locf, dialog, vitest, russian-ui]

requires:
  - phase: 04-dated-fx
    plan: 01
    provides: FxRate model, getRateAsOf, parseRateToScaled/invertRateScaled, setFxRateSchema
provides:
  - upsertFxRate Server Action with direction invert and validation gates
  - /currencies/rates RSC page with batch LOCF-as-of-today
  - SetRateDialog with direction toggle and DD.MM.YYYY date entry
  - RateList with empty/populated LOCF rows and set-rate CTAs
  - Currencies layout tabs «Валюты» | «Курсы» and rates-first nav
affects: [04-03, phase-5-net-worth]

actuals:
  tokens: 8200
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Link underline tabs in currencies layout (exact-path active)"
    - "upsertFxRate mirrors upsertBalanceSnapshot with invertRateScaled for fromPrimary"
    - "RateList LOCF display with BigInt rateToPrimaryScaled serialized as string"

key-files:
  created:
    - src/app/currencies/layout.tsx
    - src/app/currencies/rates/page.tsx
    - src/components/currencies/RateList.tsx
    - src/components/currencies/SetRateDialog.tsx
    - src/components/currencies/SetRateDialog.test.ts
  modified:
    - src/app/currencies/actions.ts
    - src/app/currencies/actions.test.ts
    - src/app/currencies/page.tsx
    - src/components/nav.tsx

key-decisions:
  - "Nav «Валюты» href /currencies/rates with active on any /currencies* path (D-03)"
  - "Layout tabs use exact-path active so Валюты and Курсы never highlight together"
  - "fromPrimary direction inverts via invertRateScaled before upsert; storage always rateToPrimaryScaled"

patterns-established:
  - "FX rates page batch LOCF: findMany asOfDate lte today, first-per-currencyCode"
  - "SetRateDialog mirrors SetBalanceDialog formKey remount + hidden ISO asOfDate"

requirements-completed: [FX-01, FX-02]

coverage:
  - id: D1
    description: "upsertFxRate with future-date, primary, zero, invert, and upsert paths"
    requirement: FX-01
    verification:
      - kind: unit
        ref: "src/app/currencies/actions.test.ts#upsertFxRate"
        status: pass
    human_judgment: false
  - id: D2
    description: "/currencies/rates RSC + layout tabs + nav rates-first landing"
    requirement: FX-01
    verification:
      - kind: unit
        ref: "src/app/currencies/actions.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "RateList shows Нет курса and Задать первый курс empty path"
    requirement: FX-02
    verification:
      - kind: unit
        ref: "src/components/currencies/SetRateDialog.test.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "SetRateDialog direction toggle, isPending submit, DD.MM.YYYY date"
    requirement: FX-01
    verification:
      - kind: unit
        ref: "src/components/currencies/SetRateDialog.test.ts"
        status: pass
    human_judgment: false
  - id: D5
    description: "Direction toggle labels wrap without clipping tap targets"
    requirement: FX-01
    verification: []
    human_judgment: true
    rationale: "Layout overflow/backstop verification requires visual check in browser"

duration: 6min
completed: 2026-09-03
status: complete
---

# Phase 4 Plan 02: Set-Rate Vertical Slice Summary

**Dated FX set-rate Dialog on /currencies/rates with LOCF list, direction toggle, and «Валюты»|«Курсы» tabs**

## Performance

- **Duration:** 6 min
- **Started:** 2026-09-03T15:03:59Z
- **Completed:** 2026-09-03T15:09:30Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- Added `upsertFxRate` Server Action with Zod parse, future-date gate, primary rejection, rate > 0, and `fromPrimary` invert before persist
- Shipped `/currencies/rates` RSC page with batch LOCF-as-of-today and BigInt serialization
- Built `SetRateDialog` (direction toggle, DD.MM.YYYY + hidden ISO, `formKey` remount) and `RateList` (LOCF row / «Нет курса» / CTAs)
- Added currencies layout tabs «Валюты» | «Курсы»; nav defaults to `/currencies/rates` (D-03)

## Task Commits

1. **Task 1: End-to-end set rate via Dialog + LOCF on rates list + tabs/nav** - `50649ac` (feat)
2. **Task 2: Direction invert + pair/rate/date Server Action gates** - `1d66eeb` (test)
3. **Task 3: Set-rate pending UX + rates empty/populated polish** - `3591e58` (refactor)

## Files Created/Modified

- `src/app/currencies/actions.ts` - `upsertFxRate`, `FxRateActionState`
- `src/app/currencies/actions.test.ts` - upsert, invert, primary, zero, future-date tests
- `src/app/currencies/layout.tsx` - Link tabs «Валюты» | «Курсы»
- `src/app/currencies/rates/page.tsx` - force-dynamic RSC with LOCF batch
- `src/app/currencies/page.tsx` - spacing under layout tabs
- `src/components/currencies/RateList.tsx` - LOCF rows + set-rate CTAs + zero-currency empty
- `src/components/currencies/SetRateDialog.tsx` - set-rate Dialog with direction toggle
- `src/components/currencies/SetRateDialog.test.ts` - source-contract tests
- `src/components/nav.tsx` - href `/currencies/rates`, active on `/currencies*`

## Decisions Made

- Nav rates-first: `/currencies/rates` default landing per D-03
- Exact-path tab active in layout so both tabs never highlight together
- `fromPrimary` inverts user-entered rate via `invertRateScaled` before upsert

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 03 can add rate history expand/delete on RateList rows
- `upsertFxRate` and LOCF display ready for Phase 5 net-worth consumers
- No blockers

## Self-Check: PASSED

- FOUND: src/app/currencies/layout.tsx
- FOUND: src/app/currencies/rates/page.tsx
- FOUND: src/components/currencies/RateList.tsx
- FOUND: src/components/currencies/SetRateDialog.tsx
- FOUND: 50649ac
- FOUND: 1d66eeb
- FOUND: 3591e58

---
*Phase: 04-dated-fx*
*Completed: 2026-09-03*
