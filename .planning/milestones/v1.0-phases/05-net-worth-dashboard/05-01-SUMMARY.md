---
phase: 05-net-worth-dashboard
plan: 01
subsystem: ui
tags: [net-worth, bigint, locf, next, rsc, vitest]

requires:
  - phase: 04-dated-fx
    provides: convertOtherMinorToPrimaryMinor, FxRate LOCF batch on /currencies/rates
  - phase: 03-dated-balance-snapshots
    provides: creditDebtMinor, calendarDateToday, balanceSnapshot LOCF batch on /accounts
provides:
  - computeNetWorthRows pure aggregation with inclusion/exclusion and signed primary total
  - / dashboard RSC with hero «Капитал»
  - DashboardAccountList read-only three-column account list
  - Nav Главная · Валюты · Счета without Готовность
affects: [05-02, 05-03, phase-6-charts]

actuals:
  tokens: 4566
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "Pure computeNetWorthRows: null LOCF/FX exclude not zero; primary identity; credit contribution is −debt"
    - "Home RSC batch LOCF maps (locfByAccount + locfByCurrency) then format on server"
    - "DashboardAccountList Server Component with pre-formatted native/primary strings"

key-files:
  created:
    - src/lib/net-worth.ts
    - src/lib/net-worth.test.ts
    - src/components/dashboard/DashboardAccountList.tsx
  modified:
    - src/app/page.tsx
    - src/components/nav.tsx

key-decisions:
  - "Primary-currency accounts convert via identity; never require an FxRate row (RESEARCH pitfall 3)"
  - "DashboardAccountList stays a Server Component; page.tsx formats BigInt with formatMinorToMajor before props"
  - "Credit copy, partial banner, empty state, and DB try/catch deferred to Plans 02–03; list still renders all accounts with generic amount CODE columns"

patterns-established:
  - "NW math lives in src/lib/net-worth.ts with no Prisma imports; pages compose batch maps into NetWorthAccountInput"
  - "Hero is Label «Капитал» plus Display amount and PRIMARY code; no as-of subtitle"

requirements-completed: [NW-01, NW-02, NW-03]

coverage:
  - id: D1
    description: "computeNetWorthRows returns signed totalPrimaryMinor and per-row contribution with credit debt, no_balance, no_fx, primary identity, and isPartial"
    requirement: NW-01
    verification:
      - kind: unit
        ref: "src/lib/net-worth.test.ts#computeNetWorthRows (NW-01–03, ACCT-03)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Hero on / shows Label «Капитал» plus formatted total and PRIMARY code with force-dynamic"
    requirement: NW-01
    verification:
      - kind: other
        ref: "grep Капитал src/app/page.tsx && grep computeNetWorthRows src/app/page.tsx"
        status: pass
    human_judgment: false
  - id: D3
    description: "Nav order is Главная · Валюты · Счета with Готовность removed"
    requirement: NW-01
    verification:
      - kind: other
        ref: "grep Главная src/components/nav.tsx && ! grep Готовность src/components/nav.tsx"
        status: pass
    human_judgment: false
  - id: D4
    description: "DashboardAccountList flat read-only bordered list with name, native, and primary columns plus a11y headers"
    requirement: NW-02
    verification:
      - kind: other
        ref: "grep 'В валюте счёта|sr-only|Счёт' src/components/dashboard/DashboardAccountList.tsx"
        status: pass
    human_judgment: false
  - id: D5
    description: "Page batch-loads snapshots and FX rates with asOfDate lte today; locfByCurrency wired for non-primary conversion"
    requirement: NW-03
    verification:
      - kind: other
        ref: "grep locfByCurrency src/app/page.tsx && npx vitest run src/lib/net-worth.test.ts"
        status: pass
    human_judgment: false

duration: 3min
completed: 2026-09-03
status: complete
---

# Phase 5 Plan 01: Net Worth Dashboard Tracer Summary

**Pure `computeNetWorthRows` BigInt aggregation plus `/` hero «Капитал» and a read-only three-column account list**

## Performance

- **Duration:** 3 min
- **Started:** 2026-09-03T16:38:02Z
- **Completed:** 2026-09-03T16:41:34Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- `computeNetWorthRows` sums primary-currency assets, converts non-primary via `convertOtherMinorToPrimaryMinor`, subtracts credit debt only, and excludes null LOCF/FX (never as zero)
- `/` replaces readiness stub with force-dynamic dashboard RSC: batch LOCF snapshots + FX, hero «Капитал» + PRIMARY code, no as-of subtitle
- Nav is Главная · Валюты · Счета; «Готовность» removed
- `DashboardAccountList` renders all accounts in a bordered ul with native and primary columns and a11y headers Счёт / В валюте счёта / В {PRIMARY}

## Task Commits

Each task was committed atomically:

1. **Task 1: End-to-end «Капитал» on / — primary asset row path** - `d95e140` (feat)
2. **Task 2: Wave 0 net-worth.test.ts full matrix** - `d262a04` (test) then `ad91316` (feat)
3. **Task 3: Non-primary asset rows and flat multi-account list** - `0bae718` (feat)

**Plan metadata:** pending docs commit

_Note: TDD tasks may have multiple commits (test → feat → refactor)_

## Files Created/Modified

- `src/lib/net-worth.ts` - Pure `computeNetWorthRows` with inclusion rules and signed primary contributions
- `src/lib/net-worth.test.ts` - Matrix: asset sum, credit debt, no_balance, no_fx, primary identity, nativeDisplay, mixed portfolio
- `src/app/page.tsx` - Dashboard RSC replacing readiness stub
- `src/components/dashboard/DashboardAccountList.tsx` - Read-only three-column list
- `src/components/nav.tsx` - Главная-first links; Готовность removed

## Decisions Made

- Primary-currency accounts use identity conversion; FX map is ignored when `isPrimaryCurrency` is true
- List component receives pre-formatted strings so it stays a Server Component (no BigInt client boundary)
- Credit-specific Russian copy, partial-warning banner, empty CTA, and DB try/catch stay in Plans 02–03; Task 3 still lists every account with generic amount + code columns

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for 05-02 (credit row copy, missing-state hints, partial-warning callout). Aggregation and landing route are in place; Plan 02 should not re-open nav or hero math.

---
*Phase: 05-net-worth-dashboard*
*Completed: 2026-09-03*

## Self-Check: PASSED
