# Phase 27: SAVINGS schema + CRUD - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-11
**Phase:** 27-SAVINGS schema + CRUD
**Areas discussed:** Rate input & bounds, Accrual DOM rules, Edit surface, List/detail presentation

---

## Rate input & bounds

| Option | Description | Selected |
|--------|-------------|----------|
| Decimal % → bps | UI 16.5 → annualRateBps 1650 | ✓ |
| Integers only | Whole % only | |
| Raw bps in UI | User types 1650 | |
| You decide | | |

**User's choice:** Decimal % → bps
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Allow 0% | Forecast interest = 0 | ✓ |
| Forbid 0 | Min > 0 | |
| You decide | | |

**User's choice:** Allow 0%

| Option | Description | Selected |
|--------|-------------|----------|
| Hard cap 100% | | |
| Cap 999.99% | | |
| No soft cap (Int only) | | ✓ |
| You decide | | |

**User's choice:** No soft cap

| Option | Description | Selected |
|--------|-------------|----------|
| 2 decimal places | 16.50 → 1650 bps | ✓ |
| 1 decimal | | |
| Same via bps mapping | | |
| You decide | | |

**User's choice:** 2 decimals

---

## Accrual DOM rules

| Option | Description | Selected |
|--------|-------------|----------|
| Required 1–31 on create | | ✓ |
| Nullable | | |
| You decide | | |

**User's choice:** Required

| Option | Description | Selected |
|--------|-------------|----------|
| Never null after create | Number editable | ✓ |
| Allow clear to null | | |
| You decide | | |

**User's choice:** Never null

| Option | Description | Selected |
|--------|-------------|----------|
| No default — pick explicitly | | ✓ |
| Default 1st | | |
| Default today (Moscow) | | |
| You decide | | |

**User's choice:** No default

| Option | Description | Selected |
|--------|-------------|----------|
| Rate always required too (0 OK, null no) | | ✓ |
| Rate nullable | | |
| You decide | | |

**User's choice:** Both fields always required

---

## Edit surface

| Option | Description | Selected |
|--------|-------------|----------|
| Extend AccountFormDialog | name + rate + DOM on edit | ✓ |
| Separate dialog like Грейс | | |
| Create in form / edit separate | | |
| You decide | | |

**User's choice:** Extend AccountFormDialog

| Option | Description | Selected |
|--------|-------------|----------|
| Forever lock type/currency | No ASSET ↔ SAVINGS | ✓ |
| Allow type conversion | | |
| You decide | | |

**User's choice:** Forever lock (clarified after user asked what it meant)

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit field list in copy | | |
| Generic «Изменить счёт» | | ✓ |
| You decide | | |

**User's choice:** Generic copy

| Option | Description | Selected |
|--------|-------------|----------|
| Type-gated fields on create | Like credit limit | ✓ |
| Always visible | | |
| You decide | | |

**User's choice:** Type-gated

---

## List/detail presentation

| Option | Description | Selected |
|--------|-------------|----------|
| «Сберегательный» | | |
| «Вклад» | | |
| «Накопительный» | | ✓ |
| You decide | | |

**User's choice:** «Накопительный»

| Option | Description | Selected |
|--------|-------------|----------|
| Secondary line % · day | | |
| Only % on secondary line | user: only % | ✓ (then amended) |
| Only in forms | | |
| Badge by type | | |

**User's choice:** Secondary line under name — **only %**, plus later free-text: also show **days until next accrual** next to %; raw DOM only in forms

| Option | Description | Selected |
|--------|-------------|----------|
| DOM only in create/edit | | ✓ |
| DOM also elsewhere | | |

**User's choice:** Forms only for raw DOM; list shows countdown

| Option | Description | Selected |
|--------|-------------|----------|
| «Годовой %» / «День начисления» | | ✓ |
| «Ставка» / «День месяца» | | |
| «Процент годовых» / «Дата начисления (день)» | | |
| You decide | | |

**User's choice:** «Годовой %» / «День начисления»

---

## Todo fold

| Option | Description | Selected |
|--------|-------------|----------|
| Fold savings todo into phase | | ✓ |
| Review only | | |
| Skip | | |

**User's choice:** Fold `.planning/todos/pending/2026-09-10-savings-account-type-with-interest-nw-forecast.md`

---

## Claude's Discretion

- Soft max rejected by user; still reject negatives
- Exact «через N дн.» pluralization / % formatting
- days-until helper layout (display-only; interest amount math Phase 28)
- Single vs split update action for SAVINGS edit

## Deferred Ideas

- Phases 28–30: math, overlay/SAVISO, MCP
- No new deferred product ideas beyond roadmap
