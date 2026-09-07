# Phase 17: NW forecast overlay + isolation - Context

**Gathered:** 2026-09-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Капитал (`/`) shows a forward NW projection as a dashed overlay from planned income (recurring + future one-time), converted via FX LOCF; historical NW / `computeNetWorthRows` stay account-only; income never writes `BalanceSnapshot`. Deliver FCST-01 (revised) + ISO-01 / INISO isolation regressions and Nyquist gate for v1.2 income close-out.

Does **not** deliver: auto balance bump on actual, income inside historical LOCF, Monte Carlo / multi-year retirement forecast, credit grace forecasting, destination-account / withdrawal-date FX, `/income` stats UI reuse for forecast.

</domain>

<decisions>
## Implementation Decisions

### Forecast membership (FCST)
- **D-01:** Overlay includes **recurring + future one-time** planned slots. Locks Phase 13 D-12; **revise** REQUIREMENTS FCST-01 / ROADMAP success criteria (was recurring-only / one-time excluded). — **Reversibility:** costly — REQ text, tests, and chart inputs assume both kinds.
- **D-02:** Only **open** future plans: `plannedAsOf > today` **and** no actual. Filled slots never enter forecast (no double-count). Past unfilled overdue **ignored** for overlay.
- **D-03:** Slot with `plannedAsOf === today` is **out** of forecast; today NW = accounts-only anchor.
- **D-04:** Forward series is **cumulative** from today's NW anchor (stair-step at pay dates). — **Reversibility:** costly — chart semantics and tests keyed to cumulative path.

### Horizon
- **D-05:** Forecast horizon **mirrors** dashboard lookback preset, with **1y cap** on `all`: `30d→30d`, `90d→90d`, `1y→1y`, `all→1y`. Not a fixed independent 90d. — **Reversibility:** costly — shell must recompute/slice overlay when range changes.
- **D-06:** Sample **sparse** dates only: pay dates ∪ today ∪ horizon end (same family as historical-series).
- **D-07:** X-axis spans **past + future** through horizon end (one chart).
- **D-08:** If no includable open slots in horizon → **hide** forecast series (fact only).

### Chart chrome
- **D-09:** Forecast = dashed **Line** (`strokeDasharray`; `ComposedChart` or equivalent) atop existing account stack Areas — not a filled Area.
- **D-10:** Legend = account names (as today) **+** «Прогноз» for the dashed series.
- **D-11:** Tooltip split: date ≤ today → account stack + NW as now; date > today → **«Прогноз»** + amount only (no fake account stack).
- **D-12:** Vertical **ReferenceLine** at today marking the fact→forecast hinge.

### FX honesty
- **D-13:** Convert future planned amounts with FX LOCF **as of today** (last known ≤ today) for all future slots.
- **D-14:** Missing rate for a slot → **exclude** that slot from cumulative + partial honesty (never invent 0/1 rates).
- **D-15:** Partial chrome = quiet banner near NW chart on Капитал (Debts/Phase 16 tone).
- **D-16:** If every slot excluded by FX → hide forecast series **and** still show partial banner.

### Isolation (ISO-01 / INISO) — carried + this phase
- **D-17:** Income must not mutate historical NW LOCF / `computeNetWorthRows`; income actions never write `BalanceSnapshot`. Full INISO suite this phase (file-scan + property/golden: past series identical with/without income data). — **Reversibility:** one-way for product trust — regressing isolation breaks Core Value.
- **D-18:** New pure `nw-forecast.ts` (or equivalent) builds overlay; `net-worth.ts` / `historical-series.ts` must not import income/forecast. Dashboard **may** merge forecast into chart props (intentional capital UX).

### Carried locks (do not re-open)
- Side ledger income; Person reuse; zero new npm packages; Russian-first UI.
- Phase 16 stats stay on `/income`; forecast must not reuse stats UI.
- No auto `BalanceSnapshot` on actual; withdrawal-date FX out of scope (Phase 16 D-09).

### Claude's Discretion
- Exact RU microcopy for «Прогноз», partial banner, empty/no-series states (match Debts/CPTY tone).
- ComposedChart wiring details vs minimal AreaChart+Line hack; color token for forecast stroke.
- INISO test file layout (mirror `disol.test.ts` + historical golden fixtures).
- Whether page preloads max 1y slots and client slices by preset, vs recompute per preset — pick simplest correct approach in research/plan.
- Sync REQUIREMENTS.md / ROADMAP / STATE wording for FCST-01 one-time inclusion as part of planning wave.

### Reviewed Todos (not folded)
- Weak keyword matches (merge account types, timezone, credit grace forecast, local AI agent) — out of Phase 17 scope; not folded.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone / phase scope
- `.planning/ROADMAP.md` — Phase 17 goal, success criteria (update one-time wording per D-01), UI hint
- `.planning/REQUIREMENTS.md` — FCST-01 (revise per D-01), ISO-01; Out of Scope / Key Decisions antithesis
- `.planning/PROJECT.md` — forecast ≠ historical LOCF; no auto balance; Russian-first
- `.planning/STATE.md` — v1.2 locks; drop stale «one-time excluded» blocker after D-01 sync

### Prior phase decisions
- `.planning/phases/13-income-schema-domain-math/13-CONTEXT.md` — D-12 one-time in forecast; occurrence API / freeze
- `.planning/phases/14-dohody-crud-nav/14-CONTEXT.md` — `/income` CRUD; ISO mindset
- `.planning/phases/15-plan-vs-actual-overdue/15-CONTEXT.md` — actuals; no BalanceSnapshot
- `.planning/phases/16-counterparty-income-stats/16-CONTEXT.md` — FX exclude + partial honesty patterns; forecast ≠ stats UI

### Research
- `.planning/research/SUMMARY.md` — overlay architecture; INISO; dual series
- `.planning/research/ARCHITECTURE.md` — `nw-forecast.ts` sketch; dashboard may import forecast; sparse samples
- `.planning/research/PITFALLS.md` — LOCF pollution; double-count; chart-as-fact; FX invent
- `.planning/research/STACK.md` — recharts strokeDasharray; zero new packages
- `.planning/research/FEATURES.md` — forecast phase cut

### Operator / patterns
- `.planning/OPERATOR.md` — agent-driven UAT (Orca)
- `.planning/codebase/CONVENTIONS.md` — UAT + no `window.confirm`

### Code anchors
- `src/lib/net-worth.ts` — `computeNetWorthRows` (must stay income-free)
- `src/lib/historical-series.ts` — `buildNetWorthSeries` ≤ today (must stay income-free)
- `src/lib/income.ts` — occurrence listing for open future slots
- `src/lib/locf.ts` / `src/lib/money.ts` — LOCF today + convert to primary
- `src/lib/dates.ts` — `RangePreset`, window helpers; horizon mirror mapping
- `src/components/dashboard/NetWorthHistoryChart.tsx` — dual series + tooltip + legend
- `src/components/dashboard/DashboardChartsShell.tsx` — range state; merge forecast props
- `src/app/page.tsx` — load income defs/actuals for forecast inputs
- `src/lib/disol.test.ts` — isolation scan pattern to mirror as INISO
- `src/app/income/actions.test.ts` — no BalanceSnapshot writes from income actions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `NetWorthHistoryChart` + `DashboardChartsShell` — extend for forecast Line, ReferenceLine, range-tied horizon
- `list*Occurrences` / `listAllInRange` in `income.ts` — feed open future slots
- `locfRateAsOf` + `convertOtherMinorToPrimaryMinor` — primary conversion @ today
- `disol.test.ts` / income light ISO scan — expand to full INISO

### Established Patterns
- Historical series sparse sampling ≤ today; forecast sparse > today
- Partial honesty: exclude + banner, never invent FX
- Side ledger never writes BalanceSnapshot
- Russian UI; recharts via shadcn `ChartContainer`

### Integration Points
- `page.tsx` loads income + rates → pure `nw-forecast` → shell merges into chart
- Range preset change updates forward horizon (D-05)
- Vitest: cumulative math, membership rules, INISO past-series identity, action write-gate
- REQUIREMENTS/ROADMAP FCST-01 text sync in a plan task

</code_context>

<specifics>
## Specific Ideas

- User locked horizon mapping explicitly: `30d→30d`, `90d→90d`, `1y→1y`, `all→1y` (not research's fixed independent 90d).
- Discussion in Russian; product UI Russian-first («Прогноз», partial copy).
- No todos folded; origin salary/forecast todo already deleted in Phase 16.

</specifics>

<deferred>
## Deferred Ideas

None new from discussion — stayed in phase scope.

### Reviewed Todos (not folded)
- Merge debit/crypto/cash account types — separate product; not Phase 17
- Timezone selection in settings — general backlog
- Credit grace / statement forecasting — already Out of Scope
- Local AI agent via subprocess — general backlog

</deferred>

---

*Phase: 17-NW forecast overlay + isolation*
*Context gathered: 2026-09-07*
