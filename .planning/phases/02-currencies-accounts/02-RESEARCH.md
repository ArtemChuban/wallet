# Phase 2: Currencies + Accounts - Research

**Researched:** 2026-09-02
**Domain:** Next.js App Router + Prisma SQLite domain CRUD (currencies, typed accounts, credit-limit metadata)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
#### Primary currency
- **D-01:** Seed the primary currency in a Prisma migration: code `RUB`, name `Рубль`, scale `2`. — **Reversibility:** one-way — seed migration and “exactly one primary” are a data contract for later FX and NW.
- **D-02:** No primary switch in v1 — the seeded currency remains the only primary forever. — **Reversibility:** costly — adding switch later needs FX/history rules.
- **D-03:** Primary cannot be deleted (same as all currencies — see D-07).
- **D-04:** After seed, only the **name** is editable in the app; **code** and **scale** are immutable.

#### Currency create & identity
- **D-05:** Currency codes are free short strings (uniqueness only) — not ISO-restricted. Users may use codes like `RUB`, `USDT`.
- **D-06:** Scale is a free integer **0–18** at create time (required; no guessed default — aligns with Phase 1 D-08).
- **D-07:** No currency delete for any currency (primary or secondary) in v1.
- **D-08:** After create, only **name** is editable; code and scale locked forever.

#### Credit fields (Phase 2)
- **D-09:** Phase 2 stores **`creditLimit` only** on credit accounts. Outstanding debt is **not** stored on Account here — debt will be the credit account’s balance via Phase 3 dated snapshots. Credit limit is metadata only (never an asset in later NW math). — **Reversibility:** costly — splitting debt into Phase 3 balances is the NW/charts path; reversing would reintroduce dual sources of truth.
- **D-10:** Credit limit is **required** and must be **> 0** when account type is credit.
- **D-11:** Credit limit is **immutable after create** in v1 (future edit may be added later — see Deferred).
- **D-12:** Account **type** is locked after create.

#### Accounts ↔ currency binding
- **D-13:** Every account has a required currency, locked forever after create. — **Reversibility:** one-way — changing currency after balances exist would corrupt history.
- **D-14:** No account delete in v1 (archive/close is ACCT-04 / later).
- **D-15:** After create, only account **name** is editable (type, currency, credit limit fixed).
- **D-16:** Account names are **globally unique**.

#### UI / nav
- **D-17:** Two routes: `/currencies` and `/accounts`, with simple nav (Russian labels).
- **D-18:** List pages + create/edit via **Dialog/Sheet** (not separate create/edit routes).
- **D-19:** Keep `/` as the ready/status page; add nav links to Currencies and Accounts. Phase 5 will replace home with the NW dashboard later.
- **D-20:** All UI chrome in **Russian** (labels, errors, empty states, account-type names). Currency **codes** remain Latin identifiers as entered (e.g. RUB, USDT).

### Claude's Discretion
- Exact shadcn primitives (Dialog vs Sheet), nav layout (top vs side), form validation copy wording, Prisma field names/enums for account type, and how `isPrimary` (or equivalent) is represented given “seeded forever primary” — choose standard Next.js + Prisma + shadcn patterns consistent with Phase 1.
- Money input UX for credit limit (reuse/extend `src/lib/money.ts` helpers as needed).

### Deferred Ideas (OUT OF SCOPE)
- Editable credit limit after create (possibly dated history) — post-v1 / later enhancement
- Account archive/close (**ACCT-04**) — v2 requirements
- Primary currency switch — not in v1
- Currency or account delete — not in v1
- Available-credit display (limit − debt) — **ACCT-03**, Phase 5
- Replace home ready page with NW dashboard — Phase 5
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CURR-01 | User can create currencies and set one primary currency (e.g. RUB) | Seed RUB primary in migration (D-01/D-02); create non-primary currencies via Server Actions; enforce exactly-one primary at DB + app; edit name only (D-04/D-08) |
| ACCT-01 | User can create, edit, and delete accounts with types: fiat debit, fiat credit, crypto, cash | **Phase 2 narrowing (CONTEXT):** create + name-edit only; **no delete** (D-14). Types via Prisma enum. ROADMAP success criterion “delete” deferred with ACCT-04 |
| ACCT-02 | For credit accounts, user can set credit limit and outstanding debt; debt reduces net worth | **Phase 2 narrowing (CONTEXT D-09):** store `creditLimitMinor` only as metadata; debt = Phase 3 credit-account balance snapshots; NW math Phase 5. Limit required > 0, immutable after create (D-10/D-11) |
</phase_requirements>

## Summary

Phase 2 adds the first real domain surface on the Phase 1 Next.js + Prisma + SQLite foundation: free-form currencies with a forever-seeded primary (`RUB` / `Рубль` / scale `2`), and typed accounts with optional credit-limit metadata. Mutations stay in Server Actions with Zod validation; UI is Russian list pages at `/currencies` and `/accounts` with Dialog (or Sheet) create/edit — no delete routes.

**Requirement narrowing is intentional and locked:** ROADMAP/REQUIREMENTS still mention account delete and outstanding debt on ACCT-01/02, but `02-CONTEXT.md` defers delete and debt. Planner must treat CONTEXT as authoritative for this phase’s success criteria and UAT; do not build debt fields or delete actions.

**Primary recommendation:** Extend `Currency` with `isPrimary`, seed RUB in a customized Prisma migration, add `Account` + `AccountType` enum with `creditLimitMinor BigInt?`, implement Server Action CRUD (create + name update only) behind Zod, add shadcn Dialog/Input/Label/Select, extend `money.ts` for scale-aware parse/format of credit limits — **no new npm packages**.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Currency / account persistence | Database / Storage | API / Backend | Prisma models + SQLite constraints own identity, uniqueness, primary flag |
| Create/update validation | API / Backend | Browser / Client | Server Actions + Zod are the trust boundary (Phase 1 D-02); HTML `required` is UX only |
| Primary currency invariant | Database / Storage | API / Backend | Seed + partial unique index; app never exposes switch UI (D-02) |
| Credit limit storage | Database / Storage | — | Metadata column only; never asset in NW (comment + later math exclude) |
| List/create/edit UI | Frontend Server (SSR) | Browser / Client | RSC list pages; client Dialog + `useActionState` for forms |
| Nav / Russian chrome | Frontend Server (SSR) | — | Root layout shell links; `lang="ru"` already set |
| Money display/parse | API / Backend | Browser / Client | Shared `money.ts` helpers; scale from Currency row |

## Project Constraints (from .cursor/rules/)

None — `.cursor/rules/` absent this session. Follow Phase 1 CONTEXT/stack locks and user rules (caveman communication for chat only; RESEARCH.md stays normal prose).

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | **16.3.4** (pinned) | App Router pages + Server Actions | Phase 1 lock `[VERIFIED: package.json:22]` |
| react / react-dom | **19.2.8** | `useActionState` form UX | Phase 1 pin `[VERIFIED: package.json:23-24]` |
| prisma / @prisma/client / adapter | **7.10.0** | Schema, migrate, queries | Phase 1 lock `[VERIFIED: package.json:15-16,23]` |
| better-sqlite3 | **13.0.3** | SQLite driver | Phase 1 pin + overrides `[VERIFIED: package.json:17,43-45]` |
| zod | **4.5.4** | Server Action input validation | Already installed; Next Forms guide pattern `[VERIFIED: package.json:29]` `[CITED: nextjs.org/docs/app/guides/forms]` |
| shadcn/ui (base-nova) | CLI copy into `components/ui` | Dialog, Input, Label, Select | Phase 1 D-04; `components.json` style `base-nova` `[VERIFIED: components.json:3]` |
| vitest | **4.1.11** | Unit/schema tests | Existing harness `[VERIFIED: package.json:41]` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @base-ui/react | ^1.7.0 | Underlying primitives for base-nova | Already present; comes with shadcn Dialog/Sheet |
| lucide-react | ^1.39.0 | Nav/list icons | Optional light use |
| class-variance-authority / clsx / tailwind-merge | existing | `cn()` helpers | Already wired |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Server Actions + Zod + `useActionState` | react-hook-form + zodResolver | More deps; client-heavy; **reject** for Phase 2 unless forms grow complex |
| Dialog | Sheet | Sheet better for long forms; credit form is short — **prefer Dialog** |
| `isPrimary` Boolean + partial unique index | Singleton `PrimaryCurrency` table | Overkill given D-02 forever-seeded primary |
| Migration SQL seed | `prisma db seed` | Prisma v7 seed is **explicit-only** (`prisma db seed`); Docker entrypoint runs `migrate deploy` only — seed script would **not** run on container start `[CITED: prisma.io/docs/orm/v7/prisma-migrate/workflows/seeding]` |

**Installation:**

```bash
# No new npm packages. Add shadcn components only:
npx shadcn@latest add dialog input label select
# Optional if planner prefers side panel:
# npx shadcn@latest add sheet
```

**Version verification:** `npm view zod version` → `4.5.4`; `next` → `16.3.4`; project pins Prisma `7.10.0` (registry also lists Prisma 8 RC — **do not upgrade**; Phase 1 human lock).

## Package Legitimacy Audit

> Phase 2 installs **no new npm packages**. zod already in tree (Phase 1). Seam flagged zod `SUS`/`too-new` despite ~275M weekly downloads and official repo — treat as **false positive**; no install checkpoint needed.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| zod (existing) | npm | mature | ~275M/wk | github.com/colinhacks/zod | SUS (too-new signal) | Keep — already approved Phase 1; no new install |
| react-hook-form | — | — | — | — | — | **Not recommended** — omit |
| @hookform/resolvers | — | — | — | — | — | **Not recommended** — omit |

**Packages removed due to [SLOP] verdict:** none  
**Packages flagged as suspicious [SUS]:** none newly introduced

## Architecture Patterns

### System Architecture Diagram

```text
Browser (RU UI)
  │  GET /currencies | /accounts (RSC list)
  │  Dialog form submit
  ▼
Server Actions (Zod safeParse)
  │  createCurrency / updateCurrencyName
  │  createAccount / updateAccountName
  ▼
prisma singleton (src/lib/db.ts + WAL pragmas)
  │
  ├── Currency (code PK, name, scale, isPrimary)
  │     seed: RUB / Рубль / 2 / true  [migration INSERT]
  │     UNIQUE partial: at most one isPrimary=1
  └── Account (name UNIQUE, type enum, currencyCode FK,
               creditLimitMinor BigInt? for FIAT_CREDIT only)
```

### Recommended Project Structure

```
src/
├── app/
│   ├── layout.tsx              # add simple top nav (Валюты / Счета)
│   ├── page.tsx                # keep ready page; add nav links
│   ├── currencies/
│   │   ├── page.tsx            # RSC list
│   │   └── actions.ts          # Server Actions
│   └── accounts/
│       ├── page.tsx
│       └── actions.ts
├── components/
│   ├── nav.tsx                 # Russian nav
│   ├── currencies/             # CurrencyList, CurrencyFormDialog
│   ├── accounts/               # AccountList, AccountFormDialog
│   └── ui/                     # shadcn dialog, input, label, select
└── lib/
    ├── db.ts                   # unchanged pattern
    ├── money.ts                # + parseMajorToMinor / formatMinorToMajor
    └── validations/
        ├── currency.ts         # Zod schemas
        └── account.ts
prisma/
├── schema.prisma               # Currency.isPrimary + Account model
└── migrations/
    └── YYYYMMDDHHMMSS_currencies_accounts/
        └── migration.sql       # ALTER/CREATE + INSERT RUB + partial unique index
```

### Pattern 1: Seed primary in migration (not prisma db seed)

**What:** Customize migration SQL to INSERT the primary currency so `migrate deploy` in Docker entrypoint always materializes RUB.

**When to use:** Always for D-01 (production path = migrate deploy).

**Example:**

```sql
-- After ALTER TABLE "Currency" ADD COLUMN "isPrimary" ...
INSERT INTO "Currency" ("code", "name", "scale", "isPrimary")
VALUES ('RUB', 'Рубль', 2, 1);

-- Exactly one primary (SQLite unique partial index)
CREATE UNIQUE INDEX "Currency_one_primary"
ON "Currency"("isPrimary") WHERE "isPrimary" = 1;
```

Source: Prisma customizing migrations `[CITED: prisma.io/docs/orm/prisma-migrate/workflows/customizing-migrations]`; SQLite partial unique indexes `[CITED: sqlite.org/partialindex.html]`.

### Pattern 2: Server Action + Zod + useActionState

**What:** Validate `FormData` with `safeParse`, return field errors; client Dialog form uses `useActionState`.

**When to use:** All create/update mutations.

**Example:**

```typescript
// Source: https://nextjs.org/docs/app/guides/forms
"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const schema = z.object({
  name: z.string().trim().min(1),
});

export async function updateCurrencyName(
  _prev: { errors?: { name?: string[] }; message?: string },
  formData: FormData,
) {
  const validated = schema.safeParse({ name: formData.get("name") });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }
  // prisma.currency.update({ where: { code }, data: { name } })
  revalidatePath("/currencies");
  return { message: "Сохранено" };
}
```

### Pattern 3: Immutable fields after create

**What:** Create action accepts type/currency/scale/code/creditLimit; update actions accept **name only**. Ignore or reject tampered hidden fields server-side.

**When to use:** D-04, D-08, D-11, D-12, D-13, D-15.

### Anti-Patterns to Avoid

- **Debt column on Account:** Violates D-09; dual source of truth with Phase 3 snapshots.
- **`prisma db seed` as only RUB path:** Won’t run on Docker `migrate deploy` `[CITED: prisma.io/docs/orm/v7/prisma-migrate/workflows/seeding]`.
- **Float/REAL for creditLimit:** Violates Phase 1 D-07; use `BigInt` minor units.
- **Delete UI “for ACCT-01 completeness”:** Forbidden by D-14; archive is ACCT-04.
- **Primary switch UI:** Forbidden by D-02; create always sets `isPrimary: false`.
- **Separate `/currencies/new` routes:** Violates D-18.
- **Treating creditLimit as asset in comments/helpers:** Success criterion 4 — metadata only.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation | Ad-hoc if/throw strings | Zod `safeParse` | Field errors + type narrowing `[CITED: nextjs.org/docs/app/guides/forms]` |
| Dialog/modal | Custom focus trap CSS | shadcn `dialog` | a11y + base-nova consistency |
| Exactly-one primary | App-only boolean check | SQLite partial unique index + seed | Race-safe invariant `[CITED: sqlite.org/partialindex.html]` |
| Money parse/format | `parseFloat` / Number | `money.ts` BigInt helpers + scale | Float corruption; Phase 1 contract |
| Account types | Free string column | Prisma `enum AccountType` | Closed set; SQLite enum support in Prisma ≥6.2 `[CITED: prisma.io/docs/orm/reference/database-features]` |

**Key insight:** Domain rules (immutability, one primary, credit metadata) belong in Zod + Prisma constraints together — UI alone is not enough on a local app that still accepts crafted FormData.

## Common Pitfalls

### Pitfall 1: ROADMAP vs CONTEXT success criteria drift
**What goes wrong:** Planner builds delete + outstanding debt to match ROADMAP bullets 2–3.  
**Why it happens:** ROADMAP not yet updated after discuss-phase.  
**How to avoid:** CONTEXT D-09/D-14 win; note partial ACCT-01/02 in PLAN/UAT.  
**Warning signs:** Tasks named `deleteAccount` or `outstandingDebt` fields.

### Pitfall 2: Seed missing on fresh Docker volume
**What goes wrong:** Empty Currency table; accounts cannot bind to RUB.  
**Why it happens:** Seed only in `prisma/seed.ts`, never in migration.  
**How to avoid:** INSERT in migration applied by entrypoint `migrate deploy`.  
**Warning signs:** Smoke on empty `./data` shows zero currencies.

### Pitfall 3: Partial unique index omitted from Prisma schema awareness
**What goes wrong:** `prisma migrate diff` later drops or duplicates the index.  
**Why it happens:** Index added only in SQL; schema has no matching `@@index`.  
**How to avoid:** Document in schema comment; use `--create-only` and keep custom SQL; avoid regenerating that migration.  
**Warning signs:** Next migrate wants to drop `Currency_one_primary`.

### Pitfall 4: Credit limit with wrong scale
**What goes wrong:** User enters “500000” meaning major units; stored as minor for scale 2 → 100× error.  
**Why it happens:** UI doesn’t show currency scale / major-unit input.  
**How to avoid:** Parse major string → minor via account’s currency `scale`; show hint (e.g. «в рублях»).  
**Warning signs:** Tests only use integer inputs without scale.

### Pitfall 5: Allowing `isPrimary: true` on create
**What goes wrong:** Second primary insert fails with opaque UNIQUE error or succeeds if index missing.  
**Why it happens:** Form exposes checkbox or hidden field.  
**How to avoid:** Create action hardcodes `isPrimary: false`; no UI control.  
**Warning signs:** Zod schema includes `isPrimary`.

### Pitfall 6: Existing schema tests break on new models
**What goes wrong:** `money.test.ts` / foundation tests still pass, but Account Float sneaks in.  
**Why it happens:** Schema convention test only greps stub fields.  
**How to avoid:** Extend Wave 0 tests to assert `creditLimitMinor BigInt` and no Float/Decimal.  
**Warning signs:** New money columns without BigInt.

## Code Examples

### Recommended Prisma shape (discretion — field names)

```prisma
// Discretionary recommendation aligned with Phase 1 stub.
// Verify by reading prisma/schema.prisma after edit — current stub:
// model Currency { code String @id; name String; scale Int }

enum AccountType {
  FIAT_DEBIT
  FIAT_CREDIT
  CRYPTO
  CASH
}

model Currency {
  code      String    @id
  name      String
  scale     Int
  isPrimary Boolean   @default(false)
  accounts  Account[]
  // Exactly-one primary enforced via migration SQL partial unique index
}

model Account {
  id               Int         @id @default(autoincrement())
  name             String      @unique
  type             AccountType
  currencyCode     String
  currency         Currency    @relation(fields: [currencyCode], references: [code])
  /// Metadata only — never an NW asset. Required (>0) iff type == FIAT_CREDIT.
  creditLimitMinor BigInt?
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt
}
```

Existing stub verified:

```12:16:prisma/schema.prisma
model Currency {
  code  String @id
  name  String
  scale Int // required at create — no DB default
}
```

### Money helpers (extend `src/lib/money.ts`)

```typescript
// Build on existing RATE_SCALE_E8 contract [VERIFIED: src/lib/money.ts:1-2]
export const RATE_SCALE_E8 = 100000000n;

/** Parse major-unit decimal string → minor BigInt using currency scale (0–18). */
export function parseMajorToMinor(major: string, scale: number): bigint {
  // Reject scientific notation; pad/trim fractional part to `scale`; no Number()/parseFloat
  // Throw or return Result — Zod layer should catch user-facing errors
}

export function formatMinorToMajor(minor: bigint, scale: number): string {
  // Exact decimal string for display/input default
}
```

`RATE_SCALE_E8` quote: `export const RATE_SCALE_E8 = 100000000n;` `[VERIFIED: src/lib/money.ts:1-2]`

### Russian account-type labels (UI map)

| Enum | Russian label |
|------|---------------|
| FIAT_DEBIT | Дебетовый |
| FIAT_CREDIT | Кредитный |
| CRYPTO | Крипто |
| CASH | Наличные |

`[ASSUMED]` exact wording — discretion for copy; keep codes Latin.

### Zod create-account sketch

```typescript
const accountCreateSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    type: z.enum(["FIAT_DEBIT", "FIAT_CREDIT", "CRYPTO", "CASH"]),
    currencyCode: z.string().trim().min(1).max(32),
    creditLimitMajor: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.type === "FIAT_CREDIT") {
      if (!val.creditLimitMajor) {
        ctx.addIssue({ code: "custom", path: ["creditLimitMajor"], message: "Укажите кредитный лимит" });
      }
    } else if (val.creditLimitMajor) {
      ctx.addIssue({ code: "custom", path: ["creditLimitMajor"], message: "Лимит только для кредитного счёта" });
    }
  });
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hono + Drizzle (project research) | Next + Prisma + shadcn | Phase 1 discuss | Phase 2 continues Phase 1 stack |
| prisma seed auto on migrate | Prisma v7 explicit `db seed` only | Prisma 7 | Prefer migration INSERT for Docker |
| SQLite no Prisma enums | Enums + Json on SQLite | Prisma 6.2+ | Safe to use `AccountType` enum |

**Deprecated/outdated:**
- Relying on `prisma migrate reset` auto-seed — removed in Prisma v7 seeding workflow `[CITED: prisma.io/docs/orm/v7/prisma-migrate/workflows/seeding]`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Russian type labels (Дебетовый / Кредитный / …) are acceptable UI copy | Code Examples | User wants different wording — easy rename |
| A2 | Dialog preferred over Sheet for create/edit | Architecture | Planner may pick Sheet; both allowed by D-18 |
| A3 | Top nav in root layout is preferred over side nav | Architecture | Layout tweak only |
| A4 | `creditLimitMinor` naming (vs `creditLimit`) is preferred | Schema | Rename before first migrate if disliked |
| A5 | Account `Int` autoincrement id sufficient (no public cuid URLs) | Schema | Switch to cuid if deep-linking needed later |

**If empty of critical assumptions:** Core stack/patterns verified; only UI copy and discretionary names need soft confirmation.

## Open Questions (RESOLVED)

1. **ROADMAP success criteria still list delete + outstanding debt** — RESOLVED
   - What we know: CONTEXT explicitly defers both (D-09, D-14).
   - Resolution: ROADMAP Phase 2 success criteria already CONTEXT-narrowed (no delete in v1; outstanding debt deferred to Phase 3). Plans interpret CURR-01 / ACCT-01 / ACCT-02 per CONTEXT.

2. **Currency code charset** — RESOLVED
   - What we know: Free short strings, uniqueness only (D-05).
   - Resolution: Plan 01 / Zod create schema — printable ASCII, `min(1).max(16)` (planner assumption locked for execution).

3. **Empty-state copy** — RESOLVED
   - What we know: Russian UI required (D-20).
   - Resolution: Exact strings from `02-UI-SPEC.md` Copywriting Contract (currencies: «Нет валют» / seed-check body; accounts: «Нет счетов» / first-account body; CTAs «Добавить валюту» / «Добавить счёт»).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next / Prisma / vitest | ✓ | v24.5.0 | — |
| npm | installs / shadcn CLI | ✓ | 10.9.3 | — |
| Docker | compose smoke (optional for unit tests) | ✓ | 29.5.3 | Host `npm test` + `prisma migrate` |
| Prisma CLI (local) | migrations | ✓ via package | 7.10.0 | `npx prisma` |
| ctx7 CLI | docs lookup | ✗ | — | WebFetch / WebSearch (used) |
| codegraph / graphify | project search | ✗ disabled | — | Read/Grep (used); graphify `disabled: true` |

**Missing dependencies with no fallback:** none for Phase 2 implementation.

**Missing dependencies with fallback:** ctx7, codegraph/graphify.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest **4.1.11** |
| Config file | `vitest.config.ts` (`include: src/**/*.test.ts`) |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CURR-01 | Seeded RUB is primary; create secondary; update name only; reject delete/primary toggle | unit + schema | `npm test -- src/lib/currency*.test.ts` | ❌ Wave 0 |
| CURR-01 | `scale` 0–18 required; code unique | unit | Zod schema tests | ❌ Wave 0 |
| ACCT-01 | Create four types; update name; reject type/currency change | unit | account action/schema tests | ❌ Wave 0 |
| ACCT-01 | No delete action exported / no delete path | unit | static/export test or action suite | ❌ Wave 0 |
| ACCT-02 | FIAT_CREDIT requires creditLimitMinor > 0; other types null | unit | Zod + prisma constraint tests | ❌ Wave 0 |
| ACCT-02 | creditLimitMinor is BigInt; never Float | unit | extend `money.test.ts` schema grep | ⚠️ partial (`src/lib/money.test.ts`) |
| money | parseMajorToMinor / formatMinorToMajor round-trip for scales 0,2,8,18 | unit | `npm test -- src/lib/money.test.ts` | ⚠️ extend existing |

### Sampling Rate

- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green + migrate on empty DB shows RUB primary + manual RU UI smoke

### Wave 0 Gaps

- [ ] `src/lib/money.test.ts` — add parse/format + `creditLimitMinor BigInt` schema assertions
- [ ] `src/lib/validations/currency.test.ts` — CURR-01 Zod rules
- [ ] `src/lib/validations/account.test.ts` — ACCT-01/02 Zod rules (credit required, no debt field)
- [ ] Optional integration: better-sqlite3 in-memory migrate+seed assert one primary (pattern exists in `foundation.test.ts`)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Single local user; no login (Phase 1 posture) |
| V3 Session Management | no | — |
| V4 Access Control | partial | Compose already binds localhost; no multi-user ACL |
| V5 Input Validation | yes | Zod on every Server Action; reject unknown fields / immutable updates |
| V6 Cryptography | no | No secrets beyond local SQLite file |

### Known Threat Patterns for Next.js Server Actions + SQLite

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Tampered FormData changing type/currency/limit after create | Tampering | Update actions accept name only; ignore extra fields |
| Oversized / invalid scale or credit strings | Tampering | Zod bounds; BigInt parse without float |
| SQL injection via raw strings | Tampering | Prisma parameterized APIs only; no string-concat SQL for user input |
| Second primary insert | Elevation / Integrity | Partial unique index + create hardcodes `isPrimary: false` |
| Treating credit limit as spendable asset in future NW | Spoofing of wealth | Column comment + exclude from NW formulas (Phase 5); Phase 2 docs only |

Note: Next.js Forms guide warns to verify auth inside Server Actions `[CITED: nextjs.org/docs/app/guides/forms]` — N/A for intentional single-user local app; still validate all inputs.

## Sources

### Primary (HIGH confidence)
- `prisma/schema.prisma` — current Currency / stubs `[VERIFIED: read this session]`
- `src/lib/money.ts`, `src/lib/db.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `package.json`, `components.json` — Phase 1 contracts `[VERIFIED: read this session]`
- `02-CONTEXT.md` — locked decisions `[VERIFIED: read this session]`
- [Next.js Forms guide](https://nextjs.org/docs/app/guides/forms) — Server Actions + Zod + useActionState `[CITED]`
- [SQLite Partial Indexes](https://sqlite.org/partialindex.html) — unique partial index for one primary `[CITED]`

### Secondary (MEDIUM confidence)
- [Prisma seeding (v7)](https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/seeding) — seed not auto on migrate `[CITED]`
- [Prisma customizing migrations](https://www.prisma.io/docs/orm/prisma-migrate/workflows/customizing-migrations) — INSERT in migration `[CITED via WebSearch]`
- [Prisma database features](https://www.prisma.io/docs/orm/reference/database-features) — SQLite enums since 6.2 `[CITED via WebSearch]`
- [shadcn Sheet/Dialog](https://ui.shadcn.com/docs/components/base/sheet) — Dialog/Sheet composition `[CITED via WebSearch]`
- Phase 01 `01-RESEARCH.md` / summaries — stack continuity

### Tertiary (LOW confidence)
- Exact Russian microcopy for empty states / errors `[ASSUMED]`

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — pinned in package.json; no new packages
- Architecture: **HIGH** — CONTEXT locks + Phase 1 patterns + official Next/SQLite docs
- Pitfalls: **HIGH** — CONTEXT/ROADMAP conflict and seed-vs-migrate are the main failure modes

**Research date:** 2026-09-02  
**Valid until:** 2026-10-02 (stable stack; revisit if Prisma 8 adopted)
