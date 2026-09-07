# Phase 17: NW forecast overlay + isolation - Research

**Researched:** 2026-09-07
**Domain:** Капитал NW forecast overlay (recharts dual series) + INISO isolation close-out
**Confidence:** HIGH (in-repo seams + CONTEXT locks); MEDIUM (chart chrome microcopy / ComposedChart visual polish)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Forecast membership (FCST)
- **D-01:** Overlay includes **recurring + future one-time** planned slots. Locks Phase 13 D-12; **revise** REQUIREMENTS FCST-01 / ROADMAP success criteria (was recurring-only / one-time excluded). — **Reversibility:** costly — REQ text, tests, and chart inputs assume both kinds.
- **D-02:** Only **open** future plans: `plannedAsOf > today` **and** no actual. Filled slots never enter forecast (no double-count). Past unfilled overdue **ignored** for overlay.
- **D-03:** Slot with `plannedAsOf === today` is **out** of forecast; today NW = accounts-only anchor.
- **D-04:** Forward series is **cumulative** from today's NW anchor (stair-step at pay dates). — **Reversibility:** costly — chart semantics and tests keyed to cumulative path.

#### Horizon
- **D-05:** Forecast horizon **mirrors** dashboard lookback preset, with **1y cap** on `all`: `30d→30d`, `90d→90d`, `1y→1y`, `all→1y`. Not a fixed independent 90d. — **Reversibility:** costly — shell must recompute/slice overlay when range changes.
- **D-06:** Sample **sparse** dates only: pay dates ∪ today ∪ horizon end (same family as historical-series).
- **D-07:** X-axis spans **past + future** through horizon end (one chart).
- **D-08:** If no includable open slots in horizon → **hide** forecast series (fact only).

#### Chart chrome
- **D-09:** Forecast = dashed **Line** (`strokeDasharray`; `ComposedChart` or equivalent) atop existing account stack Areas — not a filled Area.
- **D-10:** Legend = account names (as today) **+** «Прогноз» for the dashed series.
- **D-11:** Tooltip split: date ≤ today → account stack + NW as now; date > today → **«Прогноз»** + amount only (no fake account stack).
- **D-12:** Vertical **ReferenceLine** at today marking the fact→forecast hinge.

#### FX honesty
- **D-13:** Convert future planned amounts with FX LOCF **as of today** (last known ≤ today) for all future slots.
- **D-14:** Missing rate for a slot → **exclude** that slot from cumulative + partial honesty (never invent 0/1 rates).
- **D-15:** Partial chrome = quiet banner near NW chart on Капитал (Debts/Phase 16 tone).
- **D-16:** If every slot excluded by FX → hide forecast series **and** still show partial banner.

#### Isolation (ISO-01 / INISO) — carried + this phase
- **D-17:** Income must not mutate historical NW LOCF / `computeNetWorthRows`; income actions never write `BalanceSnapshot`. Full INISO suite this phase (file-scan + property/golden: past series identical with/without income data). — **Reversibility:** one-way for product trust — regressing isolation breaks Core Value.
- **D-18:** New pure `nw-forecast.ts` (or equivalent) builds overlay; `net-worth.ts` / `historical-series.ts` must not import income/forecast. Dashboard **may** merge forecast into chart props (intentional capital UX).

#### Carried locks (do not re-open)
- Side ledger income; Person reuse; zero new npm packages; Russian-first UI.
- Phase 16 stats stay on `/income`; forecast must not reuse stats UI.
- No auto `BalanceSnapshot` on actual; withdrawal-date FX out of scope (Phase 16 D-09).

### Claude's Discretion
- Exact RU microcopy for «Прогноз», partial banner, empty/no-series states (match Debts/CPTY tone).
- ComposedChart wiring details vs minimal AreaChart+Line hack; color token for forecast stroke.
- INISO test file layout (mirror `disol.test.ts` + historical golden fixtures).
- Whether page preloads max 1y slots and client slices by preset, vs recompute per preset — pick simplest correct approach in research/plan.
- Sync REQUIREMENTS.md / ROADMAP / STATE wording for FCST-01 one-time inclusion as part of planning wave.

### Deferred Ideas (OUT OF SCOPE)
None new from discussion — stayed in phase scope.

#### Reviewed Todos (not folded)
- Merge debit/crypto/cash account types — separate product; not Phase 17
- Timezone selection in settings — general backlog
- Credit grace / statement forecasting — already Out of Scope
- Local AI agent via subprocess — general backlog
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FCST-01 | On `/`, NW chart future dashed overlay from planned income × FX LOCF; **CONTEXT D-01 revises** stale REQ text (recurring **+ future one-time** in overlay) | `nw-forecast.ts` cumulative builder; `listAllInRange` membership; `ComposedChart`+`Line`+`ReferenceLine`; shell horizon mirror D-05; REQUIREMENTS/ROADMAP/STATE sync task |
| ISO-01 | Income never mutates historical NW LOCF / `computeNetWorthRows`; income actions never write `BalanceSnapshot` | INISO file-scan (`iniso.test.ts`); property/golden past-series identity; keep/expand `actions.test.ts` BalanceSnapshot gate; D-18 import walls |
</phase_requirements>

## Summary

Phase 17 closes v1.2 by adding a **forward-only** NW projection on Капитал without touching the account LOCF fact path. Historical series stays `buildNetWorthSeries` → `computeNetWorthRows` (balances × FX ≤ today). Forecast is a new pure module that starts from **today’s accounts-only NW anchor**, adds **open** future planned slots (recurring + one-time, `plannedAsOf > today`, no actual), converts each slot with **FX LOCF as of today**, and emits a sparse cumulative stair-step through a horizon that **mirrors** the dashboard range preset (`all` capped at 1y). Chart UX: switch `NetWorthHistoryChart` to `ComposedChart`, dashed `Line` («Прогноз»), vertical `ReferenceLine` at today, tooltip split fact vs forecast. Isolation (INISO) mirrors DISOL: file-scan + property that past series is identical with/without income fixtures; actions never write `BalanceSnapshot`.

Stale docs still say one-time excluded (REQUIREMENTS FCST-01, Out of Scope, STATE blocker). CONTEXT D-01 + Phase 13 D-12 supersede — planner must sync wording in a docs task.

**Primary recommendation:** Add `src/lib/nw-forecast.ts` + `nw-forecast.test.ts`; load income defs/actuals on `page.tsx`; merge in `DashboardChartsShell` via `forecastHorizonEnd(preset)` + pure builder; extend chart to `ComposedChart`/`Line`/`ReferenceLine`; ship `iniso.test.ts` + docs sync. **Zero new npm packages.**

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Today NW anchor (`computeNetWorthRows`) | API / Backend lib | Frontend Server (RSC load) | Account LOCF math stays income-free; page already computes hero total |
| Historical sparse series ≤ today | API / Backend lib | Browser (shell `useMemo`) | Unchanged `buildNetWorthSeries`; client only revives BigInt payloads |
| Open-slot membership + occurrence gen | API / Backend lib (`income.ts`) | Frontend Server (load defs) | Reuse `listAllInRange`; filter `plannedAsOf > today` ∧ no actual |
| Cumulative forecast series + FX@today | API / Backend lib (`nw-forecast.ts`) | Browser (shell merge) | Pure overlay; must not live in `historical-series.ts` |
| Horizon ↔ range preset | Browser / Client | — | Range state already in `DashboardChartsShell`; D-05 forces recompute on change |
| Chart dual series + tooltip/legend/hinge | Browser / Client | — | recharts `ComposedChart` / `Line` / `ReferenceLine` |
| Partial FX banner near NW chart | Browser / Client (+ RSC props) | — | Same quiet `role="status"` tone as Капитал/Debts/CPTY |
| INISO regressions | Test runner | — | File-scan + property/golden; no runtime tier |
| Docs sync FCST-01 one-time | Planning docs | — | CONTEXT supersedes stale REQUIREMENTS/STATE |

## Project Constraints (from .cursor/rules/)

No `.cursor/rules/` files present in repo. Applicable project directives from AGENTS / conventions:

- Next.js in this repo may differ from training — read `node_modules/next/dist/docs/` before novel Next APIs. [VERIFIED: AGENTS.md present]
- Before UAT: read `.planning/OPERATOR.md`; agent drives `npm run dev` + Orca; no `window.confirm`. [VERIFIED: `.planning/codebase/CONVENTIONS.md:8-16`]
- Prefer **codegraph** for codebase search (user rule).

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 3.10.1 (pinned) | `ComposedChart` + stacked `Area` + dashed `Line` + `ReferenceLine` | Already used by `NetWorthHistoryChart`; official APIs cover D-09/D-12 [VERIFIED: `package.json` + `require('recharts')` exports] |
| Vitest | 4.1.11 | Forecast math + INISO file-scan/property | Existing `vitest.config.ts` `src/**/*.test.ts` [VERIFIED: `package.json` / `vitest.config.ts:4-7`] |
| Next.js App Router | 16.3.4 | `page.tsx` RSC load income + pass chart props | Same pattern as current Капитал / `/income` |
| Prisma + SQLite | 7.10.0 | Read `RecurringIncome` / `OneTimeIncome` + actuals | No schema change expected this phase |

### Supporting (in-repo — prefer over npm)

| Module | Purpose | When to Use |
|--------|---------|-------------|
| `@/lib/income` `listAllInRange` | Virtual slots in `[from,to]` | Feed candidate slots; then filter open-future |
| `@/lib/locf` `locfRateAsOf` | FX LOCF ≤ asOf | D-13: always asOf=`today` for forecast converts |
| `@/lib/money` `convertOtherMinorToPrimaryMinor` / `minorToMajorNumber` | Primary conversion + chart majors | Never invent rates / floats in domain |
| `@/lib/dates` `RangePreset` / `addCalendarDays` / `windowStartForPreset` | Horizon mirror + calendar math | New `forecastHorizonEnd` helper beside window start |
| `@/lib/net-worth` / `@/lib/historical-series` | Fact path | **Do not** import income/forecast |
| `@/components/ui/chart` | ChartContainer / legend / tooltip | Keep shadcn theming |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| New `nw-forecast.ts` | Extend `buildNetWorthSeries` past today | **Forbidden** — LOCF pollution / D-18 / Pitfall 7 |
| Fixed independent 90d horizon | Preset-mirrored horizon | Locked out by D-05 |
| New chart library | recharts only | Zero-packages lock |
| AreaChart + hack Line | `ComposedChart` | Official parent for Area+Line together [CITED: recharts.github.io/en-US/api/ComposedChart/] |

**Installation:**

```bash
# NONE — zero new packages (CONTEXT carried lock)
```

**Version verification:** `recharts@3.10.1`, `vitest@4.1.11`, `next@16.3.4` confirmed via `package.json` / `npm view recharts version` → `3.10.1` (2026-09-07).

## Package Legitimacy Audit

> Phase installs **no** external packages.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| — | — | — | — | — | N/A | No installs |

**Packages removed due to [SLOP] verdict:** none  
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│  GET /  (RSC page.tsx)                                               │
│  accounts + BalanceSnapshot≤today + FxRate≤today                     │
│  + RecurringIncome/OneTimeIncome + actuals (NEW load)                │
│         │                                                            │
│         ├─► computeNetWorthRows ──► hero + anchorPrimaryMinor        │
│         └─► DashboardChartsShell props (accounts, snaps, rates,      │
│             incomePayload, anchor, today)                            │
└────────────────────────────┬─────────────────────────────────────────┘
                             │ client range preset
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│  DashboardChartsShell                                                │
│  buildNetWorthSeries(preset, today)     → fact points ≤ today        │
│  forecastHorizonEnd(preset, today)      → horizonEnd                 │
│  listAllInRange / open filter           → slots (today, horizon]     │
│  buildNetWorthForecastSeries(...)       → forecast points            │
│  mergeChartRows(fact, forecast)         → unified data[]             │
└────────────────────────────┬─────────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│  NetWorthHistoryChart (ComposedChart)                                │
│  Area stacks (≤today) │ Line forecast dashed │ ReferenceLine today   │
│  Tooltip: ≤today stacks+Итого │ >today «Прогноз» only                │
└──────────────────────────────────────────────────────────────────────┘

Isolation walls:
  net-worth.ts ──X── income / nw-forecast
  historical-series.ts ──X── income / nw-forecast
  income actions ──X── BalanceSnapshot writes
  Dashboard ──✓── may import income + nw-forecast (intentional)
```

### Recommended Project Structure

```
src/lib/
├── nw-forecast.ts              # NEW: buildNetWorthForecastSeries + horizon helper
├── nw-forecast.test.ts         # NEW: membership, cumulative, FX exclude, hide rules
├── iniso.test.ts               # NEW: file-scan + past-series identity property
├── income.ts                   # REUSE listAllInRange (no nw-forecast import)
├── net-worth.ts                # UNCHANGED math; no income import
└── historical-series.ts        # UNCHANGED ≤today filter; no income import
src/components/dashboard/
├── DashboardChartsShell.tsx    # MODIFY: merge forecast; partial banner props
└── NetWorthHistoryChart.tsx    # MODIFY: ComposedChart + Line + ReferenceLine + tooltip
src/app/page.tsx                # MODIFY: load income defs/actuals; pass payload + anchor
.planning/REQUIREMENTS.md       # SYNC FCST-01 + Out of Scope + Key Decisions
.planning/ROADMAP.md / STATE.md # SYNC success criteria / drop stale blocker
```

### Pattern 1: Pure forecast builder (not LOCF rewrite)

**What:** `buildNetWorthForecastSeries` takes `anchorPrimaryMinor`, enriched open slots, rates, `today`, `horizonEnd`; returns sparse cumulative points + `isPartialForecast` / excluded count.  
**When to use:** Always for Капитал overlay.  
**Example:**

```typescript
// Source: CONTEXT D-02..D-06, D-13..D-16 + ARCHITECTURE Pattern 3
// [ASSUMED] exact export names — implement to match tests

export type ForecastSlot = {
  parentId: number;
  plannedAsOf: string; // must be > today
  plannedAmountMinor: bigint;
  currencyCode: string;
  currencyScale: number;
  isPrimaryCurrency: boolean;
};

export function forecastHorizonEnd(
  preset: RangePreset,
  today: string,
): string {
  // Mirror lookback magnitudes; all → 1y cap (D-05)
  // RangePreset = "30d" | "90d" | "1y" | "all" [VERIFIED: src/lib/dates.ts:5]
  switch (preset) {
    case "30d":
      return addCalendarDays(today, 30);
    case "90d":
      return addCalendarDays(today, 90);
    case "1y":
    case "all":
      return addCalendarDays(today, 365);
  }
}

export function buildNetWorthForecastSeries(input: {
  anchorPrimaryMinor: bigint;
  slots: readonly ForecastSlot[]; // already open + in (today, horizonEnd]
  rates: readonly RateRow[];
  primaryScale: number;
  today: string;
  horizonEnd: string;
}): {
  points: { asOfDate: string; forecastPrimaryMinor: bigint; forecast: number }[];
  isPartialForecast: boolean;
  includedSlotCount: number;
  excludedMissingFxCount: number;
} {
  // 1) Convert each slot @ locfRateAsOf(rates, code, today) — D-13
  //    missing → skip + excludedMissingFxCount++ — D-14
  // 2) sampleDates = {today, horizonEnd} ∪ converted slot dates — D-06
  // 3) sort; cumulative stair-step from anchor — D-04
  // 4) if includedSlotCount===0 → points=[] (caller hides series) — D-08/D-16
}
```

### Pattern 2: Open-slot membership at call site

**What:** `listAllInRange` emits **filled and unfilled** slots (recurring freeze-merge includes actual months; one-time may carry `actual`). Forecast must **filter** after generation.  
**When to use:** Before calling `buildNetWorthForecastSeries`.

```typescript
// [VERIFIED: src/lib/income.ts:58-60, 311-334] IncomeOccurrence =
//   | (RecurringOccurrence & { kind: "recurring" })
//   | (OneTimeOccurrence & { kind: "oneTime" });
// RecurringOccurrence has NO actual field [VERIFIED: src/lib/income.ts:28-32]
// OneTimeOccurrence may have optional actual [VERIFIED: src/lib/income.ts:47-56]

const from = addCalendarDays(today, 1); // D-02/D-03: today out; strict >
const to = forecastHorizonEnd(preset, today);
const raw = listAllInRange(defs, from, to);
const filledRecurring = new Set(
  recurringActuals.map((a) =>
    occurrenceKeyString({ parentId: a.recurringIncomeId, plannedAsOf: a.plannedAsOf }),
  ),
);
const open = raw.filter((o) => {
  if (!(o.plannedAsOf > today)) return false;
  if (o.kind === "oneTime") return o.actual == null;
  return !filledRecurring.has(
    occurrenceKeyString({ parentId: o.parentId, plannedAsOf: o.plannedAsOf }),
  );
});
// Enrich currency from def maps — occurrence types lack currencyCode
// [VERIFIED: RecurringOccurrence fields src/lib/income.ts:28-32]
```

### Pattern 3: Chart merge + ComposedChart

**What:** One `data[]`: fact rows carry stack keys + `nw`; future rows carry `forecast` only (stacks omitted/null); today row carries both `nw`/`stacks` and `forecast === nw` hinge.  
**When to use:** Shell before render.

```tsx
// Source: [CITED: https://recharts.github.io/en-US/api/ComposedChart/]
// Source: [CITED: https://recharts.github.io/en-US/api/Line/] strokeDasharray="5 5"
// Source: [CITED: https://recharts.github.io/en-US/api/ReferenceLine/] x={today}
import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, XAxis, YAxis } from "recharts";

<ComposedChart data={data} stackOffset="sign" accessibilityLayer>
  <XAxis dataKey="asOfDate" />
  <YAxis />
  <ReferenceLine x={today} stroke="var(--border)" />
  {stackKeys.map((key) => (
    <Area key={key} dataKey={key} stackId="nw" connectNulls={false} /* existing fills */ />
  ))}
  {showForecast ? (
    <Line
      dataKey="forecast"
      type="stepAfter" /* or linear — stair-step aligns with D-04; discretion */
      stroke="var(--muted-foreground)"
      strokeDasharray="5 5"
      dot={false}
      connectNulls={false}
      name="Прогноз"
    />
  ) : null}
</ComposedChart>
```

**Discretion recommendation (locked for planner):** Use `ComposedChart` (not AreaChart+hack). Forecast stroke `var(--muted-foreground)` (quiet vs account colors). Curve: `stepAfter` better matches cumulative stair-step semantics; if visual looks harsh, fall back to `linear` with flat segments between sparse points (sparse dates already stair). Prefer **`stepAfter`**.

### Pattern 4: Horizon compute in shell (discretion pick)

**What:** Page preloads income defs/actuals for **max horizon (365d)** once; shell calls `buildNetWorthForecastSeries` inside `useMemo` keyed by `range` (same as historical).  
**Why simplest correct:** Matches existing `buildNetWorthSeries({ preset: range })` pattern in `DashboardChartsShell` [VERIFIED: `DashboardChartsShell.tsx:96-118`]. Avoids dual paths (preload-slice vs recompute) and keeps BigInt revive colocated.

**Anti-Patterns to Avoid**
- **Feed income into `computeNetWorthRows` / past `buildNetWorthSeries`:** kills Core Value (ISO-01).
- **`plannedAsOf >= today`:** includes today pay → double-counts vs accounts-only today (D-03).
- **FX as-of planned date for future:** CONTEXT locks **today** LOCF (D-13); no future FxRate rows anyway.
- **Invent rate 1 / 0 on miss:** D-14; exclude + banner.
- **Solid Area for forecast:** looks like measured NW (D-09 / Pitfall chart-as-fact).
- **Reuse `/income` stats UI** on Капитал for forecast partials.
- **Import `nw-forecast` from `net-worth.ts` / `historical-series.ts`.**

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Monthly DOM occurrences | Custom month walker in page | `listAllInRange` / `listRecurringOccurrences` | Freeze-merge + clamp already tested |
| FX LOCF | Ad-hoc “latest rate” | `locfRateAsOf` | Same honesty as NW/CPTY |
| Money convert | `Number` / invent 1.0 | `convertOtherMinorToPrimaryMinor` | BigInt scale rules |
| Isolation scan | Ad-hoc checklist | Mirror `disol.test.ts` + income light ISO | Proven file-scan pattern |
| Chart dash mid-segment | One Line with custom path | Dual series + `strokeDasharray` | Recharts cannot dash mid single series cleanly [ASSUMED community; mitigated by official dual-series ComposedChart] |
| Calendar horizon | `Date` local TZ | `addCalendarDays` | Existing UTC-calendar family |

**Key insight:** Hard part is **membership + isolation walls**, not chart paint. Reuse income generators; keep forecast math pure and import-free from historical path.

## Common Pitfalls

### Pitfall 1: LOCF pollution / single `nw` field past today
**What goes wrong:** Past points jump when income added; chart reads as measured history.  
**Why:** Convenience merge into `buildNetWorthSeries`.  
**How to avoid:** Separate `forecast` dataKey; INISO property test.  
**Warning signs:** Income import in `historical-series.ts`; past golden fixtures change.

### Pitfall 2: Double-count filled slots / today slot
**What goes wrong:** Forecast adds plan already actualed or today’s pay already in balances.  
**Why:** `listAllInRange` includes frozen/filled; `>= today` mistake.  
**How to avoid:** Strict `plannedAsOf > today` + actual-key exclude (D-02/D-03).  
**Warning signs:** Jump ~2× salary on pay month; today hinge ≠ hero NW.

### Pitfall 3: Recurring “hasActual” blind spot
**What goes wrong:** Recurring occurrences lack `actual` field — filter only checks one-time.  
**Why:** Type asymmetry [VERIFIED: `src/lib/income.ts:28-56`].  
**How to avoid:** Always set-check `RecurringIncomeActual` keys for recurring kind.  
**Warning signs:** Filled recurring month still in overlay.

### Pitfall 4: Currency missing on occurrence
**What goes wrong:** Cannot convert non-primary without joining def.currency.  
**Why:** `RecurringOccurrence` / plan fields omit `currencyCode` [VERIFIED: `src/lib/income.ts:28-32`].  
**How to avoid:** Build `ForecastSlot` with currency from Prisma/def maps at page or shell.

### Pitfall 5: FX invent / wrong as-of
**What goes wrong:** Silent wrong primary totals.  
**Why:** Temptation to use plannedAsOf LOCF or rate=1.  
**How to avoid:** `locfRateAsOf(..., today)` only; exclude + banner (D-13–D-16). Match CPTY quiet copy tone: «Итог неполный · нет курса» family [VERIFIED: `IncomeList.tsx:241-245`].

### Pitfall 6: ReferenceLine discarded / empty future axis
**What goes wrong:** Hinge missing; X stops at today.  
**Why:** `ReferenceLine` `ifOverflow` default `discard`; data array never includes future dates.  
**How to avoid:** Always include `today` + `horizonEnd` in merged data when forecast shown; extend X domain via data points (D-06/D-07).

### Pitfall 7: Stale REQ text ships wrong tests
**What goes wrong:** Tests assert one-time excluded; product wants one-time in.  
**Why:** REQUIREMENTS still says recurring-only [VERIFIED: `.planning/REQUIREMENTS.md` FCST-01 / Out of Scope].  
**How to avoid:** Docs-sync task early in planning wave (CONTEXT discretion).

### Pitfall 8: Actions write BalanceSnapshot
**What goes wrong:** ISO-01 broken.  
**Why:** “income received → money appeared.”  
**How to avoid:** Keep `actions.test.ts` gate; INISO scan actions for `BalanceSnapshot` [VERIFIED: `src/app/income/actions.test.ts:658-664`].

## Code Examples

### Horizon mapping (D-05)

```typescript
// [VERIFIED: src/lib/dates.ts:5] export type RangePreset = "30d" | "90d" | "1y" | "all";
// [VERIFIED: src/lib/dates.ts:72-89] windowStartForPreset: 30→-30, 90→-90, 1y→-365, all→null
// Forward mirror: +30 / +90 / +365 / all→+365
```

### INISO file-scan skeleton

```typescript
// Mirror [VERIFIED: src/lib/disol.test.ts:4-15] + income light ISO [VERIFIED: src/lib/income.test.ts:630-646]
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("INISO-01 isolation", () => {
  for (const file of ["src/lib/net-worth.ts", "src/lib/historical-series.ts"]) {
    it(`${file} does not import income or nw-forecast`, () => {
      const src = readFileSync(file, "utf8");
      expect(src).not.toMatch(/@\/lib\/(?:income|nw-forecast)|from ["']\.\/(?:income|nw-forecast)["']/);
    });
  }

  it("nw-forecast.ts does not import net-worth historical path mutations", () => {
    const src = readFileSync("src/lib/nw-forecast.ts", "utf8");
    // may import money/locf/dates; must not import prisma
    expect(src).not.toMatch(/prisma|BalanceSnapshot/);
  });
});
```

### Past-series identity property

```typescript
// Same accounts/snapshots/rates → buildNetWorthSeries identical whether income tables conceptually empty or full
// (pure: income args not passed into buildNetWorthSeries at all — assert API surface + golden fixture)
const base = buildNetWorthSeries({ accounts, snapshots, rates, primaryScale, preset: "90d", today });
expect(base.map((p) => [p.asOfDate, p.totalPrimaryMinor.toString()])).toEqual(golden);
// Adding income fixtures must not change this call — compiler/API enforces; still assert no optional income param
```

### Schema note (no active flag)

```
/// Recurring income definition — side ledger (D-03). No active/endAsOf (D-01).
model RecurringIncome { ... }
```
[VERIFIED: `prisma/schema.prisma:125-138`] — include all defs; no active filter.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Independent ~90d forecast horizon (milestone research) | Preset-mirrored horizon + `all→1y` | Phase 17 CONTEXT D-05 | Shell must recompute on range change |
| FCST-01 recurring-only | Recurring + future one-time | Phase 13 D-12 / Phase 17 D-01 | Docs + tests must include one-time |
| AreaChart stacks only | ComposedChart + dashed Line + ReferenceLine | Phase 17 | Chart component rewrite surface |

**Deprecated/outdated:**
- ROADMAP success criterion “one-time income is not included” — **stale**; CONTEXT wins.
- STATE blocker “One-time excluded from NW forecast” — drop on docs sync.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `stepAfter` is best Line `type` for stair-step forecast | Pattern 3 | Visual only — easy swap to `linear` |
| A2 | Forecast stroke `var(--muted-foreground)` fits design | Chart chrome | Token may need chart-6 / border |
| A3 | Community claim “cannot dash mid single series” | Don't Hand-Roll | If wrong, still dual-series is clearer UX |
| A4 | Exact RU partial banner copy «Прогноз неполный · нет курса» | Discretion | Copy tweak in UI-SPEC / UAT |
| A5 | No Prisma schema change required this phase | Structure | Only if currency join forces new query shape (unlikely) |

## Open Questions

1. **Exact RU strings for forecast partial + empty**
   - What we know: CPTY uses «Итог неполный · нет курса»; Debts/Капитал use bordered `role="status"` cards.
   - What's unclear: Forecast-specific wording vs reuse «Итог неполный».
   - Recommendation: «Прогноз неполный · нет курса» near chart; hide series when no includable slots without empty-state toast (D-08).

2. **Legend when single account + forecast**
   - What we know: Today legend only if `accounts.length > 1` [VERIFIED: `NetWorthHistoryChart.tsx:166-168`].
   - What's unclear: With forecast, need «Прогноз» even for 1 account (D-10).
   - Recommendation: Show legend when `accounts.length > 1 || showForecast`.

3. **Should `nw-forecast` call `listAllInRange` internally?**
   - What we know: income.ts must stay free of nw-forecast; reverse import OK.
   - Recommendation: **No** — accept `ForecastSlot[]` only so membership tests stay explicit and currency enrichment stays at boundary.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vitest / Next | ✓ | v24.5.0 | — |
| npm | scripts | ✓ | 10.9.3 | — |
| Vitest | unit/INISO | ✓ | 4.1.11 | — |
| recharts | chart UX | ✓ | 3.10.1 | — |
| codegraph CLI | codebase search | ✓ | installed | Grep |
| gsd graphify | semantic graph | ✗ disabled | — | codegraph + Read (used) |
| Context7 / ctx7 | docs | ✗ | — | WebFetch official recharts API |
| New npm packages | — | N/A | — | Do not install |

**Missing dependencies with no fallback:** none for implementation.

**Missing dependencies with fallback:** graphify disabled → used codegraph; ctx7 missing → WebFetch recharts docs.

Step 2.6 note: external runtime deps are existing stack only.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.11 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run src/lib/nw-forecast.test.ts src/lib/iniso.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FCST-01 | Open recurring+one-time cumulative overlay; today out; filled out | unit | `npx vitest run -t "forecast" src/lib/nw-forecast.test.ts` | ❌ Wave 0 |
| FCST-01 | Horizon mirror 30/90/1y/all→1y | unit | `npx vitest run -t "forecastHorizonEnd" src/lib/nw-forecast.test.ts` | ❌ Wave 0 |
| FCST-01 | FX@today exclude + isPartial; all-excluded hides series | unit | `npx vitest run -t "forecast FX" src/lib/nw-forecast.test.ts` | ❌ Wave 0 |
| FCST-01 | Chart ComposedChart/Line/ReferenceLine/«Прогноз» | file-scan | `npx vitest run -t "NetWorthHistoryChart forecast" src/components/dashboard/*.test.ts` | ❌ Wave 0 |
| FCST-01 | Docs sync one-time in FCST-01 | docs-grep | `grep -n FCST-01 .planning/REQUIREMENTS.md` | ⚠️ stale text today |
| ISO-01 | net-worth/historical-series no income/nw-forecast imports | file-scan | `npx vitest run src/lib/iniso.test.ts` | ❌ Wave 0 |
| ISO-01 | Past `buildNetWorthSeries` golden identical | property/unit | `npx vitest run -t "INISO past series" src/lib/iniso.test.ts` | ❌ Wave 0 |
| ISO-01 | Income actions never BalanceSnapshot | file-scan | `npx vitest run -t "income actions isolation" src/app/income/actions.test.ts` | ✅ |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/nw-forecast.test.ts src/lib/iniso.test.ts`
- **Per wave merge:** `npx vitest run src/lib/nw-forecast.test.ts src/lib/iniso.test.ts src/lib/historical-series.test.ts src/lib/income.test.ts src/app/income/actions.test.ts`
- **Phase gate:** `npx vitest run` green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/lib/nw-forecast.test.ts` — covers FCST membership/cumulative/FX/horizon
- [ ] `src/lib/iniso.test.ts` — file-scan + past-series identity
- [ ] Dashboard chart forecast file-scan test (optional sibling under `src/components/dashboard/`)
- [ ] Framework install: none — Vitest already present

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Single-user local app |
| V3 Session Management | no | — |
| V4 Access Control | no | No multi-tenant |
| V5 Input Validation | yes (existing income writes only) | Zod validations already on income actions; forecast is read-path |
| V6 Cryptography | no | No new crypto; reuse FX scaled ints |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Integrity: income mutates BalanceSnapshot / NW history | Tampering | INISO file-scan + action write-gate; no new write APIs |
| Integrity: invented FX rates in overlay | Tampering / Repudiation of honesty | Exclude slot + partial banner; never 0/1 |
| Spoofing chart as measured future NW | Elevation of privilege (UX) | Dashed Line + «Прогноз» + ReferenceLine hinge |
| Information leak via new endpoints | Info disclosure | No new public API; RSC same trust model |

## Sources

### Primary (HIGH confidence)
- `.planning/phases/17-nw-forecast-overlay-isolation/17-CONTEXT.md` — locked D-01..D-18
- `src/lib/net-worth.ts`, `historical-series.ts`, `income.ts`, `dates.ts`, `disol.test.ts`, `DashboardChartsShell.tsx`, `NetWorthHistoryChart.tsx`, `page.tsx` — Read this session
- `prisma/schema.prisma` RecurringIncome/OneTimeIncome — no active/endAsOf
- `package.json` pins — recharts 3.10.1, vitest 4.1.11
- `.planning/research/{ARCHITECTURE,SUMMARY,PITFALLS,STACK}.md` — milestone overlay architecture
- codegraph explore/query — symbol map for NW chart / listAllInRange / RangePreset

### Secondary (MEDIUM confidence)
- [CITED: https://recharts.github.io/en-US/api/ComposedChart/] — Area+Line composition
- [CITED: https://recharts.github.io/en-US/api/Line/] — `strokeDasharray`
- [CITED: https://recharts.github.io/en-US/api/ReferenceLine/] — vertical `x`
- Phase 13 CONTEXT D-12 — one-time in forecast (pre-lock)

### Tertiary (LOW confidence)
- classify-confidence webfetch/websearch → LOW alone; elevated by in-repo pin cross-check for stack reuse
- Curve type `stepAfter` vs `linear` — visual discretion

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new packages; recharts APIs confirmed exported + official docs
- Architecture: HIGH — CONTEXT + existing shell/series seams; clear import walls
- Pitfalls: HIGH — milestone PITFALLS + concrete type asymmetries verified in `income.ts`

**Research date:** 2026-09-07  
**Valid until:** 2026-10-07 (stable in-repo; recharts API surface slow-moving)
