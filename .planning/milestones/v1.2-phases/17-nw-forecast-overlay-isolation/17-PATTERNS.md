# Phase 17: NW forecast overlay + isolation - Pattern Map

**Mapped:** 2026-09-07
**Files analyzed:** 12
**Analogs found:** 11 / 12

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/nw-forecast.ts` | utility | transform | `src/lib/historical-series.ts` (+ FX exclude from `income.ts` `computePersonIncomeStats`) | exact |
| `src/lib/nw-forecast.test.ts` | test | transform | `src/lib/historical-series.test.ts` | exact |
| `src/lib/iniso.test.ts` | test | request-response (file-scan) | `src/lib/disol.test.ts` (+ light ISO in `income.test.ts`) | exact |
| `src/components/dashboard/DashboardChartsShell.tsx` | component | transform | self (`DashboardChartsShell.tsx`) | exact |
| `src/components/dashboard/NetWorthHistoryChart.tsx` | component | request-response | self + `DebtPrincipalStackChart.tsx` (`stepAfter`) | role-match |
| `src/app/page.tsx` | route | CRUD (RSC read) | self + `src/app/income/page.tsx` (income load) | exact |
| Partial forecast banner (in shell or near chart) | component | request-response | `page.tsx` hero partial + `IncomeList.tsx` compact | role-match |
| `src/app/income/actions.test.ts` | test | file-I/O (scan) | self (BalanceSnapshot gate) | exact |
| Optional `src/components/dashboard/*forecast*.test.ts` | test | file-scan | `src/components/income/income-ui.test.ts` | role-match |
| `.planning/REQUIREMENTS.md` | config | — | (docs sync; no runtime analog) | none |
| `.planning/ROADMAP.md` | config | — | (docs sync) | none |
| `.planning/STATE.md` | config | — | (docs sync) | none |

**Unchanged (import walls — do not edit math; INISO asserts):**
- `src/lib/net-worth.ts` — stay income/forecast-free
- `src/lib/historical-series.ts` — stay income/forecast-free
- `src/lib/income.ts` — reuse `listAllInRange` / `occurrenceKeyString`; no `nw-forecast` import

## Pattern Assignments

### `src/lib/nw-forecast.ts` (utility, transform)

**Analog:** `src/lib/historical-series.ts` (sparse series + majors)  
**Secondary:** `src/lib/income.ts` `computePersonIncomeStats` (FX exclude + `isPartial`)  
**Horizon mirror:** `src/lib/dates.ts` `windowStartForPreset`

**Imports pattern** (historical-series lines 1-14 — copy shape; **omit** `computeNetWorthRows` / net-worth):
```typescript
import {
  type RangePreset,
  addCalendarDays,
} from "@/lib/dates";
import { locfRateAsOf, type RateRow } from "@/lib/locf";
import {
  convertOtherMinorToPrimaryMinor,
  minorToMajorNumber,
} from "@/lib/money";
// NEVER: @/lib/net-worth, @/lib/historical-series, prisma, BalanceSnapshot
```

**Horizon helper** — mirror lookback magnitudes from `windowStartForPreset` (dates.ts lines 72-89), forward:
```typescript
// Analog: windowStartForPreset switch + addCalendarDays
export function forecastHorizonEnd(preset: RangePreset, today: string): string {
  switch (preset) {
    case "30d":
      return addCalendarDays(today, 30);
    case "90d":
      return addCalendarDays(today, 90);
    case "1y":
    case "all":
      return addCalendarDays(today, 365);
    default: {
      const _exhaustive: never = preset;
      throw new Error(`unknown preset: ${_exhaustive}`);
    }
  }
}
```

**Sparse sample + sort core** (historical-series lines 88-101 — adapt to pay dates ∪ today ∪ horizonEnd; filter `d >= today && d <= horizonEnd` for forward, keep today hinge):
```typescript
  const dateSet = new Set<string>();
  // ... add event dates ...
  dateSet.add(today);

  const sampleDates = [...dateSet]
    .filter((d) => d <= today && (windowStart === null || d >= windowStart))
    .sort();
```

**FX exclude + partial counts** (income.ts lines 401-418 — use `asOfDate = today` for all future slots per D-13):
```typescript
    if (fact.isPrimaryCurrency) {
      acc.primaryTotalMinor += fact.amountMinor;
      continue;
    }

    const rate = locfRateAsOf(rates, fact.currencyCode, fact.actualAsOf);
    if (rate === null) {
      acc.isPartial = true;
      acc.excludedFactCount += 1;
      continue;
    }

    acc.primaryTotalMinor += convertOtherMinorToPrimaryMinor(
      fact.amountMinor,
      rate,
      fact.currencyScale,
      primaryScale,
    );
```

**Major at chart boundary** (historical-series lines 128-133):
```typescript
    return {
      asOfDate,
      totalPrimaryMinor,
      nw: minorToMajorNumber(totalPrimaryMinor, primaryScale),
      stacks,
    };
```
Forecast points use `forecastPrimaryMinor` + `forecast: number` (same `minorToMajorNumber`).

**Membership filter at call site** (not inside builder) — reuse `nextOpenPlannedAsOf` filled-set pattern (income.ts lines 239-257) + `listAllInRange` (311-334):
```typescript
  const filled = new Set(
    actuals
      .filter((a) => a.recurringIncomeId === def.id)
      .map((a) =>
        occurrenceKeyString({
          parentId: a.recurringIncomeId,
          plannedAsOf: a.plannedAsOf,
        }),
      ),
  );
```
Open filter: `plannedAsOf > today`; one-time `actual == null`; recurring `!filled.has(key)`. Enrich currency from def maps (occurrence types lack `currencyCode`).

---

### `src/lib/nw-forecast.test.ts` (test, transform)

**Analog:** `src/lib/historical-series.test.ts`

**Imports / fixtures** (lines 1-19):
```typescript
import { describe, expect, it } from "vitest";
import { RATE_SCALE_E8 } from "@/lib/money";
import {
  buildNetWorthForecastSeries,
  forecastHorizonEnd,
} from "./nw-forecast";

const primaryDebit = (id: number) => ({ /* ... */ });
```

**Assert BigInt totals + chart majors** (lines 57-70 style):
```typescript
    const points = buildNetWorthSeries({ /* ... */ });
    const mid = points.find((p) => p.asOfDate === "2026-01-15");
    expect(mid?.totalPrimaryMinor).toBe(500_000n);
```

Cover: membership (recurring+one-time, today out, filled out), cumulative stair-step, `forecastHorizonEnd` 30/90/1y/all→365, FX@today exclude + `isPartialForecast`, empty points when all excluded / no slots.

---

### `src/lib/iniso.test.ts` (test, file-scan)

**Analog:** `src/lib/disol.test.ts`  
**Secondary:** `src/lib/income.test.ts` ISO-01 light (630-646)  
**Actions gate keep:** `src/app/income/actions.test.ts` (658-664)

**File-scan loop** (disol.test.ts lines 1-15):
```typescript
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("DISOL-01 isolation", () => {
  for (const file of [
    "src/lib/net-worth.ts",
    "src/lib/historical-series.ts",
    "src/app/page.tsx",
  ]) {
    it(`${file} does not import debts domain module`, () => {
      const src = readFileSync(file, "utf8");
      expect(src).not.toMatch(/@\/lib\/debts|from ["']\.\/debts["']/);
    });
  }
```

**INISO adaptation** — net-worth + historical-series must not match income **or** nw-forecast; expand income light (income.test.ts 641-645):
```typescript
  for (const file of ["src/lib/net-worth.ts", "src/lib/historical-series.ts"]) {
    it(`${file} does not import income domain module`, () => {
      const src = readFileSync(file, "utf8");
      expect(src).not.toMatch(/@\/lib\/income|from ["']\.\/income["']/);
    });
  }
```

**Past-series identity:** call `buildNetWorthSeries` with fixed fixtures; assert totals unchanged (API has no income param — golden + surface check). Optional: assert `nw-forecast.ts` has no `prisma` / `BalanceSnapshot`.

**Actions gate** (keep/expand actions.test.ts 658-663):
```typescript
describe("income actions isolation (UI-01)", () => {
  it("actions.ts never references BalanceSnapshot or net-worth/historical-series imports", () => {
    const src = readFileSync("src/app/income/actions.ts", "utf8");
    expect(src).not.toMatch(/BalanceSnapshot/);
    expect(src).not.toMatch(/@\/lib\/(?:net-worth|historical-series)/);
```

---

### `src/components/dashboard/DashboardChartsShell.tsx` (component, transform)

**Analog:** self — extend existing `useMemo` + BigInt revive + range state

**Range + series memo** (lines 87-118) — add parallel `useMemo` keyed by `range` for forecast:
```typescript
  const [range, setRange] = useState<RangePreset>("30d");
  // ...
  const points = useMemo(
    () =>
      buildNetWorthSeries({
        accounts: seriesAccounts,
        snapshots: seriesSnapshots,
        rates: seriesRates,
        primaryScale,
        preset: range,
        today,
      }).map(({ asOfDate, nw, stacks }) => ({
        asOfDate,
        nw,
        ...stacks,
      })),
    [seriesAccounts, seriesSnapshots, seriesRates, primaryScale, range, today],
  );
```

**Pattern to copy:** string→BigInt revive helpers (50-76); pass `windowStart` + `today` to chart (120-135). New props: income payload (defs/actuals as strings), `anchorPrimaryMinor` (string), then revive + `forecastHorizonEnd` + open filter + `buildNetWorthForecastSeries` + merge fact/forecast rows. Partial banner when `isPartialForecast`.

Discretion (RESEARCH): page preloads max 1y income; shell recomputes overlay inside `useMemo` on `range` — same as historical.

---

### `src/components/dashboard/NetWorthHistoryChart.tsx` (component, request-response)

**Analog:** self (Area stacks + tooltip + legend)  
**Secondary:** `DebtPrincipalStackChart.tsx` for `type="stepAfter"`  
**No in-repo ComposedChart/ReferenceLine** — add from recharts; keep ChartContainer/shadcn chrome

**Imports** (lines 1-21) — swap `AreaChart` → `ComposedChart`; add `Line`, `ReferenceLine`:
```typescript
import {
  Area,
  AreaChart, // → ComposedChart
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
```

**Tooltip fact path** (51-106) — keep for `asOfDate <= today`; for `> today` show only «Прогноз» + amount (no stack rows / no «Итого» account total).

**Legend gate** (166-168) — today `accounts.length > 1`; extend to `accounts.length > 1 || showForecast` (D-10):
```typescript
        {!empty && accounts.length > 1 ? (
          <ChartLegend content={<ChartLegendContent />} />
        ) : null}
```

**Area stack layers** (169-184) — keep; wrap in `ComposedChart`; add dashed Line + ReferenceLine:
```typescript
        {stackKeys.map((key) => (
          <Area
            key={key}
            dataKey={key}
            type="linear"
            stackId="nw"
            // ...
            connectNulls={false}
          />
        ))}
```

**stepAfter from debts chart** (DebtPrincipalStackChart.tsx 148-156):
```typescript
        <Area
          dataKey="repaidMajor"
          type="stepAfter"
          stackId="principal"
          // ...
        />
```
Forecast Line: `type="stepAfter"`, `strokeDasharray="5 5"`, `stroke="var(--muted-foreground)"`, `name="Прогноз"`, `connectNulls={false}`, `dot={false}`.

---

### `src/app/page.tsx` (route, RSC read)

**Analog:** self (NW load + partial banner + shell props)  
**Income load analog:** `src/app/income/page.tsx` (34-72 recurring/oneTime + actuals)

**Existing Promise.all** (page.tsx 19-47) — extend with income defs/actuals (or second query):
```typescript
    const [accounts, primaryCurrency, snapshotsLteToday, ratesLteToday] =
      await Promise.all([
        prisma.account.findMany({ include: { currency: true }, orderBy: { name: "asc" } }),
        // ...
        prisma.fxRate.findMany({ where: { asOfDate: { lte: today } }, /* ... */ }),
      ]);
```

**Income page load shape** (income/page.tsx 34-61):
```typescript
        recurringIncomes: {
          orderBy: { id: "desc" },
          include: {
            currency: { select: { code: true, name: true, scale: true, isPrimary: true } },
            actuals: { select: { ...actualSelect, recurringIncomeId: true } },
          },
        },
        oneTimeIncomes: { /* same pattern */ },
```
Капитал can flatten defs (id, plannedAmountMinor, dayOfMonth/startAsOf or plannedAsOf, currency*) + actual slots; serialize BigInt→string for client shell. Pass `anchorPrimaryMinor: totalPrimaryMinor.toString()` from existing `computeNetWorthRows` (line 80).

**Partial honesty banner tone** (page.tsx 156-184) — reuse for forecast-near-chart or compact IncomeList style:
```typescript
        {hasAccounts && isPartial ? (
          <div
            className="rounded-lg border border-border bg-muted/60 p-4"
            role="status"
          >
            <p className="text-sm font-medium text-foreground">Итог неполный</p>
```

**Compact CPTY tone** (IncomeList.tsx 241-245) — preferred for forecast partial near chart:
```typescript
            {person.stats.isPartial ? (
              <p className="text-sm text-foreground" role="status">
                <span className="font-semibold">Итог неполный</span>
                <span className="text-muted-foreground"> · нет курса</span>
              </p>
            ) : null}
```
Discretion copy: «Прогноз неполный · нет курса».

**Error boundary** (page.tsx 220-229) — keep try/catch + RU error main.

---

### Optional chart file-scan test

**Analog:** `src/components/income/income-ui.test.ts` (readFileSync + string asserts)

```typescript
const chartSrc = readFileSync(
  "src/components/dashboard/NetWorthHistoryChart.tsx",
  "utf8",
);
expect(chartSrc).toMatch(/ComposedChart/);
expect(chartSrc).toMatch(/ReferenceLine/);
expect(chartSrc).toMatch(/strokeDasharray/);
expect(chartSrc).toMatch(/Прогноз/);
```

---

### Docs sync (REQUIREMENTS / ROADMAP / STATE)

**No runtime analog.** Planning-only: revise FCST-01 + Out of Scope + Key Decisions + ROADMAP success criteria + drop STATE «one-time excluded» blocker per CONTEXT D-01. Mirror tone of prior phase requirement edits; no code patterns.

## Shared Patterns

### Isolation walls (ISO-01 / INISO)
**Source:** `src/lib/disol.test.ts`, `src/lib/income.test.ts` 630-646, `src/app/income/actions.test.ts` 658-664  
**Apply to:** `iniso.test.ts`; never import income/nw-forecast into `net-worth.ts` / `historical-series.ts`; dashboard **may** import both.

### FX LOCF honesty
**Source:** `locfRateAsOf` (`src/lib/locf.ts` 72-84) + exclude branch in `computePersonIncomeStats`  
**Apply to:** `nw-forecast.ts` — always `asOf = today`; null → skip slot + bump excluded count; never invent 0/1 rates.

### Sparse calendar series
**Source:** `buildNetWorthSeries` dateSet ∪ today ∪ filter ∪ sort  
**Apply to:** forecast sample = pay dates ∪ today ∪ horizonEnd; X spans past+future via merged `data[]`.

### Client BigInt revive + range `useMemo`
**Source:** `DashboardChartsShell.tsx` revive* + `buildNetWorthSeries` memo  
**Apply to:** income payload revive + `buildNetWorthForecastSeries` on same `range` key.

### Partial honesty chrome
**Source:** `page.tsx` bordered `role="status"` / `IncomeList` compact «· нет курса»  
**Apply to:** forecast partial banner near NW chart; hide series when `includedSlotCount === 0` but keep banner if FX exclusions (D-16).

### Chart theming
**Source:** `NetWorthHistoryChart` + `@/components/ui/chart` ChartContainer/Legend/Tooltip  
**Apply to:** ComposedChart rewrite; forecast stroke quiet (`var(--muted-foreground)`); Russian «Прогноз».

### Zero new packages
**Source:** CONTEXT carried lock / RESEARCH  
**Apply to:** all files — recharts already pinned; Vitest already present.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `.planning/REQUIREMENTS.md` (FCST-01 sync) | config | — | Docs-only; no code analog — follow CONTEXT D-01 wording |
| (ComposedChart / ReferenceLine usage) | — | — | No in-repo usage; use official recharts APIs on top of existing AreaChart chrome |

## Metadata

**Analog search scope:** `src/lib/{historical-series,net-worth,income,dates,locf,disol*,money}`, `src/components/dashboard/*`, `src/components/debts/DebtPrincipalStackChart.tsx`, `src/components/income/{IncomeList,income-ui.test}`, `src/app/{page,income/page,income/actions.test}`, `.planning/{REQUIREMENTS,ROADMAP,STATE}.md`  
**Tools:** codegraph explore/query/node + git ls-files (tracked-source gate)  
**Files scanned:** ~25 tracked sources  
**Pattern extraction date:** 2026-09-07
