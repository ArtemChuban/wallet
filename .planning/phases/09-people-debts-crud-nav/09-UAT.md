---
status: complete
phase: 09-people-debts-crud-nav
source: [09-VERIFICATION.md]
started: 2026-09-04T21:52:00Z
updated: 2026-09-04T22:35:00Z
tested_by: orca-browser-agent
---

## Current Test

[testing complete]

## Tests

### 1. Open /debts with zero people; create a person; rename; list A–Z
expected: Russian chrome («Нет людей» / «Новый человек» / «Изменить имя»); person appears in list after create
result: pass
notes: Empty state chrome OK; created Яна→renamed Зоя; created Аня; order Аня then Зоя (A–Z)

### 2. On /debts, click «Долги» in nav; also visit a nested path if any
expected: «Долги» shows active underline; order Главная · Счета · Долги · Валюты
result: pass
notes: Nav order exact; Долги has underline decoration-2 underline-offset-4 font-semibold

### 3. Delete person with debts vs without debts
expected: With debts — blocked «Нельзя удалить человека, пока есть долги» without native confirm; without debts — in-dialog confirm then delete
result: pass
notes: Зоя+debt blocked with exact copy (in-page alert); Аня no-debt showed dialog «Удалить человека «Аня»? Это нельзя отменить.» then deleted

### 4. Create debt (existing + new person), edit meta, delete from edit dialog
expected: Direction/currency/initial/due/note on create; locked person/currency/initial on edit; compact row shows direction + remaining + code; cascade confirm copy; no repayment UI
result: pass
notes: Existing (Зоя 1000 RUB) + new person (Кира 500); edit locks person/currency/initial as paragraphs; cascade confirm exact; delete Кира debt OK; no repayment controls

### 5. On /accounts, delete a balance snapshot
expected: In-dialog «Удалить снимок за {date}? Это нельзя отменить.»; confirm disabled while pending; no browser native confirm
result: pass
notes: Black 04.09.2026 — dialog «Удалить снимок за 04.09.2026? Это нельзя отменить.»; cancelled via Назад (no native confirm)

### 6. Long person name in group header; open rename
expected: Name wraps or ellipsis in header; full name editable in rename dialog
result: pass
notes: Header overflowWrap=break-word whiteSpace=normal; rename input holds full long name editable

### 7. Debt with optional note; view compact row and edit dialog
expected: Note editable/visible in dialog; omitted from compact list row
result: pass
notes: Compact row «Я должен / 1 000 / RUB» only; edit dialog textbox shows «тест заметка»

### 8. Review flagged judgment-tier prohibitions
expected: Peer nav, DISOL isolation, no person-detail route, no cascade person delete, no repayment UI, RateList untouched — each must-NOT still holds in the running app
result: pass
notes: /debts/1 /people /people/1 → 404; no person-detail links; no repayment UI; person delete blocked not cascaded; /currencies/rates RateList still loads (USDT + Задать курс)

## Summary

total: 8
passed: 8
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none]
