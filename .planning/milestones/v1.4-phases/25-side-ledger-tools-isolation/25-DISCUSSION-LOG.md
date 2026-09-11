# Phase 25: Side-Ledger Tools + Isolation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-10
**Phase:** 25-Side-Ledger Tools + Isolation
**Areas discussed:** Forecast overlay contract, Isolation proof

---

## Todo triage

| Option | Description | Selected |
|--------|-------------|----------|
| skip | Savings account / interest NW forecast — not SIDE | ✓ |
| fold | Fold into Phase 25 | |

**User's choice:** Implicit skip (chose gray areas 3,4 only; recommend skip followed)
**Notes:** Weak keyword match only; already Phase 24 deferred / backlog

---

## Gray area selection

| Option | Description | Selected |
|--------|-------------|----------|
| 1 Tool catalog split | Names / debts totals split | |
| 2 List filters / defaults | OPEN / income range | |
| 3 Forecast overlay contract | Series / horizon / contents | ✓ |
| 4 Isolation proof | Tests / flags / CI / copy | ✓ |

**User's choice:** 3,4

---

## Forecast overlay contract

### Q1 — response shape

| Option | Description | Selected |
|--------|-------------|----------|
| Sparse series | `buildNetWorthForecastSeries` parity | ✓ |
| Summary only | Anchor + events, no series | |
| You decide | Prefer sparse | |

**User's choice:** 1

### Q2 — horizon

| Option | Description | Selected |
|--------|-------------|----------|
| UI presets | `1m`/`3m`/`1y` | |
| Free horizonEnd | YYYY-MM-DD | ✓ |
| Both | range or horizonEnd | |
| You decide | Prefer presets | |

**User's choice:** 2

### Q3 — overlay contents

| Option | Description | Selected |
|--------|-------------|----------|
| Full parity | income + A′ grace events | ✓ |
| Income only | | |
| Grace A′ only | | |
| You decide | Prefer full | |

**User's choice:** 1

### Q4 — defaults

| Option | Description | Selected |
|--------|-------------|----------|
| horizonEnd required | | |
| Default 1y (today+365) | Anchor today | ✓ |
| Default 90d | | |
| You decide | Prefer 1y | |

**User's choice:** 2

---

## Isolation proof

### Q1 — test bar

| Option | Description | Selected |
|--------|-------------|----------|
| MCP twin fixtures only | | |
| Lib twins + adapter smoke only | | |
| Lib twins + thin MCP contract tests | | ✓ |
| You decide | Prefer both | |

**User's choice:** 3

### Q2 — response meta flags

| Option | Description | Selected |
|--------|-------------|----------|
| Explicit isolation fields | | |
| Descriptions/instructions only | Clean UI payload | ✓ |
| Short meta block | | |
| You decide | Prefer short meta | |

**User's choice:** 2

### Q3 — CI mutate ban

| Option | Description | Selected |
|--------|-------------|----------|
| Ban now | | |
| No ban (plan/review + tests) | Same as Phase 24 | ✓ |
| Light actions-only path check | | |
| You decide | Prefer ban | |

**User's choice:** 2

### Q4 — isolation copy depth

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal one-liner now | Named codes Phase 26 | ✓ |
| Named DISOL/INISO/GRISO now | | |
| Server instructions only | | |
| You decide | Prefer named now | |

**User's choice:** 1

---

## Claude's Discretion

- Tool catalog / exact names (areas 1 not selected)
- List filters / income range defaults (area 2 not selected)

## Deferred Ideas

- Full CLI-01 isolation named copy + connect docs → Phase 26
- CI mutate-import ban → optional later
- Savings account interest forecast → backlog
