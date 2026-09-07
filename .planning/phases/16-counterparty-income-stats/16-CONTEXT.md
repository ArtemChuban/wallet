# Phase 16: Counterparty income stats - Context

**Gathered:** 2026-09-07
**Status:** Ready for planning

<domain>
## Phase Boundary

User sees per-Person income totals on «Доходы»: always native-currency Σ of recorded actuals, plus optional primary conversion via FX LOCF as-of each fact's `actualAsOf`, with partial honesty when rates are missing (CPTY-01, revised to hybrid — see D-05).

Does **not** deliver: NW forecast overlay / isolation suite (Phase 17), period filters (month/YTD/picker), withdrawal/cash-out date for FX, destination-account linking, global page hero totals, mixing debt direction into income stats.

</domain>

<decisions>
## Implementation Decisions

### What enters Σ
- **D-01:** Σ includes **actuals only** — not unfilled plan slots. — **Reversibility:** costly — callers and copy assume «получено», not «ожидаемо».
- **D-02:** Recurring and one-time actuals share **one** per-Person Σ (not split by kind).
- **D-03:** Stats numbers only for Person with **≥1 actual**. Empty / plan-only Person groups keep Phase 14 header (name + CTA) with **no** stats digits.
- **D-04:** **No** global page hero («всего получено»). Totals are **per-Person only**.

### FX / hybrid display (CPTY-01 revision)
- **D-05:** **Hybrid honesty:** always show Σ in **native** currency(ies); also show primary converted with LOCF on each fact's **`actualAsOf`** («курс на день получения»). This revises REQUIREMENTS CPTY-01 wording from primary-only Σ to native-first + primary secondary. — **Reversibility:** costly — UI shape and domain aggregate API keyed to dual display.
- **D-06:** Both rows **always visible**: native larger, primary smaller underneath (no mode toggle).
- **D-07:** Multiple currencies for one Person: **one native line per currency** + **one** rolled primary-Σ of convertible facts.
- **D-08:** Missing FX on `actualAsOf`: **exclude** that fact from primary + local «итог неполный» / «нет курса» on **that** Person group (mirror debts `isPartial`); native unchanged. Never invent rates or silent zeros.
- **D-09:** USDT→fiat **withdrawal date** is **out of scope** — not modeled; `actualAsOf` remains receipt date for FX. Capture as Future if needed.

### UI placement
- **D-10:** Stats live in each **Person group header** on `/income` (not a separate «Статистика» catalog). — **Reversibility:** costly — list header component owns dual totals.
- **D-11:** Partial chrome is **per-group** only (no page-level banner; no global hero).
- **D-12:** Layout: amounts **right-aligned** in header — native prominent, primary secondary beneath.

### Time window
- **D-13:** Window = **all-time** (every actual for that Person). No month/YTD/from–to picker in Phase 16. — **Reversibility:** reversible — filter can layer later without schema change if membership stays `actualAsOf`.
- **D-14:** Membership / future filters key off **`actualAsOf`** (not `plannedAsOf`), consistent with FX as-of.
- **D-15:** Quiet label near totals: **«всего»** / **«за всё время»** so all-time is not mistaken for «this month».

### Carried locks (do not re-open)
- Person-grouped `/income` list (14); actuals CRUD + overdue (15); side ledger / no BalanceSnapshot (ISO → 17).
- Reuse `Person`; income stats **never** mix debt I-owe/they-owe.
- FX primitives: `locfRateAsOf` / `convertOtherMinorToPrimaryMinor` / debts-style exclude + `isPartial`.
- Russian UI; DestructiveConfirmStep unchanged this phase.

### Claude's Discretion
- Exact RU microcopy for «всего» vs «за всё время» and partial line (match DebtsPrimaryTotalsHero tone).
- Pure helper shape in `src/lib/income.ts` (or sibling) mirroring `computeDebtPrimaryTotals` but dual native+primary output.
- Whether primary line omits entirely when Person is single-currency **and** that currency is primary (identity — avoid redundant «same number twice»); prefer showing primary only when conversion happened or multi-ccy rollup needs it — pick clearest UX in research/UI-SPEC.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone / phase scope
- `.planning/ROADMAP.md` — Phase 16 goal, success criteria, UI hint; Phase 17 boundary
- `.planning/REQUIREMENTS.md` — CPTY-01 (update wording to hybrid per D-05 when planning)
- `.planning/PROJECT.md` — side-ledger income, FX LOCF, Person reuse, Russian-first
- `.planning/STATE.md` — v1.2 locks (side ledger, ISO mindset)

### Prior phase decisions
- `.planning/phases/13-income-schema-domain-math/13-CONTEXT.md` — actual models, occurrence identity
- `.planning/phases/14-dohody-crud-nav/14-CONTEXT.md` — Person groups, `/income`, list chrome
- `.planning/phases/15-plan-vs-actual-overdue/15-CONTEXT.md` — actuals on list; variance stayed source-currency (primary here)

### Research
- `.planning/research/SUMMARY.md` — counterparty stats + multi-currency honesty
- `.planning/research/ARCHITECTURE.md` — counterparty aggregate sketch; Person reuse; income-only stats
- `.planning/research/PITFALLS.md` — invent FX; mix debt into income stats; LOCF pollution

### Operator / patterns
- `.planning/OPERATOR.md` — agent-driven UAT (Orca)
- `.planning/codebase/CONVENTIONS.md` — UAT + no `window.confirm`

### Code anchors
- `src/lib/debts.ts` — `computeDebtPrimaryTotals` / `isPartial` / `no_fx` exclude pattern to mirror
- `src/components/debts/DebtsPrimaryTotalsHero.tsx` — partial copy tone («Итог неполный») — adapt per-group, not page hero
- `src/lib/locf.ts` — `locfRateAsOf`
- `src/lib/fx.ts` — `getRateAsOf` thin path if needed
- `src/lib/money.ts` — `convertOtherMinorToPrimaryMinor`
- `src/lib/income.ts` — extend with counterparty aggregate helpers
- `src/components/income/IncomeList.tsx` — Person group headers receive stats
- `src/app/income/page.tsx` — load actuals + rates batch for as-of conversion
- `prisma/schema.prisma` — RecurringIncomeActual / OneTimeIncomeActual + Person/Currency

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `computeDebtPrimaryTotals` — FX exclude + `isPartial` semantics for primary rollup
- `locfRateAsOf` + `convertOtherMinorToPrimaryMinor` — per-fact as-of conversion
- `IncomeList` Person groups — header slot for native + primary
- Actual rows already on income domain (Phase 15)

### Established Patterns
- Server page loads Prisma → pure lib aggregates → client list
- Partial honesty never invents rates; Russian UI copy
- Side ledger never writes BalanceSnapshot

### Integration Points
- Extend income page data load: all actuals (or by person) + FX rate maps for each distinct `actualAsOf`
- Group-header UI in `IncomeList` (or small header subcomponent)
- Vitest on pure aggregate: native by currency, primary rollup, missing-rate partial
- Phase 17 forecast must not reuse stats UI; keep helpers free of NW writes

</code_context>

<specifics>
## Specific Ideas

- User example: salary in USDT lands on crypto wallet; fiat withdrawal date ≠ receipt — so today-FX and even receipt-FX can «lie» vs cash-out; product answer = native always + primary @ `actualAsOf` as historical receipt snapshot, **not** withdrawal modeling in v1.2 Phase 16.
- Discussion prompts in **Russian**; product UI remains Russian-first.
- Origin milestone todo `2026-09-05-add-salary-income-tracking-with-forecast.md` **deleted** by user (phases 13–17 already carry the work) — do not re-fold.

</specifics>

<deferred>
## Deferred Ideas

- Period filter (month / YTD / from–to) — Future Requirements
- Withdrawal / cash-out date or destination-account FX as-of — Future Requirements
- Global «всего получено» hero — explicitly rejected for Phase 16
- NW forecast overlay + isolation — Phase 17
- Formal REQUIREMENTS.md CPTY-01 text update to hybrid (decision locked here as D-05; planner should sync wording)

</deferred>

---

*Phase: 16-Counterparty income stats*
*Context gathered: 2026-09-07*
