# Phase 9: People + debts CRUD + nav - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-04
**Phase:** 9-People + debts CRUD + nav
**Areas discussed:** List structure, Person create flow, Debt edit after create, Debt delete in Phase 9, Nav «Долги», Empty states, Person delete confirm pattern, Global CTAs

---

## List structure

| Option | Description | Selected |
|--------|-------------|----------|
| Grouped by person | Person header, debts nested | ✓ |
| Flat debt list | Rows like AccountList | |
| Person list first | Detail route for nested debts | |
| You decide | | |

**User's choice:** Grouped by person
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Compact row | Direction + remaining + currency | ✓ |
| Rich row | Also due + note snippet | |
| You decide | | |

**User's choice:** Compact
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Show all people | Including zero-debt | ✓ |
| Only people with debts | Separate people area for empty | |
| You decide | | |

**User's choice:** Show all people
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| A–Z; newest debts by id | | ✓ |
| A–Z; I_OWE then THEY_OWE | | |
| You decide | | |

**User's choice:** A–Z; newest first by id
**Notes:** —

---

## Person create flow

| Option | Description | Selected |
|--------|-------------|----------|
| On /debts only | | |
| Only from debt dialog | | |
| Both | Panel + in debt dialog | ✓ |
| You decide | | |

**User's choice:** Both
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Same dialog one submit | Name field + debt together | ✓ |
| Separate mini-dialog | | |
| You decide | | |

**User's choice:** Same dialog
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Delete button always + blocked RU error | | ✓ |
| Button only when empty | | |
| You decide | | |

**User's choice:** Always show delete; blocked error if debts
**Notes:** Later upgraded confirm to 2-step dialog (constitution)

| Option | Description | Selected |
|--------|-------------|----------|
| Rename via dialog | | ✓ |
| Inline edit | | |
| You decide | | |

**User's choice:** Dialog
**Notes:** —

---

## Debt edit after create

| Option | Description | Selected |
|--------|-------------|----------|
| Meta only | Direction, due, note | ✓ |
| Meta + reassign person | | |
| Meta + currency | | |
| You decide | | |

**User's choice:** Meta only
**Notes:** Matches updateDebtMetaSchema

| Option | Description | Selected |
|--------|-------------|----------|
| Locked fields read-only visible | | ✓ |
| Hide locked fields | | |
| You decide | | |

**User's choice:** Read-only visible
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| «Я должен» / «Мне должны» | | ✓ |
| «Я → им» / «Они → мне» | | |
| You decide | | |

**User's choice:** «Я должен» / «Мне должны»
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Pre-select person, editable | | ✓ |
| Hard-lock to group person | | |
| You decide | | |

**User's choice:** Pre-selected, can change
**Notes:** —

---

## Debt delete in Phase 9

| Option | Description | Selected |
|--------|-------------|----------|
| Allow delete + cascade + confirm | | ✓ |
| Defer delete to Phase 10 | | |
| You decide | | |

**User's choice:** Allow delete now
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Delete on list row | | |
| Delete only in edit dialog | | ✓ |
| You decide | | |

**User's choice:** Edit dialog only
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| window.confirm | | |
| Second step in dialog | | ✓ |
| You decide | | |

**User's choice:** Second step in dialog
**Notes:** User also required migrating balance snapshot delete to same pattern in Phase 9; then asked to record as project constitution for all future destructive actions → written into `.planning/PROJECT.md`

| Option | Description | Selected |
|--------|-------------|----------|
| Confirm mentions cascade/history | | ✓ |
| Short «удалить долг?» | | |
| You decide | | |

**User's choice:** Mention cascade
**Notes:** —

---

## Nav «Долги»

| Option | Description | Selected |
|--------|-------------|----------|
| After Счета (suggested) | | |
| After Главная | | |
| Before Счета | | |
| Free text | Главная · Счета · Долги · Валюты | ✓ |

**User's choice:** Главная, Счета, Долги, Валюты
**Notes:** Reorders Валюты to the end

| Option | Description | Selected |
|--------|-------------|----------|
| Active for all /debts… | | ✓ |
| Exact /debts only | | |
| You decide | | |

**User's choice:** Prefix `/debts`
**Notes:** Clarified active = bold underline in nav

---

## Empty states

| Option | Description | Selected |
|--------|-------------|----------|
| «Нет людей» + add person CTA | | ✓ |
| Only «Новый долг» CTA | | |
| You decide | | |

**User's choice:** «Нет людей» + person CTA
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| «Нет долгов» + Новый долг | | ✓ |
| Button only | | |
| You decide | | |

**User's choice:** Text + button
**Notes:** —

---

## Person delete confirm + constitution

| Option | Description | Selected |
|--------|-------------|----------|
| 2-step dialog like debts/snapshots | | ✓ |
| Simpler confirm for empty person | | |
| You decide | | |

**User's choice:** 2-step dialog
**Notes:** Lock into PROJECT.md constitution for all destructive actions app-wide

---

## Global CTAs

| Option | Description | Selected |
|--------|-------------|----------|
| Top: Новый человек + Новый долг | | ✓ |
| Top: only Новый человек | | |
| No global CTAs | | |
| You decide | | |

**User's choice:** Both top CTAs
**Notes:** —

---

## Claude's Discretion

Exact dialog layout/shared confirm component; microcopy wording; debts Server Actions file layout; remaining display wiring details.

## Deferred Ideas

Phase 10 repayments/close; Phase 11 charts/totals; filters/search; person detail routes
