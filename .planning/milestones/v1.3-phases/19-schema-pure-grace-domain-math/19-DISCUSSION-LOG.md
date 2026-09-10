# Phase 19: Schema + pure grace domain math - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-08
**Phase:** 19-Schema + pure grace domain math
**Areas discussed:** Account schedule fields, Obligation row shape, Cycle identity / generation, Null / non-credit rules

---

## Account schedule fields

### Q1 — What to store on Account

| Option | Description | Selected |
|--------|-------------|----------|
| Dual DOM only | statementDayOfMonth + dueDayOfMonth; no anchor/duration | ✓ |
| Dual DOM + graceAnchorAsOf | Tracking start date | |
| Dual DOM + graceDurationDays cache | Display days; due still from DOM | |

**User's choice:** Dual DOM only
**Notes:** User asked for clearer Russian explanation before choosing.

### Q2 — Which account types

| Option | Description | Selected |
|--------|-------------|----------|
| FIAT_CREDIT only | Mirror creditLimitMinor | ✓ |
| Any Account type | UI filters later | |
| You decide | | |

**User's choice:** FIAT_CREDIT only

### Q3 — Both-or-neither invariant

| Option | Description | Selected |
|--------|-------------|----------|
| Hard CHECK | Both null or both set | ✓ |
| Soft | DB allows partial; Zod later | |
| You decide | | |

**User's choice:** Hard CHECK

### Q4 — Edit DOM after obligations exist

| Option | Description | Selected |
|--------|-------------|----------|
| Leave old rows untouched | New schedule applies forward only | ✓ |
| Recalc OPEN dues | | |
| Block edit while OPEN | | |

**User's choice:** Leave old rows untouched

---

## Obligation row shape

### Q1 — Persist dueAsOf

| Option | Description | Selected |
|--------|-------------|----------|
| Store at create | Freeze due on row | ✓ |
| Always recompute | From Account DOM | |
| You decide | | |

**User's choice:** Store at create

### Q2 — amountMinor at create

| Option | Description | Selected |
|--------|-------------|----------|
| Required | No row without amount | ✓ |
| Nullable | Placeholder cycles | |
| You decide | | |

**User's choice:** Required

### Q3 — Status model

| Option | Description | Selected |
|--------|-------------|----------|
| OPEN \| CLOSED | Overdue from calendar | ✓ |
| OPEN \| OVERDUE \| CLOSED | Persisted overdue | |
| closedAsOf only | No enum | |

**User's choice:** OPEN | CLOSED

### Q4 — Extra fields

| Option | Description | Selected |
|--------|-------------|----------|
| closedAsOf + note; currency from Account | Research minimum | ✓ |
| No closedAsOf | | |
| Own currency FK | | |

**User's choice:** closedAsOf + note; inherit Account currency

---

## Cycle identity / generation

### Q1 — cycleStartAsOf meaning

| Option | Description | Selected |
|--------|-------------|----------|
| Clamped statement date for month | | ✓ |
| Free-form user date each time | | |
| You decide | | |

**User's choice:** Clamped statement date

### Q2 — due engine

| Option | Description | Selected |
|--------|-------------|----------|
| Next month + dueDayOfMonth + clamp | | ✓ |
| addCalendarDays(start, N) sole SoT | | |
| Hybrid duration display | | |

**User's choice:** Next month + due DOM

### Q3 — Pure API richness

| Option | Description | Selected |
|--------|-------------|----------|
| Primitives + overdue only | | |
| + listCycleWindows / current-or-next | | ✓ |
| You decide | | |

**User's choice:** Include cycle-window helpers

### Q4 — Candidates vs DB rows

| Option | Description | Selected |
|--------|-------------|----------|
| Pure candidates only | No Prisma in helpers | ✓ (via you decide → recommend) |
| Auto-create empty OPEN | | |
| You decide | | ✓ |

**User's choice:** You decide → Claude locked pure candidates only (no auto-create)

---

## Null / non-credit rules

### Q1 — Credit without schedule

| Option | Description | Selected |
|--------|-------------|----------|
| Obligations forbidden | | ✓ |
| Allow manual cycle without DOM | | |
| You decide | | |

**User's choice:** Obligations forbidden

### Q2 — Clear schedule while OPEN

| Option | Description | Selected |
|--------|-------------|----------|
| Forbid until OPEN cleared | | ✓ |
| Allow clear; keep rows | | |
| Cascade close/delete OPEN | | |

**User's choice:** Forbid

### Q3 — Account delete vs obligations

| Option | Description | Selected |
|--------|-------------|----------|
| Restrict | Like BalanceSnapshot | |
| Cascade | Delete obligations with account | ✓ |
| Hybrid | | |

**User's choice:** Cascade

### Q4 — Duplicate cycle key

| Option | Description | Selected |
|--------|-------------|----------|
| Reject duplicate; update existing | | ✓ |
| Upsert overwrite | | |
| You decide | | |

**User's choice:** Reject duplicate

---

## Claude's Discretion

- Pure helpers: candidates only (user said you decide on Q4 cycle generation)
- Zod/CHECK naming, module filenames, current-vs-next window edge details

## Deferred Ideas

- Phase 20 UI CRUD / early close / overdue chrome
- Phase 21 forecast A′
- Phase 22 GRACEISO
- Milestone OOS: APR / minimum / cash
