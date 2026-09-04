---
status: complete
phase: 03-dated-balance-snapshots
source: [03-VERIFICATION.md]
started: 2026-09-03T11:36:00Z
updated: 2026-09-03T11:50:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Russian set-balance + LOCF smoke
expected: Walk Plan 03 checklist on /accounts (past set, overwrite, LOCF ≤ today). Russian CTAs/dialogs; correct native LOCF; no invented zero.
result: pass

### 2. History expand + delete → empty E4
expected: Expand → delete until none remain. Confirm copy; after last delete → «Задать первый баланс»; no 0.00.
result: pass

### 3. Credit available/debt + future reject
expected: FIAT_CREDIT set available; row/history show available + derived debt; future date and over-limit return Russian errors.
result: pass

### 4. Long name truncate (backstop)
expected: Account name near 120 chars shows ellipsis on list; full name in edit Dialog.
result: pass

## Summary

total: 4
passed: 4
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
