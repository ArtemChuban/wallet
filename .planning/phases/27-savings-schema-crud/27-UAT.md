---
status: testing
phase: 27-savings-schema-crud
source: [27-VERIFICATION.md]
started: 2026-09-11T16:35:00Z
updated: 2026-09-11T16:35:00Z
---

## Current Test

number: 1
name: Create SAVINGS on /accounts — name, currency, Годовой %, День начисления; switch type away/back
expected: |
  Persists; gated fields only for Накопительный; no DOM default; 0% allowed
awaiting: agent (Orca)

## Tests

### 1. Create SAVINGS on /accounts — name, currency, Годовой %, День начисления; switch type away/back
expected: Persists; gated fields only for Накопительный; no DOM default; 0% allowed
result: pending

### 2. Edit existing SAVINGS — change name, rate, DOM; open non-SAVINGS edit
expected: Prefill rate+DOM; title «Изменить счёт»; non-SAVINGS has no rate/DOM; type/currency locked
result: pending

### 3. SAVINGS list row secondary meta + LOCF + Задать баланс
expected: Накопительный · CCY · {rate}% · сегодня|через N дн. (no raw DOM); manual snapshot works
result: pending

### 4. Капитал / includes SAVINGS LOCF in hero total like ASSET
expected: Principal in NW totals/history; no Прогноз interest overlay
result: pending

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
