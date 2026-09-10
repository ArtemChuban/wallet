---
phase: 19-schema-pure-grace-domain-math
plan: 03
subsystem: api
tags: [credit-grace, zod, server-action, dual-dom, CYCLE-01]

requires:
  - phase: 19-schema-pure-grace-domain-math
    provides: Account dual DOM columns + CreditGraceObligation (19-01)
provides:
  - updateGraceScheduleSchema dual-DOM pairing + optional accountType D-02 gate
  - updateGraceSchedule Server Action with FIAT_CREDIT + D-14 OPEN clear guard
  - credit-grace obligation Zod ready for Phase 20 (D-05…D-08, D-13, D-16)
affects:
  - Phase 20 obligation CRUD + schedule UI forms
  - CYCLE-01 write-path consumers

actuals:
  tokens: 4850
  tasks: 2
  commits: 4

tech-stack:
  added: []
  patterns:
    - dual-DOM both-null-or-both Zod refine + assertGraceDomAllowedForType
    - action-level OPEN count guard before schedule clear (D-14)
    - obligation Zod separate from Account DOM write path

key-files:
  created:
    - src/lib/validations/credit-grace.ts
  modified:
    - src/lib/validations/account.ts
    - src/lib/validations/account.test.ts
    - src/app/accounts/actions.ts
    - src/app/accounts/actions.test.ts

key-decisions:
  - "Optional accountType on updateGraceScheduleSchema for Zod-testable ASSET+DOM reject; action gates from DB type"
  - "D-14 OPEN-only clear block; CLOSED history does not block both-null"
  - "Obligation create/update Zod only — no CRUD actions / UI this plan"

patterns-established:
  - "Grace schedule write: FormData → updateGraceScheduleSchema → findUnique type gate → OPEN count on clear → account.update DOM only"
  - "assertAccountHasGraceSchedule documents D-13 for Phase 20 create"

requirements-completed: [CYCLE-01]

coverage:
  - id: D1
    description: Dual-DOM Zod pairing accepts both-set / both-null; rejects partial and out-of-range
    requirement: CYCLE-01
    verification:
      - kind: unit
        ref: src/lib/validations/account.test.ts#updateGraceScheduleSchema
        status: pass
    human_judgment: false
  - id: D2
    description: ASSET/non-FIAT_CREDIT + DOM set rejected at Zod and action layers
    requirement: CYCLE-01
    verification:
      - kind: unit
        ref: src/lib/validations/account.test.ts#rejects ASSET; src/app/accounts/actions.test.ts#D-02
        status: pass
    human_judgment: false
  - id: D3
    description: FIAT_CREDIT persist dual DOM; clear blocked while OPEN; no obligation rewrite
    requirement: CYCLE-01
    verification:
      - kind: unit
        ref: src/app/accounts/actions.test.ts#updateGraceSchedule
        status: pass
    human_judgment: false
  - id: D4
    description: credit-grace Zod encodes amount + OPEN|CLOSED/closedAsOf + D-13/D-16 docs
    requirement: CYCLE-01
    verification:
      - kind: other
        ref: grep closedAsOf src/lib/validations/credit-grace.ts
        status: pass
    human_judgment: false

duration: 2min
completed: 2026-09-09
status: complete
---

# Phase 19 Plan 03: Grace schedule write-path Summary

**CYCLE-01 persist path via updateGraceScheduleSchema + updateGraceSchedule (FIAT_CREDIT dual DOM, D-14 OPEN clear) and Phase-20-ready obligation Zod — no UI chrome.**

## Performance

- **Duration:** 2min
- **Started:** 2026-09-09T09:15:59Z
- **Completed:** 2026-09-09T09:18:23Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Dual-DOM Zod with Russian pairing message + ASSET+DOM reject (D-02/D-03)
- Server Action persists only statementDayOfMonth/dueDayOfMonth; blocks clear while OPEN (D-14); never touches CreditGraceObligation rows (D-04/D-05)
- `credit-grace.ts` create/update schemas + `assertAccountHasGraceSchedule` (D-13) + P2002/D-16 documentation

## Task Commits

1. **Task 1 RED:** `c605fbb` — test(19-03): add failing test for updateGraceScheduleSchema
2. **Task 1 GREEN:** `69614da` — feat(19-03): implement updateGraceScheduleSchema dual-DOM Zod
3. **Task 2 RED:** `aaaa953` — test(19-03): add failing tests for updateGraceSchedule action
4. **Task 2 GREEN:** `3badc92` — feat(19-03): implement updateGraceSchedule + credit-grace Zod

**Plan metadata:** `c44e780` (docs: complete plan)

## Files Created/Modified

| File | Action | Description |
|------|--------|-------------|
| `src/lib/validations/account.ts` | Modified | `updateGraceScheduleSchema`, `assertGraceDomAllowedForType` |
| `src/lib/validations/account.test.ts` | Modified | Dual-DOM + ASSET reject cases |
| `src/lib/validations/credit-grace.ts` | Created | Obligation create/update Zod (D-05…D-08, D-13, D-16) |
| `src/app/accounts/actions.ts` | Modified | `updateGraceSchedule` action |
| `src/app/accounts/actions.test.ts` | Modified | D-02 / D-14 / success mocks |

## Decisions Made

- Optional `accountType` on schedule schema for unit-testable D-02; production gate uses DB `account.type`
- Clear-to-null allowed with zero OPEN (CLOSED-only OK per D-14)
- No form/dialog UI — deferred Phase 20 (A3)

## Deviations from Plan

None - plan executed exactly as written.

## Threat Flags

None beyond plan register (T-19-01…T-19-03 mitigated by Zod + action scope; no snapshot writes).

## Known Stubs

None.

## Verification

```
npx vitest run src/lib/validations/account.test.ts src/app/accounts/actions.test.ts
# PASS (36)
# credit-grace.ts present; closedAsOf + updateGraceSchedule greps OK
```

## Self-Check: PASSED

- credit-grace.ts, 19-03-SUMMARY.md present
- commits c605fbb, 69614da, aaaa953, 3badc92 present
- updateGraceSchedule + closedAsOf greps OK
