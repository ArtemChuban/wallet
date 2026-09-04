# Phase 9: People + debts CRUD + nav - Pattern Map

**Mapped:** 2026-09-04
**Files analyzed:** 10
**Analogs found:** 9 / 10

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/app/debts/page.tsx` | route | request-response | `src/app/accounts/page.tsx` | exact |
| `src/app/debts/actions.ts` | service | CRUD | `src/app/accounts/actions.ts` | exact |
| `src/app/debts/actions.test.ts` | test | CRUD | `src/app/accounts/actions.test.ts` | exact |
| `src/components/debts/DebtsList.tsx` | component | request-response | `src/components/accounts/AccountList.tsx` | role-match |
| `src/components/debts/PersonFormDialog.tsx` | component | request-response | `src/components/accounts/AccountFormDialog.tsx` | exact |
| `src/components/debts/DebtFormDialog.tsx` | component | request-response | `src/components/accounts/AccountFormDialog.tsx` | role-match |
| `src/components/debts/DestructiveConfirmStep.tsx` | component | request-response | — | none |
| `src/components/nav.tsx` | component | request-response | `src/components/nav.tsx` (self) | exact |
| `src/components/accounts/AccountList.tsx` | component | request-response | self + Dialog second-step (new) | role-match |
| `src/lib/validations/debts.ts` | utility | transform | self (reuse schemas) | exact |

Notes:
- `.planning/PROJECT.md` destructive-confirm constitution already present — no further pattern work.
- `DestructiveConfirmStep` optional (CONTEXT discretion); three call sites may inline Dialog state machine instead.
- Compound create-person+debt may add thin Zod in `validations/debts.ts` or branch in `actions.ts` (RESEARCH Open Q2).

## Pattern Assignments

### `src/app/debts/page.tsx` (route, request-response)

**Analog:** `src/app/accounts/page.tsx`

**Imports / RSC load pattern** (lines 1–7, 9–20):
```typescript
import { AccountFormDialog } from "@/components/accounts/AccountFormDialog";
import { AccountList } from "@/components/accounts/AccountList";
import { ensureSqlitePragmas, prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  await ensureSqlitePragmas();
  const [accountsRaw, currencies, ...] = await Promise.all([
    prisma.account.findMany({
      include: { currency: true },
      orderBy: { name: "asc" },
    }),
    // ...
  ]);
```

**BigInt serialize for client** (lines 61–84):
```typescript
  // Serialize BigInt for client Dialog props (RSC boundary).
  const accounts = accountsRaw.map((a) => {
    return {
      id: a.id,
      creditLimitMinor:
        a.creditLimitMinor == null ? null : a.creditLimitMinor.toString(),
      // ...
    };
  });
```

**Header CTA + list layout** (lines 86–98):
```typescript
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 font-sans">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Счета
        </h1>
        {accounts.length > 0 ? (
          <AccountFormDialog mode="create" currencies={currencies} />
        ) : null}
      </header>
      <AccountList accounts={accounts} currencies={currencies} today={today} />
    </main>
```

**Debts adaptations:**
- `prisma.person.findMany({ include: { debts: { include: { currency, repayments, sizeChanges }, orderBy: { id: "desc" } } }, orderBy: { name: "asc" } })` (D-04).
- Per debt: `remainingMinor(initial, sizeDeltas, repaymentAmounts).toString()` before props (D-02).
- Header CTAs when people exist: both «Новый человек» and «Новый долг» (D-22).
- `revalidatePath` target is `/debts` only from actions — page itself has no NW imports (DISOL-01).

---

### `src/app/debts/actions.ts` (service, CRUD)

**Analog:** `src/app/accounts/actions.ts`

**Imports + action state shape** (lines 1–26):
```typescript
"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
import { parseMajorToMinor } from "@/lib/money";
// debts: import schemas from "@/lib/validations/debts"

export type AccountActionState = {
  errors?: { name?: string[]; /* field keys */ };
  message?: string;
  success?: boolean;
};
```

**Zod safeParse + fieldErrors** (lines 52–71):
```typescript
  const validated = createAccountSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    currencyCode: formData.get("currencyCode"),
    creditLimitMajor,
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }
```

**ensureSqlitePragmas + Prisma create + P2002 map** (lines 75–134):
```typescript
  try {
    await ensureSqlitePragmas();
    // lookup + parseMajorToMinor with currency.scale ...
    await prisma.account.create({ data: { /* ... */ } });
  } catch (error) {
    if (isUniqueNameViolation(error)) {
      return { errors: { name: ["Счёт с таким названием уже есть"] } };
    }
    return {
      message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
    };
  }

  revalidatePath("/accounts");
  return { success: true, message: "Сохранено" };
```

**Meta-only update (ignore smuggled fields)** (lines 137–180) — mirror for `updateDebtMeta`:
```typescript
/** Update account name only — ignore tampered type/currency/limit (D-15, T-02-01). */
export async function updateAccountName(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const validated = updateAccountNameSchema.safeParse({
    name: formData.get("name"),
  });
  // ...
  await prisma.account.update({
    where: { id },
    data: { name: validated.data.name },
  });
```

**Delete action (FormData, no useActionState prev)** (lines 269–297) — mirror for `deleteDebt` / `deletePerson`:
```typescript
export async function deleteBalanceSnapshot(
  formData: FormData,
): Promise<BalanceActionState> {
  const validated = deleteBalanceSchema.safeParse({
    id: formData.get("id"),
  });
  // ensureSqlitePragmas → prisma.*.delete → revalidatePath
  return { success: true, message: "Удалено" };
}
```

**Debts-specific patterns (no accounts analog — copy from RESEARCH + schema):**
- Reuse `createPersonSchema`, `renamePersonSchema`, `createDebtSchema`, `updateDebtMetaSchema` from `src/lib/validations/debts.ts`.
- Person unique name → Prisma `P2002` like accounts (`Person.name @unique`).
- `deletePerson`: `prisma.debt.count({ where: { personId } })`; if `> 0` return RU blocked message (PERSON-02); else delete. Catch `P2003` as belt.
- D-06 compound path: nested `prisma.person.create({ data: { name, debts: { create: { ... } } } })` or `$transaction`; do not use bare `createDebtSchema` alone when `personId` absent.
- Create debt: parse initial via `parseMajorToMinor` + currency scale (same as `createAccount` credit / `upsertBalanceSnapshot` amount).
- Status on create: default `OPEN` (schema); do not expose status in UI.
- `revalidatePath("/debts")` only — never touch `/` NW surface.

---

### `src/app/debts/actions.test.ts` (test, CRUD)

**Analog:** `src/app/accounts/actions.test.ts`

**Mock + import-after-mock** (lines 1–46):
```typescript
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    account: { create: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
    // debts: person, debt, currency stubs
  },
  ensureSqlitePragmas: vi.fn(),
}));

import { revalidatePath } from "next/cache";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
import { createAccount, /* ... */ } from "./actions";
```

**Immutability / smuggle test** (lines 70–98) — mirror for `updateDebtMeta` ignoring initial/person/currency:
```typescript
  it("writes only name — ignores tampered type/currency/limit FormData", async () => {
    const formData = new FormData();
    formData.set("id", "7");
    formData.set("name", "Новое имя");
    formData.set("type", "CRYPTO");
    // ...
    const result = await updateAccountName({}, formData);
    expect(prisma.account.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { name: "Новое имя" },
    });
  });
```

**Delete success + Russian error** (lines 283–315):
```typescript
  it("deletes by validated id and revalidates", async () => {
    const result = await deleteBalanceSnapshot(formData);
    expect(result.success).toBe(true);
    expect(revalidatePath).toHaveBeenCalledWith("/accounts");
  });
```

**Debts coverage targets (RESEARCH Wave 0):** createPerson / renamePerson; deletePerson blocked when debts>0 and success when 0; createDebt amount parse; updateDebtMeta smuggle; deleteDebt cascade call (`prisma.debt.delete`).

---

### `src/components/debts/DebtsList.tsx` (component, request-response)

**Analog:** `src/components/accounts/AccountList.tsx`

**Empty state family** (lines 293–304) — copy layout for «Нет людей» (D-20):
```typescript
  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 py-8">
        <div className="grid gap-2">
          <h2 className="text-base font-semibold text-foreground">Нет счетов</h2>
          <p className="max-w-prose text-base text-muted-foreground">
            Создайте первый счёт, чтобы учитывать активы и кредиты.
          </p>
        </div>
        <AccountFormDialog mode="create" currencies={currencies} />
      </div>
    );
  }
```

**Money display from serialized string** (lines 45–51):
```typescript
  const amount = formatMinorToMajor(
    BigInt(account.locf.amountMinor),
    account.currency.scale,
  );
```

**Delete via useTransition + FormData** (lines 157–181) — keep mutation plumbing; **replace** `window.confirm` (anti-pattern D-16/D-17):
```typescript
  function handleDelete(snap: BalanceSnapshotHistoryItem) {
    const confirmed = window.confirm(
      `Удалить снимок за ${dateLabel}? Это нельзя отменить.`,
    );
    if (!confirmed) return;

    setPendingId(snap.id);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", String(snap.id));
      const result = await deleteBalanceSnapshot(formData);
      // ...
    });
  }
```

**Debts adaptations:**
- Group by person (already loaded A–Z); nested debt rows compact: direction label + remaining + currency (D-01/D-02).
- Empty group: «Нет долгов» + «Новый долг» CTA (D-21).
- Person header: rename dialog + delete (blocked message or confirm step) (D-07/D-08).
- Pre-select person when opening create-debt from group (D-12).
- Direction labels: `I_OWE` → «Я должен», `THEY_OWE` → «Мне должны» (D-11).

---

### `src/components/debts/PersonFormDialog.tsx` (component, request-response)

**Analog:** `src/components/accounts/AccountFormDialog.tsx` (create/edit + formKey remount)

**Imports** (lines 1–33):
```typescript
"use client";

import {
  useActionState,
  useEffect,
  useState,
  type ReactElement,
} from "react";
import {
  createAccount,
  updateAccountName,
  type AccountActionState,
} from "@/app/accounts/actions";
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

**useActionState + success close** (lines 104–111):
```typescript
  const action = mode === "create" ? createAccount : updateAccountName;
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state?.success) {
      onSuccess();
    }
  }, [state, onSuccess]);
```

**Edit locked fields as read-only text** (lines 192–195, 232–235) — pattern for Person rename (name editable only):
```typescript
          <p className="text-sm text-muted-foreground">
            {account ? TYPE_LABELS[account.type] : null}
          </p>
```

**Dialog open + formKey remount** (lines 296–331):
```typescript
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

**Secondary analog:** `CurrencyFormDialog` edit title «Изменить название» (lines 73–84) for rename microcopy.

Wire to `createPerson` / `renamePerson` actions; hidden `personId` on edit like account `id` (AccountFormDialog line 136–138).

---

### `src/components/debts/DebtFormDialog.tsx` (component, request-response)

**Analog:** `src/components/accounts/AccountFormDialog.tsx`

Same Dialog / `useActionState` / `formKey` / field-error chrome as PersonFormDialog.

**Create vs edit locked fields** — copy edit read-only blocks (AccountFormDialog lines 192–235, 271–276):
- Create: direction Select, currency Select, initial amount Input, optional due/note, person Select **or** new-person name field (D-06/D-12).
- Edit: person, currency, initial as **read-only** text (D-09/D-10); editable direction / due / note only → `updateDebtMeta`.
- Delete control **inside edit dialog only** (D-14): destructive button → second confirm step (D-15 cascade copy) → `deleteDebt`.

**Select + hidden input pattern** for controlled enums (lines 161–190):
```typescript
            <input type="hidden" name="type" value={accountType} />
            <Select
              value={accountType}
              onValueChange={(value) => {
                if (value != null) setAccountType(String(value));
              }}
              disabled={isPending}
            >
```

---

### `src/components/debts/DestructiveConfirmStep.tsx` (component, request-response)

**Analog:** none in repo (only `window.confirm` anti-pattern today).

**Closest mutation plumbing:** `AccountList` delete handler (lines 157–181) — `useTransition` + `FormData` + action call + RU error display.

**Implement as:** Dialog-local `confirmingDelete: boolean`; first «Удалить» → second step with RU copy («точно удалить?» + what is lost); confirm calls delete action. Reuse existing `Dialog` / `Button variant="destructive"` — do **not** add AlertDialog (RESEARCH / UI-SPEC).

Apply same UX to: person delete, debt delete, balance-snapshot delete (D-16/D-17).

---

### `src/components/nav.tsx` (component, request-response)

**Analog:** self — modify links array and keep active-prefix logic.

**Current links** (lines 7–11) — reorder per D-18:
```typescript
const links = [
  { href: "/", label: "Главная" },
  { href: "/currencies/rates", label: "Валюты" },
  { href: "/accounts", label: "Счета" },
] as const;
```

**Target:**
```typescript
const links = [
  { href: "/", label: "Главная" },
  { href: "/accounts", label: "Счета" },
  { href: "/debts", label: "Долги" },
  { href: "/currencies/rates", label: "Валюты" },
] as const;
```

**Active prefix** (lines 23–29) — `/debts` uses same branch as `/accounts` (D-19):
```typescript
          const active =
            href === "/"
              ? pathname === "/"
              : href === "/currencies/rates"
                ? pathname === "/currencies" ||
                  pathname.startsWith("/currencies/")
                : pathname === href || pathname.startsWith(`${href}/`);
```

---

### `src/components/accounts/AccountList.tsx` (component, request-response) — D-17 migrate

**Analog:** self — replace `window.confirm` block (lines 157–162) with in-dialog / inline second-step confirm; keep `deleteBalanceSnapshot` FormData call (lines 164–181).

**Anti-pattern to remove:**
```typescript
    const confirmed = window.confirm(
      `Удалить снимок за ${dateLabel}? Это нельзя отменить.`,
    );
```

**Keep:** pendingId, startTransition, FormData `id`, error `role="alert"`, destructive Button (lines 121–131).

Optional: extract shared `DestructiveConfirmStep` if person/debt/snapshot share one PR wave.

**Out of scope:** `RateList.tsx` also has `window.confirm` — leave per RESEARCH Pitfall 5 / D-17.

---

### `src/lib/validations/debts.ts` (utility, transform)

**Analog:** self — reuse existing exports; optional thin compound schema.

**Ready schemas** (lines 44–93):
```typescript
export const createPersonSchema = z.object({ name: personNameSchema }).strict();
export const renamePersonSchema = z
  .object({ personId: z.coerce.number().int().positive(), name: personNameSchema })
  .strict();
export const createDebtSchema = z.object({
  personId: z.coerce.number().int().positive(),
  direction: debtDirectionSchema,
  currencyCode: currencyCodeSchema,
  initialAmountMajor: z.string().trim().min(1, "Введите корректную сумму"),
  dueDate: optionalDueDateSchema,
  note: optionalNoteSchema,
}).strict() /* + superRefine positive major */;
export const updateDebtMetaSchema = z.object({
  debtId: z.coerce.number().int().positive(),
  direction: debtDirectionSchema.optional(),
  dueDate: optionalDueDateSchema,
  note: optionalNoteSchema,
}).strict();
```

**Do not** hand-roll money parsing — actions call `parseMajorToMinor` after Zod shape pass (accounts pattern).

Repayment / size-change schemas exist but are **Phase 10** — do not wire UI.

## Shared Patterns

### Server Action contract
**Source:** `src/app/accounts/actions.ts`
**Apply to:** `src/app/debts/actions.ts`
- `"use server"`; Zod `safeParse` → `{ errors }` or try/catch → `{ message }` / `{ success }`.
- Always `await ensureSqlitePragmas()` before Prisma writes (FK Restrict needs `foreign_keys=ON`).
- `revalidatePath` after success.

### Dialog form chrome
**Source:** `src/components/accounts/AccountFormDialog.tsx` lines 296–328
**Apply to:** PersonFormDialog, DebtFormDialog
- Controlled `open` + `formKey` remount on open; `useActionState`; close on `state.success`.
- Field errors: `aria-invalid` + `<p className="text-sm text-destructive" role="alert">`.

### Empty states
**Source:** `src/components/accounts/AccountList.tsx` lines 293–304
**Apply to:** DebtsList root empty («Нет людей») and per-group empty («Нет долгов»).

### Remaining display
**Source:** `src/lib/debts.ts` lines 21–28
**Apply to:** `page.tsx` RSC load only
```typescript
export function remainingMinor(
  initialAmountMinor: bigint,
  sizeDeltas: readonly bigint[],
  repaymentAmounts: readonly bigint[],
): bigint {
  const principal = currentPrincipalMinor(initialAmountMinor, sizeDeltas);
  const paid = repaymentAmounts.reduce((sum, a) => sum + a, 0n);
  return principal - paid;
}
```
Serialize `.toString()` for client; format with `formatMinorToMajor` + currency scale.

### Destructive confirm constitution
**Source:** `.planning/PROJECT.md` (already locked); anti-pattern `AccountList` lines 157–162
**Apply to:** person delete, debt delete, snapshot delete
- Never `window.confirm`.
- In-dialog second step with Russian loss copy (cascade mention for debt delete).

### Nav active + order
**Source:** `src/components/nav.tsx` lines 7–29
**Apply to:** same file — insert «Долги»; order Главная · Счета · Долги · Валюты.

### DISOL-01 isolation
**Source:** Phase 8 `src/lib/debts.test.ts` (import gates)
**Apply to:** all Phase 9 files — do not import `@/lib/debts` into `net-worth.ts`, `historical-series.ts`, or `/` page.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/components/debts/DestructiveConfirmStep.tsx` | component | request-response | No in-dialog confirm step exists yet; only `window.confirm` (anti-pattern). Invent from Dialog + AccountList mutation plumbing. |

## Metadata

**Analog search scope:** `src/app/accounts/`, `src/components/accounts/`, `src/components/currencies/`, `src/components/nav.tsx`, `src/lib/validations/debts.ts`, `src/lib/debts.ts`, `prisma/schema.prisma`; codegraph queries for AccountFormDialog / deleteBalanceSnapshot / revalidatePath
**Files scanned:** ~15 tracked source files (analogs + schema + validations)
**Tracked-source gate:** all named analogs verified via `git ls-files`
**Pattern extraction date:** 2026-09-04
