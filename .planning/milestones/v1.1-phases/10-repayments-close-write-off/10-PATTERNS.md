# Phase 10: Repayments + close/write-off - Pattern Map

**Mapped:** 2026-09-05
**Files analyzed:** 8
**Analogs found:** 8 / 8

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/app/debts/actions.ts` | service | CRUD | `src/app/debts/actions.ts` (`createDebt` / `deleteDebt`) + `src/app/accounts/actions.ts` (`setBalance` future-date) | exact |
| `src/app/debts/actions.test.ts` | test | CRUD | `src/app/debts/actions.test.ts` | exact |
| `src/app/debts/page.tsx` | route | request-response | `src/app/debts/page.tsx` (self — extend select/serialize) | exact |
| `src/components/debts/DebtDetailDialog.tsx` | component | request-response | `src/components/debts/DebtFormDialog.tsx` + `src/components/accounts/AccountList.tsx` (history delete) | role-match |
| `src/components/debts/DebtsList.tsx` | component | request-response | `src/components/debts/DebtsList.tsx` (self) | exact |
| `src/lib/validations/debts.ts` | utility | transform | `src/lib/validations/balance.ts` (`deleteBalanceSchema`) + self create schemas | exact |
| `src/lib/validations/debts.test.ts` | test | transform | `src/lib/validations/debts.test.ts` | exact |
| `prisma/schema.prisma` (+ migration) | model | CRUD | `prisma/schema.prisma` `DebtSizeChange` | exact |

**Reuse only (no role change):** `src/lib/debts.ts` asserts, `src/components/debts/DestructiveConfirmStep.tsx`, `src/components/debts/DebtFormDialog.tsx` (meta/delete via «Изменить»).

## Pattern Assignments

### `src/app/debts/actions.ts` (service, CRUD)

**Analog:** `src/app/debts/actions.ts` (extend) + `src/app/accounts/actions.ts` for future-date gate

**Imports / state shape** (debts actions lines 1–37) — extend `DebtActionState.errors` with repayment/size fields (`amountMajor`, `deltaMajor`, `asOfDate`, `id`):
```typescript
"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
import { parseMajorToMinor } from "@/lib/money";
// add: calendarDateToday from "@/lib/balances"
// add: remainingMinor, statusForRemaining, assertRepaymentAmount, assertSizeDelta, currentPrincipalMinor from "@/lib/debts"
// add: createRepaymentSchema, createSizeChangeSchema, deleteRepaymentSchema, deleteSizeChangeSchema (+ forgive schema if separate)
```

**Zod + FormData + revalidate `/debts` only** (`createDebt` lines 220–327):
```typescript
  const validated = createDebtSchema.safeParse({
    personId: personIdRaw,
    direction: formData.get("direction"),
    // ...
  });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }
  // ... ensureSqlitePragmas + prisma write ...
  revalidatePath("/debts");
  return { success: true, message: "Сохранено" };
```

**Future asOfDate rejection** (`src/app/accounts/actions.ts` lines 198–203) — apply to createRepayment / createSizeChange / forgive:
```typescript
  const today = calendarDateToday();
  if (asOfDate > today) {
    return {
      errors: { asOfDate: ["Дата не может быть в будущем"] },
    };
  }
```

**Delete-by-id Zod** (`src/app/accounts/actions.ts` `deleteBalanceSnapshot` lines 270–296) — mirror for deleteRepayment / deleteSizeChange, but **only** `revalidatePath("/debts")` (never `/`):
```typescript
  const validated = deleteBalanceSchema.safeParse({
    id: formData.get("id"),
  });
  if (!validated.success) {
    return { message: "Не удалось удалить снимок. Попробуйте снова." };
  }
  // ... prisma.*.delete ...
  revalidatePath("/accounts"); // debts: "/debts" only
```

**Money parse + scale gate** — reuse local `resolveInitialMinor` / `fracDigitCount` pattern (lines 53–103) for `amountMajor` / `deltaMajor` against `debt.currency.scale`.

**New core: event write + status sync** (no existing `$transaction` in repo — introduce here). After Zod + load ledger:
```typescript
await prisma.$transaction(async (tx) => {
  const debt = await tx.debt.findUniqueOrThrow({
    where: { id: debtId },
    include: {
      repayments: { select: { amountMinor: true } },
      sizeChanges: { select: { deltaMinor: true } },
      currency: { select: { scale: true } },
    },
  });
  const remainingBefore = remainingMinor(
    debt.initialAmountMinor,
    debt.sizeChanges.map((s) => s.deltaMinor),
    debt.repayments.map((r) => r.amountMinor),
  );
  assertRepaymentAmount(amountMinor, remainingBefore);
  await tx.debtRepayment.create({
    data: { debtId, asOfDate, amountMinor, note },
  });
  await tx.debt.update({
    where: { id: debtId },
    data: { status: statusForRemaining(remainingBefore - amountMinor) },
  });
});
revalidatePath("/debts");
```

**Forgive:** same size-change path with server-computed `deltaMinor = -remainingBefore` (ignore client delta); set `isForgive: true` if column added. **Delete events:** load parent debt + full ledger after delete, then `statusForRemaining(remaining)`.

**Domain helpers to call** (`src/lib/debts.ts` lines 21–85):
```typescript
export function remainingMinor(...): bigint { /* ... */ }
export function statusForRemaining(remaining: bigint): DebtStatus { /* CLOSED iff 0n */ }
export function assertRepaymentAmount(amountMinor, remainingBefore): void { /* ... */ }
export function assertSizeDelta(deltaMinor, currentPrincipal, sumRepayments): void { /* ... */ }
```

---

### `src/app/debts/actions.test.ts` (test, CRUD)

**Analog:** `src/app/debts/actions.test.ts`

**Mock + DISOL-01 assertions** (lines 1–46, 55–67):
```typescript
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    person: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    debt: { count: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    currency: { findUnique: vi.fn() },
  },
  ensureSqlitePragmas: vi.fn(),
}));

expect(revalidatePath).toHaveBeenCalledWith("/debts");
expect(revalidatePath).not.toHaveBeenCalledWith("/");
```

**Extend mock:** `prisma.debtRepayment`, `prisma.debtSizeChange`, `prisma.$transaction` (callback that receives `tx` with same mocked methods), and `calendarDateToday` mock like `src/app/accounts/actions.test.ts`.

**createDebt success shape to mirror** (lines 236–266) — same style for createRepayment / forgive / delete + status CLOSED/OPEN cases.

---

### `src/app/debts/page.tsx` (route, request-response)

**Analog:** `src/app/debts/page.tsx` (self)

**RSC load + BigInt serialize** (lines 10–54) — extend event selects for detail timeline; pass `status` + full event rows as strings:
```typescript
    prisma.person.findMany({
      orderBy: { name: "asc" },
      include: {
        debts: {
          orderBy: { id: "desc" },
          include: {
            currency: { select: { code: true, name: true, scale: true } },
            repayments: { select: { amountMinor: true } }, // extend: id, asOfDate, note
            sizeChanges: { select: { deltaMinor: true } }, // extend: id, asOfDate, note, isForgive
          },
        },
      },
    }),
```

```typescript
      const remaining = remainingMinor(
        d.initialAmountMinor,
        d.sizeChanges.map((s) => s.deltaMinor),
        d.repayments.map((r) => r.amountMinor),
      );
      return {
        id: d.id,
        // ...existing fields...
        remainingMinor: remaining.toString(),
        status: d.status, // or statusForRemaining(remaining) after write sync
        // repayments / sizeChanges with *.toString() minors
      };
```

Keep `export const dynamic = "force-dynamic"` and DISOL-01 (no NW imports).

---

### `src/components/debts/DebtDetailDialog.tsx` (component, request-response) — NEW

**Analog primary:** `src/components/debts/DebtFormDialog.tsx`  
**Analog secondary (history delete):** `src/components/accounts/AccountList.tsx`

**Dialog shell + formKey remount** (`DebtFormDialog` lines 487–535):
```typescript
export function DebtFormDialog(props: DebtFormDialogProps) {
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
          <DebtFormBody key={formKey} /* ... */ onSuccess={() => setOpen(false)} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
```

**useActionState + success close** (lines 145–152):
```typescript
  const [state, formAction, isPending] = useActionState(action, initialState);
  useEffect(() => {
    if (state?.success) {
      onSuccess();
    }
  }, [state, onSuccess]);
```

**In-dialog destructive confirm step** (lines 108–198) — use for delete repayment/size-change **and** forgive (D-06 / D-09):
```typescript
  const [step, setStep] = useState<"form" | "confirm-delete">("form");
  // ...
  if (step === "confirm-delete") {
    return (
      <div className="grid gap-4">
        <DialogHeader>
          <DialogTitle>Удалить долг</DialogTitle>
        </DialogHeader>
        <DestructiveConfirmStep
          message={DEBT_DELETE_CONFIRM}
          confirmLabel="Удалить долг"
          pending={isDeleting}
          onConfirm={handleConfirmDelete}
          onBack={() => setStep("form")}
        />
      </div>
    );
  }
```

**History row delete + confirm Dialog** (`AccountList` lines 169–197, 296–309):
```typescript
  function handleDeleteClick(snap: BalanceSnapshotHistoryItem) {
    setDeleteError(null);
    setConfirmSnap(snap);
  }
  function handleConfirmDelete() {
    if (!confirmSnap) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", String(snap.id));
      const result = await deleteBalanceSnapshot(formData);
      // ...
    });
  }
  // Dialog + DestructiveConfirmStep with Russian confirm copy
```

**DebtRow BigInt strings** (`DebtFormDialog` lines 50–62) — extend with `status`, event arrays (`amountMinor`/`deltaMinor` as strings), `isForgive`:
```typescript
export type DebtRow = {
  id: number;
  direction: "I_OWE" | "THEY_OWE";
  currencyCode: string;
  initialAmountMinor: string;
  remainingMinor: string;
  // Phase 10: status, repayments[], sizeChanges[]
  dueDate: string | null;
  note: string | null;
  currency: { code: string; name: string; scale: number };
  person: { id: number; name: string };
};
```

**Defaults:** `asOfDate` default via `calendarDateToday()` (from `@/lib/dates` or `@/lib/balances` re-export). Money display via `formatMinorToMajor(BigInt(...), scale)`. Labels: «Погашение» / «Изменение суммы» / «Списание» (D-07). Hide «Простить остаток» when `remaining === 0n` (RESEARCH A1). «Изменить» opens existing `DebtFormDialog` mode=edit (D-04).

**Detail open control:** prefer controlled `open`/`onOpenChange` from `DebtsList` row click (not only DialogTrigger) — still remount body with `formKey` on open.

---

### `src/components/debts/DebtsList.tsx` (component, request-response)

**Analog:** `src/components/debts/DebtsList.tsx` (self)

**Compact row + meta edit today** (lines 40–68) — change to: row click opens `DebtDetailDialog`; wrap «Изменить» with `stopPropagation` (D-02 / Pitfall 4):
```typescript
function DebtCompactRow({ debt }: { debt: DebtRow }) {
  const remaining = formatMinorToMajor(
    BigInt(debt.remainingMinor),
    debt.currency.scale,
  );
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
      {/* Phase 10: onClick → detail; role=button or button-like row */}
      <div className="flex min-w-0 flex-wrap items-baseline gap-2">
        {/* direction / remaining / currency */}
      </div>
      <DebtFormDialog
        mode="edit"
        debt={debt}
        trigger={
          <Button type="button" variant="outline" size="sm"
            onClick={(e) => e.stopPropagation()}>
            Изменить
          </Button>
        }
      />
    </li>
  );
}
```

**PersonGroup debts list** (lines 157–162) — split OPEN vs CLOSED; collapsed «Закрытые (N)» default closed (D-11/D-12):
```typescript
        <ul>
          {person.debts.map((debt) => (
            <DebtCompactRow key={debt.id} debt={debt} />
          ))}
        </ul>
```

Reuse existing person-delete `DestructiveConfirmStep` Dialog (lines 165–183) unchanged.

---

### `src/lib/validations/debts.ts` (utility, transform)

**Analog:** self + `src/lib/validations/balance.ts`

**Reuse create schemas** (lines 121–159):
```typescript
export const createRepaymentSchema = z
  .object({
    debtId: z.coerce.number().int().positive(),
    amountMajor: z.string().trim().min(1, "Введите корректную сумму"),
    asOfDate: asOfDateSchema,
    note: optionalNoteSchema,
  })
  .strict()
  .superRefine(/* strictly positive major */);

export const createSizeChangeSchema = z
  .object({
    debtId: z.coerce.number().int().positive(),
    deltaMajor: z.string().trim().min(1, "Введите корректную сумму"),
    asOfDate: asOfDateSchema,
    note: optionalNoteSchema,
  })
  .strict()
  .superRefine(/* non-empty major */);
```

**Add delete schemas** — mirror `deleteBalanceSchema` (`src/lib/validations/balance.ts` lines 17–21):
```typescript
export const deleteBalanceSchema = z
  .object({
    id: z.coerce.number().int().positive(),
  })
  .strict();
```
→ `deleteRepaymentSchema` / `deleteSizeChangeSchema` identical shape.

**Forgive schema (discretion):** `{ debtId, asOfDate, note? }.strict()` — no client `deltaMajor` (server computes −remaining).

---

### `src/lib/validations/debts.test.ts` (test, transform)

**Analog:** `src/lib/validations/debts.test.ts`

**Existing repayment/size tests** (from ~line 160) — extend with `deleteRepaymentSchema` / `deleteSizeChangeSchema` / forgive schema cases (positive id coerce; reject empty/smuggled fields via `.strict()`).

---

### `prisma/schema.prisma` (+ migration) (model, CRUD)

**Analog:** `prisma/schema.prisma` `DebtSizeChange` (lines 75–83)

```prisma
model DebtSizeChange {
  id         Int      @id @default(autoincrement())
  debtId     Int
  debt       Debt     @relation(fields: [debtId], references: [id], onDelete: Cascade)
  asOfDate   String // YYYY-MM-DD
  deltaMinor BigInt // signed; app rejects 0
  note       String?
  createdAt  DateTime @default(now())
}
```

**Phase 10 add (RESEARCH A2):** `isForgive Boolean @default(false)` — durable «Списание» vs «Изменение суммы» (D-07). New migration under `prisma/migrations/` following timestamp naming (`20260904…_debts_schema` style). Do **not** add `writeOffMinor` or WRITE_OFF repayment type.

---

## Shared Patterns

### Authentication / access
**N/A** — single-user local app (Phase 9 AR-09-01). No auth middleware on debts actions.

### Error handling + Russian messages
**Source:** `src/app/debts/actions.ts`  
**Apply to:** all new event actions  
```typescript
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }
  // domain assert throws → catch → field or message error
  return {
    message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
  };
```
Map over-repay / size floor to actionable Russian field errors where possible.

### Destructive confirm (never `window.confirm`)
**Source:** `src/components/debts/DestructiveConfirmStep.tsx` lines 21–51  
**Apply to:** delete repayment, delete size-change, forgive confirm  
```typescript
export function DestructiveConfirmStep({
  message,
  confirmLabel,
  backLabel = "Назад",
  pending = false,
  onConfirm,
  onBack,
}: DestructiveConfirmStepProps) {
  return (
    <div className="grid gap-4">
      <p className="text-base text-foreground">{message}</p>
      <DialogFooter>
        <Button type="button" variant="outline" disabled={pending} onClick={onBack}>
          {backLabel}
        </Button>
        <Button type="button" variant="destructive" disabled={pending} onClick={onConfirm}>
          {pending ? "Удаление…" : confirmLabel}
        </Button>
      </DialogFooter>
    </div>
  );
}
```
Forgive confirm may need non-«Удаление…» pending text — pass custom `confirmLabel` / consider optional pending label (or reuse pending as-is for delete; forgive can show confirmLabel while pending).

### DISOL-01 revalidation
**Source:** `src/app/debts/actions.ts` / tests  
**Apply to:** every event mutation  
```typescript
revalidatePath("/debts");
// never revalidatePath("/")
```

### Money + dates
**Source:** `@/lib/money` (`parseMajorToMinor` / `formatMinorToMajor`), `@/lib/dates` `calendarDateToday` (re-exported via `@/lib/balances`)  
**Apply to:** all forms and actions. BigInt strings across RSC→client boundary.

### Domain math (do not reimplement)
**Source:** `src/lib/debts.ts`  
**Apply to:** all write paths — `remainingMinor`, `statusForRemaining`, `assertRepaymentAmount`, `assertSizeDelta`.

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| — | — | — | All planned files have role-match or exact analogs. **First-use:** `prisma.$transaction` (no prior `src/` usage) — follow RESEARCH Pattern 1; not a missing-file gap. |

## Metadata

**Analog search scope:** `src/app/debts/`, `src/app/accounts/`, `src/components/debts/`, `src/components/accounts/`, `src/lib/`, `prisma/`, `.planning/phases/09-people-debts-crud-nav/09-PATTERNS.md`; codegraph queries for debt/repayment/Dialog patterns  
**Files scanned:** ~15 tracked sources (all analogs verified via `git ls-files`)  
**Pattern extraction date:** 2026-09-05
