# Phase 5: Net Worth Dashboard - Pattern Map

**Mapped:** 2026-09-03
**Files analyzed:** 5
**Analogs found:** 5 / 5

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/net-worth.ts` | utility | transform | `src/lib/fx.ts` + `src/lib/balances.ts` | exact |
| `src/lib/net-worth.test.ts` | test | batch | `src/lib/money.test.ts` | exact |
| `src/app/page.tsx` | route | request-response | `src/app/accounts/page.tsx` + `src/app/currencies/rates/page.tsx` | exact |
| `src/components/dashboard/DashboardAccountList.tsx` | component | CRUD (read-only) | `src/components/accounts/AccountList.tsx` | exact |
| `src/components/nav.tsx` | component | static config | `src/components/nav.tsx` (self) | exact |

## Pattern Assignments

### `src/lib/net-worth.ts` (utility, transform)

**Analog:** `src/lib/fx.ts` (pure BigInt conversion) + `src/lib/balances.ts` (credit debt)

**Imports pattern** (from `src/lib/fx.ts:1-2`, `src/lib/balances.ts:15-21`):
```typescript
import { creditDebtMinor } from "@/lib/balances";
import { convertOtherMinorToPrimaryMinor } from "@/lib/fx";
```

**Pure function pattern — no Prisma** (from `src/lib/fx.ts:21-31`):
```typescript
export function convertOtherMinorToPrimaryMinor(
  otherMinor: bigint,
  rateToPrimaryScaled: bigint,
  otherScale: number,
  primaryScale: number,
): bigint {
  const num =
    otherMinor * rateToPrimaryScaled * 10n ** BigInt(primaryScale);
  const den = 10n ** BigInt(otherScale) * RATE_SCALE_E8;
  return num / den;
}
```

**Credit debt derivation** (from `src/lib/balances.ts:15-21`):
```typescript
/** Credit debt = limit − available (D-05–D-08). Pure; bounds enforced in actions. */
export function creditDebtMinor(
  creditLimitMinor: bigint,
  availableMinor: bigint,
): bigint {
  return creditLimitMinor - availableMinor;
}
```

**Core aggregation pattern** — compose helpers; export typed inputs/outputs; no side effects:
```typescript
// Mirror fx.ts: pure export, BigInt-only, caller handles null LOCF/FX
export type NetWorthAccountInput = { /* see RESEARCH.md */ };
export type NetWorthRow = { /* see RESEARCH.md */ };

export function computeNetWorthRows(accounts: NetWorthAccountInput[]) {
  const rows = accounts.map((a) => {
    // null locfAmountMinor → includedInTotal: false, excludeReason: "no_balance"
    // isPrimaryCurrency → identity (skip rateToPrimaryScaled)
    // FIAT_CREDIT → creditDebtMinor + negate contribution; available display-only
    // non-primary + null rate → excludeReason: "no_fx"
  });
  const totalPrimaryMinor = rows.reduce((s, r) => s + r.contributionPrimaryMinor, 0n);
  const isPartial = rows.some((r) => !r.includedInTotal);
  return { rows, totalPrimaryMinor, isPartial };
}
```

**Error handling:** No try/catch inside lib — null inputs produce exclusion flags, never invented zero (same contract as `getBalanceAsOf` / `getRateAsOf` returning null).

---

### `src/lib/net-worth.test.ts` (test, batch)

**Analog:** `src/lib/money.test.ts` (pure unit tests, no Prisma mock)

**Imports pattern** (from `src/lib/money.test.ts:1-10`):
```typescript
import { describe, expect, it } from "vitest";
import { computeNetWorthRows } from "./net-worth";
```

**Pure test structure — no vi.mock** (from `src/lib/money.test.ts:26-44`):
```typescript
describe("parseMajorToMinor / formatMinorToMajor", () => {
  it("round-trips scales 0, 2, 8, 18 without float", () => {
    const cases: Array<{ scale: number; major: string; minor: bigint }> = [
      { scale: 2, major: "123.45", minor: 12345n },
      // ...
    ];
    for (const { scale, major, minor } of cases) {
      expect(parseMajorToMinor(major, scale)).toBe(minor);
    }
  });
});
```

**Credit debt test pattern** (from `src/lib/balances.test.ts:133-138`):
```typescript
describe("creditDebtMinor (D-05)", () => {
  it("equals limit minus available", () => {
    expect(creditDebtMinor(500_000n, 250_000n)).toBe(250_000n);
    expect(creditDebtMinor(100n, 100n)).toBe(0n);
  });
});
```

**Conversion regression reference** (from `src/lib/fx.test.ts:164-174`):
```typescript
it("converts scale-2 other minor to scale-2 primary minor with truncating division", () => {
  const result = convertOtherMinorToPrimaryMinor(
    10000n,
    90_00000000n,
    2,
    2,
  );
  expect(result).toBe(900000n);
});
```

**Required test matrix:** primary identity, asset sum, credit debt subtracts (never available), no_balance exclusion, no_fx exclusion, isPartial flag, mixed portfolio.

---

### `src/app/page.tsx` (route, request-response)

**Analog:** `src/app/accounts/page.tsx` (batch balance LOCF) + `src/app/currencies/rates/page.tsx` (batch FX LOCF)

**Imports pattern** (from `src/app/accounts/page.tsx:1-4`):
```typescript
import { calendarDateToday } from "@/lib/balances";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
import { formatMinorToMajor } from "@/lib/money";
import { computeNetWorthRows } from "@/lib/net-worth";
```

**Force-dynamic + pragmas** (from `src/app/page.tsx:3`, `src/app/accounts/page.tsx:6-10`):
```typescript
export const dynamic = "force-dynamic";

export default async function Home() {
  await ensureSqlitePragmas();
  const today = calendarDateToday("Europe/Moscow");
```

**Batch LOCF balance map** (from `src/app/accounts/page.tsx:11-52`):
```typescript
const [accountsRaw, primaryCurrency, snapshotsLteToday, ratesLteToday] =
  await Promise.all([
    prisma.account.findMany({
      include: { currency: true },
      orderBy: { name: "asc" },
    }),
    prisma.currency.findFirst({
      where: { isPrimary: true },
      select: { code: true, scale: true },
    }),
    prisma.balanceSnapshot.findMany({
      where: { asOfDate: { lte: today } },
      orderBy: { asOfDate: "desc" },
      select: { accountId: true, asOfDate: true, amountMinor: true },
    }),
    prisma.fxRate.findMany({
      where: { asOfDate: { lte: today } },
      orderBy: { asOfDate: "desc" },
      select: { currencyCode: true, asOfDate: true, rateToPrimaryScaled: true },
    }),
  ]);

const locfByAccount = new Map<number, { asOfDate: string; amountMinor: bigint }>();
for (const snap of snapshotsLteToday) {
  if (!locfByAccount.has(snap.accountId)) {
    locfByAccount.set(snap.accountId, {
      asOfDate: snap.asOfDate,
      amountMinor: snap.amountMinor,
    });
  }
}
```

**Batch LOCF FX map** (from `src/app/currencies/rates/page.tsx:43-54`):
```typescript
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

**BigInt serialization at RSC boundary** (from `src/app/accounts/page.tsx:68-90`):
```typescript
// Serialize BigInt for client Dialog props (RSC boundary).
const accounts = accountsRaw.map((a) => {
  const locf = locfByAccount.get(a.id) ?? null;
  return {
    id: a.id,
    name: a.name,
    // ...
    locf: locf
      ? { asOfDate: locf.asOfDate, amountMinor: locf.amountMinor.toString() }
      : null,
  };
});
```

**Page shell** (from `src/app/accounts/page.tsx:93-105`):
```typescript
return (
  <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 font-sans">
    {/* hero «Капитал» + partial warning + DashboardAccountList */}
  </main>
);
```

**DB error handling** (from `src/app/page.tsx:5-15`, adapted per D-02):
```typescript
async function getDbReadiness(): Promise<"ok" | "not_ready"> {
  try {
    await ensureSqlitePragmas();
    await prisma.$queryRaw`SELECT 1`;
    // ...
    return Number(rows[0]?.c ?? 0) > 0 ? "ok" : "not_ready";
  } catch {
    return "not_ready";
  }
}
```
Wrap the full fetch in try/catch; on failure render Russian error inside the same `main` shell — do not redirect to a readiness page.

**Hero formatting** (from `src/lib/money.ts:64-75`):
```typescript
const heroAmount = formatMinorToMajor(totalPrimaryMinor, primaryScale);
// Display: «Капитал» + `{heroAmount} {primaryCode}`
```

---

### `src/components/dashboard/DashboardAccountList.tsx` (component, read-only CRUD display)

**Analog:** `src/components/accounts/AccountList.tsx` (flat bordered list + credit LocfDisplay)

**List container pattern** (from `src/components/accounts/AccountList.tsx:315-326`):
```typescript
return (
  <ul className="rounded-lg border border-border bg-background">
    {accounts.map((account) => (
      <DashboardAccountRow key={account.id} account={account} />
    ))}
  </ul>
);
```

**Empty state pattern** (from `src/components/accounts/AccountList.tsx:301-312`, CTA from `RateList.tsx:235-248`):
```typescript
if (accounts.length === 0) {
  return (
    <div className="flex flex-col items-start gap-4 py-8">
      <div className="grid gap-2">
        <h2 className="text-base font-semibold text-foreground">Нет счетов</h2>
        <p className="max-w-prose text-base text-muted-foreground">
          Создайте первый счёт, чтобы увидеть капитал.
        </p>
      </div>
      <Button render={<Link href="/accounts" />}>Перейти к счетам</Button>
    </div>
  );
}
```

**Credit native column — mirror LocfDisplay without as-of** (from `src/components/accounts/AccountList.tsx:53-87`):
```typescript
if (account.type === "FIAT_CREDIT" && account.creditLimitMinor != null) {
  const available = amount;
  const debt = formatMinorToMajor(
    creditDebtMinor(
      BigInt(account.creditLimitMinor),
      BigInt(account.locf.amountMinor),
    ),
    account.currency.scale,
  );
  return (
    <p className="font-mono text-sm text-foreground">
      <span>доступно {available} {code}</span>
      <span className="mx-2 text-muted-foreground">·</span>
      <span className="text-muted-foreground">долг {debt} {code}</span>
    </p>
  );
}
```

**Asset row native column** (from `src/components/accounts/AccountList.tsx:90-97`, omit as-of date):
```typescript
return (
  <p className="font-mono text-sm text-foreground">
    <span>{amount} {code}</span>
  </p>
);
```

**Row layout — read-only, no chevron/actions** (from `src/components/accounts/AccountList.tsx:193-218`, stripped):
```typescript
<li className="border-b border-border last:border-b-0">
  <div className="flex items-center gap-2 px-4 py-3 sm:gap-4">
    <div className="min-w-0 flex-1">
      <p className="truncate text-base text-foreground" title={account.name}>
        {account.name}
      </p>
      {/* native column */}
    </div>
    <div className="shrink-0 font-mono text-sm text-foreground">
      {/* primary column: converted OR «— · нет курса» OR «—» */}
    </div>
  </div>
</li>
```

**Missing states** (from `05-UI-SPEC.md` Copywriting Contract):
- No balance: native `нет баланса` (muted), primary `—`
- No FX: primary `— · нет курса` (muted hint)
- Credit primary: debt amount only — never available

**Component type:** Prefer Server Component (no `"use client"`) since D-16 forbids actions — pass pre-formatted display strings from page.tsx to avoid BigInt client boundary issues.

---

### `src/components/nav.tsx` (component, static config)

**Analog:** `src/components/nav.tsx` (modify in place)

**Links array** (from `src/components/nav.tsx:7-11`, update per D-01–D-04):
```typescript
const links = [
  { href: "/", label: "Главная" },
  { href: "/currencies/rates", label: "Валюты" },
  { href: "/accounts", label: "Счета" },
] as const;
```

**Active route matching** (from `src/components/nav.tsx:22-29` — keep unchanged):
```typescript
const active =
  href === "/"
    ? pathname === "/"
    : href === "/currencies/rates"
      ? pathname === "/currencies" || pathname.startsWith("/currencies/")
      : pathname === href || pathname.startsWith(`${href}/`);
```

**Nav shell** (from `src/components/nav.tsx:16-47`):
```typescript
<nav aria-label="Основная навигация" className="border-b border-border bg-muted/60">
  <ul className="mx-auto flex max-w-3xl gap-6 px-4 py-3 text-sm">
    {/* Link with cn() active underline */}
  </ul>
</nav>
```

---

## Shared Patterns

### BigInt serialization at RSC boundary
**Source:** `src/app/accounts/page.tsx:68-90`
**Apply to:** `page.tsx` data prep before any client subtree
```typescript
creditLimitMinor: a.creditLimitMinor == null ? null : a.creditLimitMinor.toString(),
locf: locf ? { asOfDate: locf.asOfDate, amountMinor: locf.amountMinor.toString() } : null,
```

### Money display formatting
**Source:** `src/lib/money.ts:64-75`
**Apply to:** Hero amount, all row columns
```typescript
export function formatMinorToMajor(minor: bigint, scale: number): string {
  assertScale(scale);
  const neg = minor < 0n;
  const abs = neg ? -minor : minor;
  // ... padStart scale split → `${intPart}.${frac}`
}
```

### LOCF batch map (first-wins descending date)
**Source:** `src/app/accounts/page.tsx:41-52`, `src/app/currencies/rates/page.tsx:43-54`
**Apply to:** Dashboard page data load — never N+1 `getBalanceAsOf` / `getRateAsOf`
```typescript
for (const snap of snapshotsLteToday) {
  if (!locfByAccount.has(snap.accountId)) {
    locfByAccount.set(snap.accountId, { /* ... */ });
  }
}
```

### Credit available never counts as asset
**Source:** `src/lib/balances.ts:15-21`, `src/components/accounts/AccountList.tsx:63-87`
**Apply to:** `net-worth.ts` aggregation + dashboard primary column
```typescript
// NW sum: −convert(creditDebtMinor(limit, available), …)
// Display: native shows available + debt; primary shows debt only
```

### Partial total warning UI
**Source:** `05-UI-SPEC.md:136-137`
**Apply to:** `page.tsx` between hero and list when `isPartial`
```typescript
{isPartial ? (
  <div className="rounded-lg border border-border bg-muted/60 p-4" role="status">
    <p className="text-sm font-medium text-foreground">Итог неполный</p>
    <p className="mt-1 text-sm text-muted-foreground">
      Не все счета учтены в сумме: у части счетов нет баланса или нет курса валюты.
      Задайте балансы на странице «Счета» и курсы на «Курсы».
    </p>
  </div>
) : null}
```

### Page layout rhythm
**Source:** `src/app/accounts/page.tsx:94`, `src/app/layout.tsx:27-30`
**Apply to:** Dashboard replaces centered readiness stub with list-page shell
```typescript
<main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 font-sans">
```

## No Analog Found

None — all Phase 5 files have direct in-repo analogs.

## Metadata

**Analog search scope:** `src/lib/`, `src/app/`, `src/components/accounts/`, `src/components/currencies/`, `src/components/nav.tsx`
**Files scanned:** 12
**Pattern extraction date:** 2026-09-03
**Git-tracked analogs verified:** all named analog paths confirmed via `git ls-files`
