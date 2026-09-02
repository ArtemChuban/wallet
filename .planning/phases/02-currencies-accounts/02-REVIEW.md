---
phase: 02-currencies-accounts
reviewed: 2026-09-02T22:50:00Z
depth: standard
files_reviewed: 28
files_reviewed_list:
  - .gitignore
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
  warning: 6
  info: 6
  total: 12
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-09-02T22:50:00Z
**Depth:** standard
**Files Reviewed:** 28
**Status:** issues_found

## Summary

Standard-depth review of Currencies + Accounts (schema/migrations, Zod, server actions, Russian Dialog UI, money helpers, tests). Core contracts hold: migration-seeded primary RUB + partial unique index, `createCurrency` forces `isPrimary: false`, name-only updates, FIAT_CREDIT credit-limit → `creditLimitMinor` via BigInt parse, no delete/primary-switch exports. Defects cluster around credit-limit error UX, missing DB CHECK for D-09/D-10, empty-currency create path, and cache invalidation when currencies change.

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: Credit-limit parse failures always report "must be > 0"

**File:** `src/app/accounts/actions.ts:68-76`
**Issue:** After Zod accepts a strictly positive major string, `parseMajorToMinor` can still throw (e.g. `too many fractional digits` for `"1.234"` on scale-2 RUB). The catch maps every failure to `Введите сумму больше 0`, so users cannot distinguish precision/format errors from non-positive amounts.
**Fix:**

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

### WR-02: Zod accepts credit majors that currency scale cannot store

**File:** `src/lib/validations/account.ts:18-28` and `40-59`
**Issue:** `isStrictlyPositiveMajor` does not cap fractional length. `createAccountSchema.safeParse` succeeds for `creditLimitMajor: "1.234"`; field errors stay empty until the action catch in WR-01. Scale is known only after DB lookup, but fractional-digit rejection should happen next to parse with an explicit message, not only via a generic catch.
**Fix:** After `findUnique`, reject excess fractional digits before/with parse:

```typescript
function fracDigitCount(major: string): number {
  const m = /^[+-]?\d+(?:\.(\d+))?$/.exec(major.trim());
  return m?.[1]?.length ?? 0;
}
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
**Issue:** D-09/D-10 require `creditLimitMinor > 0` iff `type == FIAT_CREDIT`, else null. Migration adds nullable `creditLimitMinor` with no CHECK. Non-UI writers (Prisma Studio, seeds, future bugs) can insert invalid rows. App Zod+action enforce on create only; list/edit omit the limit when `creditLimitMinor == null` for credit accounts (`AccountList.tsx:52-55`), so bad data is silent in UI.
**Fix:** Follow-up migration CHECK (keep app checks):

```sql
CHECK (
  (type = 'FIAT_CREDIT' AND creditLimitMinor IS NOT NULL AND creditLimitMinor > 0)
  OR
  (type != 'FIAT_CREDIT' AND creditLimitMinor IS NULL)
)
```

### WR-04: Create-account submit stays enabled when currency list is empty

**File:** `src/components/accounts/AccountFormDialog.tsx:95-99`, `214`, `279-282`
**Issue:** Create mode sets `currencyCode` to `currencies[0]?.code ?? ""` and disables only the currency `Select` when `currencies.length === 0`. Submit remains enabled (`disabled={isPending}` only). User can open «Новый счёт» with no currencies and POST empty `currencyCode`, getting a Zod/min-length or «Валюта не найдена» path instead of a blocked create. Empty-state and header both mount this dialog without a currencies guard.
**Fix:**

```tsx
<Button
  type="submit"
  disabled={isPending || (mode === "create" && currencies.length === 0)}
>
  {isPending ? "Сохранение…" : submitLabel}
</Button>
```

Also show a short Russian hint when `currencies.length === 0` (e.g. «Сначала добавьте валюту») and/or hide the create trigger on the accounts page until currencies exist.

### WR-05: Currency mutations do not revalidate `/accounts`

**File:** `src/app/currencies/actions.ts:66` and `99`
**Issue:** `createCurrency` / `updateCurrencyName` only call `revalidatePath("/currencies")`. The accounts page loads currencies for the create dialog (`accounts/page.tsx:14-17`). After adding or renaming a currency, a subsequent navigation to `/accounts` can still serve a cached RSC payload without the new/renamed currency in the Select until a broader refresh.
**Fix:**

```typescript
revalidatePath("/currencies");
revalidatePath("/accounts");
```

### WR-06: Account id parsing accepts non-decimal Number coercion

**File:** `src/app/accounts/actions.ts:111-116`
**Issue:** `Number(idRaw)` accepts values like `"1e2"` / `"07"` as integers `100` / `7`. Tampered FormData can target an unexpected account id while still passing `Number.isInteger(id) && id > 0`.
**Fix:**

```typescript
const idRaw = formData.get("id");
if (typeof idRaw !== "string" || !/^\d+$/.test(idRaw.trim())) {
  return {
    message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
  };
}
const id = Number(idRaw.trim());
```

## Info

### IN-01: Partial unique index is at-most-one primary, not exactly-one

**File:** `prisma/schema.prisma:23-24` and `prisma/migrations/20260902201000_currency_primary_rub/migration.sql:20-21`
**Issue:** Comments claim "exactly-one primary" via `Currency_one_primary`. Index only blocks a second `isPrimary = 1`. Zero primaries remain possible if RUB is deleted or the flag cleared outside the app (no delete API in this phase mitigates the normal path).
**Fix:** Soften comment to "at most one primary"; optional boot assert that `count(isPrimary) === 1`.

### IN-02: Account `currencyCode` Zod weaker than currency code rules

**File:** `src/lib/validations/account.ts:13` vs `src/lib/validations/currency.ts:4-9`
**Issue:** Currency codes require printable ASCII `^[\x20-\x7E]+$`; account create only uses `trim().min(1).max(16)`. Invalid codes fail later at `findUnique` with «Валюта не найдена» instead of a format error.
**Fix:** Reuse a shared `currencyCodeSchema` from currency validations.

### IN-03: Action tests mock money with IEEE floats

**File:** `src/app/accounts/actions.test.ts:21-27`
**Issue:** `parseMajorToMinor` mock uses `Number` / `Math.round(n * 100)`. Fine for `"1000"` fixtures; will not catch BigInt/scale edge cases if tests expand. Real helper is covered in `money.test.ts`.
**Fix:** Mock with real `parseMajorToMinor` or a BigInt-only stub that respects scale.

### IN-04: Success close effect depends on unstable `onSuccess` identity

**File:** `src/components/currencies/CurrencyFormDialog.tsx:67-71` and `src/components/accounts/AccountFormDialog.tsx:107-111`
**Issue:** `onSuccess={() => setOpen(false)}` is a new function every parent render. The FormBody `useEffect` depends on `[state, onSuccess]`, so it re-runs on parent re-renders while the dialog is open. Harmless today (`setOpen(false)` / no-op when `success` is false) but noisy and easy to break if close logic grows.
**Fix:** Pass `setOpen` into FormBody (or use `useEffectEvent`) and close on `state?.success` without depending on a fresh callback identity.

### IN-05: Dialog chrome is English in a Russian UI

**File:** `src/components/ui/dialog.tsx:75` and `113`
**Issue:** Close control uses English `"Close"` / `sr-only` text while app copy and `lang="ru"` are Russian. Screen readers announce English chrome on Russian flows.
**Fix:** Use `Закрыть` (or accept a `closeLabel` prop defaulting to Russian).

### IN-06: Geist font subsets omit Cyrillic

**File:** `src/app/layout.tsx:6-14`
**Issue:** `Geist` / `Geist_Mono` load `subsets: ["latin"]` while UI strings are Russian. Cyrillic will fall back to system fonts, so heading/body metrics may not match the intended typeface.
**Fix:** Add Cyrillic-capable subset/family (or a font that covers `cyrillic`) if brand typography must match Latin.

---

_Reviewed: 2026-09-02T22:50:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
