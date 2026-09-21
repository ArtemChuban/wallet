# Phase 29: Капитал overlay + SAVISO - Pattern Map

**Mapped:** 2026-09-21
**Files analyzed:** 7
**Analogs found:** 7 / 7

D-11 override: `forecastDeltaMinor` grace arm returns `-displayPrimaryMinor`, not `0n`. Tooltip `displayPrimaryMajor` stays the unsigned payment. Interest slots join the existing `DashboardChartsShell` forecast `useMemo` via `listInterestSlotsInRange`. Do not edit MCP tool descriptions or `loadForecastOverlay` membership (Phase 30). Shared-builder blast radius is noted below.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/nw-forecast.ts` | utility | transform | `src/lib/nw-forecast.ts` (`forecastDeltaMinor`) | exact |
| `src/lib/nw-forecast.test.ts` | test | transform | `src/lib/nw-forecast.test.ts` (five flat-grace expects) | exact |
| `src/app/page.tsx` | route | request-response | `src/app/page.tsx` `forecastGrace` string-minor prop | exact |
| `src/components/dashboard/DashboardChartsShell.tsx` | component | transform | same file grace slot map + `[...openSlots, ...graceSlots]` | exact |
| `src/components/dashboard/NetWorthHistoryChart.tsx` | component | request-response | `ForecastGraceTooltipBlock` in the same file | exact |
| `src/components/dashboard/nw-forecast-ui.test.ts` | test | file-I/O | same file plan-03 tooltip file-scan | exact |
| `src/lib/saviso.test.ts` | test | file-I/O | `src/lib/griso.test.ts` + golden in `src/lib/iniso.test.ts` | role-match |

## Pattern Assignments

### `src/lib/nw-forecast.ts` (utility, transform)

**Analog:** `src/lib/nw-forecast.ts` (edit in place). Do not import `savings-interest` (lock in `src/lib/nw-forecast.test.ts`).

**Imports pattern** (lines 8-16) — leave this set; no savings import:

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
```

**Core pattern** (lines 81-96) — D-11, change only the grace arm:

```typescript
function forecastDeltaMinor(
  kind: ForecastSlotKind,
  displayPrimaryMinor: bigint,
): bigint {
  switch (kind) {
    case "income":
    case "interest":
      return displayPrimaryMinor;
    case "grace":
      return 0n;
```

Replace grace `return 0n` with `return -displayPrimaryMinor`.

Event magnitude stays on the **pre-sign** minor (lines 173-184). Do not negate `displayPrimaryMajor`:

```typescript
    const primaryMinor = forecastDeltaMinor(slot.kind, displayPrimaryMinor);
    converted.push({
      plannedAsOf: slot.plannedAsOf,
      primaryMinor,
      event: {
        kind: slot.kind,
        parentId: slot.parentId,
        plannedAmountMinor: slot.plannedAmountMinor,
        displayPrimaryMajor: minorToMajorNumber(
          displayPrimaryMinor,
          primaryScale,
        ),
```

Events attach only to that sample date (lines 226-248). Later days keep the running level and do not repeat the event. Do not sort events by amount or name here (tooltip owns D-02).

**Comments to rewrite in the same edit** (they still say A′ / ΔNW=0):

- File header lines 1-4: grace is `A′ NW-neutral … (ΔNW=0 after FX gate)`.
- `ForecastEvent.displayPrimaryMajor` line 40: `even when ΔNW=0 (D-11)`.
- Converted comment line 142: `0n for grace (A′ / C-01)`.

`ForecastSlotKind` stays `"income" | "grace" | "interest"` (line 18). FX drop (lines 155-163) already records `currencyCode` for any non-primary slot, including interest. Do not add a kind tag.

**Error handling:** exhaustive `never` throws in `forecastDeltaMinor` / `slotInWindow` (lines 91-94, 112-115). Keep them.

---

### `src/lib/nw-forecast.test.ts` (test, transform)

**Analog:** same file. `today` in that file is `"2026-03-01"`. Rewrite expects in the same change as the grace arm. Rename titles that say `ΔNW=0`, `income only`, or `interest only`. Keep sampling grace dates. `plannedAmountMinor` stays the positive payment.

| Test title (verbatim) | After D-11 |
|-----------------------|------------|
| `future OPEN grace sampled with ΔNW=0 (A′ / C-01 / D-06 / GRFCST-01)` | today `1_000_000n`; `2026-03-15` and `2026-03-31` become `950_000n`. Event `plannedAmountMinor` stays `50_000n`. |
| `overdue OPEN fold → today sampleAsOf (D-01 / D-02 / D-03)` | today sample `450_000n` (was `500_000n` with grace `50_000n`). Later samples stay at the dipped running total. |
| `grace-only horizon → non-empty flat points (D-07)` | today `800_000n`; `2026-03-20` and `2026-03-31` become `790_000n`. Series stays non-empty. |
| `same-day income+grace: NW moves by income only (C-03 / D-06)` | day becomes `1_050_000n` (anchor `1_000_000n` + income `100_000n` − grace `50_000n`). Both kinds stay on `forecastEvents`. |
| `same-day interest+grace: NW moves by interest only (D-03 / D-12)` | day becomes `1_000_000n` (`1_000_000 + 50_000 − 50_000`). |

Keep the import-wall test (lines 609-611 of the research lock): `nw-forecast.ts` must not match `/savings-interest/`.

Tighten the existing non-primary interest FX unit so `excludedMissingFxCurrencies` is `["USD"]`. Add a mixed income+interest case whose sorted codes are unique. Do not assert `forecast === nw` on today when grace events exist (`mergeFactAndForecast` copies `forecast` onto the fact point and leaves fact `nw` as the historical total).

---

### `src/app/page.tsx` (route, request-response)

**Analog:** the existing `forecastGrace` prop on the same `<DashboardChartsShell>` (lines 301-313). New sibling prop `forecastSavings`. Do not pre-expand slots here — horizon is the client range preset.

**Imports** (lines 1-10) — already has `firstHitLocfMap` and `prisma`. No new package. Do not import `savings-interest` on the server page if the shell expands slots (client horizon). Passing account inputs is enough.

**LOCF already built** (lines 106-109):

```typescript
    const locfByAccount = firstHitLocfMap(
      snapshotsLteToday,
      (snap) => snap.accountId,
    );
```

`prisma.account.findMany({ include: { currency: true } })` (lines 30-33) already returns `annualRateBps` and `accrualDayOfMonth`. `balanceSnapshot.findMany` (lines 38-46) stays a read.

**Serialization pattern to copy** (lines 301-313) — minors cross the RSC boundary as strings:

```tsx
            forecastGrace={{
              obligations: openGraceObligations.map((o) => ({
                id: o.id,
                dueAsOf: o.dueAsOf,
                amountMinor: o.amountMinor.toString(),
                status: o.status,
                accountId: o.accountId,
                accountName: o.account.name,
                currencyCode: o.account.currency.code,
                currencyScale: o.account.currency.scale,
                isPrimaryCurrency: o.account.currency.isPrimary,
              })),
            }}
```

Map SAVINGS rows onto `InterestAccountInput` (`src/lib/savings-interest.ts`). Filter `type === "SAVINGS"` and non-null `annualRateBps` and `accrualDayOfMonth`. The RSC object uses string `balanceMinor`. Keys: `accountId`, `accountName`, `balanceMinor: (locf?.amountMinor ?? 0n).toString()`, `annualRateBps`, `accrualDayOfMonth`, `currencyCode`, `currencyScale` from `currency.scale`, `isPrimaryCurrency` from `currency.isPrimary`. Missing LOCF is the string `0` — `listInterestSlotsInRange` emits nothing when `balanceMinor <= 0n`. Do not pass overlay income/grace slots into the interest enumerator. Do not call `balanceSnapshot.create/update/upsert/delete`.

`ChartAccountPayload` (shell lines 32-40) has no rate or DOM. Keep historical `accounts=` as it is. Add a dedicated `forecastSavings` prop; do not overload `reviveAccounts`.

---

### `src/components/dashboard/DashboardChartsShell.tsx` (component, transform)

**Analog:** grace membership inside the forecast `useMemo` (lines 340-375).

**Imports** (lines 1-30) — add `listInterestSlotsInRange` from `@/lib/savings-interest`. Keep `buildNetWorthForecastSeries` / `forecastHorizonEnd` / `ForecastSlot` from `@/lib/nw-forecast`. Keep `openGraceForecastMembership` from `@/lib/credit-grace`.

**Payload pattern to copy** — `ForecastGracePayload` (lines 85-97) and props (lines 99-110):

```tsx
export type ForecastGracePayload = {
  obligations: {
    id: number;
    dueAsOf: string;
    amountMinor: string;
    status: "OPEN" | "CLOSED";
    accountId: number;
    accountName: string;
    currencyCode: string;
    currencyScale: number;
    isPrimaryCurrency: boolean;
  }[];
};

type DashboardChartsShellProps = {
  accounts: ChartAccountPayload[];
  snapshots: ChartSnapshotPayload[];
  rates: ChartRatePayload[];
  primaryScale: number;
  today: string;
  listAccounts: DashboardAccountRow[];
  primaryCode: string;
  anchorPrimaryMinor: string;
  forecastIncome: ForecastIncomePayload;
  forecastGrace: ForecastGracePayload;
};
```

Add `forecastSavings` beside `forecastGrace`. The object passed to `listInterestSlotsInRange` uses `InterestAccountInput` keys: `accountId`, `accountName`, `balanceMinor: BigInt(row.balanceMinor)`, `annualRateBps`, `accrualDayOfMonth`, `currencyCode`, `currencyScale`, `isPrimaryCurrency`. Revive `balanceMinor` with `BigInt(...)`, same as `BigInt(o.amountMinor)` on grace (line 345). Do not use `Number` / `parseFloat`.

**Core slot concat** (lines 340-375) — map enumerator output to `ForecastSlot`, then spread beside income and grace:

```tsx
    const graceSlots: ForecastSlot[] = openGraceForecastMembership(
      forecastGrace.obligations.map((o) => ({
        id: o.id,
        dueAsOf: o.dueAsOf,
        amountMinor: BigInt(o.amountMinor),
        status: o.status,
        accountId: o.accountId,
        accountName: o.accountName,
        currencyCode: o.currencyCode,
        currencyScale: o.currencyScale,
        isPrimaryCurrency: o.isPrimaryCurrency,
      })),
      today,
      horizonEnd,
    ).map((m) => ({
      kind: "grace" as const,
      parentId: m.obligationId,
      plannedAsOf: m.sampleAsOf,
      plannedAmountMinor: m.amountMinor,
      currencyCode: m.currencyCode,
      currencyScale: m.currencyScale,
      isPrimaryCurrency: m.isPrimaryCurrency,
      accountId: m.accountId,
      accountName: m.accountName,
      dueAsOf: m.dueAsOf,
    }));

    const built = buildNetWorthForecastSeries({
      anchorPrimaryMinor: anchorMinor,
      slots: [...openSlots, ...graceSlots],
      rates: seriesRates,
      primaryScale,
      today,
      horizonEnd,
    });
```

Interest map (call inside this memo, after `horizonEnd = forecastHorizonEnd(range, today)`):

```typescript
const interestSlots: ForecastSlot[] = listInterestSlotsInRange(
  forecastSavings.accounts.map((row) => ({
    accountId: row.accountId,
    accountName: row.accountName,
    balanceMinor: BigInt(row.balanceMinor),
    annualRateBps: row.annualRateBps,
    accrualDayOfMonth: row.accrualDayOfMonth,
    currencyCode: row.currencyCode,
    currencyScale: row.currencyScale,
    isPrimaryCurrency: row.isPrimaryCurrency,
  })),
  today,
  horizonEnd,
).map((s) => ({
  kind: "interest" as const,
  parentId: s.parentId,
  plannedAsOf: s.plannedAsOf,
  plannedAmountMinor: s.interestMinor,
  currencyCode: s.currencyCode,
  currencyScale: s.currencyScale,
  isPrimaryCurrency: s.isPrimaryCurrency,
  accountId: s.accountId,
  ...(s.accountName !== undefined ? { accountName: s.accountName } : {}),
}));
```

`slots: [...openSlots, ...interestSlots, ...graceSlots]`. Add `forecastSavings` to the `useMemo` deps (lines 378-386).

`InterestAccountInput` / `InterestForecastSlot` live in `src/lib/savings-interest.ts` lines 18-49. Do not reimplement `monthlyInterestMinor` or the accrual loop. Do not edit `src/lib/savings-interest.ts`.

**Banner** (lines 423-436) — leave the string. Interest FX misses already land in `excludedMissingFxCurrencies`. No kind word.

```tsx
            <span className="font-semibold text-foreground">
              Прогноз неполный
            </span>
            <span className="text-muted-foreground">
              {" · нет курса"}
              {missingFxCodes.length > 0
                ? ` ${missingFxCodes.join(", ")}`
                : ""}
            </span>
```

**Fact vs dashed hinge** (lines 159-177) — do not copy the dipped forecast into fact `nw`:

```tsx
    if (existing) {
      existing.forecast = fp.forecast;
      if (events) {
        existing.forecastEvents = events;
      }
    } else if (fp.asOfDate >= today) {
      byDate.set(fp.asOfDate, {
        asOfDate: fp.asOfDate,
        nw: fp.asOfDate === today ? fp.forecast : Number.NaN,
        forecast: fp.forecast,
```

The `nw: fp.forecast` arm runs only when today is **absent** from fact points. When fact exists, only `forecast` is overwritten. Do not special-case grace-on-today back to `0n`.

---

### `src/components/dashboard/NetWorthHistoryChart.tsx` (component, request-response)

**Analog:** `ForecastGraceTooltipBlock` (lines 63-88). New `ForecastInterestTooltipBlock` copies that DOM. One dashed `Line` stays (lines 290-301).

**Imports** (lines 14-24) — `formatChartNumber` from `@/lib/money`, `ForecastEvent` from `@/lib/nw-forecast`. No new imports required if the block stays in this file.

**Grace block to mirror** (lines 63-88):

```tsx
function ForecastGraceTooltipBlock({ events }: { events: ForecastEvent[] }) {
  const graceRows = events.filter((e) => e.kind === "grace");
  if (graceRows.length === 0) return null;

  return (
    <div className="mt-1 grid gap-1 border-t border-border/50 pt-1">
      <span className="text-muted-foreground">Платёж для беспроцентного</span>
      <span className="text-muted-foreground">
        NW без изменения (оплата карты)
      </span>
      {graceRows.map((ev) => (
        <div
          key={`${ev.parentId}-${ev.dueAsOf ?? ""}-${ev.accountId ?? ""}`}
          className="flex w-full items-start gap-2"
        >
          <span className="min-w-0 flex-1 break-words text-muted-foreground">
            {ev.accountName ?? `обязательство ${ev.parentId}`}
          </span>
          <span className="shrink-0 font-mono font-semibold text-foreground tabular-nums">
            {formatChartNumber(ev.displayPrimaryMajor)}
          </span>
        </div>
      ))}
    </div>
  );
}
```

Edits on this block:

- Header stays `Платёж для беспроцентного`.
- Subtitle becomes `Ожидаемый платёж`. Drop `NW без изменения (оплата карты)`. One subtitle string covers the today branch (line 189) and the future branch (line 135).
- Amount: `` `-${formatChartNumber(ev.displayPrimaryMajor)}` `` on the positive major. Name fallback stays `` `обязательство ${ev.parentId}` ``.

Interest block (future branch only):

- Header `Накопительный` once. Subtitle `Ожидаемое начисление` once. Do not repeat the subtitle per row. Do not render balance-after-credit, a horizon sum, a month delta, or the word `капитализация`.
- Rows: `events.filter((e) => e.kind === "interest")`. Sort copy: `displayPrimaryMajor` descending, then `accountName.localeCompare(other, "ru", { sensitivity: "base" })`. Stable for equal amount and equal base name.
- Name fallback: `` `счёт ${ev.accountId}` ``.
- Amount: `` `+${formatChartNumber(ev.displayPrimaryMajor)}` ``. Plus and minus are `text-foreground` prefixes, not a second color.
- Account-type label already equals the header (`src/lib/account-type.ts` lines 26-28: `if (t === "SAVINGS") return "Накопительный"`). Hardcode the tooltip string; do not import the label helper unless a test wants the shared constant.

**Future tooltip order** (lines 114-136) — insert the interest block between the level and grace:

```tsx
  if (asOfDate > today) {
    const forecastVal =
      typeof point?.[FORECAST_KEY] === "number" &&
      !Number.isNaN(point[FORECAST_KEY])
        ? (point[FORECAST_KEY] as number)
        : null;
    if (forecastVal == null) return null;
    return (
      <div className="grid min-w-40 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
        <div className="font-medium">{labelText}</div>
        <div className="flex w-full items-center gap-2">
          <div
            className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
            style={{ backgroundColor: "var(--muted-foreground)" }}
          />
          <span className="flex-1 text-muted-foreground">Прогноз</span>
          <span className="font-mono font-medium text-foreground tabular-nums">
            {formatChartNumber(forecastVal)}
          </span>
        </div>
        <ForecastGraceTooltipBlock events={forecastEvents} />
      </div>
    );
  }
```

Level stays `formatChartNumber(forecastVal)` with no extra plus. Negatives already carry `-` inside `formatChartNumber` (`src/lib/money.ts` lines 100-111). Do not mount the interest block on the `asOfDate <= today` return (lines 155-190). Interest membership is `plannedAsOf > today`.

**Typography note:** the card wrapper is `text-xs` (line 123). UI-SPEC locks Label 14px via `text-sm` and forbids `text-xs` on this tooltip. When editing the card, change `text-xs` to `text-sm` on both the future and today tooltip roots so grace and interest inherit one size. Amounts stay `font-mono font-semibold tabular-nums`. Do not add a second dashed `Line` or a legend split.

---

### `src/components/dashboard/nw-forecast-ui.test.ts` (test, file-I/O)

**Analog:** plan-03 describe (lines 67-85) and banner scan (lines 52-59).

```typescript
  it("tooltip includes «NW без изменения (оплата карты)»", () => {
    expect(chartSrc).toMatch(/NW без изменения \(оплата карты\)/);
  });
```

Replace that expect. Keep `Платёж для беспроцентного` (lines 69-71). Add expects for `Ожидаемый платёж`, `Накопительный`, `Ожидаемое начисление`. Assert the retired subtitle is absent. Assert `shellSrc` matches `listInterestSlotsInRange` and `kind: "interest"` (or `"interest"`). A source expect for `` `+${formatChartNumber `` and a minus prefix next to `formatChartNumber` on the grace row is enough — Vitest env is `node`, no React renderer. Banner scan must still reject `доходы|грейс` and must not gain `накопительный`. Keep the single `strokeDasharray="5 5"` Line expect (lines 77-83).

---

### `src/lib/saviso.test.ts` (test, file-I/O)

**Analog:** `src/lib/griso.test.ts` import wall + `src/lib/iniso.test.ts` snapshot golden (lines 123-146) + never-call regex from `src/lib/mcp/tools/forecast.test.ts` lines 173-176.

**Imports / describe shape** (`src/lib/griso.test.ts` lines 1-19):

```typescript
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RATE_SCALE_E8 } from "@/lib/money";
import {
  buildNetWorthSeries,
  type BuildNetWorthSeriesInput,
  type SeriesAccount,
  type SeriesRate,
  type SeriesSnapshot,
} from "./historical-series";

/** GRISO-01: grace/forecast must not couple into historical NW math (C-01, D-05–D-11). */
describe("GRISO-01 isolation", () => {
  for (const file of ["src/lib/net-worth.ts", "src/lib/historical-series.ts"]) {
    it(`${file} does not import credit-grace or nw-forecast (D-05)`, () => {
      const src = readFileSync(file, "utf8");
      expect(src).not.toMatch(/@\/lib\/credit-grace|from ["']\.\/credit-grace["']/);
      expect(src).not.toMatch(/@\/lib\/nw-forecast|from ["']\.\/nw-forecast["']/);
    });
  }
```

SAVISO additions:

- `net-worth.ts` and `historical-series.ts` must not match `@/lib/savings-interest` or `@/lib/nw-forecast`.
- Never-call regex on `src/lib/savings-interest.ts`, `src/lib/nw-forecast.ts`, `src/components/dashboard/DashboardChartsShell.tsx`, `src/app/page.tsx`:

```typescript
      expect(src).not.toMatch(/balanceSnapshot\.(create|update|upsert|delete)/);
```

**Golden** (`src/lib/iniso.test.ts` lines 123-146) — same shape, `type: "SAVINGS"` (legal on `SeriesAccount` via `NetWorthAccountType`). Expect snapshot minors, not snapshot + interest:

```typescript
    expect(points.map((p) => p.totalPrimaryMinor)).toEqual([100_000n, 100_000n]);
```

Void an unused `{ interestMinor, annualRateBps }` fixture the way GRISO voids `_gracePresentConceptually` (lines 92-105). `BuildNetWorthSeriesInput` keys stay `accounts`, `snapshots`, `rates`, `primaryScale`, `preset`, `today`. Type-level `Extract` wall should also forbid `"interest"`.

---

## Shared Patterns

### Grace line sign (D-11)

**Source:** `src/lib/nw-forecast.ts` `forecastDeltaMinor` lines 81-96
**Apply to:** the builder only. Shell and `loadForecastOverlay` both call it, so MCP `points[].forecastPrimaryMinor` on grace days drops without a loader edit.
**Do not apply to:** `displayPrimaryMajor`, tooltip copy inside the builder, or historical `buildNetWorthSeries`.

### RSC string minors

**Source:** `src/app/page.tsx` lines 301-313 and shell `BigInt(o.amountMinor)` line 345
**Apply to:** `forecastSavings.balanceMinor` and any new shell payload field.

### Tooltip block

**Source:** `ForecastGraceTooltipBlock` lines 63-88
**Apply to:** interest block DOM (`mt-1 grid gap-1 border-t border-border/50 pt-1`, muted header, muted subtitle, `flex` row, `min-w-0 flex-1 break-words` name, `shrink-0 font-mono font-semibold tabular-nums` amount).
**Prefix policy** (`src/lib/money.ts` `formatChartNumber` lines 100-111):

```typescript
`+${formatChartNumber(ev.displayPrimaryMajor)}` // interest row
`-${formatChartNumber(ev.displayPrimaryMajor)}` // grace row, major stays >= 0
formatChartNumber(forecastVal)                   // Прогноз level
```

### FX banner

**Source:** `DashboardChartsShell.tsx` lines 423-436
**Apply to:** interest and grace exclusions. One banner. Codes from `excludedMissingFxCurrencies`, already sorted in the builder (line 195). No kind tag.

### Isolation

**Source:** `src/lib/griso.test.ts` lines 14-18 and `src/lib/mcp/tools/forecast.test.ts` lines 173-176
**Apply to:** `src/lib/saviso.test.ts`. Forecast builders do not write snapshots. `buildNetWorthSeries` has no interest argument.

## Do Not Modify (Phase 30 blast radius)

Shared builder change moves numbers. Copy and interest membership stay Phase 30. A Phase 29 diff must not touch these files:

| File | Why it moves anyway | Leave alone |
|------|---------------------|-------------|
| `src/lib/mcp/reads/load-forecast-overlay.ts` | `buildNetWorthForecastSeries` at lines 322-329 with `slots: [...openSlots, ...graceSlots]`. Grace days return the new lower `forecastPrimaryMinor`. Kind union already includes `"interest"` (lines 31-32) but the loader never pushes interest slots. | Do not add `listInterestSlotsInRange`. Do not "correct" membership to hide the dip. |
| `src/lib/mcp/tools/forecast.ts` | `GET_FORECAST_OVERLAY_DESCRIPTION` lines 11-15 still says `income + A′ grace`. | Do not edit the description. |
| `src/lib/mcp/create-handler.ts` | Server instructions lines 31-32 still say `income + A′ grace`. | Same deferral. Description-class copy, not this phase. |
| `src/lib/mcp/tools/forecast.test.ts` | Asserts `INISO-01` / `GRISO-01` / `do not fold` on the description (lines 182-184) and the never-call regex. Research: event kinds and `plannedAmountMinor` strings, not flat `forecastPrimaryMinor`. | Should stay green. Do not retitle the description to match D-11. |

`src/lib/savings-interest.ts` is a caller dependency, not a Phase 29 edit. `listInterestSlotsInRange` (lines 45-49) is the membership function.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| — | — | — | Every planned file has an in-repo analog. |

## Metadata

**Analog search scope:** `src/lib/nw-forecast.ts`, `src/lib/savings-interest.ts`, `src/components/dashboard/`, `src/app/page.tsx`, `src/lib/iniso.test.ts`, `src/lib/griso.test.ts`, `src/lib/mcp/reads/load-forecast-overlay.ts`, `src/lib/mcp/tools/forecast.ts`, `src/lib/money.ts`, `src/lib/account-type.ts`
**Files scanned:** 7 planned + MCP blast-radius readers
**Tracked-source gate:** `git ls-files` printed every analog path above
**Pattern extraction date:** 2026-09-21
