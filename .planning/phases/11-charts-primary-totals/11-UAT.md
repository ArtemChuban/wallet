---
status: testing
phase: 11-charts-primary-totals
source: [11-VERIFICATION.md]
started: 2026-09-06T16:36:34Z
updated: 2026-09-06T16:36:34Z
---

## Current Test

number: 1
name: Open debt detail → «История» — confirm one stacked chart only (Погашено + Остаток), no second chart and no «Графики» tab
expected: |
  Single stepAfter stack above timeline; tabs stay Погашение / size / forgive / История
awaiting: user response

## Tests

### 1. Open debt detail → «История» — confirm one stacked chart only (Погашено + Остаток), no second chart and no «Графики» tab
expected: Single stepAfter stack above timeline; tabs stay Погашение / size / forgive / История
result: [pending]

### 2. Hover chart tooltip; confirm Погашено/Остаток text only (no HTML/note injection)
expected: Plain-text labels and formatted numbers only
result: [pending]

### 3. Visit /debts with zero people/debts — hero still shows Я должен / Мне должны as 0 primary
expected: Hero always visible with 0 / 0 in primary code
result: [pending]

### 4. Create debt with past openedAsOf; repay; open История — stack steps and stays native (no FX conversion)
expected: Series starts on openedAsOf; repaid rises / remaining falls; amounts match debt currency majors
result: [pending]

### 5. With OPEN non-primary debt missing FX, /debts shows «Итог неполный» naming that debt; Капитал banner lists excluded accounts with нет баланса/нет курса
expected: Partial honesty lists match excluded rows; NW hero unchanged by debts
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
