---
phase: 08-debts-schema-domain-math
plan: 01
subsystem: database
tags: [prisma, sqlite, bigint, debts, vitest, isolation]

requires:
  - phase: 02-currencies-accounts
    provides: Currency model + Restrict FK patterns
  - phase: 01-docker-sqlite-foundation
    provides: prisma migrate deploy host gate + foundation.test.ts allow-list
provides:
  - Person / Debt / DebtRepayment / DebtSizeChange schema + debts_schema migration
  - Pure currentPrincipalMinor / remainingMinor / statusForRemaining (D-04 size-change ledger)
  - DISOL-01 source-scan gate in debts.test.ts
  - Host migrate deploy with debt tables in foundation allow-list
affects:
  - 08-02 domain asserts + primary totals
  - 08-03 debts Zod validations
  - Phase 9–11 debts UI / events / series

actuals:
  tokens: 2705
  tasks: 3
  commits: 2

tech-stack:
  added: []
  patterns:
    - size-change ledger remaining (initial + Σ delta − Σ repayments; no writeOff)
    - pure debts.ts with no Prisma imports
    - DISOL-01 readFileSync isolation scan

key-files:
  created:
    - prisma/migrations/20260904180755_debts_schema/migration.sql
    - src/lib/debts.ts
    - src/lib/debts.test.ts
  modified:
    - prisma/schema.prisma
    - src/lib/foundation.test.ts

key-decisions:
  - "size-change-two-tables (CONTEXT D-01/D-02) — no writeOffMinor; two event tables"
  - "DebtSizeChange.deltaMinor signed; remaining via order-independent sums only"
  - "Person.name @unique; FK Restrict Person/Currency→Debt; Cascade Debt→events"

patterns-established:
  - "Pattern 1: remainingMinor = currentPrincipal − Σ repayments (D-04)"
  - "Pattern 2: statusForRemaining CLOSED↔0n OPEN↔positive; negative throws"
  - "Pattern 3: DISOL-01 bans @/lib/debts imports in NW modules and page.tsx"

requirements-completed: [DEBT-02, DISOL-01]

coverage:
  - id: D1
    description: remainingMinor implements size-change ledger (initial + Σ delta − Σ repayments)
    requirement: DEBT-02
    verification:
      - kind: unit
        ref: src/lib/debts.test.ts#DEBT-02 remaining (CONTEXT D-04 size-change ledger)
        status: pass
    human_judgment: false
  - id: D2
    description: statusForRemaining maps 0n→CLOSED and positive→OPEN; negative throws
    requirement: DEBT-02
    verification:
      - kind: unit
        ref: src/lib/debts.test.ts#status sync (D-12, D-13)
        status: pass
    human_judgment: false
  - id: D3
    description: Person/Debt/DebtRepayment/DebtSizeChange migrate on host with Restrict/Cascade
    requirement: DEBT-02
    verification:
      - kind: other
        ref: DATABASE_URL=file:./data/wallet.db npx prisma migrate deploy
        status: pass
      - kind: unit
        ref: src/lib/foundation.test.ts#prisma migrate deploy host gate
        status: pass
    human_judgment: false
  - id: D4
    description: net-worth.ts, historical-series.ts, and app/page.tsx do not import debts
    requirement: DISOL-01
    verification:
      - kind: unit
        ref: src/lib/debts.test.ts#DISOL-01 isolation
        status: pass
    human_judgment: false

duration: 3min
completed: 2026-09-04
status: complete
---

# Phase 08 Plan 01: Debts schema + domain math Summary

**Person/Debt/event Prisma models + host `debts_schema` migrate, with pure BigInt remaining/status helpers and DISOL-01 isolation scan (CONTEXT size-change ledger, not writeOff).**

## Performance

- **Duration:** 3 min
- **Started:** 2026-09-04T16:07:37Z
- **Completed:** 2026-09-04T16:10:23Z
- **Tasks:** 3/3
- **Files modified:** 5

## Accomplishments

- Locked D-01/D-02 as size-change ledger + two event tables (auto-approved decision)
- Shipped Person/Debt/DebtRepayment/DebtSizeChange with Restrict/Cascade FKs and BigInt money fields
- Pure `currentPrincipalMinor` / `remainingMinor` / `statusForRemaining` + Vitest (D-04, D-12/D-13, DISOL-01)
- Host `prisma migrate deploy` applied `20260904180755_debts_schema`; foundation allow-list updated

## Task Commits

1. **Task 1: Confirm one-way size-change ledger schema (D-01, D-02)** - decision only (`size-change-two-tables`); no commit
2. **Task 2: End-to-end debts schema + remainingMinor tracer + DISOL scan** - `3f8f10d` (feat)
3. **Task 3: Host prisma migrate deploy + foundation table allow-list** - `d4dcf6b` (feat)

**Plan metadata:** `9b7a5f6` (docs: complete plan)

## Files Created/Modified

- `prisma/schema.prisma` - Person, Debt, enums, event models; Currency.debts
- `prisma/migrations/20260904180755_debts_schema/migration.sql` - RESTRICT/CASCADE SQL
- `src/lib/debts.ts` - remaining/status pure helpers
- `src/lib/debts.test.ts` - D-04 cases, schema greps, DISOL-01 scan
- `src/lib/foundation.test.ts` - debt tables + debts_schema migration assert; archived Phase 01 CONTEXT path

## Decisions Made

- **size-change-two-tables** (CONTEXT D-01/D-02) — auto-selected under auto-mode; rejected writeOff field and unified event table
- Model name `DebtSizeChange` with signed `deltaMinor` (RESEARCH A1)
- Phase 8 remaining uses order-independent sums only; both event models have `createdAt` for Phase 11 (A4)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Foundation CONTEXT path pointed at archived Phase 01 folder**
- **Found during:** Task 3 (Host prisma migrate deploy + foundation table allow-list)
- **Issue:** `src/lib/foundation.test.ts` read `.planning/phases/01-docker-sqlite-foundation/01-CONTEXT.md` which no longer exists after v1.0 milestone archive; full `foundation.test.ts` run failed even though migrate host gate passed
- **Fix:** Point test at `.planning/milestones/v1.0-phases/01-docker-sqlite-foundation/01-CONTEXT.md`
- **Files modified:** `src/lib/foundation.test.ts`
- **Commit:** `d4dcf6b`

## Auth Gates

None.

## Known Stubs

None — helpers are complete for this plan's scope (asserts/totals deferred to Plan 02).

## Threat Flags

None — schema FK Restrict/Cascade and DISOL scan match plan threat mitigations T-08-01–T-08-04; no new network endpoints.

## Self-Check: PASSED

- FOUND: prisma/schema.prisma, migration.sql, src/lib/debts.ts, src/lib/debts.test.ts, src/lib/foundation.test.ts
- FOUND commits: 3f8f10d, d4dcf6b
- vitest debts.test.ts + foundation.test.ts green; migrate status up to date
