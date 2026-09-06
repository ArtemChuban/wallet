---
phase: 12-address-tech-debt-debts-refresh-nyquist-10-11
plan: 02
subsystem: ui
tags: [destructive-confirm, components-ui, kebab, vitest, TD-UIHOME-01]

requires:
  - phase: 12-01
    provides: router.refresh on DebtsList / DebtFormDialog / DebtDetailDialog success paths
provides:
  - DestructiveConfirmStep at src/components/ui/destructive-confirm-step.tsx (TD-UIHOME-01)
  - Four-consumer import graph on ui path; debts/ home removed
  - AccountList.test guards ui import and rejects debts/ path
affects:
  - 12-03 Nyquist VALIDATION reconcile

actuals:
  tokens: 861
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Shared interactive UI under components/ui/ with kebab filename; PascalCase export"
    - "Source-grep AccountList.test asserts ui path and rejects debts/ DestructiveConfirmStep"

key-files:
  created:
    - src/components/ui/destructive-confirm-step.tsx
  modified:
    - src/components/debts/DebtsList.tsx
    - src/components/debts/DebtFormDialog.tsx
    - src/components/debts/DebtDetailDialog.tsx
    - src/components/accounts/AccountList.tsx
    - src/components/accounts/AccountList.test.ts
  deleted:
    - src/components/debts/DestructiveConfirmStep.tsx

key-decisions:
  - "Move verbatim; no re-export shim from debts/"
  - "Retarget all four consumers before delete"
  - "Preserve Plan 01 router.refresh wiring unchanged"

patterns-established:
  - "Cross-domain confirm lives in ui/; domain folders must not host shared presentational confirm"

requirements-completed: [TD-UIHOME-01]

coverage:
  - id: D1
    description: DestructiveConfirmStep lives under src/components/ui/destructive-confirm-step.tsx; old debts file gone
    requirement: TD-UIHOME-01
    verification:
      - kind: other
        ref: "test -f src/components/ui/destructive-confirm-step.tsx && test ! -f src/components/debts/DestructiveConfirmStep.tsx"
        status: pass
    human_judgment: false
  - id: D2
    description: DebtsList, DebtFormDialog, DebtDetailDialog, AccountList import @/components/ui/destructive-confirm-step
    requirement: TD-UIHOME-01
    verification:
      - kind: other
        ref: "grep destructive-confirm-step in four consumers; ! grep components/debts/DestructiveConfirmStep under src"
        status: pass
    human_judgment: false
  - id: D3
    description: AccountList.test asserts ui path and rejects debts/ DestructiveConfirmStep import
    requirement: TD-UIHOME-01
    verification:
      - kind: unit
        ref: "npx vitest run src/components/accounts/AccountList.test.ts"
        status: pass
    human_judgment: false

duration: 1min
completed: 2026-09-06
status: complete
---

# Phase 12 Plan 02: DestructiveConfirmStep UI home Summary

**Relocated DestructiveConfirmStep to `src/components/ui/destructive-confirm-step.tsx` and retargeted all four consumers so accounts no longer imports from debts/ (TD-UIHOME-01).**

## Performance

- **Duration:** 1 min
- **Started:** 2026-09-06T22:07:26Z
- **Completed:** 2026-09-06T22:08:27Z
- **Tasks:** 2/2
- **Files modified:** 6 (1 create via rename, 4 import retargets, 1 test)

## Accomplishments

- Shared confirm home matches ui/ kebab peers; export name `DestructiveConfirmStep` and «Удаление…» pending copy unchanged
- DebtsList / DebtFormDialog / DebtDetailDialog / AccountList import `@/components/ui/destructive-confirm-step`; zero `components/debts/DestructiveConfirmStep` leftovers under `src`
- Plan 01 `router.refresh` on DebtsList / DebtFormDialog / DebtDetailDialog preserved
- AccountList.test asserts ui path and fails if old debts path returns

## Task Commits

1. **Task 1: Move DestructiveConfirmStep to components/ui** - `e6454d7` (feat)
2. **Task 2: Strengthen AccountList path test** - `9b99fe5` (test)

**Plan metadata:** `138e8f3` (docs: complete plan)

## Files Created/Modified

- `src/components/ui/destructive-confirm-step.tsx` — shared DestructiveConfirmStep (moved verbatim)
- `src/components/debts/DestructiveConfirmStep.tsx` — deleted (git R100 rename)
- `src/components/debts/DebtsList.tsx` — import → ui path
- `src/components/debts/DebtFormDialog.tsx` — import → ui path
- `src/components/debts/DebtDetailDialog.tsx` — import → ui path
- `src/components/accounts/AccountList.tsx` — import → ui path
- `src/components/accounts/AccountList.test.ts` — ui path assert + reject debts path

## Decisions Made

- No debts/ re-export shim — clean break
- Test strengthens path contract; RateList `window.confirm` left untouched

## Deviations from Plan

None - plan executed exactly as written.

## Threat Flags

None — move + import retarget only; confirm behavior unchanged (T-12-05 mitigated by verbatim move).

## Known Stubs

None.

## Self-Check: PASSED
