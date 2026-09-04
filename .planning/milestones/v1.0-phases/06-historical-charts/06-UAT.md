---
status: complete
phase: 06-historical-charts
source:
  - 06-01-SUMMARY.md
  - 06-02-SUMMARY.md
  - 06-03-SUMMARY.md
started: "2026-09-04T13:04:11Z"
updated: "2026-09-04T13:10:41Z"
---

## Current Test

[testing complete]

## Tests

### 1. Historical NW LineChart under Капитал
expected: On `/` with accounts present: hero «Капитал», NW LineChart (~200px) visible under it, shared Период presets 30д/90д/1г/всё (default 30д). Series paints; changing period recomputes chart.
result: pass
coverage_id: D1
rationale: Chart paint height 200px and visible series need visual/backstop UAT

### 2. Expand account row shows chart-only body
expected: Expanding an account row on `/` shows chart-only body (bg muted), Russian aria «Показать/Скрыть график счёта», no set/delete controls in expand. Shared range still drives the expand chart.
result: pass
coverage_id: D1
rationale: Expand interaction and chart paint need visual UAT

### 3. Russian charts UI smoke (credit stack, empty/single)
expected: Credit account expand shows stacked долг/доступно Areas; native↔primary toggle works (hidden for primary-currency accounts); empty/single-point charts still paint axes/dots without broken layout. Russian chrome intact.
result: pass
coverage_id: D3
rationale: Visual Russian chrome, layout order, and paint contracts require human browser confirmation

### 4. As-of LOCF series; later FX does not rewrite earlier points
expected: As-of LOCF series; later FX does not rewrite earlier points
result: pass
source: automated
coverage_id: D2

### 5. Shared Russian range presets 30д 90д 1г всё default 30д
expected: Shared Russian range presets 30д 90д 1г всё default 30д
result: pass
source: automated
coverage_id: D3

### 6. buildAccountSeries native/primary with D-16 null-FX skip
expected: buildAccountSeries native/primary with D-16 null-FX skip and primary identity
result: pass
source: automated
coverage_id: D2

### 7. Native↔primary toggle hidden for primary-currency accounts
expected: Native↔primary toggle hidden for primary-currency accounts; connectNulls false
result: pass
source: automated
coverage_id: D3

### 8. FIAT_CREDIT stacked debt+available
expected: FIAT_CREDIT stacked debt+available native and primary (D-11/D-12)
result: pass
source: automated
coverage_id: D1

### 9. Empty axes and single-point dots
expected: Empty axes and single-point dots on NW and account charts (D-13/D-15)
result: pass
source: automated
coverage_id: D2

## Summary

total: 9
passed: 9
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none yet]
