# Phase 19: Schema + pure grace domain math - Context

**Gathered:** 2026-09-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Persist credit grace schedule on `FIAT_CREDIT` Account (dual DOM ints) and a per-cycle `CreditGraceObligation` model; ship pure calendar helpers (cycle windows, due math, overdue) ready for Phase 20 UI. Delivers CYCLE-01 data + math only.

Does **not** deliver: obligation CRUD UI, Капитал «Прогноз» wiring (Phase 21), GRACEISO suite close (Phase 22), APR / minimum / cash modeling (OOS).

</domain>

<decisions>
## Implementation Decisions

### Account schedule fields
- **D-01:** Store **only** `statementDayOfMonth` + `dueDayOfMonth` (Int?). No `graceAnchorAsOf`, no stored `graceDurationDays`. — **Reversibility:** costly — schema + Zod + CHECK assume dual-DOM SoT; adding duration-as-SoT later fights D-02 from Phase 18.
- **D-02:** Dual DOM fields allowed **only** on `FIAT_CREDIT` (mirror `creditLimitMinor` discipline). — **Reversibility:** costly — SQLite CHECK / write-path Zod keyed to account type.
- **D-03:** Hard invariant: **both null or both set** (DB CHECK + Zod). Partial schedule rejected. — **Reversibility:** one-way — migration CHECK; undoing needs schema change.
- **D-04:** Editing DOM later **does not rewrite** existing obligation rows (`cycleStartAsOf` / `dueAsOf` stay as stored). New cycles / candidates use the updated schedule.

### Obligation row shape
- **D-05:** Persist `dueAsOf` **at create**; do not recompute from Account DOM on read. — **Reversibility:** costly — closed/open history and D-04 depend on frozen due.
- **D-06:** `amountMinor` **required** at create (no placeholder rows without amount). Create happens when user has the statement total (Phase 20). — **Reversibility:** costly — schema NOT NULL; nullable path would need migration + forecast membership rules.
- **D-07:** Status enum **OPEN | CLOSED** (Debt-style). Overdue is **not** a persisted status — `OPEN` + calendar (`today` after inclusive due day per Phase 18 D-04 → highlight from the 16th for DOM-15 due).
- **D-08:** Include `closedAsOf` (required when CLOSED) and optional `note`. Currency **inherits** `Account.currencyCode` — no currency FK on obligation.

### Cycle identity / pure math
- **D-09:** `cycleStartAsOf` = clamped statement date for that calendar month: `clampDayOfMonth(y, m, statementDayOfMonth)`. Unique key `(accountId, cycleStartAsOf)`. — **Reversibility:** one-way — unique constraint + cycle identity for forecast membership.
- **D-10:** `dueAsOf` engine = **next calendar month** + `dueDayOfMonth` via `clampDayOfMonth` — **not** sole `addCalendarDays(start, N)`. Aligns Phase 18 D-02 / ROADMAP SC.
- **D-11:** Pure API includes primitives **and** cycle-window helpers (`listCycleWindows` / current-or-next style), analogous to income `listRecurringOccurrences`.
- **D-12:** Helpers are **pure candidates only** — no Prisma writes, no auto-create of obligation rows. Rows appear only via explicit create-with-amount (Phase 20).

### Null / edge rules
- **D-13:** Credit with both DOM null ⇒ **no obligations allowed**; helpers return empty / actions reject create.
- **D-14:** Clearing schedule (both → null) **forbidden while any OPEN** obligation exists; CLOSED history may remain until account handling says otherwise.
- **D-15:** `CreditGraceObligation` → Account FK uses **`onDelete: Cascade`** (deleting the credit account removes all grace obligations). Deliberately looser than `BalanceSnapshot` Restrict. — **Reversibility:** costly — data-loss semantics on account delete.
- **D-16:** Duplicate `(accountId, cycleStartAsOf)` = **error**. Amount/status changes = **update** existing OPEN row, not a second create.

### Claude's Discretion
- Exact Zod / SQLite CHECK naming and migration packaging.
- Module layout (`src/lib/credit-grace.ts` + validations) and precise helper names — must satisfy D-09…D-12 and reuse `clampDayOfMonth` from `dates.ts`.
- Whether CLOSED rows block schedule clear (D-14 only locks on OPEN); planner may keep CLOSED when clearing schedule after OPEN are gone.
- Micro-details of “current vs next” window when today sits between statement and due — pure math must be deterministic and tested.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase / milestone scope
- `.planning/ROADMAP.md` — Phase 19 success criteria (dual DOM storage, next-month due math, obligation keyed by cycle start)
- `.planning/REQUIREMENTS.md` — CYCLE-01; Out of Scope (no snapshot-derived due, no APR engine)
- `.planning/PROJECT.md` — v1.3 goal; manual amount; overlay-only (forecast later)
- `.planning/STATE.md` — current position Phase 19

### Prior phase locks (must not reopen)
- `.planning/phases/18-bank-contract-study-discuss-locks/18-CONTEXT.md` — D-01…D-19 (dual DOM, clamp, overdue from 16th, A′, RU vocab)
- `.planning/phases/18-bank-contract-study-discuss-locks/18-CONTRACT-NOTES.md` — T-Bank Platinum 21→15 next
- `.planning/milestones/v1.2-phases/17-nw-forecast-overlay-isolation/17-CONTEXT.md` — INISO / forecast overlay isolation pattern (no BalanceSnapshot from side ledgers)

### Research (adjust where this CONTEXT overrides)
- `.planning/research/ARCHITECTURE.md` — Account + `CreditGraceObligation` sketch; **override** `graceAnchorAsOf` + `graceDurationDays` SoT → dual DOM only (D-01); **keep** child obligation + unique cycle key; **this discuss** sets Cascade delete (D-15) vs research Restrict note
- `.planning/research/SUMMARY.md` — milestone architecture overview
- `.planning/research/PITFALLS.md` — calendar operators; stock/flow double-count (forecast later)

### Code anchors
- `prisma/schema.prisma` — extend `Account`; add obligation model + CHECKs
- `src/lib/dates.ts` — `clampDayOfMonth`, calendar helpers (due engine must use next-month DOM, not sole `addCalendarDays`)
- `src/lib/income.ts` — `listRecurringOccurrences` pattern for cycle windows
- `src/lib/account-type.ts` / `src/lib/validations/account.ts` — FIAT_CREDIT write-path patterns
- `src/lib/net-worth.ts` / `src/lib/historical-series.ts` — must stay grace-free (GRISO later)
- `.planning/OPERATOR.md` — agent-driven UAT (later phases)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `clampDayOfMonth` in `src/lib/dates.ts` — statement DOM and due DOM month mapping
- `listRecurringOccurrences` in `src/lib/income.ts` — template for `listCycleWindows`
- `DebtStatus` OPEN|CLOSED + `closedAsOf`-style lifecycle on Debt — mirror for grace obligations
- `Account.creditLimitMinor` + SQLite CHECK — pattern for FIAT_CREDIT-only dual DOM CHECK
- Income/account Zod validations — write-path for new grace fields

### Established Patterns
- Side ledgers / overlays never write `BalanceSnapshot`
- Manual amounts in minor units + Zod; Russian labels belong to Phase 20 UI
- Unique natural keys for occurrences (`accountId` + cycle start)

### Integration Points
- Schema: `prisma/schema.prisma` + migration
- Pure lib: new `src/lib/credit-grace.ts` (+ tests); no UI routes in this phase
- Account actions/validations extended only as needed to persist dual DOM (form UI can stay Phase 20 if plans split) — planner chooses minimal write-path to satisfy CYCLE-01

</code_context>

<specifics>
## Specific Ideas

- Real card calendar remains **выписка 21 → оплатить до 15 следующего месяца** (from Phase 18).
- User explicitly chose Cascade on account delete over Restrict (unlike BalanceSnapshot).
- User deferred “you decide” on pure-vs-DB for helpers → locked as pure candidates only (D-12).

</specifics>

<deferred>
## Deferred Ideas

- Obligation CRUD UI, early close confirm, overdue highlight chrome — Phase 20
- Капитал A′ forecast slots / tooltips — Phase 21
- GRACEISO regression suite — Phase 22
- APR / minimum triad / cash modeling — milestone OOS

None new beyond roadmap phasing — discussion stayed inside Phase 19 / CYCLE-01.

</deferred>

---

*Phase: 19-Schema + pure grace domain math*
*Context gathered: 2026-09-08*
