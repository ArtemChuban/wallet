---
phase: 25-side-ledger-tools-isolation
plan: 03
subsystem: api
tags: [mcp, debts, side-ledger, SIDE-01, vitest, DISOL, computeDebtPrimaryTotals]

requires:
  - phase: 25-side-ledger-tools-isolation
    provides: Wave 0 debts.test stub + disol MCP walls (25-01); get_forecast_overlay registration pattern (25-02)
  - phase: 24-capital-read-tools
    provides: CAP registerTool + minorToJson serialize pattern
provides:
  - list_debts MCP tool with OPEN default + includeClosed
  - loadDebts + serializeDebtsPayload + filterDebtsForList
  - Colocated primary totals (iOwe / theyOwe / isPartial) in list_debts payload
affects:
  - 25-04 list_income / list_grace_obligations + full SIDE catalog instructions
  - Phase 26 CLI isolation prose (DISOL-01 named copy)

actuals:
  tokens: 4774
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - Page-parity MCP loader: Person/Debt prisma batch → remainingMinor + computeDebtPrimaryTotals → serialize
    - Pure filterDebtsForList + serializeDebtsPayload for SQLite-free SIDE-01 tests
    - Thin DISOL MCP contract: NW CAP JSON never carries iOwe/theyOwe/people debts keys

key-files:
  created:
    - src/lib/mcp/reads/load-debts.ts
    - src/lib/mcp/tools/debts.ts
  modified:
    - src/lib/mcp/create-handler.ts
    - src/lib/mcp/tools/debts.test.ts

key-decisions:
  - "Totals colocated in list_debts (no get_debt_totals tool)"
  - "Default OPEN filter via filterDebtsForList; includeClosed optional widen"
  - "D-08 isolation one-liner in LIST_DEBTS_DESCRIPTION only — no payload meta flags"

patterns-established:
  - "SIDE list tool = page assembler + domain helpers + minorToJson serialize"
  - "DISOL thin MCP contract asserts on serializeNetWorthPayload keys alongside disol import walls"

requirements-completed: [SIDE-01]

coverage:
  - id: D1
    description: list_debts registered with readOnlyHint; OPEN list + colocated primary totals
    requirement: SIDE-01
    verification:
      - kind: unit
        ref: "npx vitest run src/lib/mcp/tools/debts.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: Serialized remaining/totals minors are strings; OPEN default; includeClosed widens
    requirement: SIDE-01
    verification:
      - kind: unit
        ref: "src/lib/mcp/tools/debts.test.ts#returns debt rows with remaining/totals"
        status: pass
    human_judgment: false
  - id: D3
    description: NW CAP payloads never include Долги ledger fields; disol MCP walls hold
    requirement: SIDE-01
    verification:
      - kind: unit
        ref: "npx vitest run src/lib/mcp/tools/debts.test.ts src/lib/disol.test.ts src/lib/mcp/tools/net-worth.test.ts"
        status: pass
    human_judgment: false

duration: 4min
completed: 2026-09-10
status: complete
---

# Phase 25 Plan 03: list_debts SIDE-01 Summary

**Долги MCP live: list_debts returns OPEN debts + colocated primary totals as string minors; DISOL NW walls green.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-09-10T17:44:30Z
- **Completed:** 2026-09-10T17:48:11Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- `loadDebts` mirrors debts page: remainingMinor + assertStatusSynced + computeDebtPrimaryTotals + FX LOCF ≤ today
- `registerListDebts` with readOnlyHint, D-08 Долги one-liner, optional includeClosed
- Adapter + thin DISOL contract tests green; CAP NW regression untouched

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: failing SIDE-01 expects** - `4b0576a` (test)
2. **Task 1 GREEN: list_debts page-parity tool** - `ce06aad` (feat)
3. **Task 2: Green SIDE-01 + DISOL contract** - `5946204` (test)

**Plan metadata:** `fe6f324` (docs: complete plan)

## Files Created/Modified
- `src/lib/mcp/reads/load-debts.ts` — loader + filter + serialize + colocated totals
- `src/lib/mcp/tools/debts.ts` — registerListDebts + LIST_DEBTS_DESCRIPTION
- `src/lib/mcp/create-handler.ts` — register list_debts; instructions past list-tools-next wall for debts
- `src/lib/mcp/tools/debts.test.ts` — SIDE-01 serialize/OPEN/DISOL + D-08 description

## Decisions Made
- Totals live inside list_debts payload (SIDE discretion / RESEARCH A1)
- People with zero debts after OPEN filter dropped from list
- Instructions name list_debts now; income/grace remain “next” for Plan 04

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None — list_debts localhost read path covered by plan T-25-09/T-25-10; DISOL walls unchanged for NW paths.

## Self-Check: PASSED

- FOUND: src/lib/mcp/reads/load-debts.ts
- FOUND: src/lib/mcp/tools/debts.ts
- FOUND: src/lib/mcp/create-handler.ts (registerListDebts)
- FOUND: 4b0576a, ce06aad, 5946204
