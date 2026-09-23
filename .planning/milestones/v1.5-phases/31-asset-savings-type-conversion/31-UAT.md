---
status: complete
phase: 31-asset-savings-type-conversion
source:
  - 31-02-PLAN.md
  - 31-CONTEXT.md
  - 31-UI-SPEC.md
  - OPERATOR.md
started: "2026-09-22T14:40:00+02:00"
updated: "2026-09-22T14:50:00+02:00"
driver: orca-ide + npm run dev (agent-driven)
---

## Current Test

[complete]

## Tests

Agent drives app (`npm run dev` on :3000) + Orca browser (`orca-ide`) per `.planning/OPERATOR.md`. Prefer `http://localhost:3000/accounts`.

### 1. ASSET → SAVINGS convert (D-01, D-05, D-07, D-08, D-11)
expected: |
  Open «Изменить» on an ASSET account. Type Select shows only Актив / Накопительный.
  DialogDescription = «Валюта не меняется.» Switch draft to Накопительный → empty
  «Годовой %» + «День начисления»; Save stays enabled while empty. Fill both → Save →
  «Сохранено»; dialog closes; list shows secondary rate line.
result: pass
observed: |
  Seeded `UAT ASSET 31` (ASSET). Edit: description «Валюта не меняется.»; combobox options only Актив|Накопительный.
  Switch to Накопительный → empty Годовой % + День начисления; Save enabled. Filled 12.5 / 10 → Save.
  List: «Накопительный·RUB·12.5%·через 18 дн.» DB type=SAVINGS bps=1250 DOM=10.

### 2. SAVINGS → ASSET convert + field clear (D-05, D-06, D-02)
expected: |
  Open «Изменить» on a SAVINGS account (rate/DOM prefilled). Switch draft to Актив →
  rate/DOM hide and clear immediately. Save → type ASSET; after refresh no rate line;
  no second-step confirm chrome.
result: pass
observed: |
  Re-opened UAT ASSET 31 (SAVINGS). Draft → Актив: rate/DOM fields gone immediately; no confirm step.
  Save → list «Актив·RUB» (no rate line). DB type=ASSET, rate/DOM null.

### 3. FIAT_CREDIT / legacy type locked (D-14)
expected: |
  Edit FIAT_CREDIT (or soft legacy): muted type label only — no type Select.
  DialogDescription = «Тип и валюта не меняются.» Currency muted mono.
result: pass
observed: |
  Platinum (FIAT_CREDIT): description «Тип и валюта не меняются.»; type = paragraph «Кредитный» (no combobox); currency RUB label.

### 4. List secondary rate line updates (ACCT-04 UI)
expected: |
  After ASSET→SAVINGS, list row shows rate + countdown secondary line; after
  SAVINGS→ASSET it disappears (revalidate `/accounts`).
result: pass
observed: |
  After convert to SAVINGS: «12.5%·через 18 дн.» present. After convert back to ASSET: rate line gone.

### 5. BalanceSnapshot count unchanged after convert (D-16)
expected: |
  sqlite3 (or equivalent) BalanceSnapshot COUNT before convert equals after convert
  for both directions — conversion must not create/update/delete snapshots.
result: pass
observed: |
  COUNT stayed 6 across ASSET→SAVINGS and SAVINGS→ASSET.

### 6. Create type list unchanged (D-04)
expected: |
  «Добавить счёт» type Select still ASSET | FIAT_CREDIT | SAVINGS — no regression.
result: pass
observed: |
  «Новый счёт» type options: Актив, Кредитный, Накопительный.

## Summary

total: 6
passed: 6
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

None
