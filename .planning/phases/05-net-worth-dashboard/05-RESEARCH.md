# Phase 5: Net Worth Dashboard - Research

**Researched:** 2026-09-03
**Domain:** Next.js RSC net-worth aggregation + read-only dashboard UI (LOCF balance × LOCF FX as of today)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
#### Dashboard placement & nav
- **D-01:** Replace **`/`** with the net-worth dashboard; remove the «Готовность» nav item (Phase 2 D-19). — **Reversibility:** costly — `/` is the default landing; reverting splits home vs dashboard again.
- **D-02:** Drop the standalone DB readiness page — if the database is unavailable, show a Russian error on the dashboard (no separate status screen). — **Reversibility:** reversible — readiness UI can return without schema changes.
- **D-03:** Nav label for `/` is **«Главная»**.
- **D-04:** Nav order: **«Главная»** first, then **«Валюты»**, then **«Счета»**.

#### Headline net worth
- **D-05:** Show **one hero number only** — no assets/liabilities split on the dashboard in this phase (NW-04 deferred to v2).
- **D-06:** Hero label: **«Капитал»** (not «Чистый капитал»).
- **D-07:** Primary currency display uses **code only** next to the amount (e.g. `1 234 567,89 RUB`), consistent with account list formatting.
- **D-08:** **No as-of date** on the hero number — «current» means LOCF as of today (Europe/Moscow) without extra subtitle.

#### Incomplete / partial data
- **D-09:** Account with **no balance snapshot** is **excluded from the capital total** and still listed on the dashboard where applicable.
- **D-10:** Non-primary account with **no FX rate** is **excluded from the capital total**; primary column shows **«—»** plus a **«нет курса»** hint (no link requirement in v1 — rates CRUD stays on `/currencies/rates`).
- **D-11:** When one or more accounts are excluded, show a **partial total** with a **prominent warning** until all accounts with balances can be converted and included (honest partial NW, not silent omission).
- **D-12:** **No accounts** → empty state with **CTA to create an account** (link/action toward `/accounts`).

#### Account list on dashboard
- **D-13:** **Flat list** — all accounts in one list (same mental model as `/accounts`, not grouped by type or currency).
- **D-14:** Row columns: **account name + balance in native currency + balance in primary currency** (NW-02 + NW-03).
- **D-15:** **Credit accounts:** in the native column show **available + debt** (mirror Phase 3 list semantics); in the **primary column show debt only** (the amount that reduces net worth). Available credit never appears as a positive asset in either column or the total (ACCT-03).
- **D-16:** Dashboard account list is **read-only** — no expandable history, no set-balance or edit actions; mutations remain on **`/accounts`**.

### Claude's Discretion
- Exact Russian copy for partial-total warning, «нет курса», and empty-state CTA; warning visual treatment (banner vs callout).
- NW aggregation module placement (`src/lib/net-worth.ts` or extend `balances.ts` / `fx.ts`); batch LOCF queries mirroring `/accounts` and `/currencies/rates` pages.
- Reuse `formatMinorToMajor`, `convertOtherMinorToPrimaryMinor`, `creditDebtMinor`, `calendarDateToday`; new dashboard components vs slim read-only variant of account row markup.
- Primary-currency accounts: identity conversion (no FX row); asset types (debit/crypto/cash) contribute positive native balance to NW; credit contributes negative debt in primary only.

### Deferred Ideas (OUT OF SCOPE)
- Historical net-worth and per-account charts — Phase 6 (CHART-01–03)
- Assets vs liabilities breakdown on charts — v2 NW-04
- Amount convert / rate calculator on rates tab — explicitly deferred Phase 4; not required on dashboard
- Expandable balance history or inline edit on dashboard — editing stays on `/accounts`
- Dedicated `/dashboard` route or retained DB readiness page — not chosen
- FX missing-state deep link «Задать курс» — user chose hint only, not required link
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NW-01 | User can see current net worth (assets − credit debt) in primary currency | Pure `computeNetWorth` helper sums asset LOCF (converted) minus credit debt (converted); hero «Капитал» on `/`; batch LOCF today; partial total when exclusions (D-09–D-11) |
| NW-02 | User can see each account balance in its native currency | Read-only dashboard rows: asset = native LOCF amount; credit = available + debt (mirror `LocfDisplay` without as-of date) |
| NW-03 | User can see each account balance converted to primary currency | `convertOtherMinorToPrimaryMinor` for non-primary assets; credit primary column = debt in primary only; primary-currency identity; «— · нет курса» when FX missing |
| ACCT-03 | User can see available credit as limit − debt (display only, never counted as asset) | Credit native column shows available; NW math uses `creditDebtMinor` only; available never added to hero total or primary asset column |
</phase_requirements>

## Summary

Phase 5 replaces the readiness stub at `/` with a **read-only net-worth dashboard** that composes existing LOCF primitives from Phases 3–4. The page Server Component batch-loads accounts, balance snapshots ≤ today, and FX rates ≤ today (same maps as `/accounts` and `/currencies/rates`), then calls a **pure aggregation module** to compute per-row display state, signed primary-minor contributions, and the hero total. Credit semantics are the highest-risk area: available credit is display-only; only **debt** reduces net worth. No schema changes, no new npm packages, no Server Actions — UI + lib helpers only.

**Primary recommendation:** Add `src/lib/net-worth.ts` with pure `computeNetWorthRows` / `computeNetWorthTotal` (unit-tested, Phase 6–reusable); replace `src/app/page.tsx` with dashboard RSC; add `src/components/dashboard/DashboardAccountList.tsx` (read-only three-column list); update `src/components/nav.tsx` per D-01–D-04; copy partial-warning / empty-state chrome from `05-UI-SPEC.md`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| LOCF balance read (today) | API / Backend | Database / Storage | Batch `balanceSnapshot.findMany({ asOfDate: { lte: today } })` — same contract as `/accounts` |
| LOCF FX read (today) | API / Backend | Database / Storage | Batch `fxRate.findMany({ asOfDate: { lte: today } })` — same contract as `/currencies/rates` |
| NW aggregation (assets − debt) | API / Backend | — | Pure BigInt math in `net-worth.ts`; must not live in React components (Phase 6 reuse) |
| Credit debt derivation | API / Backend | — | Reuse `creditDebtMinor`; never treat `creditLimitMinor` or available as assets |
| Primary ↔ other conversion | API / Backend | — | Reuse `convertOtherMinorToPrimaryMinor`; null FX → exclude from total (D-10) |
| Hero + account list UI | Frontend Server (SSR) | Browser / Client | RSC renders formatted strings; optional client-free list (no Dialog/actions) |
| Nav labels/order | Browser / Client | — | `nav.tsx` client component; static link config |
| DB availability signal | Frontend Server (SSR) | Database / Storage | Inline try/catch on page fetch — Russian error, no separate readiness route (D-02) |
| Money display formatting | Frontend Server (SSR) | — | `formatMinorToMajor` + currency code at RSC boundary |

## Project Constraints (from .cursor/rules/)

None — `.cursor/rules/` absent this session. Follow Phase 1–4 stack locks; user rule prefers codegraph for search (graphify disabled — used Read/Grep). RESEARCH.md stays normal prose.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | **16.3.4** (pinned) | App Router RSC dashboard at `/`, `force-dynamic` | Phase 1 lock `[VERIFIED: package.json:22]` |
| react / react-dom | **19.2.8** | Server Components + optional `Link`/`Button asChild` CTA | Phase 1 pin `[VERIFIED: package.json:24-25]` |
| prisma / @prisma/client | **7.10.0** | Batch LOCF reads (no new models) | Phase 1 lock `[VERIFIED: package.json:15-16,23]` |
| better-sqlite3 | **13.0.3** | SQLite driver | Phase 1 pin `[VERIFIED: package.json:17,43-45]` |
| shadcn/ui (base-nova) | existing Button | Empty-state CTA only | `05-UI-SPEC.md`; no Alert/Card/Table required |
| lucide-react | ^1.39.0 | Optional `AlertTriangle` on partial-warning callout | UI-SPEC discretion |
| vitest | **4.1.11** | NW aggregation unit tests | Existing harness `[VERIFIED: package.json:41]` `[VERIFIED: vitest.config.ts]` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@/lib/balances` | in-repo | `calendarDateToday`, `creditDebtMinor` | Today date + credit debt |
| `@/lib/fx` | in-repo | `convertOtherMinorToPrimaryMinor` | Non-primary → primary column + NW sum |
| `@/lib/money` | in-repo | `formatMinorToMajor` | All amount display |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| New `src/lib/net-worth.ts` | Extend `balances.ts` / `fx.ts` | NW is cross-cutting (balance + FX + account type); dedicated module keeps Phase 6 import clean — **recommended** |
| Extract shared credit display component | Duplicate `LocfDisplay` markup in dashboard | Extraction reduces drift between `/accounts` and dashboard credit copy; duplication OK if planner wants minimal diff |
| shadcn Alert/Card for hero | Semantic `<section>` + typography | UI-SPEC forbids new primitives solely for dashboard — match `/accounts` bordered list |
| Russian `Intl.NumberFormat` locale | Existing `formatMinorToMajor` (dot decimal) | Account list already uses dot (`1234.56`); CONTEXT D-07 example uses spaced/comma — **follow existing formatter** unless product explicitly adds locale helper (out of locked scope) |
| Dedicated `/dashboard` route | Replace `/` | Locked out (D-01) |

**Installation:**

```bash
# No new npm packages.
```

**Version verification:** Project pins `next@16.3.4`, `prisma@7.10.0`, `vitest@4.1.11` confirmed via `package.json` this session. Registry lists `vitest@5.0.0` — **do not upgrade** (Phase 1 pin).

## Package Legitimacy Audit

> Phase 5 installs **no new npm packages**.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| (none new) | — | — | — | — | — | N/A |

**Packages removed due to [SLOP] verdict:** none  
**Packages flagged as suspicious [SUS]:** none newly introduced

## Architecture Patterns

### System Architecture Diagram

```text
Browser (RU dashboard at /)
  │  Nav: Главная · Валюты · Счета (D-03, D-04)
  │  RSC page.tsx: batch fetch accounts + LOCF balances + LOCF FX (today)
  │  Hero: «Капитал» + partial NW total
  │  Optional partial-warning callout (D-11)
  │  Read-only flat account list (name · native · primary)
  ▼
src/lib/net-worth.ts (pure, no Prisma)
  │  per account: inclusion?, signed contribution in primary minor
  │  asset: +convert(balanceNative → primary)
  │  credit: −convert(debtNative → primary); available display-only
  │  primary currency: identity (no FX row)
  │  null LOCF → exclude; non-primary null FX → exclude
  ▼
Existing helpers
  │  calendarDateToday()           ← balances.ts
  │  creditDebtMinor(limit, avail) ← balances.ts
  │  convertOtherMinorToPrimaryMinor ← fx.ts
  │  formatMinorToMajor            ← money.ts
  ▼
prisma (SQLite) — read only
  ├── Account (+ Currency)
  ├── BalanceSnapshot (LOCF ≤ today)
  └── FxRate (LOCF ≤ today, non-primary only)
```

### Recommended Project Structure

```
src/
├── app/
│   └── page.tsx                      # REPLACE readiness stub → NW dashboard RSC
├── components/
│   ├── dashboard/
│   │   └── DashboardAccountList.tsx  # NEW read-only 3-column list
│   └── nav.tsx                       # UPDATE links/order (D-01–D-04)
├── lib/
│   ├── net-worth.ts                  # NEW pure aggregation (Phase 6 reuse)
│   └── net-worth.test.ts             # NEW unit tests (NW-01–03, ACCT-03)
├── lib/balances.ts                   # reuse calendarDateToday, creditDebtMinor
├── lib/fx.ts                         # reuse convertOtherMinorToPrimaryMinor
└── lib/money.ts                      # reuse formatMinorToMajor
```

### Pattern 1: Batch LOCF fetch (mirror existing pages)

**What:** One round-trip per table; build `Map` first-wins descending date — identical to `/accounts` and `/currencies/rates`.

**When to use:** Dashboard `page.tsx` data load (avoid N× `getBalanceAsOf` / `getRateAsOf`).

**Example:**

```typescript
// Source: src/app/accounts/page.tsx:11-52, src/app/currencies/rates/page.tsx:11-54
const today = calendarDateToday("Europe/Moscow");

const [accountsRaw, primaryCurrency, snapshotsLteToday, ratesLteToday] =
  await Promise.all([
    prisma.account.findMany({ include: { currency: true }, orderBy: { name: "asc" } }),
    prisma.currency.findFirst({ where: { isPrimary: true }, select: { code: true, scale: true } }),
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
    locfByAccount.set(snap.accountId, { asOfDate: snap.asOfDate, amountMinor: snap.amountMinor });
  }
}

const locfByCurrency = new Map<string, { asOfDate: string; rateToPrimaryScaled: bigint }>();
for (const rate of ratesLteToday) {
  if (!locfByCurrency.has(rate.currencyCode)) {
    locfByCurrency.set(rate.currencyCode, {
      asOfDate: rate.asOfDate,
      rateToPrimaryScaled: rate.rateToPrimaryScaled,
    });
  }
}
```

### Pattern 2: Pure NW aggregation (`net-worth.ts`)

**What:** Deterministic BigInt aggregation with explicit inclusion/exclusion reasons for UI + tests.

**When to use:** After maps built; before formatting; export for Phase 6 chart series.

**Recommended types and logic sketch:**

```typescript
// Account types verbatim from schema:
// "FIAT_DEBIT" | "FIAT_CREDIT" | "CRYPTO" | "CASH"
// [VERIFIED: prisma/schema.prisma:12-17]

export type NetWorthAccountInput = {
  id: number;
  type: "FIAT_DEBIT" | "FIAT_CREDIT" | "CRYPTO" | "CASH";
  currencyCode: string;
  currencyScale: number;
  isPrimaryCurrency: boolean;
  creditLimitMinor: bigint | null;
  /** LOCF amountMinor; null = no snapshot (BAL-02). Credit: available remaining. */
  locfAmountMinor: bigint | null;
  /** LOCF rate for non-primary; null = no rate (FX-02 / D-15). Ignored when isPrimaryCurrency. */
  rateToPrimaryScaled: bigint | null;
  primaryScale: number;
};

export type NetWorthRow = {
  accountId: number;
  includedInTotal: boolean;
  excludeReason: "none" | "no_balance" | "no_fx";
  /** Signed primary-minor contribution to hero total (0n if excluded). */
  contributionPrimaryMinor: bigint;
  /** For display: asset native balance or credit available (null if no LOCF). */
  nativeDisplayMinor: bigint | null;
  /** Credit only: debt in native minor (null if not credit or no LOCF). */
  debtNativeMinor: bigint | null;
  /** Primary column magnitude: asset converted balance OR credit debt in primary (null if N/A). */
  primaryDisplayMinor: bigint | null;
};

export function computeNetWorthRows(
  accounts: NetWorthAccountInput[],
): { rows: NetWorthRow[]; totalPrimaryMinor: bigint; isPartial: boolean } {
  const rows = accounts.map(/* see rules below */);
  const totalPrimaryMinor = rows.reduce(
    (sum, r) => sum + r.contributionPrimaryMinor,
    0n,
  );
  const isPartial = rows.some((r) => !r.includedInTotal);
  return { rows, totalPrimaryMinor, isPartial };
}
```

**Inclusion rules (locked):**

| Case | includedInTotal | contribution | primaryDisplay |
|------|-----------------|--------------|----------------|
| No LOCF | false (`no_balance`) | `0n` | null / «—» |
| Asset, primary currency | true | `+locfAmountMinor` | same as native |
| Asset, non-primary, has FX | true | `+convert(locf, rate, scales)` | converted balance |
| Asset, non-primary, no FX | false (`no_fx`) | `0n` | null + hint |
| Credit, has LOCF + FX (or primary) | true | `−convert(debtNative, …)` | debt in primary only |
| Credit, no FX (non-primary) | false (`no_fx`) | `0n` | null + hint |

**Debt native:** `creditDebtMinor(creditLimitMinor!, locfAmountMinor)` `[VERIFIED: src/lib/balances.ts:16-21]`

**Conversion:** `convertOtherMinorToPrimaryMinor(minor, rate, otherScale, primaryScale)` `[VERIFIED: src/lib/fx.ts:21-31]` — for primary-currency accounts, skip FX and use identity (`minor` already primary minor).

### Pattern 3: Read-only dashboard list

**What:** Flat bordered `<ul>` like `AccountList` but **no** expand chevron, Dialogs, or actions (D-16).

**Row markup rules** (from UI-SPEC + Phase 3 credit copy):

```typescript
// Credit native column — mirror AccountList LocfDisplay without as-of date:
// "доступно {available} {CODE} · долг {debt} {CODE}"
// [VERIFIED: src/components/accounts/AccountList.tsx:76-87]

// Credit primary column — debt only:
// "{debtPrimary} {PRIMARY}" or "долг {debtPrimary} {PRIMARY}" per UI-SPEC table

// Missing states:
// native: «нет баланса»; primary: «—»
// missing FX: primary «— · нет курса»
```

Serialize all BigInt to string before passing props to any client subtree (existing RSC boundary pattern `[VERIFIED: src/app/accounts/page.tsx:68-90]`).

### Pattern 4: Page shell + error handling

**What:** Replace readiness UI; keep `export const dynamic = "force-dynamic"` `[VERIFIED: src/app/page.tsx:3]`.

**DB failure (D-02):** Wrap prisma fetch in try/catch; render Russian copy from UI-SPEC (`Не удалось загрузить данные…`) inside standard `main` shell — do **not** redirect to a separate readiness page.

**Empty accounts (D-12):** Omit hero block; show empty state + `Button asChild` → `/accounts`.

**Partial total (D-11):** Always show hero amount (may be partial); when `isPartial`, render callout between hero and list (`bg-muted`, `border-border`, optional `AlertTriangle`).

### Anti-Patterns to Avoid

- **Summing `creditLimitMinor` or available credit into NW** — metadata/display only (ACCT-03, schema comment `[VERIFIED: prisma/schema.prisma:35-36]`).
- **Treating missing LOCF/FX as zero in the total** — exclude account; show partial warning (D-09, D-10, D-11).
- **N+1 LOCF queries** — use batch maps (Phase 3 lesson).
- **Mutations on dashboard** — breaks D-16; keep CRUD on `/accounts` and `/currencies`.
- **Assets/liabilities split or as-of subtitle on hero** — deferred / locked out (D-05, D-08, NW-04).
- **Client-side NW math from raw BigInt props** — compute on server; pass formatted strings or pre-computed display fields.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| LOCF balance as of today | Per-account queries in a loop | Batch snapshot map (accounts page pattern) | Performance + proven LOCF semantics |
| LOCF FX as of today | Default rate 1 or 0 | Batch FX map + null exclusion | D-15 / FX-02 honesty |
| Credit debt amount | Store debt in snapshots | `creditDebtMinor(limit, available)` | Phase 3 D-05–D-06 single source |
| Primary conversion math | Float × rate | `convertOtherMinorToPrimaryMinor` (BigInt) | Scale-8 truncation already tested |
| Money formatting | `Number()` / `toFixed` | `formatMinorToMajor` | INTEGER minor contract |
| Partial-total detection | UI heuristics | `isPartial` flag from aggregation | Testable; same rules for Phase 6 |
| New chart/NW API route | `/api/net-worth` | RSC page + exported lib helper | Matches snapshot-first local app; Phase 6 imports lib |

**Key insight:** Phase 5 is **composition** of Phase 3–4 primitives plus honest exclusion rules — the bug surface is credit sign/display, not new infrastructure.

## Common Pitfalls

### Pitfall 1: Available credit counted as asset
**What goes wrong:** Hero total inflates by unused credit limit or available balance.  
**Why it happens:** Credit snapshots store **available**, not debt.  
**How to avoid:** NW sum uses `creditDebtMinor` only; native column may show available for UX (D-15).  
**Warning signs:** Total increases when user enters higher available on credit card.

### Pitfall 2: Silent omission instead of partial warning
**What goes wrong:** User sees a total that looks complete while USD account without FX is dropped.  
**Why it happens:** Skipping `isPartial` UI when `totalPrimaryMinor` is still non-zero.  
**How to avoid:** `isPartial = any(!includedInTotal)` among all accounts (D-11); UI-SPEC callout copy.  
**Warning signs:** Account row shows «нет курса» but no banner.

### Pitfall 3: Primary currency account blocked on missing FX row
**What goes wrong:** RUB account excluded because `locfByCurrency` has no row for primary code.  
**Why it happens:** FX table only stores non-primary pairs (D-16 Phase 4).  
**How to avoid:** Branch `isPrimaryCurrency` → identity conversion; never require FX row for primary code.  
**Warning signs:** Primary debit with balance excluded with `no_fx`.

### Pitfall 4: Credit row shows available in primary column
**What goes wrong:** ACCT-03 violated — available treated as wealth in primary column.  
**Why it happens:** Reusing asset row template for credit.  
**How to avoid:** Primary column = converted **debt** only (UI-SPEC table).  
**Warning signs:** Primary column matches available native amount.

### Pitfall 5: BigInt leaked to client components
**What goes wrong:** RSC serialization error or client math with precision loss.  
**Why it happens:** Passing raw `bigint` across client boundary.  
**How to avoid:** Format on server or stringify at boundary (accounts page pattern).  
**Warning signs:** Next.js serialization warning on dashboard props.

### Pitfall 6: Readiness stub left alongside dashboard
**What goes wrong:** Nav still shows «Готовность» or duplicate home semantics.  
**Why it happens:** Partial nav update.  
**How to avoid:** D-01 + D-03 + D-04 in same plan task as `page.tsx` replace.  
**Warning signs:** Two home links or readiness heading still on `/`.

## Code Examples

### Net-worth unit test matrix (Wave 0 target)

```typescript
// src/lib/net-worth.test.ts — pure tests, no Prisma mock needed
import { describe, expect, it } from "vitest";
import { computeNetWorthRows } from "./net-worth";

describe("computeNetWorthRows (NW-01–03, ACCT-03)", () => {
  it("sums asset in primary currency", () => {
    const { totalPrimaryMinor, isPartial } = computeNetWorthRows([
      {
        id: 1,
        type: "FIAT_DEBIT",
        currencyCode: "RUB",
        currencyScale: 2,
        isPrimaryCurrency: true,
        creditLimitMinor: null,
        locfAmountMinor: 100_000n,
        rateToPrimaryScaled: null,
        primaryScale: 2,
      },
    ]);
    expect(totalPrimaryMinor).toBe(100_000n);
    expect(isPartial).toBe(false);
  });

  it("subtracts credit debt only, never available", () => {
    const { rows, totalPrimaryMinor } = computeNetWorthRows([
      {
        id: 2,
        type: "FIAT_CREDIT",
        currencyCode: "RUB",
        currencyScale: 2,
        isPrimaryCurrency: true,
        creditLimitMinor: 500_000n,
        locfAmountMinor: 300_000n, // available → debt 200_000
        rateToPrimaryScaled: null,
        primaryScale: 2,
      },
    ]);
    expect(rows[0]!.contributionPrimaryMinor).toBe(-200_000n);
    expect(totalPrimaryMinor).toBe(-200_000n);
  });

  it("excludes non-primary asset without FX and sets isPartial", () => {
    const { totalPrimaryMinor, isPartial, rows } = computeNetWorthRows([
      {
        id: 3,
        type: "CRYPTO",
        currencyCode: "USDT",
        currencyScale: 2,
        isPrimaryCurrency: false,
        creditLimitMinor: null,
        locfAmountMinor: 50_000n,
        rateToPrimaryScaled: null,
        primaryScale: 2,
      },
    ]);
    expect(totalPrimaryMinor).toBe(0n);
    expect(isPartial).toBe(true);
    expect(rows[0]!.excludeReason).toBe("no_fx");
  });
});
```

### Hero + partial warning render sketch

```typescript
// Server Component fragment — format on server
import { formatMinorToMajor } from "@/lib/money";

const heroAmount = formatMinorToMajor(totalPrimaryMinor, primaryScale);
// Display: «Капитал» label + `{heroAmount} {primaryCode}`

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

Copy verbatim from `05-UI-SPEC.md` Copywriting Contract `[VERIFIED: .planning/phases/05-net-worth-dashboard/05-UI-SPEC.md:136-137]`.

### Nav update

```typescript
// src/components/nav.tsx — replace links array
const links = [
  { href: "/", label: "Главная" },
  { href: "/currencies/rates", label: "Валюты" },
  { href: "/accounts", label: "Счета" },
] as const;
// Remove «Готовность» entry [VERIFIED: src/components/nav.tsx:7-11]
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `/` DB readiness stub | `/` NW dashboard | Phase 5 (D-01) | Default landing shows capital |
| NW math deferred | Pure lib aggregation + tests | Phase 5 | Phase 6 charts import same helper |
| Account list as only balance surface | Dashboard read-only mirror | Phase 5 | NW-02/03 without mutation chrome |
| Separate FX/balance LOCF pages | Composed batch fetch on home | Phase 5 | One view of true current NW |

**Deprecated/outdated:**
- `getDbReadiness()` as primary `/` UX — inline error only (D-02); helper may remain inside try/catch.
- Nav label «Готовность» — replaced by «Главная» (D-03).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Amount display uses existing `formatMinorToMajor` (dot decimal), not spaced/comma RU locale | Standard Stack / D-07 | Visual mismatch vs UI-SPEC example; low functional risk |
| A2 | Hero shows `0,00 {PRIMARY}` when accounts exist but none includable | Pattern 4 / UI-SPEC E2 | Product may prefer hiding hero — UI-SPEC says prefer partial zero |
| A3 | Partial warning when **any** account excluded, including no-balance rows | Pattern 2 | Under-warning if product only wants FX-missing banner |
| A4 | Credit primary column shows debt amount without extra «долг» prefix if UI-SPEC row table uses plain amount | Pattern 3 | Copy tweak only |
| A5 | `computeNetWorthRows` exported for Phase 6 without date parameter; Phase 6 adds `asOfDate` wrapper | Pattern 2 | Small refactor later |

## Open Questions

1. **Russian number grouping (spaces + comma decimal)**
   - What we know: CONTEXT D-07 example `1 234 567,89 RUB`; account list uses `formatMinorToMajor` → dot (`900000.00`) `[VERIFIED: src/lib/money.ts:64-75]`.
   - What's unclear: Whether Phase 5 introduces locale formatting or keeps dot for consistency.
   - Recommendation: **Keep dot formatter** (consistent with `/accounts`); note in human-verify. Locale helper is new scope.

2. **Extract shared credit display vs duplicate markup**
   - What we know: Discretion allows either; drift risk if duplicated.
   - Recommendation: Extract small `CreditLocfLines` presentational component shared by `AccountList` and dashboard if planner wants one task; otherwise duplicate minimal markup.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Next/Prisma/Vitest | ✓ | v24.5.0 | — |
| npm | scripts | ✓ | 10.9.3 | — |
| SQLite via better-sqlite3 | LOCF reads | ✓ (pin 13.0.3) | — | — |
| Docker | optional smoke | ✓ | 29.5.3 | Host dev |
| graphify / codegraph | project search | ✗ disabled | — | Read/Grep |
| Context7 | docs lookup | ✗ | — | In-repo Next patterns |

**Missing dependencies with no fallback:** none for Phase 5 implementation.

**Missing dependencies with fallback:** graphify disabled — used Read/Grep on known paths.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest **4.1.11** |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run src/lib/net-worth.test.ts` |
| Full suite command | `npm test` (`vitest run`) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NW-01 | Hero total = Σ asset contributions − Σ credit debt (primary minor) | unit | `npx vitest run src/lib/net-worth.test.ts -t "sums asset"` | ❌ Wave 0 |
| NW-01 | Credit debt reduces total; available not in sum | unit | `npx vitest run src/lib/net-worth.test.ts -t "subtracts credit debt"` | ❌ Wave 0 |
| NW-01 | Missing balance/FX excluded; partial flag | unit | `npx vitest run src/lib/net-worth.test.ts -t "excludes"` | ❌ Wave 0 |
| NW-01 | Primary currency identity (no FX row required) | unit | `npx vitest run src/lib/net-worth.test.ts -t "primary currency"` | ❌ Wave 0 |
| NW-02 | Native column semantics per account type | unit/component | `npx vitest run src/lib/net-worth.test.ts -t "nativeDisplay"` | ❌ Wave 0 |
| NW-03 | Converted primary column + null FX state | unit | `npx vitest run src/lib/net-worth.test.ts -t "primaryDisplay\|no_fx"` | ❌ Wave 0 |
| ACCT-03 | Available displayed but contribution uses debt only | unit | `npx vitest run src/lib/net-worth.test.ts -t "available"` | ❌ Wave 0 |
| FX-02 regression | Conversion math unchanged | unit | `npx vitest run src/lib/fx.test.ts` | ✅ |
| BAL-02 regression | LOCF helpers unchanged | unit | `npx vitest run src/lib/balances.test.ts` | ✅ |
| UI chrome | Nav order, hero, partial banner, empty CTA | manual | human-verify end-of-phase | — |
| DB error | Russian error on fetch failure | manual | stop DB / break URL; reload `/` | — |

### Sampling Rate

- **Per task commit:** `npx vitest run src/lib/net-worth.test.ts` (or `-t` filter for touched cases)
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green (110+ tests) before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/lib/net-worth.ts` — pure aggregation API for rows + total + `isPartial`
- [ ] `src/lib/net-worth.test.ts` — matrix covering NW-01–03, ACCT-03, primary identity, mixed portfolio
- [ ] `src/app/page.tsx` — replace readiness stub with dashboard RSC
- [ ] `src/components/dashboard/DashboardAccountList.tsx` — read-only list
- [ ] `src/components/nav.tsx` — Главная first; remove Готовность
- [ ] Framework install: none — vitest already present

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Single local user; no auth in v1 |
| V3 Session Management | no | N/A |
| V4 Access Control | no | Single-user local app |
| V5 Input Validation | no new mutations | Read-only phase — no new Server Actions |
| V6 Cryptography | no | BigInt display only; no new crypto |

### Known Threat Patterns for Next.js + Prisma + SQLite wallet

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via account names in dashboard rows | Spoofing | React text escaping; names constrained at create-time |
| Float corruption if client NW math added later | Tampering | Keep aggregation server-side / pure BigInt lib |
| Error message leaks stack traces to UI | Information disclosure | User-facing Russian generic copy; log server-side only |

## Sources

### Primary (HIGH confidence)

- `.planning/phases/05-net-worth-dashboard/05-CONTEXT.md` — locked D-01–D-16
- `.planning/phases/05-net-worth-dashboard/05-UI-SPEC.md` — copy, layout, component inventory
- `prisma/schema.prisma` — AccountType enum, credit limit invariant
- `src/lib/balances.ts` — LOCF, `creditDebtMinor`, `calendarDateToday`
- `src/lib/fx.ts` — `convertOtherMinorToPrimaryMinor`
- `src/lib/money.ts` — `formatMinorToMajor`, `RATE_SCALE_E8`
- `src/app/accounts/page.tsx` — batch LOCF balance pattern
- `src/app/currencies/rates/page.tsx` — batch LOCF FX pattern
- `src/components/accounts/AccountList.tsx` — credit display semantics
- `src/app/page.tsx`, `src/components/nav.tsx` — replace/update targets
- `package.json`, `vitest.config.ts` — test harness
- Phase 3–4 RESEARCH — LOCF/null/exclusion precedents

### Secondary (MEDIUM confidence)

- `.planning/REQUIREMENTS.md` — NW-01–03, ACCT-03 traceability
- `.planning/ROADMAP.md` — Phase 5 success criteria

### Tertiary (LOW confidence)

- UI-SPEC Russian grouped number example vs dot `formatMinorToMajor` — resolved as A1

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — zero new packages; reuse Phase 1–4 pins and helpers
- Architecture: **HIGH** — batch LOCF + pure aggregation mirrors proven pages; CONTEXT locks routes and semantics
- Pitfalls: **HIGH** — credit/available/debt rules explicit in CONTEXT + schema + existing tests

**Research date:** 2026-09-03  
**Valid until:** 2026-10-03 (stable stack; revisit if locale formatting added)
