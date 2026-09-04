# Phase 3: Dated Balance Snapshots - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-03
**Phase:** 3-Dated Balance Snapshots
**Areas discussed:** Entry surface, Credit debt meaning, Same-date + history edits, List vs history display

---

## Entry surface

| Option | Description | Selected |
|--------|-------------|----------|
| Accounts list dialog | Per-row Dialog (amount + as-of date) | ✓ |
| Dedicated `/balances` page | Separate nav + snapshot list | |
| Per-account `/accounts/[id]` | History + set on account page | |
| You decide | Claude picks Phase-2-consistent pattern | |

**User's choice:** Accounts list dialog
**Notes:** Row shows current LOCF + snapshot date; dialog defaults to today; empty state CTA «Задать первый баланс».

---

## Credit debt meaning

| Option | Description | Selected |
|--------|-------------|----------|
| Positive debt entry | Enter how much owed | |
| Signed balance | Negative = debt | |
| Available remaining (user) | Enter limit left; debt = limit − input | ✓ |
| Store available vs store debt | Persist available; derive debt on read | ✓ (available) |
| Validation | 0 ≤ available ≤ limit | ✓ |
| List display | Available only / debt only / both | ✓ both |

**User's choice:** Enter remaining available credit; store available; strict 0…limit; list shows available + debt + date
**Notes:** Example given: limit 5000, enter 3000 → debt 2000.

---

## Same-date + history edits

| Option | Description | Selected |
|--------|-------------|----------|
| Overwrite same date | One snapshot per (account, date) | ✓ |
| Forbid duplicate date | Error until delete | |
| Overwrite only, no delete | | |
| Overwrite + delete | | ✓ |
| Immutable after create | | |
| Delete in dialog / history / both | History list only | ✓ |
| Future dates | Forbid / allow | ✓ forbid |

**User's choice:** Overwrite same date; allow delete from history list only; no future dates
**Notes:** User initially unclear on delete UI location; clarified with concrete UI scenarios → chose history list only.

---

## List vs history display

| Option | Description | Selected |
|--------|-------------|----------|
| Expand row / Sheet / Dialog | How to open history | ✓ expand row |
| Newest first / oldest first | History sort | ✓ newest first |
| Non-credit history columns | Date+amount / +current marker | ✓ date+amount |
| Credit history columns | Available / available+debt / debt | ✓ date+available |

**User's choice:** Expand row; newest first; non-credit date+amount; credit date+available
**Notes:** Debt shown on collapsed credit list row (D-08), not repeated in every history line.

---

## Claude's Discretion

Exact Prisma naming, unique constraint shape, Server Action error copy, expand/collapse affordance details, LOCF helper placement — standard Next + Prisma + shadcn consistent with Phases 1–2.

## Deferred Ideas

- BAL-03 copy-forward (v2)
- Dedicated `/balances` or account detail route
- Full ACCT-03 / NW dashboard (Phase 5)
- FX / NW / charts (Phases 4–6)
