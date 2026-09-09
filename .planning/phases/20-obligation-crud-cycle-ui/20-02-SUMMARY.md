---
phase: 20-obligation-crud-cycle-ui
plan: 02
subsystem: ui
tags: [credit-grace, obligations, zod, vitest, server-actions, dialog, DestructiveConfirmStep]

requires:
  - phase: 20-obligation-crud-cycle-ui
    provides: createCreditGraceObligation tracer, DestructiveConfirmStep children/pendingLabel, hybrid list
provides:
  - updateCreditGraceObligation / closeCreditGraceObligation / reopenCreditGraceObligation
  - OPEN amount edit via CreditGraceAmountDialog
  - Early close + reopen DestructiveConfirmStep with editable closedAsOf
  - Collapsed CLOSED history (Показать оплаченные)
affects:
  - 20-03 overdue chrome + UX-01 polish

actuals:
  tokens: 8587
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - dedicated close/reopen wrappers over updateCreditGraceObligationSchema
    - DebtDetailDialog confirm-step state machine inside CreditGraceDialog
    - DebtsList chevron collapse for CLOSED grace history

key-files:
  created: []
  modified:
    - src/app/accounts/actions.ts
    - src/app/accounts/actions.test.ts
    - src/components/accounts/CreditGraceDialog.tsx
    - src/components/accounts/CreditGraceAmountDialog.tsx
    - src/components/accounts/credit-grace-ui.test.ts

key-decisions:
  - "close/reopen are dedicated exports; validate via update schema after load"
  - "CLOSED list stays outside mergeGraceListRows — separate collapsed section (D-06)"
  - "Edit amount uses formatMinorToMajorExact for input prefill (no thousand spaces)"

patterns-established:
  - "Grace lifecycle confirms: DestructiveConfirmStep + pendingLabel Сохранение…/Возврат…"
  - "OPEN update never writes cycleStartAsOf/dueAsOf/status in prisma data"

requirements-completed: [OBL-01, OBL-02]

coverage:
  - id: D1
    description: update OPEN amount/note freezes cycle keys; no BalanceSnapshot writes
    requirement: OBL-01
    verification:
      - kind: unit
        ref: src/app/accounts/actions.test.ts#updateCreditGraceObligation
        status: pass
    human_judgment: false
  - id: D2
    description: close with closedAsOf + reopen clears closedAsOf; GRISO isolation
    requirement: OBL-02
    verification:
      - kind: unit
        ref: src/app/accounts/actions.test.ts#closeCreditGraceObligation
        status: pass
      - kind: unit
        ref: src/app/accounts/actions.test.ts#reopenCreditGraceObligation
        status: pass
    human_judgment: false
  - id: D3
    description: DestructiveConfirmStep close/reopen + collapsed Показать оплаченные; no native confirm
    requirement: OBL-02
    verification:
      - kind: unit
        ref: src/components/accounts/credit-grace-ui.test.ts#plan-02
        status: pass
    human_judgment: false

duration: 6min
completed: 2026-09-09
status: complete
---

# Phase 20 Plan 02: Obligation lifecycle Summary

**OPEN amount edit freezes cycle keys; early close/reopen use DestructiveConfirmStep with editable closedAsOf; CLOSED history starts collapsed behind «Показать оплаченные».**

## Performance

- **Duration:** 6 min
- **Started:** 2026-09-09T12:29:13Z
- **Completed:** 2026-09-09T12:35:32Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- `updateCreditGraceObligation` / `closeCreditGraceObligation` / `reopenCreditGraceObligation` green with snapshot isolation asserts
- Amount dialog edit mode for OPEN rows; cycle/due read-only (D-10)
- Close confirm with «Дата оплаты» + pendingLabel «Сохранение…»; reopen with «Возврат…»; paid history collapsed (D-06/D-11/D-12)

## Task Commits

1. **Task 1 RED: update/close/reopen tests** - `f844b0b` (test)
2. **Task 1 GREEN: implement actions** - `3422d79` (feat)
3. **Task 2: Amount edit + close/reopen + collapsed CLOSED** - `a16489d` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified

- `src/app/accounts/actions.ts` — update/close/reopen server actions
- `src/app/accounts/actions.test.ts` — unskipped Plan 02 suites with isolation + pairing expects
- `src/components/accounts/CreditGraceDialog.tsx` — confirm steps + paid toggle + row CTAs
- `src/components/accounts/CreditGraceAmountDialog.tsx` — create/edit modes
- `src/components/accounts/credit-grace-ui.test.ts` — plan-02 unskipped; plan-03 still describe.skip

## Decisions Made

- Dedicated close/reopen wrappers (Q3 RESOLVED) rather than one mega-update FormData from UI
- CLOSED obligations rendered from account list filter, not mergeGraceListRows (still OPEN/CTA only)

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None — `placeholder=""` on DOM day inputs is intentional empty start (D-15), not stub chrome.

## Self-Check: PASSED

- FOUND: all key files
- FOUND: f844b0b, 3422d79, a16489d
- plan-03 describe.skip retained
