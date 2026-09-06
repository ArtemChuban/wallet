# Phase 11: Charts + primary totals - Research

**Researched:** 2026-09-06
**Domain:** Debt principal stack chart (native) + `/debts` primary totals hero + Капитал partial-banner parity; NW isolation
**Confidence:** HIGH (codebase + locked CONTEXT); MEDIUM on same-day multi-event chart point collapse (discretion)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
### Chart surface (debt detail)
- **D-01:** Charts live inside the existing **«История»** tab of `DebtDetailDialog` — not a new «Графики» tab and not an always-visible header block.
- **D-02:** Within «История», order is **charts first, then event timeline**.
- **D-03:** Layout is a **single stacked chart** (not two separate charts). Stack layers: **cumulative repaid** + **remaining**; sum equals **current principal** at each point. — **Reversibility:** costly — UI and series builder couple DCHART-01/02 into one composition.

### Series / stack math
- **D-04:** Time axis starts at the debt’s **open calendar date**; until the first event, series is **flat at initial** (repaid=0, remaining=initial). After events, **step** updates; after the last event, **flat to today** (Europe/Moscow).
- **D-05:** Range control: **«всё» only** — no 30д/90д/1г presets on this chart.
- **D-06:** **Size-change** events change the **total stack height** (current principal); do **not** add a third stack series for size-change. Repaid and remaining proportions recompute on that date.
- **D-07:** Event ordering for series matches Phase 8 **D-10**: across repayments and size-changes, order by `asOfDate` then insert `id`.

### Debt open date (needed for past-dated create + series start)
- **D-08:** Debt create gains a required calendar **«Дата»** field (`YYYY-MM-DD`): may be in the past; default = today Europe/Moscow. Series start uses this field (not wall-clock `createdAt` alone). — **Reversibility:** one-way — schema + create form + backfill/migration for existing debts.
- **D-09:** Open date is **immutable after create** (same constitution as initial amount).

### Primary totals hero (`/debts`)
- **D-10:** Hero sits in the **page header above the list**, same family as Капитал on `/`.
- **D-11:** Two **side-by-side columns**: «Я должен» | «Мне должны», each with primary-currency amount (`computeDebtPrimaryTotals` / Phase 8 D-16–D-19: OPEN only, exclude missing FX, `isPartial`).
- **D-12:** Hero is **always shown**, including when both totals are **0**.
- **D-13:** When `isPartial`: show banner in the Капитал style (**«Итог неполный»** + short RU helper) **plus a list of excluded debts** with **reason** (at least which currency / missing rate). — **Reversibility:** reversible UI.

### Капитал partial banner parity
- **D-14:** Update `/` (Капитал) partial banner to the **same pattern**: list excluded accounts with reason (missing balance and/or missing FX), not banner-only copy. In scope for this phase for honesty UX consistency.

### Claude's Discretion
- Exact Recharts stack series keys, colors, tooltip formatting (reuse dashboard `ChartContainer` / money formatters).
- Empty-history microcopy when timeline has no events but chart still shows flat initial→today.
- Exact RU wording for excluded-debt / excluded-account list rows as long as currency (and reason) are visible.
- How to backfill `openedAsOf` (or chosen field name) for existing Debt rows in migration (e.g. `createdAt` → Moscow calendar date).
- Whether chart component lives under `src/components/debts/` vs shared chart helpers; must not import debt series into `historical-series.ts` / `net-worth.ts` / `/` beyond the partial-banner list UX on `/`.

### Deferred Ideas (OUT OF SCOPE)
- Separate repayment-amounts-only chart — rejected in favor of stack (D-03)
- Range presets on debt chart — rejected (D-05)
- Editable open date after create — rejected (D-09)
- Cross-currency repayments, NW inclusion of debts, list filters — out of milestone / other requirements

None folded from todos (no matching todos).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DCHART-01 | Remaining-balance-over-time chart in debt currency | One stacked Area: `remaining` layer; series in native majors via `buildDebtPrincipalStackSeries` |
| DCHART-02 | Repayment-amounts chart for a debt | Same stack: `repaidCumulative` layer (CONTEXT locks one chart for both reqs) |
| DTOTAL-01 | `/debts` I-owe / they-owe primary totals + partial banner | Wire `computeDebtPrimaryTotals` on page; hero + «Итог неполный» + excluded list |
| DISOL-01 | Debts never change NW or NW charts | No debt imports in `net-worth.ts` / `historical-series.ts`; `/` only gains account excluded-list UX (D-14); no NW math change |
</phase_requirements>

## Summary

Phase 11 closes the debts milestone UX: a **native-currency stacked step chart** on debt detail «История», and **primary-currency hero totals** on `/debts` with FX honesty matching Капитал. Domain math for totals already exists (`computeDebtPrimaryTotals`); chart series and open-date field do not. Milestone research’s two-chart / RangePreset sketch is **superseded** by CONTEXT D-03/D-05.

**Primary recommendation:** Add immutable `Debt.openedAsOf` (YYYY-MM-DD) with backfill; implement pure `buildDebtPrincipalStackSeries` in `src/lib/debts.ts` (+ Vitest); render one `stepAfter` stacked Area chart above the timeline; wire `/debts` hero from existing totals helper; enrich `/` partial banner with excluded accounts — without touching NW math.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Open-date schema + migration backfill | Database / Storage | API / Backend | Prisma `Debt` column; SQLite recreate/backfill pattern |
| Create/edit Zod + Server Action persist open date | API / Backend | Browser / Client | Validation + immutability on write; form field on create only |
| Principal stack series builder | API / Backend (pure lib) | — | Deterministic math; Vitest; no Prisma |
| Debt detail chart UI | Browser / Client | — | Client chart inside `DebtDetailDialog` «История» |
| `/debts` primary totals + FX LOCF as-of today | Frontend Server (RSC) | Database / Storage | Page loads rates + debts; formats hero; no NW coupling |
| Partial banner excluded lists (`/debts`, `/`) | Frontend Server (RSC) | Browser / Client | Server computes rows; presentational list |
| NW isolation (DISOL-01) | API / Backend | Frontend Server | Keep debts out of `net-worth.ts` / `historical-series.ts` |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 3.10.1 (pinned in package.json; registry latest also 3.10.1) | Stacked Area chart | Already shipped Phase 06; no new chart lib [VERIFIED: package.json:30] |
| ChartContainer / chart.tsx | in-repo shadcn wrapper | Theme tokens + tooltip shell | Same path as `NetWorthHistoryChart` [VERIFIED: NetWorthHistoryChart.tsx:12-18] |
| Zod | 4.5.4 | Create-debt open date field | Existing `createDebtSchema` / `createDebtWithNewPersonSchema` [VERIFIED: package.json:34] |
| Prisma + SQLite | 7.10.0 | `openedAsOf` column + migrate | Existing debts schema [VERIFIED: package.json:20-27] |
| Vitest | 4.1.11 | Series + totals wiring tests | `src/**/*.test.ts` [VERIFIED: vitest.config.ts:4-7] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@/lib/money` `minorToMajorNumber` / `formatChartNumber` | in-repo | Chart majors + tooltip | Same as dashboard charts |
| `@/lib/dates` `calendarDateToday` | in-repo | Today / default open date Europe/Moscow | `"Europe/Moscow"` default [VERIFIED: src/lib/dates.ts:12] |
| `@/lib/fx` / page LOCF Maps | in-repo | Rate as-of today for totals | Mirror `/` pattern; pass `rateToPrimaryScaled` into totals helper |
| `@/lib/debts` | in-repo | Remaining + totals + **new** series | Single debts domain module (Phase 8 D-24) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| One stacked chart | Two separate charts | Rejected by D-03 |
| `stackOffset="sign"` | default `"none"` | `sign` is for NW credit negatives; debt layers are non-negative [CITED: recharts.github.io/en-US/api/AreaChart/] |
| RangePreset window | «всё» only | Locked D-05; do not reuse dashboard preset chrome |
| New chart package | — | Forbidden; recharts already present |

**Installation:** none — reuse pinned `recharts@3.10.1`. Do not `npm install` for this phase.

**Version verification:** `npm view recharts version` → `3.10.1` (registry modified 2026-08-23). Legitimacy OK (see audit).

## Package Legitimacy Audit

> No new packages. Audit of existing chart dependency for completeness.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| recharts | npm | multi-year (published signal 2026-07-25 in seam) | ~57M/wk | github.com/recharts/recharts | OK | Already installed — Approved |

**Packages removed due to [SLOP] verdict:** none  
**Packages flagged as suspicious [SUS]:** none  

`npm view recharts scripts.postinstall` → empty/null (no risky postinstall).

## Architecture Patterns

### System Architecture Diagram

```text
[Debt create form]
   │ openedAsOf (required YYYY-MM-DD)
   ▼
[Prisma Debt + Repayment + SizeChange]
   │
   ├─► buildDebtPrincipalStackSeries (pure)
   │      open → flat initial → step events → flat today
   │      layers: repaidCumulative + remaining (= principal)
   │      ▼
   │   DebtDetailDialog «История»
   │      Chart (native) THEN timeline
   │
   └─► /debts RSC
          LOCF FX as-of today → computeDebtPrimaryTotals
          ▼
       Hero «Я должен» | «Мне должны»
       + optional «Итог неполный» + excluded debt list

[/] Капитал RSC
   computeNetWorthRows (UNCHANGED math)
   ▼
   Hero NW + «Итог неполный» + NEW excluded account list (D-14)
   (no debt imports)
```

### Recommended Project Structure

```
src/lib/debts.ts                 # + buildDebtPrincipalStackSeries (+ types)
src/lib/debts.test.ts            # + series cases
src/lib/validations/debts.ts     # + openedAsOf on create schemas
src/app/debts/actions.ts         # persist openedAsOf; reject update mutations
src/app/debts/page.tsx           # FX + totals hero + banner list
src/components/debts/
  DebtPrincipalStackChart.tsx    # client chart (discretion location)
  DebtDetailDialog.tsx           # chart above timeline in history tab
  DebtFormDialog.tsx             # create «Дата» field
src/app/page.tsx                 # excluded-account list in partial banner only
prisma/schema.prisma             # Debt.openedAsOf String
prisma/migrations/...            # add column + backfill
```

### Pattern 1: Principal stack series (pure)

**What:** Walk events chronologically; emit composition points in **native** minor (convert to major number only at chart boundary).  
**When to use:** Every open debt detail chart; also CLOSED debts (history still meaningful).

**Recommended point shape (discretion keys):**

```typescript
// Source: phase research recommendation (keys discretionary)
type DebtPrincipalStackPoint = {
  asOfDate: string; // YYYY-MM-DD
  repaidMajor: number;
  remainingMajor: number;
  // principalMajor = repaidMajor + remainingMajor (assert in tests)
};
```

**Algorithm (locked D-04/D-06/D-07):**

1. Sort merged events by `asOfDate` ASC, then `id` ASC (Phase 11 D-07). For equal `(asOfDate, id)` across kinds (separate autoincrement tables), add a stable tertiary key (`kind`) — see Open Questions.
2. Seed at `openedAsOf`: `repaid=0`, `remaining=initial`, `principal=initial`.
3. For each event date group (recommended: one emitted point per distinct `asOfDate` after applying all events that day — see Pitfall 2): apply repayments (`repaid+=`, `remaining-=`) and size-changes (`principal+=delta`, `remaining+=delta`) in order; emit point with `repaid` + `remaining` (stack height = principal).
4. If last point `asOfDate` < `today` (Europe/Moscow): append flat copy at `today`.
5. No RangePreset filter (D-05).

Invariant at every point: `repaid + remaining === currentPrincipal` [ASSUMED as test assertion derived from D-03].

### Pattern 2: Stacked step Area (UI)

**What:** Two `Area`s, same `stackId`, `type="stepAfter"`, default `stackOffset` (`"none"`).  
**When to use:** Debt composition only — do **not** copy NW `stackOffset="sign"`.

```tsx
// Source: https://recharts.github.io/en-US/api/Area/ (type, stackId)
// Source: https://recharts.github.io/en-US/api/AreaChart/ (stackOffset default "none")
// Precedent: src/components/dashboard/NetWorthHistoryChart.tsx (ChartContainer shell only)
<ChartContainer config={config} className="h-[200px] w-full">
  <AreaChart accessibilityLayer data={data} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
    <CartesianGrid vertical={false} />
    <XAxis dataKey="asOfDate" tickFormatter={formatAsOfDisplay} />
    <YAxis width={48} tickFormatter={formatChartNumber} />
    <ChartTooltip /* RU labels: Погашено / Остаток */ />
    <Area dataKey="repaidMajor" type="stepAfter" stackId="principal" fillOpacity={0.55} />
    <Area dataKey="remainingMajor" type="stepAfter" stackId="principal" fillOpacity={0.55} />
  </AreaChart>
</ChartContainer>
```

Avoid `type="monotone"` on stacked areas — known overlap artifacts when magnitudes differ [CITED: github.com/recharts/recharts/issues/4698].

### Pattern 3: Primary totals hero on `/debts`

**What:** RSC loads OPEN debts + LOCF rates for today; calls existing helper; always renders two columns.  
**Existing helper return** [VERIFIED: src/lib/debts.ts:175-196]:

```typescript
export function computeDebtPrimaryTotals(
  debts: readonly DebtPrimaryTotalsInput[],
): {
  rows: DebtPrimaryTotalsRow[];
  iOwePrimaryMinor: bigint;
  theyOwePrimaryMinor: bigint;
  isPartial: boolean;
}
```

`DebtExcludeReason = "none" | "no_fx"` [VERIFIED: src/lib/debts.ts:119]. CLOSED omitted. Caller must supply `rateToPrimaryScaled` (LOCF at page) — helper does **not** take `asOfDate` [VERIFIED: src/lib/debts.ts:103-116].

Today `/debts` does **not** call this helper (only tests) [VERIFIED: codegraph callers → `debts.test.ts` only].

### Pattern 4: Open date field

**Schema today** has no open calendar field — only `createdAt` DateTime [VERIFIED: prisma/schema.prisma:48-63]:

```
model Debt {
  ...
  initialAmountMinor BigInt
  dueDate            String?
  note               String?
  status             DebtStatus       @default(OPEN)
  createdAt          DateTime         @default(now())
  ...
}
```

**Recommend field name:** `openedAsOf String` (YYYY-MM-DD) — matches `asOfDate` convention; CONTEXT allows this name.

**Create schemas today** omit open date [VERIFIED: src/lib/validations/debts.ts:62-70] — add required `openedAsOf` with same regex as other dates; default UI value `calendarDateToday()`.

**Immutability:** mirror `assertInitialImmutable` / omit from `updateDebtMetaSchema`; edit UI must not expose the field (D-09).

**Backfill (discretion):** SQLite table rebuild migration: set `openedAsOf` from `date(createdAt)` in UTC **or** format `createdAt` in Europe/Moscow in a one-shot script — prefer Moscow calendar for product consistency [ASSUMED: backfill TZ = Europe/Moscow].

### Anti-Patterns to Avoid

- **Two charts or repayment BarChart:** violates D-03.
- **Coupling series into `historical-series.ts`:** violates DISOL-01 / CONTEXT.
- **Primary FX on detail chart:** pits native honesty [CITED: .planning/research/PITFALLS.md].
- **`stackOffset="sign"` copy-paste from NW:** wrong for all-positive debt stack.
- **RangePreset chrome on debt chart:** violates D-05.
- **Using `createdAt` as series start without `openedAsOf`:** violates D-08.
- **Cross-table sort by `id` alone without documenting ambiguity:** repayment id and size-change id are separate sequences (see Open Questions).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Chart theming/tooltip shell | Custom SVG stack | `ChartContainer` + Recharts Area | Already proven Phase 06 |
| Primary FX conversion | Ad-hoc multiply | `convertOtherMinorToPrimaryMinor` via totals helper | Scale-8 rates + scales |
| Today string | `new Date().toISOString().slice` | `calendarDateToday("Europe/Moscow")` | Product TZ |
| Totals aggregation | Page-local reduce | `computeDebtPrimaryTotals` | OPEN-only + `isPartial` already tested |
| Curve interpolation for steps | Custom path | `type="stepAfter"` | Official Area API |

**Key insight:** Phase 8 already shipped the hard totals math; Phase 11 is series builder + schema open date + presentation wiring.

## Runtime State Inventory

> Schema migration for `openedAsOf` — migration-phase inventory required.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | All existing `Debt` rows lack open calendar field | Migration backfill `openedAsOf` (code + data migration) |
| Live service config | None — verified: no external debt chart/totals service | none |
| OS-registered state | None — verified: no systemd/cron for debts | none |
| Secrets/env vars | None — no env keys named for debt open date | none |
| Build artifacts | Prisma client / `src/generated` after migrate | `prisma migrate deploy` + generate (existing postinstall) |

## Common Pitfalls

### Pitfall 1: Feeding debt series into NW charts
**What goes wrong:** Net worth history silently includes personal debts.  
**Why:** Shared “series” instinct / imports into `historical-series.ts`.  
**How to avoid:** Keep builder in `debts.ts`; DISOL gate — grep no debt imports in `net-worth.ts`, `historical-series.ts`; `/` may only list **accounts** in banner (D-14).  
**Warning signs:** Import from `@/lib/debts` in dashboard chart modules.

### Pitfall 2: Duplicate `asOfDate` points break step chart
**What goes wrong:** Multiple events same day → duplicate X categories; Recharts category axis misbehaves.  
**Why:** D-08/D-09 allow multiple repayments/size-changes per day (Phase 8).  
**How to avoid:** Emit **one point per distinct date** after applying that day’s events in D-07 order (end-of-day state is order-independent for sums). Still “step on events” across dates; flat open→first and last→today.  
**Warning signs:** Two payload rows with identical `asOfDate`.

### Pitfall 3: Cross-kind `id` ordering ambiguity
**What goes wrong:** Same-day repayment id=5 vs size-change id=5 — unstable tertiary order.  
**Why:** Separate autoincrement tables.  
**How to avoid:** Sort `asOfDate`, then `id`, then `kind` (`"repayment"` before `"sizeChange"` or reverse — pick one and test). End-of-day collapse removes display sensitivity; keep order for any future per-event emission.  
**Warning signs:** Flaky series tests with mixed same-day events.

### Pitfall 4: Timeline sort ≠ series sort
**What goes wrong:** Chart chronology fights history list.  
**Why:** `buildTimeline` sorts **descending** by date then id [VERIFIED: DebtDetailDialog.tsx:100-105]. Series must be **ascending**.  
**How to avoid:** Do not reuse `buildTimeline` output for chart data; share a pure sort helper if desired, with explicit direction.

### Pitfall 5: Hero hidden when totals are zero
**What goes wrong:** Empty-looking `/debts` when all closed / zero remaining.  
**Why:** Conditional render like Капитал’s `hasAccounts`.  
**How to avoid:** D-12 — always show hero (even `0` / `0`).

### Pitfall 6: Partial banner without naming currencies
**What goes wrong:** User cannot fix FX.  
**Why:** Current `/` banner is copy-only [VERIFIED: src/app/page.tsx:138-149].  
**How to avoid:** D-13/D-14 — list excluded entities + reason (`нет курса` / `нет баланса`); reuse list-row wording from `DashboardAccountList` where possible [VERIFIED: DashboardAccountList.tsx:186-224].

### Pitfall 7: Mutating open date on edit
**What goes wrong:** Series start drifts; audit trail lies.  
**How to avoid:** D-09 — create-only field; update path omits `openedAsOf` like `initialAmountMinor`.

## Code Examples

### Existing totals (do not reimplement)

```typescript
// Source: src/lib/debts.ts:175-196
export function computeDebtPrimaryTotals(
  debts: readonly DebtPrimaryTotalsInput[],
): {
  rows: DebtPrimaryTotalsRow[];
  iOwePrimaryMinor: bigint;
  theyOwePrimaryMinor: bigint;
  isPartial: boolean;
} {
  const open = debts.filter((d) => d.status === "OPEN");
  const rows = open.map((d) => rowForOpen(d));
  // ... aggregates ...
  const isPartial = rows.some((row) => !row.includedInTotal);
  return { rows, iOwePrimaryMinor, theyOwePrimaryMinor, isPartial };
}
```

### Remaining / principal (series must stay consistent)

```typescript
// Source: src/lib/debts.ts:10-28
export function currentPrincipalMinor(
  initialAmountMinor: bigint,
  sizeDeltas: readonly bigint[],
): bigint {
  return sizeDeltas.reduce((sum, d) => sum + d, initialAmountMinor);
}

export function remainingMinor(
  initialAmountMinor: bigint,
  sizeDeltas: readonly bigint[],
  repaymentAmounts: readonly bigint[],
): bigint {
  const principal = currentPrincipalMinor(initialAmountMinor, sizeDeltas);
  const paid = repaymentAmounts.reduce((sum, a) => sum + a, 0n);
  return principal - paid;
}
```

### History tab mount point

```tsx
// Source: src/components/debts/DebtDetailDialog.tsx:520-524
{tab === "history" ? (
  <div className="grid gap-2" role="tabpanel" aria-label="История">
    {timeline.length === 0 ? (
      <p className="text-sm text-muted-foreground">Пока нет событий</p>
```

Insert chart **above** this empty/list branch (D-01/D-02). Empty timeline still shows flat chart (discretion microcopy).

### Капитал banner today (extend, don’t replace math)

```tsx
// Source: src/app/page.tsx:138-149
{hasAccounts && isPartial ? (
  <div className="rounded-lg border border-border bg-muted/60 p-4" role="status">
    <p className="text-sm font-medium text-foreground">Итог неполный</p>
    <p className="mt-1 text-sm text-muted-foreground">
      Не все счета учтены в сумме: у части счетов нет баланса или нет
      курса валюты. Задайте балансы на странице «Счета» и курсы на
      «Курсы».
    </p>
  </div>
) : null}
```

Add excluded account list under helper copy using `rows.filter(r => !r.includedInTotal)` + account name/currency/`excludeReason` (`"no_balance" | "no_fx"`) [VERIFIED: src/lib/net-worth.ts:26].

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Two charts (remaining + repayment) in milestone research | One stacked composition chart | Phase 11 CONTEXT | DCHART-01+02 one UI |
| Client RangePreset on debt charts (ARCHITECTURE.md) | «всё» only | Phase 11 D-05 | No preset chrome |
| Series deferred (Phase 8 D-23) | Implement in Phase 11 | now | New pure builder |
| Totals helper unused in UI | Wire on `/debts` | Phase 11 | DTOTAL-01 |
| Banner copy-only on `/` | Banner + excluded list | Phase 11 D-14 | Honesty UX parity |

**Deprecated/outdated:**
- `buildDebtRemainingSeries` / `buildDebtRepaymentSeries` as separate APIs — replace with one stack builder name (e.g. `buildDebtPrincipalStackSeries`).
- Write-off field narrative in SUMMARY.md — Phase 8 uses size-change downs; series must treat size-change deltas, not a writeOff column.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Field name `openedAsOf` is acceptable | Pattern 4 | Rename cost if user prefers another name |
| A2 | Backfill TZ = Europe/Moscow from `createdAt` | Pattern 4 | Off-by-one calendar day vs UTC `date(createdAt)` |
| A3 | Emit one chart point per distinct `asOfDate` (end-of-day) | Pitfall 2 | If product wants per-event mid-day steps, need unique X strategy |
| A4 | Tertiary sort key `kind` when `(asOfDate,id)` collide across tables | Pitfall 3 | Rare; only matters if not collapsing to end-of-day |
| A5 | Stack series keys `repaidMajor` / `remainingMajor` | Pattern 1 | Cosmetic only |
| A6 | Chart component under `src/components/debts/` | Structure | Cosmetic |

## Open Questions (RESOLVED)

1. **Same-day multi-event point emission**
   - What we know: D-04 says step on events; Phase 8 allows multiple events per day; Recharts dislikes duplicate categories.
   - What's unclear: per-event vs end-of-day emission.
   - Recommendation: end-of-day one point (A3); document in plan assumptions.
   - **RESOLVED:** A3 — emit one chart point per distinct `asOfDate` after applying that day's events in D-07 order (end-of-day collapse). Locked in 11-01 plan assumptions.

2. **Cross-table id ordering tertiary key**
   - What we know: D-07 says asOfDate then id; ids are per-table.
   - What's unclear: repayment vs sizeChange when ids equal.
   - Recommendation: add `kind` tertiary; with A3, display unaffected.
   - **RESOLVED:** A4 — tertiary sort key `kind` with repayment before sizeChange when `(asOfDate, id)` collide across tables. Locked in 11-01 plan assumptions.

3. **Excluded debt list identity**
   - What we know: totals rows expose `debtId`, `excludeReason`, `remainingNativeMinor` — not person name/currency.
   - What's unclear: exact row label.
   - Recommendation: join person name + `currencyCode` on page when rendering excluded list (discretion RU wording).
   - **RESOLVED:** Join person name + `currencyCode` on `/debts` page when rendering excluded rows (discretion RU wording OK if currency visible). Locked in 11-03 assumptions.

4. **Hero when there are zero people/debts**
   - What we know: D-12 says always show including 0/0.
   - What's unclear: show before empty-state CTA or with it.
   - Recommendation: show hero whenever page loads (even empty DB) with `0` primary amounts; keep empty list CTA below.
   - **RESOLVED:** Hero always shown on page load with `0` / `0` primary amounts even when people/debts empty; empty-list CTA stays below (D-12). Locked in 11-03.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | build/test | ✓ | v24.5.0 | — |
| npm | scripts | ✓ | 10.9.3 | — |
| Vitest | Nyquist / unit | ✓ | 4.1.11 | — |
| Docker | optional app runtime | ✓ | 29.5.3 | host `npm run dev` per OPERATOR |
| recharts (installed) | chart UI | ✓ | 3.10.1 | — |
| SQLite / Prisma | migration | ✓ | prisma 7.10.0 | — |
| Context7 / ctx7 CLI | docs seam | ✗ | — | Official Recharts WebFetch used |
| gsd graphify | codebase graph | ✗ disabled | — | `codegraph` CLI used |

**Missing dependencies with no fallback:** none for implementation.  
**Missing dependencies with fallback:** Context7 → WebFetch official docs; graphify → codegraph.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.11 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run src/lib/debts.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DCHART-01/02 | Stack points: open flat, step repay/size, flat to today; repaid+remaining=principal; native only | unit | `npx vitest run src/lib/debts.test.ts -t stack` | ❌ Wave 0 — extend `debts.test.ts` |
| DCHART-01/02 | Event order asOfDate then id | unit | same | ❌ Wave 0 |
| DTOTAL-01 | Helper already covers OPEN/FX/`isPartial` | unit | `npx vitest run src/lib/debts.test.ts -t computeDebtPrimaryTotals` | ✅ |
| DTOTAL-01 | Page wiring / hero always visible | manual / Orca UAT | OPERATOR flow | ❌ automated UI |
| DISOL-01 | No debt imports in NW modules; NW fixtures unchanged | unit + grep | `npx vitest run src/lib/net-worth.test.ts` + import grep | ✅ math; ❌ add explicit import-ban test if desired |
| D-08/D-09 | Zod requires openedAsOf; update rejects mutation | unit | `npx vitest run src/lib/validations/debts.test.ts` | ❌ Wave 0 extend |

### Sampling Rate

- **Per task commit:** `npx vitest run src/lib/debts.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] Extend `src/lib/debts.test.ts` — `buildDebtPrincipalStackSeries` cases (open→today, repay step, size-change height, multi-day, today flat)
- [ ] Extend `src/lib/validations/debts.test.ts` — required `openedAsOf`; update schema omits field
- [ ] Optional: `src/lib/disol.test.ts` or lint grep — forbid `@/lib/debts` in `net-worth.ts` / `historical-series.ts`
- [ ] No new framework install

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Single-user local app |
| V3 Session Management | no | — |
| V4 Access Control | no | No multi-user |
| V5 Input Validation | yes | Zod date regex `YYYY-MM-DD`; positive amounts existing |
| V6 Cryptography | no | — |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Invalid / future-abuse open date strings | Tampering | Zod regex; product allows past dates; no need to forbid future unless plan adds it [ASSUMED: allow any valid calendar date like dueDate] |
| Mass assignment of immutable open date on update | Tampering | `.strict()` schemas omit field; mirror initial immutability |
| Chart XSS via note in tooltip | XSS | Don’t put unsanitized HTML in Recharts; text only (existing pattern) |

## Project Constraints (from .cursor/rules/)

No `.cursor/rules/` directory present in this workspace. Binding project instructions instead:

- `AGENTS.md` / `CLAUDE.md`: This is **not** stock Next.js — read `node_modules/next/dist/docs/` before assuming App Router APIs when touching routes/actions.
- UI constitution (PROJECT.md): no `window.confirm` for destructive flows (unchanged this phase).
- Prefer `codegraph` for codebase search (used; gsd graphify disabled).

## Sources

### Primary (HIGH confidence)

- `src/lib/debts.ts` — remaining, totals, exclude reasons (Read)
- `prisma/schema.prisma` — Debt model (Read)
- `src/components/debts/DebtDetailDialog.tsx` — history tab + timeline sort (Read / codegraph node)
- `src/app/debts/page.tsx` — no totals hero yet (Read)
- `src/app/page.tsx` — Капитал banner (Read)
- `src/components/dashboard/NetWorthHistoryChart.tsx` — chart shell precedent (Read)
- `src/lib/net-worth.ts` — `NetWorthExcludeReason` (Read)
- `src/lib/validations/debts.ts` — create schemas (codegraph node)
- `package.json` / `npm view recharts` — versions
- https://recharts.github.io/en-US/api/Area/ — `type` includes `stepAfter`; `stackId`
- https://recharts.github.io/en-US/api/AreaChart/ — `stackOffset` default `"none"`
- Phase 11 `11-CONTEXT.md` — locked D-01..D-14
- Phase 8 `08-CONTEXT.md` — D-10/D-16..D-19/D-23/D-24

### Secondary (MEDIUM confidence)

- `.planning/research/{ARCHITECTURE,FEATURES,PITFALLS,SUMMARY,STACK}.md` — superseded where noted
- https://github.com/recharts/recharts/issues/4698 — monotone stack overlap

### Tertiary (LOW confidence)

- Same-day emission / tertiary kind sort (assumptions A3–A4)
- Backfill timezone choice (A2)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — reuse pinned recharts; no new packages
- Architecture: HIGH — seams and files verified via Read/codegraph
- Pitfalls: HIGH — isolation + FX native/primary split from prior research + code
- Chart point collapsing: MEDIUM — discretion interpretation of D-04

**Research date:** 2026-09-06  
**Valid until:** 2026-10-06 (stack stable; recharts API slow-moving)

**Tooling notes:** gsd `graphify` disabled; used `codegraph` for symbol/impact queries. Context7 MCP/CLI unavailable; Recharts claims from official WebFetch.
