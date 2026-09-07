---
phase: 15-plan-vs-actual-overdue
plan: 01
subsystem: api
tags: [zod, prisma, income, actuals, variance, vitest, server-actions]

requires:
  - phase: 13-income-schema-domain-math
    provides: RecurringIncomeActual / OneTimeIncomeActual models + isIncomeOverdue
  - phase: 14-dohody-crud-nav
    provides: income Server Actions, Zod definition schemas, /income revalidate isolation
provides:
  - upsertRecurringIncomeActual write path (compound unique plannedAsOf slot)
  - Full actual Zod surface (recurring/one-time upsert + both deletes)
  - incomeVarianceMinor + incomeVariancePhrase for Plan 03 chrome
affects:
  - 15-02 (remaining actual actions + page join)
  - 15-03 (IncomeFactDialog + variance UI)

actuals:
  tokens: 4487
  tasks: 3
  commits: 7

tech-stack:
  added: []
  patterns:
    - "Actual upsert on @@unique(parentId, plannedAsOf); update amountMinor/actualAsOf/note only"
    - "actualAsOf allows future dates (unlike debt repayment)"
    - "Variance = actual − plan in source minor; RU phrase helpers pure"

key-files:
  created: []
  modified:
    - src/lib/validations/income.ts
    - src/lib/validations/income.test.ts
    - src/app/income/actions.ts
    - src/app/income/actions.test.ts
    - src/lib/income.ts
    - src/lib/income.test.ts

key-decisions:
  - "Future actualAsOf accepted at Zod/action layer — no repayment today upper bound (D-19)"
  - "Parent findUnique fail-closed before upsert; scale from parent currency"
  - "Isolation scan forbids BalanceSnapshot substring even in comments"

patterns-established:
  - "Income actual Zod: actualAmountMajor + isStrictlyPositiveMajor refine + asOfDateSchema"
  - "Tracer path: recurring upsert first; one-time/delete schemas ahead of Plan 02 actions"

requirements-completed: [ACT-01, ACT-03]

coverage:
  - id: D1
    description: Recurring actual upsert with positive-amount Zod and compound unique slot key
    requirement: ACT-01
    verification:
      - kind: unit
        ref: src/app/income/actions.test.ts#upsertRecurringIncomeActual
        status: pass
      - kind: unit
        ref: src/lib/validations/income.test.ts#upsertRecurringIncomeActualSchema
        status: pass
    human_judgment: false
  - id: D2
    description: One-time upsert + delete actual Zod schemas ready for Plan 02
    requirement: ACT-01
    verification:
      - kind: unit
        ref: src/lib/validations/income.test.ts#upsertOneTimeIncomeActualSchema
        status: pass
    human_judgment: false
  - id: D3
    description: Pure variance helpers (actual − plan) with RU phrases
    requirement: ACT-03
    verification:
      - kind: unit
        ref: src/lib/income.test.ts#incomeVarianceMinor / incomeVariancePhrase
        status: pass
    human_judgment: false
  - id: D4
    description: Income actions isolation — no BalanceSnapshot / NW imports / dashboard revalidate
    requirement: ACT-01
    verification:
      - kind: unit
        ref: src/app/income/actions.test.ts#income actions isolation
        status: pass
    human_judgment: false

duration: 4min
completed: 2026-09-07
status: complete
---

# Phase 15 Plan 01: ACT-01 write-path tracer + variance helpers Summary

**Recurring actual upsert on `recurringIncomeId_plannedAsOf` with positive-amount Zod; full actual schema surface; pure `incomeVarianceMinor` / RU phrases for ACT-03.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-09-07T17:17:44Z
- **Completed:** 2026-09-07T17:22:08Z
- **Tasks:** 3/3
- **Files modified:** 6

## Accomplishments

- Tracer: `upsertRecurringIncomeActual` parses major via parent currency scale, upserts slot by `plannedAsOf`, never touches definition plan columns; future `actualAsOf` OK
- Zod: `upsertOneTimeIncomeActualSchema` + both delete-by-id schemas for Plan 02
- `incomeVarianceMinor` / `incomeVariancePhrase` encode ACT-03 formula + UI-SPEC RU copy

## Task Commits

Each task was committed atomically:

1. **Task 1: End-to-end upsertRecurringIncomeActual** — `00d5a4e` (test) → `470ff53` (feat)
2. **Task 2: Zod one-time upsert + delete schemas** — `6dc72f1` (test) → `e5dcd35` (feat)
3. **Task 3: incomeVarianceMinor + RU phrases** — `e499c8e`/`d9a8307` (test) → `954445b` (feat)

**Plan metadata:** `0ab64a2` / `b0349a6` (docs: complete plan + STATE position)

_Note: TDD tasks used RED → GREEN commits; Task 3 RED split across two test commits._

## Files Created/Modified

- `src/lib/validations/income.ts` — actual upsert/delete Zod schemas + types
- `src/lib/validations/income.test.ts` — ACT-01 boundary/precision cases
- `src/app/income/actions.ts` — `upsertRecurringIncomeActual` + error keys
- `src/app/income/actions.test.ts` — upsert mocks + isolation scan still green
- `src/lib/income.ts` — `incomeVarianceMinor` / `incomeVariancePhrase`
- `src/lib/income.test.ts` — variance formula + phrase branches

## Decisions Made

- Followed RESEARCH action names and repayment-shaped Zod without copying future-date rejection
- Stored optional note as `null` when absent (Prisma optional String)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Isolation file-scan matched comment text**
- **Found during:** Task 1 (upsertRecurringIncomeActual GREEN)
- **Issue:** Doc comment contained `BalanceSnapshot`; isolation test uses `/BalanceSnapshot/` on whole file
- **Fix:** Reworded comment to avoid substring
- **Files modified:** `src/app/income/actions.ts`
- **Commit:** `470ff53`

## TDD Gate Compliance

- RED `test(15-01): …` commits exist before each GREEN `feat(15-01): …`
- Task 3 RED body landed in follow-up `d9a8307` after imports-only `e499c8e` (same wave)

## Known Stubs

None — write path and helpers fully wired for this plan's scope (remaining actions = Plan 02).

## Threat Flags

None — surface matches plan threat model (Zod.strict, parent findUnique, no BalanceSnapshot, zero packages).

## Self-Check: PASSED

- FOUND: `src/lib/validations/income.ts`, `src/app/income/actions.ts`, `src/lib/income.ts`
- FOUND commits: `00d5a4e`, `470ff53`, `6dc72f1`, `e5dcd35`, `e499c8e`, `d9a8307`, `954445b`
- vitest: 72 pass / 0 fail across plan verification suites
