# Phase 31: ASSET ↔ SAVINGS type conversion - Pattern Map

**Mapped:** 2026-09-22
**Files analyzed:** 6
**Analogs found:** 6 / 6

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/accounts/AccountFormDialog.tsx` | component | request-response | same file — create type Select + savings gate (lines 139–222, 303–342) | exact |
| `src/lib/validations/account.ts` | utility | transform | same file — `createAccountSchema` type-gated refine + `updateAccountSchema` (lines 42–143) | exact |
| `src/app/accounts/actions.ts` | controller | request-response | same file — `updateAccount` + `createAccount` SAVINGS branch (lines 75–299) | exact |
| `src/app/accounts/actions.test.ts` | test | request-response | same file — `updateAccount SAVINGS` + immutability + never-calls (lines 92–335) | exact |
| `src/lib/validations/account.test.ts` | test | transform | same file — `updateAccountSchema` + create SAVINGS refine tests (lines 157–317) | exact |
| `src/components/accounts/AccountFormDialog.test.ts` | test | transform | same file — source-scan lock style (lines 1–19) | exact |

## Pattern Assignments

### `src/components/accounts/AccountFormDialog.tsx` (component, request-response)

**Analog:** `src/components/accounts/AccountFormDialog.tsx` (create path — unlock edit to mirror)

**Imports pattern** (lines 1–39):
```typescript
import {
  createAccount,
  updateAccount,
  type AccountActionState,
} from "@/app/accounts/actions";
import {
  accountTypeLabel,
  isCreditType,
  type AccountTypeSoft,
} from "@/lib/account-type";
import { formatBpsToPercentMajor } from "@/lib/savings-rate";
```

**Create type-gate (copy for edit draft)** (lines 139–142, 188–222):
```typescript
const showCreditLimit = mode === "create" && isCreditType(accountType);
const showSavingsFields =
  (mode === "create" && accountType === "SAVINGS") ||
  (mode === "edit" && account?.type === "SAVINGS"); // ← REPLACE edit branch with draft accountType

// Create Select — reuse for edit when canConvertType:
<input type="hidden" name="type" value={accountType} />
<Select
  value={accountType}
  onValueChange={(value) => {
    if (value != null) {
      const next = String(value);
      setAccountType(next);
      if (next !== "SAVINGS") {
        setAnnualRate("");
        setAccrualDom("");
      }
    }
  }}
>
```

**FIAT_CREDIT / legacy immutable type after create** (lines 224–228, 236–268):
```typescript
// Edit today: type + currency = muted labels only
<p className="text-sm text-muted-foreground">
  {account ? accountTypeLabel(account.type) : null}
</p>
// Currency edit stays label-only (D-03) — same pattern:
<p className="font-mono text-sm text-muted-foreground">
  {account?.currencyCode}
</p>
```

**Unlock condition (do NOT use `isAssetType`)** — from `src/lib/account-type.ts` (lines 15–24) soft merge includes legacy; D-14 requires exact peer check:
```typescript
const canConvertType =
  mode === "edit" &&
  account &&
  (account.type === "ASSET" || account.type === "SAVINGS");
// options: ASSET | SAVINGS only — not TYPE_OPTIONS (has FIAT_CREDIT)
// else: keep accountTypeLabel(account.type) read-only
```

**Savings fields UI** (lines 303–342) — reuse labels/errors as-is when `showSavingsFields`:
```typescript
<Label htmlFor="annual-rate">Годовой %</Label>
// name="annualRatePercentMajor" … state.errors?.annualRatePercentMajor
<Label htmlFor="accrual-dom">День начисления</Label>
// name="accrualDayOfMonth" … state.errors?.accrualDayOfMonth
```

**Success / submit copy** (lines 351–363): keep «Сохранено» from action; submit «Сохранить»; no confirm dialog.

**DialogDescription** (lines 156–160) — update when unlocked (discretion from RESEARCH): today `"Тип и валюта не меняются."` for all edit; credit/legacy keep full lock; convertible → e.g. «Валюта не меняется.»

---

### `src/lib/validations/account.ts` (utility, transform)

**Analog:** `createAccountSchema` type-gated refine + current `updateAccountSchema`

**Write-path type enum** (lines 4–6):
```typescript
/** Write-path only: new accounts are ASSET, FIAT_CREDIT, or SAVINGS (D-14, D-15). */
const accountTypeSchema = z.enum(["ASSET", "FIAT_CREDIT", "SAVINGS"]);
```

**Update schema baseline** (lines 138–143) — extend with optional convertible type:
```typescript
/** Update account: name always; optional savings fields (action gates by DB type D-08). */
export const updateAccountSchema = z.object({
  name: accountNameSchema,
  annualRatePercentMajor: z.string().optional(),
  accrualDayOfMonth: optionalDayOfMonthSchema,
});
// Phase 31 add: type: z.enum(["ASSET", "SAVINGS"]).optional(),
```

**FIAT_CREDIT / SAVINGS type-gated refine (create — reuse messages)** (lines 90–117):
```typescript
if (val.type === "SAVINGS") {
  if (!hasRate) {
    ctx.addIssue({
      code: "custom",
      path: ["annualRatePercentMajor"],
      message: "Укажите годовой процент",
    });
  } else if (!isNonNegativeMajor(rateRaw!)) {
    ctx.addIssue({
      code: "custom",
      path: ["annualRatePercentMajor"],
      message: "Процент не может быть отрицательным",
    });
  }
  if (!hasDom) {
    ctx.addIssue({
      code: "custom",
      path: ["accrualDayOfMonth"],
      message: "Укажите день начисления",
    });
  }
}
```

**Optional DOM preprocess** (lines 36–40) — keep; empty → undefined so action/schema can require when effectiveType=SAVINGS.

**Type-gate helper analog** (lines 160–169) — same style as grace DOM gate (DB type after findUnique):
```typescript
export function assertGraceDomAllowedForType(
  accountType: string,
  statementDayOfMonth: number | null,
  dueDayOfMonth: number | null,
): boolean {
  // Pattern: schema optional hint + action hard-gates from DB type
}
```

---

### `src/app/accounts/actions.ts` (controller, request-response)

**Analog:** `updateAccount` (ignore-type baseline) + `createAccount` SAVINGS persist + `updateGraceSchedule` DB-type hard reject

**Imports** (lines 1–15):
```typescript
"use server";
import { revalidatePath } from "next/cache";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
import { updateAccountSchema } from "@/lib/validations/account";
import { parsePercentToBps } from "@/lib/savings-rate";
```

**ActionState errors shape** (lines 26–33) — already has `type?`, `annualRatePercentMajor?`, `accrualDayOfMonth?`.

**FormData parse for rate/DOM** (lines 216–232) — extend with optional `type`:
```typescript
const rateRaw = formData.get("annualRatePercentMajor");
const annualRatePercentMajor =
  typeof rateRaw === "string" && rateRaw.trim() !== "" ? rateRaw : undefined;
// same for accrualDayOfMonth
const validated = updateAccountSchema.safeParse({
  name: formData.get("name"),
  annualRatePercentMajor,
  accrualDayOfMonth,
  // type: formData.get("type") or omit if absent
});
```

**Current ignore-type path (baseline to rewrite)** (lines 195–286):
```typescript
/**
 * Loads type from DB — ignores client type/currency (T-27-01). Never writes BalanceSnapshot (D-16).
 */
if (account.type === "SAVINGS") {
  // require rate+DOM → update name+bps+DOM — no type field
} else {
  await prisma.account.update({
    where: { id },
    data: { name: validated.data.name },
  });
}
```

**createAccount SAVINGS persist** (lines 153–178) — copy for ASSET→SAVINGS write:
```typescript
let annualRateBps: number | null = null;
let accrualDom: number | null = null;
if (type === "SAVINGS") {
  annualRateBps = parsePercentToBps(percent);
  accrualDom = validated.data.accrualDayOfMonth!;
}
await prisma.account.create({
  data: {
    // ...
    ...(type === "SAVINGS"
      ? { annualRateBps: annualRateBps!, accrualDayOfMonth: accrualDom! }
      : {}),
  },
});
```

**SAVINGS→ASSET null clear (Prisma — never omit)** — RESEARCH Pattern 2:
```typescript
await prisma.account.update({
  where: { id },
  data: {
    name: validated.data.name,
    type: "ASSET",
    annualRateBps: null,
    accrualDayOfMonth: null,
  },
});
```

**DB-type hard reject analog** (`updateGraceSchedule`, lines 346–348):
```typescript
if (account.type !== "FIAT_CREDIT") {
  return { message: "Даты грейса только для кредитного счёта" };
}
// Phase 31 forbidden transition: prefer generic
// message: "Не удалось сохранить. Проверьте поля и попробуйте снова."
```

**Success + revalidate** (lines 296–298):
```typescript
revalidatePath("/accounts");
revalidatePath("/");
return { success: true, message: "Сохранено" };
```

**Currency:** keep ignoring client `currencyCode` on update (D-03) — immutability test pattern below.

---

### `src/app/accounts/actions.test.ts` (test, request-response)

**Analog:** same file — Phase 27 update / immutability / never-calls

**Mock setup** (lines 1–29, 248–261):
```typescript
vi.mock("@/lib/db", () => ({
  prisma: {
    account: { create: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
    balanceSnapshot: { upsert: vi.fn(), delete: vi.fn() },
    // ...
  },
  ensureSqlitePragmas: vi.fn(),
}));
```

**Immutability / forged FormData** (lines 92–129) — ASSET name-only still ignores currency + non-convertible types; **rewrite** SAVINGS case that sets `type=ASSET` expecting ignore:
```typescript
it("writes only name — ignores tampered type/currency/limit FormData", async () => {
  formData.set("type", "CRYPTO");
  formData.set("currencyCode", "USDT");
  // expect data keys === ["name"] when dbType ASSET and no convertible request
});
```

**Current SAVINGS update that MUST flip for ACCT-04** (lines 263–287):
```typescript
formData.set("type", "ASSET"); // today ignored — Phase 31 = conversion when intentional
expect(Object.keys(data as object).sort()).toEqual(
  ["accrualDayOfMonth", "annualRateBps", "name"].sort(), // no type today
);
```

**Never BalanceSnapshot** (lines 289–300) — clone for both conversion directions:
```typescript
expect(prisma.balanceSnapshot.upsert).not.toHaveBeenCalled();
expect(prisma.balanceSnapshot.delete).not.toHaveBeenCalled();
```

**Empty rate/DOM reject** (lines 303–334) — reuse for convert-to-SAVINGS missing fields; assert Russian messages via action errors («Укажите годовой процент» / «Укажите день начисления»).

**createAccount SAVINGS persist assert** (lines 199–221) — template for ASSET→SAVINGS `update` data shape (`type: "SAVINGS"`, `annualRateBps`, `accrualDayOfMonth`).

---

### `src/lib/validations/account.test.ts` (test, transform)

**Analog:** `updateAccountSchema` + `createAccountSchema SAVINGS` describes

**Current update tests** (lines 272–316):
```typescript
describe("updateAccountSchema (ACCT-01 / D-06 / D-08)", () => {
  it("accepts name + rate + DOM for SAVINGS edit payload", () => { /* ... */ });
  it("accepts name-only (non-SAVINGS edit; action ignores savings cols)", () => { /* ... */ });
});
```

**Extend:** accept optional `type: "ASSET" | "SAVINGS"`; reject `type: "FIAT_CREDIT"` / legacy on update field (Zod enum fail → `errors.type`).

**Create SAVINGS messages** (create describe ~157+) — same strings D-12 must reuse on convert.

---

### `src/components/accounts/AccountFormDialog.test.ts` (test, transform)

**Analog:** same file source-scan style

```typescript
const dialogSrc = readFileSync(
  "src/components/accounts/AccountFormDialog.tsx",
  "utf8",
);
expect(dialogSrc).toMatch(/const\s*\[\s*name\s*,\s*setName\s*\]\s*=\s*useState/);
```

**Optional Phase 31 locks:** `canConvertType` / CONVERT options without `FIAT_CREDIT`; edit `showSavingsFields` keys off draft `accountType`; clear rate/DOM on leave SAVINGS.

## Shared Patterns

### Authentication
N/A — local single-user app; no auth middleware on account actions.

### Error Handling
**Source:** `src/app/accounts/actions.ts` (generic catch + id/not-found)
**Apply to:** Forbidden type transitions (D-15), Prisma CHECK failures
```typescript
return {
  message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
};
// Field errors: validated.error.flatten().fieldErrors
// SAVINGS missing: errors: { annualRatePercentMajor: ["Укажите годовой процент"] }
```

### Validation
**Source:** `src/lib/validations/account.ts` + action post-`findUnique` matrix
**Apply to:** `updateAccountSchema` optional type; effectiveType SAVINGS rate/DOM require
```typescript
const validated = updateAccountSchema.safeParse({ /* FormData */ });
if (!validated.success) {
  return { errors: validated.error.flatten().fieldErrors };
}
const account = await prisma.account.findUnique({ where: { id } });
// then: requested type vs dbType allow-list ASSET↔SAVINGS only
```

### Rate parsing
**Source:** `src/lib/savings-rate.ts` (lines 10–19)
**Apply to:** ASSET→SAVINGS and same-type SAVINGS update
```typescript
annualRateBps = parsePercentToBps(rate);
// catch → errors: { annualRatePercentMajor: ["Некорректный процент"] }
```

### Soft type labels (read-only path)
**Source:** `src/lib/account-type.ts` (lines 11–30)
**Apply to:** FIAT_CREDIT + legacy edit type display (D-14)
```typescript
export function isCreditType(t: string): boolean {
  return t === "FIAT_CREDIT";
}
export function accountTypeLabel(t: string): string {
  if (isCreditType(t)) return "Кредитный";
  if (t === "SAVINGS") return "Накопительный";
  return "Актив"; // includes soft legacy — unlock must NOT use isAssetType()
}
```

### Snapshot isolation (D-16)
**Source:** `src/app/accounts/actions.test.ts` (lines 289–300, GRISO never-calls ~655+)
**Apply to:** All conversion tests
```typescript
expect(prisma.balanceSnapshot.upsert).not.toHaveBeenCalled();
expect(prisma.balanceSnapshot.delete).not.toHaveBeenCalled();
```

### Revalidation
**Source:** `updateAccount` success path
**Apply to:** Unchanged after convert
```typescript
revalidatePath("/accounts");
revalidatePath("/");
```

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| — | — | — | All Phase 31 surfaces extend existing files; no greenfield modules |

**Note:** No dedicated `convertAccountType` action / MCP write tool — extend `updateAccount` only (RESEARCH primary recommendation; PARITY-01 read-only).

## Metadata

**Analog search scope:** codegraph `explore` / `query` / `callers` on `updateAccount`, `updateAccountSchema`, `AccountFormDialog`, `parsePercentToBps`; tracked sources under `src/components/accounts/`, `src/app/accounts/`, `src/lib/validations/`, `src/lib/account-type.ts`, `src/lib/savings-rate.ts`
**Files scanned:** ~8 tracked analogs (git `ls-files` verified)
**Pattern extraction date:** 2026-09-22
**Tracked-source gate:** all analog paths git-tracked (no `.gsd/` mirrors)
