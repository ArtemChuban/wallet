# Phase 19: Schema + pure grace domain math - Pattern Map

**Mapped:** 2026-09-08
**Files analyzed:** 8
**Analogs found:** 8 / 8

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `prisma/schema.prisma` | model | CRUD | `prisma/schema.prisma` (`Account` + `DebtStatus` + Cascade children) | exact |
| `prisma/migrations/<ts>_credit_grace_dual_dom/migration.sql` | migration | transform | `prisma/migrations/20260903005200_account_credit_limit_check/migration.sql` | exact |
| `src/lib/credit-grace.ts` | utility | transform | `src/lib/income.ts` (`listRecurringOccurrences` + `isIncomeOverdue`) | exact |
| `src/lib/credit-grace.test.ts` | test | transform | `src/lib/income.test.ts` (+ `src/lib/dates.test.ts` for clamp) | exact |
| `src/lib/validations/account.ts` | utility | request-response | `src/lib/validations/account.ts` (`createAccountSchema` FIAT_CREDIT refine) | exact |
| `src/lib/validations/credit-grace.ts` | utility | request-response | `src/lib/validations/income.ts` (`dayOfMonthSchema` + create schemas) | role-match |
| `src/app/accounts/actions.ts` | controller | request-response | `src/app/accounts/actions.ts` (`updateAccountName` / `createAccount`) | exact |
| `src/lib/validations/account.test.ts` | test | request-response | `src/lib/validations/account.test.ts` | exact |

**Must not modify (isolation):** `src/lib/net-worth.ts`, `src/lib/historical-series.ts`, `src/lib/dates.ts` (reuse API only).

## Pattern Assignments

### `prisma/schema.prisma` (model, CRUD)

**Analog:** `prisma/schema.prisma`

**Status enum pattern** (lines 38-41) — mirror for `GraceObligationStatus`:
```prisma
enum DebtStatus {
  OPEN
  CLOSED
}
```

**Config-on-parent Account** (lines 92-104) — add dual DOM ints + relation; keep creditLimit comment style:
```prisma
model Account {
  id               Int         @id @default(autoincrement())
  name             String      @unique
  type             AccountType
  currencyCode     String
  currency         Currency    @relation(fields: [currencyCode], references: [code])
  /// Metadata only — never an NW asset. Required (>0) iff type == FIAT_CREDIT (D-09, D-10).
  /// SQLite CHECK Account_credit_limit_invariant enforces FIAT_CREDIT ↔ creditLimitMinor > 0 (else null).
  creditLimitMinor BigInt?
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt
  balanceSnapshots BalanceSnapshot[]
}
```

**Unique cycle-key child** (lines 142-153) — shape for `CreditGraceObligation` `(accountId, cycleStartAsOf)`:
```prisma
model RecurringIncomeActual {
  id                Int             @id @default(autoincrement())
  recurringIncomeId Int
  recurringIncome   RecurringIncome @relation(fields: [recurringIncomeId], references: [id], onDelete: Cascade)
  plannedAsOf       String // YYYY-MM-DD — occurrence key half (D-06, D-09)
  actualAsOf        String // YYYY-MM-DD
  amountMinor       BigInt
  note              String?
  createdAt         DateTime        @default(now())

  @@unique([recurringIncomeId, plannedAsOf])
}
```

**Cascade vs Restrict** — D-15 Cascade (like children above); **do not** copy BalanceSnapshot Restrict (lines 116-119):
```prisma
model BalanceSnapshot {
  id          Int     @id @default(autoincrement())
  accountId   Int
  account     Account @relation(fields: [accountId], references: [id], onDelete: Restrict)
  // ...
  @@unique([accountId, asOfDate], name: "accountId_asOfDate")
}
```

**Debt OPEN|CLOSED on row** (lines 53-70) — status default OPEN; note optional. Grace adds `closedAsOf` (no Debt analog for that field — Zod/CHECK pair OPEN↔null CLOSED↔set).

---

### `prisma/migrations/<ts>_credit_grace_dual_dom/migration.sql` (migration, transform)

**Analog:** `prisma/migrations/20260903005200_account_credit_limit_check/migration.sql`

**Core RedefineTables + CHECK** (lines 1-25) — rebuild Account; **keep** existing credit-limit CHECK and **add** grace DOM CHECK on same `new_Account`:
```sql
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Account" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "creditLimitMinor" BIGINT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Account_currencyCode_fkey" FOREIGN KEY ("currencyCode") REFERENCES "Currency" ("code") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Account_credit_limit_invariant" CHECK (
        (type = 'FIAT_CREDIT' AND creditLimitMinor IS NOT NULL AND creditLimitMinor > 0)
        OR
        (type != 'FIAT_CREDIT' AND creditLimitMinor IS NULL)
    )
);
INSERT INTO "new_Account" ("id", "name", "type", "currencyCode", "creditLimitMinor", "createdAt", "updatedAt")
SELECT "id", "name", "type", "currencyCode", "creditLimitMinor", "createdAt", "updatedAt" FROM "Account";
DROP TABLE "Account";
ALTER TABLE "new_Account" RENAME TO "Account";
CREATE UNIQUE INDEX "Account_name_key" ON "Account"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
```

**Workflow:** `npx prisma migrate dev --create-only --name credit_grace_dual_dom` then edit SQL (Prisma 7 has no PSL CHECK).

---

### `src/lib/credit-grace.ts` (utility, transform)

**Analog:** `src/lib/income.ts` (+ `src/lib/dates.ts` for clamp)

**Imports / isolation header** (income lines 1-7):
```typescript
/**
 * Income side-ledger domain (Phase 13+).
 * Pure TypeScript — no Prisma, no net-worth / historical-series / debts imports (ISO-01).
 */

import { addCalendarDays, clampDayOfMonth } from "@/lib/dates";
```
Grace twin: pure module; import **only** `clampDayOfMonth` from `@/lib/dates`; **no** Prisma / net-worth / historical-series. Prefer **not** using `addCalendarDays` as due SoT (D-10).

**Overdue predicate — injected today** (lines 73-83) — adapt to grace: `dueAsOf < today` (inclusive due day = not overdue on due day):
```typescript
/**
 * Overdue when plan date is before injected today and no actual exists (FND-OVER / D-08).
 * Callers pass today — never reads the clock (D-13).
 */
export function isIncomeOverdue(
  plannedAsOf: string,
  hasActual: boolean,
  today: string,
): boolean {
  return plannedAsOf < today && !hasActual;
}
```

**Month walk generator** (lines 135-149) — reuse for `listCycleWindows`:
```typescript
function* monthsOverlapping(
  from: string,
  to: string,
): Generator<{ y: number; m: number }> {
  let [y, m] = from.split("-").map(Number) as [number, number];
  const [ty, tm] = to.split("-").map(Number) as [number, number];
  while (y < ty || (y === ty && m <= tm)) {
    yield { y, m };
    m += 1;
    if (m === 13) {
      m = 1;
      y += 1;
    }
  }
}
```

**Candidate list + clamp** (lines 155-196 core) — emit `{ cycleStartAsOf, dueAsOf }` candidates; null schedule → empty (D-13); no DB writes (D-12):
```typescript
export function listRecurringOccurrences(
  defs: readonly RecurringIncomeDef[],
  actuals: readonly RecurringIncomeActualSlot[],
  from: string,
  to: string,
): RecurringOccurrence[] {
  // ...
  for (const def of defs) {
    for (const { y, m } of monthsOverlapping(from, to)) {
      const candidate = clampDayOfMonth(y, m, def.dayOfMonth);
      // ...
    }
  }
  // ...
}
```

**Clamp primitive** (`src/lib/dates.ts` lines 56-66) — statement + due engines:
```typescript
export function clampDayOfMonth(
  year: number,
  month1to12: number,
  dayOfMonth: number,
): string {
  const last = new Date(Date.UTC(year, month1to12, 0)).getUTCDate();
  const day = Math.min(dayOfMonth, last);
  const mm = String(month1to12).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}
```

**Due engine (next month + clamp)** — from RESEARCH / CONTEXT D-10 (not an existing function; build beside clamp):
```typescript
// cycleStart = clampDayOfMonth(y, m, statementDOM)
// due = clampDayOfMonth(nextMonth(y,m), dueDOM) — never sole addCalendarDays(start, N)
```

**OPEN|CLOSED type mirror** (`src/lib/debts.ts` lines 3-4):
```typescript
/** Debt status mirrored from Prisma DebtStatus enum (pure helpers — no Prisma). */
export type DebtStatus = "OPEN" | "CLOSED";
```

---

### `src/lib/credit-grace.test.ts` (test, transform)

**Analog:** `src/lib/income.test.ts` + `src/lib/dates.test.ts`

**Vitest imports + table style** (income.test lines 31-51):
```typescript
describe("listRecurringOccurrences tracer (FND-OCC / D-13 / D-15 / D-16)", () => {
  it("returns one Feb slot with DOM-31 clamped and bigint plannedAmountMinor", () => {
    const slots = listRecurringOccurrences(
      [
        {
          id: 1,
          plannedAmountMinor: 100_00n,
          dayOfMonth: 31,
          startAsOf: "2026-01-01",
        },
      ],
      [],
      "2026-02-01",
      "2026-02-28",
    );
    expect(slots).toHaveLength(1);
    expect(slots[0]?.plannedAsOf).toBe("2026-02-28");
  });
});
```

**Overdue injected-today** (income.test lines 247-268):
```typescript
describe("isIncomeOverdue (FND-OVER / D-08 / D-13)", () => {
  it("false when plannedAsOf == today and no actual", () => {
    expect(isIncomeOverdue("2026-03-10", false, today)).toBe(false);
  });
  it("does not call calendarDateToday — today is injected (D-13)", () => {
    expect(isIncomeOverdue("2020-01-01", false, "2019-12-31")).toBe(false);
    expect(isIncomeOverdue("2020-01-01", false, "2020-01-02")).toBe(true);
  });
});
```

**Clamp fixtures** (dates.test lines 39-50) — grace tests assert next-month due on top of these:
```typescript
describe("clampDayOfMonth (D-16 / FND-CLAMP)", () => {
  it("maps DOM 31 to Feb last day (non-leap)", () => {
    expect(clampDayOfMonth(2025, 2, 31)).toBe("2025-02-28");
  });
});
```

**Canonical grace fixtures (from RESEARCH):** `2026-01-21` → due `2026-02-15`; `isGraceOverdue("2026-02-15","2026-02-15")` false; `"2026-02-16"` true; null DOM → empty windows.

---

### `src/lib/validations/account.ts` (utility, request-response)

**Analog:** self — extend with dual-DOM schema / refine

**FIAT_CREDIT-gated refine** (lines 26-63) — twin for statement/due pairing + type gate:
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
    const raw = val.creditLimitMajor;
    const hasLimit =
      typeof raw === "string" && raw.trim().length > 0;

    if (val.type === "FIAT_CREDIT") {
      if (!hasLimit) {
        ctx.addIssue({
          code: "custom",
          path: ["creditLimitMajor"],
          message: "Укажите кредитный лимит",
        });
        return;
      }
      // ...
    } else if (hasLimit) {
      ctx.addIssue({
        code: "custom",
        path: ["creditLimitMajor"],
        message: "Лимит только для кредитного счёта",
      });
    }
  });
```

**Update-name schema style** (lines 65-68) — pattern for new `updateGraceScheduleSchema` (accountId + dual DOM optional/nullable):
```typescript
export const updateAccountNameSchema = z.object({
  name: accountNameSchema,
});
```

**dayOfMonth** — copy from income validations (below), not invent new range.

---

### `src/lib/validations/credit-grace.ts` (utility, request-response)

**Analog:** `src/lib/validations/income.ts` (+ debts create for amount/note)

**Shared field bricks** (income lines 2-31, 51-62):
```typescript
const asOfDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Укажите дату");

const optionalNoteSchema = z.preprocess(
  (val) => (val === "" || val === undefined ? undefined : val),
  z.string().trim().max(500).optional(),
);

const dayOfMonthSchema = z.coerce.number().int().min(1).max(31);

export const createRecurringIncomeSchema = z
  .object({
    personId: z.coerce.number().int().positive(),
    currencyCode: currencyCodeSchema,
    plannedAmountMajor: plannedAmountMajorField,
    dayOfMonth: dayOfMonthSchema,
    startAsOf: asOfDateSchema,
    note: optionalNoteSchema,
  })
  .strict()
  .superRefine(refinePositiveMajor);
```

Phase 19: schema ready for Phase 20 obligation create (amount required, `asOf` strings, note optional). No currency on obligation — inherit Account. Pairing refine for dual DOM (both null or both set) lives here or in `account.ts` update schedule schema.

**Both-null-or-both refine sketch** (RESEARCH — mirror account superRefine):
```typescript
.superRefine((val, ctx) => {
  const sSet = val.statementDayOfMonth != null;
  const dSet = val.dueDayOfMonth != null;
  if (sSet !== dSet) {
    ctx.addIssue({
      code: "custom",
      message: "Укажите обе даты или очистите обе",
    });
  }
});
```

---

### `src/app/accounts/actions.ts` (controller, request-response)

**Analog:** self — add minimal dual-DOM persist action beside `updateAccountName`

**Server action skeleton** (lines 1-15, 137-181):
```typescript
"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
import {
  createAccountSchema,
  updateAccountNameSchema,
} from "@/lib/validations/account";

export async function updateAccountName(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const idRaw = formData.get("id");
  // validate id → Zod safeParse → ensureSqlitePragmas → prisma.account.update
  // catch P2002 → revalidatePath("/accounts") + "/"
  return { success: true, message: "Сохранено" };
}
```

**Create FIAT_CREDIT write-path** (lines 51-135) — load account, enforce type before writing DOM; Russian field errors via `flatten().fieldErrors`.

**D-14 clear schedule:** before nulling both DOMs, query OPEN `CreditGraceObligation` count; reject if > 0 (action-level; schema CHECK alone insufficient).

**Error / unique** (lines 38-43, 123-129):
```typescript
function isUniqueNameViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}
```
Later obligation create (Phase 20) maps P2002 on `(accountId, cycleStartAsOf)` to D-16 duplicate error.

---

### `src/lib/validations/account.test.ts` (test, request-response)

**Analog:** self

**Type-gated accept/reject** (lines 32-56):
```typescript
it("accepts FIAT_CREDIT with positive creditLimitMajor", () => {
  const result = createAccountSchema.safeParse({
    name: "Кредитка",
    type: "FIAT_CREDIT",
    currencyCode: "RUB",
    creditLimitMajor: "1000.00",
  });
  expect(result.success).toBe(true);
});

it("rejects FIAT_CREDIT without creditLimitMajor", () => {
  const result = createAccountSchema.safeParse({
    name: "Кредитка",
    type: "FIAT_CREDIT",
    currencyCode: "RUB",
  });
  expect(result.success).toBe(false);
  if (!result.success) {
    const messages = result.error.issues.map((i) => i.message);
    expect(messages).toContain("Укажите кредитный лимит");
  }
});
```
Extend same file (or sibling) for: both DOM set OK; partial reject; ASSET with DOM reject; both null OK for credit clear path.

## Shared Patterns

### Pure lib isolation (ISO / GRISO prep)
**Source:** `src/lib/income.ts` header  
**Apply to:** `src/lib/credit-grace.ts`  
No Prisma; no imports into/from `net-worth.ts` / `historical-series.ts`.

### Calendar clamp + UTC strings
**Source:** `src/lib/dates.ts` `clampDayOfMonth`  
**Apply to:** cycle start, due, window helpers  
YYYY-MM-DD wire; never local `Date` for month math.

### FIAT_CREDIT write-path discipline
**Source:** `src/lib/validations/account.ts` + migration CHECK + `createAccount`  
**Apply to:** dual DOM fields — type-gated Zod + SQLite CHECK; non-credit must keep nulls.

### Server Action shape
**Source:** `src/app/accounts/actions.ts`  
**Apply to:** grace schedule update  
`"use server"` → FormData → Zod `safeParse` → `ensureSqlitePragmas` → Prisma → `revalidatePath` → `{ success, errors, message }`.

### Child Cascade + unique natural key
**Source:** `RecurringIncomeActual` / `DebtRepayment`  
**Apply to:** `CreditGraceObligation` — `onDelete: Cascade`, `@@unique([accountId, cycleStartAsOf])`.

### Overdue = calendar, not enum
**Source:** `isIncomeOverdue`  
**Apply to:** `isGraceOverdue` — status stays OPEN|CLOSED; overdue derived.

## No Analog Found

| File / concern | Role | Data Flow | Reason |
|----------------|------|-----------|--------|
| `closedAsOf` field on obligation | model | CRUD | Debt has OPEN\|CLOSED only — no `closedAsOf`; invent CHECK `(OPEN∧null)∨(CLOSED∧set)` per RESEARCH |
| Due = next-month DOM (not +N days) | utility | transform | New operator; clamp exists, month-advance copy from `monthsOverlapping` rollover |

## Metadata

**Analog search scope:** codegraph (`clampDayOfMonth`, `listRecurringOccurrences`, `creditLimitMinor`, `DebtStatus`, `FIAT_CREDIT`, `isIncomeOverdue`, `createAccountSchema`); `prisma/`, `src/lib/`, `src/app/accounts/`  
**Files scanned:** ~15 tracked analogs (git `ls-files` verified)  
**Pattern extraction date:** 2026-09-08  
**Tracked-source gate:** all named analogs are git-tracked (no `.gsd` mirrors)
