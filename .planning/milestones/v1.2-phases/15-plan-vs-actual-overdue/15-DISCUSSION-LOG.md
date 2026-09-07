# Phase 15: Plan vs actual + overdue - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-07
**Phase:** 15-Plan vs actual + overdue
**Areas discussed:** Ввод факта, Слоты на списке, Хром «заполни», Variance (ACT-03), Диалог/валидации/definition (extra)

---

## Ввод факта

| Option | Description | Selected |
|--------|-------------|----------|
| Отдельная кнопка → диалог | «Заполни» / «Внести факт» | ✓ |
| Деталь как долги | DebtDetail-style sheet | |
| Расширить «Изменить» | Fact section in definition dialog | |
| You decide | | |

**User's choice:** 1.1, 2.1 (amount+date, note optional), 3.2 (amount=plan, date=Moscow today), 4.1 (edit same dialog; delete via DestructiveConfirmStep)
**Notes:** Explicit user picks.

---

## Слоты на списке

| Option | Description | Selected |
|--------|-------------|----------|
| 1 row / next open | Keep Phase 14 shape | ✓ (Claude) |
| Multi-slot rows | | |
| Expand/chevron | | |
| You decide | User: «реши тут сам» | ✓ |

**User's choice:** Claude decides all.
**Notes:** FIFO via `nextOpenPlannedAsOf`; no multi-slot history in v1.2.

---

## Хром «заполни»

| Option | Description | Selected |
|--------|-------------|----------|
| Бейдж + кнопка «Заполни» | | ✓ |
| Только кнопка | | |
| Бейдж + tint строки | | |
| Amber warning | | ✓ |
| Red destructive | | |
| Muted only | | |
| Non-overdue: outline «Внести факт» | | ✓ |
| Sort: nearest planned (Phase 14) | | ✓ |

**User's choice:** 1.1, 2.1, 3.1, 4.2
**Notes:** Explicit.

---

## Variance (ACT-03)

| Option | Description | Selected |
|--------|-------------|----------|
| Inline row Δ | No Recharts | ✓ (Claude) |
| Page summary + rows | | |
| Recharts + rows | | |
| Source currency | | ✓ (Claude) |
| Primary FX now | | |
| actual − plan + RU copy | | ✓ (Claude) |
| Δ only when fact exists | | ✓ (Claude) |

**User's choice:** «реши сам»
**Notes:** Chart refinements stay Future Requirements.

---

## Extra gray areas (all Claude)

| Area | Decision |
|------|----------|
| Dialog context | Read-only plan date/amount; labels Заполни / Внести факт / Изменить факт |
| One-time filled row | plan + actual + Δ |
| Validations | amount &gt; 0; any valid actualAsOf; note optional |
| Definition edit while overdue | Allowed; separate from fact CTA; Phase 13 freeze rules |

**User's choice:** «во всех пунктах реши все сам»

---

## Claude's Discretion

- Slot surface, variance MVP, dialog chrome details, validations, definition-vs-overdue
- Minimal path for editing past recurring actuals (or defer)
- Amber token / chip implementation detail

## Deferred Ideas

- Phase 16 stats, Phase 17 forecast/ISO
- Nav overdue badge; Recharts variance polish; multi-slot history
- Credit-account todo (reviewed, not folded)
