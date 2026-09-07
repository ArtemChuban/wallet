# Phase 13: Income schema + domain math - Pattern Map

**Mapped:** 2026-09-07
**Files analyzed:** 7
**Analogs found:** 7 / 7

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `prisma/schema.prisma` | model | CRUD | `prisma/schema.prisma` (Debt / DebtRepayment / Person / Currency) | exact |
| `prisma/migrations/<ts>_income_schema/migration.sql` | migration | batch | `prisma/migrations/20260904180755_debts_schema/migration.sql` | exact |
| `src/lib/dates.ts` | utility | transform | `src/lib/dates.ts` (`addCalendarDays` UTC) | exact |
| `src/lib/dates.test.ts` | test | transform | `src/lib/dates.test.ts` | exact |
| `src/lib/income.ts` | service | transform | `src/lib/debts.ts` | role-match |
| `src/lib/income.test.ts` | test | transform | `src/lib/debts.test.ts` (+ `disol.test.ts` for ISO scan) | exact |
| `src/lib/foundation.test.ts` | test | batch | `src/lib/foundation.test.ts` (migrate allowlist) | exact |

## Pattern Assignments

### `prisma/schema.prisma` (model, CRUD)

**Analog:** `prisma/schema.prisma` — Debt parent + Cascade child + Person/Currency Restrict

**Parent definition pattern** (lines 48–65) — copy FK Restrict, BigInt money, optional `note`, timestamps, child relation array:
```prisma
model Debt {
  id                 Int              @id @default(autoincrement())
  personId           Int
  person             Person           @relation(fields: [personId], references: [id], onDelete: Restrict)
  direction          DebtDirection
  currencyCode       String
  currency           Currency         @relation(fields: [currencyCode], references: [code], onDelete: Restrict)
  initialAmountMinor BigInt
  /// Create-time open calendar date (YYYY-MM-DD); series start (D-08). Immutable after create.
  openedAsOf         String
  dueDate            String? // YYYY-MM-DD
  note               String?
  status             DebtStatus       @default(OPEN)
  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt
  repayments         DebtRepayment[]
  sizeChanges        DebtSizeChange[]
}
```

**Cascade actual / event child** (lines 67–75) — mirror for `RecurringIncomeActual` / `OneTimeIncomeActual` (`onDelete: Cascade`, BigInt amount, optional note, YYYY-MM-DD string):
```prisma
model DebtRepayment {
  id          Int      @id @default(autoincrement())
  debtId      Int
  debt        Debt     @relation(fields: [debtId], references: [id], onDelete: Cascade)
  asOfDate    String // YYYY-MM-DD
  amountMinor BigInt
  note        String?
  createdAt   DateTime @default(now())
}
```

**Inverse relations on Person / Currency** (lines 19–28, 40–46) — add `recurringIncomes` / `oneTimeIncomes` arrays beside `debts`:
```prisma
model Currency {
  // ...
  debts     Debt[]
}

model Person {
  // ...
  debts     Debt[]
}
```

**Slot uniqueness analog** (not on DebtRepayment — use FxRate / BalanceSnapshot style, lines 108–118):
```prisma
  @@unique([currencyCode, asOfDate], name: "currencyCode_asOfDate")
  // ...
  @@unique([accountId, asOfDate], name: "accountId_asOfDate")
```
Income actuals: `@@unique([recurringIncomeId, plannedAsOf])` / `@@unique([oneTimeIncomeId, plannedAsOf])` per D-09.

**Do not copy:** Debt enums (`DebtDirection` / `DebtStatus`), `DebtSizeChange`, Account/BalanceSnapshot — income is side ledger without NW writers.

---

### `prisma/migrations/<ts>_income_schema/migration.sql` (migration, batch)

**Analog:** `prisma/migrations/20260904180755_debts_schema/migration.sql`

**CREATE TABLE + Restrict FK** (lines 10–23):
```sql
CREATE TABLE "Debt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "personId" INTEGER NOT NULL,
    "direction" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "initialAmountMinor" BIGINT NOT NULL,
    "dueDate" TEXT,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Debt_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Debt_currencyCode_fkey" FOREIGN KEY ("currencyCode") REFERENCES "Currency" ("code") ON DELETE RESTRICT ON UPDATE CASCADE
);
```

**Cascade child** (lines 26–34):
```sql
CREATE TABLE "DebtRepayment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "debtId" INTEGER NOT NULL,
    "asOfDate" TEXT NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DebtRepayment_debtId_fkey" FOREIGN KEY ("debtId") REFERENCES "Debt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
```

**Also copy:** Prisma-generated unique indexes for `@@unique` on actuals (see FxRate/BalanceSnapshot migrations for `CREATE UNIQUE INDEX` shape). Name migration folder `*_income_schema` so `foundation.test.ts` can assert `migration_name.includes("income_schema")`.

---

### `src/lib/dates.ts` (utility, transform)

**Analog:** same file — UTC calendar helpers

**Imports / export style** (lines 1–11): plain TS, no Prisma, documented client-safe:
```typescript
/**
 * Calendar date display helpers (UI-SPEC: DD.MM.YYYY display, YYYY-MM-DD wire).
 */

export type RangePreset = "30d" | "90d" | "1y" | "all";
```

**UTC day math core** (lines 39–49) — `clampDayOfMonth` must use same UTC family (`Date.UTC`, `getUTCDate`, zero-pad):
```typescript
export function addCalendarDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) {
    throw new Error(`invalid ISO date: ${iso}`);
  }
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}
```

**Prescribed clamp** (from RESEARCH; place next to `addCalendarDays`):
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

**Reuse at call sites:** `calendarDateToday` (lines 12–26) for overdue `today` injection — do not bake Moscow today inside occurrence list API (D-13).

---

### `src/lib/dates.test.ts` (test, transform)

**Analog:** same file

**Vitest + `@/` import** (lines 1–7):
```typescript
import { describe, expect, it } from "vitest";
import {
  addCalendarDays,
  formatAsOfDisplay,
  parseAsOfDisplay,
  windowStartForPreset,
} from "@/lib/dates";
```

**Leap / boundary matrix style** (lines 27–35) — extend with clamp cases (31→Feb leap/non-leap, 31→Apr):
```typescript
describe("addCalendarDays", () => {
  it("handles leap-day safe subtract", () => {
    expect(addCalendarDays("2024-03-01", -1)).toBe("2024-02-29");
    expect(addCalendarDays("2025-03-01", -1)).toBe("2025-02-28");
  });
});
```

---

### `src/lib/income.ts` (service, transform)

**Analog:** `src/lib/debts.ts` — pure domain, no Prisma, bigint literals, injected as-of/today

**Imports pattern** (line 1) — income should import `@/lib/dates` (`clampDayOfMonth`); **must not** import `@/lib/net-worth` / `@/lib/historical-series` / Prisma:
```typescript
import { convertOtherMinorToPrimaryMinor, minorToMajorNumber } from "@/lib/money";
```
For income prefer:
```typescript
import { clampDayOfMonth } from "@/lib/dates";
```

**Pure helper + bigint style** (lines 10–29):
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

**Injected as-of / today at call site** (lines 35–50, 249–254) — same pattern for `list*Occurrences(defs, actuals, from, to)` and `isIncomeOverdue(..., today)`:
```typescript
export function remainingMinorAsOf(
  initialAmountMinor: bigint,
  sizeChanges: readonly { asOfDate: string; deltaMinor: bigint }[],
  repayments: readonly { asOfDate: string; amountMinor: bigint }[],
  asOfDate: string,
): bigint {
  return remainingMinor(
    initialAmountMinor,
    sizeChanges
      .filter((s) => s.asOfDate <= asOfDate)
      .map((s) => s.deltaMinor),
    repayments
      .filter((r) => r.asOfDate <= asOfDate)
      .map((r) => r.amountMinor),
  );
}
```

**Immutable-after-fact assert style** (lines 116–123) — useful later for one-time plan freeze (D-08); Phase 13 may export a pure predicate helper:
```typescript
export function assertInitialImmutable(
  storedInitialMinor: bigint,
  proposedInitialMinor: bigint,
): void {
  if (proposedInitialMinor !== storedInitialMinor) {
    throw new Error("initialAmountMinor is immutable after create");
  }
}
```

**API shape to implement (RESEARCH):** `listRecurringOccurrences`, `listOneTimeOccurrences`, thin `listAllInRange` merge; inclusive `[from, to]`; month-keyed freeze merge for D-07; no default horizon.

---

### `src/lib/income.test.ts` (test, transform)

**Analog:** `src/lib/debts.test.ts` (domain + schema lock); `src/lib/disol.test.ts` (optional ISO file-scan)

**Vitest + relative/pure imports** (lines 1–15):
```typescript
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { DebtPrimaryTotalsInput } from "./debts";
import {
  remainingMinor,
  statusForRemaining,
} from "./debts";
```

**BigInt path tests** (lines 31–35):
```typescript
describe("DEBT-02 remaining (CONTEXT D-04 size-change ledger)", () => {
  it("initial only: remaining equals initialAmountMinor", () => {
    expect(remainingMinor(10_000n, [], [])).toBe(10_000n);
  });
});
```

**Schema file-lock** (lines 263–282) — mirror for four income models + unique + Cascade/Restrict:
```typescript
describe("schema conventions (Person/Debt/events)", () => {
  const schema = readFileSync("prisma/schema.prisma", "utf8");

  it("defines Person, Debt, DebtRepayment, DebtSizeChange with BigInt money", () => {
    expect(schema).toMatch(/model Debt\b/);
    expect(schema).toMatch(/initialAmountMinor\s+BigInt/);
  });

  it("uses Restrict/Cascade onDelete and no writeOff/closedAt", () => {
    expect(schema).toMatch(/onDelete:\s*Restrict/);
    expect(schema).toMatch(/onDelete:\s*Cascade/);
  });
});
```
Income targets from RESEARCH:
```typescript
expect(schema).toMatch(/model RecurringIncome/);
expect(schema).toMatch(/model OneTimeIncome/);
expect(schema).toMatch(/plannedAmountMinor\s+BigInt/);
expect(schema).toMatch(/@@unique\(\[recurringIncomeId,\s*plannedAsOf\]\)/);
```

**Isolation file-scan** (`src/lib/disol.test.ts` lines 1–15) — optional Phase 13 light INISO (scan `income.ts` has no NW imports, and/or NW files do not import income):
```typescript
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("DISOL-01 isolation", () => {
  for (const file of [
    "src/lib/net-worth.ts",
    "src/lib/historical-series.ts",
    "src/app/page.tsx",
  ]) {
    it(`${file} does not import debts domain module`, () => {
      const src = readFileSync(file, "utf8");
      expect(src).not.toMatch(/@\/lib\/debts|from ["']\.\/debts["']/);
    });
  }
});
```

**Money schema lock companion** (`src/lib/money.test.ts` lines 108–117) — keep Float/Decimal ban; income BigInt fields covered by income/debts-style schema describe.

---

### `src/lib/foundation.test.ts` (test, batch)

**Analog:** same file — migrate deploy allowlist

**Table IN-list + migration name asserts** (lines 117–155) — **must** extend when adding income tables:
```typescript
      const tables = db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('Currency','Account','FxRate','BalanceSnapshot','Person','Debt','DebtRepayment','DebtSizeChange','_prisma_migrations')",
        )
        .all() as Array<{ name: string }>;
      expect(tables.map((t) => t.name).sort()).toEqual([
        "Account",
        "BalanceSnapshot",
        "Currency",
        "Debt",
        "DebtRepayment",
        "DebtSizeChange",
        "FxRate",
        "Person",
        "_prisma_migrations",
      ].sort());
      // ...
      expect(
        applied.some((r) => r.migration_name.includes("debts_schema")),
      ).toBe(true);
```

**Required edits:** add `RecurringIncome`, `OneTimeIncome`, `RecurringIncomeActual`, `OneTimeIncomeActual` to IN-list + expected sorted array; add `applied.some(...includes("income_schema"))`.

## Shared Patterns

### Side-ledger schema (Restrict parent FK, Cascade events)
**Source:** `prisma/schema.prisma` Debt / DebtRepayment
**Apply to:** All four income models + Person/Currency relations
```prisma
person   Person   @relation(fields: [personId], references: [id], onDelete: Restrict)
currency Currency @relation(fields: [currencyCode], references: [code], onDelete: Restrict)
// child:
debt Debt @relation(fields: [debtId], references: [id], onDelete: Cascade)
```

### Pure domain lib (no Prisma, bigint, inject today/range)
**Source:** `src/lib/debts.ts`
**Apply to:** `src/lib/income.ts`
- Export typed inputs + pure functions
- Callers pass window / today (D-13)
- Never import NW / historical-series

### UTC calendar strings
**Source:** `src/lib/dates.ts`
**Apply to:** `clampDayOfMonth` + occurrence `plannedAsOf`
```typescript
const dt = new Date(Date.UTC(y, m - 1, d));
// clamp last day: new Date(Date.UTC(year, month1to12, 0)).getUTCDate()
```

### Vitest schema + isolation locks
**Source:** `src/lib/debts.test.ts`, `src/lib/disol.test.ts`
**Apply to:** `src/lib/income.test.ts`
- `readFileSync("prisma/schema.prisma")` regex locks
- Optional file-scan: income ↛ net-worth / historical-series

### Migrate deploy gate
**Source:** `src/lib/foundation.test.ts`
**Apply to:** same file after migration
- Extend sqlite_master allowlist + `income_schema` migration name assert

### Money BigInt only
**Source:** `src/lib/money.ts` / `money.test.ts`
**Apply to:** plan/actual amounts in domain + tests (`100_00n` style); reuse converters only in later UI phases

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| — | — | — | All Phase 13 files have tracked analogs |

**Note:** Recurring DOM freeze-merge + virtual occurrence listing has **no prior income module**; closest role analog is `debts.ts` (pure transform over in-memory events). Algorithm detail comes from RESEARCH Pattern 3, not an existing function to copy verbatim.

## Metadata

**Analog search scope:** `prisma/`, `prisma/migrations/`, `src/lib/`
**Files scanned:** ~20 `src/lib/*.ts` + schema + debts migration (tracked via `git ls-files`)
**Pattern extraction date:** 2026-09-07
**Tracked-source gate:** all named analogs confirmed git-tracked
