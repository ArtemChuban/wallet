# Phase 21: Капитал forecast integration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-09
**Phase:** 21-Капитал forecast integration
**Areas discussed:** Due-date membership, Flat A′ visibility, Same-day tooltip, Partial FX banner

---

## Due-date membership

### Q1 — Which OPEN enter forecast?

| Option | Description | Selected |
|--------|-------------|----------|
| Strict future only | `dueAsOf > today` (today + overdue out) — mirrors income | |
| Include today | `dueAsOf >= today` (overdue out) | |
| Include overdue OPEN | Any OPEN on overlay including past dues | ✓ |
| You decide | | |

**User's choice:** 3 — include overdue OPEN
**Notes:** Discussion language switched to Russian after this area started.

### Q2 — Where to place overdue on series?

| Option | Description | Selected |
|--------|-------------|----------|
| Fold onto today | Hinge / today sample | ✓ |
| Keep original dueAsOf | Even if ≤ today | |
| Lookback else fold today | | |
| You decide | | |

**User's choice:** 1

### Q3 — Very old overdue?

| Option | Description | Selected |
|--------|-------------|----------|
| Always if OPEN | Any age folds to today | ✓ |
| Only within lookback preset | Older stay off overlay | |
| You decide | | |

**User's choice:** 1

### Q4 — Beyond horizon?

| Option | Description | Selected |
|--------|-------------|----------|
| Exclude | Only `(today, horizonEnd]` + today bucket | ✓ |
| Include all future OPEN uncapped | | |
| You decide | | |

**User's choice:** 1

---

## Flat A′ visibility

### Q1 — How slot exists when ΔNW=0?

| Option | Description | Selected |
|--------|-------------|----------|
| Always sample due | Flat line OK; tooltip works | ✓ |
| Sample only with same-day income | | |
| Separate visual marker | | |
| You decide | | |

**User's choice:** 1

### Q2 — Grace-only horizon?

| Option | Description | Selected |
|--------|-------------|----------|
| Show flat dashed «Прогноз» | | ✓ |
| Hide series | | |
| Dashed only to last due | | |
| You decide | | |

**User's choice:** 1

### Q3 — On-line distinction grace vs income?

| Option | Description | Selected |
|--------|-------------|----------|
| No — tooltip only | One dashed series | ✓ |
| Different marker on grace due | | |
| You decide | | |

**User's choice:** 1

### Q4 — Overdue on today UI?

| Option | Description | Selected |
|--------|-------------|----------|
| In today tooltip next to stack/NW | | ✓ |
| Not in today tooltip | | |
| Hinge annotation only | | |
| You decide | | |

**User's choice:** 1

---

## Same-day tooltip

### Q1 — Income + grace same day layout?

| Option | Description | Selected |
|--------|-------------|----------|
| Two blocks in one tooltip | | |
| Summary NW + expandable events | | |
| NW only; grace only if no income | | |
| You decide | | ✓ |

**User's choice:** 4 — Claude discretion → two blocks (income/forecast then grace D-19)

### Q2 — Show grace amount?

| Option | Description | Selected |
|--------|-------------|----------|
| Amount in account and/or primary | Even if ΔNW=0 | ✓ |
| Label only | | |
| Primary only | | |
| You decide | | |

**User's choice:** 1

### Q3 — Multiple OPEN same day?

| Option | Description | Selected |
|--------|-------------|----------|
| One row per obligation | | ✓ |
| One aggregated row | | |
| Group by account | | |
| You decide | | |

**User's choice:** 1

### Q4 — FX-excluded slot in tooltip?

| Option | Description | Selected |
|--------|-------------|----------|
| Omit; banner only | Like income | ✓ |
| Stub «курс недоступен» | | |
| You decide | | |

**User's choice:** 1

---

## Partial FX banner

### Q1 — Banner shape?

| Option | Description | Selected |
|--------|-------------|----------|
| One generic banner | No source detail | |
| Same banner with kind detail | доходы / грейс | ✓ (then revised) |
| Two separate banners | | |
| You decide | | |

**User's choice:** 2, plus «нужно также указывать какого именно курса нет»
**Notes:** Later freeform: do **not** tag target (доходы/грейс) — only missing currency codes with «нет курса».

### Q2 — Multiple missing currencies?

| Option | Description | Selected |
|--------|-------------|----------|
| List all codes | | ✓ |
| First N + and more | | |
| Count only | | |
| You decide | | |

**User's choice:** 1

### Q3 — Same currency for income + grace?

| Option | Description | Selected |
|--------|-------------|----------|
| Once with both tags | | |
| Two phrases | | |
| You decide | | |

**User's choice:** Freeform override — «Не нужно указывать таргет, просто нет курса» (codes only, no kind tags; code once is enough)

### Q4 — All slots FX-excluded?

| Option | Description | Selected |
|--------|-------------|----------|
| Still show incomplete banner with codes | | ✓ |
| Different «недоступен» copy | | |
| You decide | | |

**User's choice:** 1

---

## Claude's Discretion

- Same-day tooltip layout (user picked «you decide») → two blocks, income/forecast then grace.
- A′ zero-delta representation in `nw-forecast` math.
- Chart point metadata model for today vs future grace rows.
- Banner list-join microcopy.

## Deferred Ideas

- Chart legend separating доходы vs обязательства on «Прогноз» (already deferred beyond v1.3 in REQUIREMENTS.md)
- Phase 22 GRACEISO
