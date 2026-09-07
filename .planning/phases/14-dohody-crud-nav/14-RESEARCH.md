# Phase 14: Доходы CRUD + nav - Research

**Researched:** 2026-09-07
**Domain:** Next.js App Router CRUD UI + Prisma side-ledger income (reuse Debts patterns)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Group income by **Person** (same structure as «Долги»). — **Reversibility:** costly — list/page data shape and components mirror DebtsList grouping.
- **D-02:** Within a person group, order rows by **nearest planned date** (recurring + one-time in one timeline).
- **D-03:** Show **all people** from the directory (empty groups + CTA), not only people with income.
- **D-04:** Each row shows **type + amount + currency + planned date** (no truncated note in the compact row).
- **D-05:** Single CTA **«Новый доход»** opens one dialog with a **kind toggle** (recurring ↔ one-time) at the top — not two separate create buttons.
- **D-06:** Creating from inside a person group **pre-fills Person** (`defaultPersonId` pattern); user may change it.
- **D-07:** Dialog supports **existing / new Person** inline (same pattern as DebtFormDialog).
- **D-08:** Create defaults: **kind = recurring**, **currency = primary**.
- **D-09:** Primary entities are **definitions** (RecurringIncome / OneTimeIncome). Row shows the **next planned date** for sorting/display — not a multi-slot occurrence feed. No record-actual UX and no overdue «заполни» styling in this phase.
- **D-10:** «Next» planned date for recurring may be a **past plan slot with no actual** (overdue-eligible); still shown as a normal date — Phase 15 owns overdue chrome.
- **D-11:** Short RU copy in the **page header** that income does **not** change account balances.
- **D-12:** Edit via **«Изменить»** button on the row → same dialog pattern as debts (not row-click-to-edit).
- **D-13:** Nav order: **Главная · Счета · Доходы · Долги · Валюты** («Доходы» after «Счета»). — **Reversibility:** reversible — single `links` array in `nav.tsx`.
- **D-14:** Route **`/income`**; nav label **«Доходы»**.
- **D-15:** Page header CTAs: **«Новый человек»** + **«Новый доход»** (parity with debts header).
- **D-16:** Allow **delete Person** from «Доходы» with **Restrict** when income and/or debts still reference them (same integrity idea as debts).

### Carried locks (do not re-open)
- Two definition models + two actual models (Phase 13 D-03/D-04); Cascade actuals on definition delete; Person Restrict; DestructiveConfirmStep for destructive confirms; side ledger / no BalanceSnapshot writes (ISO-01 mindset; full isolation suite Phase 17).
- Delete income **source** uses DestructiveConfirmStep (UI-01).

### Claude's Discretion
- **D-09 detail:** Chose definitions-as-entities + computed next planned date over a virtual multi-slot list, to keep Phase 14 CRUD-focused and avoid implying fill-actual before Phase 15. Planner/researcher may pick helper (`listInRange` vs single-next) as long as D-02/D-10 display rules hold.

### Deferred Ideas (OUT OF SCOPE)
- Overdue «заполни» styling + record actual + variance — Phase 15
- Per-Person income stats / FX honesty — Phase 16
- NW forecast overlay + isolation suite — Phase 17
- Pause / end date on recurring; nav overdue badge; destination-account note on actual — Future Requirements
- Reviewed todos not folded: credit account type; merge debit/crypto/cash; timezone settings; local AI agent
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SRC-01 | User can create recurring monthly income with day-of-month, planned amount, currency, and Person counterparty | Schema `RecurringIncome` + Zod create + `IncomeFormDialog` kind=recurring; fields dayOfMonth, plannedAmountMajor, currencyCode, person; `startAsOf` required by schema — default Moscow today |
| SRC-02 | User can create one-time income with planned date, amount, currency, Person, optional note | Schema `OneTimeIncome` + Zod create + same dialog kind=oneTime; plannedAsOf + note optional |
| UI-01 | «Доходы» page + nav with income CRUD; deletes use DestructiveConfirmStep; recording/listing never changes balances | `/income` + nav D-13/D-14; CRUD dialogs; DestructiveConfirmStep on source+person delete; actions never touch `BalanceSnapshot`/`Account`; RU header honesty D-11 |
</phase_requirements>

## Summary

Phase 14 is a **pattern-clone** of Debts CRUD onto the Phase 13 income schema — **zero new npm packages**. Ship `/income` (force-dynamic RSC page → Person-grouped client list → form dialogs → server actions + Zod), insert nav «Доходы» after «Счета», and wire deletes through `DestructiveConfirmStep`. Definitions are the list rows; each row’s sort/display date is a **computed next open planned slot** (earliest unfilled occurrence, which may be in the past per D-10) — not an occurrence feed and not overdue chrome.

Critical executor traps: (1) Phase 13 ISO test **`UI-00` asserts `src/app/income` does not exist** — must be rewritten when the route lands; (2) `deletePerson` today counts **only debts** — must also count recurring/one-time income and dual-`revalidatePath` `/debts`+`/income`; (3) DebtFormDialog defaults currency to `currencies[0]` (code sort) — income **must** default to **primary** (D-08); (4) actions must never write `BalanceSnapshot`.

**Primary recommendation:** Mirror `debts/page.tsx` + `DebtsList` + `DebtFormDialog` into `income/*`; add `nextOpenPlannedAsOf` (or equivalent) on top of `listRecurringOccurrences`; extend shared Person delete/revalidate; update `nav.test.ts` + flip UI-00.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Nav link «Доходы» `/income` | Browser / Client | — | Client `Nav` links array; file-scan test |
| Page load (people + incomes + currencies) | Frontend Server (SSR) | Database | `force-dynamic` RSC + Prisma like debts |
| Person-grouped list / dialogs | Browser / Client | — | Client components; `useActionState` / transitions |
| Create/update/delete income definitions | API / Backend (Server Actions) | Database | `"use server"` + Zod + Prisma |
| Next planned date for sort/display | Frontend Server (compute) or pure lib | — | Pure `income.ts` helper; page maps onto rows |
| Person create/rename/delete Restrict | API / Backend | Database | Extend debts Person actions; FK Restrict backstop |
| Balance isolation (no snapshot writes) | API / Backend | — | Action body touches income/Person only |
| Destructive confirm UX | Browser / Client | — | `DestructiveConfirmStep` only — never `window.confirm` |

## Project Constraints (from .cursor/rules/)

No `.cursor/rules/` directory in this repo. Enforce instead:

- **AGENTS.md / Next:** Read `node_modules/next/dist/docs/` before inventing Next APIs — this Next differs from training data. [VERIFIED: AGENTS.md + `node_modules/next/dist/docs/` present]
- **CONVENTIONS.md:** Agent-driven UAT via `.planning/OPERATOR.md` + Orca; never `window.confirm` — use in-dialog Russian second step. [VERIFIED: `.planning/codebase/CONVENTIONS.md:6-16`]
- **User rule:** Prefer `codegraph` for project search (CLI available; graphify disabled).

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.3.4 | App Router, Server Actions, `revalidatePath` | Already in app; debts/accounts pattern [VERIFIED: package.json deps] |
| react / react-dom | (repo lock) | Client dialogs, `useActionState`, `useTransition` | Existing UI [VERIFIED: package.json] |
| @prisma/client + prisma | (repo lock) | RecurringIncome / OneTimeIncome CRUD | Schema already shipped Phase 13 [VERIFIED: prisma/schema.prisma:126-180] |
| zod | (repo lock) | Action input validation | Mirror `src/lib/validations/debts.ts` [VERIFIED: package.json] |
| vitest | (dev) | Unit + file-scan tests | `vitest.config.ts` include `src/**/*.test.ts` [VERIFIED: vitest.config.ts:4-7] |
| better-sqlite3 / adapter | (repo lock) | Local DB | Existing [VERIFIED: package.json] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @/lib/income.ts | in-repo | Occurrence math / next planned | Display sort + future Phase 15 |
| @/lib/money.ts | in-repo | `parseMajorToMinor` / `formatMinorToMajor` | Amount fields |
| @/lib/dates.ts | in-repo | `calendarDateToday`, `clampDayOfMonth`, `addCalendarDays` | Defaults + horizon |
| DestructiveConfirmStep | in-repo | Delete confirms | UI-01 / D-16 |
| lucide-react | (repo) | Optional chevrons | Only if mirroring closed-section UI (income has no CLOSED status — likely unused) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Clone Debts UI | Shared abstract PersonGroupedList | Abstraction premature; Phase 15 will diverge (overdue chrome) |
| New rrule / schedule lib | Existing `clampDayOfMonth` + list helpers | Locked: zero new packages |
| Polymorphic IncomeSource | Two models | Locked Phase 13 D-03 |

**Installation:**

```bash
# No new packages — reuse existing deps only
```

**Version verification:** `next@16.3.4` from `package.json` dependencies (node v24.5.0 / npm 10.9.3 on research host). No registry install this phase.

## Package Legitimacy Audit

> Phase installs **no** external packages. Gate N/A.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| — | — | — | — | — | — | No installs |

**Packages removed due to [SLOP] verdict:** none  
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```text
[Nav links] --href--> /income
                         |
                         v
              [RSC IncomePage force-dynamic]
                 | load people + recurring + oneTime
                 | + currencies + primary
                 | compute nextOpenPlannedAsOf per def
                 v
              [IncomeList client]
                 | Person groups (all people)
                 | rows sorted by next planned date
                 |
        +--------+--------+------------------+
        |                 |                  |
        v                 v                  v
 [PersonFormDialog] [IncomeFormDialog] [DestructiveConfirmStep]
   debts actions      income actions      delete person/source
        |                 |
        v                 v
  Person CRUD        Prisma RecurringIncome /
  (Restrict if       OneTimeIncome (+ Cascade
   debt|income)       actuals on def delete)
        |
        X---- never ----> BalanceSnapshot / Account / net-worth
```

### Recommended Project Structure

```
src/app/income/
├── page.tsx              # force-dynamic RSC shell + header copy
├── actions.ts            # create/update/delete recurring + one-time
└── actions.test.ts       # Zod path + isolation file-scan (no BalanceSnapshot)
src/components/income/
├── IncomeList.tsx        # Person groups, empty CTA, delete person
└── IncomeFormDialog.tsx  # kind toggle, create/edit, delete confirm step
src/lib/validations/
├── income.ts             # Zod schemas
└── income.test.ts        # schema unit tests
src/lib/income.ts         # add nextOpenPlannedAsOf (+ tests)
src/components/nav.tsx    # insert Доходы
src/components/nav.test.ts
src/app/debts/actions.ts  # extend deletePerson + dual revalidatePath
```

### Pattern 1: Debts page shell → Income page

**What:** Server Component loads all people (with nested incomes), currencies, primary; passes serializable props (BigInt → string) to client list.  
**When to use:** Always for `/income`.  
**Example shape:** Mirror `src/app/debts/page.tsx` — `export const dynamic = "force-dynamic"`, `ensureSqlitePragmas()`, `prisma.person.findMany({ orderBy: { name: "asc" }, include: { recurringIncomes, oneTimeIncomes } })`. [VERIFIED: src/app/debts/page.tsx:17-72]

### Pattern 2: Person-grouped list + defaultPersonId

**What:** One group per Person; empty state CTA opens create with `defaultPersonId`; header «Новый доход» without default.  
**When to use:** List + in-group create (D-03, D-06).  
**Example:** `DebtFormDialog` `defaultPersonId` + empty «Нет долгов» CTA. [VERIFIED: src/components/debts/DebtsList.tsx:175-188, DebtFormDialog.tsx:94-95]

### Pattern 3: Kind-toggle create dialog

**What:** Single dialog; top control switches recurring ↔ one-time field sets; create default kind=recurring, currency=primary (D-05, D-08).  
**When to use:** Create mode only; edit mode locks kind (definition is already one model).  
**Anti-leak:** Do not show actual/overdue UI.

### Pattern 4: Server Action + Zod + revalidatePath

**What:** `"use server"` actions parse FormData via Zod, write Prisma, `revalidatePath("/income")`. Shared Person actions also `revalidatePath("/debts")`.  
**When to use:** All mutations.  
**Docs:** Next Server Actions + `revalidatePath` in same roundtrip. [CITED: node_modules/next/dist/docs/01-app/02-guides/server-actions.md]

### Pattern 5: Next open planned date (discretion recommendation)

**What:** Add pure helper in `income.ts` — e.g. `nextOpenPlannedAsOf(def, actuals, from, to)`:
1. `listRecurringOccurrences([def], actuals, from, to)` with `from = def.startAsOf`, `to` = caller horizon (recommend ~`addCalendarDays(max(today, startAsOf), 400)` ≈ 13+ months — no `addCalendarMonths` in dates.ts).
2. Build set of actual keys via `occurrenceKeyString`.
3. Return earliest occurrence whose key is **not** in actuals (D-10: may be past).
4. If all filled in window, extend `to` or return null and treat as sort key fallback (`startAsOf` / last slot) — planner should pick one and test it.

One-time: display/sort key = `plannedAsOf` on the definition (actual join unused in Phase 14 UI).

**When to use:** Page mapping before passing rows to `IncomeList` for D-02/D-09/D-10.

### Anti-Patterns to Avoid

- **Two create buttons / two dialogs for kind:** Violates D-05.
- **Row-click-to-edit / detail dialog like debts:** Violates D-12 — only «Изменить» button; no Phase 14 detail chrome.
- **Materializing occurrence feed rows:** Violates D-09.
- **Overdue «заполни» styling:** Phase 15.
- **`window.confirm`:** Forbidden; RateList still has it — do not copy. [VERIFIED: CONVENTIONS + RateList grep]
- **Default currency = first by code:** Violates D-08 — pass/select primary.
- **Writing BalanceSnapshot / importing net-worth in actions:** ISO-01.
- **Leaving UI-00 green while creating `/income`:** Test will fail hard.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| DOM calendar slots | Custom month loops in UI | `listRecurringOccurrences` / new thin next-open helper | Freeze-merge + clamp already tested |
| Money parse | Float / Number | `parseMajorToMinor` + currency.scale | BigInt path |
| Delete confirm | `window.confirm` | `DestructiveConfirmStep` | UI constitution |
| Person directory | New Employer entity | Existing `Person` | Milestone lock |
| Schedule library | rrule / cron | `dayOfMonth` + clamp | Zero new packages |
| Auth for actions | Custom session | None (local single-user) | App shape |

**Key insight:** Cost is in mirroring debts carefully (Person Restrict across domains, nav test, ISO file-scan) — not inventing income UX.

## Common Pitfalls

### Pitfall 1: UI-00 blocks `/income` creation
**What goes wrong:** `src/lib/income.test.ts` expects `existsSync("src/app/income") === false`.  
**Why it happens:** Phase 13 placeholder isolation. [VERIFIED: src/lib/income.test.ts:342-344]  
```
  it("UI-00: src/app/income does not exist", () => {
    expect(existsSync("src/app/income")).toBe(false);
  });
```
**How to avoid:** Wave 0 / first plan: replace with positive “route module exists” or drop UI-00 and add nav/actions isolation scans.  
**Warning signs:** `vitest` fails on income.test.ts as soon as directory appears.

### Pitfall 2: deletePerson ignores income
**What goes wrong:** User deletes Person who still has income; or debts page allows delete while income refs exist.  
**Why it happens:** Current action only `prisma.debt.count`. [VERIFIED: src/app/debts/actions.ts:227-232]  
```
    const debtCount = await prisma.debt.count({
      where: { personId },
    });
    if (debtCount > 0) {
      return { message: "Нельзя удалить человека, пока есть долги" };
    }
```
**How to avoid:** Count `recurringIncome` + `oneTimeIncome` (+ debts); update RU message; update client pre-check in DebtsList **and** IncomeList; `revalidatePath` both routes. Schema already `onDelete: Restrict`. [VERIFIED: prisma/schema.prisma:128-129]

### Pitfall 3: Currency default ≠ primary
**What goes wrong:** New income created in wrong currency.  
**Why it happens:** Debts dialog uses `currencies[0]?.code` after `orderBy: { code: "asc" }`. [VERIFIED: DebtFormDialog.tsx:158-160; debts/page.tsx:54-56]  
**How to avoid:** Pass `primaryCurrencyCode` into IncomeFormDialog; initialize state to that code (D-08).

### Pitfall 4: Forgetting startAsOf on recurring create
**What goes wrong:** Prisma create fails or series starts wrong.  
**Why it happens:** SRC-01 text omits startAsOf; schema requires `startAsOf String`. [VERIFIED: prisma/schema.prisma:134]  
**How to avoid:** Default `calendarDateToday("Europe/Moscow")` on create (visible or hidden field). Recommend visible «Начало с» for honesty.

### Pitfall 5: Accidental BalanceSnapshot coupling
**What goes wrong:** Copy-paste from accounts actions.  
**How to avoid:** File-scan test on `src/app/income/actions.ts`: no `BalanceSnapshot`, no `@/lib/net-worth`, no `@/lib/historical-series`. Extend bidirectional checks when UI exists (Phase 17 deep ISO; light now).

### Pitfall 6: Edit one-time after actual exists
**What goes wrong:** Plan fields mutate despite Phase 13 lock.  
**How to avoid:** Call `assertOneTimePlanImmutable` in update action even though Phase 14 has no actual UI (seeded/manual actuals possible). [VERIFIED: src/lib/income.ts:92-106]

### Pitfall 7: Nav test stale order
**What goes wrong:** CI fails after inserting Доходы.  
**How to avoid:** Update expected href/label arrays in `nav.test.ts`. [VERIFIED: src/components/nav.test.ts:6-32]

## Code Examples

### Nav insert (target order)

Current links (must change):

```7:12:src/components/nav.tsx
const links = [
  { href: "/", label: "Главная" },
  { href: "/accounts", label: "Счета" },
  { href: "/debts", label: "Долги" },
  { href: "/currencies/rates", label: "Валюты" },
] as const;
```

Target order per D-13/D-14: `/`, `/accounts`, `/income` («Доходы»), `/debts`, `/currencies/rates`.

### DestructiveConfirmStep (delete source)

```21:51:src/components/ui/destructive-confirm-step.tsx
export function DestructiveConfirmStep({
  message,
  confirmLabel,
  backLabel = "Назад",
  pending = false,
  onConfirm,
  onBack,
}: DestructiveConfirmStepProps) {
  // ...
}
```

Use inside edit dialog confirm-delete step (mirror DebtFormDialog), RU copy that Cascade removes actuals.

### Schema fields for forms (verbatim)

RecurringIncome:

```126:138:prisma/schema.prisma
model RecurringIncome {
  id                 Int                     @id @default(autoincrement())
  personId           Int
  person             Person                  @relation(fields: [personId], references: [id], onDelete: Restrict)
  currencyCode       String
  currency           Currency                @relation(fields: [currencyCode], references: [code], onDelete: Restrict)
  plannedAmountMinor BigInt
  dayOfMonth         Int // 1–31; clamp at generation (D-16)
  startAsOf          String // YYYY-MM-DD series start (D-15)
  note               String?
  // ...
}
```

OneTimeIncome:

```155:166:prisma/schema.prisma
model OneTimeIncome {
  id                 Int                   @id @default(autoincrement())
  personId           Int
  person             Person                @relation(fields: [personId], references: [id], onDelete: Restrict)
  currencyCode       String
  currency           Currency              @relation(fields: [currencyCode], references: [code], onDelete: Restrict)
  plannedAmountMinor BigInt
  plannedAsOf        String // YYYY-MM-DD single plan date
  note               String?
  // ...
}
```

### Zod create skeleton (follow debts)

Mirror `createDebtSchema` / `createDebtWithNewPersonSchema` branching on `personId` vs `name` in actions. [VERIFIED: src/app/debts/actions.ts:249-273; src/lib/validations/debts.ts:62-105]

Recommended income fields:
- recurring: `personId|name`, `currencyCode`, `plannedAmountMajor`, `dayOfMonth` (int 1–31), `startAsOf`, `note?`
- one-time: `personId|name`, `currencyCode`, `plannedAmountMajor`, `plannedAsOf`, `note?`

### Server Action revalidation

```ts
// Source: node_modules/next/dist/docs/01-app/02-guides/server-actions.md
'use server'
import { revalidatePath } from 'next/cache'
// after successful income mutation:
revalidatePath('/income')
// after Person mutation used from either page:
revalidatePath('/income')
revalidatePath('/debts')
```

### Edit-field lock recommendation (discretion)

Mirror `updateDebtMeta` (direction/due/note only — not principal/currency/person): lock `personId` + `currencyCode` after create; allow amount, dayOfMonth/startAsOf or plannedAsOf, note. [ASSUMED: product parity with debts — confirm if planner wants person move]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No `/income` UI (UI-00 absense) | Full CRUD + nav | Phase 14 | Flip isolation test |
| Single-model research sketch | Two definition + two actual models | Phase 13 | Actions target four tables |
| Debts-only Person Restrict | Debts **or** income Restrict | Phase 14 | Shared deletePerson |

**Deprecated/outdated:**
- Polymorphic `IncomeSource` + kind enum from early research SUMMARY — superseded by Phase 13 D-03/D-04.
- Research copy that FCST excludes one-time — Phase 13 D-12 revises for Phase 17 (out of Phase 14 scope).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Edit locks person+currency after create (debts parity) | Code Examples | Planner may want movable Person — cheap to change schema of form |
| A2 | Recurring create shows `startAsOf` (default today) rather than hiding it | Pitfalls | Hidden still works if always today |
| A3 | Next-open horizon ≈ today+400 days via `addCalendarDays` | Pattern 5 | Too short → null next date for sparse fills; extend horizon |
| A4 | RU type labels «Ежемесячный» / «Разовый» | D-04 row | Copy tweak only |
| A5 | PersonFormDialog may keep debts-oriented description or soften copy | Integration | UX wording only |

## Open Questions

1. **Shared Person actions home**
   - What we know: `PersonFormDialog` imports `@/app/debts/actions`; delete only checks debts.
   - What's unclear: Move to `src/app/people/actions.ts` vs extend debts actions in place.
   - Recommendation: **Extend in place** (minimal churn); dual revalidate + income counts. Extract later if painful.

2. **Next-open helper API name / null behavior**
   - What we know: D-02/D-10 rules; `listRecurringOccurrences` needs explicit range.
   - What's unclear: Exact horizon and null fallback.
   - Recommendation: Helper + unit tests in Wave 0; page always passes explicit `to`.

3. **PersonFormDialog description string**
   - What we know: Create copy mentions долги.
   - Recommendation: Soften to neutral «чтобы вести учёт» if touching file for revalidate — else leave (A5).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| node | runtime / vitest | ✓ | v24.5.0 | — |
| npm | scripts | ✓ | 10.9.3 | — |
| vitest | tests | ✓ | via package | — |
| prisma / SQLite | CRUD | ✓ | repo | — |
| next | app | ✓ | 16.3.4 | — |
| codegraph CLI | project search | ✓ | installed | ripgrep |
| gsd graphify | graph queries | ✗ disabled | — | codegraph / Read |
| New npm packages | — | N/A | — | Do not install |

**Missing dependencies with no fallback:** none  
**Missing dependencies with fallback:** graphify (use codegraph)

Step 2.6: External tools present for this code/config phase.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest (repo) |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run src/components/nav.test.ts src/lib/income.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SRC-01 | Zod accepts recurring create shape; dayOfMonth 1–31 | unit | `npx vitest run src/lib/validations/income.test.ts` | ❌ Wave 0 |
| SRC-02 | Zod accepts one-time + optional note | unit | same | ❌ Wave 0 |
| UI-01 | Nav order includes `/income` after accounts | file-scan | `npx vitest run src/components/nav.test.ts` | ✅ (must update) |
| UI-01 | DestructiveConfirmStep used (no window.confirm in income components) | file-scan | vitest on income components or actions test | ❌ Wave 0 |
| UI-01 / ISO | income actions never mention BalanceSnapshot | file-scan | `src/app/income/actions.test.ts` | ❌ Wave 0 |
| D-02/D-10 | nextOpenPlannedAsOf returns past unfilled slot | unit | extend `src/lib/income.test.ts` | ❌ Wave 0 |
| D-16 | deletePerson blocked when income refs exist | integration/unit | extend `src/app/debts/actions.test.ts` | ✅ actions.test exists — extend |
| — | Flip UI-00 absence assertion | unit | `src/lib/income.test.ts` | ✅ must change |

### Sampling Rate

- **Per task commit:** targeted vitest files touched
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] Replace UI-00 in `src/lib/income.test.ts` (blocker for creating `src/app/income`)
- [ ] `src/lib/validations/income.ts` + `.test.ts`
- [ ] `nextOpenPlannedAsOf` (or chosen name) + tests in `income.test.ts`
- [ ] Update `nav.test.ts` expectations for Доходы
- [ ] `src/app/income/actions.test.ts` — isolation file-scan + happy-path validation errors
- [ ] Extend `deletePerson` tests for income Restrict

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Local single-user app |
| V3 Session Management | no | — |
| V4 Access Control | no | No multi-user |
| V5 Input Validation | yes | Zod schemas on all FormData actions; coerce int IDs; major amount refine |
| V6 Cryptography | no | Money BigInt — not crypto secrets |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malformed FormData / injection into Prisma | Tampering | Zod `.strict()` + Prisma parameterized writes |
| Orphan / cascade surprises | Tampering | Person Restrict; Cascade only definition→actuals |
| Accidental NW history corruption | Tampering | No BalanceSnapshot / net-worth imports in income actions |
| Client-only delete gate bypass | Elevation | Server recount debts+income before person delete |
| XSS via note/name | Spoofing | React text escaping; trim/max length Zod |

Treat every Server Action as untrusted POST entry (Next docs security note). [CITED: node_modules/next/dist/docs/01-app/02-guides/server-actions.md]

## Sources

### Primary (HIGH confidence)

- `14-CONTEXT.md` — locked D-01..D-16
- `prisma/schema.prisma` — income models / Restrict / Cascade
- `src/lib/income.ts` + `income.test.ts` — domain + UI-00
- `src/app/debts/page.tsx`, `actions.ts`, `DebtsList.tsx`, `DebtFormDialog.tsx` — clone targets
- `src/components/nav.tsx` + `nav.test.ts`
- `src/components/ui/destructive-confirm-step.tsx`
- `node_modules/next/dist/docs/01-app/02-guides/server-actions.md` — revalidatePath / useActionState
- codegraph explore/query — DebtsList / deletePerson / createDebt call graph

### Secondary (MEDIUM confidence)

- `.planning/research/ARCHITECTURE.md` / `PITFALLS.md` / `STACK.md` — side ledger, zero packages, INISO
- `.planning/codebase/CONVENTIONS.md` — UAT + no window.confirm

### Tertiary (LOW confidence)

- Assumed edit-lock parity and RU type labels (Assumptions Log)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — reuse only; versions from package.json
- Architecture: HIGH — debts clone + schema verified by Read
- Pitfalls: HIGH — UI-00, deletePerson, currency default verified in source

**Research date:** 2026-09-07  
**Valid until:** 2026-10-07 (stable in-repo patterns; revisit if Next major bumps)
