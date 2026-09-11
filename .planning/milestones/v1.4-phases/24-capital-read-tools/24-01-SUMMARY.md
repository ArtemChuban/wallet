---
phase: 24-capital-read-tools
plan: 01
subsystem: api
tags: [mcp, serialize, bigint, zod, vitest, as-of, nyquist]

requires:
  - phase: 23-mcp-host-localhost-safety
    provides: MCP host layout under src/lib/mcp + wallet_ping + vitest mcp paths
provides:
  - minorToJson / rateToJson BigInt JSON helpers (D-09)
  - optionalAsOfSchema + resolveAsOf via calendarDateToday Europe/Moscow (D-05/06/08)
  - Wave 0 CAP-01…04 it.todo stubs under src/lib/mcp/tools/
affects:
  - 24-02 get_net_worth tracer
  - 24-03 list_accounts / get_account_balance
  - 24-04 list_fx_rates

actuals:
  tokens: 1426
  tasks: 3
  commits: 5

tech-stack:
  added: []
  patterns:
    - MCP money fields as string minors + scale pairing (never Number)
    - Shared resolveAsOf / optionalAsOfSchema for CAP tools
    - Wave 0 it.todo Nyquist stubs exit 0 until later plans green

key-files:
  created:
    - src/lib/mcp/serialize.ts
    - src/lib/mcp/serialize.test.ts
    - src/lib/mcp/as-of.ts
    - src/lib/mcp/as-of.test.ts
    - src/lib/mcp/tools/accounts.test.ts
    - src/lib/mcp/tools/net-worth.test.ts
    - src/lib/mcp/tools/balances.test.ts
    - src/lib/mcp/tools/fx.test.ts
  modified:
    - .planning/phases/24-capital-read-tools/24-VALIDATION.md

key-decisions:
  - "rateToJson returns string only; callers pair rateScale 8 from RATE_SCALE_E8"
  - "optionalAsOfSchema English message asOf must be YYYY-MM-DD (no RU form copy)"
  - "Wave 0 CAP stubs are it.todo only — no hard-fail expects until Plans 02–04"

patterns-established:
  - "serialize.ts for all CAP money/FX JSON boundaries"
  - "as-of.ts single today path for get_net_worth / get_account_balance / list_fx_rates"

requirements-completed: [CAP-01, CAP-02, CAP-03, CAP-04]

coverage:
  - id: D1
    description: Wave 0 CAP tool suite stubs (accounts/net-worth/balances/fx) exit 0 with it.todo only
    requirement: CAP-01
    verification:
      - kind: unit
        ref: "src/lib/mcp/tools/accounts.test.ts#list_accounts (CAP-01)"
        status: pass
      - kind: unit
        ref: "src/lib/mcp/tools/net-worth.test.ts#get_net_worth (CAP-02)"
        status: pass
      - kind: unit
        ref: "src/lib/mcp/tools/balances.test.ts#get_account_balance (CAP-03)"
        status: pass
      - kind: unit
        ref: "src/lib/mcp/tools/fx.test.ts#list_fx_rates (CAP-04)"
        status: pass
    human_judgment: false
  - id: D2
    description: minorToJson / rateToJson stringify bigint minors and rates (never JS number)
    requirement: CAP-02
    verification:
      - kind: unit
        ref: "src/lib/mcp/serialize.test.ts#minorToJson"
        status: pass
      - kind: unit
        ref: "src/lib/mcp/serialize.test.ts#rateToJson"
        status: pass
    human_judgment: false
  - id: D3
    description: resolveAsOf defaults via calendarDateToday Europe/Moscow; optionalAsOfSchema rejects garbage YYYY-MM-DD with English message; future dates allowed
    requirement: CAP-02
    verification:
      - kind: unit
        ref: "src/lib/mcp/as-of.test.ts#resolveAsOf"
        status: pass
      - kind: unit
        ref: "src/lib/mcp/as-of.test.ts#optionalAsOfSchema"
        status: pass
    human_judgment: false

duration: 3min
completed: 2026-09-10
status: complete
---

# Phase 24 Plan 01: Capital Read Tools Wave 0 Summary

**Wave 0 CAP stubs + serialize/as-of adapters: string bigint minors and shared Moscow today default before any registerTool**

## Performance

- **Duration:** 3 min
- **Started:** 2026-09-10T15:59:50Z
- **Completed:** 2026-09-10T16:03:17Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments
- Four CAP tool Wave 0 `it.todo` suites under `src/lib/mcp/tools/` (exit 0)
- `minorToJson` / `rateToJson` for D-09 money honesty
- `optionalAsOfSchema` + `resolveAsOf` for D-05/D-06/D-08 shared as-of path
- `24-VALIDATION.md` Wave 0 marked complete / nyquist_compliant

## Task Commits

Each task was committed atomically:

1. **Task 1: Wave 0 Nyquist stubs for CAP tool suites** - `ce4347b` (test)
2. **Task 2: serialize.ts minor/rate JSON helpers (D-09)** - `a157f5b` (test RED) → `5c45436` (feat GREEN)
3. **Task 3: as-of.ts resolveAsOf + optionalAsOfSchema** - `9658541` (test RED) → `b27121b` (feat GREEN)

**Plan metadata:** (docs commit after this SUMMARY)

## Files Created/Modified
- `src/lib/mcp/serialize.ts` - bigint/null JSON helpers for CAP money fields
- `src/lib/mcp/serialize.test.ts` - D-09 unit coverage
- `src/lib/mcp/as-of.ts` - optionalAsOfSchema + resolveAsOf
- `src/lib/mcp/as-of.test.ts` - today default + wire validation
- `src/lib/mcp/tools/accounts.test.ts` - CAP-01 Wave 0 stub
- `src/lib/mcp/tools/net-worth.test.ts` - CAP-02 Wave 0 stub
- `src/lib/mcp/tools/balances.test.ts` - CAP-03 Wave 0 stub
- `src/lib/mcp/tools/fx.test.ts` - CAP-04 Wave 0 stub
- `.planning/phases/24-capital-read-tools/24-VALIDATION.md` - Wave 0 file-exists + status

## Decisions Made
- Followed CONTEXT D-09 / D-05 / D-06 / D-08 / D-14 exactly; no new packages; no tool registration this plan

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
Ready for 24-02 (`get_net_worth` tracer) — serialize + as-of available; CAP stubs await greening.

## Known Stubs
| File | Line | Stub | Reason |
|------|------|------|--------|
| `src/lib/mcp/tools/accounts.test.ts` | it.todo | CAP-01 behaviors | Wave 0 — Plan 03 greens |
| `src/lib/mcp/tools/net-worth.test.ts` | it.todo | CAP-02 behaviors | Wave 0 — Plan 02 greens |
| `src/lib/mcp/tools/balances.test.ts` | it.todo | CAP-03 behaviors | Wave 0 — Plan 03 greens |
| `src/lib/mcp/tools/fx.test.ts` | it.todo | CAP-04 behaviors | Wave 0 — Plan 04 greens |

Intentional Wave 0 stubs; plan goal (adapters + suite exit 0) achieved.

## Self-Check: PASSED
- FOUND: src/lib/mcp/serialize.ts, as-of.ts, four tools/*.test.ts
- FOUND: commits ce4347b a157f5b 5c45436 9658541 b27121b
- VERIFY: `npx vitest run src/lib/mcp/serialize.test.ts src/lib/mcp/as-of.test.ts src/lib/mcp/tools/` → 11 passed, 12 todo, exit 0

---
*Phase: 24-capital-read-tools*
*Completed: 2026-09-10*
