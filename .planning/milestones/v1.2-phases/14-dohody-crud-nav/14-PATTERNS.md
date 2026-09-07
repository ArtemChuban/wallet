# Phase 14: Доходы CRUD + nav - Pattern Map

**Mapped:** 2026-09-07
**Files analyzed:** 15
**Analogs found:** 15 / 15

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/app/income/page.tsx` | route | request-response | `src/app/debts/page.tsx` | exact |
| `src/app/income/actions.ts` | controller | request-response | `src/app/debts/actions.ts` | exact |
| `src/app/income/actions.test.ts` | test | request-response | `src/app/debts/actions.test.ts` + `src/lib/income.test.ts` ISO block | role-match |
| `src/components/income/IncomeList.tsx` | component | request-response | `src/components/debts/DebtsList.tsx` | exact |
| `src/components/income/IncomeFormDialog.tsx` | component | request-response | `src/components/debts/DebtFormDialog.tsx` | exact |
| `src/lib/validations/income.ts` | utility | transform | `src/lib/validations/debts.ts` | exact |
| `src/lib/validations/income.test.ts` | test | transform | `src/lib/validations/debts.test.ts` | exact |
| `src/lib/income.ts` (add `nextOpenPlannedAsOf`) | utility | transform | `src/lib/income.ts` (`listRecurringOccurrences`) | role-match |
| `src/lib/income.test.ts` (flip UI-00 + helper tests) | test | transform | self (`income isolation` block) | exact |
| `src/components/nav.tsx` | component | request-response | self | exact |
| `src/components/nav.test.ts` | test | request-response | self | exact |
| `src/app/debts/actions.ts` (`deletePerson` + person revalidate) | controller | request-response | self (`deletePerson`) | exact |
| `src/app/debts/actions.test.ts` | test | request-response | self (`deletePerson` describe) | exact |
| `src/components/debts/DebtsList.tsx` (Restrict copy/pre-check) | component | request-response | self (`BLOCKED_DELETE_MESSAGE`) | exact |
| `src/components/debts/PersonFormDialog.tsx` (reuse; optional copy) | component | request-response | self | exact |

**Reuse as-is (no new file):** `PersonFormDialog`, `DestructiveConfirmStep` (`src/components/ui/destructive-confirm-step.tsx`).

**Do not clone:** `DebtDetailDialog`, `DebtsPrimaryTotalsHero`, closed-section chevrons, row-click-to-edit (D-12 / UI-SPEC).

---

## Pattern Assignments

### `src/app/income/page.tsx` (route, request-response)

**Analog:** `src/app/debts/page.tsx`

**Imports / shell pattern** (lines 17–21, 174–205):
```typescript
export const dynamic = "force-dynamic";

export default async function DebtsPage() {
  await ensureSqlitePragmas();
  // ...
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 font-sans">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Долги
        </h1>
        {people.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <PersonFormDialog mode="create" trigger={<Button type="button">Новый человек</Button>} />
            <DebtFormDialog mode="create" currencies={currencies} people={peopleOptions} />
          </div>
        ) : null}
      </header>
      <DebtsList people={people} currencies={currencies} />
    </main>
  );
}
```

**Core load pattern** (lines 23–72, 80–121): `prisma.person.findMany({ orderBy: { name: "asc" }, include: { … } })` + `currency.findMany` + `currency.findFirst({ where: { isPrimary: true } })`; serialize BigInt via `.toString()` before client props.

**Income deltas vs debts:**
- Include `recurringIncomes` + `oneTimeIncomes` (+ actuals needed for next-open), not debts/repayments.
- Skip FX/totals hero (`DebtsPrimaryTotalsHero`).
- Header title «Доходы»; honesty line under title (D-11): `Учёт доходов не меняет остатки на счетах.`
- CTAs: «Новый человек» + «Новый доход»; pass `primaryCurrencyCode` into form dialog (D-08).
- Map each definition → `nextOpenPlannedAsOf` before list props (D-02/D-09/D-10).

---

### `src/components/income/IncomeList.tsx` (component, request-response)

**Analog:** `src/components/debts/DebtsList.tsx`

**Imports pattern** (lines 1–21):
```typescript
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePerson } from "@/app/debts/actions";
import { DestructiveConfirmStep } from "@/components/ui/destructive-confirm-step";
import { PersonFormDialog } from "@/components/debts/PersonFormDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatMinorToMajor } from "@/lib/money";
```

**Empty page + Person group + defaultPersonId** (lines 175–188, 254–286):
```typescript
{person.debts.length === 0 ? (
  <div className="flex flex-col items-start gap-3 border-t border-border bg-muted/30 px-4 py-4">
    <p className="text-base text-muted-foreground">Нет долгов</p>
    <DebtFormDialog
      mode="create"
      currencies={currencies}
      people={peopleOptions}
      defaultPersonId={person.id}
      trigger={<Button type="button" size="sm">Новый долг</Button>}
    />
  </div>
) : ( /* rows */ )}
```

**Person delete + DestructiveConfirmStep** (lines 116–139, 222–239):
```typescript
function handleDeleteClick() {
  setDeleteError(null);
  if (person.debtCount > 0) {
    setDeleteError(BLOCKED_DELETE_MESSAGE);
    return;
  }
  setConfirmOpen(true);
}
// Dialog → DestructiveConfirmStep with message `Удалить человека «${person.name}»?…`
```

**Compact row edit button only** (lines 74–86) — copy «Изменить» trigger; **drop** row `role="button"` + `DebtDetailDialog` (D-12).

**Income deltas:**
- Replace debts with mixed recurring/one-time rows; sort by `nextPlannedAsOf` asc inside group (D-02).
- Row shows type label + amount + currency + planned date — no note (D-04).
- No CLOSED chevron section (income has no CLOSED status).
- Pre-check + message: debts **or** income refs → `Нельзя удалить человека, пока есть долги или доходы` (D-16 / UI-SPEC).
- Empty copy: «Нет доходов» / «Нет людей» per UI-SPEC.

---

### `src/components/income/IncomeFormDialog.tsx` (component, request-response)

**Analog:** `src/components/debts/DebtFormDialog.tsx`

**Props / defaultPersonId** (lines 89–106, 144–153):
```typescript
type DebtFormDialogProps =
  | { mode: "create"; currencies: CurrencyOption[]; people: PersonOption[]; defaultPersonId?: number; trigger?: ReactElement }
  | { mode: "edit"; debt: DebtRow; trigger?: ReactElement };
// create: prefer defaultPersonId if in people list, else people[0]
```

**Person existing/new toggle** (lines 238–260) — reuse for D-07; add **kind** toggle (recurring ↔ oneTime) only in create (D-05); lock kind on edit (UI-SPEC).

**useActionState + confirm-delete step** (lines 133–135, 171–224, 505–518):
```typescript
const [step, setStep] = useState<"form" | "confirm-delete">("form");
const action = mode === "create" ? createDebt : updateDebtMeta;
const [state, formAction, isPending] = useActionState(action, initialState);
// edit: button → setStep("confirm-delete") → DestructiveConfirmStep → deleteDebt
```

**Shell open/refresh** (lines 541–593): `formKey` remount on open; `onSuccess` → `router.refresh()` + `setOpen(false)`.

**Income deltas (critical):**
- Currency default = `primaryCurrencyCode` prop, **not** `currencies[0]` (D-08). Debts anti-pattern lines 157–160.
- Create defaults: kind=recurring; `startAsOf` = `calendarDateToday("Europe/Moscow")` visible «Начало с».
- Edit locks: show person + currency + kind read-only; edit amount / dayOfMonth+startAsOf or plannedAsOf / note.
- Delete confirm copy (UI-SPEC): `Удалить доход? Будут удалены план и все связанные факты получения. Это нельзя отменить.`

---

### `src/app/income/actions.ts` (controller, request-response)

**Analog:** `src/app/debts/actions.ts`

**Header / state / helpers** (lines 1–28, 29–55, 57–76):
```typescript
"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
import { parseMajorToMinor } from "@/lib/money";
// Zod schemas from @/lib/validations/income
```

**Create branch personId vs new person** (lines 253–366):
```typescript
export async function createDebt(_prev, formData) {
  const hasPersonId = typeof personIdRaw === "string" && personIdRaw.trim() !== "";
  if (hasPersonId) {
    const validated = createDebtSchema.safeParse({ /* FormData fields */ });
    // prisma.debt.create(...)
  } else {
    const validated = createDebtWithNewPersonSchema.safeParse({ name, ... });
    // prisma.person.create({ data: { name, debts: { create: {...} } } })
  }
  revalidatePath("/debts");
  return { success: true, message: "Сохранено" };
}
```

**Delete definition** (lines 412–439): parse id → `prisma.*.delete` → `revalidatePath`; Cascade actuals via schema (no manual actual delete).

**Update meta** (lines 372–407): `.strict()` Zod; ignore smuggled person/currency fields.

**Income deltas:**
- Separate create/update/delete for `RecurringIncome` and `OneTimeIncome` (or kind-dispatched wrappers).
- Always `revalidatePath("/income")`; never `/` (DISOL mindset).
- On update one-time: call `assertOneTimePlanImmutable` when actual exists (Pitfall 6).
- **Never** import/write `BalanceSnapshot`, `@/lib/net-worth`, `@/lib/historical-series`.
- Person CRUD stays in debts actions (extend there); income actions do not own `deletePerson`.

---

### `src/lib/validations/income.ts` (utility, transform)

**Analog:** `src/lib/validations/debts.ts`

**Shared primitives** (lines 1–34, 62–105):
```typescript
const asOfDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Укажите дату");
const personNameSchema = z.string().trim().min(1).max(120);
const currencyCodeSchema = z.string().trim().min(1).max(16);
const optionalNoteSchema = z.string().trim().max(500).optional();
// isStrictlyPositiveMajor + .superRefine on amount major
```

**Create pair pattern** (lines 62–105): `createXSchema` (with `personId`) + `createXWithNewPersonSchema` (with `name`); both `.strict()`.

**Income schemas (target fields):**
- Recurring create: `personId|name`, `currencyCode`, `plannedAmountMajor`, `dayOfMonth` (1–31), `startAsOf`, `note?`
- One-time create: `personId|name`, `currencyCode`, `plannedAmountMajor`, `plannedAsOf`, `note?`
- Update: lock person/currency/kind out of editable schema; allow amount + schedule fields + note (RESEARCH A1).

---

### `src/lib/validations/income.test.ts` (test, transform)

**Analog:** `src/lib/validations/debts.test.ts`

**Structure** (lines 1–66): vitest `describe` per schema; `safeParse` accept/reject; coerce `personId` string→number; positive major refine.

Cover SRC-01/SRC-02: recurring dayOfMonth bounds; one-time optional note; reject empty amount.

---

### `src/lib/income.ts` — `nextOpenPlannedAsOf` (utility, transform)

**Analog:** same file — `listRecurringOccurrences` + `occurrenceKeyString` (lines 67–69, 132–201)

**Core pattern to wrap:**
```typescript
export function listRecurringOccurrences(
  defs: readonly RecurringIncomeDef[],
  actuals: readonly RecurringIncomeActualSlot[],
  from: string,
  to: string,
): RecurringOccurrence[] { /* month walk + freeze-merge */ }

export function occurrenceKeyString(k: IncomeOccurrenceKey): string {
  return `${k.parentId}:${k.plannedAsOf}`;
}
```

**New helper recipe (RESEARCH Pattern 5):**
1. `from = def.startAsOf`; `to ≈ addCalendarDays(max(today, startAsOf), 400)` from `@/lib/dates`.
2. `listRecurringOccurrences([def], actuals, from, to)`.
3. Build filled keys via `occurrenceKeyString` from actuals.
4. Return earliest occurrence **not** in filled set (may be past — D-10).
5. One-time display/sort = `plannedAsOf` on definition (no helper required for Phase 14 UI).

Keep module pure — no Prisma / net-worth imports (existing ISO lock).

---

### `src/lib/income.test.ts` (test, transform)

**Analog:** self — isolation block (lines 324–344)

**Must change UI-00** before creating `src/app/income`:
```typescript
it("UI-00: src/app/income does not exist", () => {
  expect(existsSync("src/app/income")).toBe(false);
});
```
→ positive “route module exists” **or** drop + rely on nav/actions isolation scans.

Add unit tests for `nextOpenPlannedAsOf` (past unfilled slot = D-10). Keep existing file-scan that `income.ts` never imports net-worth/Prisma.

---

### `src/components/nav.tsx` + `nav.test.ts` (component/test)

**Analog:** self

**Links array** (`nav.tsx` 7–12):
```typescript
const links = [
  { href: "/", label: "Главная" },
  { href: "/accounts", label: "Счета" },
  { href: "/debts", label: "Долги" },
  { href: "/currencies/rates", label: "Валюты" },
] as const;
```
Insert `{ href: "/income", label: "Доходы" }` after `/accounts` (D-13/D-14). Active prefix match already works for non-root hrefs (lines 24–30).

**Test** (`nav.test.ts` 6–31): update expected href/label arrays to
`["/", "/accounts", "/income", "/debts", "/currencies/rates"]` /
`["Главная", "Счета", "Доходы", "Долги", "Валюты"]`.

---

### `src/app/debts/actions.ts` — Person Restrict + dual revalidate (controller)

**Analog:** self — `deletePerson` (lines 210–247), `createPerson`/`renamePerson` revalidate (167–168, 202–203)

**Current trap:**
```typescript
const debtCount = await prisma.debt.count({ where: { personId } });
if (debtCount > 0) {
  return { message: "Нельзя удалить человека, пока есть долги" };
}
revalidatePath("/debts");
```

**Required change (D-16):** also count `recurringIncome` + `oneTimeIncome`; RU message `Нельзя удалить человека, пока есть долги или доходы`; on success (and on create/rename Person) `revalidatePath("/income")` **and** `revalidatePath("/debts")`.

---

### `src/app/debts/actions.test.ts` (test)

**Analog:** self — `deletePerson (PERSON-02)` (lines 161–237)

Extend mocks: `prisma.recurringIncome.count` / `prisma.oneTimeIncome.count` (or whatever client names); assert block when income>0 even if debtCount=0; assert dual `revalidatePath` on success; update blocked message string.

---

### `src/components/debts/DebtsList.tsx` (component, modify)

**Analog:** self — `BLOCKED_DELETE_MESSAGE` + `debtCount` pre-check (lines 36, 116–121)

Update client pre-check to treat income refs like debts (page must pass combined count or incomeCount). Same RU blocked string as income list / server.

---

### `src/components/debts/PersonFormDialog.tsx` (reuse)

**Analog:** self (lines 1–164)

Reuse from `/income` header/empty CTAs via existing `@/app/debts/actions` imports. Optional: soften create description «учитывать долги» → neutral «вести учёт» (RESEARCH A5) — not required for SRC/UI.

---

### `src/app/income/actions.test.ts` (test)

**Analogs:** `src/app/debts/actions.test.ts` (action happy/error paths) + `src/lib/income.test.ts` ISO file-scan

**Isolation file-scan recipe** (from `income.test.ts` 325–332):
```typescript
const src = readFileSync("src/app/income/actions.ts", "utf8");
expect(src).not.toMatch(/BalanceSnapshot/);
expect(src).not.toMatch(/@\/lib\/(?:net-worth|historical-series)/);
```
Plus Zod validation error paths mirroring createDebt tests.

---

### Shared UI primitive: `DestructiveConfirmStep`

**Source:** `src/components/ui/destructive-confirm-step.tsx` (lines 21–51)

```typescript
export function DestructiveConfirmStep({
  message, confirmLabel, backLabel = "Назад", pending = false, onConfirm, onBack,
}: DestructiveConfirmStepProps) { /* DialogFooter outline + destructive */ }
```

**Apply to:** IncomeFormDialog source delete; IncomeList + DebtsList person delete. Never `window.confirm`.

---

## Shared Patterns

### Server page → client list
**Source:** `src/app/debts/page.tsx`  
**Apply to:** `src/app/income/page.tsx`  
`force-dynamic` + `ensureSqlitePragmas` + Prisma load + BigInt string serialize + `max-w-3xl` main + header dual CTAs when people.length > 0.

### Dialog form machine
**Source:** `src/components/debts/DebtFormDialog.tsx` / `PersonFormDialog.tsx`  
**Apply to:** `IncomeFormDialog`  
`useActionState` + success `useEffect` → close; `formKey` remount; edit uses in-dialog `confirm-delete` step with `DestructiveConfirmStep`.

### Server Action + Zod + revalidatePath
**Source:** `src/app/debts/actions.ts`  
**Apply to:** all income mutations + extended Person actions  
`"use server"`; `safeParse` → fieldErrors; Prisma try/catch unique/FK; Russian messages; `revalidatePath` feature route(s) only.

### Person Restrict across domains
**Source:** `deletePerson` in `src/app/debts/actions.ts` + DebtsList pre-check  
**Apply to:** debts actions, DebtsList, IncomeList  
Count debts **and** income; dual revalidate `/debts`+`/income`.

### Side-ledger isolation
**Source:** `src/lib/income.test.ts` ISO block  
**Apply to:** `income.ts`, `income/actions.ts`, actions tests  
No BalanceSnapshot / net-worth / historical-series coupling.

### Money / dates
**Source:** `@/lib/money` (`parseMajorToMinor`, `formatMinorToMajor`), `@/lib/dates` (`calendarDateToday`, `addCalendarDays`, `clampDayOfMonth`)  
**Apply to:** forms, page mapping, next-open helper.

### Validation
**Source:** `src/lib/validations/debts.ts`  
**Apply to:** `src/lib/validations/income.ts`  
`.strict()` schemas; personId vs name create pair; positive major refine; YYYY-MM-DD dates.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| — | — | — | Kind toggle UX has no dedicated file; closest = personMode toggle inside `DebtFormDialog` (lines 238–260). Treat as in-dialog adaptation, not greenfield. |

---

## Metadata

**Analog search scope:** `src/app/debts/**`, `src/components/debts/**`, `src/components/nav*`, `src/components/ui/destructive-confirm-step.tsx`, `src/lib/income*`, `src/lib/validations/debts*`, `src/lib/dates.ts` (via codegraph explore + Read); tracked-source gate via `git ls-files`
**Files scanned:** ~97 `src/**/*.{ts,tsx}` indexed; deep-read 12 analogs
**Pattern extraction date:** 2026-09-07
**Note:** codegraph index may still list old `src/components/debts/DestructiveConfirmStep.tsx` — live tracked path is `src/components/ui/destructive-confirm-step.tsx` (imports in DebtsList/DebtFormDialog already updated).

---

## PATTERN MAPPING COMPLETE

**Phase:** 14 - dohody-crud-nav
**Files classified:** 15
**Analogs found:** 15 / 15

### Coverage
- Files with exact analog: 13
- Files with role-match analog: 2 (`nextOpenPlannedAsOf` helper; income actions.test ISO hybrid)
- Files with no analog: 0 (kind toggle = in-dialog adaptation of personMode)

### Key Patterns Identified
- Debts clone: RSC `force-dynamic` page → Person-grouped client list → form dialogs → Zod server actions
- DestructiveConfirmStep for all deletes; no `window.confirm`
- Person Restrict must span debts+income with dual `revalidatePath`
- Income must default currency to **primary** (do not copy debts `currencies[0]`)
- Flip UI-00 before creating `src/app/income`; file-scan actions for BalanceSnapshot isolation

### File Created
`.planning/phases/14-dohody-crud-nav/14-PATTERNS.md`

### Ready for Planning
Pattern mapping complete. Planner can now reference analog patterns in PLAN.md files.
