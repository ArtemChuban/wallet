---
phase: 02-currencies-accounts
reviewed: 2026-09-02T21:07:49Z
depth: standard
files_reviewed: 27
files_reviewed_list:
  - prisma/migrations/20260902201000_currency_primary_rub/migration.sql
  - prisma/migrations/20260902202603_account_credit_limit/migration.sql
  - prisma/migrations/migration_lock.toml
  - prisma/schema.prisma
  - src/app/accounts/actions.test.ts
  - src/app/accounts/actions.ts
  - src/app/accounts/page.tsx
  - src/app/currencies/actions.test.ts
  - src/app/currencies/actions.ts
  - src/app/currencies/page.tsx
  - src/app/layout.tsx
  - src/components/accounts/AccountFormDialog.tsx
  - src/components/accounts/AccountList.tsx
  - src/components/currencies/CurrencyFormDialog.tsx
  - src/components/currencies/CurrencyList.tsx
  - src/components/nav.tsx
  - src/components/ui/dialog.tsx
  - src/components/ui/input.tsx
  - src/components/ui/label.tsx
  - src/components/ui/select.tsx
  - src/lib/foundation.test.ts
  - src/lib/money.test.ts
  - src/lib/money.ts
  - src/lib/validations/account.test.ts
  - src/lib/validations/account.ts
  - src/lib/validations/currency.test.ts
  - src/lib/validations/currency.ts
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-09-02T21:07:49Z
**Depth:** standard
**Files Reviewed:** 27
**Status:** issues_found

## Summary

Reviewed Currencies + Accounts vertical: Prisma migrations/schema, money BigInt helpers, Zod validators, server actions, and Russian Dialog UI. Money path and primary-RUB seed look sound; immutability of code/scale/type/currency on update is respected. Main gaps: credit-limit validation vs currency scale (misleading errors), FIAT_CREDIT invariant only in app layer, and create-account form when currency list empty.

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: Credit-limit parse failures always report "must be > 0"

**File:** `src/app/accounts/actions.ts:68-76`
**Issue:** `createAccountSchema` accepts any strictly positive major string (e.g. `1.234`) regardless of the selected currency's `scale`. When `parseMajorToMinor` then throws (`too many fractional digits`, invalid format after currency lookup), the catch maps every failure to `Введите сумму больше 0`. User with scale-2 RUB who types three fractional digits gets a wrong error and cannot tell the real rule.
**Fix:** After loading `currency.scale`, validate (or parse) with distinct messages:

```typescript
if (type === "FIAT_CREDIT") {
  const major = validated.data.creditLimitMajor!;
  try {
    creditLimitMinor = parseMajorToMinor(major, currency.scale);
  } catch (err) {
    const msg =
      err instanceof Error && err.message === "too many fractional digits"
        ? `Не больше ${currency.scale} знаков после запятой`
        : "Некорректная сумма";
    return { errors: { creditLimitMajor: [msg] } };
  }
  if (creditLimitMinor <= 0n) {
    return { errors: { creditLimitMajor: ["Введите сумму больше 0"] } };
  }
}
```

Prefer also tightening Zod (or a refine that receives scale) so invalid precision never reaches the action as "success" parse.

### WR-02: Zod accepts credit majors that currency scale cannot store

**File:** `src/lib/validations/account.ts:18-28` and `40-59`
**Issue:** `isStrictlyPositiveMajor` only checks sign/digits/scientific notation. It does not cap fractional length. Schema `safeParse` succeeds for `creditLimitMajor: "1.234"` (confirmed), so UI field errors stay empty until the action catch in WR-01. Scale is known only after DB lookup, but fractional-digit count can still be bounded in the action before/with parse — today the schema gives false confidence.
**Fix:** Either pass scale into validation after `findUnique`, or add a shared helper used by both Zod (max frac digits when scale known) and the action:

```typescript
function fracDigitCount(major: string): number {
  const m = /^[+-]?\d+(?:\.(\d+))?$/.exec(major.trim());
  return m?.[1]?.length ?? 0;
}
// after currency loaded:
if (fracDigitCount(major) > currency.scale) {
  return {
    errors: {
      creditLimitMajor: [`Не больше ${currency.scale} знаков после запятой`],
    },
  };
}
```

### WR-03: FIAT_CREDIT ↔ creditLimitMinor invariant not enforced in SQLite

**File:** `prisma/schema.prisma:28-37` and `prisma/migrations/20260902202603_account_credit_limit/migration.sql:1-11`
**Issue:** Docs/D-09/D-10 require `creditLimitMinor > 0` iff `type == FIAT_CREDIT`, and null otherwise. Migration creates nullable `creditLimitMinor` with no CHECK. Any non-UI writer (Prisma Studio, seed script, future action bug) can insert `FIAT_CREDIT` with null/≤0 or non-credit rows with a limit. App Zod+action enforce on create only; list/edit UI silently omit limit when `creditLimitMinor == null` for credit accounts (`AccountList.tsx:52-55`).
**Fix:** Add a SQLite CHECK in a follow-up migration (and keep app checks):

```sql
CHECK (
  (type = 'FIAT_CREDIT' AND creditLimitMinor IS NOT NULL AND creditLimitMinor > 0)
  OR
  (type != 'FIAT_CREDIT' AND creditLimitMinor IS NULL)
)
```

## Info

### IN-01: Partial unique index is at-most-one primary, not exactly-one

**File:** `prisma/schema.prisma:23-24` and `prisma/migrations/20260902201000_currency_primary_rub/migration.sql:20-21`
**Issue:** Comment/SUMMARY claim "exactly-one primary" via `Currency_one_primary`. Index only blocks a second `isPrimary = 1`. Zero primaries remain possible if RUB row deleted or flag cleared outside app (no delete API in this phase mitigates normal path).
**Fix:** Soften comment to "at most one primary"; optional app boot assert that `count(isPrimary)` === 1.

### IN-02: Account `currencyCode` Zod weaker than currency code rules

**File:** `src/lib/validations/account.ts:13` vs `src/lib/validations/currency.ts:4-9`
**Issue:** Currency codes require printable ASCII `^[\x20-\x7E]+$`; account create only uses `trim().min(1).max(16)`. Invalid codes fail later at `findUnique` with "Валюта не найдена" instead of format errors.
**Fix:** Reuse shared `currencyCodeSchema` from currency validations.

### IN-03: Action tests mock money with IEEE floats

**File:** `src/app/accounts/actions.test.ts:21-27`
**Issue:** `parseMajorToMinor` mock uses `Number` / `Math.round(n * 100)`. Fine for `"1000"` fixtures; will not catch BigInt/scale edge cases if tests expand. Real helper already unit-tested in `money.test.ts`.
**Fix:** Mock with real `parseMajorToMinor` or BigInt-only stub that respects scale.

---

_Reviewed: 2026-09-02T21:07:49Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
