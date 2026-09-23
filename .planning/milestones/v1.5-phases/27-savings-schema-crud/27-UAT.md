---
status: complete
phase: 27-savings-schema-crud
source: [27-VERIFICATION.md]
started: 2026-09-11T16:35:00Z
updated: 2026-09-11T16:45:00Z
---

## Current Test

number: —
name: —
expected: |
  —
awaiting: none

## Tests

### 1. Create SAVINGS on /accounts — name, currency, Годовой %, День начисления; switch type away/back
expected: Persists; gated fields only for Накопительный; no DOM default; 0% allowed
result: pass
notes: Orca — type Накопительный shows «Годовой %» + «День начисления»; created «UAT Накопительный 27» RUB 16.50% DOM 15

### 2. Edit existing SAVINGS — change name, rate, DOM; open non-SAVINGS edit
expected: Prefill rate+DOM; title «Изменить счёт»; non-SAVINGS has no rate/DOM; type/currency locked
result: pass
notes: Dialog title «Изменить счёт»; desc «Тип и валюта не меняются.»; rate 16.5 + DOM 15 prefilled as textboxes; type/currency as paragraphs

### 3. SAVINGS list row secondary meta + LOCF + Задать баланс
expected: Накопительный · CCY · {rate}% · сегодня|через N дн. (no raw DOM); manual snapshot works
result: pass
notes: List `Накопительный·RUB·16.5%·через 4 дн.`; «Задать первый баланс» → 100000 on 11.09.2026 OK

### 4. Капитал / includes SAVINGS LOCF in hero total like ASSET
expected: Principal in NW totals/history; no Прогноз interest overlay
result: pass
notes: `/` shows «UAT Накопительный 27» 100 000 RUB in table + chart series; no interest overlay chrome observed

## Summary

total: 4
passed: 4
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
