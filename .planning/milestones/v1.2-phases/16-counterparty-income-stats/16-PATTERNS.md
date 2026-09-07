# Phase 16: Counterparty income stats - Pattern Map

**Mapped:** 2026-09-07
**Files analyzed:** 6
**Analogs found:** 6 / 6

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/income.ts` (+ `computePersonIncomeStats` + types) | utility | transform | `src/lib/debts.ts` (`computeDebtPrimaryTotals`) | exact |
| `src/app/income/page.tsx` | route | request-response | `src/app/income/page.tsx` (self) + FX load shape from `src/app/debts/page.tsx` | role-match |
| `src/components/income/IncomeList.tsx` (`PersonGroup` header) | component | request-response | `src/components/income/IncomeList.tsx` (`PersonGroup`) + copy from `DebtsPrimaryTotalsHero` | exact + partial |
| `src/lib/income.test.ts` | test | batch | `src/lib/debts.test.ts` (`computeDebtPrimaryTotals` suite) | exact |
| `src/components/income/income-ui.test.ts` | test | file-I/O | `src/components/income/income-ui.test.ts` (self) | exact |
| `.planning/REQUIREMENTS.md` (CPTY-01 wording) | config | transform | N/A (planning doc only) | none |

## Pattern Assignments

### `src/lib/income.ts` (utility, transform)

**Analog:** `src/lib/debts.ts` — mirror exclude / `isPartial` / `convertOtherMinorToPrimaryMinor`; **do not** import `@/lib/debts` aggregates or debt direction.

**Per-fact LOCF analog (positive):** `src/lib/historical-series.ts` — call `locfRateAsOf(rates, code, asOfDate)` inside the loop. **Do not** copy debts page `firstHitLocfMap(today)`.

**ISO constraint:** existing file header + `income.test.ts` isolation forbid Prisma / net-worth / historical-series imports. Import `@/lib/locf` + `@/lib/money` only (same as debts imports money).

**Imports pattern** (debts analog lines 1; income header lines 1–6):
```typescript
// Extend income.ts — add:
import { locfRateAsOf, type RateRow } from "@/lib/locf";
import { convertOtherMinorToPrimaryMinor } from "@/lib/money";
// Keep existing: no Prisma, no @/lib/debts, no @/lib/net-worth, no @/lib/historical-series
```

**Core exclude + convert pattern** (`src/lib/debts.ts` lines 156–221) — copy semantics, dual native+primary output per RESEARCH:
```typescript
function toPrimaryMinor(
  debt: DebtPrimaryTotalsInput,
  nativeMinor: bigint,
): bigint | null {
  if (debt.isPrimaryCurrency) {
    return nativeMinor;
  }
  if (debt.rateToPrimaryScaled === null) {
    return null;
  }
  return convertOtherMinorToPrimaryMinor(
    nativeMinor,
    debt.rateToPrimaryScaled,
    debt.currencyScale,
    debt.primaryScale,
  );
}
// Missing FX → includedInTotal: false, excludeReason: "no_fx", isPartial: true
export function computeDebtPrimaryTotals(...) {
  // ...
  const isPartial = rows.some((row) => !row.includedInTotal);
  return { rows, iOwePrimaryMinor, theyOwePrimaryMinor, isPartial };
}
```

**Per-asOf LOCF pattern** (`src/lib/locf.ts` lines 71–84 + `historical-series.ts` 112–114):
```typescript
export function locfRateAsOf(
  rates: readonly RateRow[],
  currencyCode: string,
  asOfDate: string,
): bigint | null {
  const best = pickLatestAsOf(
    rates,
    (r) => r.currencyCode === currencyCode,
    (r) => r.asOfDate,
    asOfDate,
  );
  return best?.rateToPrimaryScaled ?? null;
}

// Inside buildNetWorthSeries sample loop — correct shape for income facts:
rateToPrimaryScaled: account.isPrimaryCurrency
  ? null
  : locfRateAsOf(rates, account.currencyCode, asOfDate),
```

**Income helper shape** (from RESEARCH; planner implements):
```typescript
// For each IncomeActualFactInput:
//   native bucket[currencyCode] += amountMinor (always)
//   if isPrimaryCurrency → primary += amountMinor
//   else rate = locfRateAsOf(rates, code, actualAsOf)
//        if rate == null → excludedFactCount++; isPartial = true
//        else primary += convertOtherMinorToPrimaryMinor(...)
// Never coerce null rate → 0n. Never import debt direction.
```

**Money convert** (`src/lib/money.ts` lines 146–156):
```typescript
export function convertOtherMinorToPrimaryMinor(
  otherMinor: bigint,
  rateToPrimaryScaled: bigint,
  otherScale: number,
  primaryScale: number,
): bigint { /* truncates toward zero */ }
```

---

### `src/app/income/page.tsx` (route, request-response)

**Analog (structure):** self — Prisma include already loads full `actuals[]`; list mapping keeps next-open only.

**Analog (FX query shape):** `src/app/debts/page.tsx` lines 68–76 — `fxRate.findMany` + `orderBy asOfDate desc` + select rate fields.

**Anti-pattern (do not copy):** debts lines 81–84 `firstHitLocfMap` @ today — wrong for D-05 receipt-date FX.

**Existing actuals include** (lines 28–51) — keep; stats flatten separately:
```typescript
recurringIncomes: {
  include: {
    currency: { select: { code: true, name: true, scale: true } },
    actuals: { select: { ...actualSelect, recurringIncomeId: true } },
  },
},
oneTimeIncomes: {
  include: {
    currency: { select: { code: true, name: true, scale: true } },
    actuals: { select: { ...actualSelect, oneTimeIncomeId: true } },
  },
},
```

**Pitfall in same file** (lines 79–99): `slotActual` binds **next-open only** for `IncomeRow`. Stats must iterate `r.actuals` / `o.actuals` in full — do not reuse `slotActual` for Σ.

**FX load pattern to adapt** (`src/app/debts/page.tsx` 68–84) — change `lte: today` → `lte: maxActualAsOf` (or max of facts ∪ today); pass raw rate rows into `computePersonIncomeStats`, not a today map:
```typescript
prisma.fxRate.findMany({
  where: { asOfDate: { lte: today } }, // income: lte maxActualAsOf instead
  orderBy: { asOfDate: "desc" },
  select: {
    currencyCode: true,
    asOfDate: true,
    rateToPrimaryScaled: true,
  },
}),
// Debts only (NEGATIVE for Phase 16):
const locfByCurrency = firstHitLocfMap(ratesLteToday, (rate) => rate.currencyCode);
```

**RSC → display strings** (`src/app/debts/page.tsx` 154–157) — compute on server, pass formatted majors to client:
```typescript
const { rows, iOwePrimaryMinor, theyOwePrimaryMinor, isPartial } =
  computeDebtPrimaryTotals(totalsInputs);
const iOweDisplay = formatMinorToMajor(iOwePrimaryMinor, primaryScale);
```

**Income page wiring sketch:**
1. Flatten all actuals → `IncomeActualFactInput[]` (+ `isPrimary` from currency — extend currency select with `isPrimary` like debts).
2. Load rates `lte: maxActualAsOf`.
3. `computePersonIncomeStats(facts, rates, primaryScale)` → Map by `personId`.
4. Attach serializable `stats` (display strings + `isPartial` + native lines) onto `PersonIncomeListItem` when fact count ≥ 1 (D-03).
5. No page hero / no `DebtsPrimaryTotalsHero` mount.

Also need `primaryScale` from primary currency (debts already selects `scale`; income page currently only `code` — extend select).

---

### `src/components/income/IncomeList.tsx` (component, request-response)

**Analog (slot):** `PersonGroup` header lines 205–231 — name left, actions right; insert stats block right-aligned between name and CTAs (UI-SPEC).

**Analog (partial copy tone):** `src/components/debts/DebtsPrimaryTotalsHero.tsx` lines 39–48 — compress to one line; **do not** mount full hero or excluded-debt list.

**Header layout today** (lines 205–231):
```tsx
<div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
  <p className="min-w-0 flex-1 break-all text-base font-medium text-foreground">
    {person.name}
  </p>
  <div className="flex shrink-0 flex-wrap items-center gap-2">
    {/* PersonFormDialog + delete — keep */}
  </div>
</div>
```

**Partial copy tone** (DebtsPrimaryTotalsHero 39–48) — adapt per UI-SPEC:
```tsx
{isPartial ? (
  <div className="rounded-lg border border-border bg-muted/60 p-4" role="status">
    <p className="text-sm font-medium text-foreground">Итог неполный</p>
    <p className="mt-1 text-sm text-muted-foreground">
      Не все долги учтены в сумме: для части валют нет курса. ...
    </p>
  </div>
) : null}
```
Income compact (UI-SPEC): `Итог неполный · нет курса` — Label, no long paragraph, no per-fact list.

**Props extension:** add optional `stats` on `PersonIncomeListItem` (display strings already formatted on RSC). Omit entire stats UI when `stats` absent / 0 actuals (D-03).

**Identity-omit** (UI-SPEC Discretion lock): hide primary secondary line when single native currency === primary && `!isPartial`.

**Display formatting** (existing list lines 21–25, 49–57): keep `formatMinorToMajor` for any client-side needs; prefer RSC-serialized strings for BigInt safety.

**Window hint:** «за всё время» (UI-SPEC prefers over bare «всего»).

---

### `src/lib/income.test.ts` (test, batch)

**Analog:** `src/lib/debts.test.ts` lines 17–28 (factory) + 140–261 (`computeDebtPrimaryTotals` suite).

**Factory pattern** (debts.test.ts 17–28):
```typescript
function debtInput(
  overrides: Partial<DebtPrimaryTotalsInput> &
    Pick<DebtPrimaryTotalsInput, "id" | "direction" | "remainingMinor">,
): DebtPrimaryTotalsInput {
  return {
    status: "OPEN",
    currencyScale: 2,
    isPrimaryCurrency: true,
    rateToPrimaryScaled: null,
    primaryScale: 2,
    ...overrides,
  };
}
```

**Cases to mirror** (map debt → income):
| Debts case | Income case |
|------------|-------------|
| primary identity without rate | primary actual → native + primary same |
| exclude no_fx + isPartial | non-primary, null LOCF @ actualAsOf |
| converts with rate | LOCF + convertOtherMinorToPrimaryMinor |
| mixed partial | multi-fact one excluded; native intact |
| (new) | multi-ccy native buckets |
| (new) | recurring + one-time merge one Σ |
| (new) | empty facts → no stats / empty map |
| (new) | ≥2 actuals on one recurring — all-time not next-open |

**Keep ISO suite** (income.test.ts 380–396) — still assert no net-worth / historical-series / Prisma imports; **allow** `@/lib/locf` after helper adds it.

---

### `src/components/income/income-ui.test.ts` (test, file-I/O)

**Analog:** self — `readFileSync` + `toMatch` / `not.toMatch` describes.

**Existing pattern** (lines 1–35):
```typescript
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const listSrc = readFileSync("src/components/income/IncomeList.tsx", "utf8");

describe("income UI destructive confirm (UI-01)", () => {
  it("...", () => {
    expect(listSrc).toMatch(/DestructiveConfirmStep/);
    expect(listSrc).not.toMatch(/window\.confirm/);
  });
});
```

**New describe** (Wave 0 / RESEARCH): file-scan for «за всё время», «Итог неполный» or «нет курса»; absence of `DebtsPrimaryTotalsHero` on income page; optional `page.tsx` calls `computePersonIncomeStats` / loads `fxRate`; keep no `window.confirm`.

```typescript
const pageSrc = readFileSync("src/app/income/page.tsx", "utf8");
expect(listSrc).toMatch(/за всё время/);
expect(listSrc).toMatch(/Итог неполный/);
expect(pageSrc).not.toMatch(/DebtsPrimaryTotalsHero/);
expect(pageSrc).toMatch(/computePersonIncomeStats|fxRate/);
```

---

### `.planning/REQUIREMENTS.md` (config, transform)

**No code analog.** Planner edits CPTY-01 checkbox text from primary-only to hybrid native+primary per D-05 / CONTEXT. Current line (~23): `Σ in primary with FX LOCF honesty / partial` → sync hybrid wording. No runtime pattern.

## Shared Patterns

### FX honesty (exclude + isPartial)
**Source:** `src/lib/debts.ts` 156–221  
**Apply to:** `computePersonIncomeStats`  
Missing non-primary rate → exclude from **primary only**; native always counted; `isPartial = true`. Never invent 0 rates.

### Per-fact historical LOCF
**Source:** `src/lib/locf.ts` 71–84 + `src/lib/historical-series.ts` 112–114  
**Apply to:** income stats convert path  
`locfRateAsOf(rates, currencyCode, fact.actualAsOf)` — **not** `firstHitLocfMap` @ today (`src/app/debts/page.tsx` 81–84 is negative example).

### RSC load → pure lib → serializable props
**Source:** `src/app/debts/page.tsx` + `src/app/income/page.tsx`  
**Apply to:** income page wiring  
Prisma on page; BigInt math in lib; `formatMinorToMajor` before client; no BalanceSnapshot / net-worth writes.

### Russian partial microcopy
**Source:** `DebtsPrimaryTotalsHero.tsx` 44–47 + UI-SPEC  
**Apply to:** `PersonGroup` header only (D-11)  
Income: compact `Итог неполный · нет курса`; window hint `за всё время`.

### ISO-01 light
**Source:** `src/lib/income.ts` header + `income.test.ts` 380–396  
**Apply to:** all income.ts changes  
No Prisma / net-worth / historical-series / debt aggregates in `income.ts`.

### Vitest file-scan UI contracts
**Source:** `src/components/income/income-ui.test.ts`  
**Apply to:** counterparty stats chrome assertions.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `.planning/REQUIREMENTS.md` CPTY-01 sync | config | transform | Planning doc edit only — no runtime analog |

Optional small `PersonIncomeStatsHeader` subcomponent: **no existing income sub-header file** — prefer inline in `PersonGroup` unless planner splits for clarity; copy Debts hero tone only.

## Anti-Patterns (planner / executor)

| Do not | Why | Use instead |
|--------|-----|-------------|
| Σ from next-open `slotActual` only | Undercounts recurring history | Flatten all `actuals[]` |
| `firstHitLocfMap` @ today | Violates D-05 | `locfRateAsOf` per `actualAsOf` |
| Import `computeDebtPrimaryTotals` | Domain bleed | Copy pattern into `income.ts` |
| Mount `DebtsPrimaryTotalsHero` on `/income` | Global hero rejected D-04 | Per-group header chrome |
| Silent `0n` primary on null FX | FX-02 / D-08 | exclude + `isPartial` |
| Write BalanceSnapshot / import net-worth | ISO regression | Pure income helpers only |

## Metadata

**Analog search scope:** codegraph `explore`/`query`/`node` on `computeDebtPrimaryTotals`, `IncomeList`, `PersonGroup`, `DebtsPrimaryTotalsHero`, `locfRateAsOf`, `firstHitLocfMap`, `convertOtherMinorToPrimaryMinor`; Read of income page/list/tests + debts totals/page  
**Tracked-source gate:** all named analog paths verified via `git ls-files`  
**Files scanned:** ~15 primary sources  
**Pattern extraction date:** 2026-09-07
