---
phase: 25-side-ledger-tools-isolation
plan: 04
subsystem: api
tags: [mcp, income, grace, side-ledger, SIDE-02, SIDE-03, vitest, INISO, GRISO, isolation-contract]

requires:
  - phase: 25-side-ledger-tools-isolation
    provides: Wave 0 income/grace stubs + as-of optionalIncomeRangeSchema (25-01); forecast + debts registration patterns (25-02/03)
  - phase: 24-capital-read-tools
    provides: CAP registerTool + minorToJson serialize pattern
provides:
  - list_income MCP tool (page-parity next-open + optional from/to range)
  - list_grace_obligations MCP tool (OPEN+CTA via mergeGraceListRows)
  - isolation-contract never-write / never-actions wall across SIDE MCP sources
  - Full SIDE+CAP create-handler instructions catalog
affects:
  - Phase 26 CLI-01 named DISOL/INISO/GRISO prose + connect docs

actuals:
  tokens: 9209
  tasks: 3
  commits: 5

tech-stack:
  added: []
  patterns:
    - Page-parity income loader: nextOpenPlannedAsOf + isIncomeOverdue; optional paired from/to → listAllInRange
    - Grace loader: FIAT_CREDIT + mergeGraceListRows kind open|cta + isGraceOverdue
    - Shared isolation-contract.test.ts source wall for SIDE tools+reads

key-files:
  created:
    - src/lib/mcp/reads/load-income.ts
    - src/lib/mcp/tools/income.ts
    - src/lib/mcp/reads/load-grace.ts
    - src/lib/mcp/tools/grace.ts
    - src/lib/mcp/isolation-contract.test.ts
  modified:
    - src/lib/mcp/create-handler.ts
    - src/lib/mcp/tools/income.test.ts
    - src/lib/mcp/tools/grace.test.ts

key-decisions:
  - "Default list_income = next_open page parity; range only when both from+to set (A2)"
  - "Grace CTA rows included with kind open|cta; CLOSED omitted"
  - "D-08 one-liners in descriptions + instructions only — no payload meta; no named essay"

patterns-established:
  - "SIDE list tool = page assembler + domain helpers + minorToJson serialize + isolation-contract wall"
  - "Paired optionalIncomeRangeSchema reused for list_income wire validation"

requirements-completed: [SIDE-02, SIDE-03]

coverage:
  - id: D1
    description: list_income returns next-open plan/actual/overdue string minors; optional from+to range dump
    requirement: SIDE-02
    verification:
      - kind: unit
        ref: "npx vitest run src/lib/mcp/tools/income.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: list_grace_obligations returns OPEN+CTA rows with kind + overdue; mergeGraceListRows
    requirement: SIDE-03
    verification:
      - kind: unit
        ref: "npx vitest run src/lib/mcp/tools/grace.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: isolation-contract never-write BalanceSnapshot / never actions; full SIDE catalog instructed
    requirement: SIDE-02
    verification:
      - kind: unit
        ref: "npx vitest run src/lib/mcp/isolation-contract.test.ts src/lib/mcp/"
        status: pass
    human_judgment: false

duration: 5min
completed: 2026-09-10
status: complete
---

# Phase 25 Plan 04: list_income + list_grace + isolation-contract Summary

**SIDE-02/03 live: list_income (page + range) and list_grace_obligations (OPEN+CTA); isolation-contract proves never-write; full MCP catalog instructed.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-09-10T17:52:46Z
- **Completed:** 2026-09-10T17:58:00Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments
- `loadIncome` mirrors income page next-open fold; optional paired from/to → `listAllInRange` + overdue
- `loadGrace` uses `mergeGraceListRows` with kind open|cta and `isGraceOverdue`
- Shared `isolation-contract.test.ts` + finalized create-handler SIDE catalog (D-05…D-08)

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: failing SIDE-02 expects** - `6766b5b` (test)
2. **Task 1 GREEN: list_income page-parity tool** - `359db9d` (feat)
3. **Task 2 RED: failing SIDE-03 expects** - `15d5810` (test)
4. **Task 2 GREEN: list_grace_obligations tool** - `886389c` (feat)
5. **Task 3: isolation-contract + catalog finalize** - `d40df9b` (test)

**Plan metadata:** `7b7457f` (docs: complete plan)

## Files Created/Modified
- `src/lib/mcp/reads/load-income.ts` — next-open + range serialize/load
- `src/lib/mcp/tools/income.ts` — registerListIncome + D-08 Доходы one-liner
- `src/lib/mcp/reads/load-grace.ts` — mergeGraceListRows assemble + serialize
- `src/lib/mcp/tools/grace.ts` — registerListGraceObligations + D-08 Грейс one-liner
- `src/lib/mcp/isolation-contract.test.ts` — D-05 never-write / never-actions + catalog asserts
- `src/lib/mcp/create-handler.ts` — register income+grace; full SIDE+CAP instructions
- `src/lib/mcp/tools/income.test.ts` / `grace.test.ts` — Wave 0 todos → green contracts

## Decisions Made
- Default income mode `next_open`; range mode only when both from+to present (A2 / Plan 01 schema)
- Grace accounts without dual-DOM schedule omitted (dialog hasSchedule parity)
- Named DISOL/INISO/GRISO essay deferred Phase 26 — isolation-contract is source wall only

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 25 SIDE tools complete (SIDE-01…04). Ready for Phase 26 CLI isolation prose + connect docs. Full mcp + disol/iniso/griso + route suite green (75 passed).

## Self-Check: PASSED

- FOUND: load-income.ts, income.ts, load-grace.ts, grace.ts, isolation-contract.test.ts
- FOUND commits: 6766b5b, 359db9d, 15d5810, 886389c, d40df9b

---
*Phase: 25-side-ledger-tools-isolation*
*Completed: 2026-09-10*
