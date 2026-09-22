---
status: pending
phase: 31-asset-savings-type-conversion
source:
  - 31-02-PLAN.md
  - 31-CONTEXT.md
  - 31-UI-SPEC.md
  - OPERATOR.md
started: null
updated: null
driver: orca-ide + npm run dev (agent-driven; human_verify_mode end-of-phase)
---

## Current Test

[pending — run via `/gsd-verify-work`]

## Tests

Agent drives app (`npm run dev` on :3000) + Orca browser (`orca-ide` / `orca`) per `.planning/OPERATOR.md`. Prefer `http://localhost:3000/accounts`. Leave results empty until verify-work.

### 1. ASSET → SAVINGS convert (D-01, D-05, D-07, D-08, D-11)
expected: |
  Open «Изменить» on an ASSET account. Type Select shows only Актив / Накопительный.
  DialogDescription = «Валюта не меняется.» Switch draft to Накопительный → empty
  «Годовой %» + «День начисления»; Save stays enabled while empty. Fill both → Save →
  «Сохранено»; dialog closes; list shows secondary rate line.
result: pending
observed: |

### 2. SAVINGS → ASSET convert + field clear (D-05, D-06, D-02)
expected: |
  Open «Изменить» on a SAVINGS account (rate/DOM prefilled). Switch draft to Актив →
  rate/DOM hide and clear immediately. Save → type ASSET; after refresh no rate line;
  no second-step confirm chrome.
result: pending
observed: |

### 3. FIAT_CREDIT / legacy type locked (D-14)
expected: |
  Edit FIAT_CREDIT (or soft legacy): muted type label only — no type Select.
  DialogDescription = «Тип и валюта не меняются.» Currency muted mono.
result: pending
observed: |

### 4. List secondary rate line updates (ACCT-04 UI)
expected: |
  After ASSET→SAVINGS, list row shows rate + countdown secondary line; after
  SAVINGS→ASSET it disappears (revalidate `/accounts`).
result: pending
observed: |

### 5. BalanceSnapshot count unchanged after convert (D-16)
expected: |
  sqlite3 (or equivalent) BalanceSnapshot COUNT before convert equals after convert
  for both directions — conversion must not create/update/delete snapshots.
result: pending
observed: |

### 6. Create type list unchanged (D-04)
expected: |
  «Добавить счёт» type Select still ASSET | FIAT_CREDIT | SAVINGS — no regression.
result: pending
observed: |

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps

[pending verify-work]
