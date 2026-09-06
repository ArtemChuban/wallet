# Phase 11: Charts + primary totals - Pattern Map

**Mapped:** 2026-09-06
**Files analyzed:** 15
**Analogs found:** 15 / 15

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/debts.ts` (+ `buildDebtPrincipalStackSeries`) | utility | transform | `src/lib/debts.ts` (`remainingMinor` / `computeDebtPrimaryTotals`); series walk shape from `src/lib/historical-series.ts` `buildNetWorthSeries` (do **not** import debts there) | exact (domain) / role-match (series walk) |
| `src/lib/debts.test.ts` | test | transform | `src/lib/debts.test.ts` | exact |
| `src/lib/validations/debts.ts` | config | request-response | `src/lib/validations/debts.ts` (`asOfDateSchema`, `createDebtSchema`, `updateDebtMetaSchema`) | exact |
| `src/lib/validations/debts.test.ts` | test | request-response | `src/lib/validations/debts.test.ts` (create + update immutability) | exact |
| `src/app/debts/actions.ts` | controller | request-response | `src/app/debts/actions.ts` (`createDebt`, `updateDebtMeta`) | exact |
| `src/app/debts/actions.test.ts` | test | request-response | `src/app/debts/actions.test.ts` (create accepts dates; update rejects smuggled immutable keys) | exact |
| `src/app/debts/page.tsx` | route | request-response | `src/app/page.tsx` (hero + LOCF + partial banner) | role-match |
| `src/components/debts/DebtsPrimaryTotalsHero.tsx` | component | request-response | `src/app/page.tsx` Капитал hero columns + «Итог неполный» banner block; exclude-row wording from `DashboardAccountList.tsx` | role-match (hero+banner) |
| `src/components/debts/DebtPrincipalStackChart.tsx` | component | transform | `src/components/dashboard/NetWorthHistoryChart.tsx` | role-match (shell); **not** `stackOffset="sign"` / RangePreset |
| `src/components/debts/DebtDetailDialog.tsx` | component | request-response | `src/components/debts/DebtDetailDialog.tsx` (history tab + `buildTimeline`) | exact |
| `src/components/debts/DebtFormDialog.tsx` | component | request-response | `src/components/debts/DebtFormDialog.tsx` (create-only initial + `dueDate` date input) | exact |
| `src/app/page.tsx` | route | request-response | `src/app/page.tsx` banner + `src/components/dashboard/DashboardAccountList.tsx` exclude copy | exact / role-match |
| `src/lib/disol.test.ts` | test | isolation | Phase 8 DISOL scan in `src/lib/debts.test.ts` `describe("DISOL-01 isolation")` (`readFileSync` + no debts-import assert) | role-match (extract durable scan) |
| `prisma/schema.prisma` | model | CRUD | `prisma/schema.prisma` `Debt` | exact |
| `prisma/migrations/<ts>_debt_opened_as_of/` | migration | CRUD | `prisma/migrations/20260903005200_account_credit_limit_check/migration.sql` | role-match |

## Pattern Assignments

### `src/lib/debts.ts` (utility, transform)

**Analog (domain home):** `src/lib/debts.ts` — add series next to remaining/totals; reuse principal math.

**Imports / principal math** (lines 10–28):
```typescript
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

**Immutability assert to mirror for open date** (lines 91–98):
```typescript
export function assertInitialImmutable(
  storedInitialMinor: bigint,
  proposedInitialMinor: bigint,
): void {
  if (proposedInitialMinor !== storedInitialMinor) {
    throw new Error("initialAmountMinor is immutable after create");
  }
}
```

**Totals row shape for excluded-list wiring** (lines 119–129, 175–196):
```typescript
export type DebtExcludeReason = "none" | "no_fx";

export type DebtPrimaryTotalsRow = {
  debtId: number;
  direction: DebtDirection;
  includedInTotal: boolean;
  excludeReason: DebtExcludeReason;
  contributionPrimaryMinor: bigint;
  remainingNativeMinor: bigint;
};

export function computeDebtPrimaryTotals(
  debts: readonly DebtPrimaryTotalsInput[],
): {
  rows: DebtPrimaryTotalsRow[];
  iOwePrimaryMinor: bigint;
  theyOwePrimaryMinor: bigint;
  isPartial: boolean;
} { /* OPEN filter + aggregates + isPartial */ }
```

**Analog (series walk shape only):** `src/lib/historical-series.ts` `buildNetWorthSeries` (lines 73–134) — pure function, sample dates, map to points. **DISOL-01:** implement in `debts.ts`; never import `@/lib/debts` into `historical-series.ts` / `net-worth.ts`.

**Core series pattern to implement (from RESEARCH + D-04/06/07):**
- Input: `openedAsOf`, `initialAmountMinor`, repayments `{id, asOfDate, amountMinor}[]`, sizeChanges `{id, asOfDate, deltaMinor}[]`, `today`, currency `scale` (majors at boundary via `minorToMajorNumber`).
- Sort events ascending: `asOfDate`, then `id`, then tertiary `kind` (`"repayment"` before `"sizeChange"` — pick one, test it).
- Emit **one point per distinct `asOfDate`** (end-of-day collapse).
- Seed at open: repaid=0, remaining=initial; flat open→first event; flat last→today.
- Invariant: `repaid + remaining === currentPrincipal` at every point.

---

### `src/lib/debts.test.ts` (test, transform)

**Analog:** `src/lib/debts.test.ts`

**Imports / helper pattern** (lines 1–28):
```typescript
import { describe, expect, it } from "vitest";
import type { DebtPrimaryTotalsInput } from "./debts";
import {
  computeDebtPrimaryTotals,
  currentPrincipalMinor,
  remainingMinor,
  // ...add buildDebtPrincipalStackSeries
} from "./debts";

function debtInput(
  overrides: Partial<DebtPrimaryTotalsInput> &
    Pick<DebtPrimaryTotalsInput, "id" | "direction" | "remainingMinor">,
): DebtPrimaryTotalsInput { /* defaults */ }
```

**Describe style** (lines 30–34): group by concern (`describe("DEBT-02 remaining...")`); add `describe("buildDebtPrincipalStackSeries")` with cases: open→today flat, repay step, size-change height, multi-day, same-day collapse, order by asOfDate/id/kind.

---

### `src/lib/validations/debts.ts` (config, request-response)

**Analog:** same file — required calendar date + create schemas + update omits immutable fields.

**Date regex** (lines 3–5, 15–19):
```typescript
const asOfDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Укажите дату");

const optionalDueDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Укажите дату")
  .optional()
  .or(z.literal("").transform(() => undefined));
```

**Create schema extend** (lines 62–80): add required `openedAsOf: asOfDateSchema` to both `createDebtSchema` and `createDebtWithNewPersonSchema`.

**Update omits immutable** (lines 109–116) — do **not** add `openedAsOf`:
```typescript
export const updateDebtMetaSchema = z
  .object({
    debtId: z.coerce.number().int().positive(),
    direction: debtDirectionSchema.optional(),
    dueDate: optionalDueDateSchema,
    note: optionalNoteSchema,
  })
  .strict();
```

---

### `src/lib/validations/debts.test.ts` (test, request-response)

**Analog:** same file — create accepts date fields; update rejects smuggled immutable keys.

**Immutability shape tests** (lines 147–160):
```typescript
it("has no initialAmount/initialMajor field", () => {
  const shape = updateDebtMetaSchema.shape;
  expect(shape).not.toHaveProperty("initialAmountMajor");
  // also: not.toHaveProperty("openedAsOf")
});

it("rejects unknown initial-amount keys via .strict()", () => {
  const result = updateDebtMetaSchema.safeParse({
    debtId: 1,
    initialAmountMajor: "999",
  });
  expect(result.success).toBe(false);
});
```

Extend create tests: require `openedAsOf`; reject missing/invalid; keep update free of `openedAsOf`.

---

### `src/app/debts/actions.ts` (controller, request-response)

**Analog:** same file `createDebt` / `updateDebtMeta`.

**Create parse + persist** (lines 262–300 pattern):
```typescript
const validated = createDebtSchema.safeParse({
  personId: personIdRaw,
  direction: formData.get("direction"),
  currencyCode: formData.get("currencyCode"),
  initialAmountMajor: formData.get("initialAmountMajor"),
  openedAsOf: formData.get("openedAsOf"), // NEW
  dueDate: formData.get("dueDate") ?? undefined,
  note: formData.get("note") ?? undefined,
});
// ...
await prisma.debt.create({
  data: {
    personId,
    direction,
    currencyCode,
    initialAmountMinor: resolved.initialAmountMinor,
    openedAsOf, // NEW
    dueDate,
    note,
    status: "OPEN",
  },
});
```

Mirror nested `createDebtWithNewPersonSchema` branch the same way.

**Update ignores open date** (lines 364–389) — schema.strict already drops unknown keys; do not write `openedAsOf` in `data`:
```typescript
await prisma.debt.update({
  where: { id: debtId },
  data: {
    ...(direction !== undefined ? { direction } : {}),
    dueDate: dueDate ?? null,
    note: note ?? null,
  },
});
```

---

### `src/app/debts/page.tsx` (route, request-response)

**Analog:** `src/app/page.tsx` — LOCF FX as-of today + hero + «Итог неполный».

**LOCF + helper call pattern** (`src/app/page.tsx` lines 17–83):
```typescript
const today = calendarDateToday("Europe/Moscow");
// Promise.all accounts/debts + primaryCurrency + ratesLteToday
const locfByCurrency = firstHitLocfMap(ratesLteToday, (rate) => rate.currencyCode);
const { rows, totalPrimaryMinor, isPartial } = computeNetWorthRows(inputs);
const heroAmount = formatMinorToMajor(totalPrimaryMinor, primaryScale);
```

**Hero + banner shell** (`src/app/page.tsx` lines 130–149):
```tsx
<section>
  <p className="text-sm text-muted-foreground">Капитал</p>
  <p className="font-mono text-3xl font-semibold text-foreground">
    {heroAmount} {primaryCode}
  </p>
</section>
{isPartial ? (
  <div className="rounded-lg border border-border bg-muted/60 p-4" role="status">
    <p className="text-sm font-medium text-foreground">Итог неполный</p>
    <p className="mt-1 text-sm text-muted-foreground">…</p>
  </div>
) : null}
```

**Debts page mount point today** (`src/app/debts/page.tsx` lines 85–108): insert hero **above** list (inside/near `<header>` or before `<DebtsList>`). D-12: **always** show two columns («Я должен» | «Мне должны»), even at `0` / `0` — unlike Капитал’s `hasAccounts` gate.

Wire: flatten OPEN debts → `remainingMinor` → `rateToPrimaryScaled` from LOCF → `computeDebtPrimaryTotals` → format with `formatMinorToMajor`. Excluded list: `rows.filter(r => !r.includedInTotal)` joined to person name + `currencyCode` + «нет курса».

---

### `src/components/debts/DebtPrincipalStackChart.tsx` (component, transform)

**Analog:** `src/components/dashboard/NetWorthHistoryChart.tsx`

**Imports / ChartContainer shell** (lines 1–21, 135–160):
```tsx
"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatAsOfDisplay } from "@/lib/dates";
import { formatChartNumber } from "@/lib/money";

<ChartContainer config={chartConfig} className="h-[200px] w-full">
  <AreaChart
    accessibilityLayer
    data={data}
    margin={{ left: 8, right: 8, top: 8, bottom: 0 }}
    // omit stackOffset — default "none" (do NOT copy stackOffset="sign")
  >
    <CartesianGrid vertical={false} />
    <XAxis dataKey="asOfDate" tickFormatter={formatAsOfDisplay} ... />
    <YAxis width={48} tickFormatter={formatChartNumber} ... />
    <ChartTooltip content={... /* Погашено / Остаток */} />
```

**Stack Areas — diverge from NW** (NW uses `type="linear"` + `stackOffset="sign"` lines 141, 169–183). Debt chart:
```tsx
<Area dataKey="repaidMajor" type="stepAfter" stackId="principal" fillOpacity={0.55} />
<Area dataKey="remainingMajor" type="stepAfter" stackId="principal" fillOpacity={0.55} />
```

No RangePreset chrome (D-05). No import from `@/lib/historical-series`.

---

### `src/components/debts/DebtDetailDialog.tsx` (component, request-response)

**Analog:** same file — history tab host; timeline sort is **descending** (do not reuse for chart).

**Timeline sort (descending — chart must not reuse)** (lines 100–105):
```typescript
items.sort((a, b) => {
  if (a.asOfDate !== b.asOfDate) {
    return a.asOfDate < b.asOfDate ? 1 : -1;
  }
  return b.id - a.id;
});
```

**History mount** (lines 520–524) — chart **above** empty/list branch (D-01/D-02):
```tsx
{tab === "history" ? (
  <div className="grid gap-2" role="tabpanel" aria-label="История">
    {/* <DebtPrincipalStackChart ... /> FIRST */}
    {timeline.length === 0 ? (
      <p className="text-sm text-muted-foreground">Пока нет событий</p>
```

Empty timeline still shows flat open→today chart. Pass `openedAsOf`, events, currency scale/code, `calendarDateToday()`.

Ensure `DebtRow` / page serialization includes `openedAsOf`.

---

### `src/components/debts/DebtFormDialog.tsx` (component, request-response)

**Analog:** same file — create-only immutable fields + `type="date"` input.

**Create-only initial pattern** (lines 415–421 show edit read-only): open date = create-only like initial amount; edit mode shows read-only value or omits field entirely (D-09).

**Date input pattern** (lines 424–439) — copy for required «Дата»:
```tsx
<div className="grid gap-2">
  <Label htmlFor="debt-opened">Дата</Label>
  <Input
    id="debt-opened"
    name="openedAsOf"
    type="date"
    value={openedAsOf}
    onChange={(e) => setOpenedAsOf(e.target.value)}
    aria-invalid={Boolean(state.errors?.openedAsOf)}
    disabled={isPending}
    required
  />
</div>
```

**Default:** `useState(() => calendarDateToday("Europe/Moscow"))` on create (import from `@/lib/dates`). Update create description copy if needed («Сумма, валюта, человек и дата открытия…»).

---

### `src/app/page.tsx` (route, request-response)

**Analog:** same file banner (extend) + `DashboardAccountList` exclude wording.

**Banner today** (lines 138–149) — keep copy; add excluded account list under helper:
```tsx
{hasAccounts && isPartial ? (
  <div className="rounded-lg border border-border bg-muted/60 p-4" role="status">
    <p className="text-sm font-medium text-foreground">Итог неполный</p>
    <p className="mt-1 text-sm text-muted-foreground">…</p>
    <ul className="mt-2 grid gap-1">
      {/* rows.filter(!includedInTotal) → name · currency · нет баланса | нет курса */}
    </ul>
  </div>
) : null}
```

**Exclude reason copy** (`DashboardAccountList.tsx` lines 186–224):
```tsx
// "нет баланса" | "нет курса"
if (account.excludeReason === "no_fx") {
  return (<>… <span className="text-muted-foreground">нет курса</span></>);
}
```

Join via existing `listRows` / `rows` (`excludeReason`: `"no_balance" | "no_fx"`). **No** `@/lib/debts` imports (DISOL-01).

---

### `prisma/schema.prisma` (model, CRUD)

**Analog:** `Debt` model (lines 48–63):
```prisma
model Debt {
  id                 Int              @id @default(autoincrement())
  // ...
  initialAmountMinor BigInt
  openedAsOf         String           // YYYY-MM-DD — NEW, required
  dueDate            String? // YYYY-MM-DD
  note               String?
  status             DebtStatus       @default(OPEN)
  createdAt          DateTime         @default(now())
  // ...
}
```

---

### `prisma/migrations/<ts>_debt_opened_as_of/` (migration, CRUD)

**Analog:** SQLite redefine table — `prisma/migrations/20260903005200_account_credit_limit_check/migration.sql` (lines 1–25):
```sql
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Account" ( ... );
INSERT INTO "new_Account" (...) SELECT ... FROM "Account";
DROP TABLE "Account";
ALTER TABLE "new_Account" RENAME TO "Account";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
```

For Debt: recreate with `openedAsOf TEXT NOT NULL`; backfill in INSERT from Moscow calendar of `createdAt` (discretion; prefer Europe/Moscow over raw UTC `date(createdAt)`). Preserve FKs to Person/Currency and child tables (may need recreate order if SQLite rebuild touches Debt only — children keep `debtId` FKs).

Also update: seed / any fixtures that `prisma.debt.create`.

## Shared Patterns

### Calendar today (Europe/Moscow)
**Source:** `src/lib/dates.ts` lines 12–26  
**Apply to:** form default `openedAsOf`, series `today`, `/debts` FX as-of, chart flat-to-today
```typescript
export function calendarDateToday(timeZone: string = "Europe/Moscow"): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  // ...
  return `${year}-${month}-${day}`;
}
```

### Partial honesty banner + excluded list
**Source:** `src/app/page.tsx` lines 138–149 + `DashboardAccountList.tsx` lines 186–224  
**Apply to:** `/debts` (debts + `no_fx`) and `/` (accounts + `no_balance` | `no_fx`)
- Container: `rounded-lg border border-border bg-muted/60 p-4` `role="status"`
- Title: «Итог неполный»
- List rows must show entity identity + currency + reason

### Chart shell (Recharts + ChartContainer)
**Source:** `NetWorthHistoryChart.tsx` lines 12–21, 135–160  
**Apply to:** `DebtPrincipalStackChart` only  
- Reuse: imports, margins, `formatAsOfDisplay`, `formatChartNumber`, `h-[200px]`
- Do **not** reuse: `stackOffset="sign"`, RangePreset, `accountStackKey` / historical-series

### Immutable create-time fields
**Source:** `updateDebtMetaSchema` `.strict()` omit + `DebtFormDialog` create-only UI + `assertInitialImmutable`  
**Apply to:** `openedAsOf` same constitution as `initialAmountMinor`

### LOCF rates for primary totals
**Source:** `src/app/page.tsx` lines 38–57 (`firstHitLocfMap` on rates `lte today`)  
**Apply to:** `/debts` page before `computeDebtPrimaryTotals`

### DISOL-01 isolation
**Source:** CONTEXT / RESEARCH anti-patterns  
**Apply to:** all plans  
- No `@/lib/debts` in `net-worth.ts`, `historical-series.ts`, or dashboard chart modules
- `/` may only enrich **account** excluded list (D-14)

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| — | — | — | All phase files have tracked analogs. Closest gap: no existing `type="stepAfter"` Area in repo — use Recharts API + NW shell; do not invent custom SVG. |

## Metadata

**Analog search scope:** `src/lib/debts*`, `src/lib/validations/debts*`, `src/lib/historical-series.ts`, `src/lib/net-worth.ts`, `src/lib/dates.ts`, `src/app/page.tsx`, `src/app/debts/*`, `src/components/debts/*`, `src/components/dashboard/*`, `prisma/schema.prisma`, `prisma/migrations/`  
**Files scanned:** ~90 `src/**/*.{ts,tsx}` indexed via codegraph + targeted Reads  
**Tracked-source gate:** all named analogs verified with `git ls-files`  
**Pattern extraction date:** 2026-09-06  
**Tooling:** `codegraph` explore/node/query (gsd graphify disabled)
