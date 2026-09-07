# Phase 13: Income schema + domain math - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-07
**Phase:** 13-Income schema + domain math
**Areas discussed:** Schema extras / model shape, Occurrence identity on edit, Occurrence window API, Delete / actuals cascade

---

## Schema extras / model shape

| Option | Description | Selected |
|--------|-------------|----------|
| Minimum | No active/endAsOf in Phase 13 | ✓ |
| Columns early | nullable endAsOf + active now | |
| active only | soft-off without end date | |
| You decide | | |

**User's choice:** Minimum (1)
**Notes:** Pause/end stay out of REQUIREMENTS for now.

| Option | Description | Selected |
|--------|-------------|----------|
| Both | note on source and actual | ✓ |
| Source only | | |
| Actual only | | |
| None in Phase 13 | | |

**User's choice:** Both (1)
**Notes:** User asked what source vs actual mean; explained template vs fact per slot.

| Option | Description | Selected |
|--------|-------------|----------|
| One table + kind | IncomeSource + RECURRING/ONE_TIME | |
| Two models | RecurringIncome / OneTimeIncome | ✓ |
| You decide | | |

**User's choice:** Two models (2)
**Notes:** Diverges from research single-table sketch.

| Option | Description | Selected |
|--------|-------------|----------|
| Polymorphic IncomeActual | | |
| Two actual tables | RecurringIncomeActual / OneTimeIncomeActual | ✓ |
| Source id hub | | |
| You decide | | |

**User's choice:** Two actual tables (2)

---

## Occurrence identity on edit

| Option | Description | Selected |
|--------|-------------|----------|
| Freeze keys | do not rewrite plannedAsOf/actuals | ✓ |
| Full regenerate | | |
| Forbid DOM change if actuals | | |
| You decide | | |

**User's choice:** Freeze keys (1)

| Option | Description | Selected |
|--------|-------------|----------|
| Actual exists → frozen | empty slots use current DOM | ✓ |
| Schedule revision as-of | | |
| You decide | | |

**User's choice:** Actual exists → frozen (1)

| Option | Description | Selected |
|--------|-------------|----------|
| Same freeze as recurring | | |
| Forbid plan edit after actual | ✓ |
| You decide | | |

**User's choice:** Forbid plan edit after actual (2)
**Notes:** Detailed one-time UX: plan visible in forecast; overdue without actual; actual may differ date/amount; after actual only fact fields editable. Forecast: both Доходы and Капитал overlay → revises FCST-01 (choice 3).

---

## Occurrence window API

| Option | Description | Selected |
|--------|-------------|----------|
| Caller from+to only | | |
| Helper default horizon | | |
| Two APIs | | |
| You decide | ✓ |

**User's choice:** You decide (4)
**Notes:** Claude: strict listInRange(from,to), no hidden default.

| Option | Description | Selected |
|--------|-------------|----------|
| Two helpers + merge | ✓ |
| One union helper | | |
| You decide | | |

**User's choice:** Two helpers + listAllInRange (1)

| Option | Description | Selected |
|--------|-------------|----------|
| Inclusive [from,to] | | |
| Half-open [from,to) | | |
| You decide | ✓ |

**User's choice:** You decide (3)
**Notes:** Claude: inclusive + plannedAsOf >= startAsOf.

| Option | Description | Selected |
|--------|-------------|----------|
| clamp in @/lib/dates | | |
| income module only | | |
| You decide | ✓ |

**User's choice:** You decide (3)
**Notes:** Claude: clampDayOfMonth in dates.ts.

---

## Delete / actuals cascade

| Option | Description | Selected |
|--------|-------------|----------|
| Cascade actuals on source delete | ✓ |
| Restrict while actuals exist | | |
| Soft UI forbid + schema cascade | | |
| You decide | | |

**User's choice:** Cascade (1)

| Option | Description | Selected |
|--------|-------------|----------|
| Person Restrict if income refs | ✓ |
| Cascade income on Person delete | | |
| You decide | | |

**User's choice:** Restrict (1)

| Option | Description | Selected |
|--------|-------------|----------|
| Max one actual per slot (unique) | ✓ |
| Multiple actuals per slot | | |
| You decide | | |

**User's choice:** Unique one actual (1)

| Option | Description | Selected |
|--------|-------------|----------|
| Allow delete single actual | ✓ |
| Forbid delete actual | | |
| You decide | | |

**User's choice:** Allow delete (1)

---

## Claude's Discretion

- listInRange without hidden default horizon
- Inclusive calendar range + startAsOf lower bound
- DOM clamp in `@/lib/dates`

## Deferred Ideas

- active/endAsOf columns to later phase
- Formal REQUIREMENTS.md FCST-01 text update at Phase 17 plan
- Timezone settings todo / merge account types todo (reviewed, not folded)
