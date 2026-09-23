# Phase 28: Interest math + forecast kind - Pattern Map

**Mapped:** 2026-09-21
**Files analyzed:** 5
**Analogs found:** 5 / 5

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/savings-interest.ts` | utility | transform | `src/lib/credit-grace.ts` (`openGraceForecastMembership`) | role-match |
| `src/lib/savings-interest.test.ts` | test | transform | `src/lib/credit-grace.test.ts` | role-match |
| `src/lib/nw-forecast.ts` | utility | transform | `src/lib/nw-forecast.ts` (in place) | exact |
| `src/lib/nw-forecast.test.ts` | test | transform | `src/lib/nw-forecast.test.ts` (grace ΔNW cases) | exact |
| `src/lib/mcp/reads/load-forecast-overlay.ts` | model | request-response | `src/lib/mcp/reads/load-forecast-overlay.ts` (`SerializedForecastEvent.kind`) | exact |

Out of this phase (do not create or edit): `DashboardChartsShell.tsx`, `src/app/page.tsx`, `src/lib/mcp/tools/forecast.ts`, `historical-series.ts`, account actions, Prisma models. Phase 29 maps interest DTOs onto `ForecastSlot` the way grace is mapped today (see Shared Patterns).

## Pattern Assignments

### `src/lib/savings-interest.ts` (utility, transform)

**Analog:** `src/lib/credit-grace.ts` — pure membership `(rows, today, horizonEnd) => DTO[]`, no `nw-forecast` import.

**Imports / isolation header** (lines 1–7):
```typescript
/**
 * Credit grace schedule domain (Phase 19+).
 * Pure TypeScript — no Prisma, no net-worth / historical-series imports (CYCLE-01 isolation).
 * Helpers emit candidates only — never write obligation rows (D-12).
 */

import { clampDayOfMonth } from "@/lib/dates";
```

Interest module header should say the same isolation, plus no `nw-forecast`, no `locf`, no `money`, no `income`, no `credit-grace`. Imports only:

- `addCalendarDays` from `@/lib/dates` (`src/lib/dates.ts` lines 39–50)
- `nextAccrualAsOf` from `@/lib/savings-accrual-display` (do not copy `clampDayOfMonth` into this file)

**Calendar to call, not reimplement** (`src/lib/savings-accrual-display.ts` lines 1–17):
```typescript
/**
 * Display-only next accrual — no Prisma, no interest amount math (Phase 28 / D-16).
 */

import { addCalendarDays, clampDayOfMonth } from "@/lib/dates";

/** Next accrual calendar day (YYYY-MM-DD) using clampDayOfMonth (D-05). */
export function nextAccrualAsOf(today: string, dayOfMonth: number): string {
  const [ys, ms] = today.split("-");
  const y = Number(ys);
  const m = Number(ms);
  const thisMonth = clampDayOfMonth(y, m, dayOfMonth);
  if (thisMonth >= today) return thisMonth;
  const next = addCalendarDays(`${y}-${String(m).padStart(2, "0")}-01`, 32);
  const [ny, nm] = next.split("-");
  return clampDayOfMonth(Number(ny), Number(nm), dayOfMonth);
}
```

Sticky: on the accrual day `thisMonth >= today` returns that same day. Enumerator must start at `addCalendarDays(today, 1)` and advance `cursor = addCalendarDays(accrual, 1)` after every month (including zero-interest months).

**Core membership shape** (`src/lib/credit-grace.ts` lines 275–325) — copy the signature and the lean DTO, not the overdue fold:
```typescript
/** Lean membership DTO — shell maps to ForecastSlot kind grace (no nw-forecast import). */
export type GraceForecastMembership = {
  obligationId: number;
  dueAsOf: string;
  sampleAsOf: string;
  amountMinor: bigint;
  accountId: number;
  accountName: string;
  currencyCode: string;
  currencyScale: number;
  isPrimaryCurrency: boolean;
};

export function openGraceForecastMembership(
  obligations: readonly GraceForecastObligationInput[],
  today: string,
  horizonEnd: string,
): GraceForecastMembership[] {
  const out: GraceForecastMembership[] = [];
  for (const o of obligations) {
    if (o.status !== "OPEN") continue;
    // ... overdue → today; due === today → today; future → dueAsOf; > horizonEnd → skip
    out.push({ /* ... */ });
  }
  return out;
}
```

Interest signature: `(accounts, today, horizonEnd) => slots`. Inclusive `horizonEnd` (`plannedAsOf === horizonEnd` in; `>` out). Exclusive today (`plannedAsOf > today`). Do **not** fold a missed accrual onto today (that `dueAsOf < today → sampleAsOf = today` branch is grace-only). Principal starts at the caller-injected today LOCF minor and grows only by truncated credits (D-02, D-09). Emit only when `interestMinor > 0n` (D-10). `parentId` field on the DTO = `accountId` (D-13). No `ForecastSlot` import.

**Sort** — copy the stable date-then-id comparator from `src/lib/income.ts` lines 217–223, with `accountId` in place of `parentId`:
```typescript
  return [...byKey.values()].sort((a, b) =>
    a.plannedAsOf < b.plannedAsOf
      ? -1
      : a.plannedAsOf > b.plannedAsOf
        ? 1
        : a.parentId - b.parentId,
  );
```

Do not copy `listRecurringOccurrences` itself (lines 155–215): it walks `monthsOverlapping`, merges actuals, and the income module imports `locf` + `money` (lines 6–7). Interest dates come from `nextAccrualAsOf` only.

**Bigint truncate** — copy multiply-then-`/` toward 0 from `src/lib/money.ts` lines 128–137, but do not import `money.ts` and do not use `10n **`:
```typescript
export function invertRateScaled(rateToPrimaryScaled: bigint): bigint {
  if (rateToPrimaryScaled <= 0n) {
    throw new Error("rate must be > 0");
  }
  const inverted =
    (RATE_SCALE_E8 * RATE_SCALE_E8) / rateToPrimaryScaled;
```

Interest guard returns `0n` (does not throw) when `annualRateBps <= 0` or `balanceMinor <= 0n`. Single division: `(balanceMinor * BigInt(annualRateBps)) / (12n * 10000n)`. `parsePercentToBps` in `src/lib/savings-rate.ts` lines 6–19 stays a UI parser; interest input is already `annualRateBps: number`.

---

### `src/lib/savings-interest.test.ts` (test, transform)

**Analog:** `src/lib/credit-grace.test.ts` (membership fixtures + source isolation smoke). Calendar expectations also mirror `src/lib/savings-accrual-display.test.ts`.

**Imports + fixture row** (`src/lib/credit-grace.test.ts` lines 1–13, 205–222):
```typescript
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  openGraceForecastMembership,
  type GraceForecastObligationInput,
} from "@/lib/credit-grace";

describe("openGraceForecastMembership (D-01…D-04 / C-07)", () => {
  const today = "2026-03-01";
  const horizonEnd = "2026-03-31";

  function row(
    partial: Partial<GraceForecastObligationInput> &
      Pick<GraceForecastObligationInput, "id" | "dueAsOf" | "status">,
  ): GraceForecastObligationInput {
    return {
      amountMinor: 50_000n,
      accountId: 1,
      accountName: "Карта",
      currencyCode: "RUB",
      currencyScale: 2,
      isPrimaryCurrency: true,
      ...partial,
    };
  }
```

Interest tests inject `balanceMinor` / `annualRateBps` / `accrualDayOfMonth` the same way. Relative import `./savings-interest` matches `savings-accrual-display.test.ts` lines 1–5 (sibling lib tests use `./`, not only `@/`).

**Calendar fixtures already locked** (`src/lib/savings-accrual-display.test.ts` lines 7–17 and `src/lib/dates.test.ts` lines 39–50):
```typescript
expect(nextAccrualAsOf("2026-02-10", 31)).toBe("2026-02-28");
expect(nextAccrualAsOf("2026-02-28", 31)).toBe("2026-02-28");
expect(clampDayOfMonth(2024, 2, 31)).toBe("2024-02-29");
```

Enumerator cases to add on top of those (do not re-test `clampDayOfMonth` in isolation): `today = "2026-02-10"` DOM 31 → slots on `2026-02-28` and `2026-03-31`; `today = "2026-02-28"` → only `2026-03-31`.

**Source smoke** (`src/lib/credit-grace.test.ts` lines 299–306) — same `readFileSync` + `not.toMatch`:
```typescript
describe("GRISO isolation smoke (T-19-03 / Phase 21)", () => {
  it("net-worth and historical-series do not import credit-grace", () => {
    const root = join(process.cwd(), "src/lib");
    for (const file of ["net-worth.ts", "historical-series.ts"]) {
      const src = readFileSync(join(root, file), "utf8");
      expect(src).not.toMatch(/credit-grace/);
    }
  });
```

Interest file: `readFileSync` `src/lib/savings-interest.ts` and `expect(src).not.toMatch(/Math\.pow/)`, and `not.toMatch(/nw-forecast|historical-series|net-worth|prisma/)`.

---

### `src/lib/nw-forecast.ts` (utility, transform)

**Analog:** this file. Widen kind; do not add a second series builder; do not import `savings-interest`.

**Kind + slot** (lines 1–34):
```typescript
/**
 * Pure NW forecast overlay (Phase 17+21).
 * Cumulative stair-step from accounts-only today anchor + open future planned income
 * and A′ NW-neutral OPEN grace slots (ΔNW=0 after FX gate).
 * Import wall (D-18): money / locf / dates only — never NW history, credit-grace, or DB clients.
 */

export type ForecastSlotKind = "income" | "grace";

export type ForecastSlot = {
  kind: ForecastSlotKind;
  parentId: number;
  plannedAsOf: string;
  plannedAmountMinor: bigint;
  currencyCode: string;
  currencyScale: number;
  isPrimaryCurrency: boolean;
  accountId?: number;
  accountName?: string;
  dueAsOf?: string;
};
```

Union becomes `"income" | "grace" | "interest"`. Interest slots set `parentId` = `accountId` and may set optional `accountId` / `accountName` (grace already does). Leave `dueAsOf` for grace.

**Window** (lines 81–93) — interest must take the income branch (`plannedAsOf > today`), not the grace fallthrough (`>= today`):
```typescript
function slotInWindow(
  kind: ForecastSlotKind,
  plannedAsOf: string,
  today: string,
  horizonEnd: string,
): boolean {
  if (plannedAsOf > horizonEnd) return false;
  if (kind === "income") {
    return plannedAsOf > today;
  }
  // grace: allows today after overdue fold (D-01, D-04)
  return plannedAsOf >= today;
}
```

**ΔNW** (line 149) — replace the non-grace ternary so a new kind cannot silently credit NW:
```typescript
const primaryMinor = slot.kind === "grace" ? 0n : displayPrimaryMinor;
```

Exhaustive `never` already exists on presets (lines 64–77). Copy that `default` for the addend switch: `"income"` and `"interest"` → `displayPrimaryMinor`; `"grace"` → `0n`.

```typescript
    default: {
      const _exhaustive: never = preset;
      throw new Error(`unknown preset: ${_exhaustive}`);
    }
```

Builder date sort stays date-only (lines 183–188). FX gate above line 149 stays unchanged (interest is a non-grace slot: primary passes through; missing FX excludes). Do not recompute principal here.

---

### `src/lib/nw-forecast.test.ts` (test, transform)

**Analog:** existing grace cases in this file. Add interest cases beside them; keep grace assertions.

**Fixture helpers** (lines 1–25 and 43–70):
```typescript
import { describe, expect, it } from "vitest";
import { RATE_SCALE_E8 } from "@/lib/money";
import {
  buildNetWorthForecastSeries,
  forecastHorizonEnd,
  type ForecastSlot,
} from "./nw-forecast";

const today = "2026-03-01";

function primarySlot(
  parentId: number,
  plannedAsOf: string,
  amountMinor: bigint,
): ForecastSlot {
  return {
    kind: "income",
    parentId,
    plannedAsOf,
    plannedAmountMinor: amountMinor,
    currencyCode: "RUB",
    currencyScale: 2,
    isPrimaryCurrency: true,
  };
}
```

`graceSlot` (lines 43–70) is the metadata template (`accountId`, `accountName`, `dueAsOf`). An interest helper is the same object with `kind: "interest"` and no `dueAsOf` unless a test needs it.

**Grace stays flat** (lines 300–322) — regression must still pass:
```typescript
  it("future OPEN grace sampled with ΔNW=0 (A′ / C-01 / D-06 / GRFCST-01)", () => {
    const slots: ForecastSlot[] = [
      graceSlot(1, "2026-03-15", 50_000n, { dueAsOf: "2026-03-15" }),
    ];
    const result = buildNetWorthForecastSeries({
      anchorPrimaryMinor: 1_000_000n,
      slots,
      rates: [],
      primaryScale: 2,
      today,
      horizonEnd: "2026-03-31",
    });
    expect(result.includedSlotCount).toBe(1);
    expect(
      result.points.find((p) => p.asOfDate === "2026-03-15")?.forecastPrimaryMinor,
    ).toBe(1_000_000n);
```

Interest case: same anchor `1_000_000n`, `kind: "interest"`, `plannedAmountMinor: 50_000n`, `plannedAsOf: "2026-03-15"` → that point is `1_050_000n`. `plannedAsOf === today` → `includedSlotCount === 0`.

**Same-day mix** (lines 387–414) — mirror with interest + grace; NW moves by the interest amount only:
```typescript
  it("same-day income+grace: NW moves by income only (C-03 / D-06)", () => {
    const slots: ForecastSlot[] = [
      primarySlot(1, "2026-03-15", 100_000n),
      graceSlot(2, "2026-03-15", 50_000n, { dueAsOf: "2026-03-15" }),
    ];
    // ...
    expect(day?.forecastPrimaryMinor).toBe(1_100_000n);
    expect(day?.forecastEvents?.map((e) => e.kind).sort()).toEqual([
      "grace",
      "income",
    ]);
```

**Kind literal list** (lines 465–468) must grow to include `"interest"` or `tsc` fails on the array:
```typescript
  it("ForecastSlot kind is only income|grace — CLOSED never a slot (C-07)", () => {
    const kinds: ForecastSlot["kind"][] = ["income", "grace"];
    expect(kinds).not.toContain("CLOSED" as ForecastSlot["kind"]);
  });
```

---

### `src/lib/mcp/reads/load-forecast-overlay.ts` (model, request-response)

**Analog:** this file’s serialized kind union. Type-only widen. Do not push interest into `openSlots` or call `listInterestSlotsInRange`.

**Union** (lines 31–40):
```typescript
export type SerializedForecastEvent = {
  kind: "income" | "grace";
  parentId: number;
  plannedAmountMinor: string;
  displayPrimaryMajor: number;
  currencyCode: string;
  accountId?: number;
  accountName?: string;
  dueAsOf?: string;
};
```

Change `kind` to `"income" | "grace" | "interest"`. The assignability site is lines 91–92 (`kind: e.kind` where `e.kind` is `ForecastSlotKind`). No other `"income" | "grace"` union exists under `src/`.

**Membership that stays income+grace this phase** (lines 194, 259–261, 322–324):
```typescript
  const from = addCalendarDays(today, 1);
  // ...
  for (const o of raw) {
    if (!(o.plannedAsOf > today)) continue;
  // ...
  const built = buildNetWorthForecastSeries({
    slots: [...openSlots, ...graceSlots],
```

Future-only filter (`plannedAsOf > today` and `from = today + 1`) is what the interest enumerator copies. The loader itself does not start emitting interest slots.

## Shared Patterns

### Pure module header + import wall
**Source:** `src/lib/credit-grace.ts` lines 1–5; `src/lib/nw-forecast.ts` lines 1–6; `src/lib/savings-accrual-display.ts` lines 1–3
**Apply to:** `savings-interest.ts` (no Prisma, no `nw-forecast`, no `net-worth`, no `historical-series`). `nw-forecast.ts` stays free of `savings-interest` and `credit-grace`.

### YYYY-MM-DD string compare
**Source:** `src/lib/credit-grace.ts` lines 302–309 (`< today`, `=== today`, `<= horizonEnd`); `src/lib/nw-forecast.ts` lines 87–92
**Apply to:** enumerator window and `slotInWindow`. Interest uses income’s `>` today, not grace’s `>=`.

### Truncate-toward-0 bigint division
**Source:** `src/lib/money.ts` lines 128–137 (`(a * b) / c` truncates toward 0)
**Apply to:** `monthlyInterestMinor` only. Divisor `12n * 10000n`. Guard `<= 0` → `0n` (do not throw like `invertRateScaled`). Do not import `money.ts` from interest math. Do not use `Math.pow` or `10n **`.

### Exhaustive kind switch
**Source:** `src/lib/nw-forecast.ts` lines 74–77 (`const _exhaustive: never`)
**Apply to:** ΔNW addend in `buildNetWorthForecastSeries` (line 149 today).

### Vitest lib tests
**Source:** `src/lib/savings-accrual-display.test.ts` lines 1–5; `src/lib/nw-forecast.test.ts` lines 1–9
**Apply to:** both new/extended test files. `describe` title carries decision ids. Runner: `./node_modules/.bin/vitest run src/lib/savings-interest.test.ts src/lib/nw-forecast.test.ts`.

### Phase 29 slot map (do not apply in Phase 28)
**Source:** `src/lib/mcp/reads/load-forecast-overlay.ts` lines 295–320
```typescript
  const graceSlots: ForecastSlot[] = openGraceForecastMembership(
    /* obligations */,
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
```
Phase 29 copies this map with `kind: "interest"`, `parentId: accountId`, `plannedAsOf` = accrual date, `plannedAmountMinor` = precomputed interest minor. FX stays in the builder. Phase 28 tests build `ForecastSlot` fixtures by hand.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| — | — | — | Running-principal loop has no existing function. Membership shell, calendar, bigint `/`, and stair-step all have analogs above. |

## Metadata

**Analog search scope:** `src/lib/nw-forecast.ts`, `src/lib/nw-forecast.test.ts`, `src/lib/credit-grace.ts`, `src/lib/credit-grace.test.ts`, `src/lib/income.ts`, `src/lib/savings-accrual-display.ts`, `src/lib/savings-accrual-display.test.ts`, `src/lib/savings-rate.ts`, `src/lib/dates.ts`, `src/lib/dates.test.ts`, `src/lib/money.ts`, `src/lib/mcp/reads/load-forecast-overlay.ts`
**Search method:** codegraph `query` / `node` / `explore` / `callers` + `git ls-files` tracked-source gate
**Files scanned:** 12 tracked analogs (all `git ls-files` hits non-empty)
**Pattern extraction date:** 2026-09-21

**Tracked-source gate:** every analog path above is git-tracked. No `.gsd/` mirror paths.
