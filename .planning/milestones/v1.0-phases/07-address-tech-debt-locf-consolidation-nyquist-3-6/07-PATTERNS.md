# Phase 7: Address tech debt LOCF consolidation + Nyquist 3–6 - Pattern Map

**Mapped:** 2026-09-04
**Files analyzed:** 12
**Analogs found:** 12 / 12

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/locf.ts` | utility | transform | `src/lib/historical-series.ts` (private `locf*`) + page Map loops | exact |
| `src/lib/locf.test.ts` | test | transform | `src/lib/net-worth.test.ts` (pure Vitest) + `src/lib/balances.test.ts` (BAL-02 null) | role-match |
| `src/lib/historical-series.ts` | service | transform | self — replace private `locfAmountAsOf` / `locfRateAsOf` with shared imports | exact |
| `src/lib/balances.ts` | service | request-response | self — keep `getBalanceAsOf` Prisma thin wrapper | exact |
| `src/lib/fx.ts` | service | request-response | self — keep `getRateAsOf` Prisma thin wrapper | exact |
| `src/app/page.tsx` | component (RSC page) | request-response / batch | self Map loops → `firstHitLocfMap` | exact |
| `src/app/accounts/page.tsx` | component (RSC page) | request-response / batch | self Map loop → `firstHitLocfMap` | exact |
| `src/app/currencies/rates/page.tsx` | component (RSC page) | request-response / batch | self Map loop → `firstHitLocfMap` | exact |
| `.planning/phases/03-dated-balance-snapshots/03-VALIDATION.md` | config | batch (docs) | `.planning/phases/01-docker-sqlite-foundation/01-VALIDATION.md` | exact |
| `.planning/phases/04-dated-fx/04-VALIDATION.md` | config | batch (docs) | `01-VALIDATION.md` | exact |
| `.planning/phases/05-net-worth-dashboard/05-VALIDATION.md` | config | batch (docs) | `01-VALIDATION.md` | exact |
| `.planning/phases/06-historical-charts/06-VALIDATION.md` | config | batch (docs) | `01-VALIDATION.md` | exact |

## Pattern Assignments

### `src/lib/locf.ts` (utility, transform)

**Analog:** `src/lib/historical-series.ts` (pure pick) + `src/app/accounts/page.tsx` (first-hit Map)

**Imports pattern** (mirror sibling libs — `@/lib` only if needed; prefer relative-free path alias like peers):

From `src/lib/balances.ts` lines 1–3 / `historical-series.ts` lines 1–13 — new module should stay dependency-light (no Prisma, no money):

```typescript
// No Prisma / RSC imports. Pure functions only.
// Optional: re-export typed wrappers that call pickLatestAsOf.
```

**Core pick pattern** (extract semantics from `historical-series.ts` lines 66–96):

```typescript
function locfAmountAsOf(
  snapshots: SeriesSnapshot[],
  accountId: number,
  asOfDate: string,
): bigint | null {
  let best: SeriesSnapshot | null = null;
  for (const snap of snapshots) {
    if (snap.accountId !== accountId) continue;
    if (snap.asOfDate > asOfDate) continue;
    if (!best || snap.asOfDate > best.asOfDate) {
      best = snap;
    }
  }
  return best?.amountMinor ?? null;
}

function locfRateAsOf(
  rates: SeriesRate[],
  currencyCode: string,
  asOfDate: string,
): bigint | null {
  let best: SeriesRate | null = null;
  for (const rate of rates) {
    if (rate.currencyCode !== currencyCode) continue;
    if (rate.asOfDate > asOfDate) continue;
    if (!best || rate.asOfDate > best.asOfDate) {
      best = rate;
    }
  }
  return best?.rateToPrimaryScaled ?? null;
}
```

Generalize to `pickLatestAsOf<T>(rows, matchesKey, asOfOf, asOfDate): T | null` then thin wrappers `locfAmountAsOf` / `locfRateAsOf` that return field or `null` (RESEARCH open Q2).

**Core batch Map pattern** (extract from `src/app/accounts/page.tsx` lines 41–52):

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
```

Generalize to `firstHitLocfMap<K, T>(rows, keyOf): Map<K, T>` — **precondition:** rows already `asOfDate <= D` and `orderBy: { asOfDate: "desc" }`.

**Error / null policy:** never invent `0n` / unit rate — return `null` when no row (D-03). No try/catch in pure helpers.

---

### `src/lib/locf.test.ts` (test, transform)

**Analog:** `src/lib/net-worth.test.ts` (pure describe/it, no mocks) + null-before-first cases from `src/lib/balances.test.ts`

**Imports pattern** (`net-worth.test.ts` lines 1–3):

```typescript
import { describe, expect, it } from "vitest";
import { firstHitLocfMap, pickLatestAsOf } from "./locf";
```

**Null-before-first assertion pattern** (`balances.test.ts` lines 59–67 — adapt to pure, drop Prisma mocks):

```typescript
it("before first snapshot returns null not 0n", async () => {
  vi.mocked(prisma.balanceSnapshot.findFirst).mockResolvedValue(null);

  const row = await getBalanceAsOf(7, "2025-12-31");

  expect(row).toBeNull();
  expect(row).not.toBe(0n);
  expect(row?.amountMinor).not.toBe(0n);
});
```

**Parity skeleton** (from RESEARCH — mirror Vitest style above):

```typescript
it("firstHitLocfMap on desc rows matches pickLatestAsOf for today", () => {
  const rows = [
    { accountId: 1, asOfDate: "2026-02-01", amountMinor: 200n },
    { accountId: 1, asOfDate: "2026-01-01", amountMinor: 100n },
  ];
  const map = firstHitLocfMap(rows, (r) => r.accountId);
  const picked = pickLatestAsOf(
    rows,
    (r) => r.accountId === 1,
    (r) => r.asOfDate,
    "2026-03-01",
  );
  expect(map.get(1)?.amountMinor).toBe(200n);
  expect(picked?.amountMinor).toBe(200n);
});
```

**Do not** copy Prisma `vi.mock("@/lib/db")` from `balances.test.ts` into `locf.test.ts` — pure module only.

---

### `src/lib/historical-series.ts` (service, transform)

**Analog:** self — rewire call sites; delete private copies after import from `@/lib/locf`

**Imports pattern** (lines 1–13 — add locf import alongside existing):

```typescript
import {
  type RangePreset,
  windowStartForPreset,
} from "@/lib/dates";
import {
  convertOtherMinorToPrimaryMinor,
  creditDebtMinor,
  minorToMajorNumber,
} from "@/lib/money";
import {
  computeNetWorthRows,
  type NetWorthAccountType,
} from "@/lib/net-worth";
// ADD:
import { locfAmountAsOf, locfRateAsOf } from "@/lib/locf";
```

**Core call sites to keep shape** (lines 142–145 — same args after extract):

```typescript
locfAmountMinor: locfAmountAsOf(snapshots, account.id, asOfDate),
rateToPrimaryScaled: account.isPrimaryCurrency
  ? null
  : locfRateAsOf(rates, account.currencyCode, asOfDate),
```

**D-16 skip pattern must survive** (lines 263–266):

```typescript
const rate = locfRateAsOf(rates, account.currencyCode, asOfDate);
if (rate === null) {
  continue; // D-16
}
```

Regression gate: `src/lib/historical-series.test.ts` — case `"primary mode skips dates with null LOCF FX (D-16); native still includes"` (~line 335).

---

### `src/lib/balances.ts` (service, request-response)

**Analog:** self — keep Prisma contract; no structural rewrite

**Imports + core** (lines 1–16):

```typescript
import { ensureSqlitePragmas, prisma } from "@/lib/db";

export { calendarDateToday } from "@/lib/dates";
export { creditDebtMinor } from "@/lib/money";

/**
 * LOCF: latest BalanceSnapshot with asOfDate <= D.
 * Returns null before the first snapshot — never invents 0n (BAL-02).
 */
export async function getBalanceAsOf(accountId: number, asOfDate: string) {
  await ensureSqlitePragmas();
  return prisma.balanceSnapshot.findFirst({
    where: { accountId, asOfDate: { lte: asOfDate } },
    orderBy: { asOfDate: "desc" },
  });
}
```

**Do not** route pages through this helper (D-04). Optional comment pointing to `locf.ts` for pure/batch.

---

### `src/lib/fx.ts` (service, request-response)

**Analog:** self / twin of `balances.ts`

**Core** (lines 1–15):

```typescript
import { ensureSqlitePragmas, prisma } from "@/lib/db";

export { convertOtherMinorToPrimaryMinor } from "@/lib/money";

/**
 * LOCF: latest FxRate with asOfDate <= D.
 * Returns null before the first rate — never invents 0 or 1 (FX-02 / D-15).
 */
export async function getRateAsOf(currencyCode: string, asOfDate: string) {
  await ensureSqlitePragmas();
  return prisma.fxRate.findFirst({
    where: { currencyCode, asOfDate: { lte: asOfDate } },
    orderBy: { asOfDate: "desc" },
  });
}
```

Keep public; leave `fx.test.ts` contracts intact.

---

### `src/app/accounts/page.tsx` (component RSC, batch)

**Analog:** self Map loop → replace with `firstHitLocfMap`

**Imports** (lines 1–4 — add locf):

```typescript
import { AccountFormDialog } from "@/components/accounts/AccountFormDialog";
import { AccountList } from "@/components/accounts/AccountList";
import { calendarDateToday } from "@/lib/balances";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
// ADD: import { firstHitLocfMap } from "@/lib/locf";
```

**Prefetch precondition** (lines 21–28 — keep `lte` + `desc`):

```typescript
prisma.balanceSnapshot.findMany({
  where: { asOfDate: { lte: today } },
  orderBy: { asOfDate: "desc" },
  select: {
    accountId: true,
    asOfDate: true,
    amountMinor: true,
  },
}),
```

**Replace** lines 41–52 with:

```typescript
const locfByAccount = firstHitLocfMap(
  snapshotsLteToday,
  (snap) => snap.accountId,
);
```

Leave `historyByAccount` group-by loop (not LOCF) unchanged.

---

### `src/app/currencies/rates/page.tsx` (component RSC, batch)

**Analog:** self — same Map → `firstHitLocfMap` as accounts page

**Prefetch** (lines 22–29) + **Map** (lines 43–54):

```typescript
prisma.fxRate.findMany({
  where: { asOfDate: { lte: today } },
  orderBy: { asOfDate: "desc" },
  select: {
    currencyCode: true,
    asOfDate: true,
    rateToPrimaryScaled: true,
  },
}),

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

Replace Map loop with `firstHitLocfMap(ratesLteToday, (r) => r.currencyCode)`.

---

### `src/app/page.tsx` (component RSC, batch)

**Analog:** self — dual Maps (balance + FX); single prefetch feeds Maps + chart series (Pitfall 5)

**Both Maps** (lines 48–72):

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

Replace both with `firstHitLocfMap`. Keep one `snapshotsLteToday` / `ratesLteToday` query feeding NW hero + chart props.

**Downstream consumption** (lines 77–87) stays:

```typescript
const locf = locfByAccount.get(account.id) ?? null;
const rate = locfByCurrency.get(account.currencyCode) ?? null;
// ...
locfAmountMinor: locf?.amountMinor ?? null,
```

---

### `.planning/phases/0{3,4,5,6}-*/**-VALIDATION.md` (config, docs)

**Analog:** `.planning/phases/01-docker-sqlite-foundation/01-VALIDATION.md`

**Frontmatter target** (lines 1–11):

```yaml
---
phase: "1"
slug: "docker-sqlite-foundation"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-09-02"
validated: "2026-09-02"
---
```

Current Phase 3 draft contrast (`03-VALIDATION.md` lines 1–9):

```yaml
status: draft
nyquist_compliant: false
wave_0_complete: false
```

**Reconcile pattern (from Phase 1):**

1. Flip frontmatter to `validated` / `nyquist_compliant: true` / `wave_0_complete: true` + `validated:` date.
2. Keep historical task IDs; set File Exists ✅ and Status ✅ green where files exist (research evidence table).
3. Check Wave 0 boxes for present test files.
4. Append Validation Audit section like Phase 1 lines 92–105:

```markdown
## Validation Audit 2026-09-02

| Metric | Count |
|--------|-------|
| Gaps found | 11 |
| Resolved | 11 |
| Escalated | 0 |

### Notes
- ... evidence of npm test green + files already on disk ...
```

**Do not** invent new product tests unless auditor finds true MISSING (RESEARCH discretion).

---

## Shared Patterns

### Pure LOCF null-before-first
**Source:** `src/lib/historical-series.ts` lines 66–80; locked D-03 / BAL-02 / FX D-15  
**Apply to:** `locf.ts`, series rewire, page Maps  
```typescript
return best?.amountMinor ?? null; // never 0n / unit rate before first row
```

### Batch first-hit Map (desc-sorted prefetch)
**Source:** `src/app/accounts/page.tsx` lines 21–52; `src/app/page.tsx` 28–72; `rates/page.tsx` 22–54  
**Apply to:** all three RSC pages via `firstHitLocfMap`  
```typescript
// findMany: where asOfDate <= today, orderBy asOfDate desc
// then first !map.has(key) wins = latest ≤ D
```

### Prisma single-row LOCF wrappers
**Source:** `src/lib/balances.ts` 10–16; `src/lib/fx.ts` 9–15  
**Apply to:** keep as-is for unit contracts; do not use from list/dashboard pages  

### D-16 null FX skip in primary series
**Source:** `src/lib/historical-series.ts` 263–266  
**Apply to:** any rewire of `locfRateAsOf` — keep `if (rate === null) continue`  

### Vitest pure unit style
**Source:** `src/lib/net-worth.test.ts` 1–18  
**Apply to:** `locf.test.ts`  
```typescript
import { describe, expect, it } from "vitest";
// no vi.mock for pure helpers
```

### Nyquist VALIDATION reconcile
**Source:** `01-VALIDATION.md` frontmatter + Validation Audit  
**Apply to:** phases 3–6 VALIDATION.md after LOCF lands  

### Path aliases
**Source:** all `src/lib/*` and RSC pages  
**Apply to:** new imports use `@/lib/locf` from app; `./locf` from sibling lib/tests  

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| — | — | — | All planned files have tracked analogs |

## Metadata

**Analog search scope:** `src/lib/`, `src/app/{page,accounts,currencies/rates}/`, `.planning/phases/01` + `03–06` VALIDATION  
**Files scanned:** ~15 lib modules + 3 pages + 5 VALIDATION docs (tracked via `git ls-files`)  
**Tracked-source gate:** all named analogs present in `git ls-files` (Phase 2 VALIDATION absent on disk — used Phase 1 instead)  
**Graphify:** disabled — Grep/Read used  
**Pattern extraction date:** 2026-09-04
