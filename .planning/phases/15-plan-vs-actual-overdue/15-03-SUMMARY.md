---
phase: 15-plan-vs-actual-overdue
plan: 03
subsystem: ui
tags: [income, overdue, variance, dialog, warning-tokens, vitest, react]

requires:
  - phase: 15-plan-vs-actual-overdue
    provides: actual upsert/delete actions + IncomeRow hasActual/overdue/actual* props
  - phase: 14-dohody-crud-nav
    provides: IncomeList / IncomeFormDialog shell + DestructiveConfirmStep patterns
provides:
  - IncomeFactDialog create/edit/delete with live Отклонение
  - Overdue «заполни» warning chip + Заполни / Внести факт / Изменить факт CTAs
  - One-time filled получено + inline Δ chrome
  - --warning / --warning-foreground theme tokens
affects:
  - phase-verify / UAT for ACT-02 ACT-03
  - Phase 16 stats (may reuse variance helpers)

actuals:
  tokens: 5653
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - "Warning chrome via CSS vars + span chip (no Badge package)"
    - "Dedicated IncomeFactDialog separate from definition IncomeFormDialog"
    - "Live Δ via parseMajorToMinor + incomeVarianceMinor while typing"

key-files:
  created:
    - src/components/income/IncomeFactDialog.tsx
  modified:
    - src/app/globals.css
    - src/components/income/IncomeList.tsx
    - src/components/income/IncomeFormDialog.tsx
    - src/app/income/page.tsx
    - src/components/income/income-ui.test.ts

key-decisions:
  - "Derive dialog mode/labels from income.hasActual + overdue (no separate mode prop)"
  - "actualNote plumbed on IncomeRow for edit prefill (gap from Plan 02 join)"
  - "One-time variance only when hasActual; recurring list stays next-open only (D-07)"

patterns-established:
  - "Fact dialog: RO plan fields + actualAmountMajor/actualAsOf/note + live Отклонение"
  - "Overdue chip: bg-warning/15 text-warning-foreground — never destructive"

requirements-completed: [ACT-02, ACT-03]

coverage:
  - id: D1
    description: Warning tokens + IncomeFactDialog with Moscow today default, live Δ, DestructiveConfirmStep delete
    requirement: ACT-02
    verification:
      - kind: other
        ref: "grep IncomeFactDialog DestructiveConfirmStep calendarDateToday --warning"
        status: pass
      - kind: unit
        ref: src/components/income/income-ui.test.ts#IncomeFactDialog uses DestructiveConfirmStep
        status: pass
    human_judgment: false
  - id: D2
    description: List overdue «заполни» + Заполни / calm Внести факт / one-time получено+Δ + Изменить факт
    requirement: ACT-02
    verification:
      - kind: unit
        ref: src/components/income/income-ui.test.ts#overdue badge + fact CTA labels
        status: pass
      - kind: unit
        ref: src/lib/income.test.ts#incomeVarianceMinor / incomeVariancePhrase
        status: pass
    human_judgment: false
  - id: D3
    description: income-ui file-scans + full npm test green; no chart import on fact/list
    requirement: ACT-03
    verification:
      - kind: unit
        ref: src/components/income/income-ui.test.ts#no chart UI
        status: pass
      - kind: unit
        ref: "npm test (358 tests)"
        status: pass
    human_judgment: false

duration: 4min
completed: 2026-09-07
status: complete
---

# Phase 15 Plan 03: Fact dialog + overdue/variance chrome Summary

**IncomeFactDialog + warning overdue chip + one-time inline Δ on `/income`; suite green, no charts.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-09-07T17:31:51Z
- **Completed:** 2026-09-07T17:35:39Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Dedicated `IncomeFactDialog` for create/edit/delete actual (D-01) with RO plan fields, Moscow-today first-fill, live Отклонение
- List chrome: overdue «заполни» warning chip + Заполни / Внести факт / Изменить факт; one-time «получено» + Δ
- `--warning` theme tokens; income-ui file-scans; full `npm test` 358 green

## Task Commits

Each task was committed atomically:

1. **Task 1: Warning tokens + IncomeFactDialog** - `4d33ada` (feat)
2. **Task 2: IncomeList overdue + variance chrome + fact CTAs** - `477fd1b` (feat)
3. **Task 3: income-ui file-scan polish + full suite gate** - `9cc97ff` (test)

**Plan metadata:** (pending docs commit)

## Files Created/Modified

- `src/components/income/IncomeFactDialog.tsx` — NEW fact dialog
- `src/app/globals.css` — `--warning` / `--warning-foreground` + `@theme` aliases
- `src/components/income/IncomeList.tsx` — overdue/variance/CTA chrome
- `src/components/income/IncomeFormDialog.tsx` — `actualNote` on `IncomeRow`
- `src/app/income/page.tsx` — plumb `actualNote` from slot actual
- `src/components/income/income-ui.test.ts` — ACT-02/03 file-scans

## Decisions Made

- Dialog labels derived from `hasActual` + `overdue` props
- Plumbed `actualNote` for edit prefill (Plan 02 fetched note but did not expose)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] Plumb actualNote for edit prefill**
- **Found during:** Task 1/2
- **Issue:** RSC selected actual.note but IncomeRow lacked field — edit would lose note
- **Fix:** Added `actualNote?` to IncomeRow + page mapping
- **Files modified:** IncomeFormDialog.tsx, page.tsx
- **Commit:** `4d33ada` / `477fd1b`

## Threat Flags

None — fact dialog calls income actual actions only; no new packages; React text escaping for note.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: src/components/income/IncomeFactDialog.tsx
- FOUND: src/app/globals.css (--warning)
- FOUND: 4d33ada, 477fd1b, 9cc97ff
