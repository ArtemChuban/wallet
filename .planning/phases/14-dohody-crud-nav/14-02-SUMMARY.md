---
phase: 14-dohody-crud-nav
plan: 02
subsystem: api
tags: [income, server-actions, prisma, person-restrict, vitest, isolation]

requires:
  - phase: 14-dohody-crud-nav
    provides: Zod income schemas + /income shell (14-01)
  - phase: 13-income-schema-domain-math
    provides: RecurringIncome/OneTimeIncome models + assertOneTimePlanImmutable
provides:
  - create/update/delete Server Actions for recurring + one-time income
  - Isolation file-scan (no BalanceSnapshot / net-worth / historical-series)
  - deletePerson Restrict on debts OR income + dual revalidatePath(/debts|/income)
  - DebtsList client pre-check with incomeCount
affects:
  - 14-03 IncomeList / IncomeFormDialog wiring
  - Phase 15 actual recording UX

actuals:
  tokens: 9473
  tasks: 3
  commits: 5

tech-stack:
  added: []
  patterns:
    - "Income actions mirror debts: Zod branch personId vs WithNewPerson + revalidatePath feature route only"
    - "assertOneTimePlanImmutable gate on one-time update when actuals exist"
    - "Person mutations dual-revalidate /debts + /income (D-16)"

key-files:
  created:
    - src/app/income/actions.ts
    - src/app/income/actions.test.ts
  modified:
    - src/app/debts/actions.ts
    - src/app/debts/actions.test.ts
    - src/components/debts/DebtsList.tsx
    - src/app/debts/page.tsx

key-decisions:
  - "Six explicit CRUD entry points (create×2, update×2, delete×2) — not kind-dispatched wrappers"
  - "deletePerson counts debt + recurringIncome + oneTimeIncome before delete; UI-SPEC blocked copy"
  - "Debts page passes incomeCount via Person._count for DebtsList pre-check"

patterns-established:
  - "Income Server Actions: BigInt minors via parseMajorToMinor + currency.scale; never BalanceSnapshot"
  - "Person Restrict spans domains with dual revalidatePath"

requirements-completed: [SRC-01, SRC-02, UI-01]

coverage:
  - id: D1
    description: createRecurringIncome persists definition and revalidates /income only
    requirement: SRC-01
    verification:
      - kind: unit
        ref: src/app/income/actions.test.ts#createRecurringIncome (SRC-01 tracer)
        status: pass
    human_judgment: false
  - id: D2
    description: createOneTimeIncome persists plannedAsOf + optional note; identical creates insert twice
    requirement: SRC-02
    verification:
      - kind: unit
        ref: src/app/income/actions.test.ts#createOneTimeIncome (SRC-02)
        status: pass
    human_judgment: false
  - id: D3
    description: updateOneTimeIncome calls assertOneTimePlanImmutable when actual exists
    requirement: SRC-02
    verification:
      - kind: unit
        ref: src/app/income/actions.test.ts#updateOneTimeIncome
        status: pass
    human_judgment: false
  - id: D4
    description: Isolation scan bans BalanceSnapshot and net-worth/historical-series imports
    requirement: UI-01
    verification:
      - kind: unit
        ref: src/app/income/actions.test.ts#income actions isolation (UI-01)
        status: pass
    human_judgment: false
  - id: D5
    description: deletePerson blocks on income-only refs; dual revalidate on Person CRUD
    requirement: UI-01
    verification:
      - kind: unit
        ref: src/app/debts/actions.test.ts#deletePerson (PERSON-02 / D-16)
        status: pass
    human_judgment: false

duration: 5min
completed: 2026-09-07
status: complete
---

# Phase 14 Plan 02: Income CRUD actions + Person Restrict Summary

**Income Server Actions (recurring + one-time CRUD) with isolation scan; Person Restrict spans debts/income with dual revalidate.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-09-07T12:57:33Z
- **Completed:** 2026-09-07T13:02:52Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Tracer `createRecurringIncome` + isolation file-scan scaffold
- Full six CRUD entry points; `assertOneTimePlanImmutable` on one-time plan edit when actual exists
- `deletePerson` blocks on income refs; create/rename/delete Person dual-revalidate `/debts` + `/income`; DebtsList pre-check updated

## Task Commits

1. **Task 1: createRecurringIncome tracer + isolation scan** - `5ce2602` (feat)
2. **Task 2 RED: failing income CRUD tests** - `b19dfd9` (test)
3. **Task 2 GREEN: one-time + update/delete actions** - `0df979f` (feat)
4. **Task 3 RED: Person Restrict failing tests** - `3082bca` (test)
5. **Task 3 GREEN: Restrict + dual revalidate + DebtsList** - `b96a320` (feat)

**Plan metadata:** `cc61bd1` (docs: complete plan)

## Files Created/Modified

- `src/app/income/actions.ts` — create/update/delete recurring + one-time Server Actions
- `src/app/income/actions.test.ts` — Zod paths, immutability, deletes, isolation scan
- `src/app/debts/actions.ts` — income counts in deletePerson; dual revalidate on Person CRUD
- `src/app/debts/actions.test.ts` — income-only block + dual revalidate asserts
- `src/components/debts/DebtsList.tsx` — `incomeCount` pre-check + UI-SPEC blocked copy
- `src/app/debts/page.tsx` — `_count` recurring/oneTime incomes → `incomeCount`

## Decisions Made

- Six named exports (not kind dispatch) for clear FormAction wiring in Plan 03
- Immutable one-time failure returns Russian message (no Prisma write / no revalidate)
- Client DebtsList pre-check is UX-only; server recount remains source of truth

## Deviations from Plan

None - plan executed exactly as written.

## Threat Flags

None beyond plan `<threat_model>` (T-14-01/03/05/06 mitigated in this plan).

## Known Stubs

None.

## Self-Check: PASSED
