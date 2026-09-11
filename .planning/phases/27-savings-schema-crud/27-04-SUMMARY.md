---
phase: 27-savings-schema-crud
plan: 04
subsystem: ui
tags: [savings, accrual-display, AccountList, BalanceSnapshot, D-16]

requires:
  - phase: 27-02
    provides: SAVINGS schema + create path + annualRateBps/DOM columns
  - phase: 27-03
    provides: page/list serialize annualRateBps+DOM for edit prefill
provides:
  - nextAccrualAsOf + formatAccrualCountdown display helpers
  - AccountList SAVINGS secondary rate% + сегодня|через N дн.
  - D-16 SAVINGS upsertBalanceSnapshot regression coverage
affects:
  - Phase 28 interest ÷12 forecast overlay
  - Phases 29–30 SAVISO / MCP

actuals:
  tokens: 1603
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - Display-only accrual countdown reuses clampDayOfMonth + injected Moscow today
    - List secondary joins type · CCY · rate% · countdown — never raw DOM
    - Manual upsertBalanceSnapshot treats SAVINGS as non-credit ≥0 asset path

key-files:
  created:
    - src/lib/savings-accrual-display.ts
  modified:
    - src/components/accounts/AccountList.tsx
    - src/app/accounts/actions.test.ts

key-decisions:
  - "formatAccrualCountdown(today, nextAsOf) two-arg; days via UTC calendar delta"
  - "page.tsx already serialized rate/DOM in 27-03 — Task 2 only wired list secondary"
  - "No interest ÷12 / ForecastSlotKind / auto snapshot writer (Phases 28–30)"

patterns-established:
  - "SAVINGS list meta: Накопительный · CCY · {bps}% · сегодня|через N дн. (D-11/D-12)"
  - "Accrual helpers stay Prisma-free display-only (D-16)"

requirements-completed: [ACCT-02, ACCT-03]

coverage:
  - id: D1
    description: nextAccrualAsOf clamps Feb-31; formatAccrualCountdown сегодня / через N дн.
    requirement: ACCT-03
    verification:
      - kind: unit
        ref: "npx vitest run src/lib/savings-accrual-display.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: AccountList SAVINGS secondary shows rate% + countdown not raw DOM
    requirement: ACCT-03
    verification:
      - kind: unit
        ref: "grep formatAccrualCountdown|formatBpsToPercentMajor AccountList.tsx; account-type tests"
        status: pass
    human_judgment: false
  - id: D3
    description: Manual upsertBalanceSnapshot accepts SAVINGS ≥0 like ASSET; metadata create/update skip snapshots
    requirement: ACCT-02
    verification:
      - kind: unit
        ref: "npx vitest run src/app/accounts/actions.test.ts — upsertBalanceSnapshot SAVINGS (D-16)"
        status: pass
    human_judgment: false
  - id: D4
    description: Full suite green as phase gate sampling
    requirement: ACCT-02
    verification:
      - kind: unit
        ref: "npm test (585 passed)"
        status: pass
    human_judgment: false

duration: 3min
completed: 2026-09-11
status: complete
---

# Phase 27 Plan 04: list rate% + days-until + D-16 snapshot Summary

**SAVINGS list secondary shows rate% + «сегодня»/«через N дн.» via display helpers; manual BalanceSnapshot upsert proven for SAVINGS (D-16).**

## Performance

- **Duration:** 3 min
- **Started:** 2026-09-11T16:25:29Z
- **Completed:** 2026-09-11T16:27:54Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- `savings-accrual-display.ts`: `nextAccrualAsOf` + `formatAccrualCountdown` (clamp + RU chrome)
- AccountList SAVINGS secondary: type · CCY · `{bps}%` · countdown — no raw DOM
- D-16 tests: SAVINGS upsert happy/negative; create/update metadata still skip snapshots; `npm test` 585 green

## Task Commits

1. **Task 1: Display-only next accrual + countdown helpers** - `8178a14` (feat)
2. **Task 2: AccountList secondary + page serialize rate/DOM/today** - `8f6b487` (feat)
3. **Task 3: D-16 manual snapshot path for SAVINGS unchanged** - `0d5db9c` (test)

**Plan metadata:** (pending docs commit)

## Files Created/Modified

- `src/lib/savings-accrual-display.ts` - nextAccrualAsOf + formatAccrualCountdown (display-only)
- `src/components/accounts/AccountList.tsx` - SAVINGS rate% + countdown secondary segments
- `src/app/accounts/actions.test.ts` - SAVINGS upsertBalanceSnapshot + create no-snapshot assert

## Decisions Made

- Kept Wave 0 `formatAccrualCountdown(today, nextAsOf)` signature; N = UTC calendar-day delta
- Skipped page.tsx edits — 27-03 already serializes `annualRateBps` / `accrualDayOfMonth` and passes Moscow `today`
- No interest amount math, ForecastSlotKind, or auto interest writer

## Deviations from Plan

### Auto-fixed Issues

None - plan executed as written (page serialize already present from 27-03; Task 2 focused on list wire-up).

## Threat Flags

None — no new endpoints; T-27-05 mitigated by tests asserting metadata paths skip BalanceSnapshot and upsert remains manual-only.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: `src/lib/savings-accrual-display.ts`
- FOUND: `src/components/accounts/AccountList.tsx`
- FOUND: commits `8178a14`, `8f6b487`, `0d5db9c`
