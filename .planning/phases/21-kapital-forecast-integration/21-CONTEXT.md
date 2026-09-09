# Phase 21: Капитал forecast integration - Context

**Gathered:** 2026-09-09
**Status:** Ready for planning

<domain>
## Phase Boundary

On Капитал `/`, dashed «Прогноз» includes **open credit grace obligations** from their due dates as **A′ NW-neutral** slots (visible, ΔNW=0 + tooltip), sharing one signed series with income forecast and the same **FX LOCF honesty** (exclude missing rates + partial banner). Early-closed / CLOSED obligations leave the overlay.

Does **not** deliver: GRACEISO / historical NW isolation suite (Phase 22), chart legend separating доходы vs обязательства (deferred beyond v1.3), APR / minimum / cash modeling (OOS), BalanceSnapshot writes from grace.

</domain>

<decisions>
## Implementation Decisions

### Carried locks (do not re-open)
- **C-01:** A′ NW-neutral: at due, obligation **visible**, forecast **NW delta = 0** (Phase 18 D-11). — **Reversibility:** costly — chart/tests and signed-slot design depend on it.
- **C-02:** Visibility via tooltip / point detail — **not** a second chart series (Phase 18 D-12).
- **C-03:** Same-day income + grace: **one** cumulative «Прогноз» series; tooltip distinguishes kinds (Phase 18 D-13).
- **C-04:** Tooltip RU: «Платёж для беспроцентного» + «NW без изменения (оплата карты)» (Phase 18 D-19).
- **C-05:** FX LOCF **as of today**; missing rate → exclude slot; never invent rates (Phase 17 D-13–D-16; GRFCST-02).
- **C-06:** Horizon mirrors dashboard lookback preset (`30d`/`90d`/`1y`; `all`→1y) (Phase 17 D-05).
- **C-07:** CLOSED / early-closed obligations **out** of forecast; OPEN only (roadmap SC; Phase 19/20 lifecycle).

### Due-date membership
- **D-01:** Membership includes **all OPEN** obligations that land in the overlay window — including **overdue** (`dueAsOf < today`). — **Reversibility:** costly — differs from income forecast (which ignores overdue); tests and slot builders must branch on grace vs income.
- **D-02:** Overdue OPEN **fold onto today** (hinge / today sample), not onto the past `dueAsOf`.
- **D-03:** Fold applies to overdue of **any age** while status stays OPEN (no lookback cutoff).
- **D-04:** Future dues: include only `dueAsOf` in `(today, horizonEnd]`. Beyond horizon → exclude. `dueAsOf === today` lands on the today bucket with folded overdue.
- **D-05:** Primary-currency grace slots always convertible; non-primary use LOCF @ today; FX miss → exclude (same honesty as income).

### Flat A′ visibility
- **D-06:** Always **sample the due date** on the dashed series even when ΔNW=0 (flat segment), so the tooltip can show the grace block. — **Reversibility:** costly — sparse sampler and chart point metadata must carry zero-delta events.
- **D-07:** If the horizon has **only** grace slots (no income) → still show a **flat** dashed «Прогноз» (today → horizon) so due tooltips work. Do not hide the series merely because NW is unchanged.
- **D-08:** **No** on-line visual distinction between grace days and income days — one dashed «Прогноз»; kind only in tooltip (honors C-02).
- **D-09:** Overdue folded to today appear in the **today tooltip** next to the account stack / NW, with grace copy (C-04) and ΔNW=0 — not hinge-only chrome and not grace-dialog-only.

### Same-day tooltip
- **D-10:** Same calendar day with income + grace → **two blocks in one tooltip**: forecast/income contribution first; grace block with D-19 copy below. (Layout chosen under Claude discretion; see Discretion.)
- **D-11:** Grace block **shows obligation amount** (account currency and/or primary after successful FX) even though ΔNW=0.
- **D-12:** Multiple OPEN on one day → **one tooltip row per obligation** (account identity + amount), not a single aggregate line.
- **D-13:** FX-excluded grace slots are **omitted from the tooltip**; honesty is the shared partial banner only (mirror income).

### Partial FX banner
- **D-14:** Keep **one** quiet banner near the NW chart (existing tone: «Прогноз неполный · нет курса …»).
- **D-15:** Banner must list **every missing currency code** that caused an exclusion (income and/or grace). Example: `Прогноз неполный · нет курса USD, EUR`.
- **D-16:** Do **not** tag slot kind / target («доходы» / «грейс») in the banner — currency codes only.
- **D-17:** Duplicate currency across income + grace → list the code **once**.
- **D-18:** If FX exclusions remove **all** includable slots and the series is hidden → **still show** the same incomplete banner with the full missing-code list (Phase 17 D-16 family).

### Claude's Discretion
- Exact two-block tooltip DOM/CSS within D-10 (ordering locked: income/forecast then grace).
- How A′ zero delta is represented in pure math (`nw-forecast` membership with 0 addend vs explicit offset leg) — simplest correct approach under C-01…C-03 / D-06.
- Whether today-bucket grace rows share payload shape with future forecast tooltip rows — pick one metadata model for chart points.
- Exact RU microcopy polish for multi-currency banner joining (comma/list) — match existing «Прогноз неполный» voice.
- Page load / `DashboardChartsShell` wiring for OPEN obligations — research/plan.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone / phase scope
- `.planning/ROADMAP.md` — Phase 21 goal, success criteria, UI hint; GRFCST-01/02
- `.planning/REQUIREMENTS.md` — GRFCST-01, GRFCST-02; deferred legend; OOS antithesis (no historical LOCF from grace)
- `.planning/PROJECT.md` — v1.3 A′ overlay; forecast ≠ historical LOCF; Russian-first
- `.planning/STATE.md` — current position Phase 21

### Prior phase decisions
- `.planning/phases/18-bank-contract-study-discuss-locks/18-CONTEXT.md` — A′ D-11…D-13, D-19 tooltip vocabulary
- `.planning/phases/19-schema-pure-grace-domain-math/19-CONTEXT.md` — obligation identity, OPEN|CLOSED, frozen due, amount required
- `.planning/phases/20-obligation-crud-cycle-ui/20-CONTEXT.md` — CRUD surfaces; Phase 21 consumes OPEN membership fields
- `.planning/milestones/v1.2-phases/17-nw-forecast-overlay-isolation/17-CONTEXT.md` — forecast membership, FX LOCF honesty, INISO / overlay isolation pattern

### Research / pitfalls
- `.planning/research/ARCHITECTURE.md` — `nw-forecast` signed slots sketch
- `.planning/research/PITFALLS.md` — stock/flow double-count; FX invent; chart-as-fact
- `.planning/research/SUMMARY.md` — overlay architecture; A′ override vs naive dip

### Operator / conventions
- `.planning/OPERATOR.md` — agent-driven UAT (Orca)
- `.planning/codebase/CONVENTIONS.md` — UAT + no `window.confirm`

### Code anchors
- `src/lib/nw-forecast.ts` — `ForecastSlot`, `buildNetWorthForecastSeries`, partial FX counters (extend for grace / A′)
- `src/lib/credit-grace.ts` — OPEN obligation listing / cycle helpers (feed slots; no NW imports)
- `src/lib/locf.ts` / `src/lib/money.ts` — LOCF today + convert to primary
- `src/lib/dates.ts` — `RangePreset`, horizon helpers
- `src/components/dashboard/DashboardChartsShell.tsx` — merge forecast; partial banner «Прогноз неполный · нет курса»
- `src/components/dashboard/NetWorthHistoryChart.tsx` — dashed Line, today hinge tooltip split
- `src/app/page.tsx` — dashboard data load (add OPEN grace inputs)
- `src/lib/net-worth.ts` / `src/lib/historical-series.ts` — must stay grace-free (Phase 22 proves; do not pollute here)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `buildNetWorthForecastSeries` + `ForecastSlot` — extend or generalize for grace slots with kind + zero-delta addend
- `DashboardChartsShell` — already builds income slots, calls forecast builder, toggles `showForecast` / partial banner
- `NetWorthHistoryChart` — today vs future tooltip split; needs grace metadata on points (today + future)
- Credit grace actions/list — source of OPEN rows with `dueAsOf`, `amountMinor`, account currency

### Established Patterns
- Sparse sample dates: today ∪ event dates ∪ horizon end
- Partial honesty: exclude slot + banner; never invent FX
- Side ledgers never write `BalanceSnapshot`; forecast is overlay-only
- Russian-first quiet banners near chart

### Integration Points
- Капитал `/` chart shell merges income + grace into one forecast series
- Tooltip payloads must carry per-obligation grace rows for D-09/D-12
- Banner string builder must collect unique missing currency codes across income + grace exclusions

</code_context>

<specifics>
## Specific Ideas

- Banner must name **which rates are missing** (currency codes), not a generic «нет курса» alone — and **must not** label income vs grace as the “target”.
- Overdue grace is a deliberate product break from income forecast (income ignores overdue; grace folds overdue to today).

</specifics>

<deferred>
## Deferred Ideas

- Chart legend separating доходы vs обязательства on «Прогноз» — already tracked beyond v1.3 in `.planning/REQUIREMENTS.md` Deferred.
- GRACEISO regression / historical identity checks — Phase 22.

None else raised in discussion that expands Phase 21 scope.

</deferred>

---

*Phase: 21-Капитал forecast integration*
*Context gathered: 2026-09-09*
