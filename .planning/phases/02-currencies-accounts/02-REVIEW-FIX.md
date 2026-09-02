---
phase: 02-currencies-accounts
fixed_at: 2026-09-02T22:55:00Z
review_path: .planning/phases/02-currencies-accounts/02-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 6
skipped: 0
status: all_fixed
---

# Phase 02: Code Review Fix Report

**Fixed at:** 2026-09-02T22:55:00Z
**Source review:** `.planning/phases/02-currencies-accounts/02-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope: 6
- Fixed: 6
- Skipped: 0

**Verification:** Tier 1 re-read on every fix. Tier 2 `tsc` attempted from worktree (pre-existing `@/generated/prisma` resolve gaps in isolated worktree — ignored). Gates not run against main-checkout `node_modules`; syntax/structure verified by re-read in isolated worktree before each commit.

## Fixed Issues

### WR-01: Credit-limit parse failures always report "must be > 0"

**Files modified:** `src/app/accounts/actions.ts`
**Commit:** `81456b5`
**Applied fix:** Map `too many fractional digits` to scale-specific Russian message; other parse errors to «Некорректная сумма»; keep «больше 0» only for `<= 0n`.

### WR-02: Zod accepts credit majors that currency scale cannot store

**Files modified:** `src/app/accounts/actions.ts`
**Commit:** `87e28ac`
**Applied fix:** Added `fracDigitCount` and reject excess fractional digits after currency lookup, before `parseMajorToMinor`.

### WR-03: FIAT_CREDIT ↔ creditLimitMinor invariant not enforced in SQLite

**Files modified:** `prisma/schema.prisma`, `prisma/migrations/20260903005200_account_credit_limit_check/migration.sql`
**Commit:** `9614ae5`
**Applied fix:** Follow-up SQLite table-redefine migration with `Account_credit_limit_invariant` CHECK; documented constraint on schema field.

### WR-04: Create-account submit stays enabled when currency list is empty

**Files modified:** `src/components/accounts/AccountFormDialog.tsx`
**Commit:** `087f7d8`
**Applied fix:** Disable submit in create mode when `currencies.length === 0`; show «Сначала добавьте валюту» hint.

### WR-05: Currency mutations do not revalidate `/accounts`

**Files modified:** `src/app/currencies/actions.ts`
**Commit:** `f2aecd7`
**Applied fix:** Call `revalidatePath("/accounts")` after create and name-update success paths.

### WR-06: Account id parsing accepts non-decimal Number coercion

**Files modified:** `src/app/accounts/actions.ts`
**Commit:** `ac67162`
**Applied fix:** Require `/^\d+$/` on trimmed id FormData before `Number(...)`.

---

_Fixed: 2026-09-02T22:55:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
