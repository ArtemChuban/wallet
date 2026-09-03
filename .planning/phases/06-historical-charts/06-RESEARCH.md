# Phase 6: Historical Charts - Research

**Researched:** 2026-09-04
**Domain:** Sparse as-of LOCF net-worth / per-account time series + Recharts (shadcn Chart) on Next.js App Router dashboard
**Confidence:** HIGH (series math / LOCF reuse); MEDIUM (chart library UX edge cases)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
#### Chart placement
- **D-01:** Historical **net-worth chart** lives on **`/`** under the Капитал hero (same page as the dashboard). — **Reversibility:** reversible — can extract a dedicated route later without changing series math.
- **D-02:** **Per-account** history chart opens by **expanding the account row on `/`** (not on `/accounts` for this phase).
- **D-03:** Home layout order: **Hero («Капитал») → NW chart → account list**.
- **D-04:** Account expand shows **chart only** — no snapshot history list and no set/delete on home (Phase 5 D-16 stays: mutations remain on `/accounts`).

#### Time range & sampling
- **D-05:** Range control uses fixed presets: **30d / 90d / 1y / all**. — **Reversibility:** reversible — presets are UI-only.
- **D-06:** Default preset when opening charts: **30d**.
- **D-07:** Chart points are **event dates + today** — emit a point when a relevant snapshot or FX change affects that series, and always include **today** as an endpoint (not one point per calendar day). — **Reversibility:** costly — densifying to daily later changes series shape and performance assumptions.
- **D-08:** **One shared range** applies to the NW chart and any open account expand (same preset for both).

#### Per-account currency & credit
- **D-09:** Per-account chart has a **native ↔ primary toggle**; **default = native**.
- **D-10:** **Hide the toggle** when the account’s currency is the **primary** currency (series is already primary).
- **D-11:** **Credit** accounts plot **both series stacked**: **debt + available** (user: «stacked»).
- **D-12:** In **primary** mode for credit, **both stack segments convert to primary** (not debt-only).

#### Sparse / gap UX
- **D-13:** When there is **no includable data** in the window: show **empty chart axes with zero points** (not a copy-only empty state).
- **D-14:** **Partial NW days** (some accounts missing balance or FX): still **plot a point** using only convertible/included accounts; **do not mark** the day as partial (no badge/tooltip). — User: «1, но модель не помечать».
- **D-15:** If the series has **exactly one point**: show **that single point on the axes**, **no line**.
- **D-16:** Per-account **primary** mode: if an event date has **no FX**, **skip that point** (native series may still include it; primary line may break).

### Claude's Discretion
- Chart library choice (none in package.json yet) and component structure under `src/components/dashboard/` or similar.
- Exact Russian labels for range presets (30д / 90д / 1г / всё) and native/primary toggle chrome.
- How “event dates” are unioned for NW (union of all accounts’ balance events + FX events that affect included accounts) vs per-account (that account’s snapshots + FX for its currency when plotting primary).
- Visual styling of stacked credit series; empty-axes treatment details.
- Whether shared range state is URL/searchParams, client state, or cookie — pick the smallest fit with App Router patterns already in the app.

### Deferred Ideas (OUT OF SCOPE)
- Dedicated `/history` or `/charts` route — not chosen for v1 Phase 6
- Assets vs liabilities breakdown on charts — v2 **NW-04**
- Per-account chart expand on `/accounts` — deferred; Phase 6 uses `/` only
- Snapshot history list / CRUD inside home expand — stays on `/accounts`
- Daily densified calendar sampling — not chosen (event + today instead)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CHART-01 | User can see historical net-worth chart in primary currency | Pure NW series builder samples event∪today dates in range; each date runs `computeNetWorthRows` with LOCF balance×FX as of that date; Line/Area on `/` under Капитал |
| CHART-02 | User can see historical balance chart per account | Expand row on `/`; native (default) or primary series; credit = stacked debt+available (`stackId`); hide toggle when currency is primary |
| CHART-03 | Chart points use as-of balance × as-of FX (no rewrite with today’s rate) | Per-date LOCF maps (same batch pattern as `page.tsx`); unit tests prove rate dated D₂ does not change point at D₁ &lt; D₂ |
</phase_requirements>

## Summary

Phase 6 is a **read-only presentation layer** over Phases 3–5 contracts: for each chart sample date D, resolve LOCF balance and LOCF FX as of D, then reuse `computeNetWorthRows` / `creditDebtMinor` / `convertOtherMinorToPrimaryMinor`. Sampling is **sparse** (balance/FX event dates ∪ today), filtered by a shared **30d / 90d / 1y / all** preset (default 30d). UI stays on `/`: hero → NW chart → expandable account list (chart-only body; no mutations).

No Prisma schema changes. New work is (1) pure series builders + Vitest (CHART-03), (2) install **Recharts v3 via shadcn Chart**, (3) client islands for range + expand + charts. Chart library choice was discretionary: **shadcn `chart` + `recharts@3.10.1`** matches existing base-nova stack; `--chart-*` CSS tokens already exist in `globals.css`.

**Primary recommendation:** Add `src/lib/historical-series.ts` (pure: event union → per-date LOCF inputs → series points as major `number`s for the chart boundary); install shadcn Chart; wrap home with a thin client shell for shared range state; NW `LineChart` + credit `AreaChart` with `stackId` and `dot` forced for one-point series.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Batch load snapshots/rates/accounts | API / Backend (RSC) | Database / Storage | Same Prisma batch as Phase 5 `page.tsx`; no N+1 `getBalanceAsOf` |
| Event-date union + window filter | API / Backend (pure lib) | — | Deterministic; unit-testable; no React |
| Per-date LOCF → NW / account points | API / Backend (pure lib) | — | Reuse `computeNetWorthRows`; CHART-03 lives here |
| BigInt → chart Y values | Frontend Server (SSR) or pure lib at boundary | Browser / Client | Never pass BigInt across RSC→client; major `number` or string |
| Shared range preset (D-08) | Browser / Client | — | No existing `searchParams` usage; `useState` in dashboard shell is smallest fit |
| NW + account chart rendering | Browser / Client | — | Recharts requires `"use client"` |
| Expand row + native/primary toggle | Browser / Client | — | Mirror `AccountList` expand pattern |
| Hero «Капитал» (today NW) | Frontend Server (SSR) | — | Unchanged Phase 5 math |
| Mutations / history CRUD | — | — | Explicitly out of scope on `/` (D-04 / Phase 5 D-16) |

## Project Constraints (from .cursor/rules/)

None — `.cursor/rules/` absent this session. Follow Phase 1–5 stack locks (Next 16.3.4, Prisma 7.10.0, Vitest 4.1.11, INTEGER money + rate×10⁸). User rule: prefer **codegraph** for project search (used; graphify disabled in config). RESEARCH.md is normal prose.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | **16.3.4** (pinned) | RSC `page.tsx` host; client islands | Phase 1 lock `[VERIFIED: package.json]` |
| react / react-dom | **19.2.8** | Client charts + expand | Phase 1 pin; Recharts 3 peers include `^19.0.0` `[VERIFIED: npm view recharts@3.10.1 peerDependencies]` |
| recharts | **3.10.1** (install) | Line / stacked Area | Official peer of shadcn Chart; stacked `stackId`; `connectNulls` default false `[CITED: ui.shadcn.com/docs/components/chart]` `[CITED: recharts.github.io/en-US/api/Area/]` `[VERIFIED: npm view recharts version → 3.10.1]` |
| shadcn Chart (`src/components/ui/chart.tsx`) | via `npx shadcn@latest add chart` | `ChartContainer`, tooltip, theme tokens | Matches base-nova; project already has `--chart-1`…`--chart-5` `[VERIFIED: src/app/globals.css:70-74]` |
| vitest | **4.1.11** | Series + CHART-03 tests | Existing harness `[VERIFIED: package.json]` `[VERIFIED: vitest.config.ts:1-14]` |
| prisma / better-sqlite3 | **7.10.0** / **13.0.3** | Read-only batch LOCF | No new models |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@/lib/net-worth` | in-repo | `computeNetWorthRows` per as-of date | Every NW chart point |
| `@/lib/balances` | in-repo | `creditDebtMinor`, `calendarDateToday` | Credit stack + today endpoint |
| `@/lib/fx` | in-repo | `convertOtherMinorToPrimaryMinor` | Primary-mode account points |
| `@/lib/money` | in-repo | `formatMinorToMajor` | Tooltips / axis labels |
| `@/lib/dates` | in-repo | `formatAsOfDisplay` | X-axis / tooltip DD.MM.YYYY |
| lucide-react | existing | Expand chevron (mirror accounts) | Row expand chrome |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| shadcn Chart + Recharts 3 | chart.js + react-chartjs-2 | Works; no shadcn theming; more glue for stacked area |
| shadcn Chart + Recharts 3 | @visx/xychart | More flexible; more code; no project pattern |
| shadcn Chart + Recharts 3 | lightweight-charts | Trading UX; overkill for sparse LOCF events |
| Client `useState` shared range | `?range=` searchParams | Shareable URL; app has **zero** searchParams usage today — extra RSC wiring |
| Client `useState` shared range | cookie | Persist across visits; unnecessary for MVP |

**Installation:**

```bash
npx shadcn@latest add chart
# pulls recharts; pin after install:
npm view recharts version   # expect 3.x (3.10.1 as of research day)
```

**Version verification:** `recharts@3.10.1` on npm (published 2026-07-25 per legitimacy signals). Do **not** install Recharts 2 — shadcn Chart docs state the component now targets Recharts v3 (`var(--chart-1)` not `hsl(var(--chart-1))`). `[CITED: ui.shadcn.com/docs/components/chart]`

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| recharts | npm | since 2015-08-07 | ~57M/wk | github.com/recharts/recharts | OK | Approved |
| (shadcn chart.tsx) | copy-paste UI | — | — | ui.shadcn.com | N/A | Approved via official docs |

**Packages removed due to [SLOP] verdict:** none  
**Packages flagged as suspicious [SUS]:** none  

*Legitimacy seam: `gsd_run query package-legitimacy check --ecosystem npm recharts` → `verdict: OK`, `postinstall: null`.*  
*`npm view recharts scripts.postinstall` → empty.*

## Architecture Patterns

### System Architecture Diagram

```text
Browser (/)
  │  Hero «Капитал» (today NW — Phase 5)
  │  Shared range presets: 30д | 90д | 1г | всё  (client state, default 30d)
  │  NW LineChart (primary major)
  │  Account list → expand → Account chart (+ native|primary toggle)
  ▼
RSC page.tsx
  │  today = calendarDateToday("Europe/Moscow")
  │  Promise.all: accounts, primary, snapshots≤today, rates≤today
  │  Build today hero via computeNetWorthRows (unchanged)
  │  Pass serializable snapshot/rate/account payloads + prebuilt series OR raw rows to client
  ▼
src/lib/historical-series.ts (pure)
  │  windowStart(preset, today) → filter event dates
  │  NW events = ∪ account snapshot dates ∪ FX dates for non-primary currencies in play ∪ {today}
  │  Account events = that account’s snapshot dates ∪ (FX dates for its currency if primary mode) ∪ {today}
  │  For each date D: LOCF maps ≤ D → NetWorthAccountInput[] → computeNetWorthRows / credit stack
  │  Skip primary-mode point when FX null (D-16); always emit partial NW without badge (D-14)
  ▼
Client chart components (recharts + ChartContainer)
  │  data: { asOfDate, value?, debt?, available? }[]  // Number majors, no BigInt
  │  0 points → axes only (D-13)
  │  1 point → dots on, no connecting segment (D-15)
  │  credit → two Area stackId="credit"
  ▼
prisma (SQLite) — read only
  ├── Account (+ Currency)
  ├── BalanceSnapshot
  └── FxRate
```

### Recommended Project Structure

```
src/
├── app/page.tsx                          # EXTEND: hero → chart shell → list
├── components/dashboard/
│   ├── DashboardAccountList.tsx          # → client expand + chart slot (or split)
│   ├── DashboardRangeControl.tsx         # NEW client: 30д/90д/1г/всё
│   ├── NetWorthHistoryChart.tsx          # NEW client LineChart
│   ├── AccountHistoryChart.tsx           # NEW client Line/stacked Area + toggle
│   └── DashboardChartsShell.tsx          # NEW client: shared range context
├── components/ui/chart.tsx               # NEW via shadcn add chart
├── lib/
│   ├── historical-series.ts              # NEW pure builders
│   ├── historical-series.test.ts         # NEW CHART-01–03 / D-07–16
│   ├── net-worth.ts                      # REUSE computeNetWorthRows
│   ├── dates.ts                          # EXTEND: addCalendarDays / windowStart
│   ├── balances.ts / fx.ts / money.ts    # REUSE
```

### Pattern 1: Per-date LOCF maps (batch, not N queries)

**What:** Load all snapshots/rates `asOfDate <= today` once; for each sample date D, take first-wins descending among rows with `asOfDate <= D` (same algorithm as Phase 5 maps, parameterized by D).

**When to use:** Building every chart point server-side or in pure helpers fed by RSC-fetched arrays.

**Example:**

```typescript
// Source: src/app/page.tsx:47-71 (today LOCF maps) — generalize to asOfDate parameter
function locfAmountAt(
  snapsDesc: { accountId: number; asOfDate: string; amountMinor: bigint }[],
  accountId: number,
  asOfDate: string,
): bigint | null {
  for (const s of snapsDesc) {
    if (s.accountId === accountId && s.asOfDate <= asOfDate) return s.amountMinor;
  }
  return null;
}
```

### Pattern 2: Event ∪ today sampling (D-07)

**What:** Sort unique ISO dates; include `today` even if no row; filter `date >= windowStart && date <= today` (windowStart = null for `all`).

**Recommended event unions (discretion → locked for planner):**

| Series | Event dates |
|--------|-------------|
| NW (primary) | All `BalanceSnapshot.asOfDate` for any account ∪ all `FxRate.asOfDate` for currencies used by non-primary accounts ∪ `{today}` |
| Account native | That account’s snapshot dates ∪ `{today}` |
| Account primary | That account’s snapshot dates ∪ FX dates for `account.currencyCode` (if non-primary) ∪ `{today}` |

### Pattern 3: Shared range = client state (discretion)

**What:** `DashboardChartsShell` holds `useState<RangePreset>("30d")` and passes to NW chart + list. No URL sync — app has no `searchParams` consumers today `[VERIFIED: Grep src/app — no matches]`.

### Pattern 4: shadcn Chart + Recharts client island

**What:** `"use client"`; `ChartContainer` with `min-h-[200px]` / `h-[200px]`; compose `LineChart` / `AreaChart`.

**Example:**

```tsx
// Source: https://ui.shadcn.com/docs/components/chart
"use client"

import { CartesianGrid, Line, LineChart, XAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const chartConfig = {
  nw: { label: "Капитал", color: "var(--chart-1)" },
} satisfies ChartConfig

export function NetWorthHistoryChart({ data }: { data: { asOfDate: string; nw: number }[] }) {
  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
      <LineChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="asOfDate" tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          dataKey="nw"
          stroke="var(--color-nw)"
          dot={data.length <= 1}
          type="linear"
          connectNulls={false}
        />
      </LineChart>
    </ChartContainer>
  )
}
```

### Anti-Patterns to Avoid

- **Daily densification:** Violates D-07; explodes points and changes CHART-03 semantics.
- **Using today’s FX for all points:** Violates CHART-03 / FX-02; always LOCF ≤ D per point.
- **Passing BigInt to client charts:** RSC boundary breaks; serialize majors as `number`/`string`.
- **Hand-rolled SVG charts:** Use Recharts.
- **Partial-day badges on NW:** Forbidden by D-14 (dashboard banner for *today* partial remains Phase 5 — do not mark chart points).
- **Mutations / history list in expand:** Forbidden by D-04.
- **`connectNulls={true}` on primary account series:** Would invent FX across gaps; keep default `false` so D-16 skips create visible breaks.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SVG line/area charts | Custom paths, scales, hit-testing | Recharts + shadcn Chart | Responsive, a11y layer, stackId |
| Tooltip / theme tokens | Ad-hoc divs | `ChartTooltipContent` + `--chart-*` | Already in globals.css |
| LOCF / NW contribution rules | Duplicate exclude/credit math in UI | `computeNetWorthRows` | Drift vs Phase 5 hero |
| Credit debt | `limit - available` inline | `creditDebtMinor` | Clamping/tests already exist |
| Date display | Ad-hoc split | `formatAsOfDisplay` | DD.MM.YYYY contract |

**Key insight:** Chart honesty is a **pure function of dated LOCF inputs**. UI library choice is secondary; wrong sampling or today’s rate on past points fails CHART-03 regardless of Recharts polish.

## Common Pitfalls

### Pitfall 1: Single point invisible (D-15)
**What goes wrong:** Line/Area with one datum shows blank plot (default `dot={false}` on Area).  
**Why it happens:** Recharts only draws segments between ≥2 points; Area `dot` defaults to `false` `[CITED: recharts.github.io/en-US/api/Area/]`.  
**How to avoid:** Set `dot={data.length === 1}` (or always `true` for sparse series); never rely on stroke alone for n=1.  
**Warning signs:** Tooltip works on hover but no mark; GitHub issues #5218 / #4206.

### Pitfall 2: Empty data collapses axes (D-13)
**What goes wrong:** `data={[]}` yields a blank box without readable axes.  
**Why it happens:** Auto domain has no extents.  
**How to avoid:** Always render `XAxis`/`YAxis`; for empty series set an explicit domain (e.g. Y `[0, 1]`, X ticks = `[windowStart, today]` labels) so axes remain.  
**Warning signs:** Empty state looks like a missing component, not “axes with zero points”.

### Pitfall 3: ChartContainer height zero
**What goes wrong:** Chart never paints.  
**Why it happens:** `ResponsiveContainer` needs measured height; shadcn docs require `min-h-*` / `h-*` / `aspect-*` on `ChartContainer` `[CITED: ui.shadcn.com/docs/components/chart]`.  
**How to avoid:** `className="h-[200px] w-full"` (or UI-SPEC height).  
**Warning signs:** Empty SVG; known Next 15/React 19 issues when height missing (historical; Recharts 3 peers React 19).

### Pitfall 4: Primary-currency accounts excluded via fake FX requirement
**What goes wrong:** Primary debit accounts vanish from historical NW.  
**Why it happens:** Treating missing FxRate as exclude for primary currency.  
**How to avoid:** Identity conversion when `isPrimaryCurrency` (Phase 5 STATE decision; `net-worth.ts` `toPrimaryMinor`).  
**Warning signs:** Hero today ≠ last chart point when only RUB accounts exist.

### Pitfall 5: Credit primary mode stacks debt only
**What goes wrong:** Violates D-11/D-12.  
**Why it happens:** Copying Phase 5 dashboard primary column (debt-only for NW contribution).  
**How to avoid:** Chart series ≠ NW contribution: plot **available + debt** both converted in primary mode; NW chart still uses signed contribution only.  
**Warning signs:** Stack height equals debt, available missing.

### Pitfall 6: Window filter drops “today” or includes future events
**What goes wrong:** Series ends before hero, or uses future snapshots (should not exist if actions enforce).  
**How to avoid:** Always union `{today}`; filter `<= today`; use Moscow calendar for today and for subtracting 30/90/365 days via pure YYYY-MM-DD helpers (extend `dates.ts`).

### Pitfall 7: Number precision on chart Y
**What goes wrong:** High-scale crypto majors lose IEEE precision.  
**Why it happens:** Recharts Y is JS `number`.  
**How to avoid:** Accept for MVP display; compute majors via `Number(formatMinorToMajor(minor, scale))` at boundary; keep authoritative BigInt in tests. Flag crypto scale &gt; 8 as display-only risk `[ASSUMED]` acceptable for v1.

## Code Examples

### CHART-03 regression (must ship in Wave 0 / with series lib)

```typescript
// Source: pattern from src/lib/net-worth.test.ts + CHART-03 success criterion
it("past NW point ignores a later FX change", () => {
  // Account USD, snap 2026-01-01 amount 100_00 (scale 2)
  // FX 2026-01-01 rate 50e8; FX 2026-02-01 rate 60e8
  // Point at 2026-01-15 must use rate 50, not 60
  const points = buildNetWorthSeries({ /* fixtures */ preset: "all", today: "2026-02-15" });
  const jan = points.find((p) => p.asOfDate === "2026-01-15");
  expect(jan?.totalPrimaryMinor).toBe(/* 100 * 50 at scale */);
});
```

### Credit stacked areas

```tsx
// Source: https://recharts.github.io/en-US/api/Area/ (stackId)
<AreaChart data={data}>
  <Area dataKey="debt" stackId="credit" fill="var(--color-debt)" dot={data.length === 1} connectNulls={false} />
  <Area dataKey="available" stackId="credit" fill="var(--color-available)" dot={data.length === 1} connectNulls={false} />
</AreaChart>
```

### Expand affordance (reuse accounts pattern)

```tsx
// Source: src/components/accounts/AccountList.tsx:153-214 (expand state + aria-expanded)
const [expanded, setExpanded] = useState(false);
// expand body = <AccountHistoryChart /> only — no history list / delete
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| shadcn Chart + Recharts 2 | shadcn Chart + Recharts 3 | shadcn Chart update | Use `var(--chart-1)` tokens; no `hsl(var(--chart-1))` |
| react-is override for Recharts + React 19 | Recharts 3 peers `react@^19` | Recharts 3.x | Prefer 3.10.1; still verify paint after install |
| Daily OHLC densification | Event ∪ today sparse series | Phase 6 D-07 | Fewer points; LOCF-true steps |

**Deprecated/outdated:**
- Forcing `react-is` overrides as the *primary* fix — still useful if paint fails, but Recharts 3.10.1 declares React 19 peers `[VERIFIED: npm view recharts@3.10.1 peerDependencies]`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | High-scale crypto chart Y via JS `number` is acceptable for MVP | Pitfall 7 | Misleading axis for scale &gt; ~8; need string ticks later |
| A2 | Russian preset labels `30д / 90д / 1г / всё` and toggle `В валюте счёта` / `В {primary}` are OK | Discretion | UI-SPEC may rename |
| A3 | Linear interpolation between sparse events is OK (vs `stepAfter`) | Code Examples | Visual LOCF plateau preference differs — switch `type` only |
| A4 | `1y` = 365 calendar days from today (not trailing year-to-date) | Pattern 2 | Off-by-one day count vs user expectation |

## Open Questions

1. **UI-SPEC for chart chrome**
   - What we know: `workflow.ui_phase: true`; Phase 5 had `05-UI-SPEC.md`.
   - What's unclear: Exact heights, Russian strings, credit stack colors — owned by `/gsd-ui-phase` after research/plan.
   - Recommendation: Planner defer visual tokens to UI-SPEC; lock series math in PLAN now.

2. **Precompute all series in RSC vs compute in client from raw rows**
   - What we know: Snapshots/rates arrays are small for personal wallet.
   - What's unclear: Whether expanding many accounts should precompute every account series on the server.
   - Recommendation: RSC builds NW series for active preset **or** passes raw arrays + pure builders imported into client (builders are isomorphic if no Prisma). Prefer **RSC precompute NW for default 30d** + pass raw snapshots for client recompute on preset change to avoid four round-trips — or pass all event dates and recompute purely on client from JSON-serialized minors (strings). Smallest: serialize `amountMinor`/`rateToPrimaryScaled` as **strings**, recompute in client with BigInt when preset changes.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | build/test | ✓ | v24.5.0 | — |
| npm | install recharts | ✓ | 10.9.3 | — |
| vitest (via npm test) | series tests | ✓ | 4.1.11 | — |
| Docker | PLAT-01 runtime | ✓ | present | not required for unit tests |
| SQLite data/wallet.db | manual UAT | ✓ | present | — |
| ctx7 CLI / Context7 MCP | docs lookup | ✗ | — | WebFetch official docs (used) |
| graphify | codegraph alt | disabled | — | `codegraph` CLI used |

**Missing dependencies with no fallback:** none for planning/execution of series + charts.

**Missing dependencies with fallback:** Context7 → official shadcn/Recharts URLs.

Step 2.6: external deps = npm package install + existing Node/vitest — audited above.

## Validation Architecture

> `workflow.nyquist_validation` is true (absent key would also enable; config has `true`).

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest **4.1.11** |
| Config file | `vitest.config.ts` (`include: ["src/**/*.test.ts"]`, `environment: "node"`) |
| Quick run command | `npm test -- src/lib/historical-series.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CHART-01 | NW series points = as-of LOCF total primary | unit | `npm test -- src/lib/historical-series.test.ts` | ❌ Wave 0 |
| CHART-02 | Account native/primary/credit stack series | unit | same | ❌ Wave 0 |
| CHART-03 | Later FX does not rewrite earlier point | unit | same | ❌ Wave 0 |
| D-07 | Events ∪ today; not daily | unit | same | ❌ Wave 0 |
| D-13/D-15/D-16 | empty / single / skip-null-FX | unit (+ manual chart paint) | unit automated; paint manual | ❌ Wave 0 |
| UI paint | Recharts mounts with height | manual / smoke | human-verify end-of-phase | — |

### Sampling Rate

- **Per task commit:** `npm test -- src/lib/historical-series.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/lib/historical-series.ts` — builders
- [ ] `src/lib/historical-series.test.ts` — CHART-01–03, D-07, D-14–16
- [ ] `src/lib/dates.ts` — `addCalendarDays` / `windowStartForPreset` helpers + tests
- [ ] Framework install: `npx shadcn@latest add chart` (pulls recharts) — Wave 0 or first UI plan
- [ ] No component test runner for Recharts — accept manual UAT for D-13/D-15 paint

## Security Domain

> `security_enforcement: true`, ASVS level 1.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Single-local-user app; no auth in v1 |
| V3 Session Management | no | — |
| V4 Access Control | no | No multi-user |
| V5 Input Validation | yes (light) | Range preset = enum union in UI; no new Server Actions; chart data is server-derived |
| V6 Cryptography | no | No new crypto; money math unchanged |

### Known Threat Patterns for Next.js + SQLite wallet charts

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via account names in tooltips | Tampering | React text escaping; no `dangerouslySetInnerHTML` |
| Prototype pollution via chart config | Tampering | Static `chartConfig`; no `JSON.parse` of user chart config |
| Client BigInt / precision spoof | Information | Series built from trusted DB rows; client only filters preset |
| Dependency supply chain (recharts) | Tampering | Legitimacy OK; pin version; no postinstall scripts |

Charts are read-only; no new mutation surface. Do not add chart-related Server Actions.

## Sources

### Primary (HIGH / verified in-repo)

- `src/lib/net-worth.ts:58-70` — `computeNetWorthRows` return shape (`rows`, `totalPrimaryMinor`, `isPartial`)
- `src/lib/net-worth.ts:40-56` — primary identity vs FX null
- `src/lib/balances.ts:7-12` — LOCF null-before-first
- `src/lib/fx.ts:8-14` — `getRateAsOf` null-before-first
- `src/app/page.tsx:17-94` — batch LOCF today pattern to generalize
- `src/components/dashboard/DashboardAccountList.tsx` — expand host
- `src/app/globals.css:70-74` — `--chart-1`…`--chart-5` present
- `package.json` — no chart lib yet; vitest/next pins
- `npm view recharts@3.10.1 peerDependencies` — React 19 supported
- `gsd_run query package-legitimacy check recharts` — OK

### Secondary (MEDIUM)

- [shadcn Chart docs](https://ui.shadcn.com/docs/components/chart) — Recharts v3, `use client`, `ChartContainer` height, `stack` via Recharts composition
- [Recharts Area API](https://recharts.github.io/en-US/api/Area/) — `stackId`, `connectNulls` default false, `dot` default false
- [Recharts Line API / connectNulls example](https://recharts.github.io/en-US/api/Line/) — null gap behavior

### Tertiary (LOW)

- GitHub issues on single-point rendering (#5218, #4206, #4697) — confirm `dot` workaround
- Historical Next 15 + Recharts 2 hydration / react-is threads — mitigated by Recharts 3 peers; still smoke-test paint

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — shadcn official + npm legitimacy + peer React 19
- Architecture / series math: **HIGH** — grounded in Phase 3–5 code and CONTEXT locks
- Chart UX pitfalls (empty/single): **MEDIUM** — docs + issues; needs human paint check

**Research date:** 2026-09-04  
**Valid until:** ~2026-10-04 (recharts/shadcn move moderately fast)

### MVP thinnest end-to-end path

1. **Wave 0:** `historical-series` + date window helpers + failing→passing Vitest (CHART-03 first).
2. **Tracer UI:** `shadcn add chart` + NW chart on `/` with hard-coded 30d series from RSC (shared range control stub).
3. **Complete:** shared range presets; convert/extend account list expand → per-account chart + native/primary + credit stack.
