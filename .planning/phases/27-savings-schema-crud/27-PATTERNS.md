# Phase 27: SAVINGS schema + CRUD - Pattern Map

**Mapped:** 2026-09-11
**Files analyzed:** 16
**Analogs found:** 15 / 16

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `prisma/schema.prisma` | model | CRUD | `prisma/schema.prisma` (Account + FIAT_CREDIT fields) | exact |
| `prisma/migrations/*_savings_account/migration.sql` | migration | transform | `prisma/migrations/20260909090903_credit_grace_dual_dom/migration.sql` | exact |
| `src/lib/account-type.ts` | utility | transform | `src/lib/account-type.ts` | exact |
| `src/lib/account-type.test.ts` | test | transform | `src/lib/account-type.test.ts` | exact |
| `src/lib/validations/account.ts` | utility | request-response | `src/lib/validations/account.ts` (create + grace DOM) | exact |
| `src/lib/validations/account.test.ts` | test | request-response | `src/lib/validations/account.test.ts` | exact |
| `src/lib/net-worth.ts` | service | transform | `src/lib/net-worth.ts` | exact |
| `src/lib/net-worth.test.ts` | test | transform | `src/lib/net-worth.test.ts` | exact |
| `src/lib/savings-rate.ts` (or thin helpers colocated) | utility | transform | `src/lib/money.ts` (`parseMajorToMinor` scale 2) | role-match |
| `src/lib/savings-accrual-display.ts` | utility | transform | `src/lib/credit-grace.ts` (`clampDayOfMonth` calendar) | role-match |
| `src/lib/savings-accrual-display.test.ts` | test | transform | `src/lib/credit-grace.test.ts` | role-match |
| `src/app/accounts/actions.ts` | controller | request-response | `src/app/accounts/actions.ts` (`createAccount` + `updateAccountName`) | exact |
| `src/app/accounts/actions.test.ts` | test | request-response | `src/app/accounts/actions.test.ts` | exact |
| `src/app/accounts/page.tsx` | route | request-response | `src/app/accounts/page.tsx` | exact |
| `src/components/accounts/AccountFormDialog.tsx` | component | request-response | `src/components/accounts/AccountFormDialog.tsx` | exact |
| `src/components/accounts/AccountList.tsx` | component | request-response | `src/components/accounts/AccountList.tsx` | exact |

**Unchanged reuse (no edit expected):** `src/lib/dates.ts`, `src/lib/historical-series.ts` (type flows via `NetWorthAccountType`), BalanceSnapshot upsert path.

## Pattern Assignments

### `prisma/schema.prisma` (model, CRUD)

**Analog:** `prisma/schema.prisma`

**Core pattern** — extend enum + nullable type-gated columns (lines 12–18, 97–113):

```prisma
enum AccountType {
  ASSET
  FIAT_DEBIT
  FIAT_CREDIT
  CRYPTO
  CASH
  // ADD: SAVINGS
}

model Account {
  // …
  creditLimitMinor BigInt?
  statementDayOfMonth Int?
  dueDayOfMonth       Int?
  // ADD (mirror credit metadata comments):
  // annualRateBps       Int?  — required iff type == SAVINGS
  // accrualDayOfMonth   Int?  — required iff type == SAVINGS
}
```

**Copy discipline:** Comment style of `creditLimitMinor` / grace DOM — document CHECK name + iff-type rule in doc comments.

---

### `prisma/migrations/*_savings_account/migration.sql` (migration, transform)

**Analog:** `prisma/migrations/20260909090903_credit_grace_dual_dom/migration.sql`

**Core RedefineTables pattern** (lines 1–45) — keep **both** existing CHECKs, add savings:

```sql
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Account" (
    -- all existing columns + annualRateBps + accrualDayOfMonth
    CONSTRAINT "Account_credit_limit_invariant" CHECK ( … ),
    CONSTRAINT "Account_grace_dom_invariant" CHECK ( … ),
    CONSTRAINT "Account_savings_rate_invariant" CHECK (
      (
        type = 'SAVINGS'
        AND annualRateBps IS NOT NULL AND annualRateBps >= 0
        AND accrualDayOfMonth IS NOT NULL
        AND accrualDayOfMonth BETWEEN 1 AND 31
      )
      OR (
        type != 'SAVINGS'
        AND annualRateBps IS NULL
        AND accrualDayOfMonth IS NULL
      )
    )
);
INSERT INTO "new_Account" (…old columns only…)
SELECT … FROM "Account";
DROP TABLE "Account";
ALTER TABLE "new_Account" RENAME TO "Account";
CREATE UNIQUE INDEX "Account_name_key" ON "Account"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
```

**Pitfall:** Do **not** drop `Account_credit_limit_invariant` / `Account_grace_dom_invariant` when copying CREATE.

---

### `src/lib/account-type.ts` (utility, transform)

**Analog:** `src/lib/account-type.ts`

**Soft union + isAssetType + label** (lines 3–26):

```typescript
export type AccountTypeSoft =
  | "ASSET"
  | "FIAT_CREDIT"
  | "FIAT_DEBIT"
  | "CRYPTO"
  | "CASH";
  // ADD: | "SAVINGS"

export function isAssetType(t: string): boolean {
  return (
    t === "ASSET" ||
    t === "FIAT_DEBIT" ||
    t === "CRYPTO" ||
    t === "CASH"
    // ADD: || t === "SAVINGS"
  );
}

export function accountTypeLabel(t: string): string {
  return isCreditType(t) ? "Кредитный" : "Актив";
  // CHANGE: branch SAVINGS → "Накопительный"; keep credit; else "Актив"
}
```

---

### `src/lib/validations/account.ts` (utility, request-response)

**Analog:** `src/lib/validations/account.ts`

**Imports / write enum** (lines 1–6):

```typescript
import { z } from "zod";
const accountTypeSchema = z.enum(["ASSET", "FIAT_CREDIT"]);
// EXTEND → z.enum(["ASSET", "FIAT_CREDIT", "SAVINGS"])
```

**Type-gated superRefine twin** (lines 26–63) — mirror creditLimit for savings fields:

```typescript
export const createAccountSchema = z
  .object({
    name: accountNameSchema,
    type: accountTypeSchema,
    currencyCode: currencyCodeSchema,
    creditLimitMajor: z.string().optional(),
    // ADD: annualRatePercentMajor?: string; accrualDayOfMonth?: number|null
  })
  .strict()
  .superRefine((val, ctx) => {
    // FIAT_CREDIT: require creditLimit; reject savings fields
    // SAVINGS: require percent (0 OK) + DOM 1–31; reject creditLimit
    // ASSET: reject credit + savings fields
  });
```

**DOM coerce schema** (lines 70–74) — reuse for accrual day:

```typescript
const nullableDayOfMonthSchema = z.preprocess((val) => {
  if (val === "" || val === undefined || val === null) return null;
  return val;
}, z.coerce.number().int().min(1).max(31).nullable());
```

For SAVINGS create/update: prefer **required** DOM (not nullable) — `z.coerce.number().int().min(1).max(31)` — clearing forbidden (D-06).

**Update schema evolution:** Today name-only (lines 65–68). Extend to coherent SAVINGS update:

```typescript
export const updateAccountNameSchema = z.object({ name: accountNameSchema });
// REPLACE/EXTEND → updateAccountSchema: name always; annualRatePercentMajor + accrualDayOfMonth required when type gate applied in action (DB type === SAVINGS)
```

---

### `src/lib/net-worth.ts` (service, transform)

**Analog:** `src/lib/net-worth.ts`

**Union only** (lines 7–12) — row math already treats non-credit as asset via `isCreditType`:

```typescript
export type NetWorthAccountType =
  | "ASSET"
  | "FIAT_DEBIT"
  | "FIAT_CREDIT"
  | "CRYPTO"
  | "CASH";
  // ADD: | "SAVINGS"
```

No change needed in `rowFor` (lines 76–154) if `isCreditType` stays FIAT_CREDIT-only.

---

### `src/lib/savings-rate.ts` (utility, transform)

**Analog:** `src/lib/money.ts`

**Imports / parse-format at scale 2** (lines 48–67, 78–97):

```typescript
import { parseMajorToMinor, formatMinorToMajor } from "@/lib/money";

export function parsePercentToBps(major: string): number {
  const minor = parseMajorToMinor(major, 2); // 16.50 → 1650n
  if (minor < 0n) throw new Error("negative rate");
  const n = Number(minor);
  if (!Number.isSafeInteger(n) || n > 2147483647) throw new Error("rate too large");
  return n;
}

export function formatBpsToPercentMajor(bps: number): string {
  return formatMinorToMajor(BigInt(bps), 2);
}
```

**Do not** use `parseRateToScaled` (FX scale 8) — semantic clash.

---

### `src/lib/savings-accrual-display.ts` (utility, transform)

**Analog:** `src/lib/credit-grace.ts` + `src/lib/dates.ts`

**Imports / clamp calendar** (credit-grace lines 1–34; dates 39–66):

```typescript
/**
 * Display-only next accrual — no Prisma, no interest amount math (Phase 28).
 */
import { addCalendarDays, clampDayOfMonth } from "@/lib/dates";

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

**Module isolation pattern** from credit-grace header (lines 1–5): pure TS; no Prisma / net-worth imports.

---

### `src/app/accounts/actions.ts` (controller, request-response)

**Analog:** `src/app/accounts/actions.ts`

**Action state + create skeleton** (lines 25–156):

```typescript
"use server";
import { revalidatePath } from "next/cache";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
import { parseMajorToMinor } from "@/lib/money";
import { createAccountSchema, updateAccountNameSchema } from "@/lib/validations/account";

export async function createAccount(_prev, formData): Promise<AccountActionState> {
  const validated = createAccountSchema.safeParse({ /* FormData fields */ });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }
  // currency lookup → type-gated parse → prisma.account.create → revalidatePath
}
```

**Create SAVINGS branch:** twin of FIAT_CREDIT creditLimit block (lines 108–134) — call `parsePercentToBps`; set `annualRateBps` + `accrualDayOfMonth`; leave `creditLimitMinor` null.

**Update — evolve from name-only** (lines 158–202):

```typescript
export async function updateAccountName(_prev, formData) {
  // load account by id; validate name;
  // IF account.type === "SAVINGS": also require + persist annualRateBps + accrualDayOfMonth
  // ELSE: name only; ignore/reject savings fields
  // Never trust client type/currency (T-02-01)
}
```

Prefer rename to `updateAccount` or keep export name but broaden body (discretion). Revalidate `/accounts` + `/` like today.

**Balance path unchanged** (lines 619–703): non-credit `amountMinor >= 0` already allows SAVINGS — no type exclude.

**Error handling pattern:**

```typescript
} catch (error) {
  if (isUniqueNameViolation(error)) {
    return { errors: { name: ["Счёт с таким названием уже есть"] } };
  }
  return { message: "Не удалось сохранить. Проверьте поля и попробуйте снова." };
}
```

Extend `AccountActionState.errors` with `annualRatePercentMajor` / `accrualDayOfMonth` keys.

---

### `src/app/accounts/page.tsx` (route, request-response)

**Analog:** `src/app/accounts/page.tsx`

**Serialize ints for client** (lines 66–100) — add savings fields beside grace DOM:

```typescript
const accounts = accountsRaw.map((a) => ({
  // …
  statementDayOfMonth: a.statementDayOfMonth,
  dueDayOfMonth: a.dueDayOfMonth,
  // ADD:
  annualRateBps: a.annualRateBps,
  accrualDayOfMonth: a.accrualDayOfMonth,
  // BigInt still .toString() for creditLimitMinor / snapshot amounts
}));
```

Pass `today` already injected into `AccountList` — reuse for days-until helper.

---

### `src/components/accounts/AccountFormDialog.tsx` (component, request-response)

**Analog:** `src/components/accounts/AccountFormDialog.tsx`

**TYPE_OPTIONS + type-gated field** (lines 72–75, 111, 243–263):

```typescript
const TYPE_OPTIONS = [
  { value: "ASSET", label: "Актив" },
  { value: "FIAT_CREDIT", label: "Кредитный" },
  // ADD: { value: "SAVINGS", label: "Накопительный" },
] as const;

const showCreditLimit = mode === "create" && isCreditType(accountType);
// ADD: const showSavingsFields = (mode === "create" && accountType === "SAVINGS")
//   || (mode === "edit" && account?.type === "SAVINGS");
```

**Edit title/copy** (lines 109–129) — D-09:

```typescript
const title = mode === "create" ? "Новый счёт" : "Изменить счёт"; // was "Изменить название"
// description: create keeps type/currency lock copy; edit → generic (no field inventory)
```

**Action wiring** (lines 100–101): edit must post to coherent update that accepts rate+DOM for SAVINGS.

**Labels locked:** `Годовой %`, `День начисления`. Prefill edit rate via `formatBpsToPercentMajor(account.annualRateBps)`.

---

### `src/components/accounts/AccountList.tsx` (component, request-response)

**Analog:** `src/components/accounts/AccountList.tsx`

**Secondary line pattern** (lines 171–174, 245–255) — twin `limitText` for savings:

```typescript
const limitText =
  isCreditType(account.type) && account.creditLimitMinor != null
    ? `${formatMinorToMajor(…)} ${account.currencyCode}`
    : null;
// ADD savingsText: rate% + days-until (NOT raw DOM)
// e.g. `${formatBpsToPercentMajor(bps)}% · через N дн.` or «сегодня»

<p className="mt-1 text-sm text-muted-foreground">
  <span>{typeLabel}</span>
  <span className="mx-2">·</span>
  <span className="font-mono">{account.currencyCode}</span>
  {limitText ? (<>· лимит {limitText}</>) : null}
  {/* ADD savingsText segment */}
</p>
```

Extend `AccountListItem` type with `annualRateBps` / `accrualDayOfMonth`.

---

### Tests

| File | Analog pattern |
|------|----------------|
| `account-type.test.ts` | Label + `isAssetType` / `isCreditType` matrix (lines 8–21) — add SAVINGS → «Накопительный», `isAssetType` true |
| `validations/account.test.ts` | `createAccountSchema` accept/reject matrix (ASSET / FIAT_CREDIT) — add SAVINGS rate+DOM; reject savings on ASSET; accept 0% |
| `net-worth.test.ts` | `input({ type: "ASSET", locfAmountMinor })` sums (lines 21–33) — twin with `type: "SAVINGS"` |
| `actions.test.ts` | FormData create persist (lines 134–186) — SAVINGS create with bps+DOM; update name+rate+DOM; assert no BalanceSnapshot on metadata update |
| `savings-accrual-display.test.ts` | New — follow `credit-grace.test.ts` pure-helper style: Feb DOM 31 clamp; today → «сегодня»; past DOM → next month |

## Shared Patterns

### Dual enforcement (Zod + SQLite CHECK)
**Source:** `src/lib/validations/account.ts` + grace migration CHECKs  
**Apply to:** create/update SAVINGS fields; migration `Account_savings_rate_invariant`  
Type-gated columns: present+valid iff type matches; else null.

### Server Action FormData + flatten errors
**Source:** `src/app/accounts/actions.ts` lines 73–92, 144–155  
**Apply to:** createAccount + coherent SAVINGS update  
`safeParse` → `fieldErrors` → Prisma → `revalidatePath("/accounts")` + `"/"`.

### Type immutability after create
**Source:** `AccountFormDialog` edit mode (type/currency read-only text) + `updateAccountName` ignores client type  
**Apply to:** SAVINGS edit — never allow ASSET ↔ SAVINGS; load type from DB for field gate.

### Soft-read asset inclusion
**Source:** `account-type.ts` `isAssetType` + `NetWorthAccountType`  
**Apply to:** SAVINGS principal in NW; legacy FIAT_DEBIT/CRYPTO/CASH unchanged.

### Money scale-2 parse (not FX e8)
**Source:** `src/lib/money.ts` `parseMajorToMinor` / `formatMinorToMajor`  
**Apply to:** percent ↔ bps helpers only.

### Calendar DOM via clampDayOfMonth
**Source:** `src/lib/dates.ts` + `src/lib/credit-grace.ts`  
**Apply to:** next-accrual display helper; never raw DOM on list.

### Manual BalanceSnapshot only
**Source:** `upsertBalanceSnapshot` (actions.ts 619+)  
**Apply to:** Phase 27 — no interest writer; SAVINGS uses existing non-credit ≥0 path (D-16).

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| — | — | — | All Phase 27 files map to credit/ASSET twins or money/dates helpers. `savings-rate.ts` / `savings-accrual-display.ts` are new modules but role-match `money.ts` / `credit-grace.ts`. |

## Metadata

**Analog search scope:** `prisma/`, `src/lib/`, `src/app/accounts/`, `src/components/accounts/`  
**Files scanned:** ~159 under `src/` (+ prisma schema/migration analogs)  
**Tracked-source gate:** all named analogs verified via `git ls-files`  
**Pattern extraction date:** 2026-09-11
