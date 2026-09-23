# Phase 31: ASSET ↔ SAVINGS type conversion - Research

**Researched:** 2026-09-22
**Domain:** Account metadata write path — Zod + Prisma update + AccountFormDialog edit unlock
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Edit surface & submit
- **D-01:** Type switch lives in the same **`AccountFormDialog` edit** («Изменить счёт») — unlock type select for accounts that are already `ASSET` or `SAVINGS`. — **Reversibility:** costly — reopens Phase 27 D-08 edit contract; Zod + `updateAccount` must accept type.
- **D-02:** **One Submit** updates name + type + rate/DOM together (extend current SAVINGS name+rate+DOM pattern).
- **D-03:** **Currency stays locked** on edit (label only) — conversion is type-only.
- **D-04:** Create form unchanged: still `ASSET | FIAT_CREDIT | SAVINGS`.

#### Draft UI (before Submit)
- **D-05:** **Immediate type-gate** in the form: `ASSET`→`SAVINGS` shows empty «Годовой %» / «День начисления»; `SAVINGS`→`ASSET` hides and clears those fields (mirror create type-gate).
- **D-06:** Leaving `SAVINGS` in the draft **always resets** rate/DOM — toggling back to `SAVINGS` starts empty again (no dialog memory of prior draft values).
- **D-07:** On convert to `SAVINGS`, fields start **empty** — user must fill both (mirror create; no prefill; 0% still allowed once entered per Phase 27 D-02).
- **D-08:** Save button stays **enabled** while empty; validation on submit.

#### Confirm / copy
- **D-09:** **No** second-step confirm for either direction (no in-dialog confirm; `window.confirm` already banned).
- **D-10:** **No** soft warning hint under the type control when clearing rate/DOM.
- **D-11:** Success message stays **«Сохранено»** (no special “type changed” copy).
- **D-12:** Validation errors for missing rate/DOM reuse create Russian field errors («Укажите годовой процент» / «Укажите день начисления»).

#### Allowed type peers & server gate
- **D-13:** For edit of `ASSET` or `SAVINGS`, type select options are **only `ASSET` and `SAVINGS`** (no `FIAT_CREDIT` in the list).
- **D-14:** For `FIAT_CREDIT` and legacy soft types, type remains **read-only label** — no select.
- **D-15:** Server **hard-rejects** forbidden type transitions (forged FormData, etc.) with generic save failure and/or type field error — UI is not the only gate. — **Reversibility:** costly — write-path invariant; tests should lock allowed matrix: only `ASSET`↔`SAVINGS`.
- **D-16:** Conversion **must not** create/update/delete `BalanceSnapshot` or rewrite historical NW (ACCT-04 / roadmap). Clearing rate/DOM is metadata only.

### Claude's Discretion
- Exact Zod/`updateAccount` shape for optional `type` on update; how DB CHECK + Prisma update clear `annualRateBps`/`accrualDayOfMonth` on `SAVINGS`→`ASSET`.
- Exact Russian string for forbidden-transition reject (generic vs `errors.type`).
- Whether type is a visible `<select>` vs equivalent control — must match D-01/D-13.
- No MCP convert/write tool unless planner finds an existing write-account MCP surface that must stay consistent (PARITY-01 is read surfaces; default = UI-only this phase).

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.

### Reviewed Todos (not folded)
- **Add timezone selection to settings** (`.planning/todos/pending/2026-09-05-add-timezone-selection-to-settings.md`) — weak keyword match only; unrelated to ACCT-04.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ACCT-04 | User can switch an existing account between `ASSET` and `SAVINGS` in account settings (both directions); `SAVINGS` requires rate + accrual day; leaving `SAVINGS` clears those fields; snapshots and historical NW stay; other types stay immutable | Unlock edit type select (D-01/D-13); extend `updateAccount` + `updateAccountSchema`; Prisma null-clear for rate/DOM; Vitest matrix + never-calls BalanceSnapshot; gate legacy/`FIAT_CREDIT` immutable |
</phase_requirements>

## Summary

Phase 31 punches a **narrow hole** in Phase 27 D-08 (“type immutable after create”). Today edit mode renders type as a muted label and `updateAccount` loads DB type then **ignores** client `type`/`currency` FormData. SAVINGS edit already updates name+rate+DOM in one action; ASSET/credit edit updates name only. SQLite `Account_savings_rate_invariant` already enforces rate+DOM iff `type = 'SAVINGS'` (else both null) — **no new migration**.

Planner should: (1) unlock `<Select>` for exact `ASSET`/`SAVINGS` only, draft-gated savings fields, (2) accept optional `type` on update Zod + action transition matrix, (3) on `SAVINGS→ASSET` set `type: "ASSET"` and **`annualRateBps: null`, `accrualDayOfMonth: null`** in one `prisma.account.update` (never omit / never `undefined`), (4) extend Phase 27 Vitest — including rewriting the test that currently proves forged `type=ASSET` is ignored on SAVINGS update.

**Primary recommendation:** Extend existing `updateAccount` / `updateAccountSchema` / `AccountFormDialog` edit path; do not add a new action or MCP write tool.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Type select unlock + draft type-gate (rate/DOM show/clear) | Browser / Client | — | `AccountFormDialog` owns draft UX (D-05…D-08) |
| Submit name+type+rate/DOM | Frontend Server (SSR) / Server Actions | — | Next.js `"use server"` `updateAccount` |
| Transition matrix + forged-type reject | API / Backend (server action) | — | D-15 — UI not sole gate |
| Zod shape for optional update `type` + field parse | API / Backend | — | `updateAccountSchema` before DB write |
| Persist type + clear/set rate columns | Database / Storage | — | Prisma update + existing CHECK |
| BalanceSnapshot / historical NW | — (must not touch) | — | D-16 / ACCT-04 / SAVISO |
| MCP list_accounts after convert | API / Backend (read) | — | Already reads type/rate; no write tool this phase |

## Project Constraints (from .cursor/rules/)

No `.cursor/rules/` directory in this repo. Standing constraints from `AGENTS.md` / `PROJECT.md`:

- Next.js APIs: read `node_modules/next/dist/docs/` before changing Next surfaces.
- **PARITY-01:** new **user-visible read** surfaces need MCP read tools same phase — conversion is write/metadata; MCP write deferred; default UI-only.
- No `window.confirm` (D-09 already aligns).
- Prefer **codegraph** CLI for codebase search.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Existing Zod | `4.5.4` in package.json `[VERIFIED: package.json]` | `updateAccountSchema` optional `type` | Already used for account writes |
| Existing Prisma Client | `7.10.0` `[VERIFIED: package.json]` | `account.update` with null clears | Already owns Account row |
| Existing Vitest | `4.1.11` `[VERIFIED: node_modules/vitest/package.json]` | Action + Zod matrix tests | Phase 27 patterns |
| Next.js server actions | in-repo | `updateAccount` FormData path | No new transport |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@/lib/savings-rate` `parsePercentToBps` | in-repo | ASSET→SAVINGS rate persist | Same as create/update SAVINGS |
| `@/lib/account-type` `accountTypeLabel` | in-repo | Read-only label for credit/legacy | D-14 path |
| shadcn `Select` | in-repo | Edit type control | Mirror create (D-01) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Extend `updateAccount` | New `convertAccountType` action | Extra surface; D-02 wants one Submit |
| Zod alone for transition matrix | Action-only gates | Need both: Zod parse + DB-type matrix after `findUnique` |
| Prefill rate when re-entering SAVINGS | Empty fields (D-06/D-07) | Locked — no draft memory |

**Installation:** none — reuse installed packages.

**Version verification:** `zod@4.5.4`, `prisma@7.10.0`, `vitest@4.1.11` from package.json / node_modules (2026-09-22).

## Package Legitimacy Audit

> No new packages for this phase.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| — | — | — | — | — | — | No installs |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none (legitimacy check on existing `zod` / `@prisma/client` returned SUS/`too-new` — ignore for already-pinned deps; do not reinstall)

## Architecture Patterns

### System Architecture Diagram

```
[User opens «Изменить счёт»]
        │
        ▼
[AccountFormDialog edit]
  ├─ type ∈ {ASSET,SAVINGS}? → Select(ASSET|SAVINGS) + draft type-gate
  └─ else (FIAT_CREDIT|legacy) → label only
        │  FormData: id, name, type?, annualRatePercentMajor?, accrualDayOfMonth?
        ▼
[updateAccount server action]
        │
        ├─ updateAccountSchema.safeParse
        ├─ findUnique(id) → dbType
        ├─ transition matrix (D-15)
        │     ASSET↔SAVINGS only
        │     forged / credit / legacy → reject
        ├─ if effectiveType=SAVINGS → require rate+DOM → bps+DOM
        └─ if SAVINGS→ASSET → type ASSET + rate/DOM null
        │
        ▼
[prisma.account.update] ──► SQLite CHECK Account_savings_rate_invariant
        │
        ├─ revalidatePath /accounts, /
        └─ ❌ never balanceSnapshot.*
```

### Recommended Project Structure

```
src/components/accounts/AccountFormDialog.tsx   # edit type unlock + draft gate
src/lib/validations/account.ts                  # optional type on update schema
src/app/accounts/actions.ts                     # transition matrix + null clear
src/lib/validations/account.test.ts             # Zod optional type
src/app/accounts/actions.test.ts                # conversion matrix + never-calls
src/components/accounts/AccountFormDialog.test.ts  # optional source-scan locks
```

### Pattern 1: Effective type after findUnique

**What:** Parse optional client `type`; load DB row; compute `effectiveType`; enforce allow-list before write.
**When to use:** Any metadata update that may change enum under CHECK constraints.
**Example:**

```typescript
// Discretion recommendation — action layer after findUnique
const dbType = account.type;
const requested = validated.data.type; // "ASSET" | "SAVINGS" | undefined
const effectiveType = requested ?? dbType;

const convertible =
  (dbType === "ASSET" || dbType === "SAVINGS") &&
  (effectiveType === "ASSET" || effectiveType === "SAVINGS");

if (requested !== undefined && requested !== dbType) {
  if (!convertible || (requested !== "ASSET" && requested !== "SAVINGS")) {
    return {
      message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
      // or errors: { type: ["…"] } — discretion
    };
  }
}
```

### Pattern 2: Prisma null clear (not omit)

**What:** Set nullable Int fields to `null` explicitly so CHECK’s non-SAVINGS branch holds.
**When to use:** SAVINGS→ASSET in the same update as `type: "ASSET"`.
**Example:**

```typescript
// Source: Prisma null vs undefined docs + generated AccountUpdateInput
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

`undefined` means “do not update field” — omitting nulls after type→ASSET **violates** `Account_savings_rate_invariant`. `[CITED: prisma.io/docs/orm/prisma-client/special-fields-and-types/null-and-undefined]`

### Pattern 3: Draft type-gate mirrors create

**What:** Edit `showSavingsFields` must key off **draft** `accountType`, not frozen `account.type`.
**When to use:** D-05/D-06.
**Anti-pattern today:**

```140:142:src/components/accounts/AccountFormDialog.tsx
  const showSavingsFields =
    (mode === "create" && accountType === "SAVINGS") ||
    (mode === "edit" && account?.type === "SAVINGS");
```

Replace edit branch with `accountType === "SAVINGS"` and clear rate/DOM in `onValueChange` when leaving SAVINGS (same as create lines 197–200).

### Anti-Patterns to Avoid

- **Gate unlock with `isAssetType()`:** Soft legacy (`FIAT_DEBIT`/`CRYPTO`/`CASH`) are asset-like for NW but must stay label-only (D-14). Use exact `type === "ASSET" || type === "SAVINGS"`.
- **Omit rate columns on leave SAVINGS:** Leaves non-null rate under `type=ASSET` → CHECK fail / silent omit.
- **Writing BalanceSnapshot on convert:** Violates ACCT-04 / D-16.
- **Putting FIAT_CREDIT in edit type options:** Violates D-13.
- **Relying on UI only:** Forged FormData must hit D-15 server reject.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Rate % ↔ bps | Custom float math | `parsePercentToBps` / `formatBpsToPercentMajor` | Scale-2 + Int max already locked Phase 27 |
| Type↔rate invariant | App-only checks | Existing SQLite CHECK + Zod/action | Dual enforcement |
| Snapshot isolation assert | Ad-hoc integration | Vitest `never.toHaveBeenCalled` on mocked `balanceSnapshot` | Phase 27/GRISO pattern |
| New convert RPC | Separate action/MCP write | Extend `updateAccount` | D-02; MCP writes deferred |

**Key insight:** Conversion is one Account-row metadata update under an existing CHECK — complexity is **transition matrix + draft UX**, not schema.

## Common Pitfalls

### Pitfall 1: Existing test proves type ignore — will break

**What goes wrong:** `updateAccount SAVINGS` test sets `type=ASSET` and asserts update data has **no** `type` and keeps SAVINGS rate write.
**Why it happens:** Phase 27 lock “ignore client type”.
**How to avoid:** Rewrite that case into conversion suite: forged/allowed matrix explicit.
**Warning signs:** Test name still says “ignores tampered type” for convertible peers.

### Pitfall 2: Soft types look like «Актив»

**What goes wrong:** `accountTypeLabel` returns «Актив» for legacy soft types — UI looks unlocked-eligible.
**Why it happens:** Soft-read merge (QUICK-0i7).
**How to avoid:** Unlock select only when `account.type === "ASSET" || account.type === "SAVINGS"`.
**Warning signs:** Edit of CRYPTO shows select with ASSET/SAVINGS.

### Pitfall 3: Prefill after toggle back to SAVINGS

**What goes wrong:** Cleared draft still shows old bps from mount state.
**Why it happens:** Mount init from `account.annualRateBps` + incomplete clear on type change.
**How to avoid:** D-06 — always `setAnnualRate("")` / `setAccrualDom("")` when leaving SAVINGS; opening convert-to-SAVINGS starts empty (D-07). Same-type SAVINGS edit may still prefill from props on mount.

### Pitfall 4: DialogDescription lies

**What goes wrong:** Copy still says «Тип и валюта не меняются.» while type select is live.
**How to avoid:** Discretion — e.g. keep «Валюта не меняется.» when type unlocked; leave full lock copy for credit/legacy.

### Pitfall 5: Partial update leaves CHECK broken

**What goes wrong:** `type: "ASSET"` without nulling rate/DOM → Prisma/`P2010` CHECK failure → generic message.
**How to avoid:** Always set both nulls in same `data` object.

### Pitfall 6: Stale “ignore type” comment in actions

**What goes wrong:** Docstring still says “ignores client type/currency (T-27-01)”.
**How to avoid:** Update comment to: ignore currency always; accept type only for ASSET↔SAVINGS.

## Code Examples

### Current ignore-type path (baseline)

```195:286:src/app/accounts/actions.ts
/**
 * Update account metadata. Name always; SAVINGS also requires rate+DOM (D-06, D-08).
 * Loads type from DB — ignores client type/currency (T-27-01). Never writes BalanceSnapshot (D-16).
 */
export async function updateAccount(
  // ...
) {
  // ...
    if (account.type === "SAVINGS") {
      // ... require rate+DOM, update name+bps+DOM — no type field
    } else {
      await prisma.account.update({
        where: { id },
        data: { name: validated.data.name },
      });
    }
}
```

### Recommended Zod extension (discretion)

```typescript
// Extend — keep rate/DOM optional; matrix after findUnique
export const updateAccountSchema = z.object({
  name: accountNameSchema,
  type: z.enum(["ASSET", "SAVINGS"]).optional(),
  annualRatePercentMajor: z.string().optional(),
  accrualDayOfMonth: optionalDayOfMonthSchema,
});
```

Reject `FIAT_CREDIT` / legacy at Zod if present in FormData (`z.enum` fails → fieldErrors.type) **or** map to generic message in action — discretion. Prefer surfacing `errors.type` when enum parse fails; generic message for DB-type forbidden transitions (credit→ASSET forge).

### ASSET→SAVINGS write

```typescript
await prisma.account.update({
  where: { id },
  data: {
    name: validated.data.name,
    type: "SAVINGS",
    annualRateBps, // from parsePercentToBps
    accrualDayOfMonth: dom,
  },
});
```

### SAVINGS→ASSET write

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

### Edit unlock sketch

```typescript
const canConvertType =
  mode === "edit" &&
  account &&
  (account.type === "ASSET" || account.type === "SAVINGS");

// options: [{ASSET},{SAVINGS}] only — not TYPE_OPTIONS with FIAT_CREDIT
// hidden input name="type" value={accountType} when select shown
// else: label via accountTypeLabel (credit/legacy)
```

### CHECK invariant (verbatim)

```41:54:prisma/migrations/20260911161446_savings_account/migration.sql
    CONSTRAINT "Account_savings_rate_invariant" CHECK (
        (
            type = 'SAVINGS'
            AND annualRateBps IS NOT NULL
            AND annualRateBps >= 0
            AND accrualDayOfMonth IS NOT NULL
            AND accrualDayOfMonth BETWEEN 1 AND 31
        )
        OR (
            type != 'SAVINGS'
            AND annualRateBps IS NULL
            AND accrualDayOfMonth IS NULL
        )
    )
```

### Prisma UpdateInput allows `null` (verbatim)

```396:403:src/generated/prisma/models/Account.ts
export type AccountUpdateInput = {
  name?: Prisma.StringFieldUpdateOperationsInput | string
  type?: Prisma.EnumAccountTypeFieldUpdateOperationsInput | $Enums.AccountType
  creditLimitMinor?: Prisma.NullableBigIntFieldUpdateOperationsInput | bigint | number | null
  statementDayOfMonth?: Prisma.NullableIntFieldUpdateOperationsInput | number | null
  dueDayOfMonth?: Prisma.NullableIntFieldUpdateOperationsInput | number | null
  annualRateBps?: Prisma.NullableIntFieldUpdateOperationsInput | number | null
  accrualDayOfMonth?: Prisma.NullableIntFieldUpdateOperationsInput | number | null
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Type immutable after create (27 D-08) | ASSET↔SAVINGS editable in settings | Phase 31 | Narrow supersession only |
| `updateAccount` ignores client type | Accept optional ASSET/SAVINGS type | Phase 31 | Tests that assert ignore must flip |
| Name-only ASSET edit | Name + optional convert to SAVINGS | Phase 31 | Must collect rate+DOM when target SAVINGS |

**Deprecated/outdated:**
- Phase 27 wording “Type and currency stay immutable after create (no ASSET ↔ SAVINGS)” — currency still immutable; type pair unlocked.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Forbidden-transition UX: generic `message` preferred over dedicated Russian `errors.type` string when DB type blocks transition | Discretion / Pitfalls | Copy inconsistency only — pick in plan |
| A2 | Same-type SAVINGS edit may still prefill rate/DOM from props on dialog open; only leave/re-enter SAVINGS clears | Draft UI | If product wanted clear-on-every-open, extra UX task |

**If empty of blocking assumptions:** A1–A2 are copy/UX discretion only — no schema blockers.

## Open Questions (RESOLVED)

1. **Exact forbidden-transition Russian copy** — RESOLVED
   - What we know: D-15 allows generic save failure and/or `errors.type`.
   - Answer (CONTEXT discretion A1 / UI-SPEC): DB matrix rejects use generic «Не удалось сохранить. Проверьте поля и попробуйте снова.»; Zod enum failures may populate `errors.type` if client sends garbage enum.

2. **DialogDescription when type unlocked** — RESOLVED
   - Answer (UI-SPEC / RESEARCH recommendation): convertible edits (`ASSET`\|`SAVINGS`) use «Валюта не меняется.»; credit/legacy locked path keeps «Тип и валюта не меняются.»

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vitest / Next | ✓ | v24.5.0 | — |
| npm | scripts | ✓ | 10.9.3 | — |
| Bun | optional tooling | ✓ | 1.3.14 | — |
| Vitest | tests | ✓ | 4.1.11 | — |
| SQLite via Prisma | CHECK enforcement | ✓ | prisma 7.10.0 | — |
| New npm packages | — | n/a | — | none needed |

**Missing dependencies with no fallback:** none

**Missing dependencies with fallback:** none

Step 2.6: external tools present; phase is code/config only beyond existing stack.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.11 |
| Config file | project vitest config (existing) |
| Quick run command | `npx vitest run src/lib/validations/account.test.ts src/app/accounts/actions.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ACCT-04 | ASSET→SAVINGS persists type+bps+DOM | unit (mocked prisma) | `npx vitest run src/app/accounts/actions.test.ts -t 'ASSET'` | ❌ Wave 0 — add cases |
| ACCT-04 | SAVINGS→ASSET clears rate/DOM to null + type ASSET | unit | same | ❌ Wave 0 |
| ACCT-04 | FIAT_CREDIT / legacy forged type rejected; update not called | unit | same | ❌ Wave 0 |
| ACCT-04 | Missing rate/DOM on convert-to-SAVINGS → «Укажите годовой процент» / «Укажите день начисления» | unit | same + validations | ⚠️ Partial — create/update SAVINGS exist; extend for convert |
| ACCT-04 | Never calls balanceSnapshot upsert/delete on convert | unit | same | ❌ Wave 0 (clone D-16 pattern) |
| ACCT-04 | updateAccountSchema accepts optional type ASSET\|SAVINGS | unit | `npx vitest run src/lib/validations/account.test.ts` | ❌ Wave 0 |
| ACCT-04 | Edit unlock / options source-scan (optional) | unit source | `AccountFormDialog.test.ts` | ⚠️ Exists — extend if desired |

### Sampling Rate

- **Per task commit:** `npx vitest run src/lib/validations/account.test.ts src/app/accounts/actions.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `actions.test.ts` — describe `updateAccount ASSET↔SAVINGS (ACCT-04)` covering both directions, rejects, never-calls snapshot
- [ ] Rewrite existing SAVINGS update case that sets `type=ASSET` expecting ignore
- [ ] `account.test.ts` — optional `type` on `updateAccountSchema`; reject FIAT_CREDIT on update type field
- [ ] Optional: `AccountFormDialog.test.ts` source locks for edit select + CONVERT_TYPE_OPTIONS without FIAT_CREDIT

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Local single-user app |
| V3 Session Management | no | — |
| V4 Access Control | no | No multi-tenant ACL |
| V5 Input Validation | yes | Zod + action matrix + SQLite CHECK |
| V6 Cryptography | no | — |

### Known Threat Patterns for account type conversion

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Forged FormData `type=FIAT_CREDIT` / `CRYPTO` on ASSET | Tampering | D-15 reject; Zod enum limited to ASSET\|SAVINGS |
| Forged type on FIAT_CREDIT → ASSET | Tampering | Server: non-convertible dbType → reject |
| SAVINGS→ASSET without clearing rate | Tampering / Denial | Explicit nulls + CHECK |
| Convert path writes BalanceSnapshot | Tampering (history) | Never call snapshot APIs; Vitest never-calls |
| Spoof currency on edit | Tampering | Keep ignoring client currency (D-03) |

## Sources

### Primary (HIGH confidence)

- `src/app/accounts/actions.ts:195-299` — updateAccount ignore-type baseline
- `src/lib/validations/account.ts:138-143` — updateAccountSchema without type
- `src/components/accounts/AccountFormDialog.tsx:140-228` — edit type label + savings gate
- `prisma/migrations/20260911161446_savings_account/migration.sql:41-54` — CHECK
- `src/generated/prisma/models/Account.ts:396-403` — UpdateInput nullability
- `src/app/accounts/actions.test.ts:92-335` — Phase 27 immutability + SAVINGS update patterns
- `src/lib/account-type.ts:1-30` — soft labels / isAssetType
- codegraph `query updateAccount` / `explore account type conversion`

### Secondary (MEDIUM confidence)

- [Prisma null vs undefined](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/null-and-undefined) — `null` writes; `undefined` skips field

### Tertiary (LOW confidence)

- Exact Russian string for forbidden transition (discretion A1)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new deps; versions from package.json
- Architecture: HIGH — verified against live source + CHECK SQL
- Pitfalls: HIGH — existing test/docstring conflicts confirmed by Read

**Research date:** 2026-09-22
**Valid until:** 2026-10-22 (stable domain; schema already shipped)
