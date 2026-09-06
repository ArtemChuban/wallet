---
phase: 12-address-tech-debt-debts-refresh-nyquist-10-11
plan: 01
subsystem: debts
tags: [nextjs, router.refresh, revalidatePath, assertStatusSynced, zod, vitest]

requires:
  - phase: 10-repayments-close-write-off
    provides: debts Server Actions with revalidatePath("/debts") + DISOL-01
  - phase: 11-charts-primary-totals
    provides: /debts page remainingMinor + primary totals maps
provides:
  - Client router.refresh on all debts mutation success shells (TD-REFRESH-01)
  - assertStatusSynced on /debts RSC list + totals paths (TD-STATUS-01)
  - assertInitialImmutable documented as Zod updateDebtMetaSchema test contract (TD-ASSERT-01)
affects:
  - 12-02 DestructiveConfirmStep UI home
  - 12-03 Nyquist VALIDATION reconcile

actuals:
  tokens: 1472
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Shell onSuccess: router.refresh() then close dialog"
    - "RSC hard assertStatusSynced after remainingMinor before props"
    - "Document-only Zod contract for unused assert helpers"

key-files:
  created: []
  modified:
    - src/components/debts/DebtDetailDialog.tsx
    - src/components/debts/DebtFormDialog.tsx
    - src/components/debts/PersonFormDialog.tsx
    - src/components/debts/DebtsList.tsx
    - src/app/debts/page.tsx
    - src/lib/debts.ts

key-decisions:
  - "Shell-only refresh so body success paths inherit one router.refresh"
  - "Hard throw on status desync; no coerce status from remaining for display"
  - "Document assertInitialImmutable → Zod omit+.strict; do not wire into updateDebtMeta"

patterns-established:
  - "Debts mutation success: revalidatePath(\"/debts\") server + router.refresh() client"
  - "DISOL-01: never revalidatePath(\"/\") from debt mutations"

requirements-completed: [TD-REFRESH-01, TD-STATUS-01, TD-ASSERT-01]

coverage:
  - id: D1
    description: DebtDetailDialog shell calls router.refresh on mutation success before close
    requirement: TD-REFRESH-01
    verification:
      - kind: other
        ref: "grep -q 'router.refresh' src/components/debts/DebtDetailDialog.tsx"
        status: pass
      - kind: unit
        ref: "npx vitest run src/app/debts/actions.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: /debts page calls assertStatusSynced after remainingMinor on list and totals maps
    requirement: TD-STATUS-01
    verification:
      - kind: other
        ref: "grep -c assertStatusSynced src/app/debts/page.tsx >= 2"
        status: pass
      - kind: unit
        ref: "npx vitest run src/lib/debts.test.ts -t assert"
        status: pass
    human_judgment: false
  - id: D3
    description: DebtFormDialog, PersonFormDialog, DebtsList call router.refresh on success
    requirement: TD-REFRESH-01
    verification:
      - kind: other
        ref: "grep router.refresh in DebtFormDialog/PersonFormDialog/DebtsList"
        status: pass
      - kind: unit
        ref: "npx vitest run src/app/debts/actions.test.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: assertInitialImmutable JSDoc cites updateDebtMetaSchema omit+.strict as runtime DEBT-03
    requirement: TD-ASSERT-01
    verification:
      - kind: other
        ref: "grep -q updateDebtMetaSchema src/lib/debts.ts"
        status: pass
      - kind: unit
        ref: "npx vitest run src/lib/debts.test.ts -t assert"
        status: pass
    human_judgment: false

duration: 2min
completed: 2026-09-06
status: complete
---

# Phase 12 Plan 01: Debts refresh + status assert Summary

**Belt-and-suspenders `/debts` refresh via client `router.refresh` on all mutation success shells, plus hard `assertStatusSynced` on RSC remaining maps and Zod-documented `assertInitialImmutable`.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-09-06T22:03:32Z
- **Completed:** 2026-09-06T22:05:14Z
- **Tasks:** 3/3
- **Files modified:** 6

## Accomplishments

- DebtDetailDialog / DebtFormDialog / PersonFormDialog / DebtsList call `router.refresh()` only after successful mutations (TD-REFRESH-01)
- `/debts` page asserts status↔remaining sync twice before serializing list/totals props (TD-STATUS-01)
- `assertInitialImmutable` JSDoc points at `updateDebtMetaSchema` omit + `.strict()` as runtime DEBT-03; helper stays unit-test contract (TD-ASSERT-01)
- Server Actions unchanged — `revalidatePath("/debts")` kept; dashboard `/` never revalidated (DISOL-01)

## Task Commits

1. **Task 1: End-to-end debts refresh + status assert — DebtDetailDialog + page** - `557465d` (feat)
2. **Task 2: Expand router.refresh to Form, Person, DebtsList delete** - `3f4152c` (feat)
3. **Task 3: Document assertInitialImmutable as Zod test contract** - `fa61cc4` (docs)

**Plan metadata:** (pending docs commit)

## Files Created/Modified

- `src/components/debts/DebtDetailDialog.tsx` — useRouter + shell onSuccess refresh
- `src/components/debts/DebtFormDialog.tsx` — shell onSuccess refresh
- `src/components/debts/PersonFormDialog.tsx` — shell onSuccess refresh
- `src/components/debts/DebtsList.tsx` — deletePerson success refresh
- `src/app/debts/page.tsx` — assertStatusSynced after both remainingMinor sites
- `src/lib/debts.ts` — assertInitialImmutable JSDoc → Zod contract

## Decisions Made

- Shell-only refresh wrappers so all body success paths inherit one refresh
- Hard throw on desync; CLOSED bucketing stays status-based (unchanged)
- Document-only path for assertInitialImmutable (no fake call into updateDebtMeta)

## Deviations from Plan

None - plan executed exactly as written.

## Threat Flags

None — no new endpoints/auth/schema; refresh + assert only.

## Known Stubs

None.

## Self-Check: PASSED
