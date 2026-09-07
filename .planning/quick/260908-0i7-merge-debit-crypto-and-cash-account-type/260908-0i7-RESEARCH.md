# Quick 260908-0i7: Merge debit/crypto/cash → ASSET — Research

**Researched:** 2026-09-08
**Domain:** Prisma SQLite enum soft-compat + Zod write gate + account UI/NW
**Confidence:** HIGH (codebase-verified; no new packages)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- New enum value: `ASSET`; `FIAT_CREDIT` unchanged; former `FIAT_DEBIT` / `CRYPTO` / `CASH` unify under `ASSET`
- Soft compat: writes use only `ASSET`; reads still accept legacy `FIAT_DEBIT` / `CRYPTO` / `CASH` until later cleanup
- Do not hard-drop old enum values in this quick task
- Existing rows may stay on legacy types for now; new/edited accounts persist as `ASSET`
- Create/edit UI: single “Asset” choice + currency picker only — no crypto/cash/bank type chips
- `ASSET` accepts any allowed currency (fiat + crypto codes on same list); no type↔currency lock

### Claude's Discretion
- How soft-compat is expressed in Prisma/Zod (keep enum members + normalize on write, or dual schema read/write)
- Where to normalize legacy types for display/grouping (treat as ASSET in UI)
- Seed/test fixture updates needed for soft-compat path
- Exact Russian/English labels for “Asset” in UI

### Deferred Ideas (OUT OF SCOPE)
- Credit improvements (limit/grace) — separate todo
- Hard-drop of legacy enum values / forced row rewrite cleanup pass
</user_constraints>

## Summary

Repo already treats non-credit accounts identically in NW math: only `type === "FIAT_CREDIT"` branches; everything else is asset LOCF → primary. Merge is mostly enum/UI/validation surface, not algorithm change.

**Primary recommendation:** Add `ASSET` to Prisma + keep legacy members; Zod **write** schema = `ASSET | FIAT_CREDIT` only; shared `isCreditType` / `displayAccountType` helpers map legacy → Asset for UI; leave DB rows as-is this task; update seed + create-path tests to `ASSET`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary | Rationale |
|------------|--------------|-----------|-----------|
| Canonical enum + CHECK | Database / Storage | — | Prisma `AccountType` + SQLite CHECK on `Account` |
| Write validation | API / Backend | — | Zod `createAccountSchema` + `createAccount` action |
| Create/edit type UX | Browser / Client | — | `AccountFormDialog` TYPE_OPTIONS |
| List/dashboard labels | Browser / Client | SSR page | `AccountList` / `page.tsx` `isCredit` |
| NW / charts branching | API/lib (pure) | Browser | `net-worth.ts` / `historical-series.ts` credit vs asset |

## Standard Stack

No new packages. Existing: Prisma 7.10 + SQLite TEXT enum, Zod 4.5, Next.js App Router server actions, Vitest 4.1.

**Installation:** none

## Package Legitimacy Audit

N/A — no external packages added.

## Soft-compat pattern (prescriptive)

### Prisma
1. Extend enum only — do **not** remove members:

```prisma
enum AccountType {
  ASSET
  FIAT_DEBIT   // legacy read
  FIAT_CREDIT
  CRYPTO       // legacy read
  CASH         // legacy read
}
```

2. SQLite stores `type` as `TEXT` (no native enum DDL). Adding `ASSET` needs schema + `prisma generate`; SQL migration may be empty. `[VERIFIED: prisma/migrations/20260902202603_account_credit_limit/migration.sql:2-8]` — `"type" TEXT NOT NULL`

3. Existing CHECK already accepts any non-`FIAT_CREDIT` with `creditLimitMinor IS NULL`:

```13:17:prisma/migrations/20260903005200_account_credit_limit_check/migration.sql
    CONSTRAINT "Account_credit_limit_invariant" CHECK (
        (type = 'FIAT_CREDIT' AND creditLimitMinor IS NOT NULL AND creditLimitMinor > 0)
        OR
        (type != 'FIAT_CREDIT' AND creditLimitMinor IS NULL)
    )
```

→ Writing `ASSET` + null limit **does not** require CHECK rewrite. `[VERIFIED: that file:13-17]`

4. Do **not** `UPDATE … SET type='ASSET'` in this task (locked soft-compat / rows may stay legacy).

### Zod + action
- **Write:** `z.enum(["ASSET", "FIAT_CREDIT"])` inside `createAccountSchema`; creditLimit refine stays `FIAT_CREDIT`-only; non-credit reject limit unchanged.
- **Do not** accept legacy types on create (even if Prisma still has them) — locked “writes ASSET only”.
- `createAccount` persists `validated.data.type` as today (`src/app/accounts/actions.ts` ~115–121) — after Zod gate that is only `ASSET|FIAT_CREDIT`.

### Shared helper (discretion → recommend)
Add thin `src/lib/account-type.ts` (or colocate in validations):

| Export | Behavior |
|--------|----------|
| `isCreditType(t)` | `t === "FIAT_CREDIT"` |
| `isAssetType(t)` | `ASSET \| FIAT_DEBIT \| CRYPTO \| CASH` |
| `accountTypeLabel(t)` | credit → `Кредитный`; asset+legacy → `Актив` |

Replace duplicated unions/`TYPE_LABELS`/`isCredit` checks that currently special-case three asset enums.

### UI
- `TYPE_OPTIONS`: only `{ ASSET: "Актив" }`, `{ FIAT_CREDIT: "Кредитный" }`. Default create = `ASSET` (was `FIAT_DEBIT`).
- Edit read-only type line uses `accountTypeLabel` so legacy rows show **Актив**, not Дебетовый/Крипто/Наличные.
- Currency select already lists all currencies with no type filter — keep as-is (locked).

### NW / charts
- Extend `NetWorthAccountType` with `"ASSET"` **and keep legacy** for soft read.
- Keep branching `=== "FIAT_CREDIT"` (already correct for asset path). Optional: `isCreditType` for consistency.
- No change to contribution math.

## Integration blast radius

| Area | Path | Change |
|------|------|--------|
| Schema | `prisma/schema.prisma` | add `ASSET` |
| Seed | `prisma/seed.ts` | non-credit → `ASSET` |
| Zod | `src/lib/validations/account.ts` (+ `.test.ts`) | write enum; tests for ASSET + reject legacy write |
| Action | `src/app/accounts/actions.ts` (+ `.test.ts`) | create cases use `ASSET`; stop looping CRYPTO/CASH create |
| Form | `AccountFormDialog.tsx` | 2 options; default ASSET |
| List / set-balance | `AccountList.tsx`, `SetBalanceDialog.tsx` | unions + labels via helper |
| NW types | `net-worth.ts`, `historical-series.ts`, `page.tsx`, dashboard comps | union + labels if shown |
| Fixtures | `net-worth.test.ts`, `historical-series.test.ts`, `iniso.test.ts` | prefer keep some legacy types to prove soft-compat reads; add ≥1 `ASSET` case |

## Don't Hand-Roll

| Problem | Don't | Use |
|---------|-------|-----|
| Credit vs asset branching | Re-implement per component string lists | `isCreditType` / `isAssetType` |
| Enum DB migration for SQLite TEXT | Table rebuild to “drop” legacy | Keep members; later cleanup task |
| Type↔currency rules | Hardcode crypto codes on ASSET | Existing Currency table + picker |

## Runtime State Inventory

| Category | Items Found | Action |
|----------|-------------|--------|
| Stored data | Local SQLite `Account.type` may be `FIAT_DEBIT`/`CRYPTO`/`CASH` | Leave rows; app must read them. No forced UPDATE this task |
| Live service config | None — local Docker/SQLite app | — |
| OS-registered state | None | — |
| Secrets/env vars | None tied to account type strings | — |
| Build artifacts | `src/generated/prisma/enums.ts` after `prisma generate` | Regenerate; do not hand-edit |

## Common Pitfalls

1. **Hard-drop enum members** → Prisma/client cannot read existing rows; violates lock.
2. **Zod still allows FIAT_DEBIT/CRYPTO/CASH on create** → soft-compat write rule broken; UI chips can return via tampered FormData.
3. **`Record<AccountType, string>` missing keys** → TS/runtime gaps when adding `ASSET` but leaving legacy labels incomplete.
4. **Seed still emits CRYPTO/CASH** → fresh envs never exercise ASSET write path.
5. **Tests that assert “four create types”** (`account.test.ts`, `actions.test.ts`) fail or encode old product contract — rewrite to ASSET + FIAT_CREDIT create; separate read-compat tests for legacy if needed.
6. **Assuming CHECK blocks ASSET** — false; CHECK is FIAT_CREDIT vs everything else. `[VERIFIED]`
7. **Changing NW to only accept ASSET** — breaks LOCF/dashboard for unmigrated rows.

## Code Examples

### Write Zod (recommended)

```typescript
// Source: pattern aligned with src/lib/validations/account.ts:5-10,31-67
const accountTypeWriteSchema = z.enum(["ASSET", "FIAT_CREDIT"]);
// createAccountSchema.type = accountTypeWriteSchema
// superRefine: creditLimit only when type === "FIAT_CREDIT"; else reject limit
```

### Display normalize

```typescript
const LEGACY_ASSET = new Set(["FIAT_DEBIT", "CRYPTO", "CASH", "ASSET"]);
export function isCreditType(t: string): boolean {
  return t === "FIAT_CREDIT";
}
export function accountTypeLabel(t: string): string {
  return isCreditType(t) ? "Кредитный" : "Актив";
}
```

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Label «Актив» is preferred RU copy | UI | User may want «Дебет»/«Счёт» — trivial string swap |
| A2 | Empty Prisma SQL migration acceptable when only adding enum member on SQLite TEXT | Prisma | Executor may need no-op migration file for migrate history |

## Open Questions

None blocking. Discretion items above are recommendations for planner.

## Environment Availability

| Dependency | Required By | Available | Fallback |
|------------|-------------|-----------|----------|
| Node / Vitest / Prisma | migrate + tests | ✓ (node v24; vitest/prisma in package.json) | — |

Step 2.6: no extra runtime services beyond existing SQLite.

## Validation Architecture

| Property | Value |
|----------|-------|
| Framework | Vitest 4.x (`npm test` → `vitest run`) |
| Quick run | `npx vitest run src/lib/validations/account.test.ts src/app/accounts/actions.test.ts` |
| Full suite | `npm test` |

| Behavior | Test type | Command / file | Exists? |
|----------|-----------|----------------|---------|
| Create accepts ASSET without limit | unit | `account.test.ts` | ❌ Wave 0 (update) |
| Create rejects FIAT_DEBIT/CRYPTO/CASH | unit | `account.test.ts` | ❌ Wave 0 |
| Create persists ASSET | unit | `actions.test.ts` | ❌ Wave 0 |
| NW treats ASSET like former debit | unit | `net-worth.test.ts` | ❌ Wave 0 (add case; legacy fixtures OK) |
| Form only Asset+Credit options | source/contract | `AccountFormDialog` (+ optional source test) | ❌ Wave 0 |

**Sampling:** per-task → quick vitest above; phase gate → `npm test`.

## Security Domain

| ASVS | Applies | Control |
|------|---------|---------|
| V2 Auth | no | local single-user |
| V3 Session | no | — |
| V4 Access | no | — |
| V5 Input Validation | yes | Zod write enum; ignore tampered type on name-update (existing D-15) |
| V6 Crypto | no | — |

| Threat | STRIDE | Mitigation |
|--------|--------|------------|
| Client posts legacy type / fake credit | Tampering | Write schema + creditLimit refine; CHECK invariant |
| creditLimit on ASSET | Tampering | Zod + CHECK `type != FIAT_CREDIT → limit NULL` |

## Sources

### Primary (HIGH)
- `prisma/schema.prisma` AccountType + Account model
- `prisma/migrations/20260903005200_account_credit_limit_check/migration.sql` CHECK
- `src/lib/validations/account.ts`, `src/lib/net-worth.ts`, `src/app/accounts/actions.ts`
- `src/components/accounts/AccountFormDialog.tsx`, `AccountList.tsx`
- codegraph explore: account type / NetWorthAccountType blast radius

### Tertiary
- A1 RU label preference — discretion

## Metadata

**Confidence:** Standard stack HIGH · Architecture HIGH · Pitfalls HIGH  
**Research date:** 2026-09-08  
**Valid until:** 30 days (stable domain)
