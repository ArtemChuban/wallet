---
status: complete
phase: 20-obligation-crud-cycle-ui
source: 20-01-SUMMARY.md, 20-02-SUMMARY.md, 20-03-SUMMARY.md
started: "2026-09-09T13:44:00Z"
updated: "2026-09-09T13:52:00Z"
---

## Current Test

[testing complete]

## Tests

### 1. Wave 0 Zod create/update schemas green; actions/UI Plan 02–03 cases todo/skip only
expected: Wave 0 Zod create/update schemas green; actions/UI Plan 02–03 cases todo/skip only
result: pass
source: automated
coverage_id: D1

### 2. DestructiveConfirmStep accepts optional children + pendingLabel
expected: DestructiveConfirmStep accepts optional children + pendingLabel
result: pass
source: automated
coverage_id: D2

### 3. FIAT_CREDIT Грейс → schedule dialog + hybrid CTA → create OPEN obligation with server dueAsOf
expected: FIAT_CREDIT Грейс → schedule dialog + hybrid CTA → create OPEN obligation with server dueAsOf
result: pass
source: automated
coverage_id: D3

### 4. update OPEN amount/note freezes cycle keys; no BalanceSnapshot writes
expected: update OPEN amount/note freezes cycle keys; no BalanceSnapshot writes
result: pass
source: automated
coverage_id: D1

### 5. close with closedAsOf + reopen clears closedAsOf; GRISO isolation
expected: close with closedAsOf + reopen clears closedAsOf; GRISO isolation
result: pass
source: automated
coverage_id: D2

### 6. DestructiveConfirmStep close/reopen + collapsed Показать оплаченные; no native confirm
expected: DestructiveConfirmStep close/reopen + collapsed Показать оплаченные; no native confirm
result: pass
source: automated
coverage_id: D3

### 7. OPEN overdue warning chrome + interest hint in grace dialog; просрочено on Грейс only
expected: OPEN overdue warning chrome + interest hint in grace dialog; просрочено on Грейс only
result: pass
source: automated
coverage_id: D1

### 8. OPEN sort overdue-first + gap-day orphan OPEN retained with next CTA
expected: OPEN sort overdue-first + gap-day orphan OPEN retained with next CTA
result: pass
source: automated
coverage_id: D2

### 9. Задолженность LOCF label; amount disclaimer; clear schedule gated; no DOM 21/15 autofill
expected: Задолженность LOCF label; amount disclaimer; clear schedule gated; no DOM 21/15 autofill
result: pass
source: automated
coverage_id: D3

### 10. Schedule → cycle list tracer
expected: FIAT_CREDIT → Грейс → set dual DOM → save → hybrid list; CTA «Ввести сумму» only when no persisted row; empty-schedule hint when DOM null
result: pass
observed: |
  Agent Orca: empty-schedule hint shown; after save 21/15 hybrid list with current+next «Ввести сумму»; clear schedule available until OPEN exists.

### 11. Amount + early close confirm
expected: Enter/edit amount; Оплачено → DestructiveConfirmStep with Дата оплаты; reopen via «Показать оплаченные»; no window.confirm; CLOSED collapsed; amounts persist
result: pass
observed: |
  Agent Orca: amount dialog + save → OPEN «12 345.67 RUB·К оплате»; Оплачено opens DestructiveConfirmStep «Дата оплаты»; after confirm CLOSED under «Показать оплаченные» with amount + closedAsOf; «Вернуть к оплате» present; clear schedule ungated after close.

### 12. Overdue chrome
expected: OPEN with past dueAsOf → warning row + interest hint; «просрочено» on AccountList Грейс button only
result: pass
observed: |
  Agent Orca: seeded OPEN dueAsOf 2026-08-15; AccountList button «Грейс просрочено» (chip on button only; name/Задолженность not warning); dialog row shows «Срок оплаты прошёл — банк может начислить проценты.» + «9 999 RUB·К оплате».

### 13. UX-01 copy
expected: Card «Задолженность» vs amount «Платёж для беспроцентного» + disclaimer; no snapshot debt inside grace dialog
result: pass
observed: |
  Agent Orca: card «Задолженность 297 133.89RUB»; amount label «Платёж для беспроцентного» + disclaimer «Это не «Задолженность» по снимку баланса…»; grace dialog snapshot has no «Задолженность» / 297 debt amount.

## Summary

total: 13
passed: 13
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none yet]
