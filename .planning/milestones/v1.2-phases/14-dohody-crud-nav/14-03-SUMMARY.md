---
phase: 14-dohody-crud-nav
plan: 03
subsystem: ui
tags: [income, react, dialog, DestructiveConfirmStep, vitest, person-grouped]

requires:
  - phase: 14-dohody-crud-nav
    provides: income Server Actions + Person Restrict (14-02)
  - phase: 14-dohody-crud-nav
    provides: Zod schemas + nextOpenPlannedAsOf (14-01)
provides:
  - Person-grouped /income list with mixed recurring+one-time sort by nextPlannedAsOf
  - IncomeFormDialog kind-toggle create + locked-field edit + DestructiveConfirm delete
  - Person delete from income list via DestructiveConfirmStep (debts+income Restrict)
  - income-ui.test.ts file-scan (no native confirm)
affects:
  - Phase 15 actual/overdue chrome on same list
  - Phase 16 person income stats

actuals:
  tokens: 9019
  tasks: 3
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Income page maps recurring→nextOpenPlannedAsOf / one-time→plannedAsOf as nextPlannedAsOf; sort asc in person group (D-02)"
    - "IncomeFormDialog create defaults kind=recurring + currency=primaryCurrencyCode (D-08) — not currencies[0]"
    - "Edit via «Изменить» only; deletes use DestructiveConfirmStep (UI-01)"

key-files:
  created:
    - src/components/income/IncomeList.tsx
    - src/components/income/IncomeFormDialog.tsx
    - src/components/income/income-ui.test.ts
  modified:
    - src/app/income/page.tsx

key-decisions:
  - "create/update dispatch by hidden kind field to six Plan-02 actions (no new server wrappers)"
  - "Task 3 polish: UI-SPEC copy already met after Task 2; full npm test green with no extra code delta"

patterns-established:
  - "Income UI clones DebtsList/DebtFormDialog without detail dialog, closed section, or totals hero"
  - "File-scan income-ui.test.ts guards DestructiveConfirmStep + bans window.confirm"

requirements-completed: [SRC-01, SRC-02, UI-01]

coverage:
  - id: D1
    description: Person-grouped list with empty-group CTA defaultPersonId + header dual CTAs
    requirement: UI-01
    verification:
      - kind: unit
        ref: src/components/income/income-ui.test.ts
        status: pass
      - kind: other
        ref: grep IncomeList/Новый доход/defaultPersonId on page+list
        status: pass
    human_judgment: false
  - id: D2
    description: Create dialog kind toggle defaults recurring; currency initializes to primaryCurrencyCode
    requirement: SRC-01
    verification:
      - kind: other
        ref: IncomeFormDialog primaryCurrencyCode init + kind state recurring
        status: pass
    human_judgment: false
  - id: D3
    description: Edit/delete income + person delete use DestructiveConfirmStep; no native confirm
    requirement: UI-01
    verification:
      - kind: unit
        ref: src/components/income/income-ui.test.ts#income UI destructive confirm
        status: pass
    human_judgment: false
  - id: D4
    description: D-02 nextPlannedAsOf mapping + mixed sort; full suite green
    requirement: SRC-02
    verification:
      - kind: other
        ref: npm test (333 passed)
        status: pass
    human_judgment: false

duration: 5min
completed: 2026-09-07
status: complete
---

# Phase 14 Plan 03: Доходы CRUD UI Summary

**Person-grouped /income CRUD with kind-toggle dialog, primary-currency create defaults, and DestructiveConfirmStep deletes (no window.confirm).**

## Performance

- **Duration:** 5min
- **Started:** 2026-09-07T13:06:03Z
- **Completed:** 2026-09-07T13:11:20Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Wired `/income` RSC load: people + recurring/one-time (+ recurring actuals) → `nextPlannedAsOf` (D-02) → `IncomeList`
- `IncomeFormDialog`: create kind toggle + primary currency; edit locks person/currency/kind; source delete confirm
- Person delete from income groups with UI-SPEC blocked copy; `income-ui.test.ts` file-scan; `npm test` 333 green

## Task Commits

1. **Task 1: End-to-end create recurring via dialog on Person-grouped list** - `2926d81` (feat)
2. **Task 2: Edit/delete income + person delete via DestructiveConfirmStep** - `45d3674` (feat)
3. **Task 3: UI-SPEC empty/error polish + full suite gate** - verification only (no code delta; suite already green)

**Plan metadata:** `ba58774` (docs: complete plan)

## Files Created/Modified

- `src/app/income/page.tsx` — load + nextPlannedAsOf map/sort + header CTAs + honesty
- `src/components/income/IncomeList.tsx` — Person groups, empty CTAs, «Изменить», person delete confirm
- `src/components/income/IncomeFormDialog.tsx` — kind-toggle create/edit + DestructiveConfirm delete
- `src/components/income/income-ui.test.ts` — DestructiveConfirm present; native confirm absent

## Decisions Made

- Dispatch create/update to Plan-02 named actions via client `kind` hidden field (six exports stay)
- Task 3: no further copy edits — UI-SPEC strings already in place after Task 2

## Deviations from Plan

None - plan executed as written (Task 3 had no additional file changes after Task 2 polish).

## Auth Gates

None.

## Known Stubs

None.

## Threat Flags

None — no new network/auth surfaces beyond Plan-02 actions already threat-modeled.

## Self-Check: PASSED

- FOUND: src/components/income/IncomeList.tsx
- FOUND: src/components/income/IncomeFormDialog.tsx
- FOUND: src/components/income/income-ui.test.ts
- FOUND: src/app/income/page.tsx
- FOUND: 2926d81
- FOUND: 45d3674
