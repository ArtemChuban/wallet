---
phase: 11-charts-primary-totals
plan: 03
subsystem: debts
tags: [debts, primary-totals, locf, fx-partial, hero]

requires:
  - phase: 08-debts-schema-domain-math
    provides: computeDebtPrimaryTotals OPEN-only aggregates + isPartial rows
  - phase: 11-charts-primary-totals plan 01
    provides: openedAsOf serialization on /debts DebtRow
provides:
  - Always-visible /debts Я должен | Мне должны primary hero
  - Итог неполный banner with excluded debt person/currency/нет курса
affects:
  - 11-04 Капитал excluded-list banner parity

actuals:
  tokens: 2161
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - /debts LOCF FX as-of today then computeDebtPrimaryTotals (mirror Капитал)
    - Always-show hero at 0/0; partial honesty lists excluded debts

key-files:
  created:
    - src/components/debts/DebtsPrimaryTotalsHero.tsx
  modified:
    - src/app/debts/page.tsx

key-decisions:
  - "Hero always mounts above DebtsList/empty CTA even with zero people (D-12)"
  - "Excluded row labels join person name + currencyCode + нет курса for no_fx (D-13)"

patterns-established:
  - "Pattern: DebtsPrimaryTotalsHero presentational; LOCF + totals math stay on RSC page"
  - "Pattern: isPartial banner container matches Капитал (rounded-lg border bg-muted/60 role=status)"

requirements-completed: [DTOTAL-01]

coverage:
  - id: D1
    description: /debts always shows Я должен | Мне должны primary totals via LOCF + computeDebtPrimaryTotals
    requirement: DTOTAL-01
    verification:
      - kind: unit
        ref: "src/lib/debts.test.ts#computeDebtPrimaryTotals"
        status: pass
      - kind: other
        ref: "grep computeDebtPrimaryTotals + DebtsPrimaryTotalsHero + Я должен/Мне должны"
        status: pass
    human_judgment: false
  - id: D2
    description: When isPartial, show Итог неполный with excluded debt person, currency, нет курса
    requirement: DTOTAL-01
    verification:
      - kind: unit
        ref: "src/lib/debts.test.ts#computeDebtPrimaryTotals"
        status: pass
      - kind: other
        ref: "grep Итог неполный + isPartial + нет курса in DebtsPrimaryTotalsHero"
        status: pass
    human_judgment: true
    rationale: Visual layout and RU copy adequacy need human UAT on /debts with missing FX

duration: 1min
completed: 2026-09-06
status: complete
---

# Phase 11 Plan 03: /debts Primary Totals Hero Summary

**/debts header always shows Я должен | Мне должны in primary currency via LOCF + computeDebtPrimaryTotals, with Итог неполный excluded-debt list when FX missing**

## Performance

- **Duration:** 1 min
- **Started:** 2026-09-06T16:24:55Z
- **Completed:** 2026-09-06T16:26:39Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Wired `/debts` RSC page: calendar today Europe/Moscow → FxRate LOCF → `computeDebtPrimaryTotals` on OPEN debts
- Shipped always-visible two-column primary hero including 0/0 empty state
- Partial honesty: `isPartial` banner «Итог неполный» lists excluded debts with person, currency, «нет курса»

## Task Commits

Each task was committed atomically:

1. **Task 1: End-to-end /debts LOCF → computeDebtPrimaryTotals → hero 0/0** - `ebcc637` (feat)
2. **Task 2: Partial banner + excluded debt list on /debts** - `c268e56` (feat)

**Plan metadata:** `6a07109` (docs: complete plan)

## Files Created/Modified
- `src/components/debts/DebtsPrimaryTotalsHero.tsx` - Two-column hero + optional partial excluded list
- `src/app/debts/page.tsx` - LOCF FX load, totals inputs, hero props including excluded view-models

## Decisions Made
- Hero always mounts above list/empty CTA (D-12), never gated on people/debts/nonzero
- Excluded rows join person name + currencyCode from page map; reason «нет курса» for `no_fx`
- Logic stays on RSC page; hero is presentational only — Капитал banner untouched (Plan 04)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Ready for 11-04 Капитал excluded-account list parity (D-14)
- DTOTAL-01 surface complete; DISOL-01 preserved (no debt imports on `/`)

---
*Phase: 11-charts-primary-totals*
*Completed: 2026-09-06*

## Self-Check: PASSED
