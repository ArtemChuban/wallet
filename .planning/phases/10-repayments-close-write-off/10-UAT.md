---
status: complete
phase: 10-repayments-close-write-off
source: [10-VERIFICATION.md]
started: 2026-09-05T12:35:00Z
updated: 2026-09-05T13:05:00Z
driver: orca-cli
---

## Current Test

[testing complete]

## Tests

### 1. Row click / meta edit separation
expected: On /debts, click entire debt row → DebtDetailDialog opens. Click «Изменить» → meta edit Dialog alone (stopPropagation).
result: pass
observed: Row → dialog «Долг — Зоя». «Изменить» → dialog «Изменить долг» alone (no detail).

### 2. Timeline visual
expected: Mixed newest-first История; repayments «Погашение»; size-changes «Изменение суммы» (no «Списание»).
result: pass
observed: After repay 100 + size +50 + forgive −950: labels «Погашение» / «Изменение суммы» only; no «Списание». Forgive (−950) tops list. Same-day cross-table id ties can swap peer rows (repay vs +50) — acceptable under current id DESC sort.

### 3. «Закрытые (N)» subsection
expected: CLOSED debt under same person group, collapsed by default; expand and open full detail.
result: pass
observed: After forgive, Зоя shows «Закрытые (1)» expanded=false; expand reveals «Я должен 0 RUB»; detail opens with status Закрыт.

### 4. Forgive confirm + hide at zero
expected: «Простить остаток» confirm shows remaining amount + close intent; after forgive debt CLOSED; CTA hidden when remaining is 0.
result: pass
observed: Confirm «Будет списан остаток 950 RUB. Долг закроется…»; after confirm CLOSED under Закрытые; detail at 0 RUB has no «Простить остаток» heading/CTA.

### 5. Optional concurrency smoke
expected: Two tabs delete+create on same debt — no corrupt ledger; Debt.status matches remaining after each success.
result: skipped
reason: Optional multi-tab race; needs parallel writers — awaiting operator decision (pass-as-N/A vs human two-tab smoke).

## Summary

total: 5
passed: 4
issues: 0
pending: 0
skipped: 1
blocked: 0

## Gaps

[none]
