---
phase: 02-currencies-accounts
plan: 01
subsystem: database
tags: [prisma, sqlite, zod, bigint, currency, money]

requires:
  - phase: 01-docker-sqlite-foundation
    provides: Prisma Currency stub, money RATE_SCALE_E8, migrate deploy host path
provides:
  - Currency.isPrimary Boolean on schema
  - Migration-seeded primary RUB (code RUB, name Рубль, scale 2)
  - Currency_one_primary partial unique index
  - parseMajorToMinor / formatMinorToMajor BigInt helpers
  - createCurrencySchema / updateCurrencyNameSchema Zod
affects: [02-02 currencies UI, 02-03 accounts schema]

actuals:
  tokens: 3644
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - Seed primary currency in migrate deploy SQL (not prisma db seed)
    - SQLite partial unique index for exactly-one primary
    - Zod create vs name-only update schemas for immutable identity fields

key-files:
  created:
    - prisma/migrations/20260902201000_currency_primary_rub/migration.sql
    - src/lib/validations/currency.ts
    - src/lib/validations/currency.test.ts
  modified:
    - prisma/schema.prisma
    - src/lib/money.ts
    - src/lib/money.test.ts
    - src/lib/foundation.test.ts

key-decisions:
  - "Kept D-01 seed in migration SQL with Currency_one_primary partial unique index"
  - "Briefly stopped wallet-web container so host migrate deploy could unlock SQLite"

patterns-established:
  - "Money major↔minor via BigInt only; reject scientific notation"
  - "Currency Zod: printable ASCII code max 16; scale 0–18 Russian message"

requirements-completed: [CURR-01]

coverage:
  - id: D1
    description: Currency.isPrimary on schema + Currency_one_primary partial unique index
    requirement: CURR-01
    verification:
      - kind: other
        ref: "grep isPrimary prisma/schema.prisma; grep Currency_one_primary migration.sql"
        status: pass
      - kind: unit
        ref: "src/lib/foundation.test.ts#applies committed migration to a fresh file DB"
        status: pass
    human_judgment: false
  - id: D2
    description: migrate deploy seeds primary RUB (Рубль, scale 2, isPrimary)
    requirement: CURR-01
    verification:
      - kind: other
        ref: "DATABASE_URL=file:./data/wallet.db npx prisma migrate deploy"
        status: pass
      - kind: unit
        ref: "src/lib/foundation.test.ts#RUB primary + Currency_one_primary"
        status: pass
    human_judgment: false
  - id: D3
    description: parseMajorToMinor/formatMinorToMajor round-trip BigInt for scales 0,2,8,18
    requirement: CURR-01
    verification:
      - kind: unit
        ref: "src/lib/money.test.ts#round-trips scales 0, 2, 8, 18 without float"
        status: pass
    human_judgment: false
  - id: D4
    description: Currency Zod create (code/name/scale 0–18) and update name-only with Russian scale errors
    requirement: CURR-01
    verification:
      - kind: unit
        ref: "src/lib/validations/currency.test.ts"
        status: pass
    human_judgment: false

duration: 4min
completed: 2026-09-02
status: complete
---

# Phase 02 Plan 01: Currency Contract Summary

**Migration-seeded primary RUB with `Currency.isPrimary` + partial unique index, BigInt money parse/format, and CURR-01 Zod create/update schemas**

## Performance

- **Duration:** 4 min
- **Started:** 2026-09-02T20:09:04Z
- **Completed:** 2026-09-02T20:12:56Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- Extended `Currency` with `isPrimary`; seed RUB primary in migrate deploy SQL
- Added `Currency_one_primary` partial unique index (exactly one primary)
- Implemented `parseMajorToMinor` / `formatMinorToMajor` without float
- Shipped Zod `createCurrencySchema` / `updateCurrencyNameSchema` with Russian scale bounds message
- Host `prisma migrate deploy` up to date; foundation fresh-DB asserts RUB + index

## Task Commits

Each task was committed atomically:

1. **Task 1: Wave 0 currency Zod + money parse/format tests (red-first)** - `480d0d3` (test)
2. **Task 2: End-to-end Currency.isPrimary + RUB seed migration + money/Zod** - `cb73b40` (feat)
3. **Task 3: prisma migrate deploy host gate** - `8bfaa17` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified

- `prisma/schema.prisma` - `Currency.isPrimary` Boolean + schema comment for partial index
- `prisma/migrations/20260902201000_currency_primary_rub/migration.sql` - ALTER, INSERT RUB, `Currency_one_primary`
- `src/lib/money.ts` - BigInt major↔minor helpers
- `src/lib/money.test.ts` - round-trip + scientific-notation rejection
- `src/lib/validations/currency.ts` - create/update Zod schemas
- `src/lib/validations/currency.test.ts` - CURR-01 Zod Wave 0 tests
- `src/lib/foundation.test.ts` - fresh migrate asserts RUB primary + index + migration name

## Decisions Made

- Followed locked D-01/D-02: seed + partial unique index in migration SQL (no `prisma db seed` as sole path)
- Stopped `wallet-web-1` briefly so host migrate deploy could apply against locked SQLite volume

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Host migrate deploy blocked by Docker SQLite lock**
- **Found during:** Task 3 (prisma migrate deploy host gate)
- **Issue:** `wallet-web-1` held `data/wallet.db` open (`database is locked`)
- **Fix:** `docker stop wallet-web-1` → `migrate deploy` → `docker start wallet-web-1`
- **Files modified:** none (ops only); host DB updated
- **Verification:** migrate status "Database schema is up to date!"; foundation tests pass
- **Committed in:** `8bfaa17` (documented in commit message)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required to complete blocking migrate gate; no schema/API scope change

## Issues Encountered

- Host SQLite locked by running Compose app during migrate deploy — resolved by brief container stop

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CURR-01 data contract ready for Plan 02 currencies UI (list/create/update name)
- Account model still deferred to Plan 03

## Self-Check: PASSED

- Key files present on disk
- Commits `480d0d3`, `cb73b40`, `8bfaa17` present in git log
- Unit tests green for currency + money + foundation

---
*Phase: 02-currencies-accounts*
*Completed: 2026-09-02*
