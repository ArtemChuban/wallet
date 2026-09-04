# Phase 8: Debts schema + domain math - Research

**Researched:** 2026-09-04
**Domain:** Prisma/SQLite ledger schema + pure BigInt debt math (side-ledger, no NW coupling)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** No `writeOffMinor` on `Debt` and no special `WRITE_OFF` repayment type. — **Reversibility:** one-way — schema + remaining formula; undoing needs migration and rewrite of helpers/tests.
- **D-02:** Two event tables: **repayments** and **size changes** (separate models). Size changes are signed and may go **both up and down**. — **Reversibility:** one-way — two tables vs unified event table is a migration.
- **D-03:** `Debt.initialAmountMinor` is the original principal at create (**must be > 0**); it is **not edited directly**. Adjustments go through size-change events.
- **D-04:** Math:
  - `currentPrincipal = initialAmountMinor + Σ deltaMinor`
  - `remaining = currentPrincipal − Σ repayment.amountMinor`
  - Early close = size-change **down by current remaining** (delta ≠ 0) so remaining hits 0, then status `CLOSED` (same auto-close rule as any path to zero).
- **D-05:** Size-change row stores **`deltaMinor` (signed)**, not absolute principal-after. Reject **`deltaMinor === 0`**.
- **D-06:** Both repayments and size changes may have optional nullable **`note`**.
- **D-07:** Size changes have calendar **`asOfDate`** (`YYYY-MM-DD`) with **backdating allowed**, same convention as repayments / balance snapshots.
- **D-08:** Allow **multiple repayments** on the same `asOfDate` (no unique on `(debtId, asOfDate)`).
- **D-09:** Allow **multiple size changes** on the same `asOfDate` (same policy).
- **D-10:** When ordering events for remaining / future series: **strict insert `id` order** across both event kinds (not “all size changes then repayments”).
- **D-11:** Persist enum **`OPEN` | `CLOSED`** on `Debt`. Do **not** store `closedAt`.
- **D-12:** **Auto-close:** whenever remaining reaches **0** → `CLOSED`. **Auto-reopen:** whenever remaining becomes **> 0** → `OPEN`.
- **D-13:** Hard invariant in helpers: **`status` always synced with remaining** (`CLOSED` ↔ remaining == 0, `OPEN` ↔ remaining > 0). Desync is a bug.
- **D-14:** Events **are allowed** on `CLOSED` debts; after apply, status recomputes from remaining.
- **D-15:** **Remaining must never be < 0** — reject repayments that exceed remaining and size-change downs that would make `currentPrincipal < Σ repayments`.
- **D-16:** Totals include **OPEN debts only**.
- **D-17:** Missing FX for non-primary currency → **exclude** that debt from the side total and set **`isPartial`** (same honesty as NW dashboard).
- **D-18:** Helper takes explicit **`asOfDate`** (caller passes “today” Europe/Moscow); LOCF rate as of that date; primary currency uses identity (no FxRate row required).
- **D-19:** Return shape mirrors **`computeNetWorthRows`**: per-debt rows (native remaining, primary contribution or excluded, flags) **plus** aggregates `iOwePrimaryMinor` / `theyOwePrimaryMinor` / `isPartial`.
- **D-20:** `Person` → `Debt`: **`onDelete: Restrict`** (aligns with PERSON-02 — cannot delete person with debts).
- **D-21:** `Debt` → repayments / size changes: **`onDelete: Cascade`** (deleting a debt removes its event history).
- **D-22:** `Currency` → `Debt`: **`onDelete: Restrict`** (same as Account / FxRate).
- **D-23:** Phase 8 implements **remaining + status sync + validation + primary totals** helpers and tests only. **Do not** implement `buildDebtRemainingSeries` / repayment series in this phase — defer to Phase 11.
- **D-24:** **DISOL-01 hard gate:** no debt imports in `src/lib/net-worth.ts`, `src/lib/historical-series.ts`, or `src/app/page.tsx`. Suggested new module: `src/lib/debts.ts` (name flexible).

### Claude's Discretion
- Exact Prisma model/field names (`DebtSizeChange` vs `DebtAdjustment`, etc.) as long as D-01–D-22 hold.
- Zod validation module layout under `src/lib/validations/`.
- Whether repayment `amountMinor` must be strictly `> 0` (recommended yes, symmetric with reject zero size delta).
- Direction enum labels (`I_OWE` / `THEY_OWE`) and Person `name` `@unique` (research default) unless planner finds a conflict.
- Optional Debt fields already in roadmap/research (`dueDate`, `note` on Debt) — include in schema for Phase 9 readiness even though UI is later; planner may slim if it blocks migrate.

### Deferred Ideas (OUT OF SCOPE)
- Chart series helpers (`buildDebtRemainingSeries`, repayment amounts) — **Phase 11** (D-23)
- People/debts CRUD UI, nav «Долги» — **Phase 9**
- Repayment/close Server Actions UX, delete repayment reopen flows in UI — **Phase 10** (domain rules locked here)
- Debt list filters/search, interest, cross-currency repayments, NW inclusion — out of milestone / future REQUIREMENTS

None — discussion stayed within clarifying Phase 8 schema + math (size-change model updates DEBT-02/03 interpretation).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DEBT-02 | Remaining balance math (REQUIREMENTS still says `initial − Σ repayments − writeOff`) | **CONTEXT override:** implement D-04 size-change ledger — `remaining = initialAmountMinor + Σ deltaMinor − Σ repayment.amountMinor`. No `writeOffMinor`. Pure helpers + Vitest. |
| DEBT-03 | Initial amount immutability (REQUIREMENTS: after first repayment) | **CONTEXT override:** `initialAmountMinor` never edited directly (D-03); adjustments only via size-change events. Domain/validation helper rejects initial mutation. |
| DISOL-01 | Debts never change net worth or NW charts | Hard gate: no debt imports in `net-worth.ts`, `historical-series.ts`, `page.tsx` (D-24). Source-scan Vitest like `foundation.test.ts`. Totals live only in debts module. |
</phase_requirements>

## Summary

Phase 8 adds a **parallel SQLite ledger** beside accounts: `Person`, `Debt`, `DebtRepayment`, and `DebtSizeChange`, plus pure BigInt helpers for principal/remaining, status sync, over-repayment / illegal size-down rejection, and OPEN-only primary totals with NW-style FX honesty. Milestone research that suggested `writeOffMinor` / `closedAt` is **superseded** by CONTEXT D-01–D-15.

**Do not follow ROADMAP success criterion 2 literally** (`remaining = initial − Σ repayments − writeOff`) — that text is stale relative to CONTEXT. Planner success checks must use D-04.

Stack is already pinned: Prisma 7.10.0 + SQLite INTEGER/BigInt money, Zod 4.5.4, Vitest 4.1.11. **No new npm packages.** Mirror `computeNetWorthRows` / `convertOtherMinorToPrimaryMinor` patterns; keep debts out of `/` and NW modules.

**Primary recommendation:** Ship one migration + `src/lib/debts.ts` (+ `debts.test.ts`) implementing D-04/D-11–D-19 sums and status sync; add optional `src/lib/validations/debts.ts` for reusable Zod shapes; gate DISOL-01 with a file-content test.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Person / Debt / event persistence | Database / Storage | API / Backend (later) | Prisma models + migration; no UI this phase |
| Remaining / principal / status sync | API / Backend (pure lib) | — | Domain math in `src/lib/debts.ts`; no React |
| Over-repayment / size-down validation | API / Backend (pure lib) | — | Helpers reject illegal events before DB write (actions Phase 10) |
| Initial-amount immutability | API / Backend (pure lib) | — | Validation helper; Server Actions later |
| Primary I-owe / they-owe totals + isPartial | API / Backend (pure lib) | Browser (Phase 11 UI) | Same honesty as NW; caller supplies LOCF rates |
| DISOL-01 isolation gate | Build / test | Frontend Server | Static import ban; NW page unchanged |
| Chart series | — (deferred) | — | Phase 11 only (D-23) |

## Project Constraints (from .cursor/rules/)

No `.cursor/rules/` directory present in this repo. Follow workspace `AGENTS.md` / `CLAUDE.md`: this Next.js tree may differ from training data — consult `node_modules/next/dist/docs/` before any Next API work (Phase 8 is schema/lib only; Next surface change not required).

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `prisma` / `@prisma/client` | **7.10.0** (pinned) | Schema + migrate deploy | Existing wallet stack; Docker entrypoint runs `prisma migrate deploy` |
| `@prisma/adapter-better-sqlite3` | **7.10.0** | SQLite driver | Same as v1.0 |
| `better-sqlite3` | **13.0.3** | Native SQLite | Pinned via overrides |
| `zod` | **4.5.4** (pinned) | Input shape schemas | Existing `src/lib/validations/*` |
| `vitest` | **4.1.11** (pinned) | Unit tests | `npm test` → `vitest run`; `vitest.config.ts` includes `src/**/*.test.ts` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@/lib/money` | in-repo | `convertOtherMinorToPrimaryMinor` | Primary totals for non-primary debts |
| `@/lib/net-worth` | in-repo | Shape analog only — **do not import into** | Copy return-shape ideas into debts module |
| `@/lib/locf` / `@/lib/fx` | in-repo | Rate as-of / LOCF | Totals helper takes **pre-resolved** rates (pure); pages later batch LOCF |
| `@/lib/dates` | in-repo | `YYYY-MM-DD` / Moscow today | Callers pass `asOfDate`; helpers stay pure |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Two event tables (locked D-02) | Single `DebtEvent` polymorphic table | Simpler cross-kind `id` order; **rejected by D-02** |
| `writeOffMinor` field | Size-change down (locked) | Old REQUIREMENTS/ROADMAP text — **do not implement** |
| Unified event `id` sequence | Separate AUTOINCREMENT + `createdAt` | D-10 RESOLVED: Phase 8 sums + createdAt; Phase 11 ordering later |

**Installation:**

```bash
# No new packages — use existing pins in package.json
npm test
npx prisma migrate dev --name debts_schema
```

**Version verification:** `package.json` pins prisma/`@prisma/client`/`@prisma/adapter-better-sqlite3` at `7.10.0`, `zod` at `4.5.4`, `vitest` at `4.1.11`. Registry `npm view prisma version` currently advertises `8.0.0-rc.13` — **do not upgrade**; stay on human-locked 7.10.0. [VERIFIED: package.json:17-48]

## Package Legitimacy Audit

> Phase installs **no new** external packages. Existing pins checked for completeness only.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| zod | npm | already in tree @ 4.5.4 | high | github.com/colinhacks/zod | SUS (seam: too-new) | **No install** — already approved in v1.0 |
| vitest | npm | already in tree @ 4.1.11 | high | github.com/vitest-dev/vitest | SUS (seam: too-new) | **No install** |
| prisma | npm | already in tree @ 7.10.0 | high | prisma/prisma | SUS (seam: too-new) / latest RC unrelated | **No install** — keep 7.10.0 pin |

**Packages removed due to [SLOP] verdict:** none  
**Packages flagged as suspicious [SUS]:** none for new installs (legitimacy seam flags existing high-download packages as “too-new”; planner must **not** add install checkpoints for packages already in `package.json`)

## Architecture Patterns

### System Architecture Diagram

```
[Prisma migrate deploy] ──► SQLite
                              │
                    Person ──1:*── Debt ──*── DebtRepayment
                              │            └── DebtSizeChange
                              └── Currency (Restrict)
                                    └── FxRate (read-only LOCF for totals)

Pure helpers (src/lib/debts.ts):
  events/minors ──► currentPrincipal / remaining / statusFromRemaining
                 ──► assertRepayment / assertSizeChange / assertInitialImmutable
  OPEN debts + rates ──► computeDebtPrimaryTotals
                           ├── iOwePrimaryMinor
                           ├── theyOwePrimaryMinor
                           └── isPartial

HARD GATE: net-worth.ts / historical-series.ts / app/page.tsx
           must NOT import debts module
```

### Recommended Project Structure

```
prisma/schema.prisma              # + Person, Debt, enums, event models; Currency.debts
prisma/migrations/<ts>_debts_*/   # new migration SQL
src/lib/debts.ts                  # pure domain math + totals
src/lib/debts.test.ts             # Vitest: remaining, status, rejects, totals, DISOL scan
src/lib/validations/debts.ts      # optional Zod: asOfDate, majors, direction (Phase 9-ready)
src/lib/validations/debts.test.ts # optional
```

### Pattern 1: Size-change ledger remaining (replaces writeOff)

**What:** Principal is create-time initial plus signed deltas; repayments only reduce remaining.  
**When to use:** All Phase 8 math and future Server Actions.  
**Example:**

```typescript
// Source: CONTEXT D-04; mirror money BigInt style from src/lib/money.ts
export function currentPrincipalMinor(
  initialAmountMinor: bigint,
  sizeDeltas: readonly bigint[],
): bigint {
  return sizeDeltas.reduce((sum, d) => sum + d, initialAmountMinor);
}

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

### Pattern 2: Status synced from remaining

**What:** `statusForRemaining(r)` returns `CLOSED` iff `r === 0n`, else `OPEN`; assert never `r < 0n`.  
**When to use:** After every event apply (Phase 10) and in unit tests (Phase 8).

### Pattern 3: Primary totals mirror NW

**What:** Map OPEN debts → rows with `includedInTotal` / `excludeReason: "none" | "no_fx"`; identity conversion when `isPrimaryCurrency`; else `convertOtherMinorToPrimaryMinor`. Aggregate by `I_OWE` / `THEY_OWE`.  
**When to use:** `computeDebtPrimaryTotals(input)` — pure; caller supplies `rateToPrimaryScaled` per debt (null = missing FX).

### Anti-Patterns to Avoid

- **`writeOffMinor` or WRITE_OFF repayment type:** Forbidden by D-01; ARCHITECTURE.md / PITFALLS.md / ROADMAP text are stale.
- **Unique `(debtId, asOfDate)` on events:** Blocks same-day multiples (D-08/D-09); BalanceSnapshot uniqueness must **not** be copied.
- **Importing debts into NW modules:** Violates DISOL-01 / D-24.
- **Float / Number money:** Use BigInt minors only (existing money contract).
- **`closedAt` column:** Forbidden by D-11.
- **Implementing series builders now:** Deferred D-23.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| FX conversion | Custom rate math | `convertOtherMinorToPrimaryMinor` | Already tested truncation semantics |
| LOCF rate pick | Ad-hoc sort | `@/lib/locf` / page batch (later) | Phase 7 consolidated LOCF |
| asOfDate parse | New date libs | `YYYY-MM-DD` string + existing Zod regex in balance validations | Same wire format |
| FK delete semantics | App-only checks | Prisma `onDelete: Restrict` / `Cascade` | SQLite FK with `PRAGMA foreign_keys=ON` |
| Test runner | Custom assert scripts | Vitest co-located `*.test.ts` | Established pattern |

**Key insight:** Remaining is a **sum of ledger events**, not a mutable balance column — keep one pure function as source of truth so UI/actions cannot drift.

## Common Pitfalls

### Pitfall 1: Following stale writeOff formula

**What goes wrong:** Schema adds `writeOffMinor`; tests encode REQUIREMENTS DEBT-02 literally.  
**Why it happens:** ROADMAP / ARCHITECTURE / REQUIREMENTS not updated after discuss-phase.  
**How to avoid:** CONTEXT is authority; planner/verifier checklist cites D-04 only.  
**Warning signs:** Field named writeOff; remaining formula with third subtraction term.

### Pitfall 2: Copying BalanceSnapshot uniqueness onto repayments

**What goes wrong:** Second repayment same day fails unique constraint.  
**Why it happens:** Schema copy-paste from `accountId_asOfDate`.  
**How to avoid:** No `@@unique` on event `(debtId, asOfDate)` (D-08/D-09).  
**Warning signs:** Migration creates unique index on debtId+asOfDate for events.

### Pitfall 3: Cross-table `id` order for D-10

**What goes wrong:** Phase 11 series orders by comparing repayment.id vs sizeChange.id — sequences are independent AUTOINCREMENT counters, so “strict insert id order across kinds” is **not well-defined**.  
**Why it happens:** D-10 assumes comparable ids.  
**How to avoid (Phase 8):** Remaining/status use **order-independent sums** (sufficient for DEBT-02). Add `createdAt DateTime @default(now())` on both event models for Phase 11. **RESOLVED:** shared `seq` only if Phase 11 needs true global insert order — not a Phase 8 blocker.  
**Warning signs:** Phase 8 tasks that merge-sort by `id` across tables for remaining.

### Pitfall 4: NW leak / credit “debt” name collision

**What goes wrong:** Import debts into `historical-series` because credit charts already use `debtMinor`.  
**Why it happens:** Naming collision (`debt` = credit-card debt in NW).  
**How to avoid:** Personal IOU module name `debts.ts`; never touch credit stack; DISOL source-scan test.  
**Warning signs:** `from "@/lib/debts"` inside NW files.

### Pitfall 5: SQLite FK not enforced

**What goes wrong:** Restrict/Cascade appear in schema but app deletes persons with debts.  
**Why it happens:** SQLite needs `PRAGMA foreign_keys=ON` — already in `ensureSqlitePragmas`.  
**How to avoid:** Keep pragma path; migration smoke via Docker entrypoint.  
**Warning signs:** Orphan debts after person delete in later phases.

### Pitfall 6: Totals include CLOSED or invent FX

**What goes wrong:** Closed debts inflate “I owe”; missing rate treated as 0.  
**Why it happens:** Skipping D-16/D-17.  
**How to avoid:** Mirror NW `no_fx` exclusion + `isPartial`; OPEN filter first.  
**Warning signs:** Totals without `isPartial`; primary contribution `0n` for missing FX counted as included.

### Pitfall 7: Size-change down below repaid principal

**What goes wrong:** `currentPrincipal < Σ repayments` ⇒ negative remaining.  
**Why it happens:** Absolute principal-after field or unchecked negative delta.  
**How to avoid:** Store signed `deltaMinor`; reject if `currentPrincipal + delta < sum(repayments)` or `delta === 0` (D-05/D-15).  
**Warning signs:** Remaining helper clamps to 0 instead of rejecting.

## Code Examples

Verified patterns from this repo (adapt for debts):

### Compute remaining + status

```typescript
// Source: CONTEXT D-04, D-11–D-13 — implement in src/lib/debts.ts
export type DebtStatus = "OPEN" | "CLOSED";

export function statusForRemaining(remaining: bigint): DebtStatus {
  if (remaining < 0n) {
    throw new Error("remaining must never be < 0");
  }
  return remaining === 0n ? "CLOSED" : "OPEN";
}

export function assertStatusSynced(
  status: DebtStatus,
  remaining: bigint,
): void {
  const expected = statusForRemaining(remaining);
  if (status !== expected) {
    throw new Error(`status desync: have ${status}, want ${expected}`);
  }
}
```

### Reject over-repayment / illegal size-down

```typescript
// Source: CONTEXT D-05, D-15
export function assertRepaymentAmount(
  amountMinor: bigint,
  remainingBefore: bigint,
): void {
  if (amountMinor <= 0n) {
    throw new Error("repayment amount must be > 0");
  }
  if (amountMinor > remainingBefore) {
    throw new Error("repayment exceeds remaining");
  }
}

export function assertSizeDelta(
  deltaMinor: bigint,
  currentPrincipal: bigint,
  sumRepayments: bigint,
): void {
  if (deltaMinor === 0n) {
    throw new Error("size delta must not be 0");
  }
  const nextPrincipal = currentPrincipal + deltaMinor;
  if (nextPrincipal < sumRepayments) {
    throw new Error("size change would make remaining < 0");
  }
}
```

### NW return-shape analog (totals)

```typescript
// Source: src/lib/net-worth.ts:60-72 — mirror structure, do not import debts into NW
export function computeDebtPrimaryTotals(/* OPEN debts + rates */) {
  // rows: per debt
  // iOwePrimaryMinor / theyOwePrimaryMinor
  // isPartial: some OPEN debt excluded for no_fx
}
```

### DISOL-01 source gate (recommended test)

```typescript
// Source: pattern from src/lib/foundation.test.ts file reads
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

### Recommended Prisma sketch (names discretionary)

```prisma
// Source: CONTEXT D-01–D-22 + prisma/schema.prisma patterns [VERIFIED patterns: FxRate onDelete Restrict at schema.prisma:46]
enum DebtDirection {
  I_OWE
  THEY_OWE
}

enum DebtStatus {
  OPEN
  CLOSED
}

model Person {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  debts     Debt[]
}

model Debt {
  id                 Int            @id @default(autoincrement())
  personId           Int
  person             Person         @relation(fields: [personId], references: [id], onDelete: Restrict)
  direction          DebtDirection
  currencyCode       String
  currency           Currency       @relation(fields: [currencyCode], references: [code], onDelete: Restrict)
  initialAmountMinor BigInt
  dueDate            String? // YYYY-MM-DD
  note               String?
  status             DebtStatus     @default(OPEN)
  createdAt          DateTime       @default(now())
  updatedAt          DateTime       @updatedAt
  repayments         DebtRepayment[]
  sizeChanges        DebtSizeChange[]
}

model DebtRepayment {
  id          Int      @id @default(autoincrement())
  debtId      Int
  debt        Debt     @relation(fields: [debtId], references: [id], onDelete: Cascade)
  asOfDate    String // YYYY-MM-DD
  amountMinor BigInt
  note        String?
  createdAt   DateTime @default(now())
}

model DebtSizeChange {
  id         Int      @id @default(autoincrement())
  debtId     Int
  debt       Debt     @relation(fields: [debtId], references: [id], onDelete: Cascade)
  asOfDate   String // YYYY-MM-DD
  deltaMinor BigInt // signed; app rejects 0
  note       String?
  createdAt  DateTime @default(now())
}
```

Also add `debts Debt[]` on `Currency`. Enums map to SQLite `TEXT`. [CITED: prisma.io SQLite type mapping — Enum→TEXT, BigInt→INTEGER]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `writeOffMinor` / WRITE_OFF repayment | Signed `DebtSizeChange.deltaMinor` | 2026-09-04 CONTEXT | Remaining formula + early close path |
| `closedAt` timestamp | Status enum only + sync from remaining | CONTEXT D-11 | Simpler reopen |
| Immutable initial after first repayment | Initial never edited; size changes adjust | CONTEXT D-03 | DEBT-03 reinterpreted |
| Unique repayment per day | Multiple events same `asOfDate` | CONTEXT D-08/D-09 | Realistic ledger |

**Deprecated/outdated:**
- `.planning/research/ARCHITECTURE.md` writeOff / closedAt suggestions — superseded
- `.planning/research/PITFALLS.md` “persist writeOffMinor” — superseded by size-change downs
- ROADMAP Phase 8 success criterion #2 writeOff wording — superseded

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Recommended model name `DebtSizeChange` (vs `DebtAdjustment`) | Schema sketch | Rename only; no behavior risk |
| A2 | Repayment `amountMinor` must be `> 0` (discretion; recommended) | Validation | If 0 allowed, status/remaining edge cases |
| A3 | Person.`name` `@unique` | Schema | Later merge (PERSON-03) harder; align with Account.name unique |
| A4 | Cross-table D-10 satisfied in Phase 8 by **sums only**; series ordering deferred with `createdAt` | Pitfall 3 / Open Questions (RESOLVED) | Phase 11 may need shared `seq` migration |
| A5 | Totals helper is pure and takes rates as inputs (no Prisma inside `debts.ts`) | Architecture | If planner puts Prisma in debts.ts, harder to unit test |

**If this table is empty:** — not empty; A1–A5 need planner confirmation where marked discretion.

## Open Questions (RESOLVED)

1. **D-10 cross-kind insert order** — **RESOLVED**
   - What we know: Two AUTOINCREMENT `id` spaces are not comparable; Phase 8 remaining is sum-based.
   - Resolution: Phase 8 remaining/status use **order-independent sums only**; both event models get `createdAt DateTime @default(now())` now (planner A4). Exact Phase 11 mixed-event sort key (`(asOfDate ASC, createdAt ASC, kind, id ASC)` or shared `seq`) deferred to Phase 11 — does not block Phase 8.

2. **Whether Zod schemas ship in Phase 8 vs helpers-only** — **RESOLVED**
   - What we know: UI/actions are Phase 9–10; domain tests can call helpers with BigInt directly.
   - Resolution: Ship thin `src/lib/validations/debts.ts` in **Plan 03** (asOfDate + direction enums + positive majors; shape only — remaining rules stay in `debts.ts` asserts).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Prisma / Vitest | ✓ | v24.5.0 | — |
| npm / package pins | Install | ✓ | package.json | — |
| Docker | migrate-on-start success criterion | ✓ | 29.5.3 | Host `prisma migrate deploy` |
| `docker/entrypoint.sh` | Success criterion 1 | ✓ | runs `prisma migrate deploy` | — |
| SQLite via better-sqlite3 | Persistence | ✓ | 13.0.3 | — |
| Context7 CLI | Docs | ✗ | — | Official Prisma docs + WebSearch (used) |

**Missing dependencies with no fallback:** none for Phase 8  

**Missing dependencies with fallback:** Context7 — used prisma.io docs + codebase verification  

Step 2.6: External tools checked; phase is schema + pure lib (Docker for acceptance smoke).

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest **4.1.11** |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test` (`vitest run`) |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DEBT-02 | remaining = initial + ΣΔ − Σ repayments; over-repay reject | unit | `npx vitest run src/lib/debts.test.ts` | ❌ Wave 0 |
| DEBT-03 | initialAmountMinor mutation rejected / size-change path | unit | `npx vitest run src/lib/debts.test.ts` | ❌ Wave 0 |
| DISOL-01 | no debt imports in NW / series / `/` | unit (source scan) | `npx vitest run src/lib/debts.test.ts` | ❌ Wave 0 |
| D-12/D-13 | status sync OPEN↔remaining>0, CLOSED↔0 | unit | same | ❌ Wave 0 |
| D-16–D-19 | OPEN-only totals + isPartial / primary identity | unit | same | ❌ Wave 0 |
| Migrate | Person/Debt/events migrate cleanly | smoke | Docker start / `prisma migrate deploy` | ❌ Wave 0 (manual/CI) |

### Sampling Rate

- **Per task commit:** `npx vitest run src/lib/debts.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green + migrate deploy smoke before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/lib/debts.test.ts` — covers DEBT-02/03, status, rejects, totals, DISOL-01
- [ ] `src/lib/debts.ts` — implementation under test
- [ ] Optional `src/lib/validations/debts.test.ts` if Zod module ships
- [ ] Migration folder under `prisma/migrations/` for debts schema

*(Framework already installed — no Vitest install gap.)*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Single-user local wallet; no auth in scope |
| V3 Session Management | no | — |
| V4 Access Control | no | No multi-user ACL this milestone |
| V5 Input Validation | yes | Zod shapes + domain asserts (`amountMinor > 0`, `delta ≠ 0`, remaining ≥ 0) |
| V6 Cryptography | no | No new crypto; money is BigInt arithmetic only |

### Known Threat Patterns for Prisma/SQLite ledger

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Negative / overflow money corruption | Tampering | BigInt helpers; reject remaining < 0; Prisma P2023 on out-of-range ints |
| Cascade wipe of audit via person delete | Elevation / Tampering | `Person→Debt` Restrict (D-20) |
| Orphan events | Tampering | `Debt→events` Cascade only when debt deleted intentionally |
| NW integrity bypass by coupling | Tampering | DISOL-01 import gate |
| Injection via raw SQL | Tampering | Prefer Prisma Client; existing `$executeRawUnsafe` only for fixed PRAGMA strings |

## Sources

### Primary (HIGH confidence)

- `.planning/phases/08-debts-schema-domain-math/08-CONTEXT.md` — locked D-01–D-24
- `prisma/schema.prisma` — Currency/Account/FxRate/BalanceSnapshot patterns; `onDelete: Restrict` on FxRate [VERIFIED: prisma/schema.prisma:43-61]
- `src/lib/net-worth.ts` — `computeNetWorthRows` shape [VERIFIED: src/lib/net-worth.ts:60-72]
- `src/lib/money.ts` — `convertOtherMinorToPrimaryMinor` [VERIFIED: src/lib/money.ts:146-156]
- `docker/entrypoint.sh` — `prisma migrate deploy` on start [VERIFIED: docker/entrypoint.sh:6-7]
- `package.json` — pins [VERIFIED: package.json:17-48]
- `src/lib/db.ts` — `PRAGMA foreign_keys=ON` [VERIFIED: src/lib/db.ts:26-31]

### Secondary (MEDIUM confidence)

- [Prisma referential actions](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/referential-actions) — Cascade / Restrict; SQLite supported; mandatory relation default Restrict [CITED]
- [Prisma SQLite type mapping](https://www.prisma.io/docs/orm/core-concepts/supported-databases/sqlite) — Enum→TEXT, BigInt→INTEGER [CITED]

### Tertiary (LOW confidence)

- Cross-table insert-order semantics for D-10 — reasoned from AUTOINCREMENT behavior; not falsified against a Prisma doc [ASSUMED / A4]

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — already pinned in repo; no new deps
- Architecture: **HIGH** — CONTEXT + existing NW/money patterns
- Pitfalls: **HIGH** — milestone PITFALLS + CONTEXT overrides verified against schema

**Research date:** 2026-09-04  
**Valid until:** 2026-10-04 (stable domain; re-check if Prisma pin changes)
