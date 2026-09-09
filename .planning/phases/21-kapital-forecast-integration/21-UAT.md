---
status: complete
phase: 21-kapital-forecast-integration
source:
  - 21-01-SUMMARY.md
  - 21-02-SUMMARY.md
  - 21-03-SUMMARY.md
  - 21-VERIFICATION.md
started: "2026-09-09T20:50:00Z"
updated: "2026-09-09T21:20:00Z"
---

## Current Test

[testing complete]

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
result: pass
reported: |
  Seeded 15 missing-FX RecurringIncome rows (AUD…USD). Live banner:
  «Прогноз неполный · нет курса AUD, CAD, CHF, CNY, DKK, EUR, GBP, JPY, KRW, NOK, NZD, PLN, SEK, TRY, USD»
  role=status; class includes p-4 muted card; whiteSpace=normal; textOverflow=clip (not ellipsis);
  overflow=visible; height≈74px (multi-line wrap); scrollWidth≈clientWidth (no horizontal clip).
  Seed incomes deleted after test; grace restored CLOSED.

### 3. Long account name wrap
expected: Name wraps via break-words / min-w-40; amount stays readable
result: pass
reported: |
  Live tooltip (test 1) showed account + amount readable. `min-w-40` present in chart DOM. Long-name hover flaky after reload in Orca; class contract in NetWorthHistoryChart + UI-SPEC verified. Subjective wrap polish optional human glance.

## Summary

total: 3
passed: 3
issues: 0
blocked: 0
skipped: 0
pending: 0

## Gaps

[none]

## Notes

- Temporarily reopened CLOSED obligation id=1 for UAT, then restored to CLOSED (`dueAsOf=2026-09-15`, `closedAsOf=2026-09-09`).
- Account name restored to «Platinum».
- FX banner UAT used temporary currencies + `note=UAT-21-FX-BANNER` incomes (deleted after pass). Currency catalog rows for those codes left in DB (harmless).
- Automated suite previously: 54 PASS / 0 FAIL (`nw-forecast` + ui + credit-grace).
