# Phase 3: Dated Balance Snapshots - Research

**Researched:** 2026-09-03
**Domain:** Prisma SQLite dated balance snapshots + LOCF reads + Next.js accounts-list UI
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
#### Entry surface
- **D-01:** Set balance via **Dialog on the accounts list** (per-row action → amount + as-of date). No dedicated `/balances` route and no `/accounts/[id]` page in this phase. — **Reversibility:** reversible — routing can be added later without changing the snapshot model.
- **D-02:** Account row shows **current LOCF balance** (as of today) **plus the as-of date** of the snapshot that produced it.
- **D-03:** Default as-of date in the dialog is **today**.
- **D-04:** When an account has **no snapshots yet**, show an emphasized CTA **«Задать первый баланс»** (not a plain empty/dash row).

#### Credit debt semantics (FIAT_CREDIT)
- **D-05:** For credit accounts, the user enters **remaining available credit** (how much of the limit is left), not outstanding debt and not a signed balance. Example: limit 5000, enter 3000 → debt 2000. — **Reversibility:** one-way — storage and UI labels assume “available”; flipping to debt-first needs a data migration and copy rewrite.
- **D-06:** Persist **available (remaining)** in the snapshot row; **debt is always derived** as `creditLimitMinor − availableMinor` on read. Never store debt as a second money field.
- **D-07:** Validate strictly: **0 ≤ available ≤ credit limit**.
- **D-08:** Credit account list row shows **both available and debt** plus snapshot date. Non-credit rows show native balance + date (D-02).

#### Same-date rules & history mutation
- **D-09:** At most **one snapshot per (account, asOfDate)** — a new set for the same date **overwrites**. — **Reversibility:** costly — uniqueness is the LOCF contract; relaxing it breaks as-of reads.
- **D-10:** Past snapshots may be **overwritten** (via set-balance with that date) and **deleted**.
- **D-11:** **Delete UI lives only in the per-account snapshot history list** — not inside the set-balance dialog.
- **D-12:** **Future as-of dates are forbidden** — today and past only.

#### List vs history display
- **D-13:** Snapshot history opens by **expanding the account row** (inline under the account). Not a separate Sheet/Dialog-only history surface.
- **D-14:** History ordered **newest first** (date descending).
- **D-15:** Non-credit history rows: **date + amount** only (no “current” marker).
- **D-16:** Credit history rows: **date + available** only (debt not repeated in history lines; list header already shows both per D-08).

### Claude's Discretion
- Exact Prisma model naming (replace `BalanceAmountStub`), unique constraint shape, Server Action error copy wording, expand/collapse affordance details, and LOCF query helper placement — choose standard Next.js + Prisma + shadcn patterns consistent with Phases 1–2.
- Money input UX reuses/extends `src/lib/money.ts` (`parseMajorToMinor` / `formatMinorToMajor`) with currency scale from the account’s locked currency.

### Deferred Ideas (OUT OF SCOPE)
- **BAL-03** copy-forward / confirm unchanged — v2 (REQUIREMENTS.md)
- Dedicated `/balances` page or per-account detail route — not chosen for v1 Phase 3
- Available-credit as NW dashboard concept (**ACCT-03**) — Phase 5 (list already shows available+debt for credit in Phase 3 per D-08; full NW math still Phase 5)
- FX, net worth totals, charts — Phases 4–6
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BAL-01 | User can set an account balance as of a chosen date (backdating allowed) | Replace stub with dated snapshot model; Server Action upsert + Dialog on `/accounts`; past dates allowed, future forbidden (D-01, D-09–D-12) |
| BAL-02 | Balance as of date D is the latest snapshot with date ≤ D | Shared LOCF helper: `findFirst` / batch pick with `asOfDate <= D` ordered desc; return `null` before first snapshot (never invent 0) |
</phase_requirements>

## Summary

Phase 3 turns the Phase 1 `BalanceAmountStub` into a real **per-account dated snapshot** table and wires LOCF (last observation carried forward) reads into the existing `/accounts` list. Mutations stay Server Actions + Zod; UI stays Russian Dialog-on-list (no new routes). Credit accounts store **available credit** in `amountMinor`; debt is derived on read from `Account.creditLimitMinor` (CONTEXT D-05–D-08), closing the Phase 2 D-09 deferral without a debt column.

**Primary recommendation:** Replace `BalanceAmountStub` with model `BalanceSnapshot` (`accountId`, `asOfDate` `YYYY-MM-DD`, `amountMinor` BigInt, `@@unique([accountId, asOfDate], name: "accountId_asOfDate")`); put LOCF in `src/lib/balances.ts`; upsert/delete via Server Actions on `/accounts`; extend `AccountList` with current LOCF + set-balance Dialog + inline expandable history — **no new npm packages**.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Snapshot persistence + uniqueness | Database / Storage | API / Backend | SQLite unique `(accountId, asOfDate)` is LOCF contract (D-09) |
| LOCF as-of read | API / Backend | Database / Storage | Pure query helper; reusable by Phases 4–6 |
| Credit debt derivation | API / Backend | Browser / Client | `debt = creditLimit − available` on read only (D-06); never persist debt |
| Set / overwrite / delete mutations | API / Backend | Browser / Client | Server Actions + Zod trust boundary (Phase 1 D-02) |
| Current balance + history UI | Frontend Server (SSR) | Browser / Client | RSC loads LOCF + history; client Dialog / expand / delete |
| “Today” / future-date gate | API / Backend | Browser / Client | Server must reject future `asOfDate` (D-12); date input `max` is UX only |
| Money parse/format | API / Backend | Browser / Client | Existing `money.ts` + account currency scale |

## Project Constraints (from .cursor/rules/)

None — `.cursor/rules/` absent this session. Follow Phase 1–2 CONTEXT/stack locks, user rules (codegraph for project search; RESEARCH.md stays normal prose).

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | **16.3.4** (pinned) | App Router + Server Actions | Phase 1 lock `[VERIFIED: package.json:22]` |
| react / react-dom | **19.2.8** | `useActionState` Dialog forms | Phase 1 pin `[VERIFIED: package.json:24-25]` |
| prisma / @prisma/client / adapter | **7.10.0** | Schema, migrate, LOCF queries, upsert | Phase 1 lock `[VERIFIED: package.json:15-16,23]` — do **not** upgrade to registry Prisma 8 RC |
| better-sqlite3 | **13.0.3** | SQLite driver | Phase 1 pin + overrides `[VERIFIED: package.json:17,43-45]` |
| zod | **4.5.4** | Server Action validation | Existing; Next forms guide pattern `[VERIFIED: package.json:29]` `[CITED: nextjs.org/docs/app/guides/forms]` |
| shadcn/ui (base-nova) | existing Dialog/Input/Label/Select | Set-balance Dialog | Phase 1 D-04; already installed `[VERIFIED: src/components/ui/]` |
| vitest | **4.1.11** | Unit/schema/LOCF tests | Existing harness `[VERIFIED: package.json:41]` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | ^1.39.0 | Expand/collapse chevron | Optional; already in tree |
| @base-ui/react | ^1.7.0 | Underlying shadcn primitives | Already present |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `BalanceSnapshot` model | Keep/extend `BalanceAmountStub` | Stub has no account/date — **must replace** |
| Prisma `upsert` on compound unique | findUnique + create/update | Upsert is one round-trip and matches D-09 overwrite; official compound-upsert API `[CITED: prisma.io/docs/.../composite-ids-and-constraints]` |
| Shared `src/lib/balances.ts` LOCF | Inline queries in page.tsx | Helper is required for Phase 4–6 reuse — **put in lib** |
| shadcn Collapsible | `useState` expand on row | Prefer local state first (no new UI component); Collapsible OK via official shadcn CLI if planner wants |
| Dedicated `/balances` route | List Dialog (D-01) | Locked out of scope |

**Installation:**

```bash
# No new npm packages.
# Optional only if planner chooses Collapsible over useState:
# npx shadcn@latest add collapsible
```

**Version verification:** Project pins `next@16.3.4`, `prisma@7.10.0`, `zod@4.5.4`, `vitest@4.1.11` `[VERIFIED: package.json]`. Registry also lists Prisma `8.0.0-rc.12` — **do not install** (Phase 1 human lock).

## Package Legitimacy Audit

> Phase 3 installs **no new npm packages**. Existing zod/vitest remain; seam flags them `SUS`/`too-new` despite huge downloads — false positive, already approved Phase 1–2.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| zod (existing) | npm | mature | ~275M/wk | github.com/colinhacks/zod | SUS (too-new signal) | Keep — already approved; no new install |
| vitest (existing) | npm | mature | ~100M/wk | github.com/vitest-dev/vitest | SUS (too-new signal) | Keep — already approved |
| (optional) shadcn collapsible | @shadcn registry copy | — | — | ui.shadcn.com | — | Approved only if planner adds via official CLI; not required |

**Packages removed due to [SLOP] verdict:** none  
**Packages flagged as suspicious [SUS]:** none newly introduced

## Architecture Patterns

### System Architecture Diagram

```text
Browser (RU /accounts list)
  │  RSC: accounts + current LOCF (asOf=today) + history rows
  │  Dialog: amountMajor + asOfDate (default today)
  │  Expand row → history (newest first) → delete action
  ▼
Server Actions (Zod safeParse)
  │  upsertBalanceSnapshot / deleteBalanceSnapshot
  │  validate: YYYY-MM-DD, ≤ today, money scale, credit 0..limit
  ▼
src/lib/balances.ts
  │  getBalanceAsOf(accountId, D) → snapshot | null   ← LOCF
  │  debtMinor(limit, available) → limit − available  ← credit only
  ▼
prisma (SQLite)
  └── BalanceSnapshot
        accountId FK → Account
        asOfDate TEXT YYYY-MM-DD
        amountMinor BigInt  (native balance OR available credit)
        UNIQUE (accountId, asOfDate)
```

### Recommended Project Structure

```
src/
├── app/accounts/
│   ├── page.tsx                 # RSC: load accounts + LOCF today + histories
│   └── actions.ts               # + upsertBalanceSnapshot, deleteBalanceSnapshot
├── components/accounts/
│   ├── AccountList.tsx          # LOCF display, CTA, expand history, delete
│   ├── AccountFormDialog.tsx    # unchanged create/edit
│   └── SetBalanceDialog.tsx     # new: amount + asOfDate Dialog
├── lib/
│   ├── balances.ts              # LOCF + debt derivation + today calendar helper
│   ├── money.ts                 # reuse parse/format
│   └── validations/
│       └── balance.ts           # Zod for set/delete
└── prisma/schema.prisma         # BalanceSnapshot; drop BalanceAmountStub
```

### Pattern 1: Replace stub with `BalanceSnapshot`

**What:** Drop `BalanceAmountStub`; add real model tied to `Account`.

**Recommended schema (discretion naming locked here for planner):**

```prisma
model BalanceSnapshot {
  id          Int     @id @default(autoincrement())
  accountId   Int
  account     Account @relation(fields: [accountId], references: [id], onDelete: Restrict)
  asOfDate    String  // YYYY-MM-DD (same convention as FxRateStub.asOfDate)
  amountMinor BigInt  // native balance; for FIAT_CREDIT = available remaining

  @@unique([accountId, asOfDate], name: "accountId_asOfDate")
}
```

Also add `balanceSnapshots BalanceSnapshot[]` on `Account`. `[ASSUMED]` name `BalanceSnapshot` — CONTEXT left naming to discretion; quote FxRateStub date convention from schema:

```44:45:prisma/schema.prisma
  asOfDate            String // YYYY-MM-DD
  rateToPrimaryScaled BigInt // primary_units_per_1_other * 10^8
```

```48:51:prisma/schema.prisma
model BalanceAmountStub {
  id          Int    @id @default(autoincrement())
  amountMinor BigInt // minor units per Currency.scale
}
```

**When to use:** Always for BAL-01/02.

**Migration notes:**
- `prisma migrate` DROP `BalanceAmountStub`, CREATE `BalanceSnapshot` + unique index.
- Update `src/lib/foundation.test.ts` table allow-list (currently expects `"BalanceAmountStub"`) `[VERIFIED: src/lib/foundation.test.ts:119-128]`.
- Keep `amountMinor BigInt` assertion in `money.test.ts` (still valid after rename) `[VERIFIED: src/lib/money.test.ts:50-53]`.
- Stop wallet-web container before host `migrate deploy` if SQLite locked (Phase 2 lesson in STATE.md).

### Pattern 2: LOCF read (BAL-02)

**What:** Latest snapshot with `asOfDate <= D`; `null` if none.

**Example:**

```typescript
// Source: Prisma Client findFirst + orderBy [CITED: prisma.io/docs/orm/reference/prisma-client-reference#findfirst]
export async function getBalanceAsOf(accountId: number, asOfDate: string) {
  return prisma.balanceSnapshot.findFirst({
    where: { accountId, asOfDate: { lte: asOfDate } },
    orderBy: { asOfDate: "desc" },
  });
}
```

**List page batch:** one `findMany` where `accountId in (...)` and `asOfDate <= today`, orderBy `asOfDate desc`, then first-per-`accountId` in memory — fine for personal-scale account counts. Do **not** invent `0n` when missing.

### Pattern 3: Same-date overwrite via compound upsert (D-09)

```typescript
// Source: Prisma compound unique upsert [CITED: prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-composite-ids-and-constraints]
await prisma.balanceSnapshot.upsert({
  where: {
    accountId_asOfDate: { accountId, asOfDate },
  },
  update: { amountMinor },
  create: { accountId, asOfDate, amountMinor },
});
```

Use named `@@unique(..., name: "accountId_asOfDate")` so the client key is stable.

### Pattern 4: Set-balance Dialog (mirror AccountFormDialog)

**What:** Client Dialog + `useActionState` + remount on open (`formKey`) — same anti-stale-success pattern as Phase 2 `[VERIFIED: src/components/accounts/AccountFormDialog.tsx:296-330]`.

Fields:
- Hidden `accountId`
- `amountMajor` (label **«Доступный лимит»** / available for credit; **«Баланс»** for others)
- `asOfDate` `<input type="date">` default today, `max={today}`

### Pattern 5: Credit derivation (D-05–D-08)

```typescript
export function creditDebtMinor(
  creditLimitMinor: bigint,
  availableMinor: bigint,
): bigint {
  return creditLimitMinor - availableMinor;
}
```

Validate on write: `0n <= availableMinor && availableMinor <= creditLimitMinor`. Display debt only on list header; history shows available only (D-16).

### Anti-Patterns to Avoid

- **Inventing zero before first snapshot:** Violates success criterion 4 / BAL-02 empty case.
- **Storing debt in snapshot or Account:** Dual source of truth; CONTEXT forbids (D-06).
- **Signed negative “debt balance” for credit:** Wrong mental model (D-05).
- **Delete inside set-balance Dialog:** Forbidden (D-11).
- **New `/balances` route:** Deferred (D-01).
- **Float/Number money path:** Phase 1 D-07; keep BigInt + `money.ts`.
- **Using Docker UTC midnight blindly for “today” without documenting TZ:** Future-date gate can wrongly accept/reject near midnight — see Pitfalls.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Same-date overwrite | Manual find+branch without unique | Prisma `upsert` + `@@unique` | Race-safe LOCF identity; D-09 |
| LOCF query | Custom SQL window per call without tests | `findFirst`/`findMany` + shared helper | Reused by FX/NW/charts |
| Money parse | `parseFloat` / Number | `parseMajorToMinor` | Scale/BigInt contract |
| Form validation | Client-only checks | Zod in Server Actions | Tampered FormData |
| Date identity | `Date` object equality / timestamps | `YYYY-MM-DD` strings (lexicographic ≤) | Matches `FxRateStub`; no TZ drift inside the string |

**Key insight:** Snapshot identity is `(account, calendar date)`. LOCF is a one-line ordered query; complexity is credit available semantics and honest empty states — not a ledger engine.

## Common Pitfalls

### Pitfall 1: Invented zero before first snapshot
**What goes wrong:** UI shows `0.00` and NW later treats account as zero asset.  
**Why it happens:** `?? 0n` defaults.  
**How to avoid:** LOCF returns `null`; empty CTA «Задать первый баланс» (D-04).  
**Warning signs:** Tests assert zero for “no rows”.

### Pitfall 2: Credit available vs debt confusion
**What goes wrong:** User enters debt; NW double-counts or flips sign.  
**Why it happens:** REQUIREMENTS ACCT-02 wording still says “outstanding debt”.  
**How to avoid:** CONTEXT is authoritative — labels + Zod for available; debt derived.  
**Warning signs:** Schema field named `debtMinor`.

### Pitfall 3: “Today” timezone in Docker
**What goes wrong:** Near midnight, server UTC rejects user’s local today or accepts tomorrow.  
**Why it happens:** Compose has no `TZ` today `[VERIFIED: docker-compose.yml DATABASE_URL only]`.  
**How to avoid:** Central `calendarDateToday(timeZone)` helper; default `Europe/Moscow` for Russian-first app `[ASSUMED]` or set `TZ` in Compose; client `type="date"` default still from same helper passed as prop.  
**Warning signs:** Flaky D-12 tests around midnight.

### Pitfall 4: Foundation test still expects `BalanceAmountStub`
**What goes wrong:** migrate green but `foundation.test.ts` fails.  
**How to avoid:** Update table list in same wave as schema migration.

### Pitfall 5: SQLite lock during migrate
**What goes wrong:** Host migrate fails while `wallet-web` holds DB.  
**How to avoid:** Stop container briefly (Phase 2 precedent in STATE.md).

### Pitfall 6: BigInt across RSC → client
**What goes wrong:** Serialization throw.  
**How to avoid:** Serialize `amountMinor` / `creditLimitMinor` as strings (existing accounts page pattern) `[VERIFIED: src/app/accounts/page.tsx:20-33]`.

## Code Examples

### LOCF unit behavior (Wave 0 target)

```typescript
// Snapshots: 2026-01-01 → 100, 2026-01-10 → 200
// asOf 2026-01-05 → 100
// asOf 2025-12-31 → null (not 0)
// asOf 2026-01-10 → 200
// upsert same date overwrites amount
```

### Zod date + amount sketch

```typescript
// Source pattern: Phase 2 account Zod + Next forms Zod safeParse
// [CITED: nextjs.org/docs/app/guides/forms]
const asOfDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Укажите дату");

// After parse: if (asOfDate > today) reject future (D-12)
// Credit: 0 <= amountMinor <= creditLimitMinor (D-07)
// Non-credit: amountMinor >= 0 [ASSUMED — confirm if negatives needed]
```

### Delete from history only

```typescript
// Server Action deleteBalanceSnapshot(id) — button only in expanded history (D-11)
await prisma.balanceSnapshot.delete({ where: { id } });
revalidatePath("/accounts");
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Transaction ledger for history | Dated balance snapshots + LOCF | Product lock (PROJECT.md) | Phase 3 model |
| Debt column on Account | Available in snapshot; debt derived | Phase 2 D-09 → Phase 3 D-05–D-06 | Single money field |
| `BalanceAmountStub` | `BalanceSnapshot` + account FK + date | Phase 3 | Real BAL-01/02 |

**Deprecated/outdated:**
- Treating ACCT-02 “outstanding debt” as an Account column in this phase — superseded by CONTEXT.
- Inventing zero for missing snapshots — forbidden by roadmap success criterion 4.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Prisma model name `BalanceSnapshot` | Pattern 1 | Rename-only; low risk |
| A2 | Non-credit `amountMinor` must be ≥ 0 (no negative debit/cash/crypto) | Zod sketch | If negatives wanted, relax Zod |
| A3 | Default calendar TZ for “today” = `Europe/Moscow` (or Compose `TZ`) | Pitfall 3 | Wrong future-date rejects near TZ edges |
| A4 | Inline `useState` expand sufficient (Collapsible optional) | Alternatives | UX preference only |
| A5 | Batch in-memory LOCF pick OK for personal account counts | Pattern 2 | If thousands of accounts, need SQL window — unlikely for v1 |

**If empty table:** N/A — assumptions listed above need planner confirmation only where noted.

## Open Questions

1. **Non-credit negative balances?**
   - What we know: Credit range locked 0..limit. Debit/cash/crypto not specified.
   - Recommendation: Disallow negatives in v1 (A2); revisit if user needs overdraft.

2. **Canonical “today” timezone**
   - What we know: No `TZ` in Compose; Russian-first UI.
   - Recommendation: `Europe/Moscow` helper + optional Compose `TZ` (A3).

3. **Delete confirmation?**
   - What we know: D-10 allows delete; no confirm decision.
   - Recommendation: Simple delete button + Russian error on failure; optional `window.confirm` — discretion.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | App / Vitest | ✓ | v24.5.0 | — |
| npm | Scripts | ✓ | 10.9.3 | — |
| Docker | Persist smoke / migrate | ✓ | 29.5.3 | Host `prisma migrate deploy` |
| SQLite file | Runtime | ✓ | `data/wallet.db` present | Fresh migrate on empty volume |
| Prisma CLI (project) | Migrate | ✓ | 7.10.0 (pinned) | — |
| ctx7 CLI | Docs lookup | ✗ | — | WebSearch + official URL fetch (used) |
| graphify | Code graph | ✗ disabled | — | codegraph CLI (used) |

**Missing dependencies with no fallback:** none for phase execution.

**Missing dependencies with fallback:** ctx7 → WebSearch/WebFetch; graphify → codegraph.

Step 2.6: External tools audited above.

## Validation Architecture

> `workflow.nyquist_validation` is true in `.planning/config.json` `[VERIFIED: .planning/config.json]`.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.11 |
| Config file | `vitest.config.ts` (`include: src/**/*.test.ts`) |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BAL-01 | Zod accepts past/today date + amount; rejects future | unit | `npm test -- --run src/lib/validations/balance.test.ts` | ❌ Wave 0 |
| BAL-01 | upsert same `(account, date)` overwrites amount | unit | `npm test -- --run src/lib/balances.test.ts` | ❌ Wave 0 |
| BAL-01 | Credit available outside 0..limit rejected | unit | `npm test -- --run src/lib/validations/balance.test.ts` | ❌ Wave 0 |
| BAL-02 | LOCF returns latest ≤ D | unit | `npm test -- --run src/lib/balances.test.ts` | ❌ Wave 0 |
| BAL-02 | Before first snapshot returns null (not 0) | unit | `npm test -- --run src/lib/balances.test.ts` | ❌ Wave 0 |
| BAL-01/02 | Schema has BalanceSnapshot + unique; stub gone | unit | `npm test -- --run src/lib/money.test.ts src/lib/foundation.test.ts` | ✅ update existing |
| — | Set-balance Dialog remount / controlled defaults | unit (source-contract) | `npm test -- --run src/components/accounts/SetBalanceDialog.test.ts` | ❌ Wave 0 |
| — | Actions export set + delete; no debt column | unit | `npm test -- --run src/app/accounts/actions.test.ts` | ✅ extend |

### Sampling Rate

- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green + Russian UI human smoke on `/accounts` before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/lib/validations/balance.test.ts` — BAL-01 date/amount/credit bounds
- [ ] `src/lib/balances.test.ts` — BAL-02 LOCF + null-before-first + overwrite
- [ ] `src/lib/validations/balance.ts` — schemas under test
- [ ] `src/lib/balances.ts` — LOCF + debt helpers under test
- [ ] Update `foundation.test.ts` expectations when stub dropped
- [ ] Optional: `SetBalanceDialog.test.ts` source-contract (formKey / default today)

## Security Domain

> `security_enforcement` enabled (absent key would default on; present `true`) `[VERIFIED: .planning/config.json]`.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Single local user; no auth in v1 |
| V3 Session Management | no | — |
| V4 Access Control | no | Single-user local app |
| V5 Input Validation | yes | Zod on asOfDate, amountMajor, accountId; reject future dates |
| V6 Cryptography | no | No new crypto; money remains INTEGER BigInt |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Tampered future `asOfDate` | Tampering | Server compare to calendar today (D-12); ignore client-only `max` |
| Tampered `accountId` | Tampering | Verify account exists; Zod int id |
| Credit available > limit / negative | Tampering | D-07 bounds after `parseMajorToMinor` |
| Debt field smuggling | Tampering | No debt column; Zod omit debt (continue T-02-08) |
| Float money injection | Tampering | BigInt-only `money.ts` (T-02-05) |
| Unique overwrite surprise | Tampering | Intended D-09; surface Russian “обновлено” not silent fail |
| Delete without intent from Dialog | Tampering | Delete only in history UI (D-11) |

## Sources

### Primary (HIGH confidence)

- `prisma/schema.prisma` — `BalanceAmountStub`, `FxRateStub.asOfDate`, `Account.creditLimitMinor` (Read this session)
- `src/app/accounts/page.tsx`, `AccountList.tsx`, `AccountFormDialog.tsx`, `actions.ts`, `money.ts` — integration points (Read / codegraph explore)
- `.planning/phases/03-dated-balance-snapshots/03-CONTEXT.md` — locked decisions
- `.planning/phases/02-currencies-accounts/02-RESEARCH.md` — stack/patterns to extend
- `[CITED: nextjs.org/docs/app/guides/forms]` — Server Actions + Zod + `useActionState`
- `[CITED: prisma.io/docs/orm/reference/prisma-client-reference#findfirst]` — `findFirst` + `orderBy`
- `[CITED: prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-composite-ids-and-constraints]` — compound unique upsert

### Secondary (MEDIUM confidence)

- WebSearch digests for Prisma compound upsert / LOCF semantics (classify-confidence MEDIUM with `--verified`)
- Phase 2 SECURITY.md threat patterns to extend for balance actions

### Tertiary (LOW confidence)

- External LOCF/snapshot product docs (Blnk, Snowflake ASOF) — conceptual only; product rules come from CONTEXT

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — reuse pinned Phase 1–2 packages; no new deps
- Architecture: HIGH — CONTEXT locks UI/credit/LOCF; codebase seams verified
- Pitfalls: HIGH — stub test, TZ, zero-invention, credit semantics grounded in prior phases

**Research date:** 2026-09-03  
**Valid until:** 2026-10-03 (stable stack; re-check if Prisma major pin changes)

### MVP / tracer planning note

Prefer 3–4 plans: (0) Wave 0 failing LOCF/Zod tests → (1) schema migrate + `balances.ts` → (2) Server Actions → (3) AccountList Dialog + expand history UI. Vertical slice: one account can set past balance and see LOCF on list before polish.
