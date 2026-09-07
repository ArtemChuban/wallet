---
phase: 15-plan-vs-actual-overdue
plan: 02
subsystem: api
tags: [prisma, income, actuals, overdue, rsc, vitest, server-actions]

requires:
  - phase: 15-plan-vs-actual-overdue
    provides: upsertRecurringIncomeActual + actual Zod schemas + isIncomeOverdue
  - phase: 14-dohody-crud-nav
    provides: /income RSC list + IncomeRow + nextOpenPlannedAsOf join
provides:
  - upsertOneTimeIncomeActual with plannedAsOf === definition assert
  - deleteRecurringIncomeActual + deleteOneTimeIncomeActual by id
  - IncomeRow hasActual/overdue/actual* props from RSC join
affects:
  - 15-03 (IncomeFactDialog + overdue/variance chrome)

actuals:
  tokens: 4142
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - "One-time actual upsert: server assert plannedAsOf === parent.plannedAsOf before compound unique write"
    - "RSC next-open join: match actual.plannedAsOf === nextPlannedAsOf; overdue via isIncomeOverdue(today)"

key-files:
  created: []
  modified:
    - src/app/income/actions.ts
    - src/app/income/actions.test.ts
    - src/app/income/page.tsx
    - src/components/income/IncomeFormDialog.tsx

key-decisions:
  - "Spoofed one-time plannedAsOf returns field error; parent missing fails closed with message"
  - "IncomeList unchanged visually — fact props plumbed for Plan 03 chrome only (D-20)"

patterns-established:
  - "Actual deletes mirror deleteRepaymentSchema Zod + delete-by-id; revalidatePath(/income) only"
  - "IncomeRow optional actualId/actualAmountMinor/actualAsOf alongside required hasActual/overdue"

requirements-completed: [ACT-01, ACT-02]

coverage:
  - id: D1
    description: One-time upsert on oneTimeIncomeId_plannedAsOf with definition plannedAsOf integrity check
    requirement: ACT-01
    verification:
      - kind: unit
        ref: src/app/income/actions.test.ts#upsertOneTimeIncomeActual
        status: pass
    human_judgment: false
  - id: D2
    description: Delete recurring/one-time actual by id; isolation scan still green
    requirement: ACT-01
    verification:
      - kind: unit
        ref: src/app/income/actions.test.ts#deleteRecurringIncomeActual / deleteOneTimeIncomeActual
        status: pass
      - kind: unit
        ref: src/app/income/actions.test.ts#income actions isolation
        status: pass
    human_judgment: false
  - id: D3
    description: Page joins full actual fields; IncomeRow carries hasActual/overdue via isIncomeOverdue
    requirement: ACT-02
    verification:
      - kind: unit
        ref: src/lib/income.test.ts#isIncomeOverdue / nextOpenPlannedAsOf
        status: pass
      - kind: other
        ref: "grep isIncomeOverdue+hasActual+amountMinor on page.tsx / IncomeFormDialog"
        status: pass
    human_judgment: false

duration: 2min
completed: 2026-09-07
status: complete
---

# Phase 15 Plan 02: Actual actions + overdue RSC props Summary

**Four actual Server Actions complete; `/income` RSC joins actual slots and maps `hasActual`/`overdue` onto `IncomeRow` for Plan 03 chrome.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-09-07T17:25:19Z
- **Completed:** 2026-09-07T17:27:44Z
- **Tasks:** 2/2
- **Files modified:** 4

## Accomplishments

- `upsertOneTimeIncomeActual` upserts on `oneTimeIncomeId_plannedAsOf`; rejects spoofed `plannedAsOf` vs definition; future `actualAsOf` OK
- `deleteRecurringIncomeActual` / `deleteOneTimeIncomeActual` delete-by-id; success `revalidatePath("/income")` only
- Page expands actual selects (Pitfall 1); maps `hasActual`/`overdue`/`actual*` with Moscow today + `isIncomeOverdue`; sort unchanged (D-11)

## Task Commits

Each task was committed atomically:

1. **Task 1: One-time upsert + delete actual actions** — `4894e7e` (test) → `6407dec` (feat)
2. **Task 2: Page join actuals + IncomeRow overdue props** — `c2e3e6c` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified

- `src/app/income/actions.ts` — upsertOneTime + both actual deletes
- `src/app/income/actions.test.ts` — mocks + ACT-01 coverage
- `src/app/income/page.tsx` — full actual include + overdue/hasActual join
- `src/components/income/IncomeFormDialog.tsx` — IncomeRow fact/overdue fields

## Decisions Made

- Field-level `plannedAsOf` error on one-time spoof (vs generic message) — clearer for FormData clients
- No IncomeList chrome this plan — props only (D-20 coexistence with definition «Изменить»)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 03 can ship IncomeFactDialog + overdue/variance CTA chrome using row `hasActual`/`overdue`/`actual*` props and all four actual actions.

## Known Stubs

None — fact CTA chrome intentionally deferred to 15-03; props are real joined data.

## Self-Check: PASSED

- FOUND: src/app/income/actions.ts (upsertOneTimeIncomeActual, deletes, oneTimeIncomeId_plannedAsOf)
- FOUND: src/app/income/page.tsx (isIncomeOverdue, hasActual, amountMinor)
- FOUND: src/components/income/IncomeFormDialog.tsx (hasActual on IncomeRow)
- FOUND: commits 4894e7e, 6407dec, c2e3e6c

---
*Phase: 15-plan-vs-actual-overdue*
*Completed: 2026-09-07*
