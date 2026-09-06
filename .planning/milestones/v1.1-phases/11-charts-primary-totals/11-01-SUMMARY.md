---
phase: 11-charts-primary-totals
plan: 01
subsystem: debts
tags: [prisma, zod, recharts, openedAsOf, debt-chart, tdd]

requires:
  - phase: 10-repayments-close-write-off
    provides: DebtDetailDialog История tab host and event timeline
  - phase: 08-debts-schema-domain-math
    provides: remainingMinor / event ledger model
provides:
  - Debt.openedAsOf required YYYY-MM-DD with Europe/Moscow backfill
  - buildDebtPrincipalStackSeries pure native stack points
  - DebtPrincipalStackChart stepAfter stack in История
affects:
  - 11-02 openedAsOf immutability polish
  - 11-03 /debts hero totals
  - 11-04 Капитал excluded list

actuals:
  tokens: 7402
  tasks: 3
  commits: 2

tech-stack:
  added: []
  patterns:
    - Debt open calendar field immutable after create (mirror initialAmount)
    - Native principal stack series in debts.ts (DISOL-01)
    - stepAfter Area stack without stackOffset=sign / RangePreset

key-files:
  created:
    - prisma/migrations/20260906161000_debt_opened_as_of/migration.sql
    - src/components/debts/DebtPrincipalStackChart.tsx
  modified:
    - prisma/schema.prisma
    - src/lib/debts.ts
    - src/lib/debts.test.ts
    - src/lib/validations/debts.ts
    - src/lib/validations/debts.test.ts
    - src/app/debts/actions.ts
    - src/app/debts/actions.test.ts
    - src/app/debts/page.tsx
    - src/components/debts/DebtFormDialog.tsx
    - src/components/debts/DebtDetailDialog.tsx

key-decisions:
  - "openedAsOf-moscow-backfill: required Debt.openedAsOf String; migration backfills from createdAt via Europe/Moscow (+3h) calendar date"
  - "Stack keys repaidMajor/remainingMajor; tertiary sort repayment before sizeChange"
  - "Chart mounts first in История; empty timeline still shows flat open→today series"

patterns-established:
  - "Pattern: create-only openedAsOf on form + Zod; updateDebtMetaSchema omits and .strict()-rejects"
  - "Pattern: debt chart series lives in debts.ts — never historical-series/net-worth"

requirements-completed: [DCHART-01, DCHART-02, DISOL-01]

coverage:
  - id: D1
    description: Debt.openedAsOf required with Moscow backfill migration
    requirement: DCHART-01
    verification:
      - kind: other
        ref: "DATABASE_URL=file:./data/wallet.db npx prisma migrate deploy"
        status: pass
      - kind: other
        ref: "prisma/schema.prisma#openedAsOf"
        status: pass
    human_judgment: false
  - id: D2
    description: buildDebtPrincipalStackSeries covers flat/repay/size-change/collapse/order
    requirement: DCHART-01
    verification:
      - kind: unit
        ref: "src/lib/debts.test.ts#buildDebtPrincipalStackSeries"
        status: pass
    human_judgment: false
  - id: D3
    description: create schemas require openedAsOf; update rejects smuggled openedAsOf
    requirement: DCHART-01
    verification:
      - kind: unit
        ref: "src/lib/validations/debts.test.ts#openedAsOf"
        status: pass
    human_judgment: false
  - id: D4
    description: DebtPrincipalStackChart stepAfter stack above timeline in История
    requirement: DCHART-02
    verification:
      - kind: other
        ref: "grep DebtPrincipalStackChart DebtDetailDialog; grep stepAfter DebtPrincipalStackChart"
        status: pass
    human_judgment: true
    rationale: Visual stack composition and RU tooltip labels need human glance in UAT
  - id: D5
    description: NW modules stay free of debt-domain imports
    requirement: DISOL-01
    verification:
      - kind: unit
        ref: "src/lib/debts.test.ts#DISOL-01 isolation"
        status: pass
    human_judgment: false

duration: 5min
completed: 2026-09-06
status: complete
---

# Phase 11 Plan 01: Charts tracer Summary

**Immutable Debt.openedAsOf (Moscow backfill) feeding buildDebtPrincipalStackSeries and one native stepAfter stack chart first in История**

## Performance

- **Duration:** 5 min
- **Started:** 2026-09-06T16:10:33Z
- **Completed:** 2026-09-06T16:15:49Z
- **Tasks:** 3
- **Files modified:** 12

## Accomplishments

- Checkpoint Task 1 resolved as `openedAsOf-moscow-backfill` (not re-asked)
- Wave 0 red tests for stack series + openedAsOf Zod contracts
- Tracer green: schema/migration, series, create form/action, chart in История; DISOL-01 clean

## Task Commits

1. **Task 1: Confirm openedAsOf schema + Moscow backfill** - decision recorded (no code commit) — `openedAsOf-moscow-backfill`
2. **Task 2: Wave 0 red tests** - `5299d6f` (test)
3. **Task 3: End-to-end openedAsOf → chart** - `a914cee` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified

- `prisma/schema.prisma` — Debt.openedAsOf String required
- `prisma/migrations/20260906161000_debt_opened_as_of/migration.sql` — redefine Debt; backfill `strftime('%Y-%m-%d', datetime(createdAt, '+3 hours'))`
- `src/lib/debts.ts` — `buildDebtPrincipalStackSeries` / `DebtPrincipalStackPoint`
- `src/lib/debts.test.ts` / `src/lib/validations/debts.test.ts` — Wave 0 → green
- `src/lib/validations/debts.ts` — openedAsOf on create schemas
- `src/app/debts/actions.ts` / `page.tsx` — persist + serialize openedAsOf
- `src/components/debts/DebtFormDialog.tsx` — create-only «Дата»
- `src/components/debts/DebtPrincipalStackChart.tsx` — stepAfter dual Area stack
- `src/components/debts/DebtDetailDialog.tsx` — chart-first История panel

## Decisions Made

- Human selected **openedAsOf-moscow-backfill**: required `openedAsOf` String; existing rows backfilled from `createdAt` as Europe/Moscow calendar date (UTC+3 via SQLite `datetime(..., '+3 hours')`), not raw UTC `date(createdAt)`.
- Tertiary event sort: `asOfDate`, then `id`, then kind with repayment before sizeChange.
- No RangePreset / no `stackOffset="sign"` on debt chart.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for plan 11-02 (openedAsOf immutability polish) and Wave 2 plans 11-03 / 11-04. Tracer path openedAsOf → series → История chart proven; hero totals and Капитал banner still outstanding.

## Self-Check: PASSED

- FOUND: prisma/schema.prisma, migration, debts.ts, DebtPrincipalStackChart.tsx
- FOUND: commits 5299d6f, a914cee
- vitest debts + validations green (97 pass)
- DISOL grep on net-worth.ts / historical-series.ts = 0

---
*Phase: 11-charts-primary-totals*
*Completed: 2026-09-06*
