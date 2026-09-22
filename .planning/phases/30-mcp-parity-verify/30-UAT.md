---
status: complete
phase: 30-mcp-parity-verify
source:
  - 30-01-SUMMARY.md
  - 30-02-PLAN.md
started: "2026-09-22T09:18:00Z"
updated: "2026-09-22T09:20:00Z"
driver: orca-ide + localhost MCP curl
---

## Current Test

[testing complete]

## Tests

### 1. Dev + Orca home (OPERATOR)
expected: `npm run dev` on :3000; Orca tab `http://localhost:3000/` shows Капитал / Прогноз / накопительный seed
result: pass
observed: |
  Dev already up (HTTP 200). orca-ide tab create → browserPageId 7adaa364-…;
  snapshot refs include Накопительный, Капитал, Прогноз, UAT. No chart DOM UAT.

### 2. list_accounts SAVINGS fields (MCP-01 / D-14)
expected: SAVINGS row emits annualRateBps, accrualDayOfMonth, annualRatePercent
result: pass
observed: |
  POST /api/mcp tools/call list_accounts (Host localhost:3000).
  Row id=6 name="UAT Накопительный 27" type=SAVINGS:
  annualRateBps=1650, accrualDayOfMonth=15, annualRatePercent=16.5.
  Non-SAVINGS rows null for those three fields. No new tools created.

### 3. get_forecast_overlay interest events (MCP-02 / D-14)
expected: points[].forecastEvents includes kind "interest" for SAVINGS
result: pass
observed: |
  tools/call get_forecast_overlay → includedSlotCount=24, points=14.
  First interest on 2026-10-15: kind=interest, parentId=6, accountId=6,
  accountName="UAT Накопительный 27", plannedAmountMinor="137500",
  displayPrimaryMajor=1375, currencyCode=RUB (alongside income on same day).

### 4. BalanceSnapshot count + get_net_worth unchanged (SAVISO live / D-14 / D-15 / T-30-02)
expected: snap count and get_net_worth identity unchanged after overlay-only reads
result: pass
observed: |
  sqlite3 BalanceSnapshot COUNT before=6 after=6 (unchanged).
  get_net_worth asOf=2026-09-22 totalPrimaryMinor=102415555 before overlay;
  after overlay JSON identical (sort_keys dump). Overlay did not write snaps.

### 5. Savings todo still pending (D-16)
expected: `.planning/todos/pending/2026-09-10-savings-account-type-with-interest-nw-forecast.md` exists
result: pass
observed: File still under pending/; not marked resolved mid Phase 30.

### 6. Create накопительный via UI if missing (D-15)
expected: If no SAVINGS, create via existing UI then MCP
result: skipped
observed: |
  Live DB already had SAVINGS "UAT Накопительный 27" (Phase 27/29 seed).
  No UI create needed this run.

## Summary

total: 6
passed: 5
issues: 0
pending: 0
skipped: 1
blocked: 0

## Gaps

[none — MCP-01/MCP-02/PARITY-01 live bar closed without chart DOM UAT]
