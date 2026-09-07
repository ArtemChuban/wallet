# Phase 16: Counterparty income stats - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-07
**Phase:** 16-Counterparty income stats
**Areas discussed:** Что в Σ, FX as-of, Где UI, Окно времени

---

## Pre: Todo match

| Option | Description | Selected |
|--------|-------------|----------|
| Fold | Fold salary/income milestone todo into Phase 16 | |
| Skip | Reviewed, not fold | |
| Delete | User: delete — phases already born from it | ✓ |

**User's choice:** Delete todo `.planning/todos/pending/2026-09-05-add-salary-income-tracking-with-forecast.md`
**Notes:** Todo was origin of v1.2 phases; no longer needed as pending item.

---

## Что в Σ

| Option | Description | Selected |
|--------|-------------|----------|
| Только факты | Actuals only | ✓ |
| Факты + план | Include unfilled plan | |
| Переключатель | Fact/plan/all toggle | |
| Ты решай | Claude discretion | |

**User's choice:** Только факты

| Option | Description | Selected |
|--------|-------------|----------|
| Оба kind в одной Σ | Recurring + one-time together | ✓ |
| Две цифры | Split regular / one-time | |
| Ты решай | | |

**User's choice:** Оба в одной Σ

| Option | Description | Selected |
|--------|-------------|----------|
| Σ=0 всем группам | Empty people show zero | |
| Только с ≥1 фактом | Stats only when actuals exist | ✓ |
| Ты решай | | |

**User's choice:** Только Person с фактами

| Option | Description | Selected |
|--------|-------------|----------|
| Общий hero | Global total + per-Person | |
| Только per-Person | No page hero | ✓ |
| Ты решай | | |

**User's choice:** Нет общего hero

---

## FX as-of

| Option | Description | Selected |
|--------|-------------|----------|
| Без primary | Native only | |
| Hybrid | Native always + primary @ actualAsOf | ✓ |
| Primary @ today | Snapshot now | |
| Primary @ actualAsOf only | No native-first mandate | |
| Другое | | |

**User's choice:** Hybrid — всегда native; primary по actualAsOf; день вывода USDT→фиат не в 16
**Notes:** User noted receipt vs withdrawal date mismatch for USDT salary; rejected inventing withdrawal as-of in this phase.

| Option | Description | Selected |
|--------|-------------|----------|
| Переключатель | Native / primary mode | |
| Оба ряда всегда | Primary under native | ✓ |
| Раскрытие | Expand per group | |
| Ты решай | | |

**User's choice:** Оба ряда всегда

| Option | Description | Selected |
|--------|-------------|----------|
| Multi native + одна primary-Σ | | ✓ |
| Без склейки native | | |
| Ты решай | | |

**User's choice:** Native per currency + one primary-Σ

| Option | Description | Selected |
|--------|-------------|----------|
| Exclude + неполный | Debts-style partial | ✓ |
| Скрыть primary целиком | | |
| — без баннера | | |
| Ты решай | | |

**User's choice:** Exclude + «итог неполный»

---

## Где UI

| Option | Description | Selected |
|--------|-------------|----------|
| Шапка группы Person | | ✓ |
| Блок «Статистика» | | |
| И то и то | | |
| Ты решай | | |

**User's choice:** Шапка группы

| Option | Description | Selected |
|--------|-------------|----------|
| Partial у группы | | ✓ |
| Баннер страницы | | |
| Оба | | |
| Ты решай | | |

**User's choice:** Partial локально у группы

| Option | Description | Selected |
|--------|-------------|----------|
| Без цифр если нет фактов | | ✓ |
| Явный «нет фактов» | | |
| Ты решай | | |

**User's choice:** Шапка без цифр

| Option | Description | Selected |
|--------|-------------|----------|
| Справа native + primary | | ✓ |
| Под именем слева | | |
| Ты решай | | |

**User's choice:** Справа money-first

---

## Окно времени

| Option | Description | Selected |
|--------|-------------|----------|
| Всё время | | ✓ |
| Текущий месяц | | |
| YTD | | |
| Пикер | | |
| Ты решай | | |

**User's choice:** All-time

| Option | Description | Selected |
|--------|-------------|----------|
| Membership по actualAsOf | | ✓ |
| По plannedAsOf | | |
| Ты решай | | |

**User's choice:** actualAsOf

| Option | Description | Selected |
|--------|-------------|----------|
| Без фильтра в 16 | | ✓ |
| Месяц/всё в 16 | | |
| Ты решай | | |

**User's choice:** Фильтр периода deferred

| Option | Description | Selected |
|--------|-------------|----------|
| Без подписи | | |
| Hint «всего» / «за всё время» | | ✓ |
| Ты решай | | |

**User's choice:** Тихий hint all-time

---

## Claude's Discretion

- RU microcopy for «всего» vs «за всё время» and partial line
- Aggregate helper shape mirroring debts totals
- Whether to omit redundant primary when single-currency equals primary

## Deferred Ideas

- Period filter (month / YTD / picker)
- Withdrawal / cash-out date for FX
- Global hero totals (rejected)
- Phase 17 NW forecast
- Sync REQUIREMENTS CPTY-01 text to hybrid
