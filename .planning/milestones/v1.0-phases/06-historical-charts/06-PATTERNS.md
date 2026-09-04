# Phase 6: Historical Charts - Pattern Map

**Mapped:** 2026-09-04
**Files analyzed:** 11
**Analogs found:** 8 / 11

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/historical-series.ts` | utility | transform | `src/lib/net-worth.ts` (+ LOCF maps in `src/app/page.tsx`) | exact |
| `src/lib/historical-series.test.ts` | test | transform | `src/lib/net-worth.test.ts` | exact |
| `src/lib/dates.ts` | utility | transform | `src/lib/dates.ts` (extend in place) | exact |
| `src/lib/dates.test.ts` | test | transform | `src/lib/dates.test.ts` | exact |
| `src/app/page.tsx` | route | request-response | `src/app/page.tsx` (extend in place) | exact |
| `src/components/dashboard/DashboardChartsShell.tsx` | component | request-response | `src/components/accounts/AccountList.tsx` | role-match |
| `src/components/dashboard/DashboardRangeControl.tsx` | component | request-response | `src/components/nav.tsx` + `src/components/ui/button.tsx` | role-match |
| `src/components/dashboard/NetWorthHistoryChart.tsx` | component | transform | — (no chart lib in repo) | none |
| `src/components/dashboard/AccountHistoryChart.tsx` | component | transform | expand chrome: `AccountList.tsx`; chart: none | partial |
| `src/components/dashboard/DashboardAccountList.tsx` | component | request-response | expand: `AccountList.tsx`; list shell: self | exact |
| `src/components/ui/chart.tsx` | component | request-response | `src/components/ui/button.tsx` (shadcn UI install shape) | role-match |

## Pattern Assignments

### `src/lib/historical-series.ts` (utility, transform)

**Analog:** `src/lib/net-worth.ts` (contribution rules) + `src/app/page.tsx` (batch LOCF maps)

**Imports pattern** (`net-worth.ts` lines 1–2):
```typescript
import { creditDebtMinor } from "@/lib/balances";
import { convertOtherMinorToPrimaryMinor } from "@/lib/fx";
```

**Core reuse — call `computeNetWorthRows` per sample date** (`net-worth.ts` lines 58–70):
```typescript
export function computeNetWorthRows(accounts: NetWorthAccountInput[]): {
  rows: NetWorthRow[];
  totalPrimaryMinor: bigint;
  isPartial: boolean;
} {
  const rows = accounts.map((account) => rowFor(account));
  const totalPrimaryMinor = rows.reduce(
    (sum, row) => sum + row.contributionPrimaryMinor,
    0n,
  );
  const isPartial = rows.some((row) => !row.includedInTotal);
  return { rows, totalPrimaryMinor, isPartial };
}
```
Planner note: chart NW Y = `totalPrimaryMinor` (ignore `isPartial` for point marking — D-14). Credit **stack** series must NOT use NW contribution alone; use `creditDebtMinor` + available, then convert both in primary mode (D-11/D-12). Pitfall: dashboard primary column is debt-only (`net-worth.ts` lines 102–121) — chart stacks available + debt.

**Batch LOCF map pattern** (`page.tsx` lines 47–71) — generalize to parameterized as-of D:
```typescript
const locfByAccount = new Map<
  number,
  { asOfDate: string; amountMinor: bigint }
>();
for (const snap of snapshotsLteToday) {
  if (!locfByAccount.has(snap.accountId)) {
    locfByAccount.set(snap.accountId, {
      asOfDate: snap.asOfDate,
      amountMinor: snap.amountMinor,
    });
  }
}

const locfByCurrency = new Map<
  string,
  { asOfDate: string; rateToPrimaryScaled: bigint }
>();
for (const rate of ratesLteToday) {
  if (!locfByCurrency.has(rate.currencyCode)) {
    locfByCurrency.set(rate.currencyCode, {
      asOfDate: rate.asOfDate,
      rateToPrimaryScaled: rate.rateToPrimaryScaled,
    });
  }
}
```
For historical series: either filter descending arrays with `asOfDate <= D` first-wins, or rebuild maps from rows pre-sorted desc and stop when `asOfDate > D`. Same first-wins invariant as today maps.

**NetWorthAccountInput assembly** (`page.tsx` lines 76–92):
```typescript
const inputs: NetWorthAccountInput[] = accounts.map((account) => {
  const locf = locfByAccount.get(account.id) ?? null;
  const rate = locfByCurrency.get(account.currencyCode) ?? null;
  return {
    id: account.id,
    type: account.type,
    currencyCode: account.currencyCode,
    currencyScale: account.currency.scale,
    isPrimaryCurrency: account.currency.isPrimary,
    creditLimitMinor: account.creditLimitMinor,
    locfAmountMinor: locf?.amountMinor ?? null,
    rateToPrimaryScaled: account.currency.isPrimary
      ? null
      : (rate?.rateToPrimaryScaled ?? null),
    primaryScale,
  };
});
```

**Primary identity vs FX null** (`net-worth.ts` lines 40–56):
```typescript
function toPrimaryMinor(
  account: NetWorthAccountInput,
  nativeMinor: bigint,
): bigint | null {
  if (account.isPrimaryCurrency) {
    return nativeMinor;
  }
  if (account.rateToPrimaryScaled === null) {
    return null;
  }
  return convertOtherMinorToPrimaryMinor(
    nativeMinor,
    account.rateToPrimaryScaled,
    account.currencyScale,
    account.primaryScale,
  );
}
```
Apply same for account primary-mode points: skip when null (D-16).

**Credit debt helper** (`balances.ts` lines 15–21):
```typescript
export function creditDebtMinor(
  creditLimitMinor: bigint,
  availableMinor: bigint,
): bigint {
  return creditLimitMinor - availableMinor;
}
```

**Chart Y boundary** (`money.ts` lines 63–74) — majors as `number` only at chart boundary:
```typescript
export function formatMinorToMajor(minor: bigint, scale: number): string {
  // ... exact decimal string
}
// At series→chart edge: Number(formatMinorToMajor(minor, scale))
```

---

### `src/lib/historical-series.test.ts` (test, transform)

**Analog:** `src/lib/net-worth.test.ts`

**Imports + fixture helper** (lines 1–18):
```typescript
import { describe, expect, it } from "vitest";
import type { NetWorthAccountInput } from "./net-worth";
import { computeNetWorthRows } from "./net-worth";

function input(
  overrides: Partial<NetWorthAccountInput> & Pick<NetWorthAccountInput, "id" | "type">,
): NetWorthAccountInput {
  return {
    currencyCode: "RUB",
    currencyScale: 2,
    isPrimaryCurrency: true,
    creditLimitMinor: null,
    locfAmountMinor: 0n,
    rateToPrimaryScaled: null,
    primaryScale: 2,
    ...overrides,
  };
}
```

**Assertion style — BigInt exact** (lines 21–33):
```typescript
describe("computeNetWorthRows (NW-01–03, ACCT-03)", () => {
  it("sums asset in primary currency", () => {
    const { totalPrimaryMinor, isPartial, rows } = computeNetWorthRows([
      input({
        id: 1,
        type: "FIAT_DEBIT",
        locfAmountMinor: 100_000n,
      }),
    ]);
    expect(totalPrimaryMinor).toBe(100_000n);
    expect(isPartial).toBe(false);
  });
});
```

**CHART-03 style — later FX must not rewrite earlier point:** mirror FX LOCF dating from `src/lib/fx.test.ts` lines 25–41 (as-of between two rates returns earlier). Build fixtures with rates on D₁ and D₂; assert series point at mid-date uses D₁ rate.

**Pure lib tests only** — no Prisma mock needed if builders take in-memory snapshot/rate arrays (prefer over `fx.test.ts` `vi.mock("@/lib/db")` pattern).

---

### `src/lib/dates.ts` + `src/lib/dates.test.ts` (utility/test, transform)

**Analog:** same files (extend)

**Existing API** (`dates.ts` lines 1–10):
```typescript
/** YYYY-MM-DD → DD.MM.YYYY */
export function formatAsOfDisplay(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
}
```

**Calendar math style** — pure UTC date reconstruction already used in `parseAsOfDisplay` (lines 16–33). New `addCalendarDays` / `windowStartForPreset` should stay pure YYYY-MM-DD string math (no `Date` local TZ drift). Today endpoint still from `calendarDateToday("Europe/Moscow")` in `balances.ts` lines 27–40.

**Test pattern** (`dates.test.ts` lines 1–8):
```typescript
import { describe, expect, it } from "vitest";
import { formatAsOfDisplay, parseAsOfDisplay } from "@/lib/dates";

describe("formatAsOfDisplay", () => {
  it("formats YYYY-MM-DD as DD.MM.YYYY", () => {
    expect(formatAsOfDisplay("2026-09-03")).toBe("03.09.2026");
  });
});
```

---

### `src/app/page.tsx` (route, request-response)

**Analog:** self — extend layout only; keep batch fetch + hero math.

**Imports** (lines 1–8):
```typescript
import { DashboardAccountList } from "@/components/dashboard/DashboardAccountList";
import { calendarDateToday } from "@/lib/balances";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
import { formatMinorToMajor } from "@/lib/money";
import {
  computeNetWorthRows,
  type NetWorthAccountInput,
} from "@/lib/net-worth";
```

**RSC shell + error boundary** (lines 10–15, 134–169):
```typescript
export const dynamic = "force-dynamic";

export default async function Home() {
  try {
    await ensureSqlitePragmas();
    const today = calendarDateToday("Europe/Moscow");
    // ... Promise.all batch ...
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 font-sans">
        {/* Hero «Капитал» */}
        {/* INSERT: DashboardChartsShell (range + NW chart) */}
        <DashboardAccountList accounts={listRows} primaryCode={primaryCode} />
      </main>
    );
  } catch (error) {
    console.error("Dashboard data load failed", error);
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 font-sans">
        <p className="text-base text-foreground">
          Не удалось загрузить данные. Проверьте базу данных и обновите
          страницу.
        </p>
      </main>
    );
  }
}
```

**Layout order (D-03):** Hero → NW chart shell → account list. Keep today partial banner (lines 144–156) for *today* only — do not mark chart points (D-14).

**RSC→client serialization:** list already passes plain strings (`nativeDisplay`, etc.). Snapshots/rates for series must serialize `amountMinor` / `rateToPrimaryScaled` as **strings** (same as `AccountListItem.creditLimitMinor: string | null` in `AccountList.tsx` lines 29–30). Never pass BigInt props to client islands.

---

### `src/components/dashboard/DashboardChartsShell.tsx` (component, request-response)

**Analog:** `src/components/accounts/AccountList.tsx` — `"use client"` + local `useState`

**Client directive + state** (`AccountList.tsx` lines 1–3, 153–154):
```typescript
"use client";

import { useState, useTransition } from "react";
// ...
const [expanded, setExpanded] = useState(false);
```

Shell holds `useState<RangePreset>("30d")` (D-06/D-08); pass `range` + `onRangeChange` to `DashboardRangeControl`, NW chart, and expanded account chart. No `searchParams` — app has none (`nav.tsx` uses pathname only).

---

### `src/components/dashboard/DashboardRangeControl.tsx` (component, request-response)

**Analog:** `src/components/nav.tsx` (active segment styling) + `src/components/ui/button.tsx` (`variant` / `aria-expanded`)

**Active segment pattern** (`nav.tsx` lines 32–41):
```typescript
<Link
  href={href}
  className={cn(
    "text-muted-foreground transition-colors hover:text-foreground",
    active &&
      "font-semibold text-foreground underline decoration-2 underline-offset-4",
  )}
>
  {label}
</Link>
```

**Button variants for selected preset** (`button.tsx` lines 10–17) — use `outline`/`secondary` + `aria-pressed` or selected styles; keep Russian labels (discretion: `30д / 90д / 1г / всё`).

---

### `src/components/dashboard/NetWorthHistoryChart.tsx` (component, transform)

**Analog:** none in repo (no Recharts yet). Follow RESEARCH Pattern 4 + shadcn Chart docs after `npx shadcn@latest add chart`.

**UI chrome to mirror:** `max-w-3xl` / Russian labels from `page.tsx`; `--chart-*` tokens already in `globals.css` lines 70–74:
```css
--chart-1: oklch(0.87 0 0);
--chart-2: oklch(0.556 0 0);
--chart-3: oklch(0.439 0 0);
--chart-4: oklch(0.371 0 0);
--chart-5: oklch(0.269 0 0);
```

**Required behaviors from CONTEXT (no local code analog):**
- `data={[]}` → axes still visible (D-13)
- `data.length === 1` → `dot={true}`, no connecting segment (D-15)
- `connectNulls={false}` (default)
- `ChartContainer` must have explicit height (`h-[200px] w-full`)

---

### `src/components/dashboard/AccountHistoryChart.tsx` (component, transform)

**Analog (chrome):** expand body + toggle buttons from `AccountList.tsx`; chart: none (same as NW chart).

**Expand body chrome** (`AccountList.tsx` lines 272–287) — replace history list with chart only (D-04):
```typescript
{expanded && hasHistory ? (
  <div className="bg-muted/40 pl-4 sm:pl-14">
    <p className="px-4 pt-3 text-sm text-muted-foreground">История</p>
    {/* Phase 6: AccountHistoryChart only — no HistoryRow / delete */}
  </div>
) : null}
```

**Native ↔ primary toggle:** default native (D-09); hide when account currency === primary (D-10). Labels can mirror dashboard headers: «В валюте счёта» / `В ${primaryCode}` (`DashboardAccountList.tsx` lines 38–48).

**Credit stack:** two `Area` with shared `stackId` (RESEARCH); both convert in primary mode (D-12). Do not copy primary column debt-only display from `PrimaryColumn` (`DashboardAccountList.tsx` lines 116–121).

---

### `src/components/dashboard/DashboardAccountList.tsx` (component, request-response)

**Analog:** self for list layout; `AccountList.tsx` `AccountRow` for expand affordance.

**Current list row** (`DashboardAccountList.tsx` lines 50–66) — add chevron + expand slot:
```typescript
<ul className="rounded-lg border border-border bg-background">
  {accounts.map((account) => (
    <li
      key={account.id}
      className="border-b border-border last:border-b-0"
    >
      <div className="flex flex-col gap-1 px-4 py-3 sm:grid sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-4">
        {/* INSERT: expand Button like AccountRow */}
        <p className="min-w-0 truncate text-base text-foreground" title={account.name}>
          {account.name}
        </p>
        <NativeColumn account={account} />
        <PrimaryColumn account={account} />
      </div>
    </li>
  ))}
</ul>
```

**Expand control** (`AccountList.tsx` lines 196–214):
```typescript
<Button
  type="button"
  variant="ghost"
  size="icon"
  className="min-h-11 min-w-11 shrink-0"
  aria-expanded={expanded}
  aria-label={
    expanded
      ? "Скрыть историю балансов"
      : "Показать историю балансов"
  }
  onClick={() => setExpanded((v) => !v)}
>
  {expanded ? (
    <ChevronDown className="size-4" aria-hidden />
  ) : (
    <ChevronRight className="size-4" aria-hidden />
  )}
</Button>
```
Phase 6 aria labels: chart show/hide (not balance history). File must become `"use client"` (or extract client row) once expand state lands — currently server-friendly with no hooks.

**Props growth:** need `currencyCode` (or `isPrimaryCurrency`) for toggle hide (D-10) + series payloads / shared range from shell.

---

### `src/components/ui/chart.tsx` (component, request-response)

**Analog:** install via shadcn like existing `src/components/ui/button.tsx` — `"use client"`, `@/lib/utils` `cn`, CVA/theme tokens.

Do **not** hand-roll. After install, pin `recharts@3.10.1`. Use `var(--chart-N)` not `hsl(var(--chart-N))` (Recharts 3 / RESEARCH).

---

## Shared Patterns

### RSC batch load + LOCF maps
**Source:** `src/app/page.tsx` lines 17–94  
**Apply to:** `page.tsx` (reuse fetch); `historical-series.ts` (per-date maps from same arrays)  
Keep single `Promise.all` for accounts / primary / snapshots≤today / rates≤today. Series builders are pure over those arrays.

### Net-worth contribution rules
**Source:** `src/lib/net-worth.ts` `computeNetWorthRows`  
**Apply to:** NW historical points only  
Partial totals still plot (D-14); do not surface `isPartial` on chart points. Today hero banner stays as-is.

### BigInt never crosses RSC→client
**Source:** `AccountList.tsx` `creditLimitMinor: string | null`; `page.tsx` pre-formatted displays  
**Apply to:** all chart props and series JSON  
Serialize minors/rates as strings; rebuild `BigInt(...)` inside pure builders if client recomputes on preset change.

### Client islands
**Source:** `AccountList.tsx`, `nav.tsx`  
**Apply to:** ChartsShell, RangeControl, charts, expandable DashboardAccountList  
`"use client"`; local `useState`; Russian UI; `Button` from `@/components/ui/button`.

### Vitest pure-lib tests
**Source:** `src/lib/net-worth.test.ts`, `src/lib/dates.test.ts`  
**Apply to:** `historical-series.test.ts`, date window helpers  
`describe`/`it`/`expect`; fixture helpers; BigInt assertions. Run: `npm test -- src/lib/historical-series.test.ts`.

### Error handling (dashboard)
**Source:** `src/app/page.tsx` lines 160–169  
**Apply to:** page only  
`try/catch` + Russian error copy; no new Server Actions for charts.

### Auth
N/A — single-local-user app; no auth middleware.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/components/dashboard/NetWorthHistoryChart.tsx` | component | transform | No chart library or chart components in repo yet |
| `src/components/dashboard/AccountHistoryChart.tsx` | component | transform | Same — use RESEARCH/shadcn Chart + Recharts stackId; only expand/toggle chrome has analogs |
| `src/components/ui/chart.tsx` | component | request-response | Generated by `shadcn add chart` — copy upstream template, not invent |

## Metadata

**Analog search scope:** `src/app`, `src/lib`, `src/components` via codegraph (`query`/`node`/`files`) + tracked-source gate (`git ls-files`)  
**Files scanned:** ~51 app/lib/component TS/TSX sources; codegraph index 610 files (mostly tooling)  
**Pattern extraction date:** 2026-09-04  
**codegraph note:** index stale for some Phase 5 files (`net-worth.ts`, `DashboardAccountList.tsx`); those read directly. Prefer `codegraph sync` before next phase mapping.
