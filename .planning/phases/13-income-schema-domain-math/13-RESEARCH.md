# Phase 13: Income schema + domain math - Research

**Researched:** 2026-09-07
**Domain:** Prisma SQLite side-ledger schema + pure TypeScript occurrence math (BigInt money, DOM clamp)
**Confidence:** HIGH (repo patterns); MEDIUM (exact freeze-merge algorithm wording — interpret D-07 below)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Phase 13 ships a **minimum** schema — no `active` / `endAsOf` columns (pause/end remain out of scope until a later phase adds migration + UI). — **Reversibility:** costly — adding columns later needs a migration; omitting them now avoids dead product surface.
- **D-02:** Optional `note` on both definition and actual models (recurring and one-time).
- **D-03:** **Two definition models** — `RecurringIncome` and `OneTimeIncome` — not a single `IncomeSource` + kind enum. — **Reversibility:** one-way — consolidating later needs data migration and dual call-site rewrites.
- **D-04:** **Two actual models** — `RecurringIncomeActual` and `OneTimeIncomeActual` — mirroring parents (not one polymorphic `IncomeActual`). — **Reversibility:** one-way — same as D-03.
- **D-05:** Money as BigInt minors; Currency FK with Restrict (mirror Debt); Person FK on both definition models.
- **D-06:** Occurrence key = `(parentId, plannedAsOf)`. Changing recurring `dayOfMonth` must **not** rewrite existing actuals or their `plannedAsOf`.
- **D-07:** Freeze rule: if an actual exists for a slot key, that key is frozen; months/slots **without** actual always generate with the **current** DOM. No schedule-revision history table in Phase 13.
- **D-08:** One-time: after an actual exists, **plan fields are immutable** (planned date/amount); only actual amount/date (and note) may change. Before actual: plan is visible; overdue when planned date &lt; Moscow today and no actual; actual may use different date and/or amount than plan.
- **D-09:** At most **one** actual per plan slot — `@@unique([parentId, plannedAsOf])`; re-record = update. Deleting a single actual is allowed (slot becomes empty / overdue again). — **Reversibility:** costly — dropping unique later changes upsert semantics across actions.
- **D-10:** Delete definition → **Cascade** its actuals (Debt ↔ repayment pattern).
- **D-11:** Delete Person while income definitions reference them → **Restrict** (same as debts).
- **D-12:** Future **one-time** planned income must appear in **both** the Доходы list and the Капитал NW forecast overlay. This **revises FCST-01** (was recurring-only / one-time excluded). Downstream Phase 17 planners must update REQUIREMENTS/roadmap wording; Phase 13 only needs models that can feed both. — **Reversibility:** costly — product lock for v1.2 capital UX.

### Claude's Discretion
- **D-13:** Core occurrence API is strict `listInRange(from, to)` with **no hidden default horizon**; callers (tests, later UI, forecast) pass the window.
- **D-14:** Split helpers: `listRecurringOccurrences`, `listOneTimeOccurrences`, plus thin `listAllInRange` merge.
- **D-15:** Range is **inclusive** on both ends; recurring slot included only if `plannedAsOf >= startAsOf`.
- **D-16:** `clampDayOfMonth` lives in `@/lib/dates`; income domain calls it (not inline-only in income module).

### Deferred Ideas (OUT OF SCOPE)
- `active` / `endAsOf` (pause/end recurring) — out of REQUIREMENTS now; add migration when product ships pause
- Convenience default-horizon wrappers around `listInRange` — UI/forecast phases if needed
- Schedule-revision history (DOM versioning by as-of) — rejected for Phase 13 in favor of actual-exists freeze
- Full salary todo remainder: CRUD UI, overdue polish, stats, NW overlay implementation — Phases 14–17
- Update `.planning/REQUIREMENTS.md` FCST-01 text formally when planning Phase 17 (decision captured here as D-12)
</user_constraints>

<phase_requirements>
## Phase Requirements

Phase 13 is **foundation** — no v1.2 REQ-IDs assigned. Success criteria enable downstream REQs:

| ID | Description | Research Support |
|----|-------------|------------------|
| *(foundation)* | Persist recurring + one-time defs with Person/Currency + plan≠actual fields | Four Prisma models; BigInt; Restrict/Cascade; `@@unique([parentId, plannedAsOf])` |
| *(foundation)* | Virtual plan occurrences + DOM clamp (short months never skip) | `clampDayOfMonth` in `dates.ts`; `listRecurringOccurrences` / `listOneTimeOccurrences` / `listAllInRange` |
| *(foundation)* | Vitest: occurrence identity, overdue inputs, BigInt paths; no BalanceSnapshot writes | Pure `income*.ts` tests; schema lock tests; no action writers in this phase |
| SRC-01/02 | (Phase 14) create sources | Schema fields ready |
| ACT-01/02/03 | (Phase 15) actual + overdue + variance | Occurrence key + overdue predicate + independent actual fields |
| CPTY-01 | (Phase 16) Person stats | Person FK on definitions |
| UI-01 | (Phase 14) `/income` | Out of Phase 13 |
| FCST-01 | (Phase 17) NW overlay — **D-12 revises** one-time exclusion | Models can feed both recurring + one-time slots |
| ISO-01 | (Phase 17) no LOCF / BalanceSnapshot mutation | Phase 13: domain never imports NW writers; no actions |
</phase_requirements>

## Summary

Phase 13 adds a **third parallel side ledger** beside Accounts/NW and Debts. Persist **four** Prisma models (`RecurringIncome`, `OneTimeIncome`, `RecurringIncomeActual`, `OneTimeIncomeActual`) — not the single `IncomeSource`+enum sketch from milestone research. Money stays BigInt minors; Person + Currency FKs use Restrict; actuals Cascade from parents; unique slot key `(parentId, plannedAsOf)`.

Domain math is pure TypeScript: `clampDayOfMonth` in `@/lib/dates` (UTC calendar, same family as `addCalendarDays`), then `src/lib/income.ts` listing virtual occurrences in an **explicit inclusive** `[from, to]` window with freeze-merge for existing actuals. Vitest covers clamp matrix, occurrence identity, overdue predicate (injected `today`), and BigInt plan amounts — **no** Prisma in occurrence unit tests, **no** `/income` UI, **no** BalanceSnapshot / `computeNetWorthRows` writes.

**Primary recommendation:** Mirror Debt↔DebtRepayment schema + `debts.ts` pure-lib style; implement DOM clamp via `Date.UTC(y, m, 0)` last-day; prescribe month-keyed freeze merge for D-07; update `foundation.test.ts` migrate table allowlist; install zero new npm packages.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Income Prisma models + migration | Database / Storage | — | Persistence only; SQLite via Prisma |
| Person / Currency FK integrity | Database / Storage | API (later) | Restrict/Cascade at DB; actions enforce later |
| `clampDayOfMonth` | Browser / Client + SSR shared lib | — | Pure string calendar; client-safe like `calendarDateToday` |
| Virtual occurrence listing | Shared pure lib (`src/lib`) | — | No DB; callers pass defs + actuals + range |
| Overdue predicate inputs | Shared pure lib | UI (Phase 15) | `plannedAsOf < today && !actual`; inject today |
| Vitest domain coverage | Dev / CI | — | Node Vitest; no browser |
| BalanceSnapshot / NW LOCF | **Must not touch** | — | ISO-01 / INISO; ownership stays accounts path |
| `/income` UI + Server Actions | Deferred Phase 14+ | — | Explicit phase boundary |

## Project Constraints (from .cursor/rules/)

`.cursor/rules/` **absent**. Actionable project directives from `AGENTS.md` / workspace:

- Next.js in this repo has breaking APIs — read `node_modules/next/dist/docs/` before assuming App Router APIs (Phase 13 has **no** Next page work; still applies if executor touches app later).
- Prefer **codegraph** for project search when available — **not present** in this workspace; research used Grep/Read.
- Before UAT: `.planning/OPERATOR.md` (not Phase 13).
- Graphify disabled (`gsd_run graphify status` → not enabled).

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | `7.10.0` (pinned `package.json`) | Schema + migration | Existing Debt/Person/Currency patterns |
| SQLite + better-sqlite3 | adapter `7.10.0` / `13.0.3` | DB | Same datasource |
| TypeScript | `^5` | Domain libs | Pure helpers |
| Vitest | `4.1.11` (pinned) | Unit tests | Existing `src/**/*.test.ts` |

### Supporting (reuse — do not add)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@/lib/dates` | in-repo | Moscow today + DOM clamp | Occurrence dates, overdue today |
| `@/lib/money` | in-repo | BigInt major↔minor | Test money paths / later Zod |
| Zod | `4.5.4` | Action validation | **Defer to Phase 14** — not required by Phase 13 success criteria |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Two definition models (locked) | Single `IncomeSource` + enum | Research ARCHITECTURE sketch — **rejected by D-03** |
| `clampDayOfMonth` in dates | `rrule` / date-fns | Skip-month semantics; new dep — **forbidden** |
| Virtual slots | Materialize future rows | Stale on DOM edit — deferred/out |

**Installation:**

```bash
# Phase 13: ZERO new packages
npm install   # if node_modules missing — restore pins only
npx prisma migrate dev --name income_schema
npx prisma generate
npm test
```

**Version verification:** Pins read from `package.json` this session (`prisma`/`@prisma/client` `7.10.0`, `vitest` `4.1.11`, `zod` `4.5.4`). `node_modules` **absent** on research host — registry `npm view` returned newer majors (noise); **planner/executor must use package.json pins**, not latest registry.

## Package Legitimacy Audit

> Phase installs **no** new external packages.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| *(none)* | — | — | — | — | — | N/A |

**Packages removed due to [SLOP] verdict:** none  
**Packages flagged as suspicious [SUS]:** none  

Do **not** add: `rrule`, `date-fns`, `luxon`, `dayjs`, `decimal.js`, money npm libs.

## Architecture Patterns

### System Architecture Diagram

```
                    ┌─────────────────────────────────────┐
                    │  Phase 13 scope (no UI)              │
                    │                                     │
  (tests / later)   │  listAllInRange(from,to)            │
        │           │       ├─ listRecurringOccurrences   │
        │           │       └─ listOneTimeOccurrences     │
        ▼           │              │                      │
  ┌──────────┐      │              ▼                      │
  │ Vitest   │◄─────┤     clampDayOfMonth (@/lib/dates)   │
  └──────────┘      │              │                      │
                    │              ▼                      │
                    │     Occurrence { parentId,          │
                    │       plannedAsOf, plannedAmount… } │
                    │       + optional actual join        │
                    └──────────────┬──────────────────────┘
                                   │ (data shape only)
                                   ▼
              ┌────────────────────────────────────────┐
              │ Prisma / SQLite                        │
              │ RecurringIncome ──Cascade──► Actuals   │
              │ OneTimeIncome   ──Cascade──► Actuals   │
              │ Person Restrict ◄── defs               │
              │ Currency Restrict ◄── defs             │
              └────────────────────────────────────────┘

  FORBIDDEN edges (Phase 13 and forever for ISO):
    income ──X──► BalanceSnapshot writers
    income ──X──► computeNetWorthRows / historical LOCF mutators
```

### Recommended Project Structure

```
prisma/
├── schema.prisma                 # + 4 income models; Person/Currency relations
└── migrations/<ts>_income_schema/
    └── migration.sql             # CREATE TABLE + FKs + unique indexes
src/lib/
├── dates.ts                      # + clampDayOfMonth (+ optional daysInMonthMonthIndex helper)
├── dates.test.ts                 # + DOM clamp matrix
├── income.ts                     # NEW pure domain
├── income.test.ts                # NEW
├── money.ts                      # reuse only
├── net-worth.ts                  # DO NOT import income
└── historical-series.ts          # DO NOT import income
src/lib/foundation.test.ts        # UPDATE migrate table allowlist
# NOT in Phase 13:
# src/lib/validations/income.ts   # Phase 14
# src/app/income/**               # Phase 14
# src/lib/nw-forecast.ts          # Phase 17
# src/lib/iniso.test.ts           # Phase 17 (optional light file-scan OK)
```

### Pattern 1: Four-model side ledger (Debt mirror)

**What:** Definitions hold plan template; actuals hold fact for one `plannedAsOf` slot.  
**When to use:** Always for v1.2 income persistence.  
**Prescribed field sketch** (planner/executor — names locked to this research):

```prisma
// Adapt from Debt / DebtRepayment [VERIFIED: prisma/schema.prisma:48-85]
// Quote from Debt:
//   person Person @relation(fields: [personId], references: [id], onDelete: Restrict)
//   currency Currency @relation(fields: [currencyCode], references: [code], onDelete: Restrict)
//   initialAmountMinor BigInt
// DebtRepayment: debt Debt @relation(..., onDelete: Cascade); amountMinor BigInt; asOfDate String

model RecurringIncome {
  id                  Int      @id @default(autoincrement())
  personId            Int
  person              Person   @relation(fields: [personId], references: [id], onDelete: Restrict)
  currencyCode        String
  currency            Currency @relation(fields: [currencyCode], references: [code], onDelete: Restrict)
  plannedAmountMinor  BigInt
  dayOfMonth          Int      // 1–31; clamp at generation
  startAsOf           String   // YYYY-MM-DD
  note                String?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  actuals             RecurringIncomeActual[]
}

model RecurringIncomeActual {
  id                 Int             @id @default(autoincrement())
  recurringIncomeId  Int
  recurringIncome    RecurringIncome @relation(fields: [recurringIncomeId], references: [id], onDelete: Cascade)
  plannedAsOf        String          // YYYY-MM-DD — occurrence key half
  actualAsOf         String          // YYYY-MM-DD
  amountMinor        BigInt
  note               String?
  createdAt          DateTime        @default(now())

  @@unique([recurringIncomeId, plannedAsOf])
}

model OneTimeIncome {
  id                  Int      @id @default(autoincrement())
  personId            Int
  person              Person   @relation(fields: [personId], references: [id], onDelete: Restrict)
  currencyCode        String
  currency            Currency @relation(fields: [currencyCode], references: [code], onDelete: Restrict)
  plannedAmountMinor  BigInt
  plannedAsOf         String   // YYYY-MM-DD single plan date
  note                String?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  actuals             OneTimeIncomeActual[]
}

model OneTimeIncomeActual {
  id              Int          @id @default(autoincrement())
  oneTimeIncomeId Int
  oneTimeIncome   OneTimeIncome @relation(fields: [oneTimeIncomeId], references: [id], onDelete: Cascade)
  plannedAsOf     String       // copy of plan slot key at record time
  actualAsOf      String
  amountMinor     BigInt
  note            String?
  createdAt       DateTime     @default(now())

  @@unique([oneTimeIncomeId, plannedAsOf])
}
```

Person/Currency must gain inverse relations arrays. [ASSUMED] relation field names `recurringIncomes` / `oneTimeIncomes` / same on Currency — executor picks consistent Prisma relation names.

### Pattern 2: DOM clamp (D-16)

**What:** Map `(year, month1to12, dayOfMonth)` → `YYYY-MM-DD` with day = `min(dom, lastDayOfMonth)`.  
**When:** Every recurring slot generation.  
**How:** UTC, matching `addCalendarDays` style [VERIFIED: src/lib/dates.ts:39-49].

```typescript
// Source: MDN Date overflow — day 0 of monthIndex+1 = last day of month
// [CITED: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date]
export function clampDayOfMonth(
  year: number,
  month1to12: number,
  dayOfMonth: number,
): string {
  const last = new Date(Date.UTC(year, month1to12, 0)).getUTCDate();
  const day = Math.min(dayOfMonth, last);
  const mm = String(month1to12).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}
```

**Anti-pattern:** `new Date(Date.UTC(y, m-1, 31))` without clamp — Feb 31 → March (skip / wrong month). [CITED: MDN setUTCDate overflow]

### Pattern 3: Occurrence listing + freeze (D-06, D-07, D-13–D-15)

**What:** Generate virtual slots; merge frozen actual keys.  
**Recommended D-07 interpretation (prescriptive):**

1. Walk calendar months overlapping inclusive `[from, to]`.
2. For each recurring parent × month: `candidate = clampDayOfMonth(y, m, currentDayOfMonth)`.
3. Include candidate iff `candidate >= startAsOf` AND `from <= candidate <= to`.
4. **Month freeze:** if an actual exists for this parent whose `plannedAsOf` falls in that calendar month (YYYY-MM), **do not** emit the candidate when it differs; emit/keep the actual’s `plannedAsOf` if it lies in `[from, to]` (frozen key).
5. Also emit any actual `plannedAsOf` in range that would otherwise be orphaned (same parent, in range) — covers DOM change after facts recorded.
6. Deduplicate by occurrence key `(parentId, plannedAsOf)`.

One-time: at most one slot = definition `plannedAsOf` if in range; join actual by unique key.

**Overdue helper (pure):**

```typescript
export function isIncomeOverdue(
  plannedAsOf: string,
  hasActual: boolean,
  today: string, // inject calendarDateToday() at call site
): boolean {
  return plannedAsOf < today && !hasActual;
}
```

### Pattern 4: Isolation contract (Phase 13 slice)

**What:** `income.ts` / `dates` clamp must not import `@/lib/net-worth`, `@/lib/historical-series`, or call Prisma.  
**Full INISO-01** (file-scan + property tests) = Phase 17; Phase 13 may add a **light** file-scan that `income.ts` has no NW imports (mirror `disol.test.ts` style).

### Anti-Patterns to Avoid

- **Single IncomeSource + kind enum** — contradicts D-03/D-04.
- **Materialize 12 months of plan rows** — stale on DOM edit.
- **RRULE / skip invalid DOM** — short months lose salary.
- **Rewrite actual.plannedAsOf when DOM changes** — breaks D-06.
- **Default horizon inside list API** — contradicts D-13.
- **Touch BalanceSnapshot / computeNetWorthRows** — ISO-01.
- **Zod/UI/actions in Phase 13** — boundary; ships later.
- **Float money** — use `bigint` / `Nn` literals only.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Calendar DOM clamp | Custom TZ math / rrule | `Date.UTC` + day-0 last-day (extend `dates.ts`) | Overflow already defined; matches existing helpers |
| Money precision | `number` / decimal.js | `@/lib/money` BigInt | Repo lock |
| Occurrence identity | Soft string concat only | Typed key + `@@unique` | Upsert/re-record semantics |
| Isolation | Hope | File-scan + no imports | DISOL proven pattern |
| FK delete rules | App-only checks | Prisma `onDelete: Restrict/Cascade` | Same as Debt |

**Key insight:** Side ledger value is **virtual slots + frozen actuals**, not a second double-entry engine.

## Common Pitfalls

### Pitfall 1: DOM 31 skips short months
**What goes wrong:** Feb/Apr have no occurrence.  
**Why:** Overflow into next month or rrule skip.  
**How to avoid:** Clamp matrix in Vitest: 31×Feb leap/non-leap, 31×Apr, 29×non-leap.  
**Warning signs:** Tests only use day ≤ 28.

### Pitfall 2: DOM edit rewrites actual keys
**What goes wrong:** Changing `dayOfMonth` updates past `plannedAsOf`.  
**Why:** Regenerate-all mental model.  
**How to avoid:** Actual rows immutable keys; freeze-merge.  
**Warning signs:** Migration/trigger “syncing” plannedAsOf.

### Pitfall 3: Hidden default list horizon
**What goes wrong:** Forecast/UI disagree on window.  
**Why:** Convenience wrapper in core API.  
**How to avoid:** Strict `listInRange(from, to)` only (D-13).  
**Warning signs:** `listUpcoming()` in `income.ts`.

### Pitfall 4: Folding income into NW / snapshots
**What goes wrong:** Past Капитал jumps; Core Value dies.  
**Why:** “Salary is money.”  
**How to avoid:** No imports into `net-worth.ts` / `historical-series.ts`; no Phase 13 actions.  
**Warning signs:** `balanceSnapshot` in income modules.

### Pitfall 5: Forgetting `foundation.test.ts` table allowlist
**What goes wrong:** Migrate deploy gate fails after new tables.  
**Why:** Hardcoded IN-list [VERIFIED: src/lib/foundation.test.ts:117-132].  
**How to avoid:** Wave 0 / same plan as migration — extend allowlist + assert new migration name.

### Pitfall 6: Inclusive range off-by-one
**What goes wrong:** Drop start or end slot.  
**Why:** Half-open habit.  
**How to avoid:** Tests with from==to single day; boundary plannedAsOf == from/to (D-15).

### Pitfall 7: REQUIREMENTS FCST-01 vs D-12 drift
**What goes wrong:** Phase 17 builds recurring-only overlay.  
**Why:** REQUIREMENTS.md still says one-time excluded; STATE blockers echo old lock.  
**How to avoid:** Phase 13 models support both; Phase 17 **must** update REQUIREMENTS (D-12). Not Phase 13 code work.

## Code Examples

### Clamp + month walk (recurring)

```typescript
// Source: pattern from dates.ts UTC helpers + MDN day-0 last day
import { clampDayOfMonth } from "@/lib/dates";

function* monthsOverlapping(from: string, to: string): Generator<{ y: number; m: number }> {
  let [y, m] = from.split("-").map(Number) as [number, number];
  const [ty, tm] = to.split("-").map(Number) as [number, number];
  while (y < ty || (y === ty && m <= tm)) {
    yield { y, m };
    m += 1;
    if (m === 13) {
      m = 1;
      y += 1;
    }
  }
}
```

### Occurrence identity + overdue

```typescript
export type IncomeOccurrenceKey = {
  parentId: number;
  plannedAsOf: string;
};

export function occurrenceKeyString(k: IncomeOccurrenceKey): string {
  return `${k.parentId}:${k.plannedAsOf}`;
}

// BigInt path — plan amount stays bigint end-to-end
expect(
  listRecurringOccurrences(
    [{ id: 1, plannedAmountMinor: 100_00n, dayOfMonth: 31, startAsOf: "2026-01-01" }],
    [],
    "2026-02-01",
    "2026-02-28",
  )[0]?.plannedAmountMinor,
).toBe(100_00n);
```

### Schema lock snippet (mirror money.test / debts.test)

```typescript
import { readFileSync } from "node:fs";
const schema = readFileSync("prisma/schema.prisma", "utf8");
expect(schema).toMatch(/model RecurringIncome/);
expect(schema).toMatch(/model OneTimeIncome/);
expect(schema).toMatch(/plannedAmountMinor\s+BigInt/);
expect(schema).toMatch(/onDelete:\s*Cascade/); // actuals
expect(schema).toMatch(/@@unique\(\[recurringIncomeId,\s*plannedAsOf\]\)/);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Milestone research: `IncomeSource` + `IncomeKind` | Two definition + two actual models | CONTEXT 2026-09-07 D-03/D-04 | Schema sketch in ARCHITECTURE.md is **stale** for planning |
| FCST-01 one-time excluded | D-12: one-time in list **and** NW forecast | CONTEXT D-12 | REQUIREMENTS.md / STATE blockers outdated until Phase 17 |
| RRULE skip invalid days | Clamp to last day of month | PROJECT / PITFALLS | No rrule |

**Deprecated/outdated for planners:**
- ARCHITECTURE.md single-model Prisma sketch — adapt only patterns (virtual slots, isolation), not model names.
- STATE “One-time excluded from NW forecast — locked” — superseded by D-12 for forward work.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Prisma relation array names on Person/Currency (`recurringIncomes` / `oneTimeIncomes`) | Pattern 1 | Rename-only; low |
| A2 | Month-keyed freeze merge (not “emit both candidate + frozen”) is intended UX for D-07 | Pattern 3 | Dual Jan rows if wrong — confirm in plan check |
| A3 | Zod validations deferred to Phase 14 | Standard Stack | Slightly later boundary validation — OK for foundation |
| A4 | One-time actual’s `plannedAsOf` always equals definition `plannedAsOf` at record time (immutable after) | Pattern 1 | Phase 15 upsert must copy key |

**If discuss needed:** A2 only if planner wants dual-slot months after DOM change.

## Open Questions

1. **D-07 freeze granularity**
   - What we know: frozen keys must survive DOM change; empty months use current DOM.
   - What's unclear: whether a month may show two rows (old actual key + new candidate).
   - Recommendation: **month-keyed single slot** (Pattern 3) — document in PLAN; escalate only if product wants both visible.

2. **FCST-01 text vs D-12**
   - What we know: CONTEXT revises forecast to include future one-time.
   - What's unclear: when REQUIREMENTS.md updates (explicitly Phase 17).
   - Recommendation: Phase 13 no REQ edit; note in PLAN risks for Phase 17.

3. **`node_modules` missing on research host**
   - What we know: cannot run `prisma validate` / Vitest here without install.
   - Recommendation: Wave 0 `npm install` before migrate/test tasks.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Prisma/Vitest | ✓ | v24.5.0 | — |
| npm | install | ✓ | 10.9.3 | — |
| `node_modules` | migrate/test | ✗ | — | `npm install` from lockfile |
| Prisma CLI (local) | migration | ✗ (no nm) | pin 7.10.0 | after install |
| SQLite file DB | migrate deploy test | ✓ (host path) | — | foundation test creates temp DB |
| Docker | Phase 13 optional | not probed | — | host `prisma migrate` sufficient |
| codegraph | search | ✗ | — | Grep/Read |
| graphify | intel | disabled | — | skip |

**Missing dependencies with no fallback:** none blocking planning; **execution** needs `npm install`.

**Missing dependencies with fallback:** codegraph → Grep; graphify → ignore.

Step 2.6: external tools = Node/npm/Prisma only; nm restore is Wave 0.

## Validation Architecture

> `workflow.nyquist_validation`: **true** in `.planning/config.json`.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest `4.1.11` (pinned) |
| Config file | `vitest.config.ts` (`environment: "node"`, `include: ["src/**/*.test.ts"]`, alias `@`) |
| Quick run command | `npx vitest run src/lib/dates.test.ts src/lib/income.test.ts` |
| Full suite command | `npm test` (= `vitest run`) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FND-OCC | Occurrence key identity / range inclusive | unit | `npx vitest run src/lib/income.test.ts` | ❌ Wave 0 |
| FND-CLAMP | DOM 31→Feb/Apr never skip | unit | `npx vitest run src/lib/dates.test.ts` | ⚠️ extend existing |
| FND-OVER | Overdue predicate inputs | unit | `npx vitest run src/lib/income.test.ts` | ❌ Wave 0 |
| FND-MONEY | BigInt plannedAmount paths | unit | same | ❌ Wave 0 |
| FND-SCHEMA | Models + unique + Restrict/Cascade in schema | unit (file read) | `npx vitest run src/lib/income.test.ts` or foundation | ❌ Wave 0 |
| FND-MIG | migrate deploy creates income tables | integration | `npx vitest run src/lib/foundation.test.ts` | ⚠️ update allowlist |
| FND-ISO | income.ts no NW/historical imports | unit file-scan | optional in income.test / iniso stub | ❌ optional Wave 0 |
| ISO-01 full | BalanceSnapshot write regression | — | Phase 17 | N/A Phase 13 |

### Sampling Rate

- **Per task commit:** `npx vitest run src/lib/dates.test.ts src/lib/income.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/lib/income.ts` + `src/lib/income.test.ts` — FND-OCC / OVER / MONEY / freeze
- [ ] Extend `src/lib/dates.test.ts` — clamp matrix (31×Feb leap/non-leap, 31×Apr)
- [ ] Update `src/lib/foundation.test.ts` — add `RecurringIncome`, `OneTimeIncome`, `RecurringIncomeActual`, `OneTimeIncomeActual` to table IN-list + expect new migration name
- [ ] `npm install` — restore `node_modules` before migrate/test
- [ ] Framework install: already in package.json — no new deps

## Security Domain

> `security_enforcement`: enabled (ASVS level 1).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Single-user local app |
| V3 Session Management | no | — |
| V4 Access Control | partial | FK Restrict on Person/Currency; Cascade scoped to own actuals |
| V5 Input Validation | yes (later Phase 14) | Zod at Server Actions; Phase 13 domain asserts dayOfMonth 1–31 in tests |
| V6 Cryptography | no | No new crypto; money BigInt not encryption |

### Known Threat Patterns for Prisma + side-ledger money

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Orphan / wipe actuals on person delete | Tampering / DoS | `onDelete: Restrict` on Person FK |
| Accidental BalanceSnapshot write | Tampering | No income actions Phase 13; ISO tests Phase 17 |
| Invalid DOM corrupting schedule | Tampering | Clamp + Zod 1–31 later; unit matrix now |
| Duplicate actuals / double pay facts | Tampering | `@@unique([parentId, plannedAsOf])` |
| Float rounding theft of cents | Tampering | BigInt minors only |

## Sources

### Primary (HIGH confidence)

- `prisma/schema.prisma` — Person/Debt/Currency/BigInt/Restrict/Cascade/unique patterns (Read this session)
- `src/lib/dates.ts`, `dates.test.ts` — Moscow calendar + UTC day math
- `src/lib/debts.ts`, `debts.test.ts` — pure domain + Vitest BigInt style
- `src/lib/disol.test.ts` — isolation file-scan pattern
- `src/lib/foundation.test.ts` — migrate deploy gate allowlist
- `src/lib/money.ts` / `money.test.ts` — BigInt money
- `package.json`, `vitest.config.ts` — pins and test config
- `.planning/phases/13-income-schema-domain-math/13-CONTEXT.md` — D-01…D-16
- `.planning/research/{ARCHITECTURE,PITFALLS,STACK,SUMMARY}.md` — milestone research (model names superseded)

### Secondary (MEDIUM confidence)

- MDN Date / setUTCDate — day 0 = last day previous month; overflow carry [CITED: developer.mozilla.org]
- WebSearch synthesis on last-day-of-month via `Date.UTC(y, m, 0)`

### Tertiary (LOW confidence)

- npm registry “latest” versions (ignored — pins win)
- Exact dual-row vs month-freeze UX (A2)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — pinned in package.json; zero new deps locked
- Architecture: HIGH — Debt mirror + CONTEXT two-model lock; MEDIUM on freeze merge detail (A2)
- Pitfalls: HIGH — PITFALLS.md + foundation allowlist verified in source

**Research date:** 2026-09-07  
**Valid until:** 2026-10-07 (stable schema/domain; revisit if Prisma major bump)
