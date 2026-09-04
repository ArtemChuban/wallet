---
status: testing
phase: 09-people-debts-crud-nav
source: [09-VERIFICATION.md]
started: 2026-09-04T21:52:00Z
updated: 2026-09-04T21:52:00Z
---

## Current Test

number: 1
name: Open /debts with zero people; create a person; rename; list A–Z
expected: |
  Russian chrome («Нет людей» / «Новый человек» / «Изменить имя»); person appears in list after create
awaiting: user response

## Tests

### 1. Open /debts with zero people; create a person; rename; list A–Z
expected: Russian chrome («Нет людей» / «Новый человек» / «Изменить имя»); person appears in list after create
result: pending

### 2. On /debts, click «Долги» in nav; also visit a nested path if any
expected: «Долги» shows active underline; order Главная · Счета · Долги · Валюты
result: pending

### 3. Delete person with debts vs without debts
expected: With debts — blocked «Нельзя удалить человека, пока есть долги» without native confirm; without debts — in-dialog confirm then delete
result: pending

### 4. Create debt (existing + new person), edit meta, delete from edit dialog
expected: Direction/currency/initial/due/note on create; locked person/currency/initial on edit; compact row shows direction + remaining + code; cascade confirm copy; no repayment UI
result: pending

### 5. On /accounts, delete a balance snapshot
expected: In-dialog «Удалить снимок за {date}? Это нельзя отменить.»; confirm disabled while pending; no browser native confirm
result: pending

### 6. Long person name in group header; open rename
expected: Name wraps or ellipsis in header; full name editable in rename dialog
result: pending

### 7. Debt with optional note; view compact row and edit dialog
expected: Note editable/visible in dialog; omitted from compact list row
result: pending

### 8. Review flagged judgment-tier prohibitions
expected: Peer nav, DISOL isolation, no person-detail route, no cascade person delete, no repayment UI, RateList untouched — each must-NOT still holds in the running app
result: pending

## Summary

total: 8
passed: 0
issues: 0
pending: 8
skipped: 0
blocked: 0

## Gaps
