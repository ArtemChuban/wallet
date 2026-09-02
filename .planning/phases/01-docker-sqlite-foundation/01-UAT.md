---
status: testing
phase: 01-docker-sqlite-foundation
source:
  - 01-VERIFICATION.md
started: 2026-09-02T17:10:00Z
updated: 2026-09-02T17:10:00Z
---

## Current Test

number: 1
name: Browser ready page after compose up
expected: |
  Page shows «Кошелёк готов» and DB readiness «База данных: готова»
awaiting: user response

## Tests

### 1. Browser ready page after compose up
expected: Page shows «Кошелёк готов» and DB readiness «База данных: готова»
result: [pending]

### 2. Persist across restart via smoke-persist.sh
expected: Script exits 0; data/wallet.db remains; marker row survives restart; health 200 after restart
result: [pending]

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps
