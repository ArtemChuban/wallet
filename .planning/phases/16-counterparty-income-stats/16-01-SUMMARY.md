---
phase: 16-counterparty-income-stats
plan: 01
subsystem: income
tags: [income, counterparty, fx, locf, vitest, nextjs]

requires:
  - phase: 15-plan-vs-actual-overdue
    provides: Recurring/OneTime actual rows + /income list chrome
  - phase: 09
    provides: locfRateAsOf + convertOtherMinorToPrimaryMinor
provides:
  - computePersonIncomeStats dual native+primary aggregate
  - /income page all-actuals flatten + FxRate LOCF wiring
  - PersonGroup header «за всё время» native totals (tracer)
affects:
  - 16-02 UI polish / REQUIREMENTS CPTY-01 sync
  - 17 NW forecast isolation

actuals:
  tokens: 5701
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Per-fact locfRateAsOf(actualAsOf) dual native+primary Σ in income.ts"
    - "RSC flatten all actuals → pure stats → serializable PersonIncomeListItem.stats"

key-files:
  created: []
  modified:
    - src/lib/income.ts
    - src/lib/income.test.ts
    - src/lib/locf.ts
    - src/app/income/page.tsx
    - src/components/income/IncomeList.tsx
    - src/components/income/income-ui.test.ts

key-decisions:
  - "computePersonIncomeStats returns Map<personId, PersonIncomeStats>"
  - "Identity-omit primary line when single primary currency and !isPartial (UI-SPEC)"
  - "Export RateRow from locf.ts for typed rate inputs (PATTERNS)"

patterns-established:
  - "Pattern: income stats membership = all Prisma actuals, not next-open slotActual"
  - "Pattern: null LOCF → exclude primary only + isPartial; never 0n invent"

requirements-completed: [CPTY-01]

coverage:
  - id: D1
    description: "Native multi-ccy + primary LOCF @ actualAsOf + no_fx partial + merge + all-time"
    requirement: CPTY-01
    verification:
      - kind: unit
        ref: src/lib/income.test.ts#computePersonIncomeStats
        status: pass
    human_judgment: false
  - id: D2
    description: "Person header «за всё время» + page wires stats/fxRate; no Debts hero"
    requirement: CPTY-01
    verification:
      - kind: unit
        ref: src/components/income/income-ui.test.ts#counterparty stats
        status: pass
    human_judgment: false
  - id: D3
    description: "Visual hierarchy native > primary in Person header"
    requirement: CPTY-01
    verification: []
    human_judgment: true
    rationale: "Layout/spacing judgment — Orca UAT / Plan 02 polish"

duration: 4min
completed: 2026-09-07
status: complete
---

# Phase 16 Plan 01: Counterparty income stats tracer Summary

**All-actuals → `computePersonIncomeStats` (receipt-date LOCF hybrid) → Person header «за всё время» native Σ.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-09-07T18:52:53Z
- **Completed:** 2026-09-07T18:57:09Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Wave 0 RED→GREEN for `computePersonIncomeStats` (multi-ccy, per-`actualAsOf` LOCF, no_fx partial, merge, all-time, mixed partial)
- `/income` flattens every recurring/one-time actual + FxRate `lte maxActualAsOf`; list rows stay next-open-only
- PersonGroup header shows window hint + native lines (+ primary when not identity-omit) + compact partial copy

## Task Commits

1. **Task 1: Wave 0 RED scaffolds** - `fba1e0d` (test)
2. **Task 2: End-to-end tracer GREEN** - `9448f46` (feat)
3. **Task 3: Domain expansion mixed no_fx** - `4dcabe6` (test)

**Plan metadata:** (docs commit after this SUMMARY)

_Note: TDD Wave 0 RED then GREEN; Task 3 added mixed-partial coverage on already-complete helper._

## Files Created/Modified

- `src/lib/income.ts` — `IncomeActualFactInput` / `PersonIncomeStats` / `computePersonIncomeStats`
- `src/lib/income.test.ts` — Wave 0 + mixed partial + isolation bans `@/lib/debts`
- `src/lib/locf.ts` — export `RateRow`
- `src/app/income/page.tsx` — flatten all actuals, fxRate load, attach serializable `stats`
- `src/components/income/IncomeList.tsx` — Person header stats chrome
- `src/components/income/income-ui.test.ts` — counterparty stats file-scan

## Decisions Made

- Map return by `personId` for page attach
- Identity-omit primary secondary line per UI-SPEC Discretion lock
- Exported `RateRow` from `@/lib/locf` (was private) so income helper types match PATTERNS

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] Export `RateRow` from `locf.ts`**
- **Found during:** Task 2
- **Issue:** PATTERNS import `type RateRow` from `@/lib/locf` but type was module-private
- **Fix:** `export type RateRow`
- **Files modified:** `src/lib/locf.ts`
- **Commit:** `9448f46`

## TDD Gate Compliance

- RED: `fba1e0d` test(16-01) Wave 0 scaffolds
- GREEN: `9448f46` feat(16-01) implementation
- Extra domain test: `4dcabe6` after GREEN (Task 3)

## Threat Flags

None beyond plan threat model — no new endpoints/auth; RSC→client display strings only; isolation file-scan green.

## Self-Check: PASSED
