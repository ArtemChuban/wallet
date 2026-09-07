---
phase: 14-dohody-crud-nav
plan: 01
subsystem: ui
tags: [income, nav, zod, nextjs, vitest]

requires:
  - phase: 13-income-schema-domain-math
    provides: income domain helpers + schema models + UI-00 absence assert
provides:
  - Nav «Доходы» → /income after Счета
  - Thin force-dynamic /income shell with D-11 honesty + E1 empty people chrome
  - Zod create/update schemas for recurring + one-time income (SRC-01/02)
  - nextOpenPlannedAsOf pure helper for list sort/display
affects:
  - 14-02 Server Actions
  - 14-03 IncomeList / IncomeFormDialog

actuals:
  tokens: 4925
  tasks: 3
  commits: 5

tech-stack:
  added: []
  patterns:
    - "Flip Phase 13 UI-00 absence → positive existsSync on page.tsx"
    - "Zod income schemas mirror debts primitives (.strict + positive major refine)"
    - "nextOpenPlannedAsOf wraps listRecurringOccurrences + 400d horizon"

key-files:
  created:
    - src/app/income/page.tsx
    - src/lib/validations/income.ts
    - src/lib/validations/income.test.ts
  modified:
    - src/components/nav.tsx
    - src/components/nav.test.ts
    - src/lib/income.ts
    - src/lib/income.test.ts

key-decisions:
  - "Empty /income shell uses PersonFormDialog only — IncomeFormDialog deferred to Plan 03"
  - "optionalNoteSchema preprocess maps empty string → undefined for SRC-02"
  - "nextOpenPlannedAsOf fallback = startAsOf when horizon fully filled (A3)"

patterns-established:
  - "Income route shell: force-dynamic + ensureSqlitePragmas + people-only load"
  - "Income Zod: create + WithNewPerson + update omitting person/currency (A1)"

requirements-completed: [SRC-01, SRC-02, UI-01]

coverage:
  - id: D1
    description: Nav shows Доходы after Счета linking to /income
    requirement: UI-01
    verification:
      - kind: unit
        ref: src/components/nav.test.ts#orders Главная · Счета · Доходы · Долги · Валюты
        status: pass
    human_judgment: false
  - id: D2
    description: /income page exists with D-11 honesty copy and E1 empty chrome
    requirement: UI-01
    verification:
      - kind: unit
        ref: src/lib/income.test.ts#UI-01: src/app/income/page.tsx exists
        status: pass
    human_judgment: false
  - id: D3
    description: Zod recurring/one-time create+update schemas with dayOfMonth bounds
    requirement: SRC-01
    verification:
      - kind: unit
        ref: src/lib/validations/income.test.ts
        status: pass
    human_judgment: false
  - id: D4
    description: nextOpenPlannedAsOf returns past unfilled and skips filled slots
    requirement: SRC-02
    verification:
      - kind: unit
        ref: src/lib/income.test.ts#nextOpenPlannedAsOf
        status: pass
    human_judgment: false

duration: 4min
completed: 2026-09-07
status: complete
---

# Phase 14 Plan 01: Доходы nav + Zod + nextOpen Summary

**Nav «Доходы» → `/income` empty shell; Zod SRC-01/02 contracts; `nextOpenPlannedAsOf` for list sort.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-09-07T12:51:23Z
- **Completed:** 2026-09-07T12:54:49Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- Flipped UI-00 → positive route exists check; nav order Главная · Счета · Доходы · Долги · Валюты
- Thin `/income` RSC shell with D-11 honesty + E1 «Нет людей» chrome
- Zod create/update schemas for recurring + one-time (dayOfMonth 1/31, empty note → undefined)
- `nextOpenPlannedAsOf` past-unfilled + skip-filled + startAsOf fallback

## Task Commits

1. **Task 1: End-to-end «Доходы» nav + /income shell — flip UI-00** - `918efe6` (feat)
2. **Task 2: Zod income validations (SRC-01, SRC-02)** - `ee6018e` (test) → `9372ccb` (feat)
3. **Task 3: nextOpenPlannedAsOf helper (D-02, D-09, D-10)** - `29057aa` (test) → `f368887` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified

- `src/app/income/page.tsx` — force-dynamic empty shell + honesty + E1 chrome
- `src/components/nav.tsx` / `nav.test.ts` — Доходы after Счета
- `src/lib/validations/income.ts` / `income.test.ts` — SRC-01/02 Zod
- `src/lib/income.ts` / `income.test.ts` — nextOpenPlannedAsOf + UI-01 flip

## Decisions Made

- Empty shell: PersonFormDialog only (no IncomeFormDialog yet)
- Note empty string → undefined via preprocess
- Horizon fully filled → sort fallback `startAsOf` (A3)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Empty note stayed `""` instead of `undefined`**
- **Found during:** Task 2 (Zod income validations)
- **Issue:** `.optional().or(literal(""))` still accepted empty string as value
- **Fix:** `z.preprocess` maps `""` → `undefined` before optional string
- **Files modified:** `src/lib/validations/income.ts`
- **Commit:** `9372ccb`

## TDD Gate Compliance

- RED → GREEN commits present for Task 2 and Task 3
- No unexpected RED pass

## Known Stubs

None — empty shell intentionally omits IncomeList/IncomeFormDialog (Plan 03).

## Threat Flags

None beyond plan threat model (Zod `.strict` + positive major; no new endpoints/actions this plan).

## Self-Check: PENDING
