# Phase 8: Debts schema + domain math - Pattern Map

**Mapped:** 2026-09-04
**Files analyzed:** 6
**Analogs found:** 6 / 6

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `prisma/schema.prisma` | model | CRUD | `prisma/schema.prisma` (Currency / Account / FxRate / BalanceSnapshot) | exact |
| `prisma/migrations/<ts>_debts_schema/migration.sql` | migration | CRUD | `prisma/migrations/20260903140000_fx_rate/migration.sql` | role-match |
| `src/lib/debts.ts` | utility | transform | `src/lib/net-worth.ts` (+ `src/lib/money.ts` for FX) | exact |
| `src/lib/debts.test.ts` | test | transform | `src/lib/net-worth.test.ts` (+ `src/lib/foundation.test.ts` for DISOL scan) | exact |
| `src/lib/validations/debts.ts` | utility | request-response | `src/lib/validations/balance.ts` (+ `account.ts` for enums/majors) | exact |
| `src/lib/validations/debts.test.ts` | test | request-response | `src/lib/validations/balance.test.ts` | exact |

## Pattern Assignments

### `prisma/schema.prisma` (model, CRUD)

**Analog:** `prisma/schema.prisma`

**Imports / file header** (lines 1–10):
```prisma
// Money/FX stub: BigInt → SQLite INTEGER (D-07, D-09). Currency.scale required (D-08).

generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "sqlite"
}
```

**Enum + Currency FK Restrict pattern** (lines 12–27, 43–51):
```prisma
enum AccountType {
  FIAT_DEBIT
  FIAT_CREDIT
  CRYPTO
  CASH
}

model Currency {
  code      String  @id
  name      String
  scale     Int
  isPrimary Boolean @default(false)
  accounts  Account[]
  fxRates   FxRate[]
  // Phase 8: add debts Debt[]
}

model FxRate {
  id                  Int      @id @default(autoincrement())
  currencyCode        String
  currency            Currency @relation(fields: [currencyCode], references: [code], onDelete: Restrict)
  asOfDate            String // YYYY-MM-DD
  rateToPrimaryScaled BigInt
  @@unique([currencyCode, asOfDate], name: "currencyCode_asOfDate")
}
```

**Child event / snapshot relation pattern** (lines 53–61) — **copy Restrict/Cascade/asOfDate/BigInt; do NOT copy `@@unique` onto repayments or size changes (D-08/D-09):**
```prisma
model BalanceSnapshot {
  id          Int     @id @default(autoincrement())
  accountId   Int
  account     Account @relation(fields: [accountId], references: [id], onDelete: Restrict)
  asOfDate    String // YYYY-MM-DD
  amountMinor BigInt

  @@unique([accountId, asOfDate], name: "accountId_asOfDate")
}
```

**Account name `@unique` analog for Person.name** (lines 29–41):
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
  balanceSnapshots BalanceSnapshot[]
}
```

**Apply for Phase 8 models (from RESEARCH sketch / CONTEXT D-20–D-22):**
- `Person` → `Debt`: `onDelete: Restrict`
- `Currency` → `Debt`: `onDelete: Restrict` (same as FxRate)
- `Debt` → `DebtRepayment` / `DebtSizeChange`: `onDelete: Cascade` (new vs existing Restrict-only children)
- No `writeOffMinor`, no `closedAt`, no `@@unique([debtId, asOfDate])` on event tables
- Optional `createdAt DateTime @default(now())` on both event models (Phase 11 ordering; A4)

---

### `prisma/migrations/<ts>_debts_schema/migration.sql` (migration, CRUD)

**Analog:** `prisma/migrations/20260903140000_fx_rate/migration.sql`

**Core CreateTable + FK Restrict + index pattern** (lines 1–14):
```sql
-- CreateTable
CREATE TABLE "FxRate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "currencyCode" TEXT NOT NULL,
    "asOfDate" TEXT NOT NULL,
    "rateToPrimaryScaled" BIGINT NOT NULL,
    CONSTRAINT "FxRate_currencyCode_fkey" FOREIGN KEY ("currencyCode") REFERENCES "Currency" ("code") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "FxRate_currencyCode_asOfDate_key" ON "FxRate"("currencyCode", "asOfDate");
```

**Secondary analog:** `prisma/migrations/20260903120000_balance_snapshot/migration.sql` (lines 4–14) — same INTEGER/BIGINT/`asOfDate` TEXT style.

**Apply:** Prefer `npx prisma migrate dev --name debts_schema` so Prisma emits SQL. Manual edits must:
- Use `ON DELETE RESTRICT` for Person→Debt and Currency→Debt
- Use `ON DELETE CASCADE` for Debt→events
- **Omit** unique indexes on `(debtId, asOfDate)` for event tables
- Enums as TEXT columns (Prisma SQLite mapping)

---

### `src/lib/debts.ts` (utility, transform)

**Analog:** `src/lib/net-worth.ts` (return shape / partial FX honesty)

**Imports pattern** (lines 1–4):
```typescript
import {
  convertOtherMinorToPrimaryMinor,
  creditDebtMinor,
} from "@/lib/money";
```
Debts module: import **only** `convertOtherMinorToPrimaryMinor` from `@/lib/money`. Do **not** import from `@/lib/net-worth`, `@/lib/historical-series`, or app routes (DISOL-01 / D-24).

**Input / row / exclude-reason types** (lines 12–40) — mirror structure for debt totals:
```typescript
export type NetWorthAccountInput = {
  id: number;
  type: NetWorthAccountType;
  currencyCode: string;
  currencyScale: number;
  isPrimaryCurrency: boolean;
  creditLimitMinor: bigint | null;
  locfAmountMinor: bigint | null;
  rateToPrimaryScaled: bigint | null;
  primaryScale: number;
};

export type NetWorthExcludeReason = "none" | "no_balance" | "no_fx";

export type NetWorthRow = {
  accountId: number;
  includedInTotal: boolean;
  excludeReason: NetWorthExcludeReason;
  contributionPrimaryMinor: bigint;
  nativeDisplayMinor: bigint | null;
  debtNativeMinor: bigint | null;
  primaryDisplayMinor: bigint | null;
};
```

**Primary identity + missing FX → null** (lines 42–58):
```typescript
function toPrimaryMinor(
  account: NetWorthAccountInput,
  nativeMinor: bigint,
): bigint | null {
  if (account.isPrimaryCurrency) {
    return nativeMinor;
  }
  if (account.rateToPrimaryScaled === null) {
    return null;
  }
  return convertOtherMinorToPrimaryMinor(
    nativeMinor,
    account.rateToPrimaryScaled,
    account.currencyScale,
    account.primaryScale,
  );
}
```

**Aggregate + `isPartial` pattern** (lines 60–72) — copy for `computeDebtPrimaryTotals` with `iOwePrimaryMinor` / `theyOwePrimaryMinor`:
```typescript
export function computeNetWorthRows(accounts: NetWorthAccountInput[]): {
  rows: NetWorthRow[];
  totalPrimaryMinor: bigint;
  isPartial: boolean;
} {
  const rows = accounts.map((account) => rowFor(account));
  const totalPrimaryMinor = rows.reduce(
    (sum, row) => sum + row.contributionPrimaryMinor,
    0n,
  );
  const isPartial = rows.some((row) => !row.includedInTotal);
  return { rows, totalPrimaryMinor, isPartial };
}
```

**`no_fx` exclusion pattern** (lines 131–141):
```typescript
  if (primaryDisplayMinor === null) {
    return {
      accountId: account.id,
      includedInTotal: false,
      excludeReason: "no_fx",
      contributionPrimaryMinor: 0n,
      nativeDisplayMinor: account.locfAmountMinor,
      debtNativeMinor: null,
      primaryDisplayMinor: null,
    };
  }
```

**FX conversion contract** — `src/lib/money.ts` (lines 146–156):
```typescript
export function convertOtherMinorToPrimaryMinor(
  otherMinor: bigint,
  rateToPrimaryScaled: bigint,
  otherScale: number,
  primaryScale: number,
): bigint {
  const num =
    otherMinor * rateToPrimaryScaled * 10n ** BigInt(primaryScale);
  const den = 10n ** BigInt(otherScale) * RATE_SCALE_E8;
  return num / den;
}
```

**Remaining / status / assert helpers:** no existing debt ledger — implement per RESEARCH Code Examples (D-04, D-05, D-11–D-15). Style: pure exported functions, BigInt literals (`0n`), `throw new Error(...)` like `invertRateScaled` rejects in `money.ts`. Keep Prisma out of this file (A5).

**Debt-specific shape deltas vs NW:**
- Filter **OPEN only** before aggregating (D-16)
- Split aggregates by `I_OWE` / `THEY_OWE` instead of single `totalPrimaryMinor`
- Exclude reason for missing FX stays `"no_fx"`; no `"no_balance"` for OPEN debts with remaining (caller supplies remaining)
- Never touch `creditDebtMinor` / FIAT_CREDIT naming collision

---

### `src/lib/debts.test.ts` (test, transform)

**Analog:** `src/lib/net-worth.test.ts`

**Imports + factory helper** (lines 1–18):
```typescript
import { describe, expect, it } from "vitest";
import type { NetWorthAccountInput } from "./net-worth";
import { computeNetWorthRows } from "./net-worth";

function input(
  overrides: Partial<NetWorthAccountInput> & Pick<NetWorthAccountInput, "id" | "type">,
): NetWorthAccountInput {
  return {
    currencyCode: "RUB",
    currencyScale: 2,
    isPrimaryCurrency: true,
    creditLimitMinor: null,
    locfAmountMinor: 0n,
    rateToPrimaryScaled: null,
    primaryScale: 2,
    ...overrides,
  };
}
```

**Partial FX / identity / aggregate cases to mirror** (lines 152–210):
```typescript
  it("excludes non-primary asset without FX with excludeReason no_fx", () => {
    const { totalPrimaryMinor, isPartial, rows } = computeNetWorthRows([
      input({
        id: 3,
        type: "CRYPTO",
        currencyCode: "USDT",
        isPrimaryCurrency: false,
        locfAmountMinor: 50_000n,
        rateToPrimaryScaled: null,
      }),
    ]);
    expect(totalPrimaryMinor).toBe(0n);
    expect(isPartial).toBe(true);
    expect(rows[0]!.excludeReason).toBe("no_fx");
    expect(rows[0]!.includedInTotal).toBe(false);
  });

  it("uses primary currency identity without rateToPrimaryScaled", () => {
    const { rows, totalPrimaryMinor, isPartial } = computeNetWorthRows([
      input({
        id: 5,
        type: "FIAT_DEBIT",
        locfAmountMinor: 42_00n,
        rateToPrimaryScaled: null,
      }),
    ]);
    expect(rows[0]!.includedInTotal).toBe(true);
    expect(isPartial).toBe(false);
  });
```

**Throw-assert style** — `src/lib/money.test.ts` (lines 97–100):
```typescript
  it("invertRateScaled rejects rate less than or equal to 0n", () => {
    expect(() => invertRateScaled(0n)).toThrow();
    expect(() => invertRateScaled(-1n)).toThrow();
  });
```

**DISOL-01 source-scan pattern** — adapt from `src/lib/foundation.test.ts` `readFileSync` contracts (lines 1–4, 25–27) and RESEARCH recommended gate:
```typescript
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("DISOL-01 isolation", () => {
  for (const file of [
    "src/lib/net-worth.ts",
    "src/lib/historical-series.ts",
    "src/app/page.tsx",
  ]) {
    it(`${file} does not import debts`, () => {
      const src = readFileSync(file, "utf8");
      expect(src).not.toMatch(/@\/lib\/debts|from ["']\.\/debts["']/);
    });
  }
});
```

**Schema BigInt lock (optional reinforce)** — `src/lib/money.test.ts` (lines 108–118):
```typescript
describe("schema conventions", () => {
  it("locks BigInt money/rate fields and required Currency.scale", () => {
    const schema = readFileSync("prisma/schema.prisma", "utf8");
    expect(schema).toMatch(/amountMinor\s+BigInt/);
    expect(schema).not.toMatch(/\bFloat\b/);
  });
});
```
Extend similarly for `initialAmountMinor` / `deltaMinor` / absence of `writeOffMinor` / `closedAt` if useful.

**Coverage checklist for this file:** remaining formula (D-04), status sync (D-12/D-13), over-repay + illegal size-down (D-15), initial immutability helper (DEBT-03), OPEN-only totals + isPartial (D-16–D-19), DISOL-01 scan.

---

### `src/lib/validations/debts.ts` (utility, request-response)

**Analog:** `src/lib/validations/balance.ts`

**asOfDate + strict object pattern** (lines 1–24):
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

export type SetBalanceInput = z.infer<typeof setBalanceSchema>;
```

**Enum + positive major helpers** — `src/lib/validations/account.ts` (lines 1–28, 31–38):
```typescript
import { z } from "zod";

const accountNameSchema = z.string().trim().min(1).max(120);

const accountTypeSchema = z.enum([
  "FIAT_DEBIT",
  "FIAT_CREDIT",
  "CRYPTO",
  "CASH",
]);

const MAJOR_NON_EMPTY = /^([+-]?)(\d+)(?:\.(\d+))?$/;

function isStrictlyPositiveMajor(major: string): boolean {
  // ... reject empty / scientific / non-positive
}

export const createAccountSchema = z
  .object({
    name: accountNameSchema,
    type: accountTypeSchema,
    currencyCode: currencyCodeSchema,
    creditLimitMajor: z.string().optional(),
  })
  .strict();
```

**Apply:** Ship thin Phase-9-ready schemas — `asOfDateSchema`, `DebtDirection` enum (`I_OWE` | `THEY_OWE`), person name, positive major for initial/repayment; Russian validation messages like balance/account. Domain remaining checks stay in `debts.ts` asserts, not Zod (same split as balance: “shape only” comment).

---

### `src/lib/validations/debts.test.ts` (test, request-response)

**Analog:** `src/lib/validations/balance.test.ts`

**Core pattern** (lines 1–56):
```typescript
import { describe, expect, it } from "vitest";
import { deleteBalanceSchema, setBalanceSchema } from "./balance";

describe("setBalanceSchema (BAL-01)", () => {
  it("accepts accountId, amountMajor, and past/today asOfDate YYYY-MM-DD", () => {
    const result = setBalanceSchema.safeParse({
      accountId: "3",
      amountMajor: "1000.50",
      asOfDate: "2026-09-01",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.accountId).toBe(3);
      expect(result.data.asOfDate).toBe("2026-09-01");
    }
  });

  it("rejects malformed asOfDate with Russian message", () => {
    for (const asOfDate of ["2026/09/01", "09-01-2026", "not-a-date", ""] as const) {
      const result = setBalanceSchema.safeParse({
        accountId: 1,
        amountMajor: "10",
        asOfDate,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message);
        expect(messages).toContain("Укажите дату");
      }
    }
  });
});
```

## Shared Patterns

### Money as BigInt minors
**Source:** `prisma/schema.prisma`, `src/lib/money.ts`, `src/lib/money.test.ts`  
**Apply to:** Schema fields + all helpers in `debts.ts`  
- INTEGER/BigInt only; never Float/Decimal  
- Helpers operate on `bigint`; Zod may accept major strings for later actions  

### asOfDate YYYY-MM-DD
**Source:** `src/lib/validations/balance.ts` lines 3–5; schema `FxRate` / `BalanceSnapshot`  
**Apply to:** DebtRepayment, DebtSizeChange, totals helper input  
```typescript
const asOfDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Укажите дату");
```

### FK onDelete semantics
**Source:** `FxRate` Restrict (`schema.prisma` line 46); BalanceSnapshot Restrict  
**Apply to:** Currency→Debt Restrict, Person→Debt Restrict; Debt→events **Cascade** (new; no Cascade analog in tree today — Prisma/SQL `ON DELETE CASCADE`)  

### Primary totals honesty
**Source:** `src/lib/net-worth.ts` `toPrimaryMinor` + `isPartial`  
**Apply to:** `computeDebtPrimaryTotals` — primary identity; missing FX → exclude + `isPartial`; OPEN only  

### Pure domain libs + co-located Vitest
**Source:** `src/lib/net-worth.ts` / `net-worth.test.ts`  
**Apply to:** `debts.ts` / `debts.test.ts` — no Prisma, no React  

### DISOL-01 isolation
**Source:** RESEARCH gate + `foundation.test.ts` / `money.test.ts` `readFileSync` style  
**Apply to:** `debts.test.ts` only; never add debt imports into `net-worth.ts`, `historical-series.ts`, `page.tsx`  

### Validation: shape in Zod, domain in helpers
**Source:** `balance.ts` comment “shape only”; actions hold business rules  
**Apply to:** `validations/debts.ts` vs `assertRepaymentAmount` / `assertSizeDelta` in `debts.ts`  

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| — | — | — | All Phase 8 files have role/data-flow analogs. **Partial novelty:** signed size-change ledger math and Cascade child events have no prior ledger module — copy BigInt/`throw` style from `money.ts` and RESEARCH snippets; Cascade is Prisma-standard SQL not present in prior migrations. |

## Anti-patterns (do not copy)

| Tempting analog | Why wrong for Phase 8 |
|-----------------|------------------------|
| `BalanceSnapshot @@unique([accountId, asOfDate])` | D-08/D-09 allow multiple same-day events |
| `writeOffMinor` / ROADMAP remaining formula | Superseded by CONTEXT D-01–D-04 |
| Importing into `net-worth.ts` / `historical-series.ts` | DISOL-01 / D-24 |
| `creditDebtMinor` naming for personal IOUs | NW credit-card debt collision |

## Metadata

**Analog search scope:** `prisma/`, `src/lib/`, `src/lib/validations/`, `prisma/migrations/` via codegraph (`query` / `node` / `explore`) + `git ls-files` tracked-source gate  
**Files scanned:** ~15 primary analogs (schema, net-worth, money, foundation, balance/account validations + tests, 2 migrations)  
**Pattern extraction date:** 2026-09-04  
**Tracked-source gate:** all named analogs verified via `git ls-files` (non-empty)
)
