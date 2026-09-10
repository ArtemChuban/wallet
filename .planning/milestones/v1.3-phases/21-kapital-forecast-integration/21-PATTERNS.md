# Phase 21: Капитал forecast integration - Pattern Map

**Mapped:** 2026-09-09
**Files analyzed:** 8
**Analogs found:** 8 / 8

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/nw-forecast.ts` | utility | transform | `src/lib/nw-forecast.ts` (extend in place) | exact |
| `src/lib/nw-forecast.test.ts` | test | transform | `src/lib/nw-forecast.test.ts` | exact |
| `src/lib/credit-grace.ts` | utility | transform | `src/lib/credit-grace.ts` + shell income membership | role-match |
| `src/lib/credit-grace.test.ts` | test | transform | `src/lib/credit-grace.test.ts` (GRISO scan) | exact |
| `src/app/page.tsx` | route | request-response | `src/app/page.tsx` + `src/app/accounts/page.tsx` | exact / role-match |
| `src/components/dashboard/DashboardChartsShell.tsx` | component | transform | `src/components/dashboard/DashboardChartsShell.tsx` | exact |
| `src/components/dashboard/NetWorthHistoryChart.tsx` | component | request-response | `src/components/dashboard/NetWorthHistoryChart.tsx` | exact |
| `src/components/dashboard/nw-forecast-ui.test.ts` | test | file-I/O | `src/components/dashboard/nw-forecast-ui.test.ts` | exact |

## Pattern Assignments

### `src/lib/nw-forecast.ts` (utility, transform)

**Analog:** `src/lib/nw-forecast.ts` (Phase 17 SoT — extend, do not fork)

**Imports pattern** (lines 1-15):
```typescript
/**
 * Pure NW forecast overlay (Phase 17).
 * Import wall (D-18): money / locf / dates only — never NW history or DB clients.
 */
import {
  type RangePreset,
  addCalendarDays,
} from "@/lib/dates";
import { locfRateAsOf, type RateRow } from "@/lib/locf";
import {
  convertOtherMinorToPrimaryMinor,
  minorToMajorNumber,
} from "@/lib/money";
```

**Core type + result shape** (lines 17-37) — extend with `kind`, optional grace metadata, `excludedMissingFxCurrencies`:
```typescript
export type ForecastSlot = {
  parentId: number;
  plannedAsOf: string;
  plannedAmountMinor: bigint;
  currencyCode: string;
  currencyScale: number;
  isPrimaryCurrency: boolean;
};

export type BuildNetWorthForecastSeriesResult = {
  points: ForecastPoint[];
  isPartialForecast: boolean;
  includedSlotCount: number;
  excludedMissingFxCount: number;
};
```

**FX gate + membership filter** (lines 81-103) — **must become kind-aware** (grace allows `plannedAsOf >= today` after fold; income stays `>`):
```typescript
for (const slot of slots) {
  if (!(slot.plannedAsOf > today) || slot.plannedAsOf > horizonEnd) {
    continue;
  }

  let primaryMinor: bigint;
  if (slot.isPrimaryCurrency) {
    primaryMinor = slot.plannedAmountMinor;
  } else {
    const rate = locfRateAsOf(rates, slot.currencyCode, today);
    if (rate === null) {
      excludedMissingFxCount += 1;
      continue;
    }
    primaryMinor = convertOtherMinorToPrimaryMinor(
      slot.plannedAmountMinor,
      rate,
      slot.currencyScale,
      primaryScale,
    );
  }
  converted.push({ plannedAsOf: slot.plannedAsOf, primaryMinor });
}
```

**Sparse sample + cumulative** (lines 125-155) — keep `dateSet.add` for every included slot date even when grace addend is `0n` (D-06/D-07):
```typescript
dateSet.add(today);
dateSet.add(horizonEnd);
for (const c of converted) {
  dateSet.add(c.plannedAsOf);
}
// …
running += add; // grace: add 0n after FX gate; still sample date
```

**A′ discretion pick:** after FX success for `kind === "grace"`, push `{ plannedAsOf, primaryMinor: 0n }` (not signed −grace). Collect unique missing currency codes on FX miss.

**Import wall:** still `dates` / `locf` / `money` only — never `credit-grace`, `net-worth`, `historical-series`, Prisma.

---

### `src/lib/nw-forecast.test.ts` (test, transform)

**Analog:** `src/lib/nw-forecast.test.ts`

**Imports + slot factories** (lines 1-38):
```typescript
import { describe, expect, it } from "vitest";
import { RATE_SCALE_E8 } from "@/lib/money";
import {
  buildNetWorthForecastSeries,
  forecastHorizonEnd,
  type ForecastSlot,
} from "./nw-forecast";

function primarySlot(
  parentId: number,
  plannedAsOf: string,
  amountMinor: bigint,
): ForecastSlot {
  return {
    parentId,
    plannedAsOf,
    plannedAmountMinor: amountMinor,
    currencyCode: "RUB",
    currencyScale: 2,
    isPrimaryCurrency: true,
  };
}
```

**FX exclude + partial banner counters** (lines 196-217) — extend assertions for `excludedMissingFxCurrencies` unique codes:
```typescript
expect(result.excludedMissingFxCount).toBe(1);
expect(result.isPartialForecast).toBe(true);
expect(result.includedSlotCount).toBe(1);
```

**Regression keep:** stair-step income tests (lines 59-98); empty points when all FX miss (lines 245-259). **Add:** grace 0-delta same-day with income; overdue fold sample on today; grace-only flat non-empty points; CLOSED never passed in (membership unit may live in credit-grace tests).

---

### `src/lib/credit-grace.ts` (utility, transform) — optional membership helper

**Analog:** `src/lib/credit-grace.ts` (`isGraceOverdue` + OPEN filter) combined with shell income open-slot assembly

**Imports / isolation header** (lines 1-7):
```typescript
/**
 * Credit grace schedule domain (Phase 19+).
 * Pure TypeScript — no Prisma, no net-worth / historical-series imports (CYCLE-01 isolation).
 */
import { clampDayOfMonth } from "@/lib/dates";
```

**Overdue compare** (lines 163-170) — use for D-01…D-03 fold:
```typescript
export function isGraceOverdue(dueAsOf: string, today: string): boolean {
  return dueAsOf < today;
}
```

**OPEN-only filter pattern** (lines 226-238):
```typescript
for (const o of obligations) {
  if (o.status !== "OPEN") continue;
  openRows.push({
    kind: "open",
    obligation: { /* id, dueAsOf, amountMinor, … */ },
  });
}
```

**Membership rules to encode** (no existing helper — mirror shell’s income boundary style):
- OPEN only (C-07)
- `dueAsOf < today` → sampleAsOf = today (fold)
- `dueAsOf === today` → today bucket
- `today < dueAsOf <= horizonEnd` → future sample
- beyond horizon → exclude

If helper maps to `ForecastSlot`, keep grace metadata (`accountId`, `accountName`, `dueAsOf` original) and set `kind: "grace"`. Prefer **not** importing `nw-forecast` into `credit-grace` if that creates a cycle — either return a lean membership DTO or assemble slots in the shell.

---

### `src/lib/credit-grace.test.ts` (test, transform)

**Analog:** `src/lib/credit-grace.test.ts` GRISO file-scan

**Isolation scan** (lines 203-210) — keep green; Phase 21 must not add grace imports to banned files:
```typescript
describe("GRISO isolation smoke (T-19-03)", () => {
  it("net-worth and historical-series do not import credit-grace", () => {
    const root = join(process.cwd(), "src/lib");
    for (const file of ["net-worth.ts", "historical-series.ts"]) {
      const src = readFileSync(join(root, file), "utf8");
      expect(src).not.toMatch(/credit-grace/);
    }
  });
});
```

**Add:** unit cases for fold/membership helper if extracted here (overdue→today, future window, CLOSED out).

---

### `src/app/page.tsx` (route, request-response)

**Primary analog:** `src/app/page.tsx` income Promise.all + serialize to shell props  
**Secondary analog:** `src/app/accounts/page.tsx` grace include + BigInt stringify

**Dashboard load pattern** (lines 14-84) — add OPEN obligations to `Promise.all` (lean query preferred):
```typescript
const [
  accounts,
  primaryCurrency,
  snapshotsLteToday,
  ratesLteToday,
  recurringIncomes,
  oneTimeIncomes,
  recurringActuals,
  oneTimeActuals,
] = await Promise.all([
  prisma.account.findMany({
    include: { currency: true },
    orderBy: { name: "asc" },
  }),
  // … income finds …
]);
```

**Grace nested include analog** (`src/app/accounts/page.tsx` lines 14-20):
```typescript
prisma.account.findMany({
  include: {
    currency: true,
    creditGraceObligations: {
      orderBy: { cycleStartAsOf: "desc" },
    },
  },
  orderBy: { name: "asc" },
}),
```

**OPEN filter analog** (`src/app/accounts/actions.ts` lines 253-255):
```typescript
where: { accountId, status: "OPEN" },
```

**Serialize + pass props** (lines 252-280) — mirror `forecastIncome` → add `forecastGrace` (or nest OPEN rows with account currency/name):
```typescript
forecastIncome={{
  recurring: recurringIncomes.map((r) => ({
    id: r.id,
    plannedAmountMinor: r.plannedAmountMinor.toString(),
    // …
  })),
  // …
}}
```

**Do not:** import grace into `computeNetWorthRows` / historical series path on this page.

---

### `src/components/dashboard/DashboardChartsShell.tsx` (component, transform)

**Analog:** same file — income slot assembly + merge + banner

**Imports** (lines 1-28):
```typescript
import { addCalendarDays, windowStartForPreset, type RangePreset } from "@/lib/dates";
import {
  listAllInRange,
  occurrenceKeyString,
} from "@/lib/income";
import {
  buildNetWorthForecastSeries,
  forecastHorizonEnd,
  type ForecastSlot,
} from "@/lib/nw-forecast";
```

**Props payload pattern** (lines 52-92) — add parallel `ForecastGracePayload` (OPEN rows + account currency fields), string minors for RSC boundary.

**Income open-slot membership at boundary** (lines 204-314) — keep income `from = today+1` / `plannedAsOf > today`; **concat** grace slots (kind grace, sample after fold) before `buildNetWorthForecastSeries`:
```typescript
const from = addCalendarDays(today, 1);
// … listAllInRange → openSlots (income only) …
const built = buildNetWorthForecastSeries({
  anchorPrimaryMinor: anchorMinor,
  slots: openSlots,
  rates: seriesRates,
  primaryScale,
  today,
  horizonEnd,
});
```

**showForecast / partial banner** (lines 326-368) — keep `showForecast = includedSlotCount > 0` (counts FX-included grace with 0 addend). Banner: join unique codes:
```typescript
{showPartialBanner ? (
  <p className="rounded-lg border border-border bg-muted/60 p-4 text-sm" role="status">
    <span className="font-semibold text-foreground">Прогноз неполный</span>
    <span className="text-muted-foreground"> · нет курса</span>
    {/* extend: ` ${codes.join(", ")}` — no «доходы»/«грейс» tags */}
  </p>
) : null}
```

**mergeFactAndForecast** (lines 122-154) — extend point write path to attach `forecastEvents` (or equivalent) from builder metadata so tooltip can read today + future grace rows.

---

### `src/components/dashboard/NetWorthHistoryChart.tsx` (component, request-response)

**Analog:** same file — hinge tooltip split + dashed Line

**Point type** (lines 40-45) — extend index signature / optional `forecastEvents` array:
```typescript
export type NetWorthChartPoint = {
  asOfDate: string;
  nw: number;
  [stackKey: string]: string | number;
};
```

**Tooltip payload read** (lines 67-75) — keep; then branch for grace blocks:
```typescript
const point = payload[0]?.payload as NetWorthChartPoint | undefined;
```

**Future vs today branches** (lines 80-154):
- Future (`asOfDate > today`): keep aggregate «Прогноз» amount block **first** (D-10); append grace rows below (D-11/D-12 copy).
- Today / fact: keep account stack + «Итого»; append grace rows for folded overdue / due-today (D-09).

**Locked RU copy** (from Phase 18 D-19 / CONTEXT C-04):
- «Платёж для беспроцентного»
- «NW без изменения (оплата карты)»

**Paint unchanged** (lines 253-264) — one dashed «Прогноз» Line only (C-02 / D-08):
```typescript
<Line
  dataKey={FORECAST_KEY}
  type="stepAfter"
  stroke="var(--muted-foreground)"
  strokeDasharray="5 5"
  // …
  name="Прогноз"
/>
```

---

### `src/components/dashboard/nw-forecast-ui.test.ts` (test, file-I/O)

**Analog:** same file — readFileSync chrome scans

**Structure** (lines 1-48):
```typescript
const chartSrc = readFileSync(
  "src/components/dashboard/NetWorthHistoryChart.tsx",
  "utf8",
);
const shellSrc = readFileSync(
  "src/components/dashboard/DashboardChartsShell.tsx",
  "utf8",
);

it("partial banner Прогноз неполный · нет курса with role=status (D-15)", () => {
  expect(shellSrc).toMatch(/Прогноз неполный/);
  expect(shellSrc).toMatch(/нет курса/);
  expect(shellSrc).toMatch(/role=["']status["']/);
});
```

**Extend:** assert banner joins codes (e.g. `.join(", ")` or template with currency list); assert tooltip RU strings present in chart src; assert no banner kind tags `доходы`/`грейс`.

## Shared Patterns

### Import wall (forecast purity + GRISO)
**Source:** `src/lib/nw-forecast.ts` header; `src/lib/credit-grace.test.ts` GRISO scan  
**Apply to:** `nw-forecast.ts`, page data path, shell (shell may import both income + grace helpers; **never** `net-worth` / `historical-series` ← grace)
```typescript
// nw-forecast: dates / locf / money only
// net-worth.ts + historical-series.ts: must not match /credit-grace/
```

### FX LOCF honesty
**Source:** `src/lib/nw-forecast.ts` lines 87-100  
**Apply to:** income + grace slots in builder
```typescript
const rate = locfRateAsOf(rates, slot.currencyCode, today);
if (rate === null) {
  excludedMissingFxCount += 1; // also record currencyCode once
  continue;
}
```

### Open membership at UI/lib boundary
**Source:** `DashboardChartsShell.tsx` lines 272-305 (income); `credit-grace.ts` OPEN filter + `isGraceOverdue`  
**Apply to:** grace slot assembly before builder — income rules unchanged; grace folds overdue to today

### RSC → client string serialization
**Source:** `src/app/page.tsx` forecastIncome maps; `src/app/accounts/page.tsx` obligation `amountMinor.toString()`  
**Apply to:** new grace payload props (`amountMinor` string → `BigInt` in shell)

### Quiet Russian banner near chart
**Source:** `DashboardChartsShell.tsx` lines 359-368  
**Apply to:** D-14…D-18 — one `role="status"` banner; codes only; still show when series hidden

### Recharts tooltip via payload
**Source:** `NetWorthHistoryChart.tsx` lines 57-102  
**Apply to:** grace event metadata on datum; no second series

### File-scan Vitest chrome
**Source:** `nw-forecast-ui.test.ts` + `credit-grace.test.ts` isolation  
**Apply to:** banner codes + tooltip RU + keep GRISO scan green

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| — | — | — | All Phase 21 files extend existing Phase 17/19/20 analogs. New: kind-aware 0-addend + FX code list + tooltip event metadata (documented in RESEARCH Pattern 1–4). |

## Metadata

**Analog search scope:** `src/lib/nw-forecast*`, `src/lib/credit-grace*`, `src/components/dashboard/*`, `src/app/page.tsx`, `src/app/accounts/page.tsx`, `src/app/accounts/actions.ts`; codegraph query on `buildNetWorthForecastSeries` / `ForecastSlot`
**Files scanned:** ~12 tracked sources (git ls-files gate passed for all named analogs)
**Pattern extraction date:** 2026-09-09
**Tracked-source gate:** all analogs verified via `git ls-files` (no `.gsd` mirrors)
