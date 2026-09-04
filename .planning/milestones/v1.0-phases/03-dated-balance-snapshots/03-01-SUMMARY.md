---
phase: 03-dated-balance-snapshots
plan: 01
subsystem: database
tags: [prisma, sqlite, balance-snapshot, locf, zod, vitest]

requires:
  - phase: 02-currencies-accounts
    provides: Account model, ensureSqlitePragmas, Zod/Server Action patterns, host migrate deploy lesson
provides:
  - BalanceSnapshot Prisma model with named unique accountId_asOfDate
  - getBalanceAsOf LOCF helper (null before first)
  - creditDebtMinor and calendarDateToday (Europe/Moscow)
  - setBalanceSchema / deleteBalanceSchema Zod contracts
  - Host DB migrated; BalanceAmountStub removed
affects:
  - 03-02 set-balance Server Actions and Dialog
  - 03-03 accounts LOCF UI / history
  - Phase 04+ FX and net worth as-of reads

actuals:
  tokens: 3278
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - LOCF via findFirst asOfDate lte + orderBy desc
    - Compound upsert identity accountId_asOfDate
    - calendarDateToday Intl en-CA parts in Europe/Moscow

key-files:
  created:
    - prisma/migrations/20260903120000_balance_snapshot/migration.sql
    - src/lib/balances.ts
    - src/lib/balances.test.ts
    - src/lib/validations/balance.ts
    - src/lib/validations/balance.test.ts
  modified:
    - prisma/schema.prisma
    - src/lib/foundation.test.ts

key-decisions:
  - "BalanceSnapshot naming and @@unique name accountId_asOfDate per RESEARCH lock"
  - "Future-date and credit 0..limit left to Plan 02 Server Actions"
  - "calendarDateToday default Europe/Moscow (A3)"

patterns-established:
  - "getBalanceAsOf awaits ensureSqlitePragmas before Prisma reads"
  - "Wave 0 Zod shape vs action-level business rules split"

requirements-completed: [BAL-01, BAL-02]

coverage:
  - id: D1
    description: setBalanceSchema accepts YYYY-MM-DD + amountMajor; Russian invalid messages
    requirement: BAL-01
    verification:
      - kind: unit
        ref: src/lib/validations/balance.test.ts
        status: pass
    human_judgment: false
  - id: D2
    description: getBalanceAsOf LOCF between/equal/before-first null; upsert overwrite identity
    requirement: BAL-02
    verification:
      - kind: unit
        ref: src/lib/balances.test.ts
        status: pass
    human_judgment: false
  - id: D3
    description: BalanceSnapshot schema unique; stub gone; host migrate up to date
    requirement: BAL-01
    verification:
      - kind: unit
        ref: src/lib/foundation.test.ts#BalanceSnapshot table allow-list
        status: pass
      - kind: other
        ref: DATABASE_URL=file:./data/wallet.db npx prisma migrate status
        status: pass
    human_judgment: false

duration: 5min
completed: 2026-09-03
status: complete
---

# Phase 03 Plan 01: Dated Balance Snapshots Summary

**BalanceSnapshot + LOCF helpers on migrated SQLite — BAL-02 null-before-first and BAL-01 unique overwrite ready for Plan 02 UI/actions.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-09-03T11:00:18Z
- **Completed:** 2026-09-03T11:04:50Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- Wave 0 red tests for Zod balance shape and LOCF/null/overwrite
- Replaced BalanceAmountStub with BalanceSnapshot (`@@unique` `accountId_asOfDate`)
- Implemented `getBalanceAsOf`, `creditDebtMinor`, `calendarDateToday`, Zod schemas; host `migrate deploy` up to date

## Task Commits

Each task was committed atomically:

1. **Task 1: Wave 0 balance Zod + LOCF tests (red-first)** - `2050d0f` (test)
2. **Task 2: End-to-end BalanceSnapshot schema + LOCF helpers + Zod** - `b752d84` (feat)
3. **Task 3: prisma migrate deploy host gate** - `001f030` (feat)

**Plan metadata:** `14ede9c` (docs: complete plan); `f5f9ea4` (docs: STATE/ROADMAP)

## Files Created/Modified

- `prisma/schema.prisma` — BalanceSnapshot model; Account.balanceSnapshots; stub removed
- `prisma/migrations/20260903120000_balance_snapshot/migration.sql` — DROP stub / CREATE snapshot + unique
- `src/lib/balances.ts` — LOCF + debt + today helpers
- `src/lib/balances.test.ts` — Wave 0 LOCF / overwrite / debt / today
- `src/lib/validations/balance.ts` — setBalanceSchema / deleteBalanceSchema
- `src/lib/validations/balance.test.ts` — Zod Russian message cases
- `src/lib/foundation.test.ts` — table allow-list BalanceSnapshot + migration name assert

## Decisions Made

- Kept Plan 02 for future-date and credit available bounds (need DB account).
- Default TZ Europe/Moscow for `calendarDateToday` (A3).
- Stopped host `next-server` briefly so migrate could unlock SQLite (Phase 02 lesson).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Stopped host next-server holding SQLite lock**
- **Found during:** Task 3 (prisma migrate deploy host gate)
- **Issue:** `DATABASE_URL=file:./data/wallet.db npx prisma migrate deploy` failed with `database is locked`; PID 24525 `next-server (v16.3.4)` held `data/wallet.db` (Compose wallet-web not running).
- **Fix:** `kill -TERM` next-server, deploy migrations (also applied pending `account_credit_limit_check`), restarted `npm run dev`.
- **Files modified:** none (ops only)
- **Commit:** n/a (ops); foundation update in `001f030`

## Auth Gates

None.

## Threat Flags

None — surface matches plan threat model (Zod asOfDate shape, LOCF null, unique overwrite, no debt column).

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: prisma/schema.prisma BalanceSnapshot; migration.sql; balances.ts; validations/balance.ts; foundation.test.ts
- FOUND commits: 2050d0f, b752d84, 001f030
- VERIFY: balance + balances + money + foundation tests passed; migrate status up to date
