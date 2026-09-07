# Phase 13: Income schema + domain math - Context

**Gathered:** 2026-09-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Income domain foundation only: Prisma models for recurring and one-time income (definitions + actuals), Person/Currency FKs, independent plan vs actual fields, pure domain helpers for virtual plan occurrences with day-of-month clamp, and Vitest covering occurrence identity, overdue predicate inputs, and BigInt money paths — without writing BalanceSnapshot or shipping `/income` UI.

Enables Phases 14–17 (CRUD, actual UX, stats, NW forecast). Does not deliver nav, dialogs, or chart overlay.

</domain>

<decisions>
## Implementation Decisions

### Schema shape
- **D-01:** Phase 13 ships a **minimum** schema — no `active` / `endAsOf` columns (pause/end remain out of scope until a later phase adds migration + UI). — **Reversibility:** costly — adding columns later needs a migration; omitting them now avoids dead product surface.
- **D-02:** Optional `note` on both definition and actual models (recurring and one-time).
- **D-03:** **Two definition models** — `RecurringIncome` and `OneTimeIncome` — not a single `IncomeSource` + kind enum. — **Reversibility:** one-way — consolidating later needs data migration and dual call-site rewrites.
- **D-04:** **Two actual models** — `RecurringIncomeActual` and `OneTimeIncomeActual` — mirroring parents (not one polymorphic `IncomeActual`). — **Reversibility:** one-way — same as D-03.
- **D-05:** Money as BigInt minors; Currency FK with Restrict (mirror Debt); Person FK on both definition models.

### Occurrence identity & plan vs actual
- **D-06:** Occurrence key = `(parentId, plannedAsOf)`. Changing recurring `dayOfMonth` must **not** rewrite existing actuals or their `plannedAsOf`.
- **D-07:** Freeze rule: if an actual exists for a slot key, that key is frozen; months/slots **without** actual always generate with the **current** DOM. No schedule-revision history table in Phase 13.
- **D-08:** One-time: after an actual exists, **plan fields are immutable** (planned date/amount); only actual amount/date (and note) may change. Before actual: plan is visible; overdue when planned date &lt; Moscow today and no actual; actual may use different date and/or amount than plan.
- **D-09:** At most **one** actual per plan slot — `@@unique([parentId, plannedAsOf])`; re-record = update. Deleting a single actual is allowed (slot becomes empty / overdue again). — **Reversibility:** costly — dropping unique later changes upsert semantics across actions.

### Delete / referential integrity
- **D-10:** Delete definition → **Cascade** its actuals (Debt ↔ repayment pattern).
- **D-11:** Delete Person while income definitions reference them → **Restrict** (same as debts).

### Requirement change (forecast — Phase 17)
- **D-12:** Future **one-time** planned income must appear in **both** the Доходы list and the Капитал NW forecast overlay. This **revises FCST-01** (was recurring-only / one-time excluded). Downstream Phase 17 planners must update REQUIREMENTS/roadmap wording; Phase 13 only needs models that can feed both. — **Reversibility:** costly — product lock for v1.2 capital UX.

### Claude's Discretion
- **D-13:** Core occurrence API is strict `listInRange(from, to)` with **no hidden default horizon**; callers (tests, later UI, forecast) pass the window.
- **D-14:** Split helpers: `listRecurringOccurrences`, `listOneTimeOccurrences`, plus thin `listAllInRange` merge.
- **D-15:** Range is **inclusive** on both ends; recurring slot included only if `plannedAsOf >= startAsOf`.
- **D-16:** `clampDayOfMonth` lives in `@/lib/dates`; income domain calls it (not inline-only in income module).

### Folded Todos
- **Add salary/income tracking with plan vs actual and forecast** (`.planning/todos/pending/2026-09-05-add-salary-income-tracking-with-forecast.md`) — origin of milestone v1.2; Phase 13 is schema/math foundation of that todo (full todo resolves across phases 13–17).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone / phase scope
- `.planning/ROADMAP.md` — Phase 13 goal + success criteria; phases 14–17 dependencies
- `.planning/REQUIREMENTS.md` — SRC/ACT/CPTY/UI/FCST/ISO; note D-12 revises FCST-01 one-time exclusion
- `.planning/PROJECT.md` — side-ledger income, ISO/BalanceSnapshot locks, Person reuse, UI constitution
- `.planning/STATE.md` — locked v1.2 decisions (DOM clamp, side ledger, isolation)

### Research (v1.2)
- `.planning/research/SUMMARY.md` — side ledger, zero new packages, INISO, risks
- `.planning/research/ARCHITECTURE.md` — schema sketch (adapt to **two-model** split per D-03/D-04), virtual occurrences, isolation
- `.planning/research/PITFALLS.md` — DOM skip, LOCF pollution, float money
- `.planning/research/STACK.md` — no new deps; Prisma/Vitest/Zod reuse
- `.planning/research/FEATURES.md` — must/should/defer feature cut

### Operator / patterns
- `.planning/OPERATOR.md` — agent-driven UAT (later phases)
- `.planning/todos/pending/2026-09-05-add-salary-income-tracking-with-forecast.md` — folded origin problem statement

### Code anchors
- `prisma/schema.prisma` — Person, Debt, Currency, BigInt, Restrict/Cascade patterns to mirror
- `src/lib/dates.ts` — `calendarDateToday` (Europe/Moscow), extend with DOM clamp
- `src/lib/money.ts` / `src/lib/money.test.ts` — BigInt minor paths
- `src/lib/debts.ts` — side-ledger pure domain style to mirror for income
- `src/lib/net-worth.ts` / `src/lib/historical-series.ts` — must not import income (INISO / ISO-01)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `prisma/schema.prisma` Person/Debt/Currency: FK Restrict, BigInt minors, YYYY-MM-DD strings, Cascade child events
- `src/lib/dates.ts`: Moscow `calendarDateToday`, calendar day math — add `clampDayOfMonth`
- `src/lib/money.ts`: major↔minor BigInt conversions for validations/tests
- `src/lib/debts.ts` + `src/lib/validations/debts.ts`: pure domain + Zod boundary pattern for new `income` modules
- `src/lib/disol`-style isolation tests (if present) / debts isolation mindset → INISO for income later

### Established Patterns
- Side ledger never writes `BalanceSnapshot` or mutates `computeNetWorthRows` / historical LOCF
- Virtual derived rows preferred over materializing every future slot in SQLite
- Vitest on pure libs; no Prisma in occurrence math unit tests

### Integration Points
- Phase 13: schema migration + `src/lib/income*.ts` (+ dates clamp) + tests only
- Person model gains relations to both income definition tables
- Currency model gains relations to income definitions
- UI `/income`, actions, forecast: Phases 14–17 — out of this phase

</code_context>

<specifics>
## Specific Ideas

- One-time example locked in discussion: plan «5 марта, 1000 RUB, конкретный контрагент» → visible as plan; on/after date without actual → overdue; record actual with same or different date/amount; afterward only actual fields editable.
- User wants one-time in **прогноз** on Капитал as well as Доходы (D-12 / FCST-01 change).

</specifics>

<deferred>
## Deferred Ideas

- `active` / `endAsOf` (pause/end recurring) — out of REQUIREMENTS now; add migration when product ships pause
- Convenience default-horizon wrappers around `listInRange` — UI/forecast phases if needed
- Schedule-revision history (DOM versioning by as-of) — rejected for Phase 13 in favor of actual-exists freeze
- Full salary todo remainder: CRUD UI, overdue polish, stats, NW overlay implementation — Phases 14–17
- Update `.planning/REQUIREMENTS.md` FCST-01 text formally when planning Phase 17 (decision captured here as D-12)

### Reviewed Todos (not folded)
- Add timezone selection to settings — weak match; separate feature
- Merge debit/crypto/cash account types — weak match; separate database concern

</deferred>

---

*Phase: 13-Income schema + domain math*
*Context gathered: 2026-09-07*
