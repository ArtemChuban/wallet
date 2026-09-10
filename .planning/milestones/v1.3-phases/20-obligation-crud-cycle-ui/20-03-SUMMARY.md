---
phase: 20-obligation-crud-cycle-ui
plan: 03
subsystem: ui
tags: [credit-grace, overdue, UX-01, vitest, OBL-03, CYCLE-02]

requires:
  - phase: 20-obligation-crud-cycle-ui
    provides: CRUD shell, close/reopen, hybrid list, amount dialog disclaimer stub
provides:
  - OBL-03 overdue chrome (dialog row + Грейс chip only)
  - D-08 OPEN sort via mergeGraceListRows
  - UX-01 Задолженность LOCF label + clear-schedule UI (D-14)
  - Full credit-grace-ui source-scan green
affects:
  - Phase 21 A′ NW-neutral forecast (Капитал)

actuals:
  tokens: 3860
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - isGraceOverdue → bg-warning/15 row + interest hint (IncomeList tone)
    - просрочено chip on Грейс button only (never account name/LOCF)
    - clear schedule = second form empty DOM → updateGraceSchedule

key-files:
  created: []
  modified:
    - src/lib/credit-grace.ts
    - src/lib/credit-grace.test.ts
    - src/components/accounts/CreditGraceDialog.tsx
    - src/components/accounts/AccountList.tsx
    - src/components/accounts/credit-grace-ui.test.ts

key-decisions:
  - "D-08 sort lives in mergeGraceListRows (all OPEN then CTAs) not only UI"
  - "Clear schedule remounts dialog body via formKey so empty-schedule hint returns"
  - "UI-SPEC clear-blocked copy shown when OPEN>0; server gate unchanged"

patterns-established:
  - "Overdue mark: button chip only — LocfDisplay stays muted foreground"
  - "Clear schedule: disabled control + role=status hint when OPEN remain"

requirements-completed: [OBL-03, UX-01, CYCLE-02]

coverage:
  - id: D1
    description: OPEN overdue warning chrome + interest hint in grace dialog; просрочено on Грейс only
    requirement: OBL-03
    verification:
      - kind: unit
        ref: src/components/accounts/credit-grace-ui.test.ts#plan-03 overdue chrome
        status: pass
      - kind: unit
        ref: src/lib/credit-grace.test.ts#isGraceOverdue
        status: pass
    human_judgment: false
  - id: D2
    description: OPEN sort overdue-first + gap-day orphan OPEN retained with next CTA
    requirement: CYCLE-02
    verification:
      - kind: unit
        ref: src/lib/credit-grace.test.ts#mergeGraceListRows
        status: pass
    human_judgment: false
  - id: D3
    description: Задолженность LOCF label; amount disclaimer; clear schedule gated; no DOM 21/15 autofill
    requirement: UX-01
    verification:
      - kind: unit
        ref: src/components/accounts/credit-grace-ui.test.ts#plan-03 UX-01 + clear schedule
        status: pass
    human_judgment: false

duration: 5min
completed: 2026-09-09
status: complete
---

# Phase 20 Plan 03: Overdue chrome + UX-01 + clear schedule Summary

**OBL-03 warning chrome on grace rows + Грейс chip, UX-01 Задолженность/disclaimer, D-14 clear-schedule — full Wave 0 UI scan green.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-09-09T12:37:33Z
- **Completed:** 2026-09-09T12:42:04Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Overdue OPEN rows use `bg-warning/15` + interest hint; AccountList shows «просрочено» on Грейс only
- `mergeGraceListRows` sorts OPEN overdue-first (D-08); gap-day orphans still listed with next CTA
- LOCF label «Задолженность»; «Очистить расписание» when OPEN=0; plan-03 source-scan fully green

## Task Commits

1. **Task 1 (RED):** overdue chrome asserts — `bbf3874` (test)
2. **Task 1 (GREEN):** overdue chrome + OPEN sort — `d79ab18` (feat)
3. **Task 2:** UX-01 + clear schedule — `0f9c7ca` (feat)

## Files Created/Modified

- `src/lib/credit-grace.ts` — D-08 compareOpenByDue + merge rewrite (OPEN then CTAs)
- `src/lib/credit-grace.test.ts` — D-08 sort case
- `src/components/accounts/CreditGraceDialog.tsx` — overdue row chrome + clear-schedule form
- `src/components/accounts/AccountList.tsx` — просрочено chip + Задолженность
- `src/components/accounts/credit-grace-ui.test.ts` — full plan-03 unskip

## Decisions Made

- Sort in domain merge (today already param) so gap-day + multi-OPEN stay consistent
- Remount body after schedule save/clear so empty hint + cleared fields match props
- Keep server clear-with-OPEN message as-is; UI shows UI-SPEC blocked copy when disabled

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] D-08 sort in mergeGraceListRows**
- **Found during:** Task 1
- **Issue:** Plan `files_modified` omitted `credit-grace.ts`; orphan-only due sort did not overdue-rank vs candidate OPEN
- **Fix:** All OPEN sorted via `isGraceOverdue` then dueAsOf/cycleStart; CTAs appended for empty candidates
- **Files modified:** `src/lib/credit-grace.ts`, `src/lib/credit-grace.test.ts`
- **Commit:** `d79ab18`

## Known Stubs

None — `placeholder=""` on DOM inputs is intentional empty (D-15), not stub data.

## Self-Check: PASSED

- FOUND: src/components/accounts/CreditGraceDialog.tsx
- FOUND: src/components/accounts/AccountList.tsx
- FOUND: src/components/accounts/credit-grace-ui.test.ts
- FOUND: src/lib/credit-grace.ts
- FOUND commits: bbf3874, d79ab18, 0f9c7ca
