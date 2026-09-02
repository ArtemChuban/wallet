---
status: testing
phase: 02-currencies-accounts
source: [02-VERIFICATION.md]
started: 2026-09-02T21:12:00Z
updated: 2026-09-02T21:12:00Z
---

## Current Test

number: 1
name: Currencies user flow (MVP)
expected: |
  RUB primary with «Основная»; create secondary; edit name only; no removal; no primary switch; Russian chrome matches UI-SPEC
awaiting: user response

## Tests

### 1. Currencies user flow (MVP)
expected: RUB primary visible; create persists; only name editable after create; Russian chrome matches UI-SPEC; no removal / no primary switch
result: [pending]

### 2. Accounts user flow (MVP)
expected: All four types creatable; credit limit required only for credit; edit locks type/currency/limit; Russian empty/CTA copy; no delete
result: [pending]

### 3. Long-name ellipsis (backstop)
expected: List truncates with ellipsis; full name editable in Dialog
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
