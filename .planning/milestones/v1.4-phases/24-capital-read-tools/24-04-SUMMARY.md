---
phase: 24-capital-read-tools
plan: 04
subsystem: api
tags: [mcp, list_fx_rates, LOCF, rateScale, readOnlyHint, D-15, vitest]

requires:
  - phase: 24-capital-read-tools
    provides: CAP-01/02/03 tools + serialize/as-of + createWalletMcpHandler
  - phase: 23-mcp-host-localhost-safety
    provides: wallet_ping + localhost guard
provides:
  - registerListFxRates (CAP-04 LOCF transparency snapshot)
  - loadFxRatesAsOf + assembleFxRatesPayload
  - Finalized D-15 capital-era server instructions
affects:
  - Phase 25 side-ledger MCP tools

actuals:
  tokens: 3846
  tasks: 2
  commits: 3

tech-stack:
  added: []
  patterns:
    - Pure assembleFxRatesPayload for SQLite-free CAP-04 tests
    - Missing LOCF keeps currency with null asOfDate/rateToPrimaryScaled
    - list_fx_rates description bans agent convert (T-24-02)

key-files:
  created:
    - src/lib/mcp/reads/load-fx-rates-asof.ts
    - src/lib/mcp/tools/fx.ts
  modified:
    - src/lib/mcp/tools/fx.test.ts
    - src/lib/mcp/create-handler.ts
    - .planning/phases/24-capital-read-tools/24-VALIDATION.md

key-decisions:
  - "Missing LOCF row includes currency with null rate fields (honesty)"
  - "Export LIST_FX_RATES_DESCRIPTION for description contract tests"
  - "D-15 instructions name full CAP catalog + ping; no convert API"

patterns-established:
  - "FX LOCF assembler mirrors rates page firstHitLocfMap path"
  - "CAP tools mirror wallet-ping registerTool + JSON text content"

requirements-completed: [CAP-04]

coverage:
  - id: D1
    description: list_fx_rates returns as-of LOCF primary↔other rates with rateScale 8 and string rateToPrimaryScaled
    requirement: CAP-04
    verification:
      - kind: other
        ref: "test -f load-fx-rates-asof.ts && grep list_fx_rates fx.ts"
        status: pass
      - kind: unit
        ref: "src/lib/mcp/tools/fx.test.ts#returns LOCF rates ≤ asOf with rateScale 8 string minors"
        status: pass
      - kind: unit
        ref: "src/lib/mcp/tools/fx.test.ts#empty currencies returns success with empty rates array"
        status: pass
    human_judgment: false
  - id: D2
    description: Optional currencyCode filter; omitted asOf uses resolveAsOf; description forbids agent conversion
    requirement: CAP-04
    verification:
      - kind: unit
        ref: "src/lib/mcp/tools/fx.test.ts#optional currencyCode filter narrows rates list"
        status: pass
      - kind: unit
        ref: "src/lib/mcp/tools/fx.test.ts#tool description forbids agent-side conversion"
        status: pass
      - kind: unit
        ref: "src/lib/mcp/tools/fx.test.ts#omitted asOf defaults via resolveAsOf"
        status: pass
      - kind: other
        ref: "grep readOnlyHint src/lib/mcp/tools/fx.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: Four CAP tools + wallet_ping registered; D-15 capital-era instructions finalized; HOST regression green
    requirement: CAP-04
    verification:
      - kind: other
        ref: "grep CAP registers in create-handler.ts"
        status: pass
      - kind: unit
        ref: "npx vitest run src/lib/mcp/ src/app/api/mcp/route.test.ts"
        status: pass
      - kind: unit
        ref: "npm test"
        status: pass
    human_judgment: false

duration: 2min
completed: 2026-09-10
status: complete
---

# Phase 24 Plan 04: Capital Read Tools Summary

**list_fx_rates LOCF transparency tool (rateScale 8 string rates, no agent convert) + finalized D-15 capital-era MCP instructions**

## Performance

- **Duration:** 2 min
- **Started:** 2026-09-10T16:14:39Z
- **Completed:** 2026-09-10T16:17:21Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- CAP-04 `list_fx_rates` — rates-page LOCF snapshot; optional `currencyCode`; missing LOCF → null rate fields
- Tool description + annotations ban agent conversion; primary via NW/balance only
- D-15 instructions name full catalog (`wallet_ping` + four CAP tools); VALIDATION map marked green
- mcp suite 37 passed; full `npm test` 524 passed

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: list_fx_rates tests** - `91badde` (test)
2. **Task 1 GREEN: LOCF assembler + registerListFxRates** - `4ef92bb` (feat)
3. **Task 2: finalize D-15 + VALIDATION** - `309149d` (feat)

**Plan metadata:** (docs commit after this SUMMARY)

_Note: TDD tasks used RED → GREEN commit pairs_

## Files Created/Modified
- `src/lib/mcp/reads/load-fx-rates-asof.ts` - assembleFxRatesPayload + loadFxRatesAsOf (firstHitLocfMap)
- `src/lib/mcp/tools/fx.ts` - registerListFxRates + LIST_FX_RATES_DESCRIPTION
- `src/lib/mcp/tools/fx.test.ts` - CAP-04 expects (no it.todo)
- `src/lib/mcp/create-handler.ts` - registerListFxRates + D-15 instructions
- `.planning/phases/24-capital-read-tools/24-VALIDATION.md` - task map Status green

## Decisions Made
- Missing LOCF includes currency with null `asOfDate` / `rateToPrimaryScaled` (plan assumption honesty pick)
- Export description constant for contract test (D-03 / T-24-02)
- No convert_fx API; D-16 — no CI mutate-import ban

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
Phase 24 CAP-01…04 catalog complete. Ready for verify-work / Phase 25 side ledgers. HOST localhost guard unchanged.

## Self-Check: PASSED
- FOUND: src/lib/mcp/reads/load-fx-rates-asof.ts, src/lib/mcp/tools/fx.ts
- FOUND: commits 91badde 4ef92bb 309149d
- VERIFY: `npx vitest run src/lib/mcp/tools/fx.test.ts` → 5 passed
- VERIFY: `npx vitest run src/lib/mcp/ src/app/api/mcp/route.test.ts` → 37 passed
- VERIFY: `npm test` → 524 passed

---
*Phase: 24-capital-read-tools*
*Completed: 2026-09-10*
