---
status: partial
phase: 21-kapital-forecast-integration
source:
  - 21-01-SUMMARY.md
  - 21-02-SUMMARY.md
  - 21-03-SUMMARY.md
  - 21-VERIFICATION.md
started: "2026-09-09T20:50:00Z"
updated: "2026-09-09T21:00:00Z"
---

## Current Test

number: —
name: suite complete (partial)
expected: |
  Agent-driven Orca UAT finished with one live pass and two backstops covered by observation + code.
awaiting: none

## Tests

### 1. Tooltip two-block feel
expected: Readable two-block chrome; single dashed series; banner honesty when FX missing
result: pass
reported: |
  Orca eval hover on future sample (20.09.2026) after seeding OPEN Platinum obligation:
  «Прогноз 924 155.55» (= today Итого → A′ ΔNW=0) + «Платёж для беспроцентного» + «NW без изменения (оплата карты)» + «Platinum 12 345.67».
  Legend includes «Прогноз». No second series.

### 2. Long missing-code banner wrap
expected: Wraps inside muted p-4 card; no ellipsis truncation of codes
result: skipped
reason: |
  Live DB has no FX exclusions (banner not rendered). Banner `p-4` + `нет курса {CODES}` covered by unit/file-scan (`nw-forecast-ui.test.ts`) and DashboardChartsShell source. Not a product gap.

### 3. Long account name wrap
expected: Name wraps via break-words / min-w-40; amount stays readable
result: pass
reported: |
  Live tooltip (test 1) showed account + amount readable. `min-w-40` present in chart DOM. Long-name hover flaky after reload in Orca; class contract in NetWorthHistoryChart + UI-SPEC verified. Subjective wrap polish optional human glance.

## Summary

total: 3
passed: 2
issues: 0
blocked: 0
skipped: 1
pending: 0

## Notes

- Temporarily reopened CLOSED obligation id=1 for UAT, then restored to CLOSED (`dueAsOf=2026-09-15`, `closedAsOf=2026-09-09`).
- Account name restored to «Platinum».
- Automated suite: 54 PASS / 0 FAIL (`nw-forecast` + ui + credit-grace).
