# Phase 20: Obligation CRUD + cycle UI - Pattern Map

**Mapped:** 2026-09-09
**Files analyzed:** 11
**Analogs found:** 11 / 11
**Search:** codegraph (`query` / `explore` / `node` / `sync`) + tracked-source gate (`git ls-files`)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/accounts/CreditGraceDialog.tsx` | component | request-response | `src/components/debts/DebtDetailDialog.tsx` | exact |
| `src/components/accounts/CreditGraceAmountDialog.tsx` | component | request-response | `src/components/income/IncomeFactDialog.tsx` | exact |
| `src/components/accounts/AccountList.tsx` | component | request-response | `src/components/accounts/AccountList.tsx` (self) + `DebtsList` / `IncomeList` row chrome | role-match |
| `src/app/accounts/actions.ts` | controller | request-response | `src/app/accounts/actions.ts` (`updateGraceSchedule`) | exact |
| `src/app/accounts/page.tsx` | route | CRUD | `src/app/accounts/page.tsx` (self — extend include/serialize) | exact |
| `src/components/ui/destructive-confirm-step.tsx` | component | request-response | `src/components/ui/destructive-confirm-step.tsx` (extend API) | exact |
| `src/lib/credit-grace.ts` | utility | transform | `src/lib/credit-grace.ts` (reuse; optional merge helper) | exact |
| `src/lib/validations/credit-grace.ts` | utility | transform | `src/lib/validations/credit-grace.ts` (reuse schemas) | exact |
| `src/app/accounts/actions.test.ts` | test | request-response | `src/app/accounts/actions.test.ts` (`updateGraceSchedule` suite) | exact |
| `src/lib/validations/credit-grace.test.ts` | test | transform | `src/lib/validations/account.test.ts` (grace schedule Zod) | role-match |
| `src/components/accounts/credit-grace-ui.test.ts` | test | request-response | `src/components/accounts/AccountFormDialog.test.ts` (source-scan) | role-match |

**Do not modify for DOM (anti-pattern):** `src/components/accounts/AccountFormDialog.tsx` — name/limit only (D-03). Analog for “separate manage surface” is Debts detail vs form, not folding fields into AccountForm.

---

## Pattern Assignments

### `src/components/accounts/CreditGraceDialog.tsx` (component, request-response)

**Analog:** `src/components/debts/DebtDetailDialog.tsx`  
**Secondary:** `src/components/debts/DebtsList.tsx` (OPEN vs collapsed CLOSED); schedule form shell from `AccountFormDialog` / `IncomeFactDialog` field stack.

**Imports pattern** (DebtDetailDialog lines 1–38):
```typescript
"use client";

import {
  useActionState,
  useEffect,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { DestructiveConfirmStep } from "@/components/ui/destructive-confirm-step";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calendarDateToday } from "@/lib/dates";
import { formatMinorToMajor } from "@/lib/money";
```

**Dialog shell + scroll body** (lines 606–628) — copy for grace manage dialog max-height:
```typescript
<Dialog
  open={open}
  onOpenChange={(next) => {
    onOpenChange(next);
    if (next) setFormKey((k) => k + 1);
  }}
>
  <DialogContent className="flex max-h-[min(90dvh,calc(100vh-2rem))] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
    <div className="min-h-0 flex-1 overflow-y-auto p-4">
      {open ? (
        <DebtDetailBody
          key={formKey}
          debt={debt}
          onSuccess={() => {
            router.refresh();
            onOpenChange(false);
          }}
        />
      ) : null}
    </div>
  </DialogContent>
</Dialog>
```

**Confirm-step state machine** (lines 69–76, 215–235) — close/reopen inside same dialog, not `window.confirm`:
```typescript
type ConfirmStep =
  | { kind: "delete-repayment"; id: number }
  | { kind: "delete-sizeChange"; id: number }
  | { kind: "forgive"; asOfDate: string; note: string };

// Render branch:
if (confirm?.kind === "delete-repayment") {
  return (
    <div className="grid gap-4">
      <DialogHeader>
        <DialogTitle>Удалить погашение</DialogTitle>
      </DialogHeader>
      <DestructiveConfirmStep
        message={REPAYMENT_DELETE_CONFIRM}
        confirmLabel="Удалить погашение"
        pending={isActing}
        onConfirm={handleConfirm}
        onBack={() => {
          if (!isActing) setConfirm(null);
        }}
      />
    </div>
  );
}
```

**Grace close needs editable date:** Debt forgive collects date **before** confirm (lines 478–516), then stores in `confirm` payload. Prefer RESEARCH Pattern 3: extend `DestructiveConfirmStep` with `children` for «Дата оплаты» on close step (default `calendarDateToday()`).

**Collapsed CLOSED history** — copy from DebtsList (lines 197–218):
```tsx
{closedDebts.length > 0 ? (
  <li>
    <button
      type="button"
      className="flex w-full items-center gap-2 border-t border-border px-4 py-3 text-left text-sm text-muted-foreground hover:bg-muted/30"
      aria-expanded={closedOpen}
      onClick={() => setClosedOpen((v) => !v)}
    >
      {closedOpen ? (
        <ChevronDown className="size-4 shrink-0" aria-hidden />
      ) : (
        <ChevronRight className="size-4 shrink-0" aria-hidden />
      )}
      <span>Закрытые ({closedDebts.length})</span>
    </button>
    {closedOpen ? (
      <ul>{closedDebts.map((debt) => (
        <DebtCompactRow key={debt.id} debt={debt} />
      ))}</ul>
    ) : null}
  </li>
) : null}
```
Grace copy: «Показать оплаченные» / «Скрыть оплаченные» (UI-SPEC), same chevron expand pattern.

**Schedule form at top:** `useActionState(updateGraceSchedule, …)` like AccountFormBody (`AccountFormDialog.tsx` lines 100–107) — field stack `grid gap-2` Label+Input+`role="alert"` errors; empty DOM start empty (D-15); hint under fields (D-13/D-04).

**Hybrid list merge** — reuse pure helpers (no invent rows):
```typescript
// src/lib/credit-grace.ts:130-170
const { current, next } = resolveCurrentAndNext(schedule, today);
const byStart = new Map(obligations.map((o) => [o.cycleStartAsOf, o]));
// missing window → CTA «Ввести сумму»; never prisma create without amount
```

**Overdue row chrome** — IncomeList badge (lines 118–121), apply to OPEN rows inside dialog only:
```tsx
{income.overdue ? (
  <span className="rounded-md bg-warning/15 px-2 py-1 text-sm font-semibold text-warning-foreground">
    заполни
  </span>
) : null}
```
Grace: `isGraceOverdue(dueAsOf, today)` + interest hint copy from UI-SPEC; status labels «К оплате» / «Оплачено».

---

### `src/components/accounts/CreditGraceAmountDialog.tsx` (component, request-response)

**Analog:** `src/components/income/IncomeFactDialog.tsx`

**Sibling dialog + trigger + formKey reset** (lines 330–368):
```typescript
export function IncomeFactDialog({ income, trigger }: IncomeFactDialogProps) {
  const router = useRouter();
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
      <DialogContent className="overflow-hidden sm:max-w-md">
        {open ? (
          <IncomeFactBody
            key={formKey}
            income={income}
            onSuccess={() => {
              router.refresh();
              setOpen(false);
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
```

**Amount + optional note + pending** (lines 207–227, 250–261, 312–318):
```tsx
<div className="grid gap-2">
  <Label htmlFor={`fact-amount-…`}>Факт · сумма</Label>
  <Input
    name="actualAmountMajor"
    inputMode="decimal"
    value={amountMajor}
    onChange={(e) => setAmountMajor(e.target.value)}
    required
    aria-invalid={Boolean(state.errors?.actualAmountMajor)}
    disabled={isPending}
  />
  {state.errors?.actualAmountMajor?.[0] ? (
    <p className="text-sm text-destructive" role="alert">
      {state.errors.actualAmountMajor[0]}
    </p>
  ) : null}
</div>
{/* note maxLength={500} */}
<DialogClose render={<Button type="button" variant="outline" />}>
  Не сохранять
</DialogClose>
<Button type="submit" disabled={isPending}>
  {isPending ? "Сохранение…" : submitLabel}
</Button>
```

**Grace deltas vs IncomeFact:**
- Labels: «Платёж для беспроцентного» + UX-01 disclaimer (D-16) under amount — not variance block.
- Frozen read-only «Цикл» / «Оплатить до» (like IncomeFact plan date display lines 193–198).
- Create → `createCreditGraceObligation`; edit OPEN → `updateCreditGraceObligation` (amount/note only).
- No delete/close in amount dialog — close/reopen stay in `CreditGraceDialog`.

**Debt amount form alt:** DebtDetail repay tab (lines 338–399) same `amountMajor` + note + `useActionState` if nesting preferred; RESEARCH/UI-SPEC lock sibling IncomeFact pattern.

---

### `src/components/accounts/AccountList.tsx` (component, request-response)

**Analog:** self + row action chrome from same file (lines 245–272) + IncomeList overdue chip + DebtsList separate detail entry.

**Row action buttons** (lines 245–272) — add «Грейс» next to balance/edit for `FIAT_CREDIT` only:
```tsx
<div className="flex shrink-0 items-center gap-2">
  {/* existing SetBalanceDialog + AccountFormDialog */}
  {/* NEW: outline/sm «Грейс» → CreditGraceDialog; overdue chip on button only */}
</div>
```

**UX-01 LOCF label** (lines 75–77) — rename credit debt chrome:
```tsx
<span className="text-muted-foreground">
  долг {debt} {code}  {/* → «Задолженность» */}
</span>
```

**Props extend `AccountListItem`** (lines 36–48): add `statementDayOfMonth`, `dueDayOfMonth`, `creditGraceObligations` (serialized `amountMinor` string), keep BigInt→string RSC boundary.

**Overdue mark on button only (D-07):** any OPEN + `isGraceOverdue` → warn chip «просрочено» on «Грейс» button — never `text-destructive` / warning on account name or LocfDisplay.

**Do not** open grace on whole-row click (DebtsList row-click detail is **not** the entry pattern; D-02 = explicit button).

---

### `src/app/accounts/actions.ts` (controller, request-response)

**Analog:** `updateGraceSchedule` in same file (lines 188–264) + Zod from `credit-grace.ts`.

**Core server-action pattern** (lines 192–263):
```typescript
export async function updateGraceSchedule(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const validated = updateGraceScheduleSchema.safeParse({
    accountId: formData.get("accountId"),
    statementDayOfMonth: formData.get("statementDayOfMonth"),
    dueDayOfMonth: formData.get("dueDayOfMonth"),
  });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }
  // load account → type gate → OPEN clear gate → prisma.account.update
  // never mutate obligation rows on schedule save
  revalidatePath("/accounts");
  revalidatePath("/");
  return { success: true, message: "Сохранено" };
}
```

**New actions to add (same file):**
- `createCreditGraceObligation` — `createCreditGraceObligationSchema.safeParse`; `assertAccountHasGraceSchedule`; server `dueAsOf = dueAsOfForCycle(cycleStart, account.dueDayOfMonth)`; `parseMajorToMinor`; `prisma.creditGraceObligation.create`; P2002 → RU duplicate (UI-SPEC); **never** `balanceSnapshot.*`
- `updateCreditGraceObligation` — amount/note for OPEN; freeze cycle keys
- `closeCreditGraceObligation` / `reopenCreditGraceObligation` — thin wrappers over update semantics (status CLOSED+closedAsOf / OPEN+clear closedAsOf)

**P2002 helper exists** (lines 43–48) — reuse for unique `(accountId, cycleStartAsOf)`.

**Extend `AccountActionState.errors`** for obligation fields (`amountMajor`, `cycleStartAsOf`, `closedAsOf`, `id`, …) as needed.

---

### `src/app/accounts/page.tsx` (route, CRUD)

**Analog:** self (lines 9–98).

**Extend include + serialize** (today lines 14–16 only `currency`):
```typescript
prisma.account.findMany({
  include: {
    currency: true,
    creditGraceObligations: { orderBy: { cycleStartAsOf: "desc" } },
  },
  orderBy: { name: "asc" },
});
// Map statementDayOfMonth / dueDayOfMonth onto list items
// amountMinor → .toString() like creditLimitMinor / locf
```

Pass `today` already injected — keep for overdue + closedAsOf default.

---

### `src/components/ui/destructive-confirm-step.tsx` (component, request-response)

**Analog:** self (lines 6–51).

**Current API** — message + footer only; pending hardcodes «Удаление…»:
```typescript
type DestructiveConfirmStepProps = {
  message: string;
  confirmLabel: string;
  backLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onBack: () => void;
};
// pending ? "Удаление…" : confirmLabel
```

**Phase 20 extend (RESEARCH Pattern 3 / UI-SPEC):**
- optional `children?: ReactNode` between message and footer (close date field)
- optional `pendingLabel?: string` — «Сохранение…» / «Возврат…» (not «Удаление…»)

Existing Debt/Income/AccountList callers stay valid (defaults).

---

### `src/lib/credit-grace.ts` (utility, transform)

**Analog:** self — **reuse**, do not rewrite calendar math.

| Helper | Lines | Use in Phase 20 |
|--------|-------|-----------------|
| `resolveCurrentAndNext` | 130–161 | hybrid current/next candidates |
| `listCycleWindows` | 98–123 | optional wider list |
| `dueAsOfForCycle` | 40–52 | server create SoT for `dueAsOf` |
| `isGraceOverdue` | 168–170 | OBL-03 chrome (`dueAsOf < today`) |

Optional extract `mergeGraceListRows` for testability (RESEARCH Wave 0) — pure transform, UI still owns CTA copy.

---

### `src/lib/validations/credit-grace.ts` (utility, transform)

**Analog:** self + schedule pairing in `src/lib/validations/account.ts` (`updateGraceScheduleSchema` lines 95–123).

**Create schema** (lines 101–115) — wire FormData in actions:
```typescript
export const createCreditGraceObligationSchema = z
  .object({
    accountId: z.coerce.number().int().positive(),
    cycleStartAsOf: asOfDateSchema,
    dueAsOf: asOfDateSchema,
    amountMajor: amountMajorField,
    status: graceStatusSchema.default("OPEN"),
    closedAsOf: optionalClosedAsOfSchema,
    note: optionalNoteSchema,
  })
  .strict()
  .superRefine((val, ctx) => {
    refinePositiveAmountMajor(val, ctx);
    refineClosedAsOfPairing(val, ctx);
  });
```

**Update schema** (lines 120–132) — amount/status/closedAsOf/note; cycle frozen server-side.

**Gate:** `assertAccountHasGraceSchedule` (lines 48–55) before create.

Schedule persist continues via `updateGraceScheduleSchema` in `account.ts` (both-or-neither).

---

### `src/app/accounts/actions.test.ts` (test, request-response)

**Analog:** existing `updateGraceSchedule` suite (~line 352+) — mocks already stub `creditGraceObligation.create/update/count`.

**Copy patterns:**
- assert `prisma.creditGraceObligation.create` / `update` called with expected data
- assert `prisma.balanceSnapshot.*` **not** called on grace CRUD
- clear schedule with OPEN count > 0 still covered; extend for create-without-schedule, P2002, close/reopen closedAsOf pairing

---

### `src/lib/validations/credit-grace.test.ts` (test, transform)

**Analog:** `src/lib/validations/account.test.ts` describe `updateGraceScheduleSchema` — pairing, both-null, reject partial.

Cover: positive amount, closedAsOf refine OPEN/CLOSED, create requires amount.

---

### `src/components/accounts/credit-grace-ui.test.ts` (test, request-response)

**Analog:** `src/components/accounts/AccountFormDialog.test.ts` source-scan style.

Assert: `DestructiveConfirmStep` import; no `window.confirm`; locked RU strings (Грейс, Задолженность, Платёж для беспроцентного); grace button only on credit; overdue mark not on whole row.

---

## Shared Patterns

### Authentication
N/A — single-user local app. Soft access: validate account exists + `FIAT_CREDIT` + schedule before writes (same as `updateGraceSchedule` type gates).

### Server Action + Zod + revalidate
**Source:** `src/app/accounts/actions.ts`  
**Apply to:** create / update / close / reopen / schedule  
```typescript
const validated = schema.safeParse({ …formData.get… });
if (!validated.success) return { errors: validated.error.flatten().fieldErrors };
// ensureSqlitePragmas → prisma → catch P2002
revalidatePath("/accounts");
revalidatePath("/");
return { success: true, message: "Сохранено" };
```

### DestructiveConfirmStep (no window.confirm)
**Source:** `src/components/ui/destructive-confirm-step.tsx` + DebtDetail / AccountList / IncomeFact  
**Apply to:** early close («Оплачено») + reopen («Вернуть к оплате»)  
Extend `children` + `pendingLabel` before grace close UX.

### Client dialog lifecycle
**Source:** IncomeFactDialog / DebtDetailDialog / AccountFormDialog  
**Apply to:** CreditGrace* dialogs  
- `"use client"`; controlled `open` / `formKey` remount on open  
- `useActionState` for forms; `useTransition` for confirm actions  
- `router.refresh()` on success; Russian `role="alert"` errors  
- Pending labels «Сохранение…»

### Money + dates
**Source:** `src/lib/money.ts`, `src/lib/dates.ts` / `calendarDateToday`  
**Apply to:** amount dialog ↔ `amountMinor`; overdue vs injected `today`; default `closedAsOf`

### Overdue warning chrome
**Source:** `src/components/income/IncomeList.tsx` lines 118–121  
**Apply to:** OPEN rows in grace dialog + chip on «Грейс» button only  
```tsx
className="… bg-warning/15 … text-warning-foreground"
```
Predicate: `isGraceOverdue` from `src/lib/credit-grace.ts:168-170`.

### Collapsed paid history
**Source:** `src/components/debts/DebtsList.tsx` lines 197–218  
**Apply to:** CLOSED obligations behind «Показать оплаченные».

### Side-ledger isolation
**Source:** `updateGraceSchedule` tests + income fact copy («не меняет остатки»)  
**Apply to:** all grace actions — touch only `Account` DOM fields / `CreditGraceObligation`; never `BalanceSnapshot`.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| — | — | — | None blocking. Hybrid candidate⊕persisted merge is new composition but built from `resolveCurrentAndNext` + DebtsList OPEN/CLOSED + Income CTA buttons. |

**Soft gap:** editable date **inside** `DestructiveConfirmStep` — today Debt collects date before step. Planner should extend shared component (`children` / `pendingLabel`) per RESEARCH A1 rather than invent new confirm primitive.

---

## Anti-Patterns (do not copy)

| Bad source | Why |
|------------|-----|
| DOM fields in `AccountFormDialog` | Violates D-01/D-03 |
| Whole-row click → detail (`DebtsList` DebtCompactRow) | Violates D-02 — use explicit «Грейс» button |
| Whole-row overdue alarm | Violates D-07 / UX-01 vs «Задолженность» |
| `window.confirm` (e.g. RateList if present) | Violates D-11 |
| Autofill 21/15 into empty DOM | Violates D-15 |
| Snapshot debt amount inside grace dialog | Violates D-16 |
| Placeholder OPEN creates without amount | Violates D-05 / Phase 19 D-06 |

---

## Metadata

**Analog search scope:** `src/components/{accounts,debts,income,ui}/`, `src/app/accounts/`, `src/lib/{credit-grace,validations}/` via codegraph + Read  
**Files scanned:** ~21 (codegraph explore) + focus analog set  
**Tracked-source gate:** all named analogs pass `git ls-files`  
**Pattern extraction date:** 2026-09-09
