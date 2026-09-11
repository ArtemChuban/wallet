---
phase: 27-savings-schema-crud
plan: 02
subsystem: database
tags: [prisma, sqlite, savings, zod, net-worth, create-form, tracer]

requires:
  - phase: 27-01
    provides: Wave 0 red create/NW/type contracts for SAVINGS
provides:
  - AccountType.SAVINGS + annualRateBps + accrualDayOfMonth
  - Account_savings_rate_invariant (+ retained credit/grace CHECKs)
  - parsePercentToBps / formatBpsToPercentMajor
  - Soft isAssetType/NetWorthAccountType/label Накопительный
  - createAccountSchema + createAccount SAVINGS persist
  - AccountFormDialog create gated Годовой % / День начисления
  - Host data/wallet.db migrate deploy with savings_account
affects:
  - 27-03 updateAccount SAVINGS edit
  - 27-04 list countdown + accrual display
  - Phases 28–30 interest / forecast / MCP

actuals:
  tokens: 4288
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - RedefineTables twin of credit_grace_dual_dom with CHECK triad
    - Type-gated create fields mirror FIAT_CREDIT credit-limit visibility
    - parsePercentToBps via money scale-2 (not FX RATE_SCALE_E8)

key-files:
  created:
    - prisma/migrations/20260911161446_savings_account/migration.sql
    - src/lib/savings-rate.ts
  modified:
    - prisma/schema.prisma
    - src/lib/account-type.ts
    - src/lib/net-worth.ts
    - src/lib/validations/account.ts
    - src/app/accounts/actions.ts
    - src/components/accounts/AccountFormDialog.tsx
    - src/lib/foundation.test.ts
    - src/lib/net-worth.test.ts

key-decisions:
  - "Auto-selected savings-check-enum (D-14/D-15) — SAVINGS enum + Account_savings_rate_invariant"
  - "createAccount omits savings columns for non-SAVINGS (Prisma null default + CHECK)"
  - "Form hides gated inputs when type ≠ SAVINGS so FormData never submits rate/DOM"

patterns-established:
  - "SAVINGS create: FormData annualRatePercentMajor + accrualDayOfMonth → parsePercentToBps → annualRateBps"
  - "Migration INSERT copies prior columns only; new savings cols null for legacy rows"

requirements-completed: [ACCT-01, ACCT-02]

coverage:
  - id: D1
    description: Schema SAVINGS + annualRateBps + accrualDayOfMonth with savings CHECK triad
    requirement: ACCT-01
    verification:
      - kind: unit
        ref: "grep SAVINGS/annualRateBps/Account_savings_rate_invariant + migrate deploy"
        status: pass
    human_judgment: false
  - id: D2
    description: createAccountSchema accepts SAVINGS rate+DOM; rejects ASSET savings / SAVINGS creditLimit
    requirement: ACCT-01
    verification:
      - kind: unit
        ref: "npx vitest run src/lib/validations/account.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: isAssetType(SAVINGS) + label Накопительный; NW LOCF includes SAVINGS
    requirement: ACCT-02
    verification:
      - kind: unit
        ref: "npx vitest run src/lib/account-type.test.ts src/lib/net-worth.test.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: createAccount persists annualRateBps + accrualDayOfMonth (incl. 0%)
    requirement: ACCT-01
    verification:
      - kind: unit
        ref: "npx vitest run src/app/accounts/actions.test.ts -t createAccount"
        status: pass
    human_judgment: false
  - id: D5
    description: Create form type-gated «Годовой %» + «День начисления» (no DOM default)
    requirement: ACCT-01
    verification:
      - kind: other
        ref: "grep labels in AccountFormDialog.tsx; showSavingsFields only when SAVINGS"
        status: pass
    human_judgment: false

duration: 4min
completed: 2026-09-11
status: complete
---

# Phase 27 Plan 02: SAVINGS schema + create tracer Summary

**End-to-end SAVINGS create: Prisma enum/columns + CHECK triad, soft NW, Zod/action persist, type-gated create form; host DB migrated.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-09-11T16:14:20Z
- **Completed:** 2026-09-11T16:18:00Z
- **Tasks:** 3/3
- **Files modified:** 10

## Accomplishments
- Locked savings-check-enum (D-14/D-15) and shipped RedefineTables migration with credit+grace+savings CHECKs
- Green Wave 0 create/NW/type tests via soft unions, Zod write enum ASSET|FIAT_CREDIT|SAVINGS, createAccount bps persist
- Create dialog exposes «Годовой %» / «День начисления» only for Накопительный; host `migrate deploy` applied `savings_account`

## Task Commits

1. **Task 1: Confirm one-way Account_savings_rate_invariant + SAVINGS enum** - auto-selected `savings-check-enum` (no commit; decision only)
2. **Task 2: End-to-end create SAVINGS — schema through create form** - `f96d8e8` (feat)
3. **Task 3: Host prisma migrate deploy after savings schema** - `478c110` (chore)

**Plan metadata:** `9ffc8d5` (docs: complete plan)

## Files Created/Modified
- `prisma/schema.prisma` — SAVINGS enum; annualRateBps; accrualDayOfMonth
- `prisma/migrations/20260911161446_savings_account/migration.sql` — RedefineTables + CHECK triad
- `src/lib/savings-rate.ts` — parsePercentToBps / formatBpsToPercentMajor
- `src/lib/account-type.ts` — soft SAVINGS + Накопительный
- `src/lib/net-worth.ts` — NetWorthAccountType includes SAVINGS
- `src/lib/validations/account.ts` — create write enum + savings refine
- `src/app/accounts/actions.ts` — createAccount SAVINGS persist
- `src/components/accounts/AccountFormDialog.tsx` — TYPE_OPTIONS + gated fields
- `src/lib/foundation.test.ts` — expect savings_account migration
- `src/lib/net-worth.test.ts` — drop Wave 0 cast (union now includes SAVINGS)

## Decisions Made
- Auto-selected **savings-check-enum** per CONTEXT D-14/D-15 and `--auto` checkpoint resolution
- Non-SAVINGS create omits savings keys (null by default); SAVINGS always sends both rate+DOM
- Edit/update, list countdown, interest math deferred to Plans 03–04 / Phases 28+

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Prisma migrate status wording**
- **Found during:** Task 3 (host migrate deploy)
- **Issue:** Plan verify grepped `up to date|No pending migrations`; current Prisma CLI prints `Migrations: 0 applied, 0 pending`
- **Fix:** Confirmed `0 pending`, `_prisma_migrations` contains `savings_account`, columns present on Account; foundation.test green
- **Files modified:** none (verify-only)
- **Commit:** n/a

## Auth Gates

None.

## Known Stubs

None — create path fully wired; Plan 03 owns update; Plan 04 owns list countdown module.

## Threat Flags

None beyond plan threat model (create FormData → Zod → Prisma; CHECK dual enforcement shipped).

## Self-Check: PASSED

- FOUND: prisma/schema.prisma (SAVINGS, annualRateBps, accrualDayOfMonth)
- FOUND: prisma/migrations/20260911161446_savings_account/migration.sql
- FOUND: src/lib/savings-rate.ts
- FOUND: commits f96d8e8, 478c110
