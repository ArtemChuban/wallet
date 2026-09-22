# Phase 31: ASSET ↔ SAVINGS type conversion - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-22
**Phase:** 31-asset-savings-type-conversion
**Areas discussed:** Type control placement, SAVINGS→ASSET confirm, ASSET→SAVINGS field reveal, Type dropdown peers

---

## Type control placement

| Option | Description | Selected |
|--------|-------------|----------|
| Same edit dialog | Unlock type in «Изменить счёт» for ASSET/SAVINGS | ✓ |
| Separate convert action | Dedicated button on account card | |
| You decide | | |

**User's choice:** Same edit dialog
**Notes:** Follow-ups — one Submit for name+type+rate/DOM; currency stays locked; draft UI immediate type-gate (show empty / hide+clear).

---

## SAVINGS→ASSET confirm

| Option | Description | Selected |
|--------|-------------|----------|
| No confirm | Single Save clears rate/DOM | ✓ |
| In-dialog second step | Confirm before clearing metadata | |
| You decide | | |

**User's choice:** No confirm
**Notes:** No soft warning hint; ASSET→SAVINGS also no confirm; success copy «Сохранено».

---

## ASSET→SAVINGS field reveal

| Option | Description | Selected |
|--------|-------------|----------|
| Empty start | User must fill rate+DOM (mirror create) | ✓ |
| Prefill | e.g. 0% + some DOM | |
| You decide | | |

**User's choice:** Empty fields
**Notes:** Reset draft on every leave from SAVINGS; same create field errors; Save stays enabled while empty.

---

## Type dropdown peers

| Option | Description | Selected |
|--------|-------------|----------|
| Only ASSET\|SAVINGS in select | No FIAT_CREDIT in list | ✓ |
| All three create options | FIAT_CREDIT disabled or error on submit | |
| You decide | | |

**User's choice:** Only ASSET|SAVINGS
**Notes:** FIAT_CREDIT/legacy = read-only label; server hard-rejects forbidden transitions; create form unchanged.

---

## Claude's Discretion

- Exact Zod/updateAccount wiring for `type` + clearing savings columns
- Exact reject copy for forbidden transitions
- MCP write/convert default out of scope (UI-only) unless existing write surface requires parity

## Deferred Ideas

None in-scope. Timezone settings todo reviewed, not folded.
