# Phase 3: Dated Balance Snapshots - Pattern Map

**Mapped:** 2026-09-03
**Files analyzed:** 13
**Analogs found:** 12 / 13

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `prisma/schema.prisma` | model | CRUD | `prisma/schema.prisma` (`BalanceAmountStub` / `FxRateStub` / `Account`) | exact |
| `prisma/migrations/*_balance_snapshot/migration.sql` | migration | file-I/O | `prisma/migrations/20260902151000_init_platform_stub/migration.sql` | role-match |
| `src/lib/balances.ts` | utility | transform | `src/lib/money.ts` (+ query style from `src/app/accounts/actions.ts`) | partial |
| `src/lib/balances.test.ts` | test | transform | `src/lib/money.test.ts` | role-match |
| `src/lib/validations/balance.ts` | utility | transform | `src/lib/validations/account.ts` | exact |
| `src/lib/validations/balance.test.ts` | test | transform | `src/lib/validations/account.test.ts` | exact |
| `src/app/accounts/actions.ts` | controller | request-response | `src/app/accounts/actions.ts` | exact |
| `src/app/accounts/actions.test.ts` | test | request-response | `src/app/accounts/actions.test.ts` | exact |
| `src/app/accounts/page.tsx` | route | request-response | `src/app/accounts/page.tsx` | exact |
| `src/components/accounts/AccountList.tsx` | component | request-response | `src/components/accounts/AccountList.tsx` | exact |
| `src/components/accounts/SetBalanceDialog.tsx` | component | request-response | `src/components/accounts/AccountFormDialog.tsx` | exact |
| `src/components/accounts/SetBalanceDialog.test.ts` | test | request-response | `src/components/accounts/AccountFormDialog.test.ts` | exact |
| `src/lib/foundation.test.ts` | test | file-I/O | `src/lib/foundation.test.ts` | exact |

## Pattern Assignments

### `prisma/schema.prisma` (model, CRUD)

**Analog:** `prisma/schema.prisma`

**Core pattern — drop stub, add dated snapshot + Account relation** (lines 28–51):
```prisma
model Account {
  id               Int         @id @default(autoincrement())
  name             String      @unique
  type             AccountType
  currencyCode     String
  currency         Currency    @relation(fields: [currencyCode], references: [code])
  creditLimitMinor BigInt?
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt
  // ADD: balanceSnapshots BalanceSnapshot[]
}

model FxRateStub {
  id                  Int    @id @default(autoincrement())
  currencyCode        String
  asOfDate            String // YYYY-MM-DD  ← reuse this date convention
  rateToPrimaryScaled BigInt
}

model BalanceAmountStub {
  id          Int    @id @default(autoincrement())
  amountMinor BigInt // REPLACE entire model with BalanceSnapshot
}
```

**Replace with** (from RESEARCH Pattern 1):
```prisma
model BalanceSnapshot {
  id          Int     @id @default(autoincrement())
  accountId   Int
  account     Account @relation(fields: [accountId], references: [id], onDelete: Restrict)
  asOfDate    String  // YYYY-MM-DD
  amountMinor BigInt  // native balance; FIAT_CREDIT = available remaining

  @@unique([accountId, asOfDate], name: "accountId_asOfDate")
}
```

---

### `prisma/migrations/*_balance_snapshot/migration.sql` (migration, file-I/O)

**Analog:** `prisma/migrations/20260902151000_init_platform_stub/migration.sql`

**Imports / SQL style** (lines 16–20):
```sql
-- CreateTable
CREATE TABLE "BalanceAmountStub" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "amountMinor" BIGINT NOT NULL
);
```

**Core pattern:** DROP `BalanceAmountStub`; CREATE `BalanceSnapshot` with FK to `Account`, UNIQUE `(accountId, asOfDate)`. Follow Prisma migrate output style (quoted identifiers, BIGINT for money). Secondary analog for FK+CHECK rewrite: `prisma/migrations/20260903005200_account_credit_limit_check/migration.sql`.

---

### `src/lib/balances.ts` (utility, transform)

**Analog:** `src/lib/money.ts` (pure helpers) + prisma access from `src/app/accounts/actions.ts`

**No LOCF/upsert helper exists yet** (`codegraph query findFirst` / `getBalanceAsOf` empty). Copy pure-export style from money; copy `prisma` + `ensureSqlitePragmas` usage from actions when querying.

**Imports pattern** (`src/lib/money.ts` lines 1–16):
```typescript
/** FX rate fixed scale: store rate × 10^8 as BigInt (D-09). */
export const RATE_SCALE_E8 = 100000000n;

export function parseMajorToMinor(major: string, scale: number): bigint {
  // ...
}
```

**Prisma access pattern** (`src/app/accounts/actions.ts` lines 4–5, 60–61):
```typescript
import { ensureSqlitePragmas, prisma } from "@/lib/db";
await ensureSqlitePragmas();
```

**Core LOCF pattern** (RESEARCH — new code, mirror findFirst style):
```typescript
export async function getBalanceAsOf(accountId: number, asOfDate: string) {
  return prisma.balanceSnapshot.findFirst({
    where: { accountId, asOfDate: { lte: asOfDate } },
    orderBy: { asOfDate: "desc" },
  });
}

export function creditDebtMinor(
  creditLimitMinor: bigint,
  availableMinor: bigint,
): bigint {
  return creditLimitMinor - availableMinor;
}
```

**Error handling:** LOCF returns `null` — never `0n`. Debt helper is pure arithmetic; bounds enforced in Zod/actions, not here.

**Also place:** `calendarDateToday(timeZone)` (default `Europe/Moscow`) for D-12 / dialog default — no existing TZ helper; keep next to LOCF in this file.

---

### `src/lib/balances.test.ts` (test, transform)

**Analog:** `src/lib/money.test.ts`

**Core pattern** (lines 49–58 — schema/source-contract style; LOCF tests should be unit-pure or mocked prisma like actions tests):
```typescript
describe("schema conventions", () => {
  it("locks BigInt money/rate fields and required Currency.scale", () => {
    const schema = readFileSync("prisma/schema.prisma", "utf8");
    expect(schema).toMatch(/amountMinor\s+BigInt/);
    // ...
  });
});
```

Prefer Vitest `describe`/`it` + assert LOCF table behavior from RESEARCH Wave 0:
- asOf between snapshots → earlier amount
- before first → `null` (not `0`)
- upsert same date overwrites

For DB mocking, copy `vi.mock("@/lib/db")` from `src/app/accounts/actions.test.ts`.

---

### `src/lib/validations/balance.ts` (utility, transform)

**Analog:** `src/lib/validations/account.ts`

**Imports pattern** (lines 1–14):
```typescript
import { z } from "zod";

const accountNameSchema = z.string().trim().min(1).max(120);
const currencyCodeSchema = z.string().trim().min(1).max(16);
```

**Validation / superRefine pattern** (lines 30–67):
```typescript
export const createAccountSchema = z
  .object({
    name: accountNameSchema,
    type: accountTypeSchema,
    currencyCode: currencyCodeSchema,
    creditLimitMajor: z.string().optional(),
  })
  .strict()
  .superRefine((val, ctx) => {
    // Russian messages via ctx.addIssue({ code: "custom", path, message })
  });
```

**Apply to balance:**
```typescript
const asOfDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Укажите дату");

export const setBalanceSchema = z
  .object({
    accountId: z.coerce.number().int().positive(),
    amountMajor: z.string().trim().min(1),
    asOfDate: asOfDateSchema,
  })
  .strict();
// Future-date + credit 0..limit checks stay in Server Action after parseMajorToMinor
// (need account type/limit from DB) — same split as createAccount credit scale checks.
```

---

### `src/lib/validations/balance.test.ts` (test, transform)

**Analog:** `src/lib/validations/account.test.ts`

**Imports + Russian message assertions** (lines 1–33):
```typescript
import { describe, expect, it } from "vitest";
import {
  createAccountSchema,
  updateAccountNameSchema,
} from "./account";

describe("createAccountSchema (ACCT-01 / ACCT-02)", () => {
  it("rejects FIAT_CREDIT without creditLimitMajor", () => {
    const result = createAccountSchema.safeParse({ /* ... */ });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("Укажите кредитный лимит");
    }
  });
});
```

Cover BAL-01: past/today date OK; future rejected (if in schema or document action-level); credit bounds messages.

---

### `src/app/accounts/actions.ts` (controller, request-response)

**Analog:** same file — extend with `upsertBalanceSnapshot` / `deleteBalanceSnapshot`

**Imports pattern** (lines 1–10):
```typescript
"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
import { parseMajorToMinor } from "@/lib/money";
import {
  createAccountSchema,
  updateAccountNameSchema,
} from "@/lib/validations/account";
```

**Action state + Zod safeParse + money parse + revalidate** (lines 12–21, 47–56, 84–92, 117–118):
```typescript
export type AccountActionState = {
  errors?: { /* field keys */ };
  message?: string;
  success?: boolean;
};

const validated = createAccountSchema.safeParse({ /* FormData fields */ });
if (!validated.success) {
  return { errors: validated.error.flatten().fieldErrors };
}

try {
  creditLimitMinor = parseMajorToMinor(major, currency.scale);
} catch (err) {
  const msg =
    err instanceof Error && err.message === "too many fractional digits"
      ? `Не больше ${currency.scale} знаков после запятой`
      : "Некорректная сумма";
  return { errors: { creditLimitMajor: [msg] } };
}

revalidatePath("/accounts");
return { success: true, message: "Сохранено" };
```

**Core upsert** (new — Prisma compound unique):
```typescript
await prisma.balanceSnapshot.upsert({
  where: { accountId_asOfDate: { accountId, asOfDate } },
  update: { amountMinor },
  create: { accountId, asOfDate, amountMinor },
});
```

**Delete pattern:**
```typescript
await prisma.balanceSnapshot.delete({ where: { id } });
revalidatePath("/accounts");
```

**Auth/Guard:** none (single-user local). Server must still: verify account exists, reject `asOfDate > today`, credit `0n <= available <= creditLimitMinor`.

---

### `src/app/accounts/actions.test.ts` (test, request-response)

**Analog:** same file

**Mock harness** (lines 1–19):
```typescript
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: {
    account: { create: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
    currency: { findUnique: vi.fn() },
  },
  ensureSqlitePragmas: vi.fn(),
}));
```

**Extend:** mock `prisma.balanceSnapshot.upsert` / `.delete`; assert export names include set/delete; assert no debt column in create data; keep existing no-`deleteAccount` account-removal checks.

---

### `src/app/accounts/page.tsx` (route, request-response)

**Analog:** same file

**RSC load + BigInt serialize** (lines 7–33):
```typescript
export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  await ensureSqlitePragmas();
  const [accountsRaw, currencies] = await Promise.all([
    prisma.account.findMany({
      include: { currency: true },
      orderBy: { name: "asc" },
    }),
    prisma.currency.findMany({
      orderBy: { code: "asc" },
      select: { code: true, name: true, scale: true },
    }),
  ]);

  const accounts = accountsRaw.map((a) => ({
    // ...
    creditLimitMinor:
      a.creditLimitMinor == null ? null : a.creditLimitMinor.toString(),
  }));
}
```

**Extend:** batch LOCF for today + history per account; serialize `amountMinor` / debt-derived fields as strings before passing to `AccountList`. Call helpers from `@/lib/balances`.

---

### `src/components/accounts/AccountList.tsx` (component, request-response)

**Analog:** same file (+ empty CTA from lines 34–45)

**List row + money display** (lines 48–86):
```tsx
<ul className="divide-y divide-border rounded-lg border border-border bg-background">
  {accounts.map((account) => {
    const limitText =
      account.type === "FIAT_CREDIT" && account.creditLimitMinor != null
        ? `${formatMinorToMajor(BigInt(account.creditLimitMinor), account.currency.scale)} ${account.currencyCode}`
        : null;
    return (
      <li key={account.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/40">
        {/* ... */}
        <AccountFormDialog mode="edit" account={account} currencies={currencies} />
      </li>
    );
  })}
</ul>
```

**Empty CTA pattern** (lines 34–45) — reuse for no-snapshots CTA «Задать первый баланс»:
```tsx
<div className="flex flex-col items-start gap-4 py-8">
  <div className="grid gap-2">
    <h2 className="text-base font-semibold text-foreground">Нет счетов</h2>
    <p className="max-w-prose text-base text-muted-foreground">...</p>
  </div>
  <AccountFormDialog mode="create" currencies={currencies} />
</div>
```

**No expand/collapse analog in repo** — use local `useState` per RESEARCH A4. Delete buttons only in expanded history (D-11), wired to `deleteBalanceSnapshot` Server Action.

Convert to `"use client"` if expand state + dialog live here (or keep list client island wrapping rows).

---

### `src/components/accounts/SetBalanceDialog.tsx` (component, request-response)

**Analog:** `src/components/accounts/AccountFormDialog.tsx`

**Imports pattern** (lines 1–33):
```tsx
"use client";

import {
  useActionState,
  useEffect,
  useState,
  type ReactElement,
} from "react";
import { /* upsertBalanceSnapshot, type BalanceActionState */ } from "@/app/accounts/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
```

**formKey remount anti-stale-success** (lines 296–330):
```tsx
export function AccountFormDialog(props: AccountFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setFormKey((k) => k + 1);
      }}
    >
      <DialogTrigger render={trigger ?? defaultTrigger} />
      <DialogContent className="sm:max-w-md">
        {open ? (
          <AccountFormBody
            key={formKey}
            /* ... */
            onSuccess={() => setOpen(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
```

**Form body: useActionState + controlled inputs + field errors** (lines 104–111, 125–157):
```tsx
const [state, formAction, isPending] = useActionState(action, initialState);

useEffect(() => {
  if (state?.success) {
    onSuccess();
  }
}, [state, onSuccess]);

<form action={formAction} className="grid gap-4">
  <input type="hidden" name="accountId" value={account.id} />
  {/* amountMajor Label: «Доступный лимит» vs «Баланс» */}
  {/* asOfDate type="date" default today, max={today} */}
</form>
```

**Do not** put delete UI in this Dialog (D-11).

---

### `src/components/accounts/SetBalanceDialog.test.ts` (test, request-response)

**Analog:** `src/components/accounts/AccountFormDialog.test.ts`

**Source-contract pattern** (lines 1–18):
```typescript
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dialogSrc = readFileSync(
  "src/components/accounts/AccountFormDialog.tsx",
  "utf8",
);

describe("AccountFormDialog controlled name (...)", () => {
  it("binds account-name Input from mount-init useState — no defaultValue", () => {
    expect(dialogSrc).toMatch(/const\s*\[\s*name\s*,\s*setName\s*\]\s*=\s*useState/);
    expect(dialogSrc.match(/defaultValue/g) ?? []).toHaveLength(0);
  });
});
```

Assert `formKey` remount + `type="date"` / default-today contract for SetBalanceDialog.

---

### `src/lib/foundation.test.ts` (test, file-I/O)

**Analog:** same file — update table allow-list when stub dropped

**Core pattern** (lines 117–128):
```typescript
const tables = db
  .prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('Currency','Account','FxRateStub','BalanceAmountStub','_prisma_migrations')",
  )
  .all() as Array<{ name: string }>;
expect(tables.map((t) => t.name).sort()).toEqual([
  "Account",
  "BalanceAmountStub",
  "Currency",
  "FxRateStub",
  "_prisma_migrations",
].sort());
```

Replace `BalanceAmountStub` → `BalanceSnapshot` in both IN-list and expected array. Optionally assert new migration name applied (same style as `init_platform_stub` / `currency_primary_rub` checks below).

---

## Shared Patterns

### Server Action + Zod + revalidatePath
**Source:** `src/app/accounts/actions.ts`
**Apply to:** `upsertBalanceSnapshot`, `deleteBalanceSnapshot`
```typescript
"use server";
// safeParse → fieldErrors; try/catch → Russian message; revalidatePath("/accounts"); return { success: true }
```

### Money BigInt parse/format
**Source:** `src/lib/money.ts`
**Apply to:** set-balance action + AccountList / SetBalanceDialog display
```typescript
parseMajorToMinor(major, currency.scale);
formatMinorToMajor(BigInt(serialized), scale);
```

### RSC → client BigInt serialization
**Source:** `src/app/accounts/page.tsx` lines 20–33
**Apply to:** snapshot `amountMinor`, derived debt, credit limit props
```typescript
creditLimitMinor:
  a.creditLimitMinor == null ? null : a.creditLimitMinor.toString(),
```

### Dialog formKey remount
**Source:** `src/components/accounts/AccountFormDialog.tsx` lines 296–330
**Apply to:** `SetBalanceDialog.tsx`

### Russian UI labels + empty CTAs
**Source:** `AccountList.tsx` / `AccountFormDialog.tsx`
**Apply to:** «Задать первый баланс», «Доступный лимит», «Баланс», delete/history copy

### SQLite pragmas before DB work
**Source:** `src/lib/db.ts` + every page/action
**Apply to:** balances helpers if they open DB independently; page + actions already call `ensureSqlitePragmas()`

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/lib/balances.ts` LOCF query body | utility | transform | No `findFirst`/`upsert` balance helpers in app source yet — only RESEARCH sketch + money/actions style |
| Inline expand/collapse history UI | component | request-response | No Collapsible/`useState` expand row in accounts/currencies lists — invent from RESEARCH A4 |

## Metadata

**Analog search scope:** `src/app/accounts`, `src/components/accounts`, `src/lib`, `src/lib/validations`, `prisma/`, codegraph explore/query (`parseMajorToMinor`, `revalidatePath`, AccountFormDialog, accounts actions)
**Files scanned:** ~31 `src/**/*.{ts,tsx}` + prisma schema/migrations (tracked via `git ls-files`)
**Pattern extraction date:** 2026-09-03
**Tracked-source gate:** all named analogs verified `git ls-files` non-empty
