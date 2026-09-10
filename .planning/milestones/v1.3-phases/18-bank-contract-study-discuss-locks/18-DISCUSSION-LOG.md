# Phase 18: Bank contract study + discuss locks - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-08
**Phase:** 18-Bank contract study + discuss locks
**Areas discussed:** Bank contract + cycle math, Interest-free vs revolving OOS, NW overlay Option A vs B, RU vocabulary lock

---

## Todo fold

| Option | Description | Selected |
|--------|-------------|----------|
| Fold | Close into Phase 18 / v1.3 | ✓ |
| Review only | Keep deferred | |
| Skip | Ignore | |

**User's choice:** Fold credit-account grace todo  
**Notes:** Todo already had `resolves_phase: 18` and offered bank contract.

---

## Bank contract + cycle math

| Option | Description | Selected |
|--------|-------------|----------|
| Statement date | Выписка as cycle start | ✓ (+ fixed DOM) |
| Fixed DOM only | | |
| Per-purchase | | |
| N calendar days from statement | Initial Q2 pick | ✓ then refined |
| Dual DOM 21→15 next | From user dates after PDF | ✓ final |
| clampDayOfMonth | Month-end | ✓ |
| One amount field | Includes installment slice manually | ✓ |
| Don't design statement-date change | Manual DOM edit | ✓ |
| Due 15 inclusive | Overdue from 16 | ✓ |

**User's choice:** Statement on 21st; pay by 15th next month always; clamp; one field; no date-change migration; 15 inclusive.  
**Notes:** Supplied `/home/artem/Downloads/platinum.pdf` (ТП 7.90). Agent also fetched T-Bank tariff rules PDF. Overrides research “fixed duration days” as sole truth.

---

## Interest-free vs revolving OOS

| Option | Description | Selected |
|--------|-------------|----------|
| Highlight only | | |
| Highlight + interest hint | | ✓ |
| Compute APR | | |
| Cash fully OOS | | ✓ |
| Missed min not modeled | | ✓ |
| Penalties/fees all OOS | | ✓ |

**User's choice:** Q1=1+2, Q2=1, Q3=1, Q4=1  

---

## NW overlay Option A vs B

| Option | Description | Selected |
|--------|-------------|----------|
| A naive cash-out dip | −grace on forecast | rejected as-is |
| B markers / parallel | | |
| Defer default A | | |
| A′ NW-neutral | Visible at due, NW delta 0 | ✓ |
| Tooltip visibility | | ✓ |
| One series + split tooltip | Income vs obligation | ✓ |

**User's choice:** Wanted A but fix double deduct → NW-neutral; tooltip; Claude discretion on same-day = one series + split tooltip.  

---

## RU vocabulary lock

| Option | Description | Selected |
|--------|-------------|----------|
| Q1 option 3 | Задолженность / Платёж для беспроцентного / hide min | ✓ |
| Q2 option 1 | Дата выписки + Оплатить до | ✓ |
| Status Claude | К оплате / Оплачено + overdue highlight | ✓ |
| Tooltip Claude | Align «Платёж для беспроцентного» + NW unchanged | ✓ |

---

## Claude's Discretion

- Overdue interest hint wording
- NW-neutral implementation mechanics
- Schema shape dual DOM vs derived duration (must satisfy D-02)
- Obligation status labels and chart tooltip (user picked “you decide” → locked in CONTEXT)

## Deferred Ideas

None
