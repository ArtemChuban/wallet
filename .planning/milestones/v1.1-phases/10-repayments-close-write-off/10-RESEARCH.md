# Phase 10: Repayments + close/write-off - Research

**Researched:** 2026-09-05
**Domain:** Same-currency debt repayments, mixed event history, auto-close/reopen, early forgive via size-change
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Debt detail surface
- **D-01:** Repayments, history, forgive, and size-change live in a **dedicated debt detail Dialog** — not inside `DebtFormDialog`, not as a list-row repay-only dialog.
- **D-02:** Opening detail: **click the entire debt row** on `/debts`. Meta edit remains a separate control path.
- **D-03:** Container is **Dialog** (existing `src/components/ui/dialog.tsx`). Do **not** add Sheet for this phase.
- **D-04:** Debt meta edit (direction / due / note) stays in **separate `DebtFormDialog`**. Detail Dialog has **«Изменить»** that opens it. Debt delete stays in edit dialog (Phase 9 D-14).

#### History
- **D-05:** History is a **mixed timeline**: repayments **and** size-changes. Event order for domain math remains Phase 8 D-10 (`asOfDate` + insert `id`); UI list is **newest first**.
- **D-06:** User can **delete both** repayments and size-changes. Each delete uses **in-dialog second-step confirm** (Phase 9 D-16). After delete: remaining + status recompute (auto-reopen if remaining > 0).
- **D-07:** Event type labels (RU): **«Погашение»** for repayments; **«Изменение суммы»** for manual size-changes; **«Списание»** for events created via the forgive button (D-09).

#### Early forgive / size-change
- **D-08:** Provide **both**: one-tap **«Простить остаток»** (creates size-change delta = −current remaining) **and** a manual **«Изменение суммы»** form for other deltas (up/down). Math/close rules unchanged from Phase 8 D-04 / D-12.
- **D-09:** «Простить остаток» requires **in-dialog confirm** stating the remaining amount being written off and that the debt will close.
- **D-10:** Forgive form fields: **`asOfDate` required** (backdating allowed, Europe/Moscow conventions as elsewhere); **note optional**.

#### CLOSED debts on list
- **D-11:** CLOSED debts stay in the **same person group**, under a **collapsed «Закрытые (N)»** subsection (not a page-global closed section).
- **D-12:** «Закрытые» subsection is **collapsed by default**.
- **D-13:** CLOSED debts keep **full detail access**: add repayment / size-change / forgive, delete events, open «Изменить» meta, delete debt. Status always recomputes from remaining (Phase 8 D-14).

### Claude's Discretion
- Exact Dialog layout density for detail (form above vs below history).
- Exact RU microcopy for confirm steps and empty history, as long as D-07 labels and D-09 confirm intent hold.
- How to distinguish «Списание» rows from manual size-changes in persistence (e.g. note convention vs optional reason enum) — prefer minimal schema change; must not break Phase 8 ledger (no `writeOffMinor`, no WRITE_OFF repayment type).
- Whether «Простить остаток» is hidden when remaining is already 0.
- Server Action module layout under `src/app/debts/`; reuse `createRepaymentSchema` / `createSizeChangeSchema` and domain asserts.

### Deferred Ideas (OUT OF SCOPE)
- Remaining/repayment charts and «я должен»/«мне должны» primary totals — **Phase 11**
- Cross-currency repayments (REPAY-04), repayments updating account snapshots (REPAY-05) — out of milestone
- Debt list filters/search, interest — out of milestone
- Sheet primitive — rejected for Phase 10; revisit only if Dialog UX fails on mobile

None folded from todos (no matching todos).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REPAY-01 | Partial repayment in debt currency with as-of date (backdating allowed) | Wire `createRepaymentSchema` + `assertRepaymentAmount` + status sync in Server Action; Dialog form with `calendarDateToday()` default |
| REPAY-02 | See repayment history for a debt | Mixed timeline in `DebtDetailDialog` (repayments + size-changes), newest-first UI sort |
| REPAY-03 | Delete repayment; remaining recalculates; reopen if remaining > 0 | `deleteRepayment` action + `statusForRemaining`; DestructiveConfirmStep |
| DEBT-04 | Auto-close when remaining reaches 0 | After every event write: `status = statusForRemaining(remaining)` — no separate close toggle |
| DEBT-05 | Early close by write-off / forgive | Forgive → size-change `deltaMinor = −remaining` (Phase 8 D-04); label «Списание» (D-07) |
</phase_requirements>

## Summary

Phase 10 is mostly **wiring + UI**, not new math. Phase 8 already ships `remainingMinor`, `statusForRemaining`, `assertRepaymentAmount`, `assertSizeDelta` in `src/lib/debts.ts`. Phase 9 ships `/debts` list, `DebtFormDialog`, `DestructiveConfirmStep`, and Zod shapes `createRepaymentSchema` / `createSizeChangeSchema` — but **no repayment/size-change Server Actions** and **never updates `Debt.status` after create**. [VERIFIED: src/app/debts/actions.ts:260-269] create sets `status: "OPEN"` only; no later status writes exist in that file.

Planner should: (1) add event create/delete/forgive actions that recompute remaining and sync status atomically; (2) build dedicated `DebtDetailDialog` opened by full-row click; (3) split OPEN vs collapsed «Закрытые (N)» per person; (4) persist forgive vs manual size-change with minimal schema (recommend boolean flag — see Discretion). No new npm packages. Charts/totals stay Phase 11. Milestone ARCHITECTURE.md still mentions `writeOffMinor` — **superseded** by Phase 8 size-change ledger; ignore that formula. [CITED: .planning/phases/08-debts-schema-domain-math/08-CONTEXT.md D-01–D-04]

**Primary recommendation:** Extend `src/app/debts/actions.ts` with transactional create/delete repayment + size-change + forgive helper; new `DebtDetailDialog` + list CLOSED subsection; reuse existing Zod + domain asserts; `revalidatePath("/debts")` only (DISOL-01).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Record repayment / size-change / forgive | API / Backend (Server Actions) | Browser form chrome | Zod + domain asserts + Prisma writes; status derived server-side |
| Remaining + status sync | API / Backend | Database `Debt.status` | Pure helpers compute; persist enum for list filter/sort |
| Mixed event history UI | Browser / Client | Frontend Server (RSC props) | Dialog timeline; events serialized from RSC |
| Open debt detail | Browser / Client | — | Row click → Dialog state |
| Meta edit / debt delete | Browser / Client | API (existing actions) | Stays in `DebtFormDialog` (D-04) |
| CLOSED subsection grouping | Browser / Client | RSC remaining/status | Per-person collapse; no new route |
| Charts / primary totals | — | — | Out of scope (Phase 11) |

## Project Constraints (from .cursor/rules/)

No `.cursor/rules/` directory in this repo. Apply `AGENTS.md` / Next agent block: this is **not** classic Next.js — check `node_modules/next/dist/docs/` before inventing APIs. [VERIFIED: AGENTS.md nextjs-agent-rules]

Relevant project skill patterns (Phase 9 PATTERNS / SECURITY): Dialog + `useActionState` + formKey remount; `DestructiveConfirmStep` never `window.confirm`; BigInt as string across RSC→client; `revalidatePath("/debts")` only; Zod `.strict()` on FormData.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.3.4 | App Router, Server Actions, `revalidatePath` | Already pinned; file-level `'use server'` [CITED: node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-server.md] |
| @prisma/client / prisma | 7.10.0 | SQLite Debt / DebtRepayment / DebtSizeChange | Existing models [VERIFIED: prisma/schema.prisma:48-83] |
| zod | 4.5.4 | FormData shape validation | Existing `createRepaymentSchema` / `createSizeChangeSchema` [VERIFIED: src/lib/validations/debts.ts:121-159] |
| vitest | 4.1.11 | Unit tests for actions + validations | `npm test` / `vitest.config.ts` [VERIFIED: package.json test script + vitest.config.ts] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn Dialog (`src/components/ui/dialog.tsx`) | in-repo | Detail + confirm chrome | D-03 — do not add Sheet |
| `@/lib/money` | in-repo | `parseMajorToMinor` / `formatMinorToMajor` | Form I/O |
| `@/lib/dates` `calendarDateToday` | in-repo | Default asOfDate Europe/Moscow | Form defaults [VERIFIED: src/lib/dates.ts:12-26] |
| `@/lib/debts` asserts | in-repo | Over-repay / size-delta / status | Every write path |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Dedicated detail Dialog | Nested route `/debts/[id]` | Rejected by D-01; Phase 11 charts hang on same Dialog later |
| Sheet for mobile | Dialog | Rejected by D-03 |
| `writeOffMinor` field | Size-change down | Superseded Phase 8; never reintroduce |
| Separate close Status toggle | `statusForRemaining` | Would desync ledger (Phase 8 D-13) |

**Installation:** none — no new packages this phase.

**Version verification:** `next@16.3.4`, `zod@4.5.4`, `vitest@4.1.11`, `prisma@7.10.0` from `package.json` (2026-09-05). [VERIFIED: npm package.json via shell]

## Package Legitimacy Audit

> No external packages to install.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| — | — | — | — | — | N/A | No installs |

**Packages removed due to [SLOP] verdict:** none  
**Packages flagged as suspicious [SUS]:** none (legitimacy check on existing `zod`/`vitest` returned SUS/too-new false positive for already-pinned deps — do not reinstall)

## Architecture Patterns

### System Architecture Diagram

```
[/debts RSC]
    │ load Person→Debt + repayments[] + sizeChanges[]
    │ compute remainingMinor → serialize BigInt strings + status
    ▼
[DebtsList client]
    ├─ OPEN rows ──row click──► [DebtDetailDialog]
    │                              ├─ repayment form ──► createRepayment SA
    │                              ├─ size-change form ► createSizeChange SA
    │                              ├─ «Простить остаток» ► forgive SA (+ confirm)
    │                              ├─ timeline delete ──► delete* SA (+ confirm)
    │                              └─ «Изменить» ──────► DebtFormDialog (meta/delete)
    └─ collapsed «Закрытые (N)» ── same detail path (D-13)

Server Action write path (all event mutations):
  FormData → Zod → load debt+events → remaining/asserts
    → prisma.$transaction { create|delete event; update Debt.status }
    → revalidatePath("/debts")
    ✗ never revalidate "/" / touch NW
```

### Recommended Project Structure

```
src/app/debts/
├── page.tsx                 # include full event rows; pass status + remaining
├── actions.ts               # + create/delete repayment, size-change, forgive
└── actions.test.ts          # + REPAY/DEBT-04/05 cases
src/components/debts/
├── DebtDetailDialog.tsx     # NEW — history + forms + forgive
├── DebtsList.tsx            # row click; OPEN vs Закрытые
├── DebtFormDialog.tsx       # unchanged role (meta/delete)
└── DestructiveConfirmStep.tsx
src/lib/
├── debts.ts                 # reuse asserts (no formula change)
└── validations/debts.ts     # + deleteRepaymentSchema, deleteSizeChangeSchema
prisma/schema.prisma         # optional: DebtSizeChange.isForgive Boolean @default(false)
```

### Pattern 1: Event write + status sync (transaction)

**What:** Load ledger, assert, write event, set `Debt.status` from `statusForRemaining` in one interactive transaction.  
**When to use:** Every create/delete repayment or size-change (including forgive).  
**Example:**

```typescript
// Source: https://www.prisma.io/docs/orm/prisma-client/queries/transactions
// Adapted to wallet debt ledger — domain helpers from src/lib/debts.ts
await prisma.$transaction(async (tx) => {
  const debt = await tx.debt.findUniqueOrThrow({
    where: { id: debtId },
    include: {
      repayments: { select: { amountMinor: true } },
      sizeChanges: { select: { deltaMinor: true } },
      currency: { select: { scale: true } },
    },
  });
  const remainingBefore = remainingMinor(
    debt.initialAmountMinor,
    debt.sizeChanges.map((s) => s.deltaMinor),
    debt.repayments.map((r) => r.amountMinor),
  );
  assertRepaymentAmount(amountMinor, remainingBefore);
  await tx.debtRepayment.create({
    data: { debtId, asOfDate, amountMinor, note },
  });
  const remainingAfter = remainingBefore - amountMinor;
  await tx.debt.update({
    where: { id: debtId },
    data: { status: statusForRemaining(remainingAfter) },
  });
});
revalidatePath("/debts");
```

[CITED: docs.prisma.io interactive transactions] Repo currently has **zero** `$transaction` usages — this phase introduces the pattern. [VERIFIED: grep `$transaction` in src → no matches]

### Pattern 2: Mixed timeline newest-first (UI only)

**What:** Merge repayments + size-changes into tagged events; sort `asOfDate` DESC, then `id` DESC for UI. Domain remaining stays order-independent sum (Phase 8).  
**When to use:** Detail history list (D-05).

```typescript
type TimelineEvent =
  | { kind: "repayment"; id: number; asOfDate: string; amountMinor: string; note: string | null }
  | { kind: "sizeChange"; id: number; asOfDate: string; deltaMinor: string; note: string | null; isForgive: boolean };

function sortNewestFirst(a: { asOfDate: string; id: number }, b: { asOfDate: string; id: number }) {
  if (a.asOfDate !== b.asOfDate) return a.asOfDate < b.asOfDate ? 1 : -1;
  return b.id - a.id;
}
```

Labels: repayment → «Погашение»; sizeChange && isForgive → «Списание»; else → «Изменение суммы». [ASSUMED layout density: forms above history]

### Pattern 3: Row click vs meta button

**What:** Entire compact row opens detail; «Изменить» uses `stopPropagation` so it only opens `DebtFormDialog`.  
**When to use:** `DebtsList` DebtCompactRow (D-02).

### Pattern 4: Forgive = size-change down by remaining

**What:** Compute `deltaMinor = -remainingBefore` (must be ≠ 0); `assertSizeDelta`; create size-change; status becomes CLOSED.  
**When to use:** «Простить остаток» after D-09 confirm. Hide button when `remaining === 0n`. [ASSUMED hide-at-zero — recommended yes]

### Anti-Patterns to Avoid

- **Flip status without ledger event:** Early close must insert size-change (Phase 8 D-04); never `status: CLOSED` alone. Milestone PITFALLS #7/`writeOffMinor` is superseded. [CITED: .planning/research/PITFALLS.md — mechanism outdated]
- **Reject events on CLOSED:** Phase 8 D-14 + Phase 10 D-13 allow events; status recomputes (supersedes PITFALLS #10 “reject on CLOSED”).
- **Put repay UI inside DebtFormDialog:** Violates D-01.
- **`window.confirm`:** Use `DestructiveConfirmStep`.
- **`revalidatePath("/")`:** DISOL-01 — debts actions touch `/debts` only.
- **IEEE float money:** BigInt minors only.
- **Unique (debtId, asOfDate):** Forbidden — multiple same-day events allowed (Phase 8 D-08/D-09).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Remaining / close math | Custom formulas in actions | `remainingMinor` / `statusForRemaining` / asserts | Already tested; DEBT-02 override is size-change ledger |
| Over-repayment checks | Ad-hoc comparisons | `assertRepaymentAmount` | Edge: amount === remaining OK; > remaining throws |
| Size-change floor | Manual principal math | `assertSizeDelta` | Prevents remaining < 0 |
| Destructive confirm UX | `window.confirm` / AlertDialog | `DestructiveConfirmStep` | Phase 9 D-16 |
| Delete-by-id Zod | Inline Number() | Mirror `deleteBalanceSchema` | [VERIFIED: src/lib/validations/balance.ts:17-21] |
| Default asOfDate | `new Date().toISOString().slice(0,10)` | `calendarDateToday()` | Europe/Moscow [VERIFIED: src/lib/dates.ts:12-26] |
| Money parse | `parseFloat` | `parseMajorToMinor` + currency.scale | Fractional digit errors |

**Key insight:** Domain is done; Phase 10 risk is **status desync** and **wrong UX surface**, not inventing ledger math.

## Common Pitfalls

### Pitfall 1: Status never updated after Phase 9 create
**What goes wrong:** Remaining hits 0 in UI math but `Debt.status` stays OPEN (or reverse after delete).  
**Why it happens:** Phase 9 only writes `status: "OPEN"` on create. [VERIFIED: src/app/debts/actions.ts:260-269]  
**How to avoid:** Every event mutation updates `status` via `statusForRemaining`. List CLOSED subsection must use synced status **or** derive from remaining consistently — prefer persist + pass `status` on rows.  
**Warning signs:** «Закрытые» empty while remaining shows 0.00.

### Pitfall 2: Forgive without size-change row
**What goes wrong:** CLOSED with repayments sum < principal; reopen/delete math lies.  
**Why it happens:** Temptation to only set status (old writeOff narrative).  
**How to avoid:** Forgive = `createSizeChange` with `delta = −remaining` only.

### Pitfall 3: «Списание» indistinguishable from manual down-delta
**What goes wrong:** D-07 label wrong after reload.  
**Why it happens:** Schema has only `note` on size-change today. [VERIFIED: prisma/schema.prisma:75-83]  
**How to avoid:** Add `isForgive Boolean @default(false)` (recommended) OR note sentinel. Inferring from `delta === −remaining` at display time is **wrong** after later events.

### Pitfall 4: Row click swallows meta edit
**What goes wrong:** Clicking «Изменить» also opens detail.  
**How to avoid:** `stopPropagation` on edit trigger / button container.

### Pitfall 5: Delete repayment without reloading full ledger
**What goes wrong:** Status/remaining wrong if computed from stale client props only.  
**How to avoid:** Server Action reloads all events after delete inside transaction; `revalidatePath` refreshes RSC props.

### Pitfall 6: Future asOfDate inconsistency
**What goes wrong:** Debts allow future dates while balances reject them.  
**Why it happens:** Repayment Zod only checks `YYYY-MM-DD` shape. [VERIFIED: src/lib/validations/debts.ts:2-5,121-127]  
**How to avoid:** Mirror accounts: reject `asOfDate > calendarDateToday()` with «Дата не может быть в будущем». [VERIFIED: src/app/accounts/actions.ts:199-203] Backdating still allowed (D-10).

### Pitfall 7: NW / dashboard revalidation
**What goes wrong:** Accidental `revalidatePath("/")`.  
**How to avoid:** Tests assert only `/debts` (Phase 9 pattern).

## Code Examples

### createRepaymentSchema (reuse)

```typescript
// Source: src/lib/validations/debts.ts:121-137
export const createRepaymentSchema = z
  .object({
    debtId: z.coerce.number().int().positive(),
    amountMajor: z.string().trim().min(1, "Введите корректную сумму"),
    asOfDate: asOfDateSchema,
    note: optionalNoteSchema,
  })
  .strict()
  .superRefine((val, ctx) => {
    if (!isStrictlyPositiveMajor(val.amountMajor)) {
      ctx.addIssue({
        code: "custom",
        path: ["amountMajor"],
        message: "Введите сумму больше 0",
      });
    }
  });
```

### statusForRemaining + assertRepaymentAmount

```typescript
// Source: src/lib/debts.ts:35-67
export function statusForRemaining(remaining: bigint): DebtStatus {
  if (remaining < 0n) {
    throw new Error("remaining must never be < 0");
  }
  return remaining === 0n ? "CLOSED" : "OPEN";
}

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
```

### Delete schema mirror

```typescript
// Source pattern: src/lib/validations/balance.ts:17-21
export const deleteRepaymentSchema = z
  .object({ id: z.coerce.number().int().positive() })
  .strict();

export const deleteSizeChangeSchema = z
  .object({ id: z.coerce.number().int().positive() })
  .strict();
```

### Early-close domain (already tested)

```typescript
// Source: src/lib/debts.test.ts:45-51
const remainingBeforeClose = remainingMinor(initial, [], paid);
const closeDelta = -remainingBeforeClose;
expect(remainingMinor(initial, [closeDelta], paid)).toBe(0n);
```

### RSC remaining today (extend with status + events)

```typescript
// Source: src/app/debts/page.tsx:37-52 — extend select + pass status/events
const remaining = remainingMinor(
  d.initialAmountMinor,
  d.sizeChanges.map((s) => s.deltaMinor),
  d.repayments.map((r) => r.amountMinor),
);
// Also: status: statusForRemaining(remaining) OR d.status after sync writes
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `remaining = initial − Σ repayments − writeOff` | `remaining = (initial + Σ deltas) − Σ repayments` | Phase 8 CONTEXT | No writeOff column; forgive = size-change |
| Reject events on CLOSED | Events allowed; status recomputes | Phase 8 D-14 | Detail stays fully interactive for CLOSED |
| Nested `/debts/[id]` routes | Dialog on list | Phase 10 D-01 | Charts later attach to same Dialog |
| Status UI toggle | Derived from remaining | Phase 8 D-12 | Auto-close/reopen only via writes |

**Deprecated/outdated:**
- `writeOffMinor` / WRITE_OFF repayment type — do not implement
- Milestone ARCHITECTURE sketch of write-off field — superseded
- PITFALLS “reject repayments on CLOSED” — superseded by D-14/D-13

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Hide «Простить остаток» when remaining is 0 | Discretion / Pattern 4 | Extra confirm no-op if shown; assertSizeDelta rejects 0 delta anyway |
| A2 | Add `DebtSizeChange.isForgive Boolean @default(false)` for D-07 labels | Discretion | If user forbids migration, fall back to note sentinel |
| A3 | Reject future asOfDate like accounts | Pitfall 6 | If product wants future dates, skip check — CONTEXT only locks backdating |
| A4 | Forms above history in detail Dialog | Discretion | Layout-only |
| A5 | Interactive `$transaction` required for event+status | Architecture | Sequential writes usually OK single-user SQLite; transaction still best practice |

**If empty table:** N/A — assumptions listed above need planner/discretion lock only where noted.

## Open Questions (RESOLVED)

1. **Forgive persistence field**
   - What we know: Need durable «Списание» vs «Изменение суммы» (D-07); schema has only `note` today.
   - What's unclear: Boolean column vs note sentinel (user deferred to Claude).
   - Recommendation: Migration add `isForgive Boolean @default(false)`; forgive action sets `true`; manual size-change leaves `false`.
   - RESOLVED: Plan 03 `checkpoint:decision` (blocking-human) recommends `isForgive Boolean @default(false)` — not a note sentinel. Execute waits for human confirm before migrate.

2. **Stored vs computed status on list**
   - What we know: Writes must sync status; page currently ignores `d.status`.
   - What's unclear: Whether to heal desynced rows on read.
   - Recommendation: Persist on write; on page compute remaining and optionally `assertStatusSynced` in dev/tests; list CLOSED by `status === "CLOSED"` **or** `remaining === 0n` after sync — prefer stored status once writes land.
   - RESOLVED: Prefer stored `Debt.status` after every event write syncs via `statusForRemaining` (Plan 01). List CLOSED subsection uses stored status; no read-time heal required in Phase 10.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | vitest / next | ✓ | v24.5.0 | — |
| npm | scripts | ✓ | 10.9.3 | — |
| SQLite via Prisma | event writes | ✓ | better-sqlite3 stack (Phase 01) | — |
| New npm packages | — | N/A | — | none needed |

**Missing dependencies with no fallback:** none  
**Missing dependencies with fallback:** none  

Step 2.6: external tooling OK; phase is code/config only beyond existing DB.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 4.1.11 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run src/app/debts/actions.test.ts src/lib/validations/debts.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REPAY-01 | createRepayment parses, asserts, creates, sets CLOSED when paid in full | unit | `npx vitest run src/app/debts/actions.test.ts` | ❌ Wave 0 extend |
| REPAY-01 | rejects over-repayment / non-positive | unit | same + domain already in `debts.test.ts` | ✅ domain / ❌ action |
| REPAY-02 | page/actions expose events; timeline merge order (optional unit on sorter) | unit/smoke | grep + optional helper test | ❌ |
| REPAY-03 | deleteRepayment recalculates; status OPEN when remaining > 0 | unit | `npx vitest run src/app/debts/actions.test.ts` | ❌ Wave 0 |
| DEBT-04 | after repayment to zero, status CLOSED | unit | same | ❌ Wave 0 |
| DEBT-05 | forgive creates size-change −remaining + CLOSED + isForgive | unit | same | ❌ Wave 0 |
| DISOL-01 | revalidatePath only `/debts` | unit | same (assert not `/`) | ✅ pattern exists |
| UX D-06/D-09 | no `window.confirm` in debts components | grep | `! rg window.confirm src/components/debts` | ✅ Phase 9 |

### Sampling Rate

- **Per task commit:** `npx vitest run src/app/debts/actions.test.ts src/lib/validations/debts.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] Extend `src/app/debts/actions.test.ts` — mock `prisma.debtRepayment` / `debtSizeChange` / `$transaction`; cover create/delete/forgive + status sync + over-repay
- [ ] Extend `src/lib/validations/debts.test.ts` — `deleteRepaymentSchema` / `deleteSizeChangeSchema` (+ forgive schema if separate)
- [ ] Optional: small pure helper test for timeline sort / label mapping
- [ ] Framework install: none — vitest already present

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Single-user local app (Phase 9 AR-09-01) |
| V3 Session Management | no | — |
| V4 Access Control | no | No multi-user ACL |
| V5 Input Validation | yes | Zod `.strict()` + domain asserts + scale checks |
| V6 Cryptography | no | No new crypto |

### Known Threat Patterns for debts event writes

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Over-repayment / negative remaining | Tampering | `assertRepaymentAmount` / `assertSizeDelta` before write |
| Smuggled fields on forgive (absolute status) | Tampering | Forgive computes delta server-side from ledger; ignore client-supplied delta |
| Delete wrong id / IDOR | Tampering | Positive int Zod; Prisma delete by id; single-user accept residual risk |
| Cascade surprise on debt delete | Destruction | Already confirmed in DebtFormDialog (Phase 9); unchanged |
| NW pollution via revalidate | Tampering | `revalidatePath("/debts")` only; test assertion |
| XSS via note | Tampering | React text nodes; trim/max 500 on note schema |

## Sources

### Primary (HIGH confidence)

- `src/lib/debts.ts` / `src/lib/debts.test.ts` — remaining, status, asserts
- `src/lib/validations/debts.ts` — createRepayment/createSizeChange schemas
- `src/app/debts/actions.ts` + `page.tsx` + `DebtsList.tsx` — current wiring gaps
- `prisma/schema.prisma:48-83` — Debt / DebtRepayment / DebtSizeChange
- `.planning/phases/08-debts-schema-domain-math/08-CONTEXT.md` — ledger + close rules
- `.planning/phases/10-repayments-close-write-off/10-CONTEXT.md` — UX locks D-01–D-13
- Next.js `use server` docs in `node_modules/next/dist/docs/`

### Secondary (MEDIUM confidence)

- Prisma interactive transactions docs — [CITED: https://www.prisma.io/docs/orm/prisma-client/queries/transactions]
- Phase 9 RESEARCH / PATTERNS / SECURITY / VALIDATION — Dialog + test patterns
- `.planning/research/PITFALLS.md` — over-repay (still valid); writeOff/CLOSED reject (superseded)

### Tertiary (LOW confidence)

- WebSearch “debt repayment ledger auto-close” — no project-specific authority; domain already locked in Phase 8

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — reuse pinned Next/Prisma/Zod/Vitest; no new deps
- Architecture: HIGH — CONTEXT + existing code paths clear; `$transaction` first-use is MEDIUM certainty of necessity
- Pitfalls: HIGH — status desync and writeOff regression are concrete from current code

**Research date:** 2026-09-05  
**Valid until:** 2026-10-05 (stable domain; re-check if Prisma/Next majors bump)
