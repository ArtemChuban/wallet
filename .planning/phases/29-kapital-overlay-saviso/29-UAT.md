---
status: testing
phase: 29-kapital-overlay-saviso
source: [29-VERIFICATION.md]
started: 2026-09-21T18:38:51+02:00
updated: 2026-09-21T18:38:51+02:00
---

## Current Test

number: 1
name: Капитал hover UAT — accrual day + grace due day
expected: |
  Interest block once with + amount; later days keep higher line without repeating block;
  grace − and lower dashed sample; overdue grace on today leaves fact «Итого» unchanged.
awaiting: agent (Orca)

## Tests

### 1. Капитал hover UAT — accrual day + grace due day
expected: Interest block once with + amount on accrual day; later days keep higher line without repeating the interest block; grace row shows − and dashed sample is lower; overdue grace folded onto today leaves fact «Итого» unchanged
result: [pending]

### 2. Banner wrap with multiple missing FX codes
expected: Codes wrap inside existing chart card; no ellipsis; no kind word in the banner
result: [pending]

### 3. Long banner template + code list
expected: Fixed Russian template plus code list wraps in the card
result: [pending]

### 4. Line dip/rise geometry and today hinge gap
expected: Same muted dash steps up on accrual day and down on grace day; when overdue grace folds onto today, dashed sample may sit below fact «Итого»
result: [pending]

### 5. Judgment — no BalanceSnapshot from forecast path
expected: Accept saviso never-call scan + import wall as proof that forecast viewing never writes snapshots
result: [pending]

### 6. Judgment — historical LOCF unchanged by interest
expected: Accept saviso golden series (SAVINGS series equals snapshot minors with unused interest fixture)
result: [pending]

### 7. Judgment — no invented FX rates
expected: Accept INT-03 tests: missing rate drops slot and lists currency code; rate as of today includes; no second rounding mode
result: [pending]

## Summary

total: 7
passed: 0
issues: 0
pending: 7
skipped: 0
blocked: 0

## Gaps
