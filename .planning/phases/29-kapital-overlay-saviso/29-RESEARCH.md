# Phase 29: Капитал overlay + SAVISO - Research

**Researched:** 2026-09-21
**Domain:** Капитал dashed «Прогноз» overlay (interest slots + grace line sign) and SAVISO isolation
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
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

### Deferred Ideas (OUT OF SCOPE)
- MCP `list_accounts` / forecast interest events and PARITY-01 — Phase 30
- ASSET ↔ SAVINGS type conversion — Phase 31
- Chart legend separating income vs interest vs grace — already deferred in REQUIREMENTS.md
- Savings todo `.planning/todos/pending/2026-09-10-savings-account-type-with-interest-nw-forecast.md` stays pending until v1.5 ships
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INT-02 | On Капитал `/`, dashed «Прогноз» includes future SAVINGS interest credits as overlay slots (ΔNW = +interest; future accrual dates only) | Shell concatenates `listInterestSlotsInRange` into the existing `buildNetWorthForecastSeries` call. Kind `"interest"` already adds `displayPrimaryMinor`. Future-only gate is `plannedAsOf > today`. |
| INT-03 | Interest forecast slots use FX LOCF honesty (partial banner when primary conversion rate missing for non-primary SAVINGS) | Same builder FX gate + existing banner `excludedMissingFxCurrencies`. No second banner. No kind tag. |
| SAVISO-01 | Savings interest forecast never writes `BalanceSnapshot` or changes historical NW LOCF | Interest stays a forecast slot. `buildNetWorthSeries` input has no interest field. Page keeps `balanceSnapshot.findMany` read only. |
| SAVISO-02 | Regression suite asserts SAVISO isolation (never-calls on snapshot mutates + golden historical series identity without interest) | New `src/lib/saviso.test.ts` cloned from `iniso.test.ts` / `griso.test.ts`, with a SAVINGS account whose series total equals the snapshot minor. |
</phase_requirements>

## Summary

Phase 28 already emits future interest slots and `buildNetWorthForecastSeries` already adds them. Капитал does not. `DashboardChartsShell` still concatenates only income + grace. `page.tsx` already loads every account (including `annualRateBps` / `accrualDayOfMonth`) and today LOCF. This phase passes SAVINGS rows into the shell and lets the shell call `listInterestSlotsInRange(accounts, today, horizonEnd)` inside the existing forecast `useMemo`, because the horizon depends on the client range preset.

D-11 flips the grace **line** addend from `0n` to `-displayPrimaryMinor`. Tooltip magnitude stays the positive `displayPrimaryMajor`. The minus is a UI prefix. Historical `nw` / `BalanceSnapshot` stay snapshot LOCF. Five locked tests in `src/lib/nw-forecast.test.ts` and one copy lock in `src/components/dashboard/nw-forecast-ui.test.ts` still expect a flat grace line and «NW без изменения (оплата карты)». Those expects must change in this phase.

`loadForecastOverlay` calls the same builder and does not yet load interest. Do not add interest membership or edit `GET_FORECAST_OVERLAY_DESCRIPTION` here (C-05 / Phase 30). After the grace sign flip, MCP `points[].forecastPrimaryMinor` for grace days **will** drop. Schema already allows `kind: "interest"`. Copy and interest events wait for Phase 30.

**Primary recommendation:** Flip `forecastDeltaMinor` grace to `-displayPrimaryMinor`, map `listInterestSlotsInRange` into the shell slot array, mirror the grace tooltip block for «Накопительный», and add `saviso.test.ts`. Update the five grace-flat expects. Leave MCP files untouched.

## Project Constraints (from AGENTS.md)

`.cursor/rules/` is absent. From `AGENTS.md`:

- Next.js in this repo may differ from training. Read `node_modules/next/dist/docs/` before writing Next-specific code. This phase does not add a route or a Next API; it extends `src/app/page.tsx` props and a client shell.
- PARITY-01: a new user-visible read surface ships a matching read-only MCP tool in the same **milestone**. Phase 29 CONTEXT C-05 defers that tool to Phase 30 (`MCP-02`). Do not implement MCP here. Do not treat the deferral as permission to change `get_forecast_overlay` copy while the shared builder's numbers move.
- UAT is agent-driven (`npm run dev` + Orca). UI hint is yes. Plan a browser check of the future tooltip (interest row on accrual day only, grace minus, line dip) after the Vitest locks are green.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Interest membership over the selected horizon | Browser / Client (`DashboardChartsShell`) | — | Horizon is `forecastHorizonEnd(range, today)` inside client state. Page cannot pre-expand slots for every preset. |
| SAVINGS inputs (id, name, today LOCF minor, bps, DOM, currency) | Frontend Server (`src/app/page.tsx`) | Database | Prisma already returns `Account` + today snapshots. Serialize bigint as string across the RSC boundary, same as income/grace. |
| Grace and interest ΔNW, FX drop, sparse samples | API-free pure lib (`src/lib/nw-forecast.ts`) | — | One function owns the dashed series. Shell and MCP loader both call it. |
| Tooltip blocks, plus/minus prefix, row sort | Browser / Client (`NetWorthHistoryChart.tsx`) | — | Display policy. Do not sort or sign inside the builder (MCP event order and `plannedAmountMinor` stay magnitude). |
| Partial FX banner | Browser / Client (existing shell banner) | — | `excludedMissingFxCurrencies` already joins codes. Interest exclusions must flow through that list. |
| Historical NW LOCF | Pure lib (`historical-series` / `net-worth`) | Database snapshots | No interest argument. SAVISO proves it. |
| MCP forecast payload | Out of this phase | — | Loader will observe the grace sign because it imports the builder. Do not edit the loader or the tool description. |

## Standard Stack

No new packages. Wire the libraries already on the chart path.

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | `16.3.4` | `src/app/page.tsx` RSC loads accounts + LOCF | Already the dashboard host. `[VERIFIED: package.json:28]` |
| `react` | `19.2.8` | Client shell `useMemo` | Shell is already `"use client"`. `[VERIFIED: package.json:30]` |
| `recharts` | `3.10.1` | Existing `ComposedChart` + dashed `Line` | Do not add a series. `[VERIFIED: package.json:32]` |
| `vitest` | `4.1.11` | Unit + file-scan locks | `npm test` → `vitest run`. `[VERIFIED: package.json:10, package.json:49]` |
| Prisma `Account` | schema fields below | SAVINGS rate + accrual DOM | Already migrated in Phase 27. |

Prisma `Account` fields the page already loads via `include: { currency: true }` `[VERIFIED: prisma/schema.prisma:98-114]`:

```
annualRateBps       Int?
accrualDayOfMonth   Int?
```

`AccountType` includes `SAVINGS` `[VERIFIED: prisma/schema.prisma:12-18]`:

```
ASSET
FIAT_DEBIT
FIAT_CREDIT
CRYPTO
CASH
SAVINGS
```

`NetWorthAccountType` includes `"SAVINGS"` `[VERIFIED: src/lib/net-worth.ts:7-13]`.

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `src/lib/savings-interest.ts` | in-repo | `listInterestSlotsInRange` | Shell membership only. Do not reimplement. |
| `src/lib/money.ts` `formatChartNumber` | in-repo | Level and row numerals | Prefix plus/minus in the tooltip, not in this formatter. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Shell calls `listInterestSlotsInRange` | Page precomputes slots for one horizon | Page does not know the client `30d`/`90d`/`1y` preset. Precompute would freeze the horizon. |
| Sign grace inside `displayPrimaryMajor` | UI prefix on the positive major | `formatChartNumber` already prints a minus for negative numbers. A negative major plus a minus prefix double-signs. |

**Installation:** none.

## Package Legitimacy Audit

This phase installs no external packages. Audit gate not run. Nothing to flag SLOP/SUS.

**Packages removed due to SLOP verdict:** none
**Packages flagged as suspicious:** none

## Architecture Patterns

### System Architecture Diagram

```
page.tsx (RSC)
  accounts (type SAVINGS: annualRateBps, accrualDayOfMonth, currency)
  snapshots ≤ today → firstHitLocfMap → balanceMinor string
  existing forecastIncome + forecastGrace
        │ props (strings, no Prisma in the client)
        ▼
DashboardChartsShell  range preset
  forecastHorizonEnd(range, today)
  income slots (listAllInRange) ──┐
  grace slots (openGraceForecastMembership) ──┤
  interest slots (listInterestSlotsInRange) ──┤
        │ slots[]                              │
        ▼                                      │
buildNetWorthForecastSeries                    │
  FX LOCF @ today → drop + currency code       │
  income  → +displayPrimaryMinor               │
  interest → +displayPrimaryMinor              │
  grace   → −displayPrimaryMinor   (D-11)      │
  event.displayPrimaryMajor stays unsigned     │
  events only on that sample date              │
        │ points + excludedMissingFxCurrencies │
        ▼                                      │
mergeFactAndForecast                           │
  fact nw from buildNetWorthSeries (no interest)
  forecast number overlaid; today nw stays fact
        ▼
NetWorthHistoryChart
  one dashed Line
  future tooltip: Прогноз level → Накопительный → grace
  banner: Прогноз неполный · нет курса CODE, CODE
        │
        ▼  (same builder, NOT edited this phase)
loadForecastOverlay → get_forecast_overlay
  still income + grace membership only
  grace days return the new lower forecastPrimaryMinor
```

### Recommended Project Structure

```
src/app/page.tsx                                    # forecastSavings prop from existing account+LOCF load
src/components/dashboard/DashboardChartsShell.tsx   # concat interest slots; deps include the new prop
src/components/dashboard/NetWorthHistoryChart.tsx   # interest tooltip block; grace subtitle + minus
src/lib/nw-forecast.ts                              # grace addend −displayPrimaryMinor
src/lib/nw-forecast.test.ts                         # rewrite the five flat-grace expects
src/components/dashboard/nw-forecast-ui.test.ts     # replace the retired subtitle lock
src/lib/saviso.test.ts                              # new isolation suite
```

Do not add files under `src/lib/mcp/` in this phase.

### Pattern 1: Grace line sign, tooltip magnitude unsigned

**What:** `forecastDeltaMinor` is the only line addend. `displayPrimaryMajor` is computed from the pre-sign primary minor.
**When to use:** D-11 and D-09. One change serves shell and MCP numbers.
**Example:** current branch `[VERIFIED: src/lib/nw-forecast.ts:81-96]`:

```
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

Replace the grace arm with `-displayPrimaryMinor`. Leave the event field on `displayPrimaryMinor` (unsigned) `[VERIFIED: src/lib/nw-forecast.ts:173-184]`. Update the file comment that says grace is `ΔNW=0` `[VERIFIED: src/lib/nw-forecast.ts:1-4]` and the inline comment `0n for grace` `[VERIFIED: src/lib/nw-forecast.ts:142]`.

### Pattern 2: Interest slots join the shell array

**What:** Page passes account inputs. Shell expands them per horizon, same as income defs.
**When to use:** INT-02. Enumerator signature `[VERIFIED: src/lib/savings-interest.ts:45-49]`:

```
export function listInterestSlotsInRange(
  accounts: readonly InterestAccountInput[],
  today: string,
  horizonEnd: string,
): InterestForecastSlot[]
```

`InterestAccountInput` `[VERIFIED: src/lib/savings-interest.ts:18-28]`:

```
export type InterestAccountInput = {
  accountId: number;
  accountName?: string;
  balanceMinor: bigint;
  annualRateBps: number;
  accrualDayOfMonth: number;
  currencyCode: string;
  currencyScale: number;
  isPrimaryCurrency: boolean;
};
```

Map each returned slot to `ForecastSlot` with `kind: "interest"`, `parentId: accountId`, `plannedAmountMinor: interestMinor`, plus `accountId` / `accountName` / currency fields. Concat **before** `buildNetWorthForecastSeries`, beside the existing `[...openSlots, ...graceSlots]` `[VERIFIED: src/components/dashboard/DashboardChartsShell.tsx:368-370]`.

`nw-forecast.ts` must keep not importing `savings-interest`. Existing lock `[VERIFIED: src/lib/nw-forecast.test.ts:609-611]`:

```
  it("does not import the interest module", () => {
    const src = readFileSync(join(process.cwd(), "src/lib/nw-forecast.ts"), "utf8");
    expect(src).not.toMatch(/savings-interest/);
```

Filter page rows with `type === "SAVINGS"` and non-null `annualRateBps` and `accrualDayOfMonth`. Balance is today LOCF (`firstHitLocfMap` already built in `page.tsx`). Missing LOCF → omit or pass `0n`; the enumerator emits nothing when `balanceMinor <= 0n`.

### Pattern 3: Tooltip block between level and grace

**What:** Future branch (`asOfDate > today`) currently renders «Прогноз» then `ForecastGraceTooltipBlock` `[VERIFIED: src/components/dashboard/NetWorthHistoryChart.tsx:114-136]`.
**When to use:** D-04…D-07, D-13. Insert an interest block between them. Mirror the grace block DOM (`mt-1 grid gap-1 border-t …`, one muted header, one muted subtitle, one row per event).

Interest rows: `events.filter(e => e.kind === "interest")` then sort by `displayPrimaryMajor` descending, then `accountName` via `localeCompare(..., "ru")`. Node check this session: amounts 20/20/10 and names Альфа/Яндекс/Бета sort as Альфа, Яндекс, Бета. `[VERIFIED: node localeCompare ru]`

Prefix policy:

- Interest amount: `"+" + formatChartNumber(displayPrimaryMajor)`. `formatChartNumber` groups thousands with a space `[VERIFIED: src/lib/money.ts:20-24, src/lib/money.ts:100-111]`, so `1234` renders `1 234` and the row reads `+1 234`.
- Grace amount: `"-" + formatChartNumber(displayPrimaryMajor)` on the **positive** major.
- «Прогноз» level: `formatChartNumber(forecastVal)` with no extra plus. Negatives already carry `-` inside `formatChartNumber`.

Grace header stays `Платёж для беспроцентного`. Replace subtitle `NW без изменения (оплата карты)` `[VERIFIED: src/components/dashboard/NetWorthHistoryChart.tsx:69-71]` with `Ожидаемый платёж`. The same component also renders on the **today** tooltip `[VERIFIED: src/components/dashboard/NetWorthHistoryChart.tsx:188-189]`. One subtitle change covers overdue folded to today. Do not add the interest block on the today branch: interest membership is `plannedAsOf > today` `[VERIFIED: src/lib/nw-forecast.ts:106-108]`.

Do not render balance-after-credit, a horizon sum, or the word «капитализация».

Account type label already equals the header `[VERIFIED: src/lib/account-type.ts:26-28]`:

```
  if (t === "SAVINGS") return "Накопительный";
```

### Pattern 4: FX banner stays one string

Shell banner `[VERIFIED: src/components/dashboard/DashboardChartsShell.tsx:423-436]`:

```
Прогноз неполный
 · нет курса
{missingFxCodes joined with ", "}
```

`missingFxCodes` is `forecastMeta.excludedMissingFxCurrencies`. Interest slots that fail `locfRateAsOf(..., today)` increment the same counter `[VERIFIED: src/lib/nw-forecast.ts:156-163]`. Do not append «накопительный» or «грейс». Existing file-scan forbids `доходы|грейс` in the shell `[VERIFIED: src/components/dashboard/nw-forecast-ui.test.ts:57-58]`.

### Anti-Patterns to Avoid

- **Second dashed series or legend kind split.** C-01. One `strokeDasharray` Line stays.
- **Recomputing interest inside `nw-forecast.ts`.** Phase 28 test forbids that import. Pass precomputed `interestMinor`.
- **Negating `displayPrimaryMajor`.** Double minus in the tooltip. Line sign lives only in `forecastDeltaMinor`.
- **Sorting events inside the builder.** Tooltip sorts interest rows. Builder order is also what MCP serializes.
- **Writing a snapshot when the forecast is viewed.** SAVISO.
- **Editing `GET_FORECAST_OVERLAY_DESCRIPTION` or `loadForecastOverlay` membership to "keep MCP honest."** That is Phase 30. The numeric drift is accepted blast radius.
- **Marking the savings todo resolved.** C-06.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Monthly compound dates and amounts | A second accrual loop in the shell | `listInterestSlotsInRange` | Truncation, future-only cursor, and per-account principal are locked in Phase 28. |
| FX to primary | Inline rate math | `buildNetWorthForecastSeries` FX gate | Missing rate must drop the slot and record the code once. |
| Historical series "without interest" | A flag on `buildNetWorthSeries` | Leave that function's input unchanged; test the absence | `BuildNetWorthSeriesInput` keys are accounts, snapshots, rates, primaryScale, preset, today `[VERIFIED: src/lib/historical-series.ts:59-66]`. |
| Thousand grouping / minus for the level | A new formatter | `formatChartNumber` | Space grouping and negative levels already exist. |
| Grace payment sampling (overdue fold, due date) | A new grace enumerator | `openGraceForecastMembership` | D-11 changes the addend only. |

**Key insight:** The dashed line is one running bigint. Interest and the grace dip are addends on that run. Historical NW is a different function with no slot argument.

## Common Pitfalls

### Pitfall 1: Flat-grace tests still lock ΔNW = 0

**What goes wrong:** `forecastDeltaMinor` change fails `src/lib/nw-forecast.test.ts` until expects move.
**Why it happens:** Phase 21 and Phase 28 froze A′ = `0n`.
**How to avoid:** Update these expects in the same commit as the grace arm. `today` in that file is `"2026-03-01"` `[VERIFIED: src/lib/nw-forecast.test.ts:12]`.

| Test title (verbatim) | Current expect | After D-11 |
|-----------------------|----------------|------------|
| `future OPEN grace sampled with ΔNW=0 (A′ / C-01 / D-06 / GRFCST-01)` | due and horizon `forecastPrimaryMinor` `1_000_000n` with grace `50_000n` `[VERIFIED: src/lib/nw-forecast.test.ts:325-349]` | today stays `1_000_000n`; `2026-03-15` and `2026-03-31` become `950_000n`. Event `plannedAmountMinor` stays `50_000n`. |
| `overdue OPEN fold → today sampleAsOf (D-01 / D-02 / D-03)` | `points[0].forecastPrimaryMinor` `500_000n` with grace `50_000n` on today `[VERIFIED: src/lib/nw-forecast.test.ts:360-376]` | today sample becomes `450_000n`. Later samples stay at that dipped running total. |
| `grace-only horizon → non-empty flat points (D-07)` | every point `800_000n` with grace `10_000n` on `2026-03-20` `[VERIFIED: src/lib/nw-forecast.test.ts:386-408]` | today stays `800_000n`; `2026-03-20` and `2026-03-31` become `790_000n`. Series stays non-empty. |
| `same-day income+grace: NW moves by income only (C-03 / D-06)` | day `1_100_000n` (income `100_000n`, grace `50_000n`, anchor `1_000_000n`) `[VERIFIED: src/lib/nw-forecast.test.ts:411-427]` | day becomes `1_050_000n`. Both kinds remain on `forecastEvents`. |
| `same-day interest+grace: NW moves by interest only (D-03 / D-12)` | day `1_050_000n` `[VERIFIED: src/lib/nw-forecast.test.ts:533-548]` | day becomes `1_000_000n` (`1_000_000 + 50_000 − 50_000`). |

Rename titles that say "ΔNW=0" or "income only" / "interest only" so they describe the signed sum. Keep sampling: grace dates still appear even when the addend is non-zero (the old D-06 reason for sampling a flat day still wants the tooltip).

UI file-scan `[VERIFIED: src/components/dashboard/nw-forecast-ui.test.ts:73-75]`:

```
  it("tooltip includes «NW без изменения (оплата карты)»", () => {
    expect(chartSrc).toMatch(/NW без изменения \(оплата карты\)/);
```

Replace with expects for `Ожидаемый платёж`, `Накопительный`, and `Ожидаемое начисление`. Header `Платёж для беспроцентного` stays `[VERIFIED: src/components/dashboard/nw-forecast-ui.test.ts:69-71]`.

**Warning signs:** Vitest failure on `1_000_000n` / `800_000n` / `500_000n` in `nw-forecast.test.ts`, or the subtitle regex.

### Pitfall 2: Today hinge splits fact vs dashed line

**What goes wrong:** Overdue (and due-today) grace folds onto today `[VERIFIED: src/lib/nw-forecast.ts:109-111]` (`plannedAsOf >= today`). After D-11 the today **forecast** sample drops. `mergeFactAndForecast` still sets fact `nw` from historical series and only copies `forecast` onto that date `[VERIFIED: src/components/dashboard/DashboardChartsShell.tsx:165-174]`. The area and the dashed line disagree at today whenever an OPEN grace payment samples today.
**Why it happens:** Phase 21 kept them equal because the addend was `0n`.
**How to avoid:** Do not special-case grace-on-today back to `0n`. Do not copy the dipped forecast into `nw`. UAT: fact «Итого» unchanged; dashed «Прогноз» on that today point is lower by the primary payment. Future dues dip on their own dates, not on today.
**Warning signs:** A test that requires `forecast === nw` on today when grace events exist.

### Pitfall 3: Interest row repeated on later days

**What goes wrong:** Tooltip maps every event whose running total includes the credit, or sums the horizon.
**Why it happens:** The line stays high after the accrual day (cumulative `running`). Events are stored only on the sample date `[VERIFIED: src/lib/nw-forecast.ts:227-248]`.
**How to avoid:** Render interest rows only from that point's `forecastEvents`. Horizon-end point with no events shows the level only. Each row uses that event's `displayPrimaryMajor`, not `forecast` and not a sum of slots.
**Warning signs:** «Накопительный» visible on a non-accrual forecast day, or a row equal to the whole «Прогноз» level.

### Pitfall 4: MCP numbers move while copy stays A′

**What goes wrong:** Phase 30 starts from a description that still says the line is neutral, but live `forecastPrimaryMinor` already dipped.
**Why it happens:** `loadForecastOverlay` calls `buildNetWorthForecastSeries` `[VERIFIED: src/lib/mcp/reads/load-forecast-overlay.ts:322-329]`. Description `[VERIFIED: src/lib/mcp/tools/forecast.ts:11-15]`:

```
export const GET_FORECAST_OVERLAY_DESCRIPTION =
  "Read Капитал forecast overlay / Прогноз: sparse points[] with income + A′ grace forecastEvents. " +
  "Optional horizonEnd (YYYY-MM-DD); omit defaults to today+365 (same as UI 1y/all). " +
  "UI presets 30d/90d/1y are how to pick a date — not tool params. " +
  "INISO-01/GRISO-01: Капитал forecast overlay (Прогноз) is income + A′ grace — do not fold into historical NW LOCF.";
```

Serializer kind union already includes interest `[VERIFIED: src/lib/mcp/reads/load-forecast-overlay.ts:31-32]`:

```
export type SerializedForecastEvent = {
  kind: "income" | "grace" | "interest";
```

The loader never pushes `kind: "interest"` slots. `src/lib/mcp/tools/forecast.test.ts` asserts event kinds and `plannedAmountMinor` strings, not flat `forecastPrimaryMinor`, so that file should stay green.
**How to avoid:** Do not edit `src/lib/mcp/**` in this phase. Phase 30 plan must treat dipped grace numbers as already shipped and add interest membership plus description text then.
**Warning signs:** A Phase 29 diff touching `forecast.ts` or `load-forecast-overlay.ts`.

### Pitfall 5: Missing FX still moves the line

**What goes wrong:** A non-primary SAVINGS credit is converted with a guessed rate, or the banner names the kind.
**Why it happens:** Copy-paste of a primary-only path.
**How to avoid:** Non-primary interest slots go through the builder with `isPrimaryCurrency: false`. Existing unit already drops them `[VERIFIED: src/lib/nw-forecast.test.ts:614-630]`. Tighten that expect to `excludedMissingFxCurrencies` `["USD"]` and add a mixed income+interest case whose sorted codes are unique. Banner copy stays the shell string above.

## Code Examples

### Grace addend

```typescript
// Source: src/lib/nw-forecast.ts forecastDeltaMinor — change only the grace arm
case "income":
case "interest":
  return displayPrimaryMinor;
case "grace":
  return -displayPrimaryMinor;
```

`ForecastSlotKind` stays `[VERIFIED: src/lib/nw-forecast.ts:18]`:

```
export type ForecastSlotKind = "income" | "grace" | "interest";
```

### Shell slot map

```typescript
// Source: listInterestSlotsInRange return shape, src/lib/savings-interest.ts:30-38
// parentId is accountId. plannedAmountMinor on ForecastSlot is interestMinor.
const interestSlots: ForecastSlot[] = listInterestSlotsInRange(
  savingsAccounts,
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

`InterestForecastSlot` `[VERIFIED: src/lib/savings-interest.ts:30-38]`:

```
export type InterestForecastSlot = {
  plannedAsOf: string;
  interestMinor: bigint;
  parentId: number;
  accountId: number;
  accountName?: string;
  currencyCode: string;
  currencyScale: number;
  isPrimaryCurrency: boolean;
};
```

### Row prefix

```typescript
// Interest row — plus is not part of formatChartNumber
`+${formatChartNumber(ev.displayPrimaryMajor)}`
// Grace row — major stays >= 0
`-${formatChartNumber(ev.displayPrimaryMajor)}`
// Прогноз level — formatter already signs negatives
formatChartNumber(forecastVal)
```

`formatChartNumber` `[VERIFIED: src/lib/money.ts:100-111]`:

```
export function formatChartNumber(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  if (Object.is(value, -0) || value === 0) return "0";
  const neg = value < 0;
```

### SAVISO golden (shape to copy)

INISO baseline `[VERIFIED: src/lib/iniso.test.ts:123-146]` expects a primary snapshot series to equal the snapshot minor twice (event date and today), with no income argument:

```
    expect(points.map((p) => p.totalPrimaryMinor)).toEqual([100_000n, 100_000n]);
```

SAVISO uses `type: "SAVINGS"` (legal on `SeriesAccount` via `NetWorthAccountType`). A conceptual `{ interestMinor, annualRateBps }` object stays unused. Expect the same snapshot minor, not snapshot + interest. `computeNetWorthRows` already keeps SAVINGS LOCF as a positive contribution: `250_000n` in and `250_000n` out `[VERIFIED: src/lib/net-worth.test.ts:35-45]`.

Never-call scan matches the forecast MCP test style `[VERIFIED: src/lib/mcp/tools/forecast.test.ts:173-176]`:

```
      expect(src).not.toMatch(/balanceSnapshot\.(create|update|upsert|delete)/);
```

Apply that regex to `src/lib/savings-interest.ts`, `src/lib/nw-forecast.ts`, `src/components/dashboard/DashboardChartsShell.tsx`, and `src/app/page.tsx`. Also forbid `@/lib/savings-interest` and `@/lib/nw-forecast` inside `src/lib/net-worth.ts` and `src/lib/historical-series.ts` (GRISO already forbids `nw-forecast` `[VERIFIED: src/lib/griso.test.ts:14-18]`).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Grace line addend `0n`, subtitle «NW без изменения (оплата карты)» | Grace line `-displayPrimaryMinor`, subtitle «Ожидаемый платёж», row prefix `-` | Phase 29 D-09 / D-11 (2026-09-21) | Rewrites five unit expects and one UI file-scan. Historical NW unchanged. |
| Interest kind unit-tested, not on `/` | Shell concat + tooltip block | This phase | INT-02. Math stays Phase 28. |
| v1.5 research note "grace stays 0n" in `.planning/research/PITFALLS.md` | Overridden for the forecast line by D-11 | Discuss 2026-09-21 | Do not "preserve A′" as a Phase 29 task. |

**Deprecated/outdated:**

- Phase 21 C-01 / C-04 flat A′ and «NW без изменения (оплата карты)» for the **forecast line and tooltip**. Banner, horizon, one series, and FX honesty from Phase 21 still hold.
- `.planning/research/PITFALLS.md` checklist item "Grace unbroken: A′ still ΔNW=0" is stale for this phase.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Overdue grace folded onto today dips the dashed sample on today (same `-displayPrimaryMinor`), and fact `nw` on that point stays the historical total. | Pitfall 2 | If the product intent was "future dues only, today hinge stays glued to fact", the today dip is wrong and needs a grace-on-today exception. D-11 text does not carve that out. |
| A2 | Default `localeCompare(..., "ru")` is the А→Я tie-break. This session's probe sorted `альфа` before `Альфа` (code-point / default sensitivity). | Pattern 3 | Names that differ only by case may not match a dictionary А→Я. Discretion allows a `{ sensitivity: "base" }` tweak without a new decision. |

**If this table is empty:** N/A — two assumptions above.

## Open Questions

1. **Today hinge visual gap when OPEN grace is overdue**
   - What we know: Fold-to-today is existing membership. D-11 applies the payment to the dashed line. Fact series is a different field.
   - What's unclear: Whether a visible gap at the hinge is acceptable in UAT.
   - Recommendation: Implement the uniform minus. Do not zero the today addend. Call the gap out in UAT.

2. **MCP description lag**
   - What we know: C-05 forbids MCP edits. The shared builder change still changes MCP numbers.
   - What's unclear: Nothing for this phase's scope.
   - Recommendation: Leave MCP files untouched. Phase 30 owns description + interest events and must not assume grace `forecastPrimaryMinor` is still flat.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | Vitest / Next | ✓ | v24.5.0 | — |
| Vitest | SAVISO + forecast locks | ✓ | 4.1.11 (`package.json`) | — |
| Prisma Account SAVINGS columns | Page payload | ✓ | `annualRateBps`, `accrualDayOfMonth` in schema | — |

No new CLI or service. Graphify `graph.json` is absent; no graph context used.

**Missing dependencies with no fallback:** none

**Missing dependencies with fallback:** none

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.11 |
| Config file | `vitest.config.ts` (`environment: "node"`, `include: ["src/**/*.test.ts"]`) |
| Quick run command | `npx vitest run src/lib/nw-forecast.test.ts src/lib/saviso.test.ts src/components/dashboard/nw-forecast-ui.test.ts src/lib/iniso.test.ts src/lib/griso.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INT-02 | Future interest slot raises `forecastPrimaryMinor`; shell source calls `listInterestSlotsInRange` and sets `kind: "interest"` | unit + file-scan | `npx vitest run src/lib/nw-forecast.test.ts src/components/dashboard/nw-forecast-ui.test.ts` | ✅ builder tests exist; ❌ shell scan for interest — extend `nw-forecast-ui.test.ts` |
| INT-02 | Accrual-day tooltip only; header «Накопительный»; subtitle «Ожидаемое начисление» once | file-scan | same UI test file | ❌ Wave 0 expects |
| INT-03 | Non-primary interest without a rate → `excludedMissingFxCurrencies` includes that code; banner source unchanged (`Прогноз неполный`, `нет курса`, no kind word) | unit + file-scan | `npx vitest run src/lib/nw-forecast.test.ts src/components/dashboard/nw-forecast-ui.test.ts` | ✅ partial (`excludedMissingFxCount`); tighten currency list |
| SAVISO-01 / SAVISO-02 | No `balanceSnapshot.create/update/upsert/delete` in forecast path; `buildNetWorthSeries` on a SAVINGS account equals snapshot minors with an unused interest fixture | unit | `npx vitest run src/lib/saviso.test.ts` | ❌ `src/lib/saviso.test.ts` |
| D-11 | Grace samples subtract primary minor; events keep positive `plannedAmountMinor` | unit | `npx vitest run src/lib/nw-forecast.test.ts` | ✅ file exists; expects are the old flat locks |
| D-09 | Grace subtitle «Ожидаемый платёж»; retired subtitle absent | file-scan | `npx vitest run src/components/dashboard/nw-forecast-ui.test.ts` | ✅ file exists; expect is the old subtitle |

### Sampling Rate

- **Per task commit:** `npx vitest run src/lib/nw-forecast.test.ts src/lib/saviso.test.ts src/components/dashboard/nw-forecast-ui.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/lib/saviso.test.ts` — SAVISO-01/02 (import wall, never-call regex, SAVINGS golden series)
- [ ] Extend `src/lib/nw-forecast.test.ts` grace expects to the signed totals in Pitfall 1
- [ ] Extend `src/components/dashboard/nw-forecast-ui.test.ts` — new copy; shell contains `listInterestSlotsInRange`; retired subtitle absent
- [ ] Framework install: none

UI behavior (row order, plus glyph, line geometry) is file-scan plus agent UAT. Vitest environment is `node` (`vitest.config.ts`), so there is no React render test unless one is added. Do not add a component renderer unless a file-scan cannot see the prefix. A source expect for `` `+${formatChartNumber `` or string `"+"` next to `formatChartNumber` in the interest row is enough.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Local single-user app; this phase adds no login. |
| V3 Session Management | no | No session change. |
| V4 Access Control | no | Same dashboard read as income/grace. No new mutate route. |
| V5 Input Validation | yes | Savings rate/DOM already constrained by `Account_savings_rate_invariant`. Overlay reads Prisma rows. Client receives strings and revives with `BigInt` the way income minors already do. Do not parse interest with `Number` / `parseFloat`. |
| V6 Cryptography | no | FX uses existing `convertOtherMinorToPrimaryMinor`. No new crypto. |

### Known Threat Patterns for this overlay

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Forecast write mistaken for a posted balance | Tampering | SAVISO source ban on `balanceSnapshot.create/update/upsert/delete`. Historical builder has no interest field. |
| Invented FX raises a non-primary credit | Tampering | Existing LOCF gate; miss → exclude + banner code. |
| Interest principal includes income or grace | Tampering | `listInterestSlotsInRange` takes only savings account inputs (Phase 28 D-03). Do not pass overlay slots into it. |
| Tooltip shows another account's credit | Information disclosure | One row per `accountId` / `accountName` from the slot. Sort is display-only. |

## Sources

### Primary (HIGH confidence)

- `src/lib/nw-forecast.ts` — kind union, `forecastDeltaMinor` grace `0n`, FX drop, event magnitude, sparse dates
- `src/lib/savings-interest.ts` — `listInterestSlotsInRange`, `InterestAccountInput`, `InterestForecastSlot`
- `src/components/dashboard/DashboardChartsShell.tsx` — income+grace concat, banner string, fact/forecast merge
- `src/components/dashboard/NetWorthHistoryChart.tsx` — future tooltip order, grace subtitle
- `src/app/page.tsx` — account include, LOCF map, forecast props
- `src/lib/nw-forecast.test.ts` — five flat-grace expects and interest +ΔNW expects
- `src/lib/iniso.test.ts`, `src/lib/griso.test.ts` — isolation suite shape
- `prisma/schema.prisma` — `SAVINGS`, `annualRateBps`, `accrualDayOfMonth`
- `package.json` — next 16.3.4, react 19.2.8, recharts 3.10.1, vitest 4.1.11

### Secondary (MEDIUM confidence)

- `.planning/phases/29-kapital-overlay-saviso/29-CONTEXT.md` — D-01…D-13, C-01…C-06
- `.planning/phases/28-interest-math-forecast-kind/28-CONTEXT.md` — compound chain stays in the enumerator
- `.planning/milestones/v1.3-phases/21-kapital-forecast-integration/21-CONTEXT.md` — banner/horizon locks; A′ line lock revoked by D-11

### Tertiary (LOW confidence)

- None material. A1/A2 are listed in Assumptions Log.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — versions read from `package.json`; no new dependency
- Architecture: HIGH — call chain read from shell, page, builder, MCP loader
- Pitfalls: HIGH — failing expects quoted from current tests; MCP blast radius read from the loader

**Research date:** 2026-09-21
**Valid until:** 2026-10-21 (stable in-repo seams; D-11 is the volatile lock)
