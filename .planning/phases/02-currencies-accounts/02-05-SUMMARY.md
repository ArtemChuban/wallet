---
phase: 02-currencies-accounts
plan: 05
subsystem: ui
tags: [react, controlled-input, base-ui, fieldcontrol, dialog, form]

requires:
  - phase: 02-currencies-accounts
    provides: CurrencyFormDialog and AccountFormDialog with formKey remount and Server Action rename flows
provides:
  - Controlled mount-init name fields in CurrencyFormBody and AccountFormBody
  - G-02-1 / G-02-2 FieldControl defaultValue warning code-path closure
affects:
  - 02-currencies-accounts UAT re-check
  - future dialog forms that bind defaultValue to live RSC props

actuals:
  tokens: 392
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - Mount-init useState for dialog name Input; value/onChange; no post-mount prop sync useEffect
    - formKey remount on Dialog open remains the reset path for edit sessions

key-files:
  created: []
  modified:
    - src/components/currencies/CurrencyFormDialog.tsx
    - src/components/accounts/AccountFormDialog.tsx

key-decisions:
  - "Controlled name via useState init at mount; formKey remount refreshes edit session — no useEffect sync from props (would reintroduce revalidatePath race)"
  - "Create and edit both use controlled name binding so control mode never flips"

patterns-established:
  - "Dialog FormBody text fields that receive RSC list props must be controlled when dialog can stay mounted across revalidatePath"
  - "Reset local form state by remounting FormBody (formKey on open), not by syncing props into state"

requirements-completed: [CURR-01, ACCT-01]

coverage:
  - id: D1
    description: CurrencyFormBody name Input controlled from mount-init state (G-02-1)
    requirement: CURR-01
    verification:
      - kind: other
        ref: "grep value={name}/onChange/useState + zero defaultValue in CurrencyFormDialog.tsx"
        status: pass
      - kind: unit
        ref: "npm test -- --run src/app/currencies/actions.test.ts src/lib/validations/currency.test.ts"
        status: pass
    human_judgment: true
    rationale: "Base UI FieldControl console warning on rename requires browser UAT after revalidatePath"
  - id: D2
    description: AccountFormBody name Input controlled from mount-init state (G-02-2)
    requirement: ACCT-01
    verification:
      - kind: other
        ref: "grep value={name}/onChange/useState + zero defaultValue in AccountFormDialog.tsx and CurrencyFormDialog.tsx"
        status: pass
      - kind: unit
        ref: "npm test (full suite, 42 tests)"
        status: pass
    human_judgment: true
    rationale: "Base UI FieldControl console warning on account rename requires browser UAT after revalidatePath"

duration: 1min
completed: 2026-09-03
status: complete
---

# Phase 02 Plan 05: Controlled Name Fields Summary

**Mount-init controlled name Inputs in CurrencyFormDialog and AccountFormDialog close G-02-1/G-02-2 FieldControl defaultValue warnings after revalidatePath**

## Performance

- **Duration:** 1min
- **Started:** 2026-09-02T22:18:55Z
- **Completed:** 2026-09-02T22:19:48Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- CurrencyFormBody name field uses `useState` init + `value`/`onChange` (no `defaultValue`)
- AccountFormBody mirrors the same controlled name pattern
- Full `npm test` green (42); actions/lists untouched

## Task Commits

Each task was committed atomically:

1. **Task 1: End-to-end controlled currency name field (G-02-1)** - `98322cf` (fix)
2. **Task 2: Controlled account name field (G-02-2)** - `1e01c1b` (fix)

**Plan metadata:** (pending docs commit)

_Note: Tracer Task 1 automated verify re-run passed before Task 2 expansion (HUMAN_VERIFY_MODE=end-of-phase)._

## Files Created/Modified
- `src/components/currencies/CurrencyFormDialog.tsx` - Controlled name state in CurrencyFormBody
- `src/components/accounts/AccountFormDialog.tsx` - Controlled name state in AccountFormBody

## Decisions Made
- Controlled name via mount-init `useState`; no post-mount sync `useEffect` from `currency.name` / `account.name` — `formKey` remount on dialog open resets the edit session
- Apply controlled binding for create and edit so Input never starts uncontrolled

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## End-of-phase human check (not blocked in this execute run)

Per plan `<human-check>` and `workflow.human_verify_mode=end-of-phase`:

1. Rename a currency and an account in the app
2. Confirm Browser/Next console shows no Base UI FieldControl uncontrolled default-value warning for CurrencyFormBody or AccountFormBody
3. Confirm names save and dialogs close

Pass: no FieldControl default-value console error; names persist. Fail: warning still appears, or rename fails / dialog stuck open.

## Next Phase Readiness
- G-02-1 and G-02-2 code paths closed; ready for end-of-phase UAT re-check of rename flows
- No blockers for phase verify once human console check passes

---
*Phase: 02-currencies-accounts*
*Completed: 2026-09-03*

## Self-Check: PASSED

- FOUND: 02-05-SUMMARY.md
- FOUND: CurrencyFormDialog.tsx / AccountFormDialog.tsx
- FOUND: commits 98322cf, 1e01c1b
