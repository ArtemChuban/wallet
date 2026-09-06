# Phase 8: Debts schema + domain math - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-04
**Phase:** 8-Debts schema + domain math
**Areas discussed:** Write-off/size model, Same-day events, Primary totals, Close/reopen, Size-change semantics, Status storage, FK/delete, Series scope

---

## Write-off storage → size-change ledger

| Option | Description | Selected |
|--------|-------------|----------|
| Debt.writeOffMinor field | Research default; remaining = initial − repayments − writeOff | (initially, then superseded) |
| WRITE_OFF repayment type | Forgiveness as repayment row | |
| Two tables + signed size changes both ways | Repayments separate; size changes separate; ± | ✓ |
| Principal formula without writeOff | remaining = (initial+ΣΔ) − Σ repayments | ✓ |

**User's choice:** Rejected simple writeOff field after proposing size-change transactions; chose two tables, both directions, principal+repayments formula (no writeOffMinor).
**Notes:** User: easier to see initial size + history of size changes. Overrides REQUIREMENTS DEBT-02/03 writeOff/immutable-initial narrative.

---

## Same-day repayments / size changes

| Option | Description | Selected |
|--------|-------------|----------|
| Multiple repayments same day | No unique (debtId, asOfDate) | ✓ |
| Unique one repayment per day | Like BalanceSnapshot | |
| Multiple size changes same day | Symmetric with repayments | ✓ |
| Same-day order: size then repayments | Type-priority | |
| Same-day order: by insert id | Unified chronology | ✓ |
| Size change has asOfDate | Backdatable YYYY-MM-DD | ✓ |
| Size change only createdAt | No calendar as-of | |

**User's choice:** Multiple both; order by id; size changes have asOfDate.
**Notes:** Clarified asOfDate with example after user confusion.

---

## Primary totals helper rules

| Option | Description | Selected |
|--------|-------------|----------|
| OPEN only in totals | Closed excluded | ✓ |
| Include CLOSED | | |
| Missing FX → exclude + isPartial | Like NW | ✓ |
| Missing FX → 1:1 | | |
| asOfDate parameter | Pure helper | ✓ |
| Always today inside helper | | |
| Aggregates only | | |
| Rows + aggregates (NW-like) | Claude discretion when user picked "you decide" | ✓ |

**User's choice:** OPEN only; FX honesty; asOfDate param; Claude picked rows+aggregates.
**Notes:** —

---

## Close / reopen invariants

| Option | Description | Selected |
|--------|-------------|----------|
| Auto CLOSED at remaining 0 | | ✓ |
| Explicit close only | | |
| Auto OPEN when remaining > 0 | | ✓ |
| Stay CLOSED until explicit reopen | | |
| Allow events on CLOSED | Status recomputes | ✓ |
| Reject events on CLOSED | | |
| remaining never < 0 | Reject bad events | ✓ |
| Allow temporary negative | | |

**User's choice:** Auto close/reopen; events on CLOSED ok; remaining ≥ 0 hard.
**Notes:** —

---

## Size-change semantics

| Option | Description | Selected |
|--------|-------------|----------|
| Signed deltaMinor | | ✓ |
| Absolute principal-after | | |
| Reject delta == 0 | | ✓ |
| Allow delta == 0 | | |
| initialAmountMinor > 0 | | ✓ |
| initial ≥ 0 | | |
| Nullable note on both event tables | | ✓ |
| Note only on Debt | | |

**User's choice:** delta; reject 0; initial > 0; notes on events.
**Notes:** —

---

## Status stored vs derived

| Option | Description | Selected |
|--------|-------------|----------|
| Persist OPEN/CLOSED | | ✓ |
| Derive from remaining only | | |
| closedAt YYYY-MM-DD | | |
| closedAt DateTime | | |
| No closedAt | | ✓ |
| Hard sync status ↔ remaining | | ✓ |
| Soft sync in actions only | | |

**User's choice:** Store status; no closedAt; hard sync.
**Notes:** —

---

## FK / delete policy

| Option | Description | Selected |
|--------|-------------|----------|
| All Restrict | | |
| Person→Debt Restrict; Debt→events Cascade | | ✓ |
| Cascade everywhere | | |
| Currency→Debt Restrict | | ✓ |

**User's choice:** Restrict person/currency; Cascade debt events.
**Notes:** —

---

## Series helpers in Phase 8

| Option | Description | Selected |
|--------|-------------|----------|
| Remaining + totals + validations only | Series Phase 11 | ✓ |
| Also ship pure series builders now | | |

**User's choice:** No series in Phase 8.
**Notes:** —

---

## Claude's Discretion

- Primary totals return shape: rows + aggregates (like `computeNetWorthRows`)
- Prisma naming, Zod layout, repayment amountMinor > 0 recommendation, direction enum / Person unique defaults, optional Debt dueDate/note for Phase 9 readiness

## Deferred Ideas

- Chart series → Phase 11
- CRUD UI / nav → Phase 9
- Repayment UX → Phase 10
