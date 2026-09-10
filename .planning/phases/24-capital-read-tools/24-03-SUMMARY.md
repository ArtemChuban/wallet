---
phase: 24-capital-read-tools
plan: 03
subsystem: api
tags: [mcp, list_accounts, get_account_balance, conversionOk, bigint, vitest, readOnlyHint]

requires:
  - phase: 24-capital-read-tools
    provides: minorToJson + optionalAsOfSchema/resolveAsOf + get_net_worth tracer
  - phase: 23-mcp-host-localhost-safety
    provides: createWalletMcpHandler + wallet_ping + localhost guard
provides:
  - registerListAccounts (CAP-01 metadata-only catalog)
  - loadAccountBalanceAsOf + assembleAccountBalancePayload (CAP-03 LOCF + server convert)
  - registerGetAccountBalance with soft account_not_found
affects:
  - 24-04 list_fx_rates

actuals:
  tokens: 4123
  tasks: 3
  commits: 5

tech-stack:
  added: []
  patterns:
    - Pure serialize/assemble helpers for SQLite-free CAP adapter tests
    - Soft account_not_found success payload (not MCP tool error)
    - Server-only convertOtherMinorToPrimaryMinor; conversionOk false on miss

key-files:
  created:
    - src/lib/mcp/tools/accounts.ts
    - src/lib/mcp/tools/balances.ts
    - src/lib/mcp/reads/load-account-balance-asof.ts
  modified:
    - src/lib/mcp/tools/accounts.test.ts
    - src/lib/mcp/tools/balances.test.ts
    - src/lib/mcp/create-handler.ts

key-decisions:
  - "list_accounts metadata via serializeListAccountsPayload; no LOCF amounts"
  - "get_account_balance soft account_not_found + conversionOk false when FX/snapshot missing"
  - "Wire both registers after wallet_ping / get_net_worth; capital-era instructions unchanged"

patterns-established:
  - "CAP tools mirror wallet-ping registerTool + JSON text content"
  - "reads/* assemblers expose pure assemble* for unit tests"

requirements-completed: [CAP-01, CAP-03]

coverage:
  - id: D1
    description: list_accounts returns metadata (type, currency, creditLimitMinor string, isCredit); empty wallet []; no live balances
    requirement: CAP-01
    verification:
      - kind: other
        ref: "test -f accounts.ts && grep list_accounts"
        status: pass
      - kind: unit
        ref: "src/lib/mcp/tools/accounts.test.ts#returns account type, currency, creditLimitMinor string, isCredit"
        status: pass
      - kind: unit
        ref: "src/lib/mcp/tools/accounts.test.ts#omits live available/debt balance fields"
        status: pass
      - kind: unit
        ref: "src/lib/mcp/tools/accounts.test.ts#empty wallet returns success with empty accounts array"
        status: pass
    human_judgment: false
  - id: D2
    description: get_account_balance server convert + conversionOk false / account_not_found honesty
    requirement: CAP-03
    verification:
      - kind: other
        ref: "grep get_account_balance + conversionOk markers"
        status: pass
      - kind: unit
        ref: "src/lib/mcp/tools/balances.test.ts#missing FX returns conversionOk false"
        status: pass
      - kind: unit
        ref: "src/lib/mcp/tools/balances.test.ts#unknown accountId returns success payload with account_not_found"
        status: pass
      - kind: unit
        ref: "src/lib/mcp/tools/balances.test.ts#omitted asOf defaults via resolveAsOf"
        status: pass
      - kind: unit
        ref: "src/lib/mcp/tools/balances.test.ts#server convertOtherMinorToPrimaryMinor fills primary"
        status: pass
    human_judgment: false
  - id: D3
    description: Both tools registered in createWalletMcpHandler; NW + route regressions green
    requirement: CAP-01
    verification:
      - kind: other
        ref: "grep registerListAccounts + registerGetAccountBalance in create-handler.ts"
        status: pass
      - kind: unit
        ref: "npx vitest run accounts/balances/net-worth/route tests"
        status: pass
      - kind: unit
        ref: "npx vitest run src/lib/mcp/"
        status: pass
    human_judgment: false

duration: 3min
completed: 2026-09-10
status: complete
---

# Phase 24 Plan 03: Capital Read Tools Summary

**list_accounts metadata catalog + get_account_balance LOCF/server-convert with conversionOk honesty and soft account_not_found**

## Performance

- **Duration:** 3 min
- **Started:** 2026-09-10T16:09:15Z
- **Completed:** 2026-09-10T16:13:01Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- CAP-01 `list_accounts` — type/currency/`creditLimitMinor` string/`isCredit`; metadata only
- CAP-03 `get_account_balance` — LOCF + `convertOtherMinorToPrimaryMinor`; `conversionOk: false` + null primary on miss; soft `account_not_found`
- Both registered in `createWalletMcpHandler` beside `wallet_ping` / `get_net_worth`

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: list_accounts tests** - `9bc8724` (test)
2. **Task 1 GREEN: list_accounts impl** - `72384da` (feat)
3. **Task 2 RED: get_account_balance tests** - `c433cc6` (test)
4. **Task 2 GREEN: balance assembler + tool** - `ee0fc59` (feat)
5. **Task 3: wire create-handler** - `108a1e7` (feat)

**Plan metadata:** (docs commit after this SUMMARY)

_Note: TDD tasks used RED → GREEN commit pairs_

## Files Created/Modified
- `src/lib/mcp/tools/accounts.ts` - serializeListAccountsPayload + registerListAccounts
- `src/lib/mcp/tools/accounts.test.ts` - CAP-01 adapter expects (no it.todo)
- `src/lib/mcp/reads/load-account-balance-asof.ts` - assemble + loadAccountBalanceAsOf
- `src/lib/mcp/tools/balances.ts` - registerGetAccountBalance
- `src/lib/mcp/tools/balances.test.ts` - CAP-03 honesty expects (no it.todo)
- `src/lib/mcp/create-handler.ts` - register both CAP tools

## Decisions Made
- Soft `account_not_found` success payload (A1 / D-07) — not hard MCP error
- Server-side convert only; agent never multiplies FX (D-11 / T-24-02)
- Pure assemble/serialize helpers for SQLite-free tests (mirrors Plan 02 NW pattern)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
Ready for 24-04 (`list_fx_rates`). NW tracer + CAP-01/03 green under `npx vitest run src/lib/mcp/` (30 passed).

## Self-Check: PASSED
- FOUND: src/lib/mcp/tools/accounts.ts, src/lib/mcp/tools/balances.ts, src/lib/mcp/reads/load-account-balance-asof.ts
- FOUND: commits 9bc8724 72384da c433cc6 ee0fc59 108a1e7
- VERIFY: `npx vitest run src/lib/mcp/` → 30 passed, exit 0

---
*Phase: 24-capital-read-tools*
*Completed: 2026-09-10*
