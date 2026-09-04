---
phase: 02-currencies-accounts
plan: 04
subsystem: ui
tags: [accounts, currencies, zod, server-actions, immutability, russian-ui, vitest]

requires:
  - phase: 02-currencies-accounts
    provides: Account schema, createAccount/updateAccountName, currencies Dialog/nav, credit-limit tracer UX
provides:
  - Four AccountType create coverage (FIAT_DEBIT, FIAT_CREDIT, CRYPTO, CASH) with null creditLimit on non-credit
  - Server Action immutability + no-removal export tests for accounts and currencies
  - Human-approved Russian UI smoke on /currencies and /accounts
affects: [Phase 03 balance snapshots, net-worth account catalog]

actuals:
  tokens: 2527
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - Name-only update FormData → prisma update data (ignore tampered identity fields)
    - Action module export surface tests assert create/update only (no delete/remove/archive)
    - SelectValue children formatter maps AccountType enum → Russian TYPE_LABELS

key-files:
  created:
    - src/app/accounts/actions.test.ts
    - src/app/currencies/actions.test.ts
  modified:
    - src/lib/validations/account.test.ts
    - src/components/accounts/AccountFormDialog.tsx

key-decisions:
  - "SelectValue uses TYPE_LABELS formatter so trigger shows Russian type labels, not enum codes"
  - "Human-verify checkpoint PASSED after Select label defect fix (user: Все окей)"

patterns-established:
  - "Immutability: update*Name actions read only name from FormData; unit tests inject extra keys"
  - "No-removal: export-name tests + UI with outline/ghost edit CTAs only"
  - "Account type Select: SelectValue children render TYPE_LABELS[value]"

requirements-completed: [CURR-01, ACCT-01, ACCT-02]

coverage:
  - id: D1
    description: Zod/create accepts all four AccountType values; non-credit omit limit for null persist
    requirement: ACCT-01
    verification:
      - kind: unit
        ref: "src/lib/validations/account.test.ts#all four types + null-limit"
        status: pass
    human_judgment: false
  - id: D2
    description: updateAccountName / updateCurrencyName name-only; no removal action exports; createCurrency forces isPrimary false
    requirement: ACCT-02
    verification:
      - kind: unit
        ref: "src/app/accounts/actions.test.ts"
        status: pass
      - kind: unit
        ref: "src/app/currencies/actions.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: Russian UI smoke — nav, empty states, create/edit Dialogs, no removal chrome on /currencies and /accounts
    requirement: CURR-01
    verification: []
    human_judgment: true
    rationale: Locale/chrome copy and absence of removal affordances require human visual judgment against UI-SPEC

duration: 35min
completed: 2026-09-02
status: complete
---

# Phase 02 Plan 04: Four-type accounts + immutability + RU UI Summary

**Four account types creatable with name-only edit locks, Server Action immutability/no-removal tests, and human-approved Russian chrome on /currencies and /accounts**

## Performance

- **Duration:** 35 min (includes human-verify gate)
- **Started:** 2026-09-02T20:29:00Z
- **Completed:** 2026-09-02T21:02:16Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Extended account Zod tests for FIAT_DEBIT, FIAT_CREDIT, CRYPTO, CASH and null creditLimit on non-credit
- Added accounts/currencies action tests proving name-only updates and create/update-only export surface
- Human approved Russian UI smoke after Select trigger showed TYPE_LABELS (not enum codes)

## Task Commits

Each task was committed atomically:

1. **Task 1: All four account types + name-only edit UX** - `d2d65cb` (test)
2. **Task 2: Immutability + no-removal action export tests** - `78c2e0c` (test)
3. **Task 3: Russian UI smoke on /currencies and /accounts** - approved (checkpoint:human-verify) — no code commit; user reply «Все окей» / approved RU UI currencies+accounts

**Defect fix (during Task 3 human-verify):** `6810bea` (fix) — SelectValue TYPE_LABELS formatter

**Plan metadata:** (docs commit after this SUMMARY)

_Note: TDD tasks may have multiple commits (test → feat → refactor)_

## Files Created/Modified
- `src/lib/validations/account.test.ts` - Four-type + null-limit create cases
- `src/app/accounts/actions.test.ts` - Name-only update, no-removal exports, non-credit null limit
- `src/app/currencies/actions.test.ts` - Name-only update, no-removal exports, isPrimary false on create
- `src/components/accounts/AccountFormDialog.tsx` - SelectValue renders Russian TYPE_LABELS in trigger

## Decisions Made
- Account type Select trigger must format via `TYPE_LABELS` (Base UI SelectValue raw value was enum code)
- Checkpoint recorded PASSED on user approval after that fix

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Select trigger showed enum code instead of Russian type label**
- **Found during:** Task 3 (Russian UI smoke human-verify)
- **Issue:** Create Dialog SelectValue rendered `CASH` / enum codes instead of «Наличные» and other TYPE_LABELS
- **Fix:** Pass children formatter to SelectValue mapping value → TYPE_LABELS
- **Files modified:** src/components/accounts/AccountFormDialog.tsx
- **Verification:** Human re-checked UI; approved («Все окей»)
- **Committed in:** 6810bea (fix(02-04): show Russian account type label in Select trigger)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Required for D-17–D-20 Russian chrome contract; no scope creep.

## Issues Encountered
- Human-verify blocked on Select trigger label until fix(02-04); resumed after approval

## Auth Gates
None

## Known Stubs
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 02 plans 01–04 complete; currency catalog + four-type accounts with immutability locks ready for balance snapshots / Phase 03
- No invented remaining work in this plan

---
*Phase: 02-currencies-accounts*
*Completed: 2026-09-02*

## Self-Check: PASSED
