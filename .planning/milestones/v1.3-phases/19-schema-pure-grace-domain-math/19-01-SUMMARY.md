---
phase: 19-schema-pure-grace-domain-math
plan: 01
subsystem: database
tags: [prisma, sqlite, credit-grace, clampDayOfMonth, dual-DOM, vitest]

requires:
  - phase: 18-bank-contract-study-discuss-locks
    provides: dual-DOM 21→15 bank contract + CONTEXT locks for CYCLE-01
provides:
  - Account statementDayOfMonth + dueDayOfMonth Int? with Account_grace_dom_invariant
  - CreditGraceObligation Cascade + @@unique([accountId, cycleStartAsOf])
  - Pure cycleStartAsOf / dueAsOfForCycle tracers
  - Host migrate credit_grace_dual_dom applied; foundation allowlist
affects:
  - 19-02 listCycleWindows / resolveCurrentAndNext
  - 19-03 updateGraceSchedule Zod + action
  - Phase 20 obligation CRUD / forecast membership

actuals:
  tokens: 2150
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - RedefineTables twin CHECKs (credit-limit + grace DOM) on Account rebuild
    - Pure credit-grace module imports only clampDayOfMonth from dates

key-files:
  created:
    - prisma/migrations/20260909090903_credit_grace_dual_dom/migration.sql
    - src/lib/credit-grace.ts
    - src/lib/credit-grace.test.ts
  modified:
    - prisma/schema.prisma
    - src/lib/foundation.test.ts
    - data/wallet.db

key-decisions:
  - "Auto-selected dual-dom-unique (D-03/D-09): Account_grace_dom_invariant + unique cycle key"
  - "dueAsOfForCycle = next calendar month + due DOM clamp — not sole addCalendarDays"

patterns-established:
  - "Grace schedule SoT = dual DOM on Account; obligation stores frozen dueAsOf"
  - "credit-grace.ts stays Prisma-free; Plan 02 expands window helpers"

requirements-completed: [CYCLE-01]

coverage:
  - id: D1
    description: Account stores dual DOM (statementDayOfMonth + dueDayOfMonth) with FIAT_CREDIT both-null-or-both CHECK
    requirement: CYCLE-01
    verification:
      - kind: other
        ref: "grep Account_grace_dom_invariant prisma/migrations/20260909090903_credit_grace_dual_dom/migration.sql"
        status: pass
      - kind: integration
        ref: "DATABASE_URL=file:./data/wallet.db npx prisma migrate deploy"
        status: pass
    human_judgment: false
  - id: D2
    description: CreditGraceObligation with Cascade FK, unique (accountId, cycleStartAsOf), OPEN|CLOSED + closedAsOf CHECK
    requirement: CYCLE-01
    verification:
      - kind: unit
        ref: "src/lib/foundation.test.ts#CreditGraceObligation table + credit_grace_dual_dom migration"
        status: pass
    human_judgment: false
  - id: D3
    description: cycleStartAsOf / dueAsOfForCycle next-month clamp (21→15 + Feb statement clamp)
    requirement: CYCLE-01
    verification:
      - kind: unit
        ref: "src/lib/credit-grace.test.ts#maps T-Bank 21→15 next-month due"
        status: pass
      - kind: unit
        ref: "src/lib/credit-grace.test.ts#clamps statement DOM 31 onto Feb"
        status: pass
    human_judgment: false

duration: 2min
completed: 2026-09-09
status: complete
---

# Phase 19 Plan 01: Schema + cycleStart/dueAsOf tracer Summary

**Dual-DOM Account schedule + CreditGraceObligation Cascade unique cycle key + pure next-month due clamp (21→15).**

## Performance

- **Duration:** 2 min
- **Started:** 2026-09-09T09:08:04Z
- **Completed:** 2026-09-09T09:10:08Z
- **Tasks:** 3/3
- **Files modified:** 5 (schema, migration, credit-grace + test, foundation.test; host wallet.db gitignored)

## Accomplishments

- Locked dual-DOM CHECK + unique cycle key before migrate (checkpoint `dual-dom-unique`)
- Shipped Account DOM columns, GraceObligationStatus, CreditGraceObligation Cascade + unique
- Migration `credit_grace_dual_dom` keeps `Account_credit_limit_invariant` and adds `Account_grace_dom_invariant` + status/closedAsOf CHECK
- Pure `cycleStartAsOf` / `dueAsOfForCycle` green for 2026-01-21→2026-02-15 and Feb-31 clamp
- Host `prisma migrate deploy` on `data/wallet.db`; foundation allowlists `CreditGraceObligation`

## Task Commits

1. **Task 1: Confirm dual-DOM CHECK + unique cycle key** — auto-selected `dual-dom-unique` (no commit; decision only)
2. **Task 2: End-to-end dual DOM schema + cycleStart/dueAsOf tracer** — `956b357` (feat)
3. **Task 3: Host migrate deploy + foundation allowlist** — `6e8aa65` (feat)

**Plan metadata:** (docs commit after this SUMMARY)

## Files Created/Modified

- `prisma/schema.prisma` — dual DOM on Account; GraceObligationStatus; CreditGraceObligation
- `prisma/migrations/20260909090903_credit_grace_dual_dom/migration.sql` — RedefineTables + CHECKs + obligation table
- `src/lib/credit-grace.ts` — cycleStartAsOf, dueAsOfForCycle
- `src/lib/credit-grace.test.ts` — 21→15 + Feb clamp + Dec→Jan roll
- `src/lib/foundation.test.ts` — CreditGraceObligation + credit_grace_dual_dom asserts
- `data/wallet.db` — host migrate applied (gitignored)

## Decisions Made

- ⚡ Auto-selected: dual-dom-unique — Account_grace_dom_invariant (both-null-or-both + FIAT_CREDIT-only) and @@unique([accountId, cycleStartAsOf]) per CONTEXT D-03/D-09
- Due engine = next calendar month + clampDayOfMonth (D-10); no duration-days SoT columns

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. Prisma `--create-only` emitted ALTER; replaced with RedefineTables per plan/PATTERNS (expected customize step, not a deviation).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 02 can extend `credit-grace.ts` with listCycleWindows / resolveCurrentAndNext / isGraceOverdue
- Plan 03 can add updateGraceSchedule Zod + Server Action against live dual-DOM columns
- No UI chrome added (UI-00)

## Self-Check: PASSED

- FOUND: prisma/schema.prisma
- FOUND: prisma/migrations/20260909090903_credit_grace_dual_dom/migration.sql
- FOUND: src/lib/credit-grace.ts
- FOUND: src/lib/credit-grace.test.ts
- FOUND: src/lib/foundation.test.ts
- FOUND: commits 956b357, 6e8aa65

---
*Phase: 19-schema-pure-grace-domain-math*
*Completed: 2026-09-09*
