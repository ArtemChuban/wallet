# Phase 7: Address tech debt: LOCF consolidation + Nyquist 3–6 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-04
**Phase:** 7-address-tech-debt-locf-consolidation-nyquist-3-6
**Areas discussed:** Canonical LOCF API, Nyquist close strategy, Debt scope boundary, Work order / risk gate (partial → user abbreviated)

---

## Canonical LOCF API

| Option | Description | Selected |
|--------|-------------|----------|
| Pure in-memory | Shared locf*AsOf / buildLocfMaps; Prisma thin or gone | |
| Prisma canonical | get*AsOf truth; batch still DB; series separate | |
| Hybrid | buildLocfMaps for lists + pure multi-date for charts | |
| You decide | Builder picks; lock null-before-first + batch lists | ✓ |

**User's choice:** 4 — решай сам (after clarification of triplicate LOCF)
**Notes:** Follow-ups on get*AsOf fate, module layout, parity proof also answered «4». User then said they will always answer «решай сам» and asked to skip remaining discuss Q&A.

---

## Nyquist / scope / sequencing

| Option | Description | Selected |
|--------|-------------|----------|
| Full discuss | Continue 4Q×area for Nyquist, scope, order | |
| Abbreviate | Lock from audit + Claude discretion; write CONTEXT | ✓ |

**User's choice:** Skip remaining planning discussion («пропустим планирование» / always «решай сам»)
**Notes:** Interpreted as skip interactive discuss, still produce CONTEXT.md for `/gsd-plan-phase 7`. Scope defaulted to LOCF + Nyquist 3–6 only; adjacent audit items deferred.

---

## Claude's Discretion

- LOCF API shape, get*AsOf lifecycle, module placement, parity strategy
- Nyquist validate-phase vs evidence reconcile; LOCF↔Nyquist sequencing
- Drive-by extras only if zero-cost

## Deferred Ideas

- Nav currencies discoverability, PROJECT.md sync, optional smoke re-runs (see CONTEXT.md Deferred)
