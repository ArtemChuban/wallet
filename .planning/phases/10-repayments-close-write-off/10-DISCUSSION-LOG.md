# Phase 10: Repayments + close/write-off - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-04
**Phase:** 10-Repayments + close/write-off
**Areas discussed:** Repayment entry surface, History layout, Early forgive UX, CLOSED debts on /debts

---

## Repayment entry surface

| Option | Description | Selected |
|--------|-------------|----------|
| Inside debt edit dialog | Section in existing DebtFormDialog | |
| Dedicated debt detail Dialog | Separate detail surface for repay/history/close | ✓ |
| List-row repay action | «Погасить» opens repay-only dialog | |
| You decide | Claude picks between detail vs row repay | ✓ (chose detail) |

**User's choice:** Prefer 2 or 3; Claude chose dedicated detail Dialog. Then: row click opens detail; Dialog not Sheet; meta stays in separate DebtFormDialog.

**Notes:** User asked all discussion in Russian after first English prompt.

---

## History layout

| Option | Description | Selected |
|--------|-------------|----------|
| Repayments only | Size-changes out of timeline | |
| Mixed timeline | Repayments + size-changes | ✓ |
| Newest first | UI sort | ✓ |
| Oldest first | Journal chronology | |
| Delete repayments only | | |
| Delete repayments and size-changes | | ✓ |
| Explicit RU type labels | | ✓ |
| Amount sign only | | |

**User's choice:** Mixed timeline, newest first, delete both event kinds, explicit labels.

**Notes:** Forgive-specific label refined in Early forgive («Списание»).

---

## Early forgive UX

| Option | Description | Selected |
|--------|-------------|----------|
| One-tap forgive only | | |
| Manual size-change only | | |
| Both one-tap + manual form | | ✓ (via You decide) |
| Confirm before forgive | In-dialog second step | ✓ |
| No confirm | | |
| asOfDate required + optional note | | ✓ |
| Today-only + optional note | | |
| Label «Прощение» | | |
| Always «Изменение суммы» | | |
| Label «Списание» | | ✓ |

**User's choice:** You decide on entry → both; then confirm; asOfDate+optional note; «Списание» label.

---

## CLOSED debts on /debts

| Option | Description | Selected |
|--------|-------------|----------|
| Always visible with badge | | |
| Collapsed section / accordion | | ✓ |
| Hidden with toggle | | |
| Per-person «Закрытые» | | ✓ |
| Page-global closed section | | |
| Full mutation access on CLOSED | | ✓ |
| History + delete events only | | |
| View-only | | |
| Collapsed by default | | ✓ |
| Expanded by default | | |

**User's choice:** Collapsed per-person section, default collapsed, full access.

---

## Claude's Discretion

- Dedicated detail vs list-row repay (user: 2 or 3)
- Both forgive button + manual size-change (user: You decide)
- Detail Dialog layout density, microcopy, how «Списание» is distinguished in storage without schema break

## Deferred Ideas

- Phase 11 charts/totals; REPAY-04/05; filters/search; Sheet primitive
