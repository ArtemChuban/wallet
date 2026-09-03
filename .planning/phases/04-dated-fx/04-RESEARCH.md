# Phase 4: Dated FX - Research

**Researched:** 2026-09-03
**Domain:** Prisma SQLite dated FX rates + LOCF reads + Currencies-area tabs UI
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
#### Entry surface (inside Currencies)
- **D-01:** FX UI lives **inside Currencies**, not a separate top-level `/fx` nav item. — **Reversibility:** reversible — a dedicated nav link can be added later without changing the rate model.
- **D-02:** Currencies area uses **tabs**: «Валюты» | «Курсы».
- **D-03:** Default landing for the currencies area opens **«Курсы»** (rates-first for this phase’s workflow).
- **D-04:** URL paths: **`/currencies`** = currency list tab; **`/currencies/rates`** = rates tab. — **Reversibility:** costly — path is the shareable contract for nav and bookmarks; changing it needs redirects.

#### Rate entry
- **D-05:** Set-rate Dialog includes a **direction toggle**. Storage always persists **`rateToPrimaryScaled`** (primary units per 1 unit of other × 10⁸, Phase 1 D-09 / stub). Inverse UI input is converted before write.
- **D-06:** Default direction on open: **«1 other = N primary»** (matches storage).
- **D-07:** Other-currency picker lists **all non-primary currencies** (even with zero accounts).
- **D-08:** Default as-of date = **today** in **Europe/Moscow**; **future dates forbidden** (mirror Phase 3 D-12).
- **D-09:** Entered/stored rate must be **> 0**; zero and negative rejected with Russian error copy.

#### List vs history
- **D-10:** Rates tab lists **one row per non-primary currency** showing **current LOCF rate** (as of today) **plus the as-of date** of the rate that produced it; history opens by **expanding the row** (same pattern as account balance history). — **Reversibility:** reversible — layout can change without touching uniqueness.
- **D-11:** At most **one rate per (currencyCode, asOfDate)** — same-date set **upserts/overwrites**. — **Reversibility:** costly — uniqueness is the LOCF contract; relaxing it breaks as-of reads.
- **D-12:** Past rates may be **overwritten** (set with that date) and **deleted**.
- **D-13:** **Delete UI lives only in the expand history list** — not inside the set-rate Dialog (mirror Phase 3 D-11).
- **D-14:** Currency with **no rates yet** shows **«Нет курса»** plus a set-rate action (not a silent blank row).

#### Missing rate / convert semantics
- **D-15:** `getRateAsOf(currencyCode, D)` returns **`null`** when no rate has `asOfDate ≤ D` — never invent `0` or `1` for a non-primary currency (parallel to BAL-02). — **Reversibility:** one-way — callers (Phase 5–6) must handle null; inventing a default later would rewrite historical honesty.
- **D-16:** **Primary → primary** conversion is always **identity (×1)** with **no FX row** stored for the primary currency against itself.
- **D-17:** Phase 4 UI is **rate CRUD + LOCF helper only** — **no** amount convert/preview calculator on the rates tab. Amount × rate UI belongs to Phase 5 (net worth). Prove LOCF/convert math in unit tests on the helper.

### Claude's Discretion
- Rename/replace `FxRateStub` with the real Prisma model; unique constraint shape `(currencyCode, asOfDate)`; Server Action / Zod wiring; Russian chrome labels for tabs/dialog/errors; expand/collapse affordance; rate parse/format helpers next to `RATE_SCALE_E8` in `src/lib/money.ts` (or sibling module) — choose standard Next.js + Prisma + shadcn patterns consistent with Phases 1–3.
- History ordering newest-first (mirror Phase 3 D-14) unless a strong reason appears during planning.

### Deferred Ideas (OUT OF SCOPE)
- **FX-03** optional API fetch + save as dated manual row — v2 (REQUIREMENTS.md)
- Amount convert / net-worth preview UI — Phase 5
- Historical charts using as-of FX — Phase 6
- Automatic live FX without dated rows — out of scope (REQUIREMENTS.md)
- Arbitrary non-primary FX pairs — out of scope for v1
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FX-01 | User can set a dated exchange rate between primary and another currency | Replace `FxRateStub` with dated `FxRate`; Dialog upsert; direction toggle → always store `rateToPrimaryScaled`; reject primary/self and non-primary↔non-primary; future dates forbidden |
| FX-02 | Totals and charts as of date D use the latest rate with effective date ≤ D | Shared `getRateAsOf(currencyCode, D)` LOCF (`findFirst` / batch pick, `asOfDate <= D` desc); return `null` before first rate; forward-effective by design (new rows do not rewrite older as-of reads). Phase 4 ships helper + unit proof; Phase 5–6 consume it for totals/charts |
</phase_requirements>

## Summary

Phase 4 replaces the Phase 1 `FxRateStub` with a real **dated primary↔other FX** table and mirrors Phase 3’s LOCF + expand-history UX inside the Currencies area. Mutations stay Server Actions + Zod; money stays BigInt with fixed rate scale `RATE_SCALE_E8` (`100000000n`). UI adds `/currencies` | `/currencies/rates` tabs (nav lands on rates) without a fourth top-level nav item. No amount preview calculator — only rate CRUD + helpers Phase 5–6 will call.

**Primary recommendation:** Rename stub → model `FxRate` (`currencyCode` FK → `Currency`, `asOfDate` `YYYY-MM-DD`, `rateToPrimaryScaled` BigInt, `@@unique([currencyCode, asOfDate], name: "currencyCode_asOfDate")`); put LOCF in `src/lib/fx.ts` (`getRateAsOf`); extend `money.ts` with rate parse/format (+ optional invert / convert-minor pure helpers for tests); Server Actions under `src/app/currencies/`; rates list mirroring `AccountList` expand/delete — **no new npm packages**.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Rate persistence + uniqueness | Database / Storage | API / Backend | SQLite unique `(currencyCode, asOfDate)` is LOCF contract (D-11) |
| Primary↔other pair enforcement | API / Backend | Database / Storage | Reject `isPrimary` currencyCode in Server Action; no self-rate rows (D-16); FK alone insufficient |
| LOCF as-of rate read | API / Backend | Database / Storage | Shared helper for Phase 5–6 (FX-02); null before first (D-15) |
| Direction toggle → storage | Browser / Client | API / Backend | UX only; server always persists `rateToPrimaryScaled` (D-05) |
| Set / overwrite / delete mutations | API / Backend | Browser / Client | Server Actions + Zod (Phase 1 D-02) |
| Rates list + history UI | Frontend Server (SSR) | Browser / Client | RSC loads LOCF today + histories; client Dialog / expand / delete |
| Currencies tabs + default landing | Frontend Server (SSR) | Browser / Client | Nested layout Links; nav href `/currencies/rates` (D-01–D-04) |
| “Today” / future-date gate | API / Backend | Browser / Client | Reuse `calendarDateToday()`; server rejects `asOfDate > today` (D-08) |
| Rate parse/format (×10⁸) | API / Backend | Browser / Client | Reuse `parseMajorToMinor`/`formatMinorToMajor` at scale 8 + `RATE_SCALE_E8` |

## Project Constraints (from .cursor/rules/)

None — `.cursor/rules/` absent this session. Follow Phase 1–3 CONTEXT/stack locks; user rule: use codegraph for project search when available (graphify disabled — see Environment). RESEARCH.md and commits stay normal prose.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | **16.3.4** (pinned) | App Router layout + nested `/currencies/rates` + Server Actions | Phase 1 lock `[VERIFIED: package.json:22]` |
| react / react-dom | **19.2.8** | `useActionState` Dialog forms | Phase 1 pin `[VERIFIED: package.json:24-25]` |
| prisma / @prisma/client / adapter | **7.10.0** | Schema, migrate, LOCF, compound upsert | Phase 1 lock — do **not** upgrade to Prisma 8 RC `[VERIFIED: package.json:15-16,23]` |
| better-sqlite3 | **13.0.3** | SQLite driver | Phase 1 pin + overrides `[VERIFIED: package.json:17,43-45]` |
| zod | **4.5.4** | Server Action validation | Existing balance/currency patterns `[VERIFIED: package.json:29]` |
| shadcn/ui (base-nova) | existing Dialog/Input/Label/Select/Button | Set-rate Dialog + list chrome | Phase 1 D-04; already installed `[VERIFIED: src/components/ui/]` |
| vitest | **4.1.11** | LOCF / rate / action tests | Existing harness `[VERIFIED: package.json:41]` `[VERIFIED: vitest.config.ts]` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | ^1.39.0 | Expand/collapse chevron | Reuse AccountList pattern |
| @base-ui/react | ^1.7.0 | Underlying shadcn primitives | Already present |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Nested `layout.tsx` + Link tabs | Parallel `@` slots | Parallel routes for simultaneous panels — overkill for exclusive tabs; locked paths are real segments (D-04) `[CITED: nextjs.org/docs/app/api-reference/file-conventions/parallel-routes]` |
| Model name `FxRate` | Keep `FxRateStub` | Stub lacks unique/FK — **must replace** |
| Dedicated `/fx` route | Nested under currencies | Locked out (D-01) |
| shadcn Tabs primitive | Link underline tabs | Prefer Link+layout first (no new UI package); optional `npx shadcn add tabs` only if planner wants |
| New npm decimal lib | `money.ts` scale-8 helpers | Phase 1 contract already locks ×10⁸ BigInt |

**Installation:**

```bash
# No new npm packages.
# Optional only if planner chooses shadcn Tabs over Link chrome:
# npx shadcn@latest add tabs
```

**Version verification:** Project pins `next@16.3.4`, `prisma@7.10.0`, `zod@4.5.4`, `vitest@4.1.11` confirmed via `npm view` this session. Registry may list newer Prisma majors — **do not install** (Phase 1 human lock).

## Package Legitimacy Audit

> Phase 4 installs **no new npm packages**. Seam flags existing pins `SUS`/`too-new` despite huge downloads — false positive, already approved Phase 1–3.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| (none new) | — | — | — | — | — | N/A |
| zod / vitest / next / prisma (existing) | npm | mature | tens–hundreds M/wk | official orgs | SUS (too-new signal) | Keep — already approved; no new install |

**Packages removed due to [SLOP] verdict:** none  
**Packages flagged as suspicious [SUS]:** none newly introduced

## Architecture Patterns

### System Architecture Diagram

```text
Browser (RU Currencies area)
  │  Nav «Валюты» → /currencies/rates (D-03)
  │  Tabs: /currencies (list) | /currencies/rates (rates)
  │  Rates RSC: one row per non-primary + LOCF today + history
  │  Dialog: currency + rateMajor + direction + asOfDate
  │  Expand row → history (newest first) → delete
  ▼
Server Actions (Zod safeParse)  — src/app/currencies/actions.ts (+ fx actions)
  │  upsertFxRate / deleteFxRate
  │  validate: non-primary code, YYYY-MM-DD ≤ today, rate > 0
  │  direction invert → rateToPrimaryScaled
  ▼
src/lib/fx.ts (+ money.ts rate helpers)
  │  getRateAsOf(code, D) → row | null          ← LOCF (FX-02)
  │  primary identity: no row; convert ×1       ← D-16
  │  convertMinorToPrimary(...) → bigint | null ← unit-tested; no UI (D-17)
  ▼
prisma (SQLite)
  └── FxRate
        currencyCode FK → Currency
        asOfDate TEXT YYYY-MM-DD
        rateToPrimaryScaled BigInt  (primary_units_per_1_other × 10^8)
        UNIQUE (currencyCode, asOfDate)
```

### Recommended Project Structure

```
src/
├── app/currencies/
│   ├── layout.tsx              # NEW: tabs «Валюты» | «Курсы»
│   ├── page.tsx                # existing currency list (keep path)
│   ├── rates/page.tsx          # NEW: rates list RSC
│   ├── actions.ts              # existing currency CRUD + NEW upsert/delete FX
│   └── actions.test.ts         # extend
├── components/currencies/
│   ├── CurrencyList.tsx        # unchanged list
│   ├── CurrencyFormDialog.tsx  # unchanged
│   ├── RateList.tsx            # NEW: mirror AccountList expand/history
│   └── SetRateDialog.tsx       # NEW: mirror SetBalanceDialog + direction toggle
├── components/nav.tsx          # href → /currencies/rates; active still /currencies*
├── lib/
│   ├── fx.ts                   # NEW: getRateAsOf (+ optional batch helper)
│   ├── money.ts                # + parseRate / formatRate / invertRateScaled
│   ├── balances.ts             # reuse calendarDateToday
│   └── validations/fx.ts       # NEW: Zod set/delete schemas
└── prisma/schema.prisma        # FxRate; drop FxRateStub
```

### Pattern 1: Replace stub with `FxRate`

**What:** Drop `FxRateStub`; add real model tied to `Currency` with compound unique.

**Recommended schema (discretion naming locked here for planner):**

```prisma
model FxRate {
  id                  Int      @id @default(autoincrement())
  currencyCode        String
  currency            Currency @relation(fields: [currencyCode], references: [code], onDelete: Restrict)
  asOfDate            String // YYYY-MM-DD
  rateToPrimaryScaled BigInt // primary_units_per_1_other * 10^8

  @@unique([currencyCode, asOfDate], name: "currencyCode_asOfDate")
}
```

Also add `fxRates FxRate[]` on `Currency`. Stub fields today (verbatim):

```42:47:prisma/schema.prisma
model FxRateStub {
  id                  Int    @id @default(autoincrement())
  currencyCode        String
  asOfDate            String // YYYY-MM-DD
  rateToPrimaryScaled BigInt // primary_units_per_1_other * 10^8
}
```

Rate scale constant (verbatim):

```1:2:src/lib/money.ts
/** FX rate fixed scale: store rate × 10^8 as BigInt (D-09). */
export const RATE_SCALE_E8 = 100000000n;
```

**When to use:** Always for FX-01/02.

**Migration notes:**
- Mirror Phase 3: `DROP TABLE "FxRateStub"`; `CREATE TABLE "FxRate"` + unique index + FK — same shape as balance migration `[VERIFIED: prisma/migrations/20260903120000_balance_snapshot/migration.sql:1-14]`.
- Stub has no app writes yet — empty table expected; no data copy required `[ASSUMED]` (no seed rates in migrations).
- Update `foundation.test.ts` table allow-list still expecting `"FxRateStub"` `[VERIFIED: src/lib/foundation.test.ts:119-127]`.
- Keep `rateToPrimaryScaled BigInt` assertion in `money.test.ts` `[VERIFIED: src/lib/money.test.ts:50-53]`.
- Stop `wallet-web` before host `migrate deploy` if SQLite locked (STATE.md Phase 2 lesson).

### Pattern 2: LOCF read (FX-02) — mirror balances

**What:** Latest rate with `asOfDate <= D`; `null` if none. Never invent `0`/`1` for non-primary (D-15).

**Existing balance mirror (verbatim):**

```7:12:src/lib/balances.ts
export async function getBalanceAsOf(accountId: number, asOfDate: string) {
  await ensureSqlitePragmas();
  return prisma.balanceSnapshot.findFirst({
    where: { accountId, asOfDate: { lte: asOfDate } },
    orderBy: { asOfDate: "desc" },
  });
}
```

**Recommended FX helper:**

```typescript
// Mirror getBalanceAsOf — Prisma findFirst + orderBy desc
export async function getRateAsOf(currencyCode: string, asOfDate: string) {
  await ensureSqlitePragmas();
  return prisma.fxRate.findFirst({
    where: { currencyCode, asOfDate: { lte: asOfDate } },
    orderBy: { asOfDate: "desc" },
  });
}
```

**Primary identity (D-16):** callers treat primary code as identity (no query / no row). Helper may early-return a synthetic “identity” only if API docs say so — prefer **not** writing primary rows; document that `getRateAsOf(primary, D)` is unused and convert path short-circuits.

**List page batch:** one `findMany` where `asOfDate <= today`, orderBy desc, first-per-`currencyCode` in memory — same as accounts page `[VERIFIED: src/app/accounts/page.tsx:21-52]`.

### Pattern 3: Compound upsert (D-11)

```typescript
// Source: Prisma compound unique upsert
// [CITED: prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-composite-ids-and-constraints]
// Repo precedent:
await prisma.balanceSnapshot.upsert({
  where: { accountId_asOfDate: { accountId, asOfDate } },
  update: { amountMinor },
  create: { accountId, asOfDate, amountMinor },
});

// FX:
await prisma.fxRate.upsert({
  where: {
    currencyCode_asOfDate: { currencyCode, asOfDate },
  },
  update: { rateToPrimaryScaled },
  create: { currencyCode, asOfDate, rateToPrimaryScaled },
});
```

### Pattern 4: Currencies layout tabs (D-01–D-04)

**What:** Shared segment layout wrapping list + rates pages — not parallel routes.

```tsx
// Source: Next.js layout.js wraps child pages
// [VERIFIED: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/layout.md:8-15]
// app/currencies/layout.tsx — Link tabs; children = page or rates/page
```

- Paths: `/currencies` = list; `/currencies/rates` = rates (D-04).
- Default landing: change top nav `href` from `/currencies` to `/currencies/rates` (D-03). Existing active matcher already covers children:

```23:26:src/components/nav.tsx
          const active =
            href === "/"
              ? pathname === "/"
              : pathname === href || pathname.startsWith(`${href}/`);
```

If nav `href` becomes `/currencies/rates`, adjust active logic so `/currencies` list still highlights «Валюты» (e.g. match prefix `/currencies`).

### Pattern 5: Set-rate Dialog + direction toggle (D-05–D-09)

Mirror `SetBalanceDialog`: `useActionState`, remount on open, DD.MM.YYYY display + hidden ISO via `formatAsOfDisplay` / `parseAsOfDisplay` `[VERIFIED: src/lib/dates.ts:5-34]`, `today` prop from `calendarDateToday()` `[VERIFIED: src/lib/balances.ts:27-41]`.

Fields:
- Select: non-primary currencies only (D-07) — query `where: { isPrimary: false }`
- Direction toggle: default «1 other = N primary» (D-06); alternate «1 primary = N other» converts before write (D-05)
- `rateMajor` string → `parseMajorToMinor(rateMajor, 8)` → must be `> 0n` (D-09)
- Inverse path: `invertRateScaled(parsed)` using integer `(RATE_SCALE_E8 * RATE_SCALE_E8) / rateScaled` — reject if result `<= 0n`
- Hidden/ISO `asOfDate`; reject `asOfDate > today` with Russian copy like balances: `"Дата не может быть в будущем"` `[VERIFIED: src/app/accounts/actions.ts:198-201]`

### Pattern 6: Rate list + history (D-10–D-14)

Mirror `AccountList` expand/chevron/`window.confirm` delete / `bg-muted/40` history panel. One row per non-primary currency; empty → «Нет курса» + set-rate CTA (D-14). History newest-first (discretion = Phase 3 D-14). Delete only in history (D-13). Serialize `rateToPrimaryScaled` as string across RSC→client (BigInt boundary — Phase 2/3 lesson).

### Anti-Patterns to Avoid

- **Inventing rate `1` or `0` when missing:** Violates D-15 / historical honesty for Phase 5–6.
- **Storing inverse direction in DB:** Column is always `rateToPrimaryScaled` (D-05).
- **FX rows for primary currency:** Forbidden (D-16).
- **Arbitrary other↔other pairs:** Out of scope; only primary↔other.
- **Amount convert UI on rates tab:** Deferred to Phase 5 (D-17).
- **Float/`Number` rate path / `zod` number coerce:** Use string + BigInt scale 8.
- **Top-level `/fx` nav:** Locked out (D-01).
- **Delete inside set-rate Dialog:** Forbidden (D-13).
- **Parallel `@` route slots for simple tabs:** Unnecessary complexity vs nested layout.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Same-date overwrite | Manual find+branch without unique | Prisma `upsert` + `@@unique` | Race-safe LOCF identity; D-11 |
| LOCF query | Ad-hoc SQL per page | `getRateAsOf` / batch findMany | Reused by NW/charts |
| Rate decimal parse | `parseFloat` | `parseMajorToMinor(..., 8)` | Scale/BigInt contract |
| Inverse rate | Float `1/n` | Integer `(10^8)^2 / scaled` with >0 checks | Truncation explicit + tested |
| Form validation | Client-only | Zod + Server Action | Tampered FormData |
| Date identity | `Date` timestamps | `YYYY-MM-DD` strings (lexicographic ≤) | Same as BalanceSnapshot |
| Calendar today | `new Date().toISOString().slice(0,10)` | `calendarDateToday("Europe/Moscow")` | D-08 already shipped |

**Key insight:** FX identity is `(otherCurrency, calendar date)` with a single storage direction. LOCF is the same one-line ordered query as balances; complexity is pair rules, direction UX, and honest nulls — not a market-data feed.

## Runtime State Inventory

> Rename/migration: `FxRateStub` → `FxRate`.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | SQLite table `"FxRateStub"` from init migration; no app writers; no seeded FX rows in migrations `[VERIFIED: prisma/migrations/20260902151000_init_platform_stub/migration.sql:9-14]` | Migration DROP+CREATE; no row backfill expected |
| Live service config | None FX-named outside repo | none |
| OS-registered state | None | none |
| Secrets/env vars | None named for FX | none |
| Build artifacts | Generated Prisma client under `src/generated/prisma`; Docker image layers; `foundation.test.ts` asserts table name `FxRateStub` `[VERIFIED: src/lib/foundation.test.ts:119-127]` | `prisma generate` / migrate; update foundation test; rebuild container after migrate |

## Common Pitfalls

### Pitfall 1: Invented identity rate for missing FX
**What goes wrong:** Phase 5 NW silently treats unknown FX as ×1.  
**Why it happens:** Convenience default.  
**How to avoid:** `getRateAsOf` returns `null`; UI «Нет курса»; convert helper returns `null` (D-14/D-15/D-17).  
**Warning signs:** Tests assert `1n` for missing rates.

### Pitfall 2: Direction toggle stored wrong way
**What goes wrong:** Charts invert forever.  
**Why it happens:** Persist UI direction instead of always `rateToPrimaryScaled`.  
**How to avoid:** Single column; invert only on write; unit-test both directions round-trip with truncation cases.  
**Warning signs:** Schema field named `direction` or dual rate columns.

### Pitfall 3: Integer inverse truncation to zero
**What goes wrong:** Tiny inverse input yields `0n` scaled rate, then rejected or corrupts LOCF.  
**Why it happens:** `(RATE_SCALE_E8² / n)` floors.  
**How to avoid:** Reject `<= 0n` after invert; prefer default direction for entry; document precision limit at 8 dp.  
**Warning signs:** Silent `0` rates in DB.

### Pitfall 4: Foundation / money tests still expect `FxRateStub`
**What goes wrong:** migrate green but unit suite fails.  
**How to avoid:** Update `foundation.test.ts` table list in same wave as migration.

### Pitfall 5: SQLite lock during migrate
**What goes wrong:** Host migrate fails while Compose holds DB.  
**How to avoid:** Stop `wallet-web` briefly (STATE.md precedent).

### Pitfall 6: Nav active state after rates-first href
**What goes wrong:** «Валюты» not highlighted on `/currencies` list, or wrong highlight.  
**How to avoid:** Active match on `/currencies` prefix even if link points to `/currencies/rates`.

### Pitfall 7: revalidatePath incomplete
**What goes wrong:** Rates tab stale after upsert.  
**How to avoid:** `revalidatePath("/currencies")` and `revalidatePath("/currencies/rates")` (currency actions already revalidate currencies+accounts `[VERIFIED: src/app/currencies/actions.ts:66-67]`).

### Pitfall 8: Allowing primary in currency picker
**What goes wrong:** Self-rate rows or nonsense LOCF.  
**How to avoid:** Filter `isPrimary: false` in RSC props **and** Server Action reject if `currency.isPrimary` (defense in depth).

## Code Examples

### Rate parse/format at scale 8

```typescript
// Reuse money helpers — RATE_SCALE_E8 === 10^8 scale digits
import { RATE_SCALE_E8, parseMajorToMinor, formatMinorToMajor } from "@/lib/money";

export function parseRateToScaled(major: string): bigint {
  return parseMajorToMinor(major, 8);
}

export function formatRateScaled(scaled: bigint): string {
  return formatMinorToMajor(scaled, 8);
}

/** Invert primary-per-other ↔ other-per-primary at fixed scale 8. */
export function invertRateScaled(rateToPrimaryScaled: bigint): bigint {
  if (rateToPrimaryScaled <= 0n) {
    throw new Error("rate must be > 0");
  }
  return (RATE_SCALE_E8 * RATE_SCALE_E8) / rateToPrimaryScaled;
}
```

### Convert minor → primary (unit tests only in Phase 4 UI)

```typescript
/**
 * primaryMinor = otherMinor * rateToPrimaryScaled * 10^primaryScale
 *              / (10^otherScale * 10^8)
 * Returns null if rate missing — callers must not invent.
 */
export function convertOtherMinorToPrimaryMinor(
  otherMinor: bigint,
  rateToPrimaryScaled: bigint,
  otherScale: number,
  primaryScale: number,
): bigint {
  const num =
    otherMinor * rateToPrimaryScaled * 10n ** BigInt(primaryScale);
  const den = 10n ** BigInt(otherScale) * RATE_SCALE_E8;
  return num / den; // trunc toward zero — document for NW
}
```

### Zod sketch

```typescript
// Mirror src/lib/validations/balance.ts [VERIFIED: src/lib/validations/balance.ts:3-20]
import { z } from "zod";

const asOfDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Укажите дату");

export const setFxRateSchema = z
  .object({
    currencyCode: z.string().trim().min(1),
    rateMajor: z.string().trim().min(1, "Введите курс"),
    asOfDate: asOfDateSchema,
    /** "toPrimary" | "fromPrimary" — UI only */
    direction: z.enum(["toPrimary", "fromPrimary"]).default("toPrimary"),
  })
  .strict();

export const deleteFxRateSchema = z
  .object({
    id: z.coerce.number().int().positive(),
  })
  .strict();
```

Russian positivity error (discretion wording): `"Курс должен быть больше 0"` `[ASSUMED]`.

### LOCF unit behavior (Wave 0 target)

```typescript
// Rates USD: 2026-01-01 → 90e8, 2026-01-10 → 95e8
// asOf 2026-01-05 → 90e8
// asOf 2025-12-31 → null (not 1, not 0)
// asOf 2026-01-10 → 95e8
// upsert same date overwrites rateToPrimaryScaled
// forward: asOf 2026-01-05 still 90e8 after inserting 2026-01-10
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Live/spot FX rewriting history | Dated manual rates + LOCF ≤ D | Product lock (PROJECT / out of scope auto FX) | Honest as-of NW/charts |
| Arbitrary cross pairs | Primary ↔ other only | REQUIREMENTS out of scope | Simpler model; one column to primary |
| `FxRateStub` without unique/FK | `FxRate` + unique + Currency FK | Phase 4 | Real FX-01/02 |

**Deprecated/outdated:**
- Treating FX-02 “totals and charts” as Phase 4 UI work — CONTEXT D-17: helper + tests now; consumers Phase 5–6.
- Parallel-route tab dashboards for two exclusive URLs — prefer nested layout.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Prisma model name `FxRate` (not `ExchangeRate`) | Pattern 1 | Rename-only; low risk |
| A2 | Stub table empty in all envs — DROP without data copy | Runtime / Migration | If user inserted stub rows manually, need copy SQL |
| A3 | Rate “primary units” means **major** primary per 1 **major** other (×10⁸) | Convert helper | Wrong scale breaks NW; confirm against Phase 1 intent — stub comment says `primary_units_per_1_other` |
| A4 | Convert uses truncating BigInt division | Code Examples | NW rounding policy may want banker’s round later |
| A5 | Russian error `"Курс должен быть больше 0"` acceptable | Zod sketch | Copy tweak only |
| A6 | Link tabs sufficient (no shadcn Tabs) | Alternatives | UX preference |
| A7 | `getRateAsOf(primaryCode, D)` unused — identity handled by callers | Pattern 2 | If helper called with primary, decide null vs synthetic |

**If this table is empty:** N/A — assumptions listed for planner/human confirmation where noted.

## Open Questions

1. **Exact Russian chrome for direction toggle**
   - What we know: Default «1 other = N primary»; storage column fixed (D-05/D-06).
   - What's unclear: Precise labels (e.g. `1 USD = N RUB` vs generic wording).
   - Recommendation: Show selected code + primary code in toggle labels; UI-SPEC / discretion in plan.

2. **Convert helper placement**
   - What we know: D-17 requires unit-tested convert math without rates-tab calculator.
   - What's unclear: `money.ts` vs `fx.ts`.
   - Recommendation: LOCF in `fx.ts`; parse/format/invert next to `RATE_SCALE_E8` in `money.ts`; convert in `fx.ts` importing money.

3. **A3 major-unit semantics**
   - What we know: Stub comment `primary_units_per_1_other * 10^8` `[VERIFIED: prisma/schema.prisma:46]`.
   - What's unclear: Whether “units” means major or minor.
   - Recommendation: Treat as **major** (1 USD = 90.00 RUB → store `90 * 10^8`); encode convert formula accordingly; Wave 0 test with scale-2/scale-2 example.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Next/Prisma/Vitest | ✓ | v24.5.0 | — |
| npm | scripts | ✓ | 10.9.3 | — |
| Docker | migrate smoke / Compose | ✓ | 29.5.3 | Host migrate with container stopped |
| SQLite via better-sqlite3 | persistence | ✓ (project pin 13.0.3) | — | — |
| graphify / codegraph | project search | ✗ disabled | — | Grep/Read (this session) |
| Context7 / ctx7 CLI | docs lookup | ✗ | — | Local `node_modules/next/dist/docs` + WebSearch/WebFetch |
| Brave/Exa/Firecrawl/Tavily | research-plan providers | ✗ (config false) | — | websearch + local docs |

**Missing dependencies with no fallback:** none for Phase 4 implementation.

**Missing dependencies with fallback:** graphify (disabled) — used Grep/Read; Context7 — used local Next docs + Prisma official pages via WebSearch.

**Graph note:** `gsd_run graphify status` → `"disabled": true`. Treat any future graph edges as unavailable until enabled.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest **4.1.11** |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run src/lib/fx.test.ts src/lib/money.test.ts` |
| Full suite command | `npm test` (`vitest run`) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FX-01 | Upsert dated rate; reject future / ≤0 / primary code | unit | `npx vitest run src/app/currencies/actions.test.ts src/lib/validations/fx.test.ts` | ❌ Wave 0 |
| FX-01 | Direction invert stores `rateToPrimaryScaled` only | unit | `npx vitest run src/lib/money.test.ts` (invert cases) | ❌ Wave 0 extend |
| FX-02 | LOCF ≤ D; null before first; forward-effective | unit | `npx vitest run src/lib/fx.test.ts` | ❌ Wave 0 |
| FX-02 | convert helper null/math without UI | unit | `npx vitest run src/lib/fx.test.ts` | ❌ Wave 0 |
| schema | Table rename FxRate + unique | unit/smoke | `npx vitest run src/lib/foundation.test.ts` | ✅ update expected name |
| UI chrome | Tabs/Dialog Russian | manual | human-verify end-of-phase | — |

### Sampling Rate

- **Per task commit:** targeted vitest files for touched module
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/lib/fx.ts` + `src/lib/fx.test.ts` — `getRateAsOf` LOCF + convert helper (FX-02 / D-15–D-17)
- [ ] `src/lib/validations/fx.ts` + `src/lib/validations/fx.test.ts` — Zod schemas
- [ ] Extend `src/lib/money.test.ts` — parse/format/invert rate at scale 8; reject ≤0
- [ ] Extend `src/app/currencies/actions.test.ts` — upsert/delete FX actions
- [ ] Update `src/lib/foundation.test.ts` — expect `FxRate` not `FxRateStub`
- [ ] Framework install: none — vitest already present

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Single local user; no auth in v1 |
| V3 Session Management | no | N/A |
| V4 Access Control | no | Single-user local app |
| V5 Input Validation | yes | Zod schemas + Server Action gates (date, rate > 0, non-primary code) |
| V6 Cryptography | no | No new crypto; money/rate = integer arithmetic only |

### Known Threat Patterns for Next.js + Prisma + SQLite wallet

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Tampered FormData (primary code, future date, negative rate) | Tampering | Server-side Zod + explicit `isPrimary` / `> today` / `> 0n` checks |
| Float corruption of FX | Tampering / Integrity | BigInt + `RATE_SCALE_E8`; ban Number parse |
| Mass assignment / extra fields | Tampering | `.strict()` Zod objects |
| SQL injection | Tampering | Prisma parameterized queries only |
| XSS via currency codes in UI | Spoofing | React text escaping; codes already constrained create-time |

## Sources

### Primary (HIGH confidence)

- `prisma/schema.prisma` — `FxRateStub` fields; `BalanceSnapshot` unique pattern
- `src/lib/money.ts` — `RATE_SCALE_E8 = 100000000n`
- `src/lib/balances.ts` — LOCF + `calendarDateToday`
- `src/app/accounts/page.tsx` / `actions.ts` / `AccountList.tsx` / `SetBalanceDialog.tsx` — UI/action templates
- `src/app/currencies/page.tsx` / `nav.tsx` — integration points
- `package.json` — pinned versions
- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/layout.md` — nested layouts
- Phase 3 RESEARCH + CONTEXT — LOCF/upsert precedents
- `.planning/phases/04-dated-fx/04-CONTEXT.md` — locked decisions D-01–D-17

### Secondary (MEDIUM confidence)

- Prisma compound unique upsert docs — [CITED: prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-composite-ids-and-constraints]
- Next.js parallel routes docs (rejected for this phase) — [CITED: nextjs.org/docs/app/api-reference/file-conventions/parallel-routes]
- `npm view` pin confirmation for next/prisma/zod/vitest

### Tertiary (LOW confidence)

- WebSearch digests for fixed-point LOCF FX practices (domain already locked by project CONTEXT)
- Exact Russian microcopy for direction toggle / positivity (discretion)

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — reuse Phase 1–3 pins; no new packages
- Architecture: **HIGH** — explicit mirror of BalanceSnapshot LOCF + CONTEXT paths
- Pitfalls: **HIGH** — Phase 3 lessons + FX-specific invert/null traps verified against code

**Research date:** 2026-09-03  
**Valid until:** 2026-10-03 (stable stack; revisit if Prisma major upgrade forced)
