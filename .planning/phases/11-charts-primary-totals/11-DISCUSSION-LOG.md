# Phase 11: Charts + primary totals - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-05
**Phase:** 11-Charts + primary totals
**Areas discussed:** Chart home in detail Dialog, Series/stack shape, Primary totals hero (+ Капитал parity)

---

## Chart home in detail Dialog

| Option | Description | Selected |
|--------|-------------|----------|
| New «Графики» tab | Separate tab like repay/history | |
| Always-visible under header | Charts while switching action tabs | |
| Inside «История» | Free-text: charts in History tab | ✓ |

**User's choice:** Inside «История» tab
**Notes:** Follow-up: charts above timeline (selected). User expected one chart total; clarified DCHART-01/02; locked one stacked composition instead of two charts. Range: «всё» only (no presets).

---

## Series / stack shape

| Option | Description | Selected |
|--------|-------------|----------|
| Start at create/open date, flat until events | + extend to today | ✓ |
| Start at first event | No pre-event segment | |
| Size-change changes total height (2 layers) | No third series | ✓ |
| Size-change as third stack layer | Three series | |

**User's choice:** Start at open date; size-change moves total; axis to today MSK
**Notes:** Past-dated open required. Locked create field «Дата» (default today MSK); immutable after create (not `createdAt`-only).

---

## Primary totals hero

| Option | Description | Selected |
|--------|-------------|----------|
| Header above list (Капитал-like) | | ✓ |
| Sticky on scroll | | |
| Banner only (Капитал copy) | No excluded list | |
| Banner + excluded list + reason | | ✓ |
| Always show hero (incl. zeros) | | ✓ |
| Hide hero when no OPEN | | |
| Two columns side-by-side | | ✓ |
| Vertical stack | | |

**User's choice:** Header hero; two columns; always visible; banner + excluded list with currency reason; same list pattern on Капитал `/`
**Notes:** User replied “1” then described list+reason and asked for Капитал parity — recorded as list+reason + D-14.

---

## Claude's Discretion

- Recharts styling/tooltips; migration backfill for open date; exact RU excluded-row copy; chart module placement under debts (not historical-series).

## Deferred Ideas

- Separate repayment-only chart; range presets; editable open date after create
