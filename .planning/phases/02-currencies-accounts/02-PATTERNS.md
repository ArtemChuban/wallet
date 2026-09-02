# Phase 2: Currencies + Accounts - Pattern Map

**Mapped:** 2026-09-02
**Files analyzed:** 22
**Analogs found:** 14 / 22

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `prisma/schema.prisma` | model | CRUD | `prisma/schema.prisma` | exact |
| `prisma/migrations/*_currencies_accounts/migration.sql` | migration | batch | `prisma/migrations/20260902151000_init_platform_stub/migration.sql` | role-match |
| `src/lib/money.ts` | utility | transform | `src/lib/money.ts` | exact |
| `src/lib/money.test.ts` | test | transform | `src/lib/money.test.ts` | exact |
| `src/lib/validations/currency.ts` | utility | request-response | — | none |
| `src/lib/validations/account.ts` | utility | request-response | — | none |
| `src/lib/validations/currency.test.ts` | test | request-response | `src/lib/money.test.ts` | role-match |
| `src/lib/validations/account.test.ts` | test | request-response | `src/lib/money.test.ts` | role-match |
| `src/lib/foundation.test.ts` | test | batch | `src/lib/foundation.test.ts` | exact |
| `src/app/layout.tsx` | component | request-response | `src/app/layout.tsx` | exact |
| `src/app/page.tsx` | component | request-response | `src/app/page.tsx` | exact |
| `src/components/nav.tsx` | component | request-response | `src/app/layout.tsx` + `src/app/page.tsx` | partial |
| `src/app/currencies/page.tsx` | route | CRUD | `src/app/page.tsx` | role-match |
| `src/app/accounts/page.tsx` | route | CRUD | `src/app/page.tsx` | role-match |
| `src/app/currencies/actions.ts` | controller | request-response | `src/app/api/health/route.ts` | partial |
| `src/app/accounts/actions.ts` | controller | request-response | `src/app/api/health/route.ts` | partial |
| `src/components/currencies/CurrencyList.tsx` | component | CRUD | `src/app/page.tsx` | partial |
| `src/components/currencies/CurrencyFormDialog.tsx` | component | request-response | `src/components/ui/button.tsx` | partial |
| `src/components/accounts/AccountList.tsx` | component | CRUD | `src/app/page.tsx` | partial |
| `src/components/accounts/AccountFormDialog.tsx` | component | request-response | `src/components/ui/button.tsx` | partial |
| `src/components/ui/{dialog,input,label,select}.tsx` | component | request-response | `src/components/ui/button.tsx` | exact |
| `src/lib/db.ts` | utility | CRUD | `src/lib/db.ts` (reuse, no change) | exact |

## Pattern Assignments

### `prisma/schema.prisma` (model, CRUD)

**Analog:** `prisma/schema.prisma`

**Core pattern** (lines 1–28) — extend stub; keep BigInt money; no Float/Decimal:

```prisma
// Money/FX stub: BigInt → SQLite INTEGER (D-07, D-09). Currency.scale required (D-08).

generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "sqlite"
}

model Currency {
  code  String @id
  name  String
  scale Int // required at create — no DB default
}
```

**Copy for Phase 2:** Add `isPrimary Boolean @default(false)`, `accounts Account[]`, `AccountType` enum, `Account` with `creditLimitMinor BigInt?` (metadata only). Keep `FxRateStub` / `BalanceAmountStub` intact. Document partial unique index in schema comment (enforced in migration SQL).

---

### `prisma/migrations/*_currencies_accounts/migration.sql` (migration, batch)

**Analog:** `prisma/migrations/20260902151000_init_platform_stub/migration.sql`

**Core pattern** (lines 1–20) — Prisma-generated CREATE TABLE style:

```sql
-- CreateTable
CREATE TABLE "Currency" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "scale" INTEGER NOT NULL
);
```

**Phase 2 additions (from RESEARCH, no in-repo analog for seed):** After ALTER/CREATE, customize migration:

```sql
INSERT INTO "Currency" ("code", "name", "scale", "isPrimary")
VALUES ('RUB', 'Рубль', 2, 1);

CREATE UNIQUE INDEX "Currency_one_primary"
ON "Currency"("isPrimary") WHERE "isPrimary" = 1;
```

**Deploy path analog:** `src/lib/foundation.test.ts` lines 96–140 — `prisma migrate deploy` on fresh file DB via `execFileSync`; extend assertions to expect seeded RUB + `Account` table + one primary.

---

### `src/lib/money.ts` (utility, transform)

**Analog:** `src/lib/money.ts`

**Imports / contract** (lines 1–2):

```typescript
/** FX rate fixed scale: store rate × 10^8 as BigInt (D-09). */
export const RATE_SCALE_E8 = 100000000n;
```

**Extend with** `parseMajorToMinor(major: string, scale: number): bigint` and `formatMinorToMajor(minor: bigint, scale: number): string` — BigInt only; no `Number`/`parseFloat`; reject scientific notation. Used by account create for `creditLimitMajor` → `creditLimitMinor`.

---

### `src/lib/money.test.ts` (test, transform)

**Analog:** `src/lib/money.test.ts`

**Core pattern** (lines 1–29) — vitest + schema file grep for money conventions:

```typescript
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RATE_SCALE_E8 } from "./money";

describe("money conventions", () => {
  it("exports RATE_SCALE_E8 as 100000000n", () => {
    expect(RATE_SCALE_E8).toBe(100000000n);
  });
});

describe("schema conventions", () => {
  it("locks BigInt money/rate fields and required Currency.scale", () => {
    const schema = readFileSync("prisma/schema.prisma", "utf8");
    expect(schema).toMatch(/amountMinor\s+BigInt/);
    expect(schema).toMatch(/rateToPrimaryScaled\s+BigInt/);
    expect(schema).toMatch(/scale\s+Int/);
    expect(schema).not.toMatch(/\bFloat\b/);
    expect(schema).not.toMatch(/\bDecimal\b/);
  });
});
```

**Extend:** assert `creditLimitMinor\s+BigInt`; round-trip parse/format for scales 0, 2, 8, 18.

---

### `src/lib/validations/currency.ts` / `account.ts` (utility, request-response)

**Analog:** none in codebase (zod installed, unused). Use RESEARCH Pattern 2 + Zod sketch.

**Planner must copy from RESEARCH.md:**

```typescript
import { z } from "zod";

// currency create: code free short string, scale 0–18, name required
// currency update: name only
// account create: type enum + currencyCode + creditLimitMajor superRefine for FIAT_CREDIT
// account update: name only
```

Russian error strings from `02-UI-SPEC.md` Copywriting Contract (duplicate code/name, scale range, credit limit).

---

### `src/lib/validations/*.test.ts` (test, request-response)

**Analog:** `src/lib/money.test.ts` (vitest structure) + `src/app/api/health/route.test.ts` (describe/it focus)

**Test harness** from `vitest.config.ts` (lines 4–14): `include: ["src/**/*.test.ts"]`, alias `@` → `./src`.

**Health test pattern** (lines 1–12) for mock style if action tests need prisma mock:

```typescript
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
  ensureSqlitePragmas: vi.fn(),
}));
```

Prefer pure Zod unit tests (no DB) for Wave 0 validation files.

---

### `src/app/layout.tsx` (component, request-response)

**Analog:** `src/app/layout.tsx`

**Imports + shell** (lines 1–28):

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
```

**Phase 2:** Insert top nav (Russian: Готовность · Валюты · Счета) above `{children}`; keep `lang="ru"`, Geist fonts, `flex flex-col`.

---

### `src/app/page.tsx` (component / RSC list analog, request-response)

**Analog:** `src/app/page.tsx` — best existing RSC + prisma + Russian UI pattern

**Imports + dynamic + DB** (lines 1–16):

```tsx
import { ensureSqlitePragmas, prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

async function getDbReadiness(): Promise<"ok" | "not_ready"> {
  try {
    await ensureSqlitePragmas();
    await prisma.$queryRaw`SELECT 1`;
    // ...
  } catch {
    return "not_ready";
  }
}
```

**Russian chrome + typography** (lines 18–30) — Display size on home only:

```tsx
<main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 font-sans">
  <h1 className="text-3xl font-semibold tracking-tight text-foreground">
    Кошелёк готов
  </h1>
  <p className="text-muted-foreground" data-db-status={dbStatus}>
    База данных: {dbStatus === "ok" ? "готова" : "не готова"}
  </p>
</main>
```

**Copy for list pages:** Same `dynamic = "force-dynamic"`, `ensureSqlitePragmas` + prisma queries; Heading = `text-2xl font-semibold` («Валюты» / «Счета»); muted empty states from UI-SPEC.

---

### `src/app/currencies/page.tsx` / `src/app/accounts/page.tsx` (route, CRUD)

**Analog:** `src/app/page.tsx` (RSC data load)

**Pattern to copy:**

1. `"force-dynamic"` + `ensureSqlitePragmas()` before queries
2. Server Component `async` default export
3. `prisma.currency.findMany` / `prisma.account.findMany({ include: { currency: true } })`
4. Compose list + Dialog client children; no `/new` routes

---

### `src/app/currencies/actions.ts` / `src/app/accounts/actions.ts` (controller, request-response)

**Analog (partial):** `src/app/api/health/route.ts` — prisma + try/catch + status shaping only. **No Server Actions exist yet.**

**DB access pattern** (lines 1–24):

```typescript
import { ensureSqlitePragmas, prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSqlitePragmas();
    await prisma.$queryRaw`SELECT 1`;
    // ...
  } catch {
    return NextResponse.json({ status: "not_ready" }, { status: 503 });
  }
}
```

**Action shape from RESEARCH (mandatory for planner):**

```typescript
"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma, ensureSqlitePragmas } from "@/lib/db";

export async function updateCurrencyName(
  _prev: { errors?: { name?: string[] }; message?: string },
  formData: FormData,
) {
  const validated = schema.safeParse({ name: formData.get("name") });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }
  await ensureSqlitePragmas();
  // prisma update name only — ignore tampered code/scale/type/limit
  revalidatePath("/currencies");
  return { message: "Сохранено" };
}
```

**Immutability:** create accepts identity fields; update actions accept **name only**. Create currency hardcodes `isPrimary: false`. No delete exports.

---

### `src/components/nav.tsx` (component, request-response)

**Analog:** `src/app/layout.tsx` (shell) + `src/app/page.tsx` (Russian labels / muted tokens)

**UI-SPEC contract:** top horizontal nav; labels `Готовность · Валюты · Счета`; active link uses accent/primary emphasis; secondary bar background `--muted` / `--secondary`.

No existing Link nav — use Next `Link` + `cn()` from `src/lib/utils.ts`:

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

### `src/components/currencies/*` / `src/components/accounts/*` (component)

**Analog (partial):** `src/app/page.tsx` for list/empty Russian copy; `src/components/ui/button.tsx` for CTA variants.

**Button import / variants** (lines 1–56) — use `default` for primary CTAs, `outline`/`ghost` for row edit; **no `destructive`** in Phase 2:

```tsx
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// variant default = primary CTA («Добавить валюту», «Сохранить»)
// outline / ghost = row edit
```

**shadcn install path:** `npx shadcn@latest add dialog input label select` — match `button.tsx` conventions (`data-slot`, `cn`, base-nova, `@/components/ui/*` aliases from `components.json`).

**Client forms:** `"use client"` + `useActionState` binding to Server Actions; Dialog stays open until success (UI-SPEC).

---

### `src/components/ui/{dialog,input,label,select}.tsx` (component)

**Analog:** `src/components/ui/button.tsx` — exact shadcn install style

**Do not hand-roll.** CLI copy into `src/components/ui/`. Preserve:

- `@base-ui/react` primitives
- `cn` from `@/lib/utils`
- `data-slot` attributes
- CSS variables from `globals.css` (`--destructive` for `aria-invalid` only)

---

### `src/lib/db.ts` (utility, CRUD) — reuse unchanged

**Analog:** `src/lib/db.ts`

**Singleton + pragmas** (lines 1–32):

```typescript
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

export async function ensureSqlitePragmas(): Promise<void> {
  if (globalForPrisma.sqlitePragmasApplied) return;
  await prisma.$executeRawUnsafe("PRAGMA journal_mode=WAL");
  await prisma.$executeRawUnsafe("PRAGMA foreign_keys=ON");
  await prisma.$executeRawUnsafe("PRAGMA busy_timeout=5000");
  globalForPrisma.sqlitePragmasApplied = true;
}
```

**Apply to:** every Server Action and RSC page that touches SQLite (same as home + health).

## Shared Patterns

### Path aliases
**Source:** `components.json` lines 15–20; `vitest.config.ts` lines 9–12  
**Apply to:** all new `src/` files

```json
"aliases": {
  "components": "@/components",
  "utils": "@/lib/utils",
  "ui": "@/components/ui",
  "lib": "@/lib"
}
```

### Prisma client access
**Source:** `src/lib/db.ts`  
**Apply to:** pages + actions

- Import `{ prisma, ensureSqlitePragmas }` from `@/lib/db`
- Call `ensureSqlitePragmas()` before queries/mutations
- Use generated client from `@/generated/prisma` (via db singleton only)

### Error / readiness handling
**Source:** `src/app/api/health/route.ts` lines 10–24; `src/app/page.tsx` lines 5–15  
**Apply to:** actions (map Zod failures → fieldErrors; Prisma unique → Russian duplicate messages from UI-SPEC); pages may surface soft empty/error without crashing like home `catch → not_ready`

### Money / no-float contract
**Source:** `src/lib/money.ts` + `src/lib/money.test.ts`  
**Apply to:** schema (`creditLimitMinor BigInt`), parse/format helpers, schema tests forbidding Float/Decimal

### Russian UI chrome
**Source:** `src/app/page.tsx`, `src/app/layout.tsx` (`lang="ru"`), `02-UI-SPEC.md` Copywriting Contract  
**Apply to:** nav, list titles, CTAs, empty/error strings, account-type labels

### shadcn component style
**Source:** `src/components/ui/button.tsx` + `components.json` (`style: base-nova`)  
**Apply to:** all new UI primitives and form CTAs

### Vitest conventions
**Source:** `src/lib/money.test.ts`, `src/lib/foundation.test.ts`, `vitest.config.ts`  
**Apply to:** Wave 0 validation + money + migrate-seed assertions; run via `npm test` (`vitest run`)

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/lib/validations/currency.ts` | utility | request-response | No Zod schemas in repo yet — use RESEARCH Pattern 2 |
| `src/lib/validations/account.ts` | utility | request-response | Same; account `superRefine` for credit limit only in RESEARCH sketch |
| `src/app/currencies/actions.ts` | controller | request-response | No `"use server"` / `useActionState` / `revalidatePath` examples — partial health route only |
| `src/app/accounts/actions.ts` | controller | request-response | Same |
| `src/components/currencies/CurrencyFormDialog.tsx` | component | request-response | No Dialog/forms yet — install shadcn dialog; bind RESEARCH action pattern |
| `src/components/accounts/AccountFormDialog.tsx` | component | request-response | Same |
| Migration RUB seed + partial unique index SQL | migration | batch | Init migration has CREATE only — seed/index from RESEARCH Pattern 1 |
| AccountType Russian label map | utility | transform | No i18n module — hardcode map from UI-SPEC / RESEARCH |

## Metadata

**Analog search scope:** `src/`, `prisma/`, `components.json`, `vitest.config.ts`  
**Files scanned:** 16 tracked source files under `src/` + `prisma/`  
**Tracked-source gate:** all named analogs verified via `git ls-files`  
**Pattern extraction date:** 2026-09-02
