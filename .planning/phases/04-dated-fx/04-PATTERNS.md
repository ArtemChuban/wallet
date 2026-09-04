# Phase 4: Dated FX - Pattern Map

**Mapped:** 2026-09-03
**Files analyzed:** 17
**Analogs found:** 16 / 17

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `prisma/schema.prisma` (`FxRate` replace stub) | model | CRUD | `BalanceSnapshot` in same file | exact |
| `prisma/migrations/*_fx_rate/migration.sql` | migration | transform | `prisma/migrations/20260903120000_balance_snapshot/migration.sql` | exact |
| `src/lib/fx.ts` | service | request-response | `src/lib/balances.ts` | exact |
| `src/lib/fx.test.ts` | test | request-response | `src/lib/balances.test.ts` | exact |
| `src/lib/money.ts` (parse/format/invert rate) | utility | transform | same file (`parseMajorToMinor` / `RATE_SCALE_E8`) | exact |
| `src/lib/money.test.ts` | test | transform | same file (scale-8 round-trip cases) | exact |
| `src/lib/validations/fx.ts` | utility | request-response | `src/lib/validations/balance.ts` | exact |
| `src/lib/validations/fx.test.ts` | test | request-response | `src/lib/validations/balance.test.ts` | exact |
| `src/app/currencies/actions.ts` (upsert/delete FX) | controller | CRUD | `src/app/accounts/actions.ts` (`upsertBalanceSnapshot` / `deleteBalanceSnapshot`) | exact |
| `src/app/currencies/actions.test.ts` | test | CRUD | `src/app/currencies/actions.test.ts` + accounts action tests | role-match |
| `src/app/currencies/layout.tsx` | route | request-response | `src/components/nav.tsx` (Link + active underline) | partial |
| `src/app/currencies/rates/page.tsx` | route | CRUD | `src/app/accounts/page.tsx` | exact |
| `src/app/currencies/page.tsx` | route | CRUD | same file (keep list; layout wraps) | exact |
| `src/components/currencies/RateList.tsx` | component | CRUD | `src/components/accounts/AccountList.tsx` | exact |
| `src/components/currencies/SetRateDialog.tsx` | component | request-response | `src/components/accounts/SetBalanceDialog.tsx` + Select from `AccountFormDialog.tsx` | exact |
| `src/components/nav.tsx` | component | request-response | same file (href + active prefix) | exact |
| `src/lib/foundation.test.ts` | test | transform | same file (`FxRateStub` table allow-list) | exact |

## Pattern Assignments

### `prisma/schema.prisma` — `FxRate` (model, CRUD)

**Analog:** `BalanceSnapshot` + current `FxRateStub` in `prisma/schema.prisma`

**Core pattern** — compound unique + FK Restrict (lines 49–57); stub fields to preserve (42–47):

```prisma
model BalanceSnapshot {
  id          Int     @id @default(autoincrement())
  accountId   Int
  account     Account @relation(fields: [accountId], references: [id], onDelete: Restrict)
  asOfDate    String // YYYY-MM-DD
  amountMinor BigInt

  @@unique([accountId, asOfDate], name: "accountId_asOfDate")
}

model FxRateStub {
  id                  Int    @id @default(autoincrement())
  currencyCode        String
  asOfDate            String // YYYY-MM-DD
  rateToPrimaryScaled BigInt // primary_units_per_1_other * 10^8
}
```

**Copy for planner:** Replace stub with `FxRate` mirroring BalanceSnapshot shape: `currencyCode` FK → `Currency` (`onDelete: Restrict`), `asOfDate`, `rateToPrimaryScaled BigInt`, `@@unique([currencyCode, asOfDate], name: "currencyCode_asOfDate")`, plus `fxRates FxRate[]` on `Currency`.

---

### `prisma/migrations/*_fx_rate/migration.sql` (migration, transform)

**Analog:** `prisma/migrations/20260903120000_balance_snapshot/migration.sql`

**Core pattern** (lines 1–14):

```sql
-- DropTable
DROP TABLE "BalanceAmountStub";

-- CreateTable
CREATE TABLE "BalanceSnapshot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "accountId" INTEGER NOT NULL,
    "asOfDate" TEXT NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    CONSTRAINT "BalanceSnapshot_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "BalanceSnapshot_accountId_asOfDate_key" ON "BalanceSnapshot"("accountId", "asOfDate");
```

**Copy:** `DROP TABLE "FxRateStub"`; `CREATE TABLE "FxRate"` with FK to `Currency(code)`, unique index on `(currencyCode, asOfDate)`. No row backfill (stub unused).

---

### `src/lib/fx.ts` (service, request-response)

**Analog:** `src/lib/balances.ts`

**Imports + LOCF core** (lines 1–13):

```typescript
import { ensureSqlitePragmas, prisma } from "@/lib/db";

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

**Reuse today helper** (lines 27–41) — do not reimplement; import `calendarDateToday` from `@/lib/balances`:

```typescript
export function calendarDateToday(timeZone: string = "Europe/Moscow"): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  // ...
  return `${year}-${month}-${day}`;
}
```

**FX mirror:** `getRateAsOf(currencyCode, asOfDate)` → `prisma.fxRate.findFirst({ where: { currencyCode, asOfDate: { lte } }, orderBy: { asOfDate: "desc" } })`. Return `null` before first (D-15). Put `convertOtherMinorToPrimaryMinor` here; short-circuit primary identity in callers (D-16), not by inventing FX rows.

---

### `src/lib/fx.test.ts` (test, request-response)

**Analog:** `src/lib/balances.test.ts`

**Imports + mock + LOCF assertions** (lines 1–67):

```typescript
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    balanceSnapshot: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
  },
  ensureSqlitePragmas: vi.fn(),
}));

// ...
it("before first snapshot returns null not 0n", async () => {
  vi.mocked(prisma.balanceSnapshot.findFirst).mockResolvedValue(null);
  const row = await getBalanceAsOf(7, "2025-12-31");
  expect(row).toBeNull();
});
```

**Copy:** Mock `prisma.fxRate.findFirst`; assert query shape `lte` + `orderBy desc`; null-before-first; between/exact date cases from RESEARCH Wave 0; add convert helper cases (null missing rate; truncating BigInt math).

---

### `src/lib/money.ts` — rate helpers (utility, transform)

**Analog:** same file

**Imports / scale constant + parse/format** (lines 1–49):

```typescript
/** FX rate fixed scale: store rate × 10^8 as BigInt (D-09). */
export const RATE_SCALE_E8 = 100000000n;

export function parseMajorToMinor(major: string, scale: number): bigint { /* ... */ }
export function formatMinorToMajor(minor: bigint, scale: number): string { /* ... */ }
```

**Add beside `RATE_SCALE_E8`:**

```typescript
export function parseRateToScaled(major: string): bigint {
  return parseMajorToMinor(major, 8);
}
export function formatRateScaled(scaled: bigint): string {
  return formatMinorToMajor(scaled, 8);
}
export function invertRateScaled(rateToPrimaryScaled: bigint): bigint {
  if (rateToPrimaryScaled <= 0n) throw new Error("rate must be > 0");
  return (RATE_SCALE_E8 * RATE_SCALE_E8) / rateToPrimaryScaled;
}
```

No `Number` / `parseFloat`. Reject `<= 0n` after invert (Pitfall 3).

---

### `src/lib/money.test.ts` (test, transform)

**Analog:** same file (lines 17–47)

Extend with invert round-trip / truncation / reject ≤0; keep existing `RATE_SCALE_E8` and schema BigInt locks (`rateToPrimaryScaled BigInt` still required after rename).

---

### `src/lib/validations/fx.ts` (utility, request-response)

**Analog:** `src/lib/validations/balance.ts`

**Full pattern** (lines 1–24):

```typescript
import { z } from "zod";

const asOfDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Укажите дату");

export const setBalanceSchema = z
  .object({
    accountId: z.coerce.number().int().positive(),
    amountMajor: z.string().trim().min(1, "Введите корректную сумму"),
    asOfDate: asOfDateSchema,
  })
  .strict();

export const deleteBalanceSchema = z
  .object({
    id: z.coerce.number().int().positive(),
  })
  .strict();
```

**FX mirror:** `setFxRateSchema` with `currencyCode`, `rateMajor` (Russian min message e.g. `"Введите курс"`), `asOfDate`, `direction: z.enum(["toPrimary", "fromPrimary"]).default("toPrimary")`; `deleteFxRateSchema` by `id`. Keep `.strict()`. Future-date and `> 0` stay in Server Action (same split as balance comment).

---

### `src/lib/validations/fx.test.ts` (test, request-response)

**Analog:** `src/lib/validations/balance.test.ts`

Mirror accept/reject cases for Russian messages (`"Укажите дату"`, empty rateMajor), coerce id, reject non-positive id. Add direction enum accept/default.

---

### `src/app/currencies/actions.ts` — FX mutations (controller, CRUD)

**Analog:** `src/app/accounts/actions.ts`

**Action state type** (lines 28–36):

```typescript
export type BalanceActionState = {
  errors?: {
    accountId?: string[];
    amountMajor?: string[];
    asOfDate?: string[];
  };
  message?: string;
  success?: boolean;
};
```

**Upsert: Zod → future gate → parse → domain checks → compound upsert → revalidate** (lines 182–263):

```typescript
export async function upsertBalanceSnapshot(
  _prev: BalanceActionState,
  formData: FormData,
): Promise<BalanceActionState> {
  const validated = setBalanceSchema.safeParse({ /* FormData */ });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const today = calendarDateToday();
  if (asOfDate > today) {
    return { errors: { asOfDate: ["Дата не может быть в будущем"] } };
  }

  // load entity, parseMajorToMinor, domain bounds...

  await prisma.balanceSnapshot.upsert({
    where: { accountId_asOfDate: { accountId, asOfDate } },
    update: { amountMinor },
    create: { accountId, asOfDate, amountMinor },
  });

  revalidatePath("/accounts");
  return { success: true, message: "Сохранено" };
}
```

**Delete from history only** (lines 266–292):

```typescript
export async function deleteBalanceSnapshot(
  formData: FormData,
): Promise<BalanceActionState> {
  const validated = deleteBalanceSchema.safeParse({ id: formData.get("id") });
  // ...
  await prisma.balanceSnapshot.delete({ where: { id: validated.data.id } });
  revalidatePath("/accounts");
  return { success: true, message: "Удалено" };
}
```

**FX adaptations:**
- Add `upsertFxRate` / `deleteFxRate` in this file (keep existing currency CRUD).
- `where: { currencyCode_asOfDate: { currencyCode, asOfDate } }`.
- Reject if `currency.isPrimary` (D-16); rate `> 0n` → `"Курс должен быть больше 0"`.
- Direction: if `fromPrimary`, `invertRateScaled` before persist; always write `rateToPrimaryScaled`.
- `revalidatePath("/currencies")` **and** `revalidatePath("/currencies/rates")` (existing currency actions already revalidate currencies+accounts at lines 66–67).

**Existing currency action shell** (lines 1–9, 66–68) — extend same module:

```typescript
"use server";
import { revalidatePath } from "next/cache";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
```

---

### `src/app/currencies/actions.test.ts` (test, CRUD)

**Analog:** same file (vi.mock `next/cache` + `@/lib/db`) plus upsert/delete patterns from balances tests.

Extend prisma mock with `fxRate.upsert` / `fxRate.delete` / `currency.findUnique`. Assert: future date rejected; primary code rejected; invert stores `rateToPrimaryScaled`; both revalidate paths called.

---

### `src/app/currencies/layout.tsx` (route, request-response)

**Analog:** `src/components/nav.tsx` (no nested App Router layout exists under `src/app/` except root)

**Link + active underline chrome** (lines 7–44):

```typescript
const links = [
  { href: "/", label: "Готовность" },
  { href: "/currencies", label: "Валюты" },
  { href: "/accounts", label: "Счета" },
] as const;

const active =
  href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
```

**Copy for tabs:** Client or server Link row «Валюты» → `/currencies`, «Курсы» → `/currencies/rates`; exact-path active (not prefix) so both tabs do not highlight together. Wrap `{children}`. Prefer Link chrome over shadcn Tabs (RESEARCH A6).

**Root wrap reference** (`src/app/layout.tsx` lines 21–31): layout receives `children` and renders chrome above them — same nesting contract.

---

### `src/app/currencies/rates/page.tsx` (route, CRUD)

**Analog:** `src/app/accounts/page.tsx`

**Batch LOCF + history + BigInt serialize** (lines 6–91):

```typescript
export const dynamic = "force-dynamic";

const today = calendarDateToday();
const [/* entities */, snapshotsLteToday, allSnapshots] = await Promise.all([
  prisma.balanceSnapshot.findMany({
    where: { asOfDate: { lte: today } },
    orderBy: { asOfDate: "desc" },
    select: { accountId: true, asOfDate: true, amountMinor: true },
  }),
  prisma.balanceSnapshot.findMany({
    orderBy: [{ asOfDate: "desc" }, { id: "desc" }],
    select: { id: true, accountId: true, asOfDate: true, amountMinor: true },
  }),
]);

// first-seen wins for LOCF map; history grouped newest-first
// serialize BigInt → string for client props
```

**FX page:** `prisma.currency.findMany({ where: { isPrimary: false } })`; rates `findMany` keyed by `currencyCode`; pass `today` + serialized `rateToPrimaryScaled` strings into `RateList`. Page shell: `main` / `max-w-3xl` / header from currencies list page.

---

### `src/app/currencies/page.tsx` (route, CRUD)

**Analog:** itself (lines 1–24)

Keep currency list RSC. Layout supplies tabs; avoid duplicating tab chrome here. Optional: slim header if layout owns area title — planner discretion; do not change CRUD behavior.

---

### `src/components/currencies/RateList.tsx` (component, CRUD)

**Analog:** `src/components/accounts/AccountList.tsx`

**Types + expand/history/delete** (lines 18–36, 144–289):

```typescript
export type AccountListItem = {
  // ...
  locf: { asOfDate: string; amountMinor: string } | null;
  snapshots: BalanceSnapshotHistoryItem[];
};

// Chevron expand, window.confirm delete, useTransition + FormData id,
// delete only in history panel (bg-muted/40), empty-state CTA
```

**Empty LOCF CTA** (lines 244–263): when `locf == null`, emphasize first-set Dialog; else secondary outline button.

**FX adaptations:**
- One row per non-primary currency (not per account).
- Empty rate copy: «Нет курса» + set-rate action (D-14).
- Display `formatRateScaled(BigInt(...))` + `formatAsOfDisplay`.
- Call `deleteFxRate` instead of `deleteBalanceSnapshot`.
- History newest-first (already from page query).

---

### `src/components/currencies/SetRateDialog.tsx` (component, request-response)

**Analog primary:** `src/components/accounts/SetBalanceDialog.tsx`

**Dialog shell: useActionState, remount on open, DD.MM.YYYY + hidden ISO** (lines 45–62, 93–94, 119–141, 177–197):

```typescript
const [state, formAction, isPending] = useActionState(
  upsertBalanceSnapshot,
  initialState,
);
const [asOfDisplay, setAsOfDisplay] = useState(() => formatAsOfDisplay(today));
const asOfIso = parseAsOfDisplay(asOfDisplay) ?? "";

<input type="hidden" name="asOfDate" value={asOfIso} />
// display Input controlled; formatAsOfDisplay / parseAsOfDisplay from @/lib/dates

<Dialog open={open} onOpenChange={(next) => {
  setOpen(next);
  if (next) setFormKey((k) => k + 1);
}}>
  {open ? <SetBalanceFormBody key={formKey} ... /> : null}
</Dialog>
```

**Currency Select analog:** `src/components/accounts/AccountFormDialog.tsx` lines 204–230:

```tsx
<input type="hidden" name="currencyCode" value={currencyCode} />
<Select value={currencyCode} onValueChange={...}>
  <SelectContent>
    {currencies.map((c) => (
      <SelectItem key={c.code} value={c.code}>
        <span className="font-mono">{c.code}</span>
        <span className="text-muted-foreground"> — {c.name}</span>
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**FX-only fields:** direction toggle default `toPrimary` (D-06); hidden `direction` input; `rateMajor` with `inputMode="decimal"`; no delete UI in Dialog (D-13).

---

### `src/components/nav.tsx` (component, request-response)

**Analog:** itself

Change `href: "/currencies"` → `href: "/currencies/rates"` (D-03). Adjust active matcher so `/currencies` and `/currencies/rates` both highlight «Валюты» (prefix `/currencies`), while home stays exact. Do **not** add a fourth top-level link (D-01).

---

### `src/lib/foundation.test.ts` (test, transform)

**Analog:** same file lines 117–128

Replace allow-list `"FxRateStub"` → `"FxRate"` in SQL `IN (...)` and expected sorted names array.

## Shared Patterns

### LOCF read (null before first)

**Source:** `src/lib/balances.ts` lines 7–13  
**Apply to:** `src/lib/fx.ts`, rates page batch map, Phase 5–6 callers

```typescript
return prisma.balanceSnapshot.findFirst({
  where: { accountId, asOfDate: { lte: asOfDate } },
  orderBy: { asOfDate: "desc" },
});
```

Never invent `0` / `1` for missing non-primary FX (D-15).

### Compound upsert + revalidatePath

**Source:** `src/app/accounts/actions.ts` lines 251–263  
**Apply to:** `upsertFxRate`

```typescript
await prisma.balanceSnapshot.upsert({
  where: { accountId_asOfDate: { accountId, asOfDate } },
  update: { amountMinor },
  create: { accountId, asOfDate, amountMinor },
});
revalidatePath("/accounts");
```

FX: `currencyCode_asOfDate`; revalidate `/currencies` and `/currencies/rates`.

### Future-date gate (Europe/Moscow today)

**Source:** `src/app/accounts/actions.ts` lines 197–201 + `calendarDateToday`  
**Apply to:** `upsertFxRate`

```typescript
const today = calendarDateToday();
if (asOfDate > today) {
  return { errors: { asOfDate: ["Дата не может быть в будущем"] } };
}
```

### BigInt RSC → client serialization

**Source:** `src/app/accounts/page.tsx` lines 68–90  
**Apply to:** `rates/page.tsx` props into `RateList` / Dialog

Serialize `rateToPrimaryScaled` (and any money fields) with `.toString()`; client reconstructs via `BigInt(...)`.

### Expand-history delete UX

**Source:** `src/components/accounts/AccountList.tsx` lines 165–189, 272–287  
**Apply to:** `RateList.tsx`

`window.confirm` → `useTransition` → FormData `id` → Server Action; delete controls only in expanded history; collapse when last row removed.

### Dialog form remount + DD.MM.YYYY

**Source:** `SetBalanceDialog.tsx` + `src/lib/dates.ts`  
**Apply to:** `SetRateDialog.tsx`

`formKey` bump on open; `formatAsOfDisplay` / `parseAsOfDisplay`; hidden ISO `asOfDate`.

### Zod Server Actions + Russian fieldErrors

**Source:** balance/currency actions  
**Apply to:** all FX mutations

`safeParse` → `validated.error.flatten().fieldErrors`; catch-all `message` in Russian; `"use server"` module.

### Fixed-scale money (no float)

**Source:** `src/lib/money.ts`  
**Apply to:** rate parse/format/invert and convert helper

Scale 8 via `parseMajorToMinor(..., 8)` / `RATE_SCALE_E8`; integer invert `(RATE_SCALE_E8 ** 2) / scaled`.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/app/currencies/layout.tsx` (tabs segment) | route | request-response | No nested segment layout with exclusive Link tabs yet — closest chrome is `nav.tsx` active Links; Next layout contract from `app/layout.tsx` only |

Direction toggle UI control: no existing two-way unit toggle in repo — compose from `Button` / radio-style pair in Dialog; storage still mirrors balance upsert (single scaled column).

## Metadata

**Analog search scope:** `src/lib/`, `src/app/accounts/`, `src/app/currencies/`, `src/components/accounts/`, `src/components/currencies/`, `src/components/nav.tsx`, `prisma/schema.prisma`, `prisma/migrations/`, vitest siblings  
**Files scanned:** ~25 tracked source files (graphify disabled — Grep/Read)  
**Tracked-source gate:** all named analogs verified via `git ls-files`  
**Pattern extraction date:** 2026-09-03
