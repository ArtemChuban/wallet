# Phase 20: Obligation CRUD + cycle UI - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-09
**Phase:** 20-Obligation CRUD + cycle UI
**Areas discussed:** Где UI, Объём списка циклов, Ввод суммы, Правка расписания DOM

---

## Где UI

| Option | Description | Selected |
|--------|-------------|----------|
| AccountFormDialog block | Grace inside account edit next to limit | |
| Separate dialog from list | Grace from AccountList, form without grace | |
| You decide — debts pattern | Detail separate from create/edit | ✓ |

**User's choice:** 3 (you decide) → debts-like separate dialog
**Notes:** Follow-up open entry: user said «1 или 3, реши сам» → button on credit row (not nested AccountForm step). Schedule fields: you decide → grace dialog top. Empty schedule: 3 → immediate DOM fields + hint.

---

## Объём списка циклов

| Option | Description | Selected |
|--------|-------------|----------|
| current+next only | resolveCurrentAndNext only | |
| Obligation history | OPEN + CLOSED like debts | ✓ (hybrid) |
| Candidates with placeholder | Rows without amount | |

**User's choice:** you decide → hybrid: persisted obligations + current/next CTA, no DB placeholders
**Notes:** CLOSED collapsed (2). Overdue: you decide → dialog + button mark. OPEN sort: you decide → overdue first.

---

## Ввод суммы

| Option | Description | Selected |
|--------|-------------|----------|
| Dialog | CTA → amount dialog | |
| Inline | Input on candidate row | |
| You decide | IncomeFact/Debt dialog | ✓ |

**User's choice:** 3 → dialog; then edit OPEN (1); early close with date (3); reopen with confirm (3)

---

## Правка расписания DOM

| Option | Description | Selected |
|--------|-------------|----------|
| Save + hint | Immediate save, no recalc of old rows | ✓ |
| Confirm if OPEN/history | Confirm then save | |
| Block DOM edit while OPEN | Stronger than D-14 | |

**User's choice:** 1 for DOM edit; 1 for clear with CLOSED remaining; 1 empty defaults (no 21/15 preset); 3 UX-01 → disclaimer, no snapshot debt duplicate

---

## Claude's Discretion

- Debts-like UI home; button entry over nested AccountForm; schedule in grace dialog; empty = immediate DOM form
- List hybrid + overdue chrome + OPEN sort
- Amount dialog pattern; DOM empty defaults; UX-01 disclaimer microcopy

## Deferred Ideas

None
