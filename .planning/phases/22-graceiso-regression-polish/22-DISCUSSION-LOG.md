# Phase 22: GRACEISO regression + polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-10
**Phase:** 22-GRACEISO regression + polish
**Areas discussed:** Suite twin layout, Write-path scan scope, Golden identity shape, Polish / close-out

---

## Suite twin layout

| Option | Description | Selected |
|--------|-------------|----------|
| One `griso.test.ts` only | All scans + golden in single file | |
| Twin split like INISO | `griso.test.ts` + expand `accounts/actions.test.ts` write-gates | ✓ |
| Expand only existing smokes | No new file; grow `credit-grace.test.ts` only | |

**User's choice:** You decide (all areas)
**Notes:** Claude locked INISO twin split for milestone familiarity and SC coverage.

---

## Write-path scan scope

| Option | Description | Selected |
|--------|-------------|----------|
| Mutations only | Grace actions never BalanceSnapshot | |
| Mutations + NW import walls | Actions + net-worth/historical-series/credit-grace/nw-forecast bans | ✓ |
| Global BalanceSnapshot string ban | Including account balance UI | |

**User's choice:** You decide
**Notes:** Legitimate account snapshot UI kept out of ban (D-08).

---

## Golden identity shape

| Option | Description | Selected |
|--------|-------------|----------|
| INISO conceptual void fixtures | Same series inputs; grace never on API | ✓ |
| DB integration golden | Seed grace rows and compare NW queries | |
| Import walls only, skip golden | File-scan sufficient | |

**User's choice:** You decide
**Notes:** D-09–D-11 lock pure unit golden + credit-account fixture + forbidden grace keys.

---

## Polish / close-out

| Option | Description | Selected |
|--------|-------------|----------|
| Tests only | Suite green = done | |
| Gate hygiene | Suite + REQUIREMENTS/ROADMAP/STATE checkbox sync; optional Orca if gate asks | ✓ |
| Full RU audit + redesign | Copy pass across grace UI | |

**User's choice:** You decide
**Notes:** D-12–D-13 — no broad polish; primary evidence automated suite.

---

## Claude's Discretion

All four gray areas — user: «Сам реши все эти вопросы».

## Deferred Ideas

- Timezone settings todo (not folded)
- Local AI agent todo (not folded)
- Chart legend доходы vs обязательства (pre-existing deferred)
