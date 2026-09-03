---
status: testing
phase: 03-dated-balance-snapshots
source: [03-VERIFICATION.md]
started: 2026-09-03T11:36:00Z
updated: 2026-09-03T11:36:00Z
---

## Current Test

number: 1
name: Russian set-balance + LOCF smoke
expected: |
  Russian CTAs/dialogs; row shows correct native LOCF; no invented zero.
awaiting: user response

## Tests

### 1. Russian set-balance + LOCF smoke
expected: Walk Plan 03 checklist on /accounts (past set, overwrite, LOCF ≤ today). Russian CTAs/dialogs; correct native LOCF; no invented zero.
result: [pending]

### 2. History expand + delete → empty E4
expected: Expand → delete until none remain. Confirm copy; after last delete → «Задать первый баланс»; no 0.00.
result: [pending]

### 3. Credit available/debt + future reject
expected: FIAT_CREDIT set available; row/history show available + derived debt; future date and over-limit return Russian errors.
result: [pending]

### 4. Long name truncate (backstop)
expected: Account name near 120 chars shows ellipsis on list; full name in edit Dialog.
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
