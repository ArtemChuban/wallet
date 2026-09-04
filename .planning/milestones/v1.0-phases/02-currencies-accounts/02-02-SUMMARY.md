---
phase: 02-currencies-accounts
plan: 02
subsystem: ui
tags: [nextjs, server-actions, shadcn, zod, currencies, useActionState]

requires:
  - phase: 02-currencies-accounts
    provides: Currency.isPrimary, RUB seed, createCurrencySchema / updateCurrencyNameSchema
provides:
  - createCurrency / updateCurrencyName Server Actions
  - /currencies RSC list + Russian Dialog create/edit
  - Top nav Готовность · Валюты · Счета
  - shadcn dialog/input/label/select primitives
affects: [02-03 accounts UI, 02-04 immutability hardening]

actuals:
  tokens: 4312
  tasks: 2
  commits: 2

tech-stack:
  added: [shadcn dialog, input, label, select]
  patterns:
    - Server Action + Zod safeParse + useActionState fieldErrors
    - Hardcoded isPrimary false on create; name-only update
    - Remount Dialog form body on open to clear stale success state

key-files:
  created:
    - src/app/currencies/actions.ts
    - src/app/currencies/page.tsx
    - src/components/currencies/CurrencyFormDialog.tsx
    - src/components/currencies/CurrencyList.tsx
    - src/components/nav.tsx
    - src/components/ui/dialog.tsx
    - src/components/ui/input.tsx
    - src/components/ui/label.tsx
    - src/components/ui/select.tsx
  modified:
    - src/app/layout.tsx

key-decisions:
  - "Used Select for create scale 0–18 with hidden FormData field"
  - "Remount CurrencyFormBody on Dialog open so useActionState success does not stick"

patterns-established:
  - "Currency mutations: Zod → ensureSqlitePragmas → prisma → revalidatePath('/currencies')"
  - "Primary CTA default Button; row edit outline/ghost only"
  - "Top Nav client component with pathname active underline"

requirements-completed: [CURR-01]

coverage:
  - id: D1
    description: createCurrency / updateCurrencyName Server Actions with isPrimary false and name-only update
    requirement: CURR-01
    verification:
      - kind: other
        ref: "grep createCurrency|updateCurrencyName|isPrimary: false src/app/currencies/actions.ts"
        status: pass
      - kind: unit
        ref: "src/lib/validations/currency.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: /currencies RSC list ordered by code with Russian empty state and Основная badge
    requirement: CURR-01
    verification:
      - kind: other
        ref: "test -f src/app/currencies/page.tsx; grep Основная|isPrimary CurrencyList"
        status: pass
    human_judgment: true
    rationale: "Browser visual check of list/empty/badge layout deferred to end-of-phase UAT"
  - id: D3
    description: CurrencyFormDialog create/edit with pending-disabled CTA and outline row edit
    requirement: CURR-01
    verification:
      - kind: other
        ref: "grep useActionState|isPending|Добавить валюту|variant outline CurrencyFormDialog"
        status: pass
    human_judgment: true
    rationale: "Dialog open/pending UX needs human interaction in browser"
  - id: D4
    description: Top nav links to /currencies and /accounts with Russian labels
    requirement: CURR-01
    verification:
      - kind: other
        ref: "grep /currencies|/accounts|Валюты|Счета src/components/nav.tsx"
        status: pass
    human_judgment: false

duration: 4min
completed: 2026-09-02
status: complete
---

# Phase 02 Plan 02: Currencies UI Summary

**Russian `/currencies` Dialog CRUD via Server Actions + Zod, shadcn primitives, and top nav (Готовность · Валюты · Счета)**

## Performance

- **Duration:** 4 min
- **Started:** 2026-09-02T20:15:51Z
- **Completed:** 2026-09-02T20:19:53Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- Wired `createCurrency` / `updateCurrencyName` with Zod, hardcoded `isPrimary: false`, name-only updates, duplicate-code Russian error
- Shipped `/currencies` force-dynamic RSC list (code asc) with empty state and «Основная» badge
- Client Dialog create (code/name/scale) and edit (name only); pending disables CTA until success
- Top nav in root layout; official shadcn dialog/input/label/select installed

## Task Commits

Each task was committed atomically:

1. **Task 1: End-to-end create secondary currency via Dialog + nav** - `f1148c1` (feat)
2. **Task 2: Currency Dialog pending UX + list chrome polish** - `7603cb8` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified

- `src/app/currencies/actions.ts` - create/update Server Actions
- `src/app/currencies/page.tsx` - Russian currencies RSC page
- `src/components/currencies/CurrencyFormDialog.tsx` - create/edit Dialog + useActionState
- `src/components/currencies/CurrencyList.tsx` - list, empty state, badge, truncate
- `src/components/nav.tsx` - top nav links
- `src/app/layout.tsx` - mount Nav above children
- `src/components/ui/{dialog,input,label,select}.tsx` - shadcn CLI primitives

## Decisions Made

- Scale on create uses Select 0–18 + hidden `name="scale"` input for FormData
- Remount form body when Dialog opens so prior `success` does not instantly re-close

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Stale useActionState success closed Dialog on reopen**
- **Found during:** Task 2 (pending UX polish)
- **Issue:** After successful submit, `state.success` stayed true; reopening Dialog fired close effect immediately
- **Fix:** Extract `CurrencyFormBody` with `useActionState`; remount via `formKey` on each open
- **Files modified:** `src/components/currencies/CurrencyFormDialog.tsx`
- **Verification:** tsc clean; pending/outline greps pass
- **Committed in:** `7603cb8` (Task 2)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Correctness fix only; no scope creep

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CURR-01 UI path ready for Plan 03 accounts (nav `/accounts` stub already linked)
- Visual Dialog/list UAT deferred to end-of-phase human verify

## Self-Check: PASSED

- Key files present: page, actions, nav, dialog, CurrencyFormDialog, CurrencyList
- Commits `f1148c1`, `7603cb8` present in git log
- Automated verify + currency unit tests green

---
*Phase: 02-currencies-accounts*
*Completed: 2026-09-02*
