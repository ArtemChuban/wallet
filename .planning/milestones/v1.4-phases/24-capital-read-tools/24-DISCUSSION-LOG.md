# Phase 24: Capital Read Tools - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-10
**Phase:** 24-Capital Read Tools
**Areas discussed:** Tool catalog, As-of defaults, Response shape / money honesty, Annotations this phase

---

## Tool catalog

| Option | Description | Selected |
|--------|-------------|----------|
| Four separate tools | list_accounts, get_net_worth, get_account_balance, list_fx_rates | ✓ |
| Three tools | Merge NW+balance | |
| Two fat tools | capital_snapshot + FX | |

**User's choice:** Four separate tools
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Research names | No wallet_ prefix on CAP tools | ✓ |
| wallet_ prefix | wallet_list_accounts etc. | |
| Short names | accounts, net_worth, … | |

**User's choice:** Research names
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| As-of FX snapshot + filter | primary↔other LOCF | ✓ |
| One pair per call | Required currencyCode | |
| As-of + history N | Context blow-up risk | |

**User's choice:** As-of snapshot + filter
**Notes:** User does not want agents to convert; all calculation must stay server-side in NW/balance tools. FX tool = honesty only; description must forbid agent-side conversion.

| Option | Description | Selected |
|--------|-------------|----------|
| Metadata min | type, currency, creditLimitMinor | ✓ |
| Metadata + LOCF available | Duplicate balance | |
| Identity only | id/name/type/currency | |

**User's choice:** Metadata min
**Notes:** —

---

## As-of defaults

| Option | Description | Selected |
|--------|-------------|----------|
| Default today | Including FX | ✓ |
| Required asOf | Validation error if missing | |
| Default today (NW/balance only) | FX separate | |

**User's choice:** Default today for NW, balance, and FX
**Notes:** Explicit “fx тоже”

| Option | Description | Selected |
|--------|-------------|----------|
| Hardcode Moscow like page | | |
| UTC calendar | | |
| Helper → settings TZ later | Moscow now via calendarDateToday | ✓ |

**User's choice:** Shared helper; settings timezone later
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Success + empty + flags | | ✓ |
| Error if no accounts | | |
| Success + warnings[] text | | |

**User's choice:** Success + empty + structured flags
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Strict YYYY-MM-DD; future OK | | ✓ |
| Clamp future to today | | |
| Also accept DD.MM.YYYY | | |

**User's choice:** Strict wire; future OK
**Notes:** —

---

## Response shape / money honesty

| Option | Description | Selected |
|--------|-------------|----------|
| Minor string + scale | | ✓ |
| Minor as number | | |
| Formatted major only | | |

**User's choice:** Minor string + scale
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Full computeNetWorthRows parity | | ✓ |
| Total + isPartial + missing ids | | |
| Rows without excludeReason | | |

**User's choice:** Full rows parity
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Null primary + reason | | ✓ |
| Tool error if no FX | | |
| Native only, no primary field | | |

**User's choice:** Null primary + reason
**Notes:** Aligns with no agent conversion

| Option | Description | Selected |
|--------|-------------|----------|
| Enrich name/code/type | Like page.tsx | ✓ |
| Ids only | | |
| Names only in list_accounts | | |

**User's choice:** Enrich rows
**Notes:** —

---

## Annotations this phase

| Option | Description | Selected |
|--------|-------------|----------|
| readOnlyHint now; isolation copy Phase 26 | | ✓ |
| Wait all annotations for Phase 26 | | |
| Full CLI-01 now | | |

**User's choice:** Scaffold readOnlyHint + short descriptions now
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| EN + RU aliases | | ✓ |
| English only | | |
| Russian only | | |

**User's choice:** EN + RU aliases
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Capital-era short instructions | NW≠debts; FX≠converter; side later | ✓ |
| Minimal ping-era text | | |
| Full isolation manifesto | | |

**User's choice:** Capital-era short instructions
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| CI mutate-import ban | | |
| Plan/review only | | ✓ |
| Separate read-only Prisma | | |

**User's choice:** No CI ban this phase — plan/review enough
**Notes:** Against recommendation; reversible later

---

## Pre-discuss todo handling

- Closed pending todo `2026-09-05-integrate-local-ai-agent-via-subprocess.md` → `todos/completed/` (superseded by v1.4 milestone). Removed from STATE Pending Todos.
- Savings-account todo (weak match) not folded.

## Claude's Discretion

None — user selected every option.

## Deferred Ideas

- Phase 25 side ledgers; Phase 26 CLI-01 + connect docs; optional later CI ban; savings backlog; timezone settings todo
