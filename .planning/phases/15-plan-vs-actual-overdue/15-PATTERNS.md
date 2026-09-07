# Phase 15: Plan vs actual + overdue - Pattern Map

**Mapped:** 2026-09-07
**Files analyzed:** 11
**Analogs found:** 11 / 11

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/income/IncomeFactDialog.tsx` | component | request-response | `src/components/income/IncomeFormDialog.tsx` | exact (shell) + `DebtDetailDialog` repay form (fields) |
| `src/components/income/IncomeList.tsx` | component | request-response | `src/components/income/IncomeList.tsx` (self-extend) | exact |
| `src/app/income/page.tsx` | route | CRUD (RSC join) | `src/app/income/page.tsx` (self-extend) | exact |
| `src/app/income/actions.ts` | controller | CRUD | `src/app/accounts/actions.ts` (`upsertBalanceSnapshot`) + `src/app/debts/actions.ts` (`createRepayment` / `deleteRepayment`) | exact (upsert) / role-match (event CRUD) |
| `src/lib/validations/income.ts` | utility | transform | `src/lib/validations/debts.ts` (`createRepaymentSchema` / `deleteRepaymentSchema`) | exact |
| `src/lib/income.ts` | utility | transform | `src/lib/income.ts` (`isIncomeOverdue`) | exact |
| `src/app/globals.css` | config | — | `src/app/globals.css` (`--destructive` + `@theme`) | exact |
| `src/app/income/actions.test.ts` | test | — | `src/app/income/actions.test.ts` (isolation + action mocks) | exact |
| `src/components/income/income-ui.test.ts` | test | — | `src/components/income/income-ui.test.ts` (file-scan) | exact |
| `src/lib/income.test.ts` | test | — | `src/lib/income.test.ts` (`isIncomeOverdue` describe) | exact |
| `src/lib/validations/income.test.ts` | test | — | `src/lib/validations/income.test.ts` (positive major rejects) | exact |

**Not modified (coexist only):** `src/components/income/IncomeFormDialog.tsx` — definition edit stays separate (D-01 / D-20).

## Pattern Assignments

### `src/components/income/IncomeFactDialog.tsx` (component, request-response) — NEW

**Analog (dialog shell + delete step):** `src/components/income/IncomeFormDialog.tsx`  
**Analog (amount/date/note form fields):** `src/components/debts/DebtDetailDialog.tsx` repay tab  
**Anti-pattern:** Do **not** copy `createRepayment` future-date ban (`asOfDate > today`) — D-19 allows future `actualAsOf`.

**Imports pattern** (IncomeFormDialog lines 1–42):
```typescript
"use client";

import {
  useActionState,
  useEffect,
  useState,
  useTransition,
  type ReactElement,
} from "react";
import { useRouter } from "next/navigation";
import { DestructiveConfirmStep } from "@/components/ui/destructive-confirm-step";
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
import { calendarDateToday } from "@/lib/dates";
import { formatMinorToMajor } from "@/lib/money";
```

**Dialog shell + remount on open** (IncomeFormDialog lines 601–629):
```typescript
<Dialog
  open={open}
  onOpenChange={(next) => {
    setOpen(next);
    if (next) setFormKey((k) => k + 1);
  }}
>
  <DialogTrigger render={trigger ?? defaultTrigger} />
  <DialogContent className="overflow-hidden sm:max-w-md">
    {open ? (
      <IncomeFormBody
        key={formKey}
        /* … */
        onSuccess={() => {
          router.refresh();
```

**Confirm-delete step** (IncomeFormDialog lines 237–251) — copy for delete actual; swap copy to UI-SPEC delete-fact message:
```typescript
if (step === "confirm-delete") {
  return (
    <div className="grid gap-4">
      <DialogHeader>
        <DialogTitle>Удалить доход</DialogTitle>
      </DialogHeader>
      <DestructiveConfirmStep
        message={INCOME_DELETE_CONFIRM}
        confirmLabel="Удалить доход"
        pending={isDeleting}
        onConfirm={handleConfirmDelete}
        onBack={() => setStep("form")}
      />
    </div>
  );
}
```

**Form field pattern** (DebtDetailDialog lines 338–399) — amount + date + note + field errors; rename to `actualAmountMajor` / `actualAsOf`; default date via `calendarDateToday("Europe/Moscow")` (D-03), not plan date:
```typescript
<form action={repayAction} className="grid gap-4">
  <input type="hidden" name="debtId" value={debt.id} />
  <div className="grid gap-2">
    <Label htmlFor={`repay-amount-${debt.id}`}>Сумма</Label>
    <Input
      name="amountMajor"
      type="text"
      inputMode="decimal"
      required
      disabled={repayPending}
      aria-invalid={Boolean(repayState.errors?.amountMajor)}
    />
    {repayState.errors?.amountMajor ? (
      <p className="text-sm text-destructive" role="alert">
        {repayState.errors.amountMajor[0]}
      </p>
    ) : null}
  </div>
  {/* asOfDate type="date" + note — same stack */}
</form>
```

**useActionState + success close** (IncomeFormDialog lines 200–207):
```typescript
const [state, formAction, isPending] = useActionState(action, initialState);

useEffect(() => {
  if (state?.success) {
    onSuccess();
  }
}, [state, onSuccess]);
```

**Fact-specific (no analog file):** RO plan date/amount + live Δ (`incomeVarianceMinor` / RU phrases from UI-SPEC). Defaults: amount = plan major; `actualAsOf` = Moscow today.

---

### `src/components/income/IncomeList.tsx` (component, request-response)

**Analog:** same file — extend `IncomeCompactRow` (lines 44–75).

**Core row pattern** (lines 44–75) — keep definition `IncomeFormDialog` «Изменить»; add fact CTA + badge + variance beside it:
```typescript
function IncomeCompactRow({ income }: { income: IncomeRow }) {
  const amount = formatMinorToMajor(
    BigInt(income.plannedAmountMinor),
    income.currency.scale,
  );
  return (
    <li>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
        <div className="flex min-w-0 flex-wrap items-baseline gap-2">
          <span className="text-sm text-muted-foreground">
            {KIND_LABELS[income.kind]}
          </span>
          <span className="font-mono text-base text-foreground">{amount}</span>
          {/* + overdue chip / «получено» / plan+actual+Δ when props say so */}
        </div>
        <IncomeFormDialog mode="edit" income={income} trigger={…} />
        {/* + IncomeFactDialog trigger: Заполни | Внести факт | Изменить факт */}
      </div>
    </li>
  );
}
```

**Warning chip** (from UI-SPEC / RESEARCH — no Badge component):
```tsx
<span className="rounded-md bg-warning/15 px-2 py-1 text-sm font-semibold text-warning-foreground">
  заполни
</span>
```

**Overdue gate** (RESEARCH / `isIncomeOverdue` — inject `today` from page props; never invent in JSX):
```typescript
const overdue = isIncomeOverdue(row.nextPlannedAsOf, row.hasActual, today);
// overdue → badge + primary «Заполни»
// !overdue && !hasActual → outline «Внести факт»
// hasActual (one-time) → «получено» + Δ + «Изменить факт»
```

**Extend `IncomeRow`** in `IncomeFormDialog.tsx` type export (or shared props): `hasActual`, `actualAmountMinor?`, `actualId?`, `actualAsOf?`, `overdue?` / compute overdue in list from `today` prop.

---

### `src/app/income/page.tsx` (route, CRUD join)

**Analog:** same file (lines 11–105).

**Today injection** (lines 11–13):
```typescript
export default async function IncomePage() {
  await ensureSqlitePragmas();
  const today = calendarDateToday("Europe/Moscow");
```

**Fix Pitfall 1 — include actual fields** (extend lines 20–34):
```typescript
// recurring: expand actuals select beyond { recurringIncomeId, plannedAsOf }
actuals: {
  select: {
    id: true,
    recurringIncomeId: true,
    plannedAsOf: true,
    amountMinor: true,
    actualAsOf: true,
    note: true,
  },
},
// oneTime: add include.actuals with same fields (join by plannedAsOf)
```

**Map props** after `nextOpenPlannedAsOf`: set `hasActual` (one-time: actual on plan key; recurring next-open usually false), `overdue = isIncomeOverdue(nextPlannedAsOf, hasActual, today)`, serialize BigInts as strings like existing `plannedAmountMinor`.

**Import add:** `isIncomeOverdue` from `@/lib/income`.

---

### `src/app/income/actions.ts` (controller, CRUD)

**Analog upsert:** `src/app/accounts/actions.ts` `upsertBalanceSnapshot` (lines 184–266)  
**Analog event CRUD shape:** `src/app/debts/actions.ts` `createRepayment` / `deleteRepayment`  
**Analog isolation:** existing income actions — `revalidatePath("/income")` only

**ActionState extension** (lines 17–31) — add fact field error keys:
```typescript
export type IncomeActionState = {
  errors?: {
    // existing…
    actualAmountMajor?: string[];
    actualAsOf?: string[];
    plannedAsOf?: string[];
    recurringIncomeId?: string[];
    oneTimeIncomeId?: string[];
  };
  message?: string;
  success?: boolean;
};
```

**Compound upsert pattern** (accounts lines 253–257) — map keys to income compounds:
```typescript
await prisma.balanceSnapshot.upsert({
  where: { accountId_asOfDate: { accountId, asOfDate } },
  update: { amountMinor },
  create: { accountId, asOfDate, amountMinor },
});
// → recurringIncomeId_plannedAsOf / oneTimeIncomeId_plannedAsOf
// update/create: amountMinor, actualAsOf, note — NEVER mutate definition plan columns
```

**Zod + parse flow** (debts createRepayment lines 454–467 + income `resolvePlannedMinor` / `fracDigitCount` in actions.ts 40–89):
```typescript
const validated = createRepaymentSchema.safeParse({…});
if (!validated.success) {
  return { errors: validated.error.flatten().fieldErrors };
}
// findUnique parent → scale → parseMajorToMinor → write
```

**Delete-by-id** (debts deleteRepayment lines 607–618):
```typescript
export async function deleteRepayment(
  formData: FormData,
): Promise<DebtActionState> {
  const validated = deleteRepaymentSchema.safeParse({
    id: formData.get("id"),
  });
  if (!validated.success) {
    return { message: "Не удалось удалить. Попробуйте снова." };
  }
```

**Prescribed names:** `upsertRecurringIncomeActual`, `upsertOneTimeIncomeActual`, `deleteRecurringIncomeActual`, `deleteOneTimeIncomeActual`.

**Do NOT copy** (debts lines 470–475):
```typescript
const today = calendarDateToday();
if (asOfDate > today) {
  return { errors: { asOfDate: ["Дата не может быть в будущем"] } };
}
```

**Isolation lock** (every success path):
```typescript
revalidatePath("/income");
// NEVER revalidatePath("/") / BalanceSnapshot
```

---

### `src/lib/validations/income.ts` (utility, transform)

**Analog:** `src/lib/validations/debts.ts` lines 123–168 + existing positive-major refine in income.ts.

**Create/upsert schema shape** (debts 123–139) — rename fields; reuse `asOfDateSchema` / `optionalNoteSchema` / `isStrictlyPositiveMajor` already in income.ts:
```typescript
export const createRepaymentSchema = z
  .object({
    debtId: z.coerce.number().int().positive(),
    amountMajor: z.string().trim().min(1, "Введите корректную сумму"),
    asOfDate: asOfDateSchema,
    note: optionalNoteSchema,
  })
  .strict()
  .superRefine((val, ctx) => {
    if (!isStrictlyPositiveMajor(val.amountMajor)) {
      ctx.addIssue({
        code: "custom",
        path: ["amountMajor"],
        message: "Введите сумму больше 0",
      });
    }
  });
```

**Prescribed income schemas:**
- `upsertRecurringIncomeActualSchema`: `recurringIncomeId`, `plannedAsOf`, `actualAmountMajor`, `actualAsOf`, `note?`
- `upsertOneTimeIncomeActualSchema`: `oneTimeIncomeId`, `plannedAsOf`, `actualAmountMajor`, `actualAsOf`, `note?`
- `deleteRecurringIncomeActualSchema` / `deleteOneTimeIncomeActualSchema`: `{ id }` like `deleteRepaymentSchema` (debts 164–168)

---

### `src/lib/income.ts` (utility, transform)

**Analog:** same file — pure helpers next to `isIncomeOverdue` (lines 75–81).

```typescript
export function isIncomeOverdue(
  plannedAsOf: string,
  hasActual: boolean,
  today: string,
): boolean {
  return plannedAsOf < today && !hasActual;
}
```

**Add (RESEARCH):**
```typescript
export function incomeVarianceMinor(
  actualAmountMinor: bigint,
  plannedAmountMinor: bigint,
): bigint {
  return actualAmountMinor - plannedAmountMinor;
}
// optional: incomeVariancePhrase(delta) → «больше плана» | «меньше плана» | «как план»
```

No Prisma imports (ISO-01).

---

### `src/app/globals.css` (config)

**Analog:** same file — mirror `--destructive` + `@theme` alias pattern (lines 6–49, 51–84).

**Add beside `--destructive` in `:root` and `.dark`:**
```css
--warning: oklch(0.75 0.15 75); /* tune per UI-SPEC ≈ #B45309 family */
--warning-foreground: oklch(0.45 0.14 55);
```

**Add in `@theme inline`:**
```css
--color-warning: var(--warning);
--color-warning-foreground: var(--warning-foreground);
```

---

### `src/app/income/actions.test.ts` (test)

**Analog:** same file — isolation scan (lines 409–415) + existing action mock style.

```typescript
describe("income actions isolation (UI-01)", () => {
  it("actions.ts never references BalanceSnapshot or net-worth/historical-series imports", () => {
    const src = readFileSync("src/app/income/actions.ts", "utf8");
    expect(src).not.toMatch(/BalanceSnapshot/);
    expect(src).not.toMatch(/@\/lib\/(?:net-worth|historical-series)/);
    expect(src).not.toMatch(/revalidatePath\("\/"\)/);
  });
});
```

Extend with upsert/delete actual mocks; keep isolation describe.

---

### `src/components/income/income-ui.test.ts` (test)

**Analog:** same file (lines 1–29) — file-scan pattern.

```typescript
const listSrc = readFileSync("src/components/income/IncomeList.tsx", "utf8");
const dialogSrc = readFileSync(
  "src/components/income/IncomeFormDialog.tsx",
  "utf8",
);
// + IncomeFactDialog.tsx
expect(listSrc).toMatch(/заполни/);
expect(listSrc).toMatch(/Внести факт|Заполни|Изменить факт/);
expect(factSrc).toMatch(/DestructiveConfirmStep/);
expect(factSrc).not.toMatch(/window\.confirm/);
expect(listSrc).not.toMatch(/text-destructive.*заполни|заполни.*destructive/); // warning not destructive
```

---

### `src/lib/income.test.ts` (test)

**Analog:** `isIncomeOverdue` describe (lines 228–249). Add `incomeVarianceMinor` / phrase branches same style.

---

### `src/lib/validations/income.test.ts` (test)

**Analog:** positive major rejects (e.g. lines 84–88 / 140–145). Add upsert schema rejects `0`/`-1`/empty `actualAmountMajor`; date regex; delete id coerce.

## Shared Patterns

### Server action contract
**Source:** `src/app/income/actions.ts`  
**Apply to:** all actual upsert/delete actions  
- `"use server"` + `IncomeActionState`  
- Zod `safeParse` → fieldErrors  
- `ensureSqlitePragmas()` before Prisma  
- `parseMajorToMinor` + currency.scale from **parent** definition  
- `revalidatePath("/income")` only  

### Destructive confirm
**Source:** `src/components/ui/destructive-confirm-step.tsx` (lines 21–51)  
**Apply to:** delete actual in `IncomeFactDialog` only  
```typescript
export function DestructiveConfirmStep({
  message,
  confirmLabel,
  backLabel = "Назад",
  pending = false,
  onConfirm,
  onBack,
}: DestructiveConfirmStepProps) { /* … */ }
```

### Money / date display
**Source:** `IncomeList` / `IncomeFormDialog`  
**Apply to:** list variance + fact dialog RO plan + inputs  
- `formatMinorToMajor` / `parseMajorToMinor`  
- `formatAsOfDisplay` / `calendarDateToday("Europe/Moscow")`  
- `font-mono` on amounts, codes, ISO dates, Δ  

### Overdue predicate
**Source:** `src/lib/income.ts` lines 75–81  
**Apply to:** page map + list chrome — never reimplement date compare in JSX  

### Isolation (ISO)
**Source:** `src/app/income/actions.test.ts` file-scan  
**Apply to:** actual actions — no BalanceSnapshot, no `revalidatePath("/")`, no net-worth imports  

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| *(none)* | — | — | All Phase 15 files map to in-repo analogs; live Δ preview is new UI chrome but composed from existing money helpers + form state |

## Metadata

**Analog search scope:** `src/components/income/`, `src/app/income/`, `src/app/debts/`, `src/app/accounts/`, `src/lib/validations/`, `src/lib/income.ts`, `src/app/globals.css`; codegraph queries `upsert`, `createRepayment`, `deleteRepayment`, `DestructiveConfirmStep`  
**Tracked-source gate:** all named analogs verified via `git ls-files`  
**Files scanned:** ~15 primary + test companions  
**Pattern extraction date:** 2026-09-07  
**codegraph note:** index weak on some `src/` TSX symbols (`IncomeFormDialog`/`isIncomeOverdue` no hits); debt/account upsert symbols resolved; Grep/Read filled gaps  
