---
phase: 10-repayments-close-write-off
plan: 03
subsystem: debts
tags: [prisma, server-actions, zod, vitest, debt-size-change, forgive]

requires:
  - phase: 10-repayments-close-write-off
    provides: repayment create/delete, mixed timeline, CLOSED grouping
  - phase: 08-debts-schema-domain-math
    provides: remainingMinor, assertSizeDelta, statusForRemaining, DebtSizeChange ledger
provides:
  - createSizeChange / forgiveRemaining / deleteSizeChange Server Actions
  - forgiveRemainingSchema (debtId, asOfDate, note? only)
  - DebtDetailDialog size-change form + forgive confirm + event deletes
affects:
  - phase-11 debt charts/totals on same detail surface

actuals:
  tokens: 9742
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - Server-computed forgive delta (−remaining); no client deltaMajor on forgive path
    - All DebtSizeChange timeline rows labeled «Изменение суммы» (no distinct forgive label)
    - DestructiveConfirmStep for forgive + size-change delete (no window.confirm)

key-files:
  created: []
  modified:
    - src/app/debts/actions.ts
    - src/app/debts/actions.test.ts
    - src/lib/validations/debts.ts
    - src/lib/validations/debts.test.ts
    - src/components/debts/DebtDetailDialog.tsx

key-decisions:
  - "no-forgive-label / no-isForgive: user declined separate «Списание» label and isForgive persistence; forgive is UX+server delta only"
  - "Intentional override of CONTEXT D-07 label distinction"

patterns-established:
  - "forgiveRemainingSchema.strict() rejects smuggled deltaMajor (T-10-02)"
  - "Hide «Простить остаток» when remainingMinor === 0n"

requirements-completed: [DEBT-05]

coverage:
  - id: D1
    description: Manual createSizeChange with assertSizeDelta floor + future-date gate; DISOL /debts only
    requirement: DEBT-05
    verification:
      - kind: unit
        ref: src/app/debts/actions.test.ts#createSizeChange (DEBT-05 / D-08)
        status: pass
    human_judgment: false
  - id: D2
    description: forgiveRemaining writes deltaMinor = −remaining, sets CLOSED; rejects remaining 0; ignores smuggled delta
    requirement: DEBT-05
    verification:
      - kind: unit
        ref: src/app/debts/actions.test.ts#forgiveRemaining (DEBT-05 / T-10-02)
        status: pass
    human_judgment: false
  - id: D3
    description: deleteSizeChange recomputes remaining/status (reopen OPEN) with /debts-only revalidate
    requirement: DEBT-05
    verification:
      - kind: unit
        ref: src/app/debts/actions.test.ts#deleteSizeChange (D-06 / DEBT-05)
        status: pass
    human_judgment: false
  - id: D4
    description: Detail UI — size-change form, forgive confirm with remaining+close copy, hide at zero, timeline «Изменение суммы» only
    requirement: DEBT-05
    verification:
      - kind: other
        ref: grep Простить остаток + Изменение суммы + DestructiveConfirmStep; !Списание; !window.confirm
        status: pass
    human_judgment: true
    rationale: Confirm copy wording and hide-at-zero UX need human eye on live Dialog

duration: 3min
completed: 2026-09-05
status: complete
---

# Phase 10 Plan 03: Size-change + forgive Summary

**Early close via server −remaining size-change (no isForgive column); manual deltas + delete; timeline always «Изменение суммы».**

## Performance

- **Duration:** 3 min
- **Started:** 2026-09-05T12:22:48Z
- **Completed:** 2026-09-05T12:26:06Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Shipped `createSizeChange`, `forgiveRemaining`, `deleteSizeChange` with assertSizeDelta / status sync and `revalidatePath("/debts")` only
- `forgiveRemainingSchema` has no client delta; smuggled `deltaMajor` rejected by `.strict()`
- Detail Dialog: size-change form, «Простить остаток» confirm (remaining + close), hide when remaining 0, size-change delete via DestructiveConfirmStep
- No Prisma `isForgive` migration — user product override

## Task Commits

1. **Task 1: Confirm DebtSizeChange.isForgive Boolean** — decision only (no schema commit): `no-forgive-label / no-isForgive`
2. **Task 2: forgive/size-change actions (no isForgive)** — `fecec64` (feat)
3. **Task 3: Detail UI size-change + forgive** — `25fe40a` (feat)

**Plan metadata:** `6e66fb5` (docs: complete plan)

## Files Created/Modified

- `src/lib/validations/debts.ts` — `forgiveRemainingSchema`
- `src/lib/validations/debts.test.ts` — forgive schema + smuggle rejection tests
- `src/app/debts/actions.ts` — createSizeChange / forgiveRemaining / deleteSizeChange
- `src/app/debts/actions.test.ts` — CLOSED forgive, over-floor, reopen delete, DISOL
- `src/components/debts/DebtDetailDialog.tsx` — forms, forgive confirm, deletes

## Decisions Made

- **no-forgive-label / no-isForgive:** User declined separate «Списание» label and `isForgive` persistence. Forgive remains one-tap UX + server-computed size-change delta only. All size-change timeline rows use «Изменение суммы».
- Intentional override of CONTEXT D-07 («Списание» vs «Изменение суммы»).

## Deviations from Plan

### User / product overrides

**1. [User decision] Skip isForgive schema + «Списание» label**
- **Found during:** Task 1 checkpoint (resolved)
- **Issue:** Plan recommended `isForgive Boolean` + D-07 dual labels
- **Fix:** No migration; no note sentinel; no display-time inference; single timeline label
- **Files modified:** actions + DebtDetailDialog (adapted acceptance)
- **Verification:** `! grep isForgive prisma/schema.prisma`; timeline never shows «Списание»
- **Committed in:** `fecec64`, `25fe40a`

### Auto-fixed Issues

None beyond adapted acceptance criteria from user decision.

---

**Total deviations:** 1 product override (D-07 / isForgive declined)
**Impact on plan:** DEBT-05 mechanics shipped; label distinction deferred permanently per user

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 10 feature surface complete for repayments + early close. Phase 11 can build charts/totals against existing DebtSizeChange ledger without isForgive.

## Self-Check: PASSED

- FOUND: `src/app/debts/actions.ts` (createSizeChange, forgiveRemaining, deleteSizeChange)
- FOUND: `src/components/debts/DebtDetailDialog.tsx` (Простить остаток, Изменение суммы)
- FOUND: commits `fecec64`, `25fe40a`
- ABSENT (intentional): `isForgive` in schema

---
*Phase: 10-repayments-close-write-off*
*Completed: 2026-09-05*
