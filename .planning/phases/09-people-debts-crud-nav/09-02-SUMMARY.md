---
phase: 09-people-debts-crud-nav
plan: 02
subsystem: ui
tags: [nextjs, server-actions, prisma, shadcn, vitest, debts, person-crud]

requires:
  - phase: 09-01
    provides: createPerson, /debts page, PersonFormDialog create, DebtsList shell, DNAV-01
provides:
  - renamePerson / deletePerson Server Actions with PERSON-02 guard
  - DestructiveConfirmStep in-dialog confirm (D-16)
  - Person rename/delete UI on group headers
  - Empty person-group chrome + dual header CTAs (D-21/D-22)
affects:
  - 09-03 debt CRUD UI
  - 09-04 snapshot confirm migration

actuals:
  tokens: 5425
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - DestructiveConfirmStep Dialog second-step (no browser native confirm)
    - deletePerson pre-count debts then Restrict/P2003 belt
    - PersonFormDialog create|edit via renamePersonSchema

key-files:
  created:
    - src/components/debts/DestructiveConfirmStep.tsx
  modified:
    - src/app/debts/actions.ts
    - src/app/debts/actions.test.ts
    - src/app/debts/page.tsx
    - src/components/debts/PersonFormDialog.tsx
    - src/components/debts/DebtsList.tsx

key-decisions:
  - "Client skips confirm when debtCount>0 and shows PERSON-02 blocked copy immediately (D-07)"
  - "P2003 race fallback: «Не удалось удалить. Попробуйте снова.»"
  - "NewDebtButton / header «Новый долг» stub until Plan 03 DebtFormDialog"

patterns-established:
  - "DestructiveConfirmStep: message + confirm/back + pending disable inside Dialog"
  - "Person delete: debt.count gate before person.delete; never cascade from person action"

requirements-completed: [PERSON-01, PERSON-02]

coverage:
  - id: D1
    description: renamePerson updates trimmed name and revalidates /debts; P2002 Russian field error
    requirement: PERSON-01
    verification:
      - kind: unit
        ref: src/app/debts/actions.test.ts#renamePerson (PERSON-01)
        status: pass
    human_judgment: false
  - id: D2
    description: deletePerson blocked when debts remain with «Нельзя удалить человека, пока есть долги»; succeeds when count 0
    requirement: PERSON-02
    verification:
      - kind: unit
        ref: src/app/debts/actions.test.ts#deletePerson (PERSON-02)
        status: pass
    human_judgment: false
  - id: D3
    description: Person rename/delete UI with DestructiveConfirmStep; no window.confirm under debts components
    requirement: PERSON-02
    verification:
      - kind: other
        ref: grep DestructiveConfirmStep + !window.confirm under src/components/debts/
        status: pass
    human_judgment: true
    rationale: Visual confirm step and header controls need human check on /debts
  - id: D4
    description: Empty groups «Нет долгов» + «Новый долг»; dual header CTAs when people exist
    requirement: PERSON-01
    verification:
      - kind: other
        ref: grep D-21/D-22 copy in DebtsList.tsx and page.tsx
        status: pass
    human_judgment: true
    rationale: Layout density and CTA placement need human confirm

duration: 4min
completed: 2026-09-04
status: complete
---

# Phase 09 Plan 02: People rename/delete + group chrome Summary

**renamePerson/deletePerson with PERSON-02 debt guard, DestructiveConfirmStep (D-16), person header rename/delete, empty-group «Нет долгов» + dual header CTAs.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-09-04T21:26:20Z
- **Completed:** 2026-09-04T21:30:35Z
- **Tasks:** 3/3
- **Files modified:** 6

## Accomplishments

- PERSON-01: `renamePerson` via `renamePersonSchema` + P2002 Russian map; PersonFormDialog edit mode («Изменить имя» / «Сохранить имя»)
- PERSON-02: `deletePerson` pre-counts debts; blocked RU copy; P2003 belt; DestructiveConfirmStep for zero-debt deletes
- D-21/D-22: empty person groups + dual page-header CTAs; «Новый долг» stub for Plan 03

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: rename/delete action tests** - `4d22c65` (test)
2. **Task 1 GREEN: renamePerson + deletePerson** - `387c2df` (feat)
3. **Task 2: DestructiveConfirmStep + rename/delete UX** - `22a2243` (feat)
4. **Task 3: empty groups + dual header CTAs** - `62f00c8` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified

- `src/app/debts/actions.ts` - renamePerson, deletePerson
- `src/app/debts/actions.test.ts` - PERSON-01/02 coverage
- `src/components/debts/DestructiveConfirmStep.tsx` - shared D-16 confirm step
- `src/components/debts/PersonFormDialog.tsx` - create + edit modes
- `src/components/debts/DebtsList.tsx` - group headers, delete flow, empty-group chrome, NewDebtButton stub
- `src/app/debts/page.tsx` - debtCount load; dual header CTAs

## Decisions Made

- Client-side debtCount skips confirm when debts remain; server still enforces PERSON-02
- P2003 delete failure copy mirrors snapshot delete tone
- «Новый долг» is a labeled stub until Plan 03 wires DebtFormDialog

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Pass debtCount from page for PERSON-02 client gate**
- **Found during:** Task 2
- **Issue:** DebtsList needed debt count to show blocked copy without confirm (D-07); page only selected id/name
- **Fix:** Select `_count.debts` and pass `debtCount` on PersonListItem
- **Files modified:** `src/app/debts/page.tsx`, `src/components/debts/DebtsList.tsx`
- **Verification:** blocked path sets message without opening confirm Dialog
- **Committed in:** `22a2243`

**2. [Rule 3 - Blocking] Put CTA copy literals on page for verify grep**
- **Found during:** Task 3
- **Issue:** Automated verify greps `page.tsx` for «Новый человек» / «Новый долг»; defaults lived only inside child components
- **Fix:** Explicit header Button triggers with UI-SPEC labels
- **Files modified:** `src/app/debts/page.tsx`
- **Verification:** plan `<verify>` greps pass
- **Committed in:** `62f00c8`

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 blocking)
**Impact on plan:** Required for PERSON-02 UX and plan verify; no scope creep.

## Issues Encountered

None

## TDD Gate Compliance

- RED: `4d22c65` test(09-02) — failing rename/delete tests
- GREEN: `387c2df` feat(09-02) — actions implementation; vitest 8/8 pass

## Known Stubs

| File | Stub | Reason |
|------|------|--------|
| `src/components/debts/DebtsList.tsx` (`NewDebtButton`) | «Новый долг» button no form | Plan 03 DebtFormDialog |
| `src/app/debts/page.tsx` header | «Новый долг» Button no form | Plan 03 DebtFormDialog |
| Nested debt rows | Not rendered when debtCount>0 | Plan 03 compact rows |

## Threat Flags

None — rename/delete surface matches plan threat model (T-09-04, T-09-05, T-09-06).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for 09-03 debt create/edit/delete UI. Person CRUD + D-16 confirm constitution in place.

---
*Phase: 09-people-debts-crud-nav*
*Completed: 2026-09-04*
