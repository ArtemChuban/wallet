---
phase: 13-income-schema-domain-math
plan: 01
subsystem: database
tags: [prisma, sqlite, income, bigint, clampDayOfMonth, vitest, side-ledger]

requires:
  - phase: 08-debts-schema-domain
    provides: Person/Currency Restrict + Cascade child event pattern; foundation migrate gate
provides:
  - Four income Prisma models (RecurringIncome, OneTimeIncome, RecurringIncomeActual, OneTimeIncomeActual)
  - income_schema migration with Restrict/Cascade/unique slot indexes
  - clampDayOfMonth in dates.ts
  - listRecurringOccurrences tracer in income.ts
  - Foundation allowlist + income_schema migration assert
affects: [14-income-crud, 15-actual-overdue, 16-income-stats, 17-forecast-isolation]

actuals:
  tokens: 3916
  tasks: 3
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Debt-mirror four-model income side ledger (two defs + two actuals)"
    - "UTC DOM clamp via Date.UTC day-0 last-day (no rrule)"
    - "Pure listRecurringOccurrences tracer; freeze-merge deferred to 13-02"

key-files:
  created:
    - prisma/migrations/20260907112136_income_schema/migration.sql
    - src/lib/income.ts
    - src/lib/income.test.ts
  modified:
    - prisma/schema.prisma
    - src/lib/dates.ts
    - src/lib/dates.test.ts
    - src/lib/foundation.test.ts

key-decisions:
  - "Four models (CONTEXT D-03/D-04) — auto-selected over polymorphic IncomeSource+enum"
  - "Tracer ignores actuals; freeze-merge deferred to Plan 02"

patterns-established:
  - "Person/Currency inverse arrays recurringIncomes / oneTimeIncomes"
  - "Occurrence key (parentId, plannedAsOf) with @@unique on actual tables"
  - "income.ts isolation: no Prisma / net-worth / historical-series imports"

requirements-completed: [FND-SCHEMA, FND-CLAMP, FND-MIG, FND-OCC]

coverage:
  - id: D1
    description: Four Prisma income models persist after migrate deploy (Restrict/Cascade/unique)
    requirement: FND-SCHEMA
    verification:
      - kind: unit
        ref: "src/lib/income.test.ts#income schema conventions"
        status: pass
      - kind: unit
        ref: "src/lib/foundation.test.ts#prisma migrate deploy host gate"
        status: pass
    human_judgment: false
  - id: D2
    description: clampDayOfMonth maps DOM 31 to last day of short months (Feb leap/non-leap, Apr)
    requirement: FND-CLAMP
    verification:
      - kind: unit
        ref: "src/lib/dates.test.ts#clampDayOfMonth (D-16 / FND-CLAMP)"
        status: pass
    human_judgment: false
  - id: D3
    description: listRecurringOccurrences returns clamped Feb slot with bigint plannedAmountMinor
    requirement: FND-OCC
    verification:
      - kind: unit
        ref: "src/lib/income.test.ts#listRecurringOccurrences tracer"
        status: pass
    human_judgment: false
  - id: D4
    description: Host migrate deploy applies income_schema; foundation allowlist includes four tables
    requirement: FND-MIG
    verification:
      - kind: unit
        ref: "src/lib/foundation.test.ts#prisma migrate deploy host gate"
        status: pass
      - kind: other
        ref: "DATABASE_URL=file:./data/wallet.db npx prisma migrate deploy"
        status: pass
    human_judgment: false

duration: 3min
completed: 2026-09-07
status: complete
---

# Phase 13 Plan 01: Income schema + domain math tracer Summary

**Four-model income side ledger + UTC DOM clamp + listRecurringOccurrences tracer, migrated on host SQLite**

## Performance

- **Duration:** 3 min
- **Started:** 2026-09-07T11:19:57Z
- **Completed:** 2026-09-07T11:23:25Z
- **Tasks:** 3 (1 decision auto-selected + 1 tracer + 1 migrate)
- **Files modified:** 7

## Accomplishments
- Locked and shipped four Prisma models (RecurringIncome / OneTimeIncome + actuals) with BigInt minors, optional note, Person/Currency Restrict, Cascade actuals, @@unique slot keys — no active/endAsOf
- Added `clampDayOfMonth` and Vitest matrix (31→Feb leap/non-leap, 31→Apr)
- Tracer `listRecurringOccurrences` emits inclusive-range clamped slots with bigint `plannedAmountMinor`
- Host `prisma migrate deploy` applied `20260907112136_income_schema`; foundation allowlist + migration name assert green

## Task Commits

1. **Task 1: Confirm four-model schema (D-03/D-04)** - _(decision — no code commit)_ ⚡ Auto-selected: Four models
2. **Task 2: End-to-end income schema + clamp + listRecurringOccurrences tracer** - `3de8f6e` (feat)
3. **Task 3: Host prisma migrate deploy + foundation income allowlist** - `f78eff3` (feat)

**Plan metadata:** _(pending docs commit)_

## Files Created/Modified
- `prisma/schema.prisma` — four income models + Person/Currency inverse relations
- `prisma/migrations/20260907112136_income_schema/migration.sql` — Restrict/Cascade/unique SQL
- `src/lib/dates.ts` — `clampDayOfMonth`
- `src/lib/dates.test.ts` — FND-CLAMP matrix
- `src/lib/income.ts` — `listRecurringOccurrences` tracer (+ types)
- `src/lib/income.test.ts` — FND-OCC + schema locks + ISO-01 light scan
- `src/lib/foundation.test.ts` — income table allowlist + income_schema assert

## Decisions Made
- **Four models (CONTEXT D-03 / D-04)** — auto-selected under AUTO_MODE; rejected single IncomeSource+enum and defs-only deferrals
- Tracer path ignores actuals; month-keyed freeze-merge deferred to Plan 02 (A2)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Isolation test matched comment text**
- **Found during:** Task 2 (tracer)
- **Issue:** Regex `/net-worth|historical-series/` matched ISO-01 comment in `income.ts`, not an import
- **Fix:** Narrowed test to `from "@/lib/net-worth|historical-series"` / prisma import patterns
- **Files modified:** `src/lib/income.test.ts`
- **Verification:** vitest green
- **Committed in:** `3de8f6e` (Task 2)

**2. [Rule 3 - Blocking] Prisma 7 migrate status wording**
- **Found during:** Task 3 verify grep
- **Issue:** Plan expected `up to date` / `No pending migrations`; CLI prints `Migrations: 0 applied, 0 pending` after deploy
- **Fix:** Confirmed tables + `_prisma_migrations` row `income_schema` via sqlite3; foundation.test.ts still proves migrate on fresh DB
- **Files modified:** none
- **Verification:** income tables present; foundation vitest pass
- **Committed in:** n/a (verify-only)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking verify wording)
**Impact on plan:** No scope creep; acceptance criteria met.

## Issues Encountered
None beyond deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Schema + clamp + tracer ready for Plan 02 (freeze-merge, one-time list, overdue helpers)
- UI-00 / ISO-01 intact: no `/income` route; no BalanceSnapshot writes
- Zero new npm packages

## Self-Check: PASSED

- FOUND: `prisma/schema.prisma` (four models)
- FOUND: `prisma/migrations/20260907112136_income_schema/migration.sql`
- FOUND: `src/lib/dates.ts` (`clampDayOfMonth`)
- FOUND: `src/lib/income.ts` (`listRecurringOccurrences`)
- FOUND: `src/lib/income.test.ts`
- FOUND: `src/lib/foundation.test.ts` (income allowlist)
- FOUND: commit `3de8f6e`
- FOUND: commit `f78eff3`

---
*Phase: 13-income-schema-domain-math*
*Completed: 2026-09-07*
