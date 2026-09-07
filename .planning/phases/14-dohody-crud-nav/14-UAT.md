---
status: passed
phase: 14-dohody-crud-nav
source: [14-VERIFICATION.md]
started: 2026-09-07T13:16:00Z
updated: 2026-09-07T13:30:00Z
driver: orca-ide
---

## Current Test

number: —
name: suite complete
expected: |
  all three UAT items passed
awaiting: none

## Tests

### 1. Open /income via nav «Доходы»; create recurring income (day, amount, currency, Person)
expected: Row appears under Person group as «Ежемесячный» with amount/currency/next date; honesty line visible; account balances unchanged
result: pass
notes: |
  First load hit stale Prisma client (Unknown field recurringIncomes) — fixed with `npx prisma generate` + Next restart (env, not product gap).
  After regen: nav Главная·Счета·Доходы·Долги·Валюты; honesty «Учёт доходов не меняет остатки на счетах.»; created recurring 50 000 RUB day 15 under Александра → row «Ежемесячный / 50 000 / RUB / 15.09.2026».

### 2. Create one-time income with optional note; edit via «Изменить»; delete via DestructiveConfirmStep
expected: One-time row «Разовый»; edit locks person/currency/kind; delete confirm uses DestructiveConfirmStep (no native confirm); row gone after confirm
result: pass
notes: |
  Kind toggle → Разовый; note «бонус»; row under Зоя «Разовый / 12 000 / RUB / 07.09.2026».
  Edit dialog locks Тип/Человек/Валюта as text; editable сумма/дата/заметка.
  Delete → in-dialog «Удалить доход?» step (DestructiveConfirmStep); after confirm Зоя shows «Нет доходов».

### 3. Person-group empty CTA «Новый доход» pre-fills Person; delete Person blocked when income refs exist
expected: defaultPersonId prefill; blocked copy «Нельзя удалить человека, пока есть долги или доходы»
result: pass
notes: |
  Зоя empty-group «Новый доход» opens dialog with Человек=Зоя prefilled.
  Александра «Удалить человека» shows alert «Нельзя удалить человека, пока есть долги или доходы» (has recurring income).
