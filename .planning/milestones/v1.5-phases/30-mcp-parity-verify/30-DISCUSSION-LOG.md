# Phase 30: MCP PARITY + verify - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-22
**Phase:** 30-MCP PARITY + verify
**Areas discussed:** list_accounts SAVINGS fields, Interest in forecast overlay, SAVISO + tool texts, Verify depth

---

## Todos (pre-discuss)

| Option | Description | Selected |
|--------|-------------|----------|
| Fold savings todo only | Milestone seed; MCP slice | ✓ |
| Fold both | Include timezone | |
| Fold neither | Review only | |

**User's choice:** 1 — fold savings todo only
**Notes:** Resolve at v1.5 milestone complete, not mid-phase. Language: user asked questions in Russian.

---

## list_accounts SAVINGS fields

| Option | Description | Selected |
|--------|-------------|----------|
| Like credit always keys | bps+DOM null non-SAVINGS | |
| Omit keys non-SAVINGS | | |
| bps + percent | always keys + annualRatePercent | ✓ |
| You decide | | |

**User's choice:** 3 (bps + percent)

| Option | Description | Selected |
|--------|-------------|----------|
| number 16.5 | | |
| string 16.50 | | |
| bps only | | |
| You decide | | ✓ |

**User's choice:** 4 → Claude: number 16.5

| Option | Description | Selected |
|--------|-------------|----------|
| isSavings yes | | |
| isSavings no | | |
| You decide | | ✓ |

**User's choice:** 3 → Claude: no isSavings

| Option | Description | Selected |
|--------|-------------|----------|
| Update description | | |
| Minimal | | |
| You decide | | ✓ |

**User's choice:** 3 → Claude: short description update

---

## Interest in forecast overlay

| Option | Description | Selected |
|--------|-------------|----------|
| Same as UI listInterestSlotsInRange | | |
| Thin MCP duplicate | | |
| Wait shared builder extract | | |
| You decide | | ✓ |

**User's choice:** 4 → Claude: same as UI

| Option | Description | Selected |
|--------|-------------|----------|
| Keep today+365 | | |
| Change default | | |
| You decide | | ✓ |

**User's choice:** 3 → Claude: keep D-04

| Option | Description | Selected |
|--------|-------------|----------|
| Like UI/grace + accountName | | |
| Minimal no name | | |
| Plus rate on event | | |
| You decide | | ✓ |

**User's choice:** 4 → Claude: like UI/grace, no rate on event

| Option | Description | Selected |
|--------|-------------|----------|
| Today LOCF like / page | | ✓ |
| Via get_account_balance each | | |
| You decide | | |

**User's choice:** 1

---

## SAVISO + tool texts

| Option | Description | Selected |
|--------|-------------|----------|
| Forecast + handler + isolation test | | |
| Forecast tool only | | |
| That + rewrite A′ | | |
| You decide | | ✓ |

**User's choice:** 4 → Claude: SAVISO on forecast+handler; isolation test; drop A′

| Option | Description | Selected |
|--------|-------------|----------|
| Update connect docs | | |
| Code only | | |
| You decide | | ✓ |

**User's choice:** 3 → Claude: no README rewrite

| Option | Description | Selected |
|--------|-------------|----------|
| Triple tag INISO/GRISO/SAVISO | | |
| Separate SAVISO line | | |
| SAVISO only on forecast | | |
| You decide | | ✓ |

**User's choice:** 4 → Claude: triple tag

| Option | Description | Selected |
|--------|-------------|----------|
| SAVISO on list_accounts | | |
| No | | |
| You decide | | ✓ |

**User's choice:** 3 → Claude: no SAVISO on list_accounts

---

## Verify depth

| Option | Description | Selected |
|--------|-------------|----------|
| Vitest only | | |
| Vitest + Orca UAT | | |
| Vitest + Nyquist only | | |
| You decide | | ✓ |

**User's choice:** 4 → Claude: Vitest + Orca; Nyquist via normal validate

| Option | Description | Selected |
|--------|-------------|----------|
| list_accounts + forecast + no snaps | | |
| Forecast only | | |
| Full SIDE smoke | | |
| You decide | | ✓ |

**User's choice:** 4 → Claude: two MCP calls + no new snaps

| Option | Description | Selected |
|--------|-------------|----------|
| Seed/existing DB | | |
| Vitest-only empty Orca | | |
| UAT creates via actions | | |
| You decide | | ✓ |

**User's choice:** 4 → Claude: Vitest self-seed; Orca create SAVINGS via UI if missing

| Option | Description | Selected |
|--------|-------------|----------|
| Resolve todo after Phase 30 | | |
| After Phase 31 | | |
| At gsd-complete-milestone v1.5 | | ✓ |
| You decide | | |

**User's choice:** 3

---

## Claude's Discretion

- annualRatePercent wire type → number
- no isSavings
- list_accounts description update
- interest membership = UI path
- keep horizon today+365
- event fields like grace + accountName
- SAVISO placement + drop A′ + triple tag
- no connect README rewrite
- no SAVISO on list_accounts
- Vitest + Orca verify bar
- Orca two MCP calls
- fixture strategy Vitest seed / Orca UI create

## Deferred Ideas

- Phase 31 ASSET ↔ SAVINGS conversion
- Timezone settings todo (reviewed, not folded)
- Chart legend by kind (already deferred)
