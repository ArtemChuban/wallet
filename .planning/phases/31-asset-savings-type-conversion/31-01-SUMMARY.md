---
phase: 31-asset-savings-type-conversion
plan: 01
subsystem: api
tags: [zod, prisma, updateAccount, ASSET, SAVINGS, ACCT-04, vitest]

requires:
  - phase: 27-savings-schema-crud
    provides: updateAccount + updateAccountSchema + SAVINGS rate/DOM CHECK
provides:
  - Optional updateAccountSchema type ASSET|SAVINGS
  - updateAccount ASSET↔SAVINGS transition matrix with Prisma null-clear
  - Vitest conversion matrix + never-calls BalanceSnapshot
affects:
  - 31-02 AccountFormDialog edit unlock

actuals:
  tokens: 3896
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "effectiveType = requested ?? dbType after findUnique"
    - "SAVINGS→ASSET explicit annualRateBps/accrualDayOfMonth null in same update"

key-files:
  created: []
  modified:
    - src/lib/validations/account.ts
    - src/lib/validations/account.test.ts
    - src/app/accounts/actions.ts
    - src/app/accounts/actions.test.ts

key-decisions:
  - "Optional Zod type enum ASSET|SAVINGS only; FIAT_CREDIT/legacy rejected at schema"
  - "Forbidden non-peer transitions return generic Russian save failure (no type detail)"
  - "Same-type SAVINGS update omits type field; convert paths set type explicitly"

patterns-established:
  - "Pattern: convertiblePair gate before write; CHECK-safe null clear on leave SAVINGS"
  - "Pattern: D-16 never-calls BalanceSnapshot on both conversion directions"

requirements-completed: []  # ACCT-04 shared with 31-02 UI — leave Pending until phase complete

coverage:
  - id: D1
    description: "ASSET→SAVINGS updateAccount persists type SAVINGS + bps + DOM; currency ignored"
    requirement: ACCT-04
    verification:
      - kind: unit
        ref: src/app/accounts/actions.test.ts#ASSET→SAVINGS persists type SAVINGS
        status: pass
    human_judgment: false
  - id: D2
    description: "SAVINGS→ASSET clears annualRateBps and accrualDayOfMonth to null in one update"
    requirement: ACCT-04
    verification:
      - kind: unit
        ref: src/app/accounts/actions.test.ts#SAVINGS→ASSET persists type ASSET
        status: pass
    human_judgment: false
  - id: D3
    description: "Forbidden transitions and forged FIAT_CREDIT reject without account.update"
    requirement: ACCT-04
    verification:
      - kind: unit
        ref: src/app/accounts/actions.test.ts#FIAT_CREDIT / legacy dbType
        status: pass
    human_judgment: false
  - id: D4
    description: "Conversion never calls BalanceSnapshot upsert/delete"
    requirement: ACCT-04
    verification:
      - kind: unit
        ref: src/app/accounts/actions.test.ts#never calls BalanceSnapshot
        status: pass
    human_judgment: false
  - id: D5
    description: "updateAccountSchema accepts optional ASSET|SAVINGS and rejects non-peer types"
    requirement: ACCT-04
    verification:
      - kind: unit
        ref: src/lib/validations/account.test.ts#optional type
        status: pass
    human_judgment: false

duration: 5min
completed: 2026-09-22
status: complete
---

# Phase 31 Plan 01: Zod + updateAccount conversion matrix Summary

**Optional update `type` ASSET|SAVINGS + server transition matrix with Prisma null-clear and Vitest never-calls BalanceSnapshot (ACCT-04 server half).**

## Performance

- **Duration:** 5min
- **Tasks:** 3/3
- **Commits:** 4

## Accomplishments

- Extended `updateAccountSchema` with optional `type: ASSET|SAVINGS`
- `updateAccount` computes `effectiveType` after `findUnique`; ASSET↔SAVINGS only; generic reject otherwise
- SAVINGS→ASSET writes `type ASSET` + explicit `annualRateBps: null` + `accrualDayOfMonth: null`
- Vitest locks both directions, D-12 Russian missing-field errors, D-16 never-calls, Phase 27 peer forge rewritten

## Task Commits

| Task | Name | Commit | Type |
|------|------|--------|------|
| 1 | End-to-end ASSET→SAVINGS (RED) | c9f39b6 | test |
| 1 | End-to-end ASSET→SAVINGS (GREEN) | f504ed1 | feat |
| 2 | SAVINGS→ASSET + forbidden matrix | 513fafb | test |
| 3 | Zod optional type unit locks | 1f10844 | test |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ASSET name-only forge no longer sends invalid type through Zod**
- **Found during:** Task 1 GREEN
- **Issue:** Prior immutability test set `type=CRYPTO`; optional Zod enum rejects it before action
- **Fix:** Drop invalid type from FormData; keep currency/limit forge (D-03)
- **Files modified:** `src/app/accounts/actions.test.ts`
- **Commit:** f504ed1

**2. [Rule 3 - Blocking] Phase 27 SAVINGS forge `type=ASSET` rewritten early**
- **Found during:** Task 1 RED
- **Issue:** Peer `type=ASSET` on SAVINGS becomes conversion once schema accepts type
- **Fix:** Same-type SAVINGS case drops `type=ASSET`; conversion assert lives in ACCT-04 suite
- **Files modified:** `src/app/accounts/actions.test.ts`
- **Commit:** c9f39b6

**3. [Rule 2 - Critical] Full matrix landed in tracer GREEN**
- **Found during:** Task 1
- **Issue:** SAVINGS→ASSET + forbidden gate needed so peer FormData cannot leave CHECK-unsafe state
- **Fix:** Implemented both directions + convertiblePair reject in same feat as ASSET→SAVINGS
- **Files modified:** `src/app/accounts/actions.ts`
- **Commit:** f504ed1

**4. [Rule 2 - Critical] ACCT-04 not marked Complete after 31-01 alone**
- **Found during:** State update
- **Issue:** Requirement frontmatter lists ACCT-04 but UI unlock is Plan 02
- **Fix:** Keep REQUIREMENTS ACCT-04 Pending until 31-02
- **Files modified:** `.planning/REQUIREMENTS.md`
- **Commit:** docs commit

## TDD Gate Compliance

- RED: `c9f39b6` (failing ASSET→SAVINGS assert)
- GREEN: `f504ed1` (schema + action)
- Task 2/3 tests green against already-shipped matrix (no extra feat commits)

## Threat Flags

None — surfaces match plan threat model (FormData type gate, null clear, no snapshot writes, currency ignore).

## Self-Check: PASSED

- FOUND: `src/lib/validations/account.ts` (optional type)
- FOUND: `src/app/accounts/actions.ts` (transition matrix)
- FOUND: commits c9f39b6, f504ed1, 513fafb, 1f10844
- FOUND: vitest 77 passed on account.test.ts + actions.test.ts
