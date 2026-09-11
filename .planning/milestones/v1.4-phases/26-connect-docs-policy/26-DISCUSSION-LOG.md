# Phase 26: Connect Docs + Policy - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-11
**Phase:** 26-Connect Docs + Policy
**Areas discussed:** Docs home, Isolation prose shape, PARITY-01 vehicle, Smoke + mcp-remote

---

## Docs home

| Option | Description | Selected |
|--------|-------------|----------|
| README only | Human-facing single home | ✓ |
| OPERATOR.md | Next to UAT prefs | |
| Dedicated docs/mcp.md | Thin README link | |
| You decide | OPERATOR + README pointer | |

**User's choice:** README only
**Notes:** Follow-ups: snippets only (no smoke in README); English; place after Quick start (You decide → after Quick start).

---

## Isolation prose shape

| Option | Description | Selected |
|--------|-------------|----------|
| Server only | Tools stay short | |
| Per-tool only | Server without long policy | |
| Both | Server overview + SIDE named rules | |
| You decide | Both (research default) | ✓ |

**User's choice:** You decide → both; short prose; SIDE named + CAP light polish; wallet_ping gets annotations
**Notes:** User deferred length/CAP/ping via “You decide” (options 3/3/3).

---

## PARITY-01 vehicle

| Option | Description | Selected |
|--------|-------------|----------|
| PROJECT only | Constraints + checkbox | |
| PROJECT + agent rule | Also AGENTS/cursor rule | |
| PROJECT + plan checklist | Planning workflow gate | |
| You decide | PROJECT + short agent rule | ✓ |

**User's choice:** You decide → PROJECT + AGENTS.md block only; no PARITY in README; Active checkbox done this phase
**Notes:** Explicit “1” on no README mention; “3” (You decide) on checkbox timing.

---

## Smoke + mcp-remote

| Option | Description | Selected |
|--------|-------------|----------|
| Docs-only | Snippets enough | |
| One client smoke | Claude or Cursor | |
| Both clients | Claude and Cursor must connect | ✓ |
| You decide | One client recommended | |

**User's choice:** Both clients live connect; mcp-remote only after fail (You decide); phase UAT only (You decide); Cursor `type: http` + `url` (You decide)
**Notes:** User chose stricter dual-client bar than research “one client” default.

---

## Claude's Discretion

- README English wording + after Quick start placement
- Isolation: both surfaces, short named SIDE copy, CAP polish, wallet_ping annotations
- PARITY: AGENTS.md block wording; mark Active done this phase
- mcp-remote after fail; UAT-only smoke home; Cursor type http + url

## Deferred Ideas

None new — discussion stayed in phase scope. Todos (savings NW, timezone) reviewed not folded.
