---
phase: 09-people-debts-crud-nav
plan: 03
subsystem: ui
tags: [debts, prisma, zod, server-actions, dialog, remainingMinor]

requires:
  - phase: 09-people-debts-crud-nav
    provides: People CRUD, DestructiveConfirmStep, stub Новый долг CTAs
  - phase: 08-debts-schema-domain-math
    provides: Debt schema, remainingMinor, createDebtSchema, updateDebtMetaSchema
provides:
  - createDebt with existing-person and D-06 nested new-person paths
  - updateDebtMeta (meta-only) and cascade deleteDebt
  - DebtFormDialog create/edit with locked fields and in-dialog delete
  - Compact debt rows with server remainingMinor
affects:
  - 09-04 (nav / snapshot confirm migration)
  - 10 (repayments UI on working debt list)

actuals:
  tokens: 15364
  tasks: 3
  commits: 5

tech-stack:
  added: []
  patterns:
    - Debt create branches on personId vs name; nested person.create with debts.create for D-06
    - updateDebtMetaSchema.strict + selective FormData read ignores smuggled initial/person/currency
    - DebtFormDialog formKey remount + DestructiveConfirmStep for cascade delete

key-files:
  created:
    - src/components/debts/DebtFormDialog.tsx
  modified:
    - src/app/debts/actions.ts
    - src/app/debts/actions.test.ts
    - src/app/debts/page.tsx
    - src/components/debts/DebtsList.tsx
    - src/lib/validations/debts.ts
    - src/lib/validations/debts.test.ts

key-decisions:
  - "Exported createDebtWithNewPersonSchema for compound D-06 validation and tests"
  - "Single createDebt action branches on personId presence vs new-person name field"
  - "Person mode toggle (Существующий / Новый человек) inside debt create dialog"

patterns-established:
  - "Compound person+debt: one submit, nested Prisma write, no orphan person"
  - "Debt delete only inside edit dialog with cascade copy (D-14/D-15)"
  - "Compact rows: direction label + formatMinorToMajor(remaining) + currency code"

requirements-completed: [DEBT-01]

coverage:
  - id: D1
    description: createDebt existing-person path parses majors via parseMajorToMinor and revalidates /debts
    requirement: DEBT-01
    verification:
      - kind: unit
        ref: src/app/debts/actions.test.ts#creates debt for existing person with parsed minors and revalidates /debts
        status: pass
    human_judgment: false
  - id: D2
    description: Compound new-person+debt create in one nested write (D-06)
    requirement: DEBT-01
    verification:
      - kind: unit
        ref: src/app/debts/actions.test.ts#creates person + debt atomically via nested write (D-06)
        status: pass
    human_judgment: false
  - id: D3
    description: Non-positive initial amount rejected with Russian validation
    requirement: DEBT-01
    verification:
      - kind: unit
        ref: src/app/debts/actions.test.ts#rejects non-positive initial amount with Russian validation
        status: pass
    human_judgment: false
  - id: D4
    description: updateDebtMeta ignores smuggled initial/person/currency FormData
    requirement: DEBT-01
    verification:
      - kind: unit
        ref: src/app/debts/actions.test.ts#writes only direction/dueDate/note — ignores smuggled initial/person/currency
        status: pass
    human_judgment: false
  - id: D5
    description: deleteDebt cascades via FK and revalidates /debts
    requirement: DEBT-01
    verification:
      - kind: unit
        ref: src/app/debts/actions.test.ts#deletes debt by id and revalidates /debts
        status: pass
    human_judgment: false
  - id: D6
    description: DebtFormDialog create/edit/delete UX with remaining rows and cascade confirm
    requirement: DEBT-01
    verification:
      - kind: other
        ref: grep remainingMinor/Я должен/cascade copy + vitest actions+debts.test.ts
        status: pass
    human_judgment: true
    rationale: Full dialog UX and compact-row chrome need visual/human confirmation beyond unit tests

duration: 7min
completed: 2026-09-04
status: complete
---

# Phase 09 Plan 03: Debt CRUD Summary

**DEBT-01 create/edit/delete on `/debts`: compound person+debt create, meta-only edit with locked fields, compact remainingMinor rows, cascade delete confirm inside edit dialog.**

## Performance

- **Duration:** 7 min
- **Started:** 2026-09-04T21:34:39Z
- **Completed:** 2026-09-04T21:41:00Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- `createDebt` supports existing `personId` and D-06 nested new-person+debt in one submit
- `updateDebtMeta` / `deleteDebt` enforce locked principal and cascade delete
- `DebtFormDialog` + compact rows wire full DEBT-01 UI without repayments chrome

## Task Commits

Each task was committed atomically:

1. **Task 1: Debt create actions** - `64256f8` (test) → `a85acec` (feat)
2. **Task 2: updateDebtMeta + deleteDebt** - `91b76a3` (test) → `6690389` (feat)
3. **Task 3: DebtFormDialog + remaining rows** - `8ae6b97` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified
- `src/components/debts/DebtFormDialog.tsx` - create/edit dialog, locked fields, cascade delete step
- `src/app/debts/actions.ts` - createDebt, updateDebtMeta, deleteDebt
- `src/app/debts/actions.test.ts` - create/update/delete + smuggle coverage
- `src/app/debts/page.tsx` - load events, remainingMinor, header DebtFormDialog CTA
- `src/components/debts/DebtsList.tsx` - compact rows, wired create/edit dialogs
- `src/lib/validations/debts.ts` - createDebtWithNewPersonSchema
- `src/lib/validations/debts.test.ts` - compound schema cases

## Decisions Made
- Exported thin `createDebtWithNewPersonSchema` rather than action-local-only Zod (tests need named export)
- Single `createDebt` action branches on `personId` presence vs `name` for compound path
- Create dialog person mode toggle: «Существующий» / «Новый человек»

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- DEBT-01 CRUD ready for Phase 10 repayments UI
- Plan 09-04 still owns nav order + balance-snapshot confirm migration

## Known Stubs
None - NewDebtButton stub replaced by DebtFormDialog.

## Self-Check: PASSED

- FOUND: src/components/debts/DebtFormDialog.tsx
- FOUND: src/app/debts/actions.ts (createDebt, updateDebtMeta, deleteDebt)
- FOUND: commits 64256f8, a85acec, 91b76a3, 6690389, 8ae6b97

---
*Phase: 09-people-debts-crud-nav*
*Completed: 2026-09-04*
