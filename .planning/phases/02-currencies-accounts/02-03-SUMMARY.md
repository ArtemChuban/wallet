---
phase: 02-currencies-accounts
plan: 03
subsystem: database
tags: [prisma, sqlite, zod, bigint, accounts, credit-limit, nextjs, server-actions]

requires:
  - phase: 02-currencies-accounts
    provides: Currency seed RUB, parseMajorToMinor, currencies Dialog/nav patterns
provides:
  - AccountType enum and Account model with creditLimitMinor BigInt metadata
  - Migration 20260902202603_account_credit_limit applied via migrate deploy
  - createAccountSchema / updateAccountNameSchema Zod with FIAT_CREDIT superRefine
  - createAccount / updateAccountName Server Actions
  - /accounts RSC list + Russian Dialog create/edit
affects: [02-04 immutability hardening, Phase 03 balance snapshots]

actuals:
  tokens: 7313
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - Account.creditLimitMinor BigInt metadata-only (never NW asset)
    - Zod create superRefine for FIAT_CREDIT required >0 limit; name-only update
    - Serialize BigInt creditLimitMinor to string across RSC→client boundary

key-files:
  created:
    - prisma/migrations/20260902202603_account_credit_limit/migration.sql
    - src/lib/validations/account.ts
    - src/lib/validations/account.test.ts
    - src/app/accounts/actions.ts
    - src/app/accounts/page.tsx
    - src/components/accounts/AccountList.tsx
    - src/components/accounts/AccountFormDialog.tsx
  modified:
    - prisma/schema.prisma
    - prisma/migrations/migration_lock.toml
    - src/lib/money.test.ts
    - src/lib/foundation.test.ts

key-decisions:
  - "Serialized creditLimitMinor as string for client Dialog props (RSC BigInt boundary)"
  - "Briefly stopped wallet-web so host migrate deploy could unlock SQLite"

patterns-established:
  - "Account mutations: Zod → ensureSqlitePragmas → parseMajorToMinor (credit) → prisma → revalidatePath('/accounts')"
  - "Credit limit field shown only when type=FIAT_CREDIT; edit shows limit read-only"
  - "Duplicate account name maps P2002 to «Счёт с таким названием уже есть»"

requirements-completed: [ACCT-01, ACCT-02]

coverage:
  - id: D1
    description: AccountType + Account.creditLimitMinor BigInt metadata on schema
    requirement: ACCT-02
    verification:
      - kind: other
        ref: "grep enum AccountType|creditLimitMinor prisma/schema.prisma"
        status: pass
      - kind: unit
        ref: "src/lib/money.test.ts#locks BigInt money/rate fields"
        status: pass
    human_judgment: false
  - id: D2
    description: migrate deploy Account table; foundation fresh-DB sees Account + RUB
    requirement: ACCT-01
    verification:
      - kind: other
        ref: "DATABASE_URL=file:./data/wallet.db npx prisma migrate deploy"
        status: pass
      - kind: unit
        ref: "src/lib/foundation.test.ts#applies committed migration to a fresh file DB"
        status: pass
    human_judgment: false
  - id: D3
    description: Zod create requires FIAT_CREDIT limit >0; forbids limit on other types; name-only update
    requirement: ACCT-02
    verification:
      - kind: unit
        ref: "src/lib/validations/account.test.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: createAccount persists creditLimitMinor via parseMajorToMinor; updateAccountName name-only
    requirement: ACCT-01
    verification:
      - kind: other
        ref: "grep createAccount|parseMajorToMinor|updateAccountName src/app/accounts/actions.ts"
        status: pass
    human_judgment: false
  - id: D5
    description: /accounts Russian list + Dialog create with conditional credit limit; no delete
    requirement: ACCT-01
    verification:
      - kind: other
        ref: "test -f src/app/accounts/page.tsx; grep Нет счетов|Кредитный лимит AccountList|AccountFormDialog"
        status: pass
    human_judgment: true
    rationale: "Browser visual check of list/empty/conditional credit field deferred to end-of-phase UAT"

duration: 5min
completed: 2026-09-02
status: complete
---

# Phase 02 Plan 03: Accounts + Credit Limit Tracer Summary

**Account + AccountType with creditLimitMinor BigInt metadata, Zod/actions, and Russian `/accounts` create path for FIAT_CREDIT.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-09-02T20:23:37Z
- **Completed:** 2026-09-02T20:28:54Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments

- Prisma `AccountType` / `Account` with optional `creditLimitMinor` documented as metadata-only
- Migration `account_credit_limit` applied on host `file:./data/wallet.db` (wallet-web stopped briefly for lock)
- End-to-end create credit account: Dialog → Zod → `parseMajorToMinor` → persist; name-only edit; no delete/debt

## Task Commits

Each task was committed atomically:

1. **Task 1: Wave 0 account Zod + creditLimitMinor schema tests** - `e94b0f5` (test)
2. **Task 2: End-to-end create credit account with credit limit metadata** - `47f9069` (feat)
3. **Task 3: prisma migrate deploy for Account** - `109d8f2` (chore)

**Plan metadata:** `0cd1c22` (docs: complete plan)

## Files Created/Modified

- `prisma/schema.prisma` — AccountType enum + Account model + Currency.accounts relation
- `prisma/migrations/20260902202603_account_credit_limit/migration.sql` — Account table + unique name
- `src/lib/validations/account.ts` — create/update Zod with credit-limit superRefine
- `src/lib/validations/account.test.ts` — ACCT-01/02 Wave 0 coverage
- `src/lib/money.test.ts` — expects creditLimitMinor BigInt
- `src/app/accounts/actions.ts` — createAccount / updateAccountName
- `src/app/accounts/page.tsx` — force-dynamic RSC list
- `src/components/accounts/AccountList.tsx` — empty state + type/limit rows
- `src/components/accounts/AccountFormDialog.tsx` — create/edit Dialog
- `src/lib/foundation.test.ts` — Account table + account_credit_limit migration assert

## Decisions Made

- Serialized `creditLimitMinor` as string for client Dialog props — Next.js RSC cannot pass BigInt
- Briefly stopped `wallet-web` so host migrate deploy could unlock SQLite (same as Plan 01)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Serialize BigInt for RSC→client**
- **Found during:** Task 2 (AccountList → AccountFormDialog)
- **Issue:** Passing `creditLimitMinor` BigInt into client Dialog would fail Next serialization
- **Fix:** Map to string in page.tsx; parse with `BigInt(...)` for formatMinorToMajor display
- **Files modified:** `src/app/accounts/page.tsx`, AccountList/AccountFormDialog types
- **Verification:** Type-safe string props; unit tests green
- **Committed in:** `47f9069`

**2. [Rule 3 - Blocking] SQLite locked by Docker wallet-web**
- **Found during:** Task 3 (migrate deploy)
- **Issue:** `database is locked` while Compose app held `data/wallet.db`
- **Fix:** `docker compose stop web` → migrate deploy → `start web`
- **Files modified:** none (runtime DB only)
- **Verification:** `Database schema is up to date!`
- **Committed in:** `109d8f2` (documented; same pattern as 02-01)

---

**Total deviations:** 2 auto-fixed (1 Rule 2, 1 Rule 3)
**Impact on plan:** Necessary for correctness and migrate gate; no scope creep.

## Issues Encountered

SQLite lock from running `wallet-web` during host migrate deploy — resolved by brief container stop (expected; noted in sequential brief).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Account create + credit-limit metadata ready for Plan 04 immutability hardening
- Debt / NW math still deferred to Phase 3 / 5 (D-09)
- No account delete UI (D-14)

---
*Phase: 02-currencies-accounts*
*Completed: 2026-09-02*

## Self-Check: PASSED
