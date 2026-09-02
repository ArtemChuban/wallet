---
status: testing
phase: 02-currencies-accounts
source: [02-VERIFICATION.md]
started: 2026-09-03T00:30:00Z
updated: 2026-09-03T00:30:00Z
---

## Current Test

number: 1
name: Currencies MVP flow (re-UAT after gap closure)
expected: |
  RUB primary visible; create persists; only name editable after create; no removal / no primary switch; Russian chrome matches UI-SPEC
awaiting: user response

## Tests

### 1. Currencies MVP flow (re-UAT after gap closure)
expected: RUB primary visible; create persists; only name editable after create; no removal / no primary switch; Russian chrome matches UI-SPEC
result: [pending]

### 2. Accounts MVP flow (re-UAT after gap closure)
expected: All four types creatable; credit limit required only for credit; edit locks identity fields; no delete; Russian empty/CTA copy
result: [pending]

### 3. Gap re-check — FieldControl console silence (G-02-1 / G-02-2)
expected: Rename currency and account with DevTools open; no Base UI FieldControl uncontrolled default-value warning; names persist; dialogs close
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps

Prior blockers G-02-1 / G-02-2 closed in code by plan 02-05 (controlled name Inputs). Confirm via test 3 before marking phase complete.
