---
phase: 31-asset-savings-type-conversion
plan: 02
subsystem: ui
tags: [AccountFormDialog, Select, ASSET, SAVINGS, ACCT-04, vitest, UAT, orca]

requires:
  - phase: 31-asset-savings-type-conversion
    provides: updateAccount ASSET↔SAVINGS matrix (31-01)
provides:
  - Edit type Select unlock for exact ASSET|SAVINGS (canConvertType)
  - Draft showSavingsFields + leave-SAVINGS clear rate/DOM
  - Split DialogDescription convertible vs locked
  - Source-scan locks + 31-UAT.md Orca scaffold
affects:
  - gsd-verify-work Phase 31 UAT

actuals:
  tokens: 2272
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - "canConvertType exact ASSET||SAVINGS peer check (never isAssetType)"
    - "CONVERT_TYPE_OPTIONS separate from create TYPE_OPTIONS"
    - "showSavingsFields = accountType === SAVINGS in create and edit"

key-files:
  created:
    - .planning/phases/31-asset-savings-type-conversion/31-UAT.md
  modified:
    - src/components/accounts/AccountFormDialog.tsx
    - src/components/accounts/AccountFormDialog.test.ts

key-decisions:
  - "Shared Select branch for create and canConvertType edit; options list switches TYPE vs CONVERT"
  - "UAT scaffold status pending — human_verify_mode end-of-phase defer to verify-work"

patterns-established:
  - "Pattern: edit unlock = exact enum peers + CONVERT_TYPE_OPTIONS without FIAT_CREDIT"
  - "Pattern: source-scan locks for dialog contracts (readFileSync dialogSrc)"

requirements-completed: [ACCT-04]

coverage:
  - id: D1
    description: "Edit ASSET|SAVINGS shows type Select with only Актив/Накопительный; description Валюта не меняется."
    requirement: ACCT-04
    verification:
      - kind: unit
        ref: src/components/accounts/AccountFormDialog.test.ts#canConvertType uses exact ASSET|SAVINGS
        status: pass
      - kind: unit
        ref: src/components/accounts/AccountFormDialog.test.ts#CONVERT_TYPE_OPTIONS is ASSET+SAVINGS only
        status: pass
    human_judgment: false
  - id: D2
    description: "Draft showSavingsFields keys off accountType === SAVINGS; leave SAVINGS clears rate/DOM"
    requirement: ACCT-04
    verification:
      - kind: unit
        ref: src/components/accounts/AccountFormDialog.test.ts#showSavingsFields keys off draft
        status: pass
      - kind: unit
        ref: src/components/accounts/AccountFormDialog.test.ts#leave-SAVINGS onValueChange clears
        status: pass
    human_judgment: false
  - id: D3
    description: "FIAT_CREDIT/legacy stay muted label; create TYPE_OPTIONS still includes FIAT_CREDIT"
    requirement: ACCT-04
    verification:
      - kind: unit
        ref: src/components/accounts/AccountFormDialog.test.ts#create TYPE_OPTIONS still includes FIAT_CREDIT
        status: pass
    human_judgment: false
  - id: D4
    description: "Agent-driven Orca UAT both convert directions, locked types, BalanceSnapshot isolation"
    requirement: ACCT-04
    verification: []
    human_judgment: true
    rationale: "Live UI + sqlite snapshot count require Orca verify-work per OPERATOR; scaffold pending"

duration: 3min
completed: 2026-09-22
status: complete
---

# Phase 31 Plan 02: AccountFormDialog type unlock Summary

**Edit dialog unlocks ASSET↔SAVINGS Select with draft rate/DOM gate, split RU description, source-scan locks, and pending Orca UAT scaffold.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-09-22T12:34:44Z
- **Completed:** 2026-09-22T12:37:30Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- `canConvertType` exact peer unlock + `CONVERT_TYPE_OPTIONS` (no FIAT_CREDIT)
- Draft `showSavingsFields` + leave-SAVINGS clear; convertible copy «Валюта не меняется.»
- Source-scan vitest locks green; `31-UAT.md` pending for verify-work

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: failing source-scan locks** - `8676959` (test)
2. **Task 1 GREEN: unlock edit type Select** - `d23667a` (feat)
3. **Task 2: create-option locks + UAT scaffold** - `63e06f7` (test)

**Plan metadata:** (pending docs commit)

_Note: TDD tasks may have multiple commits (test → feat → refactor)_

## Files Created/Modified
- `src/components/accounts/AccountFormDialog.tsx` - Edit type unlock, draft gate, description split
- `src/components/accounts/AccountFormDialog.test.ts` - Source-scan locks for ACCT-04 UI contracts
- `.planning/phases/31-asset-savings-type-conversion/31-UAT.md` - Agent-driven Orca checklist (pending)

## Decisions Made
- Shared create/convert Select control; option list switches on `mode === "create"` vs `CONVERT_TYPE_OPTIONS`
- No blocking human-verify checkpoint — UAT deferred to end-of-phase verify-work (OPERATOR)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Server (31-01) + UI (31-02) ready for `/gsd-verify-work` against `31-UAT.md`
- ACCT-04 marked complete at requirements level when plan docs commit lands

## Self-Check: PASSED

- FOUND: src/components/accounts/AccountFormDialog.tsx
- FOUND: src/components/accounts/AccountFormDialog.test.ts
- FOUND: .planning/phases/31-asset-savings-type-conversion/31-UAT.md
- FOUND: 8676959, d23667a, 63e06f7

---
*Phase: 31-asset-savings-type-conversion*
*Completed: 2026-09-22*
