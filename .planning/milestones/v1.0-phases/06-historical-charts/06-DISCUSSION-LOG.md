# Phase 6: Historical Charts - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-03
**Phase:** 6-Historical Charts
**Areas discussed:** Chart placement, Time range & sampling, Per-account currency, Sparse / gap UX

---

## Chart placement

| Option | Description | Selected |
|--------|-------------|----------|
| On home `/` under Капитал | Chart below hero + account list | ✓ (Q1) |
| Dedicated `/history` | New top-level nav | |
| Home + full history page | Sparkline + deep dive | |
| You decide | | |

**User's choice:** On home `/` under Капитал
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Expand on `/` dashboard | Per-account chart under row | ✓ (Q2) |
| Expand on `/accounts` only | | |
| Both | | |
| You decide | | |

**User's choice:** Expand on `/`
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Hero → NW chart → list | | ✓ (Q3) |
| Hero → list → NW chart | | |
| Chart toggled/optional | | |
| You decide | | |

**User's choice:** Hero → NW chart → account list
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Chart only | CRUD stays `/accounts` | ✓ (Q4) |
| Chart + history list | | |
| Chart + full actions | | |
| You decide | | |

**User's choice:** Chart only
**Notes:** —

---

## Time range & sampling

| Option | Description | Selected |
|--------|-------------|----------|
| All history, no picker | | |
| Presets 30d/90d/1y/all | | ✓ (Q1) |
| Last 90d only | | |
| You decide | | |

**User's choice:** Fixed presets
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Default 90d | | |
| Default 30d | | ✓ (Q2) |
| Default all | | |
| You decide | | |

**User's choice:** 30d default
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| One point per calendar day | | |
| Event dates only | | |
| Event dates + today | | ✓ (Q3) |
| You decide | | |

**User's choice:** Event dates + today
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| One shared range | NW + account expands | ✓ (Q4) |
| Independent ranges | | |
| Shared session, reset on leave | | |
| You decide | | |

**User's choice:** One shared range
**Notes:** —

---

## Per-account currency

| Option | Description | Selected |
|--------|-------------|----------|
| Native only | | |
| Primary only | | |
| Toggle native ↔ primary, default native | | ✓ (Q1) |
| You decide | | |

**User's choice:** Toggle; default native
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Debt only | | |
| Available only | | |
| Both series | | ✓ (Q2) |
| You decide | | |

**User's choice:** Both series, **stacked**
**Notes:** Free text «3, stacked»

| Option | Description | Selected |
|--------|-------------|----------|
| Primary: both converted stacked | | ✓ (Q3) |
| Native stack; primary debt only | | |
| Primary debt only; available native-only | | |
| You decide | | |

**User's choice:** Both converted to primary
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Always show toggle | | |
| Hide toggle when currency = primary | | ✓ (Q4) |
| You decide | | |

**User's choice:** Hide when primary currency
**Notes:** —

---

## Sparse / gap UX

| Option | Description | Selected |
|--------|-------------|----------|
| Empty state copy only | | |
| Empty axes, zero points | | ✓ (Q1) |
| You decide | | |

**User's choice:** Empty axes
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Plot partial point + mark | | |
| Plot partial, **no mark** | | ✓ (Q2) |
| Skip day | | |
| Break line | | |
| You decide | | |

**User's choice:** Plot partial without marking
**Notes:** «1, но модель не помечать» (после перехода на русский)

| Option | Description | Selected |
|--------|-------------|----------|
| Single point, no line | | ✓ (Q3) |
| Point + horizontal tail to today | | |
| Empty axes if < 2 points | | |
| You decide | | |

**User's choice:** Single point on axes, no line
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Skip primary point if no FX | | ✓ (Q4) |
| Disable primary toggle until covered | | |
| Explicit null/break in primary | | |
| You decide | | |

**User's choice:** Skip point
**Notes:** —

---

## Claude's Discretion

- Chart library, preset/toggle Russian chrome, event-date union algorithm, shared-range state mechanism, stacked credit visuals

## Deferred Ideas

- Dedicated `/history` route
- NW-04 assets/liabilities on charts (v2)
- Per-account expand on `/accounts`
- Home expand with history list/CRUD
- Daily densified sampling
