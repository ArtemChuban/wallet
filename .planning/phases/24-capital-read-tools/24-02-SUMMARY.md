---
phase: 24-capital-read-tools
plan: 02
subsystem: api
tags: [mcp, net-worth, capitalize, locf, bigint, vitest, readOnlyHint]

requires:
  - phase: 24-capital-read-tools
    provides: minorToJson + optionalAsOfSchema/resolveAsOf from Plan 01
  - phase: 23-mcp-host-localhost-safety
    provides: createWalletMcpHandler + wallet_ping + localhost guard
provides:
  - loadNetWorthAsOf page-parity LOCF assembler calling computeNetWorthRows
  - serializeNetWorthPayload pure CAP-02 JSON adapter (string minors + enrichment)
  - registerGetNetWorth (get_net_worth, readOnlyHint) beside wallet_ping
  - capital-era MCP server instructions (D-15)
affects:
  - 24-03 list_accounts / get_account_balance
  - 24-04 list_fx_rates

actuals:
  tokens: 3494
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - MCP reads/* page-parity assemblers call domain compute* — no twin math
    - serializeNetWorthPayload for SQLite-free CAP adapter tests
    - CAP tools: annotations.readOnlyHint true + openWorldHint false

key-files:
  created:
    - src/lib/mcp/reads/load-net-worth-asof.ts
    - src/lib/mcp/tools/net-worth.ts
  modified:
    - src/lib/mcp/create-handler.ts
    - src/lib/mcp/tools/net-worth.test.ts

key-decisions:
  - "Extracted serializeNetWorthPayload pure helper for CAP-02 tests without Prisma"
  - "Instructions replaced with capital-era English + Капитал/RU aliases (D-15 baseline)"
  - "Tracer registers only get_net_worth + wallet_ping; other CAP tools Plans 03–04"

patterns-established:
  - "src/lib/mcp/reads/* for batch LOCF assemblers reused by tools"
  - "Tool handler: resolveAsOf → load* → JSON.stringify content text"

requirements-completed: [CAP-02]

coverage:
  - id: D1
    description: get_net_worth registered end-to-end with page-parity loadNetWorthAsOf + computeNetWorthRows + capital-era instructions
    requirement: CAP-02
    verification:
      - kind: other
        ref: "grep get_net_worth/readOnlyHint/registerGetNetWorth/computeNetWorthRows + files exist"
        status: pass
      - kind: unit
        ref: "npx vitest run src/lib/mcp/tools/net-worth.test.ts src/lib/mcp/as-of.test.ts src/lib/mcp/serialize.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: CAP-02 adapter JSON uses string totalPrimaryMinor, isPartial, excludeReason, enrichment; empty wallet D-07; resolveAsOf path
    requirement: CAP-02
    verification:
      - kind: unit
        ref: "src/lib/mcp/tools/net-worth.test.ts#returns totalPrimaryMinor string + isPartial + excludeReason rows"
        status: pass
      - kind: unit
        ref: "src/lib/mcp/tools/net-worth.test.ts#matches computeNetWorthRows honesty for same fixture inputs"
        status: pass
      - kind: unit
        ref: "src/lib/mcp/tools/net-worth.test.ts#omitted asOf defaults via resolveAsOf"
        status: pass
      - kind: unit
        ref: "src/lib/mcp/tools/net-worth.test.ts#empty wallet serializes zero total"
        status: pass
      - kind: unit
        ref: "npx vitest run src/lib/mcp/localhost-guard.test.ts src/app/api/mcp/route.test.ts"
        status: pass
    human_judgment: false

duration: 2min
completed: 2026-09-10
status: complete
---

# Phase 24 Plan 02: get_net_worth Tracer Summary

**Page-parity loadNetWorthAsOf → serializeNetWorthPayload → registerGetNetWorth with capital-era instructions beside wallet_ping**

## Performance

- **Duration:** 2 min
- **Started:** 2026-09-10T16:05:12Z
- **Completed:** 2026-09-10T16:08:01Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- End-to-end `get_net_worth` MCP tool (D-01/D-02/D-13) with LOCF batch + `computeNetWorthRows` only
- String-minor CAP-02 payload + D-12 enrichment; empty/partial success (D-07/D-09/D-10)
- Capital-era server instructions (D-15); green adapter + host/route regression

## Task Commits

Each task was committed atomically:

1. **Task 1: End-to-end get_net_worth — CAP-02 tracer** - `2bf6e61` (feat)
2. **Task 2: Green CAP-02 net-worth adapter tests** - `25ba671` (test)

**Plan metadata:** (docs commit after this SUMMARY)

## Files Created/Modified
- `src/lib/mcp/reads/load-net-worth-asof.ts` - LOCF assembler + serializeNetWorthPayload
- `src/lib/mcp/tools/net-worth.ts` - registerGetNetWorth
- `src/lib/mcp/create-handler.ts` - capital-era instructions + register after wallet_ping
- `src/lib/mcp/tools/net-worth.test.ts` - CAP-02 adapter expects (no it.todo)

## Decisions Made
- Pure `serializeNetWorthPayload` extracted so CAP-02 tests stay SQLite-free while production path uses Prisma LOCF
- Honored D-01…D-16 for NW path; reused Plan 01 serialize/as-of

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
Ready for 24-03 (`list_accounts` / `get_account_balance`). Tracer feedback gate re-verified automated `<verify>` under AUTO_CHAIN + end-of-phase.

## Self-Check: PASSED
- FOUND: src/lib/mcp/reads/load-net-worth-asof.ts, src/lib/mcp/tools/net-worth.ts
- FOUND: commits 2bf6e61 25ba671
- VERIFY: `npx vitest run src/lib/mcp/` → 23 passed, 9 todo (other CAP stubs), exit 0

---
*Phase: 24-capital-read-tools*
*Completed: 2026-09-10*
