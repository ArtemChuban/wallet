# Architecture Research

**Domain:** Credit-card grace-period obligations + NW forecast overlay on existing Wallet
**Researched:** 2026-09-08
**Confidence:** HIGH (codebase integration / isolation); MEDIUM (signed NW delta vs cash-out semantics — needs discuss/contract lock)
**Milestone:** v1.3 Кредитка

## Standard Architecture

### System Overview

Grace tracking is **not a fourth parallel ledger like Долги/Доходы**. It **extends FIAT_CREDIT Account** with schedule metadata, and adds a **child obligation entity** whose open rows feed the **existing** Капитал «Прогноз» overlay (same dashed Line + hinge as income). Historical NW path stays account-snapshot + FX LOCF only.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  UI (App Router)                                                          │
│  ┌────────────────────┐  ┌──────────┐  ┌──────────┐                      │
│  │ `/` Капитал        │  │ `/accounts`│  │ `/income`│  `/debts`           │
│  │ NW + «Прогноз»     │  │ grace cfg │  │ (v1.2)  │  (DISOL)             │
│  │ income + grace     │  │ + obl UI  │  └────┬─────┘                     │
│  │ slots MERGED       │  └─────┬─────┘       │                            │
│  └─────────┬──────────┘        │             │                            │
├────────────┴───────────────────┴─────────────┴────────────────────────────┤
│  Pure libs                                                                 │
│  ┌──────────────┐ ┌────────────┐ ┌────────────┐ ┌───────────────────────┐│
│  │ net-worth.ts │ │ historical │ │ income.ts  │ │ nw-forecast.ts        ││
│  │ historical-  │ │ -series.ts │ │ (unchanged │ │ SIGNED slots:         ││
│  │ series.ts    │ │ UNCHANGED  │ │  ISO wall) │ │  +income / −grace     ││
│  │ NO grace     │ │            │ │            │ │ credit-grace.ts NEW   ││
│  └──────┬───────┘ └─────┬──────┘ └─────┬──────┘ └──────────┬────────────┘│
│         └───────────────┴── Currency / locf / money / dates ─┘            │
├───────────────────────────────────────────────────────────────────────────┤
│  Prisma / SQLite                                                          │
│  Account (+ graceAnchorAsOf, graceDurationDays) · BalanceSnapshot · FxRate│
│  CreditGraceObligation  ← NEW child of Account                            │
│  RecurringIncome / OneTimeIncome · Debt* (untouched)                      │
└───────────────────────────────────────────────────────────────────────────┘
```

### Integration model (locked for roadmap)

| Concern | Rule |
|---------|------|
| Historical NW | Still `buildNetWorthSeries` → `computeNetWorthRows` + LOCF balances/FX only |
| Today hero total | Still accounts-only; grace obligations **do not** change `totalPrimaryMinor` |
| Forecast | Same pure series: `anchorTodayNW + Σ signed open slots` in primary; FX LOCF as-of **today** (income D-13) |
| Grace amount | Manual entry only — **never** derived from `BalanceSnapshot` history (PROJECT OOS) |
| Early close | Marks obligation CLOSED; drops open membership → forecast stops carrying it |
| Past due open | UI highlight (mirror income overdue); **does not** rewrite past NW points |
| Debts / income ledgers | Untouched; DISOL + INISO tests stay green |

Isolation name for tests: **GRACEISO-01** (extend INISO wall):

- `src/lib/net-worth.ts` and `src/lib/historical-series.ts` **must not** import `@/lib/credit-grace` or `@/lib/nw-forecast`
- Grace Server Actions **must not** call Prisma `balanceSnapshot.create/update`
- `buildNetWorthSeries` output for dates ≤ today identical whether grace tables empty or full (golden identity)
- `nw-forecast.ts` stays free of Prisma / `BalanceSnapshot` / `net-worth` / `historical-series` (existing D-18)

`/` / `DashboardChartsShell` **may** import grace → slot mappers (same as income forecast wiring).

### New models vs extending Account

| Piece | Where | Why |
|-------|-------|-----|
| Grace schedule (start + days, monthly repeat) | **Extend `Account`** nullable fields | Metadata like `creditLimitMinor`; one schedule per credit card; no cycle history |
| Amount due / early close / open status | **New `CreditGraceObligation`** | Multi-cycle history; open membership for forecast; mirrors OneTimeIncome/Debt lifecycle, not Account columns |

**Do not** put `amountDue` / `status` / `closedAsOf` on `Account` — that collapses cycles and breaks forecast open-set math.

**Do not** invent a parallel `/grace` domain page unless UX discuss demands it — primary UX lives on credit account + Капитал overlay (account is the natural parent).

### Suggested Prisma shape (opinionated)

```prisma
// On Account (FIAT_CREDIT only; both null or both set — SQLite CHECK)
graceAnchorAsOf   String?  // YYYY-MM-DD first cycle start
graceDurationDays Int?     // days from cycle start → due

model CreditGraceObligation {
  id              Int      @id @default(autoincrement())
  accountId       Int
  account         Account  @relation(...)
  cycleStartAsOf  String   // YYYY-MM-DD — occurrence key half
  dueAsOf         String   // stored at create (anchor math); do not recompute on read for closed rows
  amountMinor     BigInt   // native account currency; manual
  status          GraceObligationStatus @default(OPEN) // OPEN | CLOSED
  closedAsOf      String?  // early close / paid calendar date
  note            String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([accountId, cycleStartAsOf])
}
```

Currency for FX: **inherit `Account.currencyCode`** — no duplicate currency FK on obligation (unlike income). Convert via same LOCF path as income slots.

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `Account.grace*` | Schedule config for FIAT_CREDIT | Prisma fields + Zod on create/update account |
| `CreditGraceObligation` | One cycle’s manual amount + close lifecycle | Prisma; unique `(accountId, cycleStartAsOf)` |
| `src/lib/credit-grace.ts` | Cycle starts, `dueAsOf = start + days`, open membership, overdue | Pure + Vitest; dates via `addCalendarDays` |
| `src/lib/nw-forecast.ts` | Cumulative signed stair-step from today anchor | Extend `ForecastSlot` with sign / `deltaMinor`; keep import wall |
| `buildNetWorthSeries` / `computeNetWorthRows` | Historical + today NW | **Unchanged** |
| `DashboardChartsShell` | Merge income + grace open slots → one forecast series | Extend props beside `forecastIncome` |
| Account UI | Edit grace config; list open/closed obligations; enter amount; early close | Dialogs + DestructiveConfirmStep for delete/close |
| `creditDebtMinor` | limit − available for **snapshot debt** | Unrelated to grace amount; do not reuse for obligation size |

## Recommended Project Structure

```
prisma/schema.prisma                 # + Account.grace*; CreditGraceObligation
src/lib/
├── credit-grace.ts                  # NEW: cycle math, open set, overdue
├── credit-grace.test.ts
├── nw-forecast.ts                   # EXTEND: signed ForecastSlot / delta
├── nw-forecast.test.ts              # + negative slot cases
├── iniso.test.ts                    # EXTEND → GRACEISO golden + import bans
├── net-worth.ts                     # UNCHANGED
├── historical-series.ts             # UNCHANGED
├── income.ts                        # UNCHANGED (no grace imports)
└── validations/
    └── credit-grace.ts              # NEW Zod
src/app/
├── page.tsx                         # load OPEN obligations → shell props
├── accounts/actions.ts              # EXTEND account grace fields
└── accounts/grace-actions.ts        # NEW: create obligation, early close, delete
src/components/
├── accounts/                        # grace fields on AccountFormDialog; obligation dialogs
└── dashboard/DashboardChartsShell.tsx  # merge grace slots into openSlots
```

### Structure Rationale

- **`credit-grace.ts` separate from `income.ts`:** different parent (Account vs Person), opposite forecast sign, no shared occurrence generator — keep ISO walls simple.
- **`grace-actions.ts` under accounts:** obligations belong to credit accounts; avoid fake `/income`-style top-level route unless product later wants it.
- **Extend `nw-forecast.ts` rather than fork:** one dashed «Прогноз» Line already ships; dual parallel series is optional discuss outcome, not default.

## Architectural Patterns

### Pattern 1: Config-on-parent + instance-on-child (RecurringIncome analog)

**What:** Schedule fields live on `Account`; each closed cycle’s amount is a child row keyed by `cycleStartAsOf`.
**When to use:** Monthly repeating grace with manual amount per cycle (v1.3 lock).
**Trade-offs:** Extra model + unique constraint; clearer history and open-set than stuffing state onto Account.

**Example:**
```typescript
// dueAsOf stored at obligation create — stable if user later edits graceDurationDays
dueAsOf = addCalendarDays(cycleStartAsOf, account.graceDurationDays);
```

### Pattern 2: Forecast overlay isolation (ISO-01 / GRACEISO-01)

**What:** Forward projection is a separate pure series from today NW anchor; never writes snapshots; never imports into historical LOCF.
**When to use:** Any future money event that must not falsify past capital (income, grace pay).
**Trade-offs:** Today hero and history ignore obligations until user updates balances manually — correct for this app’s snapshot model.

**Example:**
```typescript
// DashboardChartsShell — open membership (mirror income)
if (obl.status !== "OPEN") continue;
if (!(obl.dueAsOf > today)) continue; // past due → UI only, not forecast Y
openSlots.push({
  parentId: obl.id,
  plannedAsOf: obl.dueAsOf,
  plannedAmountMinor: -obl.amountMinor, // or explicit sign field
  currencyCode: account.currencyCode,
  // ...
});
```

### Pattern 3: Signed cumulative forecast slots

**What:** Generalize income-only positive adds to signed deltas so one `buildNetWorthForecastSeries` consumes income (+) and grace (−).
**When to use:** Single «Прогноз» Line (recommended default).
**Trade-offs:** NW-neutrality caveat (see Data Flow / Anti-Patterns). Parallel series avoids mixing signs but splits UX.

**Example:**
```typescript
// Prefer explicit delta over overloading "plannedAmount" positivity
export type ForecastSlot = {
  parentId: number;
  plannedAsOf: string;
  deltaMinor: bigint; // +income, −grace obligation
  currencyCode: string;
  currencyScale: number;
  isPrimaryCurrency: boolean;
};
```

## Data Flow

### Request Flow (create obligation)

```
User (cycle ended) enters amount
    ↓
Account grace dialog → grace-actions.createObligation
    ↓
Zod validate → Prisma CreditGraceObligation CREATE (status OPEN, dueAsOf stored)
    ↓
revalidatePath `/` + `/accounts`  (never BalanceSnapshot)
    ↓
page.tsx loads OPEN rows → DashboardChartsShell merges slots → dashed Line
```

### Request Flow (early close)

```
User marks paid / early close + closedAsOf
    ↓
grace-actions.closeObligation → status CLOSED, closedAsOf set
    ↓
Open membership empty for that id → rebuild forecast without that delta
    ↓
Optional: user separately setBalance on credit/debit (manual; out of grace actions)
```

### Key Data Flows

1. **Cycle dates:** `graceAnchorAsOf` + monthly advance (calendar month, clamp if needed — contract study may replace with bank-specific rule) → candidate `cycleStartAsOf`; `dueAsOf = start + graceDurationDays`. Pure lib proposes candidates; user creates obligation row when they know the amount.
2. **Forecast open set:** `status === OPEN` ∧ `dueAsOf > today` ∧ within `forecastHorizonEnd(preset)` → signed slot. FX: `locfRateAsOf(rates, currency, today)`; missing → exclude + partial banner (reuse income D-14).
3. **Historical NW:** unchanged path — snapshots + `creditDebtMinor(limit, available)` only. Grace tables invisible.
4. **Overdue open:** `dueAsOf < today` ∧ OPEN → highlight on account UI (like `/income` overdue); still no past-NW rewrite.

### Semantic note (discuss before plan lock)

Industry cash apps (Centinel, Simplifi, BudgetLabs) treat card payments as **checking outflows on due date**. Wallet’s chart is **NW**, and today NW already includes `−creditDebt`. Paying from a tracked asset is **NW-neutral** if both cash and credit snapshots update.

**Recommended default for v1.3:** still merge **negative** deltas into «Прогноз» as a **cash-out approximation** until the user updates balances (matches manual-snapshot world + PROJECT “amount appears on Прогноз”). Document in discuss-phase:

| Option | Forecast Y | When to choose |
|--------|------------|----------------|
| A. Signed merge (−obligation) | Dips at due date | Default — cash leaving before snapshot update |
| B. Parallel series / markers | NW line unchanged; second series or dots for dues | If double-count vs existing credit debt confuses UAT |
| C. Paired −cash +debt relief | NW-neutral stair | Overkill; needs synthetic debt relief without snapshots — avoid |

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Single local user / SQLite | Current monolith fine; few credit accounts |
| Many years of obligations | Index `(accountId, status)`; forecast query `OPEN` only |
| Multi-card | Same child table; slots merge by date like income |

### Scaling Priorities

1. **First bottleneck:** Chart/shell slot assembly complexity — keep pure merge in one place (`DashboardChartsShell` or thin `buildOpenForecastSlots`).
2. **Second bottleneck:** Contract-specific cycle rules — isolate in `credit-grace.ts` so schema stays stable.

## Anti-Patterns

### Anti-Pattern 1: Derive amount due from BalanceSnapshot delta

**What people do:** Diff available across cycle window to invent statement balance.
**Why it's wrong:** PROJECT locks manual entry; snapshots are sparse and not spend ledger.
**Do this instead:** User enters `amountMinor` when cycle ends.

### Anti-Pattern 2: Write BalanceSnapshot from grace close

**What people do:** Early close auto-bumps credit available / debit cash.
**Why it's wrong:** Breaks ISO/GRACEISO; same trap as income actual → balance (deferred).
**Do this instead:** Close obligation only; user updates balances separately.

### Anti-Pattern 3: Stuff obligation state onto Account

**What people do:** Single `currentDueMinor` / `nextDueAsOf` columns.
**Why it's wrong:** Loses prior cycles; early close/history/forecast membership become hacks.
**Do this instead:** Child `CreditGraceObligation` with unique cycle key.

### Anti-Pattern 4: Import grace into `computeNetWorthRows`

**What people do:** Subtract open dues from hero total.
**Why it's wrong:** Double-counts vs `creditDebtMinor`; falsifies “true NW from balances.”
**Do this instead:** Forecast overlay only; hero stays accounts LOCF.

### Anti-Pattern 5: Fork a second forecast engine

**What people do:** Separate grace chart series with copied FX/horizon logic.
**Why it's wrong:** Drift from income hinge/partial banner; duplicate bugs.
**Do this instead:** One `buildNetWorthForecastSeries`; signed slots (or discuss-locked parallel dataKey sharing same builder).

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| None | N/A | Local SQLite; no bank API (OOS). Contract study is human-supplied text → rules in lib, not connectors. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Account ↔ CreditGraceObligation | Prisma FK; Cascade or Restrict on account delete — pick Restrict if account delete still deferred | Config fields validated only for `FIAT_CREDIT` |
| credit-grace.ts ↔ nw-forecast.ts | Pure slot DTO | Grace maps to `ForecastSlot`; forecast never imports Prisma |
| DashboardChartsShell ↔ page.tsx | Props: `forecastIncome` + `forecastGraceObligations` | Serialize BigInt as string like income |
| Grace actions ↔ BalanceSnapshot | **Forbidden** | Assert in GRACEISO tests |
| net-worth / historical-series ↔ grace | **Forbidden imports** | Mirror INISO-01 file scan |
| Debts | No coupling | DISOL unchanged |

### Suggested build order (dependency-aware)

1. **Contract / discuss lock** — grace start definition, monthly repeat rule, NW-semantics option A vs B (blocks plan precision, not schema sketch).
2. **Schema + migration** — `Account.grace*` + `CreditGraceObligation` + CHECKs; no UI yet.
3. **Pure `credit-grace.ts` + tests** — due date, cycle candidates, open membership, overdue.
4. **Extend `nw-forecast.ts` for signed deltas** + unit tests (income regression + negative slots).
5. **Account actions/UI** — edit grace config on FIAT_CREDIT only.
6. **Obligation actions/UI** — create amount, early close (DestructiveConfirmStep), list open/overdue.
7. **Wire `page.tsx` + `DashboardChartsShell`** — load OPEN rows, merge slots, reuse partial FX banner / hide Line when no slots.
8. **GRACEISO-01 tests** — import bans, no snapshot writes, past-series golden identity with/without obligations.
9. **UAT (Orca)** — config → amount → forecast dip/marker → early close clears forecast; history unchanged.

## Sources

- Codebase (HIGH): `prisma/schema.prisma` Account / BalanceSnapshot; `src/lib/net-worth.ts` (`creditDebtMinor` path); `src/lib/nw-forecast.ts` + `DashboardChartsShell.tsx` income open-slot merge; `src/lib/iniso.test.ts` isolation wall; `src/lib/income.ts` occurrence pattern; `.planning/PROJECT.md` v1.3 requirements / ISO-01 lock.
- Ecosystem (MEDIUM): Centinel checking forecast due-date outflows; Quicken Simplifi projected cash flows + statement-driven amount; BudgetLabs cash coverage replacing minimum with planned payment to avoid double-count — [centinelmoney.com](https://www.centinelmoney.com/resources/credit-card-payments-in-your-checking-account-forecast), [quicken.com/blog](https://www.quicken.com/blog/best-financial-planning-software-integrations-with-credit-cards-for-spending-and-debt-management-2026/), [budgetlabs.io/docs/cash-coverage](https://www.budgetlabs.io/docs/cash-coverage).
- Pending (LOW until contract study): bank-specific revolving vs statement grace semantics — user-supplied contract before plan lock.

---
*Architecture research for: Wallet v1.3 credit grace + forecast obligations*
*Researched: 2026-09-08*
