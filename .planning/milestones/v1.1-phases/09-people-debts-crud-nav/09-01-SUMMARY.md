---
phase: 09-people-debts-crud-nav
plan: 01
subsystem: ui
tags: [nextjs, server-actions, prisma, shadcn, vitest, debts, nav]

requires:
  - phase: 08-debts-schema-domain-math
    provides: Person model, createPersonSchema, DISOL isolation suite
provides:
  - Nav «Долги» peer link at /debts (DNAV-01)
  - createPerson Server Action with P2002 Russian field error
  - /debts RSC page with PersonFormDialog + DebtsList empty/list shell
affects:
  - 09-02 person rename/delete
  - 09-03 debt CRUD UI

actuals:
  tokens: 2846
  tasks: 3
  commits: 2

tech-stack:
  added: []
  patterns:
    - debts Server Actions mirror accounts (ensureSqlitePragmas + Zod + P2002 map)
    - PersonFormDialog formKey remount + useActionState
    - Nav source-file DNAV assertions (readFileSync)

key-files:
  created:
    - src/app/debts/actions.ts
    - src/app/debts/actions.test.ts
    - src/app/debts/page.tsx
    - src/components/debts/PersonFormDialog.tsx
    - src/components/debts/DebtsList.tsx
    - src/components/nav.test.ts
  modified:
    - src/components/nav.tsx

key-decisions:
  - "Duplicate person name P2002 copy: «Человек с таким именем уже есть» (parallel to account unique copy)"
  - "PersonFormDialog create-only this plan; rename deferred to 09-02"
  - "DebtsList lists person names only; nested debt rows deferred to Plan 03"
  - "revalidatePath('/debts') only — never touch dashboard /"

patterns-established:
  - "Debts actions: createPersonSchema.safeParse → ensureSqlitePragmas → prisma.person.create → revalidatePath(/debts)"
  - "Empty people state: «Нет людей» + UI-SPEC helper body + PersonFormDialog CTA"

requirements-completed: [PERSON-01, DNAV-01]

coverage:
  - id: D1
    description: Nav order Главная · Счета · Долги · Валюты with «Долги» href /debts
    requirement: DNAV-01
    verification:
      - kind: unit
        ref: src/components/nav.test.ts#orders Главная · Счета · Долги · Валюты with correct hrefs
        status: pass
    human_judgment: false
  - id: D2
    description: createPerson persists trimmed name and revalidates /debts only
    requirement: PERSON-01
    verification:
      - kind: unit
        ref: src/app/debts/actions.test.ts#validates, creates trimmed name, revalidates /debts only
        status: pass
    human_judgment: false
  - id: D3
    description: createPerson maps P2002 unique name to Russian field error
    requirement: PERSON-01
    verification:
      - kind: unit
        ref: src/app/debts/actions.test.ts#maps P2002 unique name to Russian field error
        status: pass
    human_judgment: false
  - id: D4
    description: Zero people empty state «Нет людей» with UI-SPEC helper copy
    requirement: PERSON-01
    verification:
      - kind: other
        ref: grep 'Нет людей' src/components/debts/DebtsList.tsx
        status: pass
    human_judgment: true
    rationale: Visual chrome and CTA placement need human confirm on /debts
  - id: D5
    description: DISOL-01 isolation preserved (no debt imports into NW modules)
    verification:
      - kind: unit
        ref: src/lib/debts.test.ts
        status: pass
    human_judgment: false

duration: 3min
completed: 2026-09-04
status: complete
---

# Phase 09 Plan 01: People + debts CRUD nav tracer Summary

**Nav «Долги» → `/debts` RSC → `createPerson` → listed people (or «Нет людей» empty), with Wave 0 vitest green.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-09-04T21:22:12Z
- **Completed:** 2026-09-04T21:24:45Z
- **Tasks:** 3/3
- **Files modified:** 7

## Accomplishments

- DNAV-01: peer nav link «Долги» at `/debts` in order Главная · Счета · Долги · Валюты
- PERSON-01 tracer: `createPerson` Server Action + create dialog + A–Z name list / empty state
- Phase 8 DISOL isolation suite still green; no debt imports into net-worth / historical-series / app/page

## Task Commits

Each task was committed atomically:

1. **Task 1: Wave 0 red createPerson + DNAV-01 nav tests** - `a729bd4` (test)
2. **Task 2: End-to-end «Долги» nav → /debts → create person → list** - `c30b1eb` (feat)
3. **Task 3: Keep DISOL isolation + debts suite green** - verification only (no code changes; suites passed)

**Plan metadata:** `dd88ed1` (docs: complete plan)

## Files Created/Modified

- `src/components/nav.tsx` - Reordered links; added «Долги» → `/debts`
- `src/components/nav.test.ts` - DNAV-01 href/label order source assertions
- `src/app/debts/actions.ts` - `createPerson` with Zod + P2002 map + revalidate `/debts`
- `src/app/debts/actions.test.ts` - createPerson success + unique-name Russian error
- `src/app/debts/page.tsx` - force-dynamic RSC page loading people A–Z
- `src/components/debts/PersonFormDialog.tsx` - create-person Dialog (RU chrome)
- `src/components/debts/DebtsList.tsx` - «Нет людей» empty + name list shell

## Decisions Made

- P2002 Russian copy: «Человек с таким именем уже есть» (account-parallel; UI-SPEC left wording to discretion)
- Create-only PersonFormDialog this plan; rename/delete and debt rows deferred
- Header dual «Новый долг» CTA deferred to Plan 02/03 per plan scope

## Deviations from Plan

None - plan executed exactly as written.

## TDD Gate Compliance

- RED: `a729bd4` test(09-01) — createPerson + nav tests failing before tracer
- GREEN: `c30b1eb` feat(09-01) — tracer implementation; vitest exit 0

## Known Stubs

None that block plan 01 goal. Rename/delete and nested debt rows intentionally deferred to later plans.

## Threat Flags

None — createPerson surface matches plan threat model (T-09-01, T-09-02 mitigated).

## Self-Check: PASSED

- FOUND: src/app/debts/actions.ts, page.tsx, PersonFormDialog.tsx, DebtsList.tsx, actions.test.ts, nav.test.ts
- FOUND: commits a729bd4, c30b1eb
- FOUND: nav `/debts` + «Долги»; DebtsList «Нет людей»
