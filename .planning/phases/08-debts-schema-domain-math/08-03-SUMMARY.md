---
phase: 08-debts-schema-domain-math
plan: 03
subsystem: validation
tags: [debts, zod, vitest, asOfDate, DEBT-03]

requires:
  - phase: 08-debts-schema-domain-math
    provides: DebtDirection enums + debts.ts domain asserts (08-01/08-02)
  - phase: 03-dated-balance-snapshots
    provides: asOfDate YYYY-MM-DD Zod + Russian «Укажите дату» (balance.ts)
  - phase: 02-currencies-accounts
    provides: positive-major helper pattern (account.ts)
provides:
  - createPersonSchema / renamePersonSchema
  - createDebtSchema / updateDebtMetaSchema (no initial mutation)
  - createRepaymentSchema / createSizeChangeSchema
affects:
  - Phase 9 debts CRUD Server Actions
  - Phase 10 repayment / size-change actions

actuals:
  tokens: 2620
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - Zod .strict() shape-only contracts; remaining rules stay in debts.ts
    - asOfDate regex + Укажите дату mirrored from balance.ts
    - positive major via isStrictlyPositiveMajor; signed delta empty-reject only

key-files:
  created:
    - src/lib/validations/debts.ts
    - src/lib/validations/debts.test.ts
  modified: []

key-decisions:
  - "updateDebtMetaSchema omits all initial* fields; .strict() rejects smuggled initialAmountMajor"
  - "createSizeChangeSchema accepts signed deltaMajor strings; zero-delta deferred to assertSizeDelta"

patterns-established:
  - "Pattern: debts validations mirror balance asOfDate + account positive-major helpers"
  - "Pattern: DEBT-03 enforced at Zod layer by field omission, not runtime assert alone"

requirements-completed: [DEBT-03, DISOL-01]

coverage:
  - id: D1
    description: createDebtSchema accepts positive initial major + I_OWE|THEY_OWE; rejects non-positive
    requirement: DEBT-03
    verification:
      - kind: unit
        ref: src/lib/validations/debts.test.ts#createDebtSchema (DEBT-03)
        status: pass
    human_judgment: false
  - id: D2
    description: updateDebtMetaSchema has no initial-amount keys; .strict() rejects them
    requirement: DEBT-03
    verification:
      - kind: unit
        ref: src/lib/validations/debts.test.ts#updateDebtMetaSchema (DEBT-03 / D-03)
        status: pass
    human_judgment: false
  - id: D3
    description: repayment/size-change require asOfDate; malformed yields Укажите дату
    requirement: DEBT-03
    verification:
      - kind: unit
        ref: src/lib/validations/debts.test.ts#createRepaymentSchema / createSizeChangeSchema
        status: pass
    human_judgment: false
  - id: D4
    description: Full suite green including DISOL-01 isolation scan
    requirement: DISOL-01
    verification:
      - kind: unit
        ref: npm test (196 tests / 21 files)
        status: pass
    human_judgment: false

duration: 2min
completed: 2026-09-04
status: complete
---

# Phase 08 Plan 03: Debts schema + domain math Summary

**Thin Phase-9-ready Zod contracts for person/debt/repayment/size-change with DEBT-03 initial-immutability at the schema layer and Russian asOfDate messages; full Vitest suite including DISOL-01 stays green.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-09-04T16:20:11Z
- **Completed:** 2026-09-04T16:21:50Z
- **Tasks:** 2/2
- **Files modified:** 2

## Accomplishments

- Authored Wave 0 Zod tests covering person name, debt create/meta, repayment, size-change
- Implemented `src/lib/validations/debts.ts` with `.strict()` schemas; no remaining/over-repay in Zod
- `updateDebtMetaSchema` has no `initialAmount*` fields (DEBT-03 / D-03)
- Full `npm test`: 196 passed / 21 files (DISOL-01 intact)

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Wave 0 red Zod tests for debts validations | c38b917 | src/lib/validations/debts.test.ts |
| 2 | Implement validations/debts.ts and green full suite | 16a24c5 | src/lib/validations/debts.ts |

## Decisions Made

- Size-change Zod rejects empty delta only; domain `assertSizeDelta` still owns zero-delta
- Optional `dueDate` / `note` on create + meta; empty dueDate string treated as absent

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None — surface matches plan threat model (T-08-01, T-08-07, T-08-04 mitigated; no new packages).

## Self-Check: PASSED

- FOUND: src/lib/validations/debts.ts
- FOUND: src/lib/validations/debts.test.ts
- FOUND: c38b917
- FOUND: 16a24c5
