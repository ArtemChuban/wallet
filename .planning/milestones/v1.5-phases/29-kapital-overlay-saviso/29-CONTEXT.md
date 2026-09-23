# Phase 29: Капитал overlay + SAVISO - Context

**Gathered:** 2026-09-21
**Status:** Ready for planning

<domain>
## Phase Boundary

On Капитал `/`, dashed «Прогноз» includes future SAVINGS interest credits (ΔNW = +interest, primary currency) and the grace payment now **lowers** that same line (ΔNW = −payment, primary currency). Interest rows appear only on the accrual day. Forecast never writes `BalanceSnapshot` and never rewrites historical NW LOCF (SAVISO).

Does **not** deliver: MCP interest/grace events (Phase 30), ASSET ↔ SAVINGS conversion (Phase 31), chart legend split by kind, auto BalanceSnapshot, a second forecast series.

</domain>

<decisions>
## Implementation Decisions

### Tooltip rows
- **D-01:** One tooltip row per SAVINGS account: account name + amount. — **Reversibility:** reversible
- **D-02:** Same-day rows sort by amount descending; equal amounts by account name А→Я.
- **D-03:** Interest row exists only on the accrual-day tooltip. Later forecast days keep the higher line and do not repeat the row.

### Copy and order
- **D-04:** Interest block header is **«Накопительный»** (same word as the account type label).
- **D-05:** One subtitle under that header: **«Ожидаемое начисление»**. Not repeated per row.
- **D-06:** Block order on a future day: «Прогноз» level, then interest block, then grace block.
- **D-07:** Interest rows are name + amount only.

### Amounts and line movement
- **D-08:** Interest row amount is **primary currency only**, with a plus sign (`+1 234`). One «Прогноз» line, in primary. — **Reversibility:** costly — chart axis, FX conversion, and tooltip payload all assume primary.
- **D-09:** Grace row amount gets a **minus** sign. Header stays **«Платёж для беспроцентного»**. Subtitle becomes **«Ожидаемый платёж»**. Drop «NW без изменения (оплата карты)».
- **D-10:** The «Прогноз» figure is the NW **level**, not a delta. No plus prefix. A minus appears only when that level is itself negative.
- **D-11:** In this phase the dashed line **falls by the grace payment** in primary, the same way it rises from income and from savings interest. Phase 21 A′ / ΔNW = 0 for the **line** is revoked. Tooltip minus is the payment; the line moves by that primary amount. — **Reversibility:** costly — `buildNetWorthForecastSeries` grace branch, chart tests, and Phase 21 tooltip copy all assume a flat grace addend.
- **D-12:** The grace dip and the interest rise are forecast overlay only. No `BalanceSnapshot` writes. Historical NW LOCF stays account snapshots only (SAVISO + existing GRISO isolation).

### Compound in the tooltip
- **D-13:** The row shows **this accrual day's credit only**. Do not show the account balance after the credit. Do not sum all future credits through the horizon. Do not show a delta versus the previous month. The word «капитализация» does not appear. Compounding stays in the Phase 28 math, so the next accrual day's plus is larger. — **Reversibility:** reversible

### Carried locks (do not reopen)
- **C-01:** One dashed series. Kind is tooltip-only. Legend split by kind stays deferred.
- **C-02:** Horizon matches the dashboard lookback (`30d` / `90d` / `1y`; `all` → 1y).
- **C-03:** Missing FX: drop that slot, one banner «Прогноз неполный · нет курса …», currency codes only, no kind tag. Applies to interest and to grace.
- **C-04:** Interest math, future-only membership, account-currency calculation, monthly compound chain — Phase 28. This phase only wires and displays.
- **C-05:** MCP read parity — Phase 30. Do not ship MCP tool changes here.
- **C-06:** Savings todo stays open until v1.5 ships (folded in Phases 27–28). Do not mark it resolved in this phase.

### Claude's Discretion
- DOM/CSS of the interest block: mirror `ForecastGraceTooltipBlock` (one header, one subtitle, rows under it).
- How the plus/minus prefix is applied on top of `formatChartNumber` without signing the «Прогноз» level.
- Stable sort details beyond amount desc + name А→Я.
- Page/`DashboardChartsShell` wiring for interest slots. Research and plan choose the call shape. Grace ΔNW sign flip happens in the same forecast builder the shell already calls.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase / milestone scope
- `.planning/ROADMAP.md` — Phase 29 success criteria (INT-02, INT-03, SAVISO-01, SAVISO-02). Line-drop for grace is an overlay correction inside this phase, beyond the original SC text.
- `.planning/REQUIREMENTS.md` — INT-02, INT-03, SAVISO-01, SAVISO-02. Deferred legend. Out of Scope: auto snapshot, interest-as-income ledger.
- `.planning/PROJECT.md` — v1.5 forecast overlay; no auto BalanceSnapshot. Prior v1.3 note that grace is A′ ΔNW=0 is **overridden for the forecast line by D-11**.
- `.planning/STATE.md` — current position

### Prior decisions
- `.planning/phases/28-interest-math-forecast-kind/28-CONTEXT.md` — compound chain, future-only slots, `ForecastSlotKind: "interest"`, parentId = accountId. Tooltip display of principal was left to this phase (D-13 resolves it).
- `.planning/phases/27-savings-schema-crud/27-CONTEXT.md` — SAVINGS type, «Накопительный», bps, accrual DOM
- `.planning/milestones/v1.3-phases/21-kapital-forecast-integration/21-CONTEXT.md` — tooltip order, FX banner, horizon. **D-11 overrides C-01 / flat A′ (ΔNW=0) for the forecast line.** Banner and horizon locks still hold.

### Code anchors
- `src/lib/nw-forecast.ts` — `ForecastSlotKind`, grace ΔNW branch (today `0n`; this phase makes grace negative), interest `+amount`
- `src/lib/savings-interest.ts` — monthly compound enumerator from Phase 28
- `src/components/dashboard/NetWorthHistoryChart.tsx` — future tooltip: «Прогноз» level, then `ForecastGraceTooltipBlock` («Платёж для беспроцентного» / «NW без изменения»)
- `src/components/dashboard/DashboardChartsShell.tsx` — merges income + grace slots; partial banner «Прогноз неполный»
- `src/lib/mcp/reads/load-forecast-overlay.ts` — same builder; **do not change MCP surface here** (Phase 30) unless a shared pure function must change for the UI and the MCP loader imports it. If the shared builder's grace delta changes, MCP will observe the new numbers; tool schema/copy stays Phase 30.
- `.planning/OPERATOR.md` — agent-driven UAT

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ForecastGraceTooltipBlock` in `NetWorthHistoryChart.tsx` — header + subtitle + one row per event. Interest block follows this shape.
- `buildNetWorthForecastSeries` — already branches on kind. Grace addend is the line change. Interest kind already exists from Phase 28.
- `DashboardChartsShell` — `forecastIncome` + `forecastGrace` props. Interest slots join this merge.
- `formatChartNumber` — row and level formatting. Signs are a prefix policy (D-08, D-09, D-10), not a second formatter.

### Established Patterns
- Future tooltip (`asOfDate > today`): «Прогноз» aggregate first, grace block below. Interest inserts between them (D-06).
- Sparse samples: today ∪ event dates ∪ horizon end. Interest samples its accrual dates only.
- FX honesty: exclude slot, unique currency codes on one banner.
- Side effects: forecast builders do not write snapshots.

### Integration Points
- Капитал `/` chart shell and `NetWorthHistoryChart` tooltip.
- Grace line math in `nw-forecast.ts` (D-11).
- SAVISO tests: snapshot mutators never called; historical series golden identity without interest credits.

</code_context>

<specifics>
## Specific Ideas

- Interest block reads like the grace block: one header, one quiet subtitle, then named rows.
- «Прогноз» stays a plain level. Plus and minus live on the detail rows and in the line geometry.
- User corrected the flat grace line in this phase on purpose: salary and interest raise the line; grace payment lowers it.

</specifics>

<deferred>
## Deferred Ideas

- MCP `list_accounts` / forecast interest events and PARITY-01 — Phase 30
- ASSET ↔ SAVINGS type conversion — Phase 31
- Chart legend separating income vs interest vs grace — already deferred in REQUIREMENTS.md
- Savings todo `.planning/todos/pending/2026-09-10-savings-account-type-with-interest-nw-forecast.md` stays pending until v1.5 ships

</deferred>

---

*Phase: 29-Капитал overlay + SAVISO*
*Context gathered: 2026-09-21*
