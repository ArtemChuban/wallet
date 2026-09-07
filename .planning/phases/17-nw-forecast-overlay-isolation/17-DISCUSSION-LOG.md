# Phase 17: NW forecast overlay + isolation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-07
**Phase:** 17-NW forecast overlay + isolation
**Areas discussed:** Forecast membership, Horizon, Chart chrome, FX honesty

---

## Todos (cross-reference)

| Option | Description | Selected |
|--------|-------------|----------|
| Fold weak matches | Merge accounts / timezone / credit forecast / AI agent | |
| Fold none | Keyword noise only | ✓ |

**User's choice:** Implicit none (`all` referred to gray areas)
**Notes:** Scores ≤0.4; out of forecast scope

---

## Forecast membership

### What enters NW overlay?

| Option | Description | Selected |
|--------|-------------|----------|
| Recurring only | Revert Phase 13 D-12; keep old FCST-01 | |
| Recurring + future one-time | Lock D-12; revise FCST-01/roadmap | ✓ |
| You decide | | |

**User's choice:** Recurring + future one-time

### Which slots enter the sum?

| Option | Description | Selected |
|--------|-------------|----------|
| Open future only | plannedAsOf > today, no actual | ✓ |
| All future even with actual | Double-count risk | |
| Open future + past overdue | Overdue pulls forward | |

**User's choice:** Open future only

### Today boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Today slot not in forecast | NW today = accounts only | ✓ |
| Today open slot in forecast | First overlay step | |
| You decide | | |

**User's choice:** Today excluded

### Series shape

| Option | Description | Selected |
|--------|-------------|----------|
| Cumulative from anchor | Stair-step NW path | ✓ |
| Non-cumulative per-date spikes | | |
| You decide | | |

**User's choice:** Cumulative

---

## Horizon

### Length

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed 90d independent | Research default | |
| Fixed N months | | |
| Tied to lookback preset | | |
| User freeform | Mirror preset; all→1y cap | ✓ |

**User's choice:** `30d→30d`, `90d→90d`, `1y→1y`, `all→1y`

### Sampling

| Option | Description | Selected |
|--------|-------------|----------|
| Sparse pay∪today∪horizonEnd | | ✓ |
| Every calendar day | | |
| You decide | | |

**User's choice:** Sparse

### X-axis

| Option | Description | Selected |
|--------|-------------|----------|
| Past + future through horizon | | ✓ |
| Axis ≤ today only | | |
| You decide | | |

**User's choice:** Past + future

### Empty horizon

| Option | Description | Selected |
|--------|-------------|----------|
| Hide forecast series | | ✓ |
| Flat dashed at anchor | | |
| You decide | | |

**User's choice:** Hide series

---

## Chart chrome

### Render style

| Option | Description | Selected |
|--------|-------------|----------|
| Dashed Line | ComposedChart / strokeDasharray | ✓ |
| Dashed Area | | |
| You decide | | |

**User's choice:** Dashed Line

### Legend

| Option | Description | Selected |
|--------|-------------|----------|
| Accounts + Прогноз | | ✓ |
| Факт / Прогноз only | Loses account stack labels | |
| Accounts only; Прогноз in tooltip | | |
| You decide | | |

**User's choice:** Accounts + Прогноз (after clarification)

### Tooltip

| Option | Description | Selected |
|--------|-------------|----------|
| Split ≤today stack / >today Прогноз only | | ✓ |
| Always both | | |
| You decide | | |

**User's choice:** Split

### Today marker

| Option | Description | Selected |
|--------|-------------|----------|
| ReferenceLine at today | | ✓ |
| No line | | |
| You decide | | |

**User's choice:** ReferenceLine

---

## FX honesty

### As-of

| Option | Description | Selected |
|--------|-------------|----------|
| LOCF as of today | | ✓ |
| LOCF plannedAsOf | Same last-known in practice | |
| You decide | | |

**User's choice:** LOCF today

### Missing rate

| Option | Description | Selected |
|--------|-------------|----------|
| Exclude slot + partial | | ✓ |
| Hide whole forecast | | |
| 0 / rate 1 | Forbidden | |
| You decide | | |

**User's choice:** Exclude + partial

### Partial placement

| Option | Description | Selected |
|--------|-------------|----------|
| Banner by NW chart | | ✓ |
| Tooltip only | | |
| Both | | |
| You decide | | |

**User's choice:** Banner by chart

### All slots FX-excluded

| Option | Description | Selected |
|--------|-------------|----------|
| Hide series + show partial | | ✓ |
| Flat dashed + partial | | |
| You decide | | |

**User's choice:** Hide + partial

---

## Claude's Discretion

- RU microcopy; ComposedChart details; INISO file layout; page preload vs per-preset recompute; REQ/ROADMAP/STATE FCST-01 sync tasking

## Deferred Ideas

None from discussion. Reviewed weak todos not folded (see CONTEXT.md).
