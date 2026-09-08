# Phase 19: Schema + pure grace domain math - Research

**Researched:** 2026-09-08
**Domain:** Prisma/SQLite schema + pure calendar cycle math for credit grace (dual DOM)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
### Account schedule fields
- **D-01:** Store **only** `statementDayOfMonth` + `dueDayOfMonth` (Int?). No `graceAnchorAsOf`, no stored `graceDurationDays`. — **Reversibility:** costly — schema + Zod + CHECK assume dual-DOM SoT; adding duration-as-SoT later fights D-02 from Phase 18.
- **D-02:** Dual DOM fields allowed **only** on `FIAT_CREDIT` (mirror `creditLimitMinor` discipline). — **Reversibility:** costly — SQLite CHECK / write-path Zod keyed to account type.
- **D-03:** Hard invariant: **both null or both set** (DB CHECK + Zod). Partial schedule rejected. — **Reversibility:** one-way — migration CHECK; undoing needs schema change.
- **D-04:** Editing DOM later **does not rewrite** existing obligation rows (`cycleStartAsOf` / `dueAsOf` stay as stored). New cycles / candidates use the updated schedule.

### Obligation row shape
- **D-05:** Persist `dueAsOf` **at create**; do not recompute from Account DOM on read. — **Reversibility:** costly — closed/open history and D-04 depend on frozen due.
- **D-06:** `amountMinor` **required** at create (no placeholder rows without amount). Create happens when user has the statement total (Phase 20). — **Reversibility:** costly — schema NOT NULL; nullable path would need migration + forecast membership rules.
- **D-07:** Status enum **OPEN | CLOSED** (Debt-style). Overdue is **not** a persisted status — `OPEN` + calendar (`today` after inclusive due day per Phase 18 D-04 → highlight from the 16th for DOM-15 due).
- **D-08:** Include `closedAsOf` (required when CLOSED) and optional `note`. Currency **inherits** `Account.currencyCode` — no currency FK on obligation.

### Cycle identity / pure math
- **D-09:** `cycleStartAsOf` = clamped statement date for that calendar month: `clampDayOfMonth(y, m, statementDayOfMonth)`. Unique key `(accountId, cycleStartAsOf)`. — **Reversibility:** one-way — unique constraint + cycle identity for forecast membership.
- **D-10:** `dueAsOf` engine = **next calendar month** + `dueDayOfMonth` via `clampDayOfMonth` — **not** sole `addCalendarDays(start, N)`. Aligns Phase 18 D-02 / ROADMAP SC.
- **D-11:** Pure API includes primitives **and** cycle-window helpers (`listCycleWindows` / current-or-next style), analogous to income `listRecurringOccurrences`.
- **D-12:** Helpers are **pure candidates only** — no Prisma writes, no auto-create of obligation rows. Rows appear only via explicit create-with-amount (Phase 20).

### Null / edge rules
- **D-13:** Credit with both DOM null ⇒ **no obligations allowed**; helpers return empty / actions reject create.
- **D-14:** Clearing schedule (both → null) **forbidden while any OPEN** obligation exists; CLOSED history may remain until account handling says otherwise.
- **D-15:** `CreditGraceObligation` → Account FK uses **`onDelete: Cascade`** (deleting the credit account removes all grace obligations). Deliberately looser than `BalanceSnapshot` Restrict. — **Reversibility:** costly — data-loss semantics on account delete.
- **D-16:** Duplicate `(accountId, cycleStartAsOf)` = **error**. Amount/status changes = **update** existing OPEN row, not a second create.

### Claude's Discretion
- Exact Zod / SQLite CHECK naming and migration packaging.
- Module layout (`src/lib/credit-grace.ts` + validations) and precise helper names — must satisfy D-09…D-12 and reuse `clampDayOfMonth` from `dates.ts`.
- Whether CLOSED rows block schedule clear (D-14 only locks on OPEN); planner may keep CLOSED when clearing schedule after OPEN are gone.
- Micro-details of “current vs next” window when today sits between statement and due — pure math must be deterministic and tested.

### Deferred Ideas (OUT OF SCOPE)
- Obligation CRUD UI, early close confirm, overdue highlight chrome — Phase 20
- Капитал A′ forecast slots / tooltips — Phase 21
- GRACEISO regression suite — Phase 22
- APR / minimum triad / cash modeling — milestone OOS

None new beyond roadmap phasing — discussion stayed inside Phase 19 / CYCLE-01.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CYCLE-01 | User can set statement DOM + due DOM on credit account (monthly); statement uses `clampDayOfMonth`; due is next-month DOM (dual-DOM SoT); prefer dual DOM over sole `graceDurationDays` | Account `statementDayOfMonth`/`dueDayOfMonth` + CHECKs; Zod write-path; pure `dueAsOfForCycle` / `listCycleWindows` using next-month + clamp — never sole `addCalendarDays` as due engine |
</phase_requirements>

## Summary

Phase 19 ships **data + pure math only** for v1.3 credit grace. Extend `Account` with dual nullable DOM ints (FIAT_CREDIT-only, both-null-or-both-set), add `CreditGraceObligation` child keyed by `(accountId, cycleStartAsOf)`, and implement `src/lib/credit-grace.ts` that advances statement months via existing `clampDayOfMonth` and computes due as **next calendar month + due DOM** (also clamped). This **overrides** milestone research sketches that used `graceAnchorAsOf` / `graceDurationDays` / `addCalendarDays(start, N)` as SoT.

Do **not** wire Капитал forecast, obligation CRUD UI, or GRACEISO here. Minimal CYCLE-01 write-path = Zod + Server Action to persist dual DOM (UI form chrome may wait for Phase 20). `net-worth.ts` / `historical-series.ts` stay grace-free.

**Primary recommendation:** Mirror `Account_credit_limit_invariant` migration pattern for dual-DOM CHECKs; put all cycle math in pure `credit-grace.ts` reusing `clampDayOfMonth`; store frozen `dueAsOf` on obligation rows for Phase 20 create.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Dual DOM schedule storage | Database / Storage | API / Backend (Zod + actions) | SQLite CHECK + Prisma fields; write-path validates FIAT_CREDIT pairing |
| Obligation row persistence | Database / Storage | API / Backend (Phase 20) | Child table + unique cycle key; Phase 19 schema ready, CRUD later |
| Cycle start / due / window math | API / Backend (pure lib) | — | Pure TS like `income.ts`; no Prisma; testable without UI |
| Overdue predicate | API / Backend (pure lib) | Browser (Phase 20 highlight) | Calendar compare only; not a DB status |
| Historical NW / LOCF | API / Backend (`net-worth` / `historical-series`) | — | Must remain grace-unaware (GRISO later) |
| Forecast overlay | — (Phase 21) | — | Out of Phase 19 |

## Project Constraints (from .cursor/rules/ + AGENTS.md)

`.cursor/rules/` — **none found** this session.

From `AGENTS.md` / workspace:

- Next.js in this repo may differ from training data — read `node_modules/next/dist/docs/` before Next-touching code (Phase 19 is mostly Prisma + `src/lib`; actions under App Router if write-path added).
- Before UAT / `/gsd-verify-work`: read `.planning/OPERATOR.md`; agent drives `npm run dev` + Orca.
- User search preference: use **codegraph** for project search (used this session).

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma + `@prisma/client` | **7.10.0** (pinned in `package.json`) | Schema + migrate + SQLite | Existing Wallet ORM; CHECK via custom SQL like credit-limit |
| better-sqlite3 / adapter | 13.0.3 / 7.10.0 | SQLite driver | Already wired |
| Zod | **4.5.4** | Write-path validation | Same as account/income validations |
| Vitest | **4.1.11** | Unit tests for pure math | `vitest.config.ts` includes `src/**/*.test.ts` |
| Existing `src/lib/dates.ts` | in-repo | `clampDayOfMonth`, Moscow `calendarDateToday` | Locked by Phase 18 D-03 / D-09–D-10 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| TypeScript | ^5 (repo) | Types for pure helpers | Always |
| Next Server Actions | next 16.3.4 | Persist dual DOM | Minimal CYCLE-01 write-path only |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Dual DOM ints | `graceAnchorAsOf` + `graceDurationDays` | **Rejected** — Phase 18/19 D-01/D-02; duration varies by month |
| Due via `addCalendarDays(start, N)` | Next-month DOM clamp | **Rejected as SoT** — bank is 21→15 next; N not constant |
| Obligation on Account columns | Child `CreditGraceObligation` | Collapses cycles; breaks history/forecast later |
| New npm calendar package | In-repo `dates.ts` | Unnecessary; UTC helpers already battle-tested |

**Installation:**

```bash
# No new packages — use pinned prisma / zod / vitest already in package.json
npx prisma migrate dev --create-only --name credit_grace_dual_dom
# then edit migration.sql CHECKs; apply; prisma generate
```

**Version verification:** `zod@4.5.4`, `vitest@4.1.11`, `prisma@7.10.0` from `package.json` / `npm view <pkg>@<pinned> version` this session. Do **not** bump to registry-latest Prisma 8 RC.

## Package Legitimacy Audit

> Phase installs **no new** external packages. Audit of already-pinned stack (legitimacy seam flagged `SUS`/`too-new` on high-download packages — treat as false positive for install gate; **Disposition: already in tree, do not reinstall**).

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| zod | npm @4.5.4 | established | high | github.com/colinhacks/zod | seam SUS (too-new) | Already Approved — no install |
| vitest | npm @4.1.11 | established | high | github.com/vitest-dev/vitest | seam SUS (too-new) | Already Approved — no install |
| prisma / @prisma/client | npm @7.10.0 | established | high | github.com/prisma/prisma | seam SUS (too-new) | Already Approved — no install |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS] for new install:** none — no new installs planned

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Write path (minimal Phase 19)                               │
│  FormData / Server Action → Zod dual-DOM → Prisma Account    │
└───────────────────────────────┬─────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────┐
│  SQLite                                                      │
│  Account(+ statementDayOfMonth, dueDayOfMonth + CHECKs)      │
│  CreditGraceObligation(cycleStartAsOf, dueAsOf, amount…)     │
│  BalanceSnapshot — UNCHANGED; never derived for dues         │
└───────────────────────────────┬─────────────────────────────┘
                                │ read schedule (later UI)
┌───────────────────────────────▼─────────────────────────────┐
│  Pure credit-grace.ts                                        │
│  null DOM → []                                               │
│  cycleStart = clampDayOfMonth(y,m,statementDOM)              │
│  dueAsOf    = clampDayOfMonth(nextMonth(y,m), dueDOM)        │
│  listCycleWindows / currentOrNext — candidates only          │
│  isGraceOverdue(dueAsOf, today) — no Prisma                  │
└─────────────────────────────────────────────────────────────┘
         │ must NOT import
         ▼
   net-worth.ts / historical-series.ts  (stay grace-free)
```

### Recommended Project Structure

```
prisma/schema.prisma              # + dual DOM on Account; CreditGraceObligation; enum
prisma/migrations/<ts>_…/         # custom CHECK SQL (table rebuild pattern)
src/lib/
├── dates.ts                      # reuse clampDayOfMonth (unchanged API)
├── credit-grace.ts               # NEW pure math
├── credit-grace.test.ts          # NEW Vitest matrix
├── validations/
│   ├── account.ts                # EXTEND or sibling updateGraceScheduleSchema
│   └── credit-grace.ts           # NEW Zod for obligation shape (ready Phase 20)
src/app/accounts/actions.ts       # EXTEND minimal dual-DOM persist action
src/lib/net-worth.ts              # UNCHANGED — no grace imports
src/lib/historical-series.ts      # UNCHANGED
```

### Pattern 1: Config-on-parent + instance-on-child

**What:** Schedule DOMs on `Account`; per-cycle amount/status on `CreditGraceObligation`.
**When to use:** Always for this phase (locked).
**Example:**

```typescript
// Source: Phase 19 CONTEXT D-09/D-10 + src/lib/dates.ts:56-66
import { clampDayOfMonth } from "@/lib/dates";

export function cycleStartAsOf(
  year: number,
  month1to12: number,
  statementDayOfMonth: number,
): string {
  return clampDayOfMonth(year, month1to12, statementDayOfMonth);
}

export function dueAsOfForCycle(
  cycleStart: string,
  dueDayOfMonth: number,
): string {
  const [y, m] = cycleStart.split("-").map(Number) as [number, number];
  let ny = y;
  let nm = m + 1;
  if (nm === 13) {
    nm = 1;
    ny += 1;
  }
  return clampDayOfMonth(ny, nm, dueDayOfMonth);
}
```

### Pattern 2: SQLite CHECK via customized migrate (credit-limit twin)

**What:** PSL fields + comment; real invariant in `migration.sql` after `--create-only`.
**When to use:** Dual-DOM pairing + FIAT_CREDIT-only; obligation OPEN↔`closedAsOf`.
**Example CHECK sketch (Account, combine with existing limit invariant on rebuild):**

```sql
-- Names discretionary; semantics locked D-02/D-03
CONSTRAINT "Account_grace_dom_invariant" CHECK (
  (
    type = 'FIAT_CREDIT'
    AND (
      (statementDayOfMonth IS NULL AND dueDayOfMonth IS NULL)
      OR (
        statementDayOfMonth IS NOT NULL AND dueDayOfMonth IS NOT NULL
        AND statementDayOfMonth BETWEEN 1 AND 31
        AND dueDayOfMonth BETWEEN 1 AND 31
      )
    )
  )
  OR (
    type != 'FIAT_CREDIT'
    AND statementDayOfMonth IS NULL
    AND dueDayOfMonth IS NULL
  )
)
```

### Pattern 3: listCycleWindows like listRecurringOccurrences

**What:** Month-walk `[from,to]`; emit `{ cycleStartAsOf, dueAsOf }` candidates; no DB writes.
**When to use:** Phase 20 cycle list + Phase 21 forecast prep.
**Current vs next (discretion — lock in tests):**

| today relative to schedule | `current` | `next` |
|----------------------------|-----------|--------|
| On/after statement day of month M, on/before due of that cycle | cycle M | cycle M+1 |
| After due of cycle M, before statement of M+1 | none current (gap) or “last” for overdue UI | cycle M+1 |
| Both DOM null | empty | empty |

Recommend explicit helpers: `listCycleWindows(schedule, from, to)`, `resolveCurrentAndNext(schedule, today)` with Vitest table for 21→15 and gap days (e.g. Feb 16–20).

### Anti-Patterns to Avoid

- **`graceAnchorAsOf` / stored `graceDurationDays` as SoT** — CONTEXT D-01 override of ARCHITECTURE.md sketch.
- **Due engine = only `addCalendarDays(start, N)`** — Phase 18 D-02; ROADMAP SC #2; PITFALLS.md Pitfall 5 is **stale** for this bank (still use `addCalendarDays` elsewhere; not for grace due).
- **Derive amount from BalanceSnapshot** — PROJECT / REQUIREMENTS OOS.
- **Import grace into `net-worth.ts` / `historical-series.ts`** — GRISO / INISO twin.
- **Auto-create obligation rows from helpers** — D-12.
- **Recompute `dueAsOf` on read from current Account DOM** — D-05.
- **Put grace under Person/Debt** — wrong domain.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Month-end DOM mapping | Custom Feb logic | `clampDayOfMonth` | Already tested leap/non-leap |
| Date string +N days | Raw `Date` local TZ | `addCalendarDays` only when truly day-shift | TZ flicker; and **not** grace due SoT |
| CHECK in PSL only | Assume Prisma enforces | Custom `migration.sql` | Prisma 7 CHECK not in schema language — project pattern already proven |
| Money float for amount | `number` | `BigInt` minor | Repo money convention |
| New calendar npm lib | date-fns / luxon | In-repo dates | No new deps; Moscow helpers exist |

**Key insight:** Complexity is **pairing invariants + next-month DOM**, not a new calendar stack. Reuse income month-walk + clamp; change only the due operator.

## Runtime State Inventory

Schema migration adding columns/tables (not a rename of existing domain strings).

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Existing `Account` rows; no grace columns yet | Migration defaults dual DOM to NULL; no backfill. No `CreditGraceObligation` rows until Phase 20 |
| Live service config | None — local SQLite file | none |
| OS-registered state | None verified | none |
| Secrets/env vars | None for grace field names | none |
| Build artifacts | Prisma client under `src/generated/prisma` | Run `prisma generate` after migrate; restart `next dev` |

## Common Pitfalls

### Pitfall 1: Treating PITFALLS.md “due = addCalendarDays” as still authoritative
**What goes wrong:** Implement duration-days due; Feb windows wrong vs bank 15th.
**Why it happens:** Pre-contract research default.
**How to avoid:** Follow Phase 18 D-02 + Phase 19 D-10; tests assert `2026-01-21` → due `2026-02-15` for DOM 21/15 without fixing N.
**Warning signs:** Helper named `dueAsOf = addCalendarDays(start, graceDays)` as only path.

### Pitfall 2: Partial schedule (one DOM set)
**What goes wrong:** Corrupt candidates / half-configured UI.
**How to avoid:** CHECK + Zod both-null-or-both-set; reject partial in action.

### Pitfall 3: SQLite CHECK without table rebuild
**What goes wrong:** Migration applies columns but invariant missing or ALTER fails.
**How to avoid:** Copy `20260903005200_account_credit_limit_check` RedefineTables pattern; keep **both** credit-limit and grace-DOM CHECKs on new Account table.

### Pitfall 4: Editing DOM rewrites stored obligation dues
**What goes wrong:** Closed history drifts; forecast identity breaks.
**How to avoid:** D-04/D-05 — helpers use Account DOM for **candidates** only; rows store frozen `dueAsOf`.

### Pitfall 5: Placeholder obligation without amount
**What goes wrong:** Forecast / Phase 20 membership unclear.
**How to avoid:** `amountMinor` NOT NULL; no auto-create (D-06/D-12).

### Pitfall 6: Overdue as enum value
**What goes wrong:** Status churn; fight Debt-style OPEN|CLOSED.
**How to avoid:** `isGraceOverdue(dueAsOf, today)` ⇒ `dueAsOf < today` (inclusive due day = Phase 18 D-04).

## Code Examples

### T-Bank dual DOM due (canonical fixture)

```typescript
// Source: 18-CONTEXT D-02; 19-CONTEXT D-09/D-10; dates.ts clampDayOfMonth
expect(cycleStartAsOf(2026, 1, 21)).toBe("2026-01-21");
expect(dueAsOfForCycle("2026-01-21", 15)).toBe("2026-02-15");
expect(cycleStartAsOf(2025, 2, 31)).toBe("2025-02-28"); // statement clamp
expect(dueAsOfForCycle("2025-02-28", 15)).toBe("2025-03-15");
expect(isGraceOverdue("2026-02-15", "2026-02-15")).toBe(false);
expect(isGraceOverdue("2026-02-15", "2026-02-16")).toBe(true);
```

### Prisma model sketch (discretionary names; fields locked)

```prisma
// Source: 19-CONTEXT D-01…D-08, D-15; overrides ARCHITECTURE.md graceAnchorAsOf sketch
enum GraceObligationStatus {
  OPEN
  CLOSED
}

model Account {
  // …existing fields…
  /// Dual DOM schedule — FIAT_CREDIT only; both null or both set (migration CHECK).
  statementDayOfMonth Int?
  dueDayOfMonth       Int?
  creditGraceObligations CreditGraceObligation[]
}

model CreditGraceObligation {
  id             Int                   @id @default(autoincrement())
  accountId      Int
  account        Account               @relation(fields: [accountId], references: [id], onDelete: Cascade)
  cycleStartAsOf String // YYYY-MM-DD
  dueAsOf        String // frozen at create
  amountMinor    BigInt
  status         GraceObligationStatus @default(OPEN)
  closedAsOf     String?
  note           String?
  createdAt      DateTime              @default(now())
  updatedAt      DateTime              @updatedAt

  @@unique([accountId, cycleStartAsOf])
}
```

### Zod dual-DOM pairing (mirror income DOM + creditLimit refine)

```typescript
// Source: validations/income.ts dayOfMonthSchema min1 max31; account.ts FIAT_CREDIT refine pattern
const dayOfMonthSchema = z.coerce.number().int().min(1).max(31);

// both null OR both set; only meaningful for FIAT_CREDIT (enforce type in action)
.superRefine((val, ctx) => {
  const s = val.statementDayOfMonth;
  const d = val.dueDayOfMonth;
  const sSet = s !== undefined && s !== null;
  const dSet = d !== undefined && d !== null;
  if (sSet !== dSet) {
    ctx.addIssue({ code: "custom", message: "Укажите обе даты или очистите обе" });
  }
});
```

### Existing credit-limit CHECK (pattern to extend)

```13:17:prisma/migrations/20260903005200_account_credit_limit_check/migration.sql
    CONSTRAINT "Account_credit_limit_invariant" CHECK (
        (type = 'FIAT_CREDIT' AND creditLimitMinor IS NOT NULL AND creditLimitMinor > 0)
        OR
        (type != 'FIAT_CREDIT' AND creditLimitMinor IS NULL)
    )
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Research: `graceAnchorAsOf` + `graceDurationDays` + `addCalendarDays` due | Dual DOM + next-month clamp | Phase 18 discuss 2026-09-08 | Schema fields differ from ARCHITECTURE.md sketch |
| Research Restrict delete note | Cascade on obligations (D-15) | Phase 19 discuss | Account delete wipes grace rows |
| Research Option A forecast dip | A′ NW-neutral (Phase 21) | Phase 18 | Phase 19 still ships negative-unaware schema only |

**Deprecated/outdated:**
- ARCHITECTURE.md Account `graceAnchorAsOf` / `graceDurationDays` SoT — **do not implement**.
- PITFALLS.md Pitfall 5 “due = addCalendarDays” as grace rule — **superseded** for due engine (clamp next month).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Prisma 7.10 still cannot express CHECK in PSL (same as project’s existing custom SQL approach) | Standard Stack / Patterns | If `@@check` ships in pinned version, migration style could simplify — still safe to custom-SQL |
| A2 | Gap-day “current vs next” table above matches product intent | Pattern 3 | Phase 20 UI labels wrong — fix tests early |
| A3 | CYCLE-01 satisfied by action+schema without full AccountFormDialog fields in Phase 19 | Summary | Planner may need one plan task for minimal form inputs |

## Open Questions

1. **Minimal UI for CYCLE-01 in Phase 19?**
   - What we know: CONTEXT allows form UI in Phase 20; SC emphasizes storage + math.
   - What's unclear: Whether “User can set” needs dialog fields now.
   - Recommendation: Plan Wave with schema + pure tests + Server Action + Zod; optional thin form fields if planner wants demoable set/clear without Phase 20.

2. **Obligation status CHECK name / CLOSED+null closedAsOf**
   - Recommendation: Add SQLite CHECK `(OPEN∧closedAsOf IS NULL)∨(CLOSED∧closedAsOf NOT NULL)` in same migrate as table create.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | tooling | ✓ | v24.5.0 | — |
| npm | scripts | ✓ | 10.9.3 | — |
| Prisma CLI | migrate | ✓ | 7.10.0 | — |
| Vitest | unit tests | ✓ | 4.1.11 (pinned) | — |
| SQLite (via app DB) | migrate apply | ✓ (project) | better-sqlite3 13.0.3 | — |
| ctx7 / Context7 MCP | docs seam | ✗ | — | Official Prisma docs WebFetch + in-repo migration pattern |
| graphify | code graph | disabled | — | codegraph CLI used instead |

**Missing dependencies with no fallback:** none for this phase.

**Missing dependencies with fallback:** Context7 → Prisma docs + existing migration twin.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.11 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run src/lib/credit-grace.test.ts src/lib/dates.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CYCLE-01 | Dual DOM both-null-or-both Zod | unit | `npx vitest run src/lib/validations/account.test.ts` (extend) | ❌ Wave 0 extend |
| CYCLE-01 | due = next-month DOM not +N | unit | `npx vitest run src/lib/credit-grace.test.ts` | ❌ Wave 0 |
| CYCLE-01 | statement clamp Feb/31 | unit | same + existing `dates.test.ts` | ✅ dates; ❌ grace |
| CYCLE-01 | null schedule → empty windows | unit | `credit-grace.test.ts` | ❌ Wave 0 |
| CYCLE-01 | overdue after inclusive due | unit | `credit-grace.test.ts` | ❌ Wave 0 |
| (schema) | CHECK rejects partial / non-credit DOM | migration/manual or sqlite probe | discretionary | ❌ |
| GRISO prep | net-worth/historical-series no credit-grace import | unit (optional Phase 19 smoke) | extend `iniso` or small ban test | ❌ optional |

### Sampling Rate

- **Per task commit:** `npx vitest run src/lib/credit-grace.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/lib/credit-grace.test.ts` — covers CYCLE-01 math (21→15, Feb clamp, null schedule, overdue, current/next)
- [ ] Extend `src/lib/validations/account.test.ts` (or new grace validation test) — dual-DOM pairing
- [ ] Framework install: none — Vitest already present

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Local single-user |
| V3 Session Management | no | — |
| V4 Access Control | no | No multi-tenant |
| V5 Input Validation | yes | Zod DOM 1–31; both-null-or-both; FIAT_CREDIT-only |
| V6 Cryptography | no | — |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Partial / out-of-range DOM corrupt cycles | Tampering | DB CHECK + Zod |
| Client-supplied obligation without schedule | Tampering | Reject create when DOM null (Phase 20 actions; document in Phase 19 helpers) |
| Cascade delete data loss surprise | Elevation of privilege / misuse | Locked D-15 — document in RU later; no silent Restrict |
| Snapshot mutation via grace | Tampering | No BalanceSnapshot writes; pure lib isolation |

## Sources

### Primary (HIGH confidence)

- [VERIFIED: prisma/schema.prisma:12-181] — Account, DebtStatus OPEN/CLOSED, BalanceSnapshot `onDelete: Restrict`, no grace fields yet
- [VERIFIED: src/lib/dates.ts:39-66] — `addCalendarDays` / `clampDayOfMonth` implementations
- [VERIFIED: src/lib/income.ts:155-196] — `listRecurringOccurrences` month-walk + clamp pattern
- [VERIFIED: src/lib/validations/account.ts:26-63] — FIAT_CREDIT creditLimit refine pattern
- [VERIFIED: src/lib/validations/income.ts:31] — `dayOfMonthSchema` `z.coerce.number().int().min(1).max(31)`
- [VERIFIED: prisma/migrations/20260903005200_account_credit_limit_check/migration.sql:13-17] — CHECK table-rebuild pattern
- [VERIFIED: 19-CONTEXT.md / 18-CONTEXT.md] — dual DOM locks; Cascade D-15
- codegraph queries: `clampDayOfMonth`, `listRecurringOccurrences`, `creditLimitMinor`, `FIAT_CREDIT`

### Secondary (MEDIUM confidence)

- [CITED: https://www.prisma.io/docs/orm/prisma-migrate/workflows/unsupported-database-features] — customize migration for unsupported features
- [CITED: https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/referential-actions] — `onDelete: Cascade` on SQLite
- [CITED: https://www.prisma.io/docs/orm/reference/database-features] — CHECK not in Prisma schema language (“Not yet”)
- `.planning/research/ARCHITECTURE.md` — child obligation shape (fields overridden)
- `.planning/research/PITFALLS.md` — isolation / stock-flow (due-operator section overridden)

### Tertiary (LOW confidence)

- Legitimacy seam `SUS`/`too-new` on zod/vitest/prisma — ignore for already-pinned deps
- graphify disabled — relationships from codegraph + file reads only

## Metadata

**Confidence breakdown:**

- Standard stack: **HIGH** — pinned versions verified; no new packages
- Architecture: **HIGH** — CONTEXT locks + existing Account/income/Debt patterns
- Pitfalls: **HIGH** — contract overrides documented; migration twin in-repo

**Research date:** 2026-09-08
**Valid until:** 2026-10-08 (stable domain; re-check if Prisma major bump)
