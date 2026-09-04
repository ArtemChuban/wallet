---
phase: 01-docker-sqlite-foundation
plan: 03
subsystem: database
tags: [prisma, sqlite, bigint, money, fx, migrate]

requires:
  - phase: 01-01
    provides: pinned prisma 7.10.0 stack, Wave 0 money.test.ts RED, dotenv
  - phase: 01-02
    provides: Next App Router shell ready for later DB wiring
provides:
  - Prisma schema stub locking Currency.scale + BigInt money/FX columns
  - RATE_SCALE_E8 constant and green money unit tests
  - prisma.config.ts + db singleton with better-sqlite3 adapter
  - Initial migration applied to host file:./data/wallet.db
affects: [01-04-docker-compose, phase-02-currencies]

actuals:
  tokens: 938
  tasks: 3
  commits: 2

tech-stack:
  added: []
  patterns:
    - Prisma 7 prisma.config.ts datasource URL from DATABASE_URL
    - BigInt minor units + RATE_SCALE_E8 for FX
    - Host migrate deploy against file:./data/wallet.db (volume-adjacent)

key-files:
  created:
    - prisma/schema.prisma
    - prisma/migrations/20260902151000_init_platform_stub/migration.sql
    - prisma.config.ts
    - src/lib/money.ts
    - src/lib/db.ts
  modified:
    - package.json

key-decisions:
  - "Human locked-context: INTEGER minor units, required Currency.scale, FX × 10^8 BigInt"
  - "Host DATABASE_URL default file:./data/wallet.db; Compose overrides later"
  - "Initial migration created via prisma migrate diff (non-interactive) then migrate deploy"

patterns-established:
  - "Money/rate columns are BigInt only — never Float/Decimal/REAL"
  - "Currency.scale required with no DB default"
  - "src/generated/prisma gitignored; prisma generate via postinstall"

requirements-completed: [PLAT-01]

coverage:
  - id: D1
    description: Human confirmed one-way money/FX column contract (locked-context)
    requirement: PLAT-01
    verification: []
    human_judgment: true
    rationale: Checkpoint decision must be human-locked before irreversible schema write
  - id: D2
    description: RATE_SCALE_E8 and schema BigInt/scale conventions pass unit tests
    requirement: PLAT-01
    verification:
      - kind: unit
        ref: src/lib/money.test.ts#money conventions / schema conventions
        status: pass
    human_judgment: false
  - id: D3
    description: prisma migrate deploy succeeds against host data/wallet.db with no pending migrations
    requirement: PLAT-01
    verification:
      - kind: integration
        ref: DATABASE_URL=file:./data/wallet.db npx prisma migrate deploy && migrate status
        status: pass
    human_judgment: false

duration: 3min
completed: 2026-09-02
status: complete
---

# Phase 01 Plan 03: Prisma money/FX lock Summary

**Locked INTEGER/BigInt money + FX×10^8 schema migrated onto host `data/wallet.db` with green `RATE_SCALE_E8` tests.**

## Performance

- **Duration:** 3min
- **Started:** 2026-09-02T15:09:54Z
- **Completed:** 2026-09-02T15:12:25Z
- **Tasks:** 3 completed (Task 1 checkpoint prior session; Tasks 2–3 this run)
- **Files modified:** 7 tracked (schema, migration, config, money, db, package.json)

## Accomplishments

- Human selected `locked-context` for D-07/D-08/D-09 before any schema write
- Prisma stub models `Currency`, `FxRateStub`, `BalanceAmountStub` with BigInt money/rate and required `scale`
- `RATE_SCALE_E8 = 100000000n` exported; `money.test.ts` green
- `prisma migrate deploy` applied `init_platform_stub` to `file:./data/wallet.db` (gitignored)

## Task Commits

Each task was committed atomically:

1. **Task 1: Confirm one-way money and FX column contract** - (checkpoint decision — no code commit; human chose `locked-context`)
2. **Task 2: Prisma schema stub + money.ts + db singleton** - `c649dd0` (feat)
3. **Task 3: prisma migrate deploy against host data file** - no tracked commit (deploy smoke only; `data/wallet.db` gitignored)

**Plan metadata:** `dfea011` (docs: complete plan)

_Note: Wave 0 RED for `money.test.ts` shipped in Plan 01; Task 2 was GREEN-only._

## Files Created/Modified

- `prisma/schema.prisma` - Currency / FxRateStub / BalanceAmountStub money conventions
- `prisma/migrations/20260902151000_init_platform_stub/migration.sql` - initial DDL
- `prisma/migrations/migration_lock.toml` - sqlite provider lock
- `prisma.config.ts` - Prisma 7 datasource URL from env
- `src/lib/money.ts` - `RATE_SCALE_E8`
- `src/lib/db.ts` - PrismaClient + better-sqlite3 adapter singleton + WAL/FK pragmas helper
- `package.json` - `postinstall: prisma generate`

## Decisions Made

- Locked CONTEXT contract (`locked-context`): INTEGER minor units, required `Currency.scale`, FX rate × 10^8 as BigInt
- Host default URL `file:./data/wallet.db` for tooling; container path deferred to Plan 04
- Migration authored with `prisma migrate diff --from-empty` for non-interactive CI-safe creation, then `migrate deploy`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Non-interactive migration creation**
- **Found during:** Task 2 (Prisma schema stub + money.ts + db singleton)
- **Issue:** `prisma migrate diff --to-schema-datamodel` removed in Prisma 7.10; interactive `migrate dev` unsuitable for agent
- **Fix:** Used `prisma migrate diff --from-empty --to-schema --script --output …/migration.sql` plus `migration_lock.toml`
- **Files modified:** `prisma/migrations/`
- **Verification:** migrate deploy + status up to date
- **Committed in:** `c649dd0`

---

**Total deviations:** 1 auto-fixed (Rule 3)
**Impact on plan:** Necessary for Prisma 7 CLI; same SQL semantics as planned migrate create

## Issues Encountered

None beyond Prisma 7 CLI flag rename handled above.

## User Setup Required

None - no external service configuration required. Local `.env` may copy `DATABASE_URL` from `.env.example` for host tooling.

## Next Phase Readiness

Schema stub and host migrate path ready for Plan 04 Docker Compose tracer (entrypoint migrate-on-start, volume `./data:/data`). Do not COPY `wallet.db` into images.

## TDD Gate Compliance

- RED: Wave 0 `src/lib/money.test.ts` from Plan 01 (import failure / missing module)
- GREEN: `c649dd0` feat implementing `money.ts` + schema
- REFACTOR: skipped (no cleanup needed)

## Self-Check: PASSED

- FOUND: prisma/schema.prisma, prisma.config.ts, src/lib/money.ts, src/lib/db.ts, prisma/migrations/.../migration.sql, 01-03-SUMMARY.md
- FOUND: commit c649dd0
- VERIFIED: money.test.ts exit 0; Float count 0 in schema; migrate status up to date; data/wallet.db gitignored

---
*Phase: 01-docker-sqlite-foundation*
*Completed: 2026-09-02*
