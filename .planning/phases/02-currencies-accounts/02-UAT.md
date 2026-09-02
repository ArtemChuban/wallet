---
status: testing
phase: 02-currencies-accounts
source: [02-VERIFICATION.md]
started: 2026-09-02T21:12:00Z
updated: 2026-09-02T21:58:00Z
---

## Current Test

number: 3
name: Long-name ellipsis (backstop)
expected: |
  List truncates with ellipsis; full name editable in Dialog
awaiting: user response

## Tests

### 1. Currencies user flow (MVP)
expected: RUB primary visible; create persists; only name editable after create; Russian chrome matches UI-SPEC; no removal / no primary switch
result: issue
reported: "После обновления Console Error: Base UI: A component is changing the default value state of an uncontrolled FieldControl after being initialized. To suppress this warning opt to use a controlled FieldControl. at Input → CurrencyFormBody → CurrencyFormDialog → CurrencyList"
severity: blocker

### 2. Accounts user flow (MVP)
expected: All four types creatable; credit limit required only for credit; edit locks type/currency/limit; Russian empty/CTA copy; no delete
result: issue
reported: "При изменении Console Error: Base UI: A component is changing the default value state of an uncontrolled FieldControl after being initialized. To suppress this warning opt to use a controlled FieldControl. at Input → AccountFormBody → AccountFormDialog → AccountList"
severity: blocker

### 3. Long-name ellipsis (backstop)
expected: List truncates with ellipsis; full name editable in Dialog
result: [pending]

## Summary

total: 3
passed: 0
issues: 2
pending: 1
skipped: 0
blocked: 0

## Gaps

- gap_id: G-02-1
  truth: "RUB primary visible; create persists; only name editable after create; Russian chrome matches UI-SPEC; no removal / no primary switch"
  status: failed
  reason: "User reported: После обновления Console Error: Base UI: A component is changing the default value state of an uncontrolled FieldControl after being initialized. To suppress this warning opt to use a controlled FieldControl. at Input → CurrencyFormBody → CurrencyFormDialog → CurrencyList"
  severity: blocker
  test: 1
  artifacts: []
  missing: []

- gap_id: G-02-2
  truth: "All four types creatable; credit limit required only for credit; edit locks type/currency/limit; Russian empty/CTA copy; no delete"
  status: failed
  reason: "User reported: При изменении Console Error: Base UI: A component is changing the default value state of an uncontrolled FieldControl after being initialized. To suppress this warning opt to use a controlled FieldControl. at Input → AccountFormBody → AccountFormDialog → AccountList"
  severity: blocker
  test: 2
  artifacts: []
  missing: []
