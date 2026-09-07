# Architecture Research

**Domain:** Income plan/actual ledger + NW forecast overlay on existing Wallet
**Researched:** 2026-09-07
**Confidence:** HIGH (codebase integration); MEDIUM (chart dual-series UX details)
**Milestone:** v1.2 Доходы

## Standard Architecture

### System Overview

Income is a **third parallel domain** (after Accounts/NW and Debts). Same SQLite, Currency, FX LOCF, money minors — **no writes into Account / BalanceSnapshot** when recording actual; **no mutation of historical LOCF NW rows**.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  UI (App Router)                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │ `/` Капитал  │  │ `/debts`     │  │ `/income`    │  NEW             │
│  │ NW hero+chart│  │ Долги        │  │ Доходы       │                   │
│  │ + forecast   │  │ (DISOL)      │  │ plan/actual  │                   │
│  │   overlay    │  └──────┬───────┘  └──────┬───────┘                   │
│  └──────┬───────┘         │                 │                            │
├─────────┴─────────────────┴─────────────────┴────────────────────────────┤
│  Pure libs                                                               │
│  ┌────────────────┐ ┌────────────┐ ┌─────────────────┐ ┌──────────────┐│
│  │ net-worth.ts   │ │ debts.ts   │ │ income.ts NEW   │ │ nw-forecast  ││
│  │ historical-    │ │ (DISOL)    │ │ plan slots,     │ │ .ts NEW      ││
│  │ series.ts      │ │            │ │ overdue, stats  │ │ overlay only ││
│  │ UNCHANGED math │ │            │ │                 │ │              ││
│  └───────┬────────┘ └─────┬──────┘ └────────┬────────┘ └──────┬───────┘│
│          │                │                 │                  │         │
│          └────────────────┴──── Currency / locf / money ───────┘         │
├─────────────────────────────────────────────────────────────────────────┤
│  Prisma / SQLite                                                         │
│  Account · BalanceSnapshot · FxRate · Currency                           │
│  Person · Debt · DebtRepayment · DebtSizeChange                          │
│  IncomeSource · IncomeActual  ← NEW (Person FK reused)                   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Integration model (locked)

| Concern | Rule |
|---------|------|
| Historical NW | Still `buildNetWorthSeries` → `computeNetWorthRows` + LOCF balances/FX only |
| Forecast | Separate pure series: `todayNW + Σ future planned recurring (+ one-time > today)` in primary |
| Actual income | Manual fact row only — **never** creates/updates `BalanceSnapshot` in v1.2 |
| Past overdue plan w/o actual | UI highlight on `/income`; **does not** rewrite past NW points |
| Debts | Untouched; DISOL-01 tests stay |

Isolation name for tests: **INISO-01** (mirror DISOL-01):

- `src/lib/net-worth.ts` and `src/lib/historical-series.ts` **must not** import `@/lib/income` or `@/lib/nw-forecast`
- Income Server Actions **must not** call Prisma `balanceSnapshot.create/update`
- `buildNetWorthSeries` output for dates ≤ today identical whether income tables empty or full (property test)

`/` / `DashboardChartsShell` **may** import forecast helpers (unlike debts↔page DISOL). Overlay is intentional capital UX.

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `IncomeSource` | Recurring or one-time plan definition | Prisma model + Zod actions |
| `IncomeActual` | Manual fact for one planned slot | Prisma; unique per (source, plannedAsOf) |
| `src/lib/income.ts` | Generate plan slots, overdue, counterparty stats | Pure + Vitest |
| `src/lib/nw-forecast.ts` | Forward NW from anchor + planned amounts × FX | Pure; uses `locfRateAsOf` / money convert |
| `buildNetWorthSeries` | Historical sparse NW ≤ today | **Unchanged** |
| `NetWorthHistoryChart` | Render historical + dashed forecast | Dual series / dual dataKeys |
| `/income` | CRUD, overdue list, counterparty stats | App Router + Dialogs |
| Person | Counterparty for debts **and** income | Reuse existing model |

## Recommended Project Structure

```
prisma/schema.prisma              # + IncomeSource, IncomeActual; Person.incomes
src/lib/
├── income.ts                     # NEW: plan occurrences, overdue, stats
├── income.test.ts
├── nw-forecast.ts                # NEW: buildNetWorthForecastSeries
├── nw-forecast.test.ts
├── iniso.test.ts                 # NEW: isolation like disol.test.ts
├── validations/income.ts         # NEW
├── net-worth.ts                  # NO income imports
├── historical-series.ts          # NO income imports; dates ≤ today only
├── locf.ts                       # reuse for FX on forecast convert
└── debts.ts                      # unchanged
src/app/income/
├── page.tsx                      # NEW «Доходы»
└── actions.ts                    # CRUD source + record actual
src/components/income/            # NEW lists, dialogs, overdue styling
src/components/dashboard/
├── DashboardChartsShell.tsx      # MODIFY: merge forecast into chart props
└── NetWorthHistoryChart.tsx      # MODIFY: forecast Line/Area + join at today
src/components/nav.tsx            # + «Доходы» → /income
src/app/page.tsx                  # MODIFY: load income defs + pass forecast inputs
```

### Structure Rationale

- **`income.ts` vs `nw-forecast.ts`:** Ledger semantics (plan/actual/overdue) stay separable from capital projection so debts-style domain lib stays testable without chart horizon rules.
- **Reuse `Person`:** One counterparty vocabulary already shipped; income FK → `Person`. UI label «Контрагент» on Доходы. Avoid second people table unless discuss-phase forbids mixing employers with debt contacts.
- **Virtual plan slots:** Do not materialize every future month in DB. Persist **definitions + actuals** only; generate expected dates in pure code (same sparsity as BalanceSnapshot events).

## Architectural Patterns

### Pattern 1: Source + Actual (not double-entry)

**What:** `IncomeSource` holds schedule/amount/currency/counterparty; `IncomeActual` records when/how much was really received for a given `plannedAsOf`.
**When to use:** Plan vs actual without posting to accounts (v1.2 lock).
**Trade-offs:** User must still update balances manually — honest with snapshot-based NW; later milestone can optional-bump balances.

**Suggested schema (conceptual):**

```prisma
enum IncomeKind {
  RECURRING
  ONE_TIME
}

model IncomeSource {
  id           Int        @id @default(autoincrement())
  personId     Int
  person       Person     @relation(fields: [personId], references: [id], onDelete: Restrict)
  kind         IncomeKind
  currencyCode String
  currency     Currency   @relation(...)
  /// Planned amount in minors (default for occurrences)
  amountMinor  BigInt
  /// 1–31; required when RECURRING; clamp to month length in generators
  dayOfMonth   Int?
  /// First eligible plan date (RECURRING start) or the single plan date (ONE_TIME)
  startAsOf    String     // YYYY-MM-DD
  endAsOf      String?    // optional stop for recurring
  note         String?
  active       Boolean    @default(true)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  actuals      IncomeActual[]
}

model IncomeActual {
  id            Int          @id @default(autoincrement())
  sourceId      Int
  source        IncomeSource @relation(...)
  /// Which plan slot this fulfills (generated expected pay date)
  plannedAsOf   String       // YYYY-MM-DD
  actualAsOf    String       // YYYY-MM-DD when received
  amountMinor   BigInt       // may differ from source.amountMinor
  note          String?
  createdAt     DateTime     @default(now())

  @@unique([sourceId, plannedAsOf])
}
```

### Pattern 2: Virtual occurrence generator

**What:** `listPlanOccurrences(sources, from, to) → { sourceId, plannedAsOf, amountMinor, currencyCode }[]`
**When:** List UI, overdue (`plannedAsOf < today && !actual`), forecast sample dates.
**Trade-offs:** Must unit-test month-end clamp (day 31 → Feb 28/29) using Moscow calendar helpers already in `dates.ts` / `calendarDateToday`.

```typescript
// overdue = plan slot in past with no IncomeActual for (sourceId, plannedAsOf)
function isOverdue(slot, actualsByKey, today: string): boolean {
  return slot.plannedAsOf < today && !actualsByKey.has(`${slot.sourceId}:${slot.plannedAsOf}`);
}
```

### Pattern 3: Forecast overlay (not LOCF rewrite)

**What:** Anchor = `totalPrimaryMinor` as of today from existing NW path. Future points = anchor + cumulative Σ converted planned amounts for slots with `plannedAsOf > today` (and ≤ horizon). Use LOCF FX as of **min(occurrenceDate, lastKnownRateDate)** — in practice latest rate ≤ today (no future FxRate rows).
**When:** Капитал chart only; recurring + future one-time; skip inactive sources; skip slots that already have actual only if actual date ≤ today (those are “done” — do not double-count in future). Past missing actuals: **ignore for forecast and history**.
**Trade-offs:** Forecast assumes pay lands in NW without expenses — product honesty via copy («прогноз по плану доходов»). Missing FX → exclude that source contribution + `isPartialForecast` banner.

```typescript
// Pseudocode — lives in nw-forecast.ts, NOT historical-series.ts
function buildNetWorthForecastSeries(input: {
  anchorPrimaryMinor: bigint;
  slots: PlanSlot[];           // plannedAsOf > today
  rates: SeriesRate[];
  primaryCode: string;
  primaryScale: number;
  today: string;
  horizonEnd: string;          // e.g. addCalendarDays(today, 90)
}): { asOfDate: string; forecastPrimaryMinor: bigint; forecast: number }[] {
  // sampleDates = {today} ∪ slot dates in (today, horizonEnd]
  // cumulative += convert(slot) at each slot date; carry flat between
}
```

### Pattern 4: Recharts dual series

**What:** Historical `nw` / stacks for dates ≤ today; `forecast` dataKey for today→horizon with `strokeDasharray`. Join point: today row has both `nw` and `forecast` equal to anchor major.
**When:** Overlay on existing AreaChart / Line.
**Trade-offs:** Recharts cannot dash mid-segment of one Line — two series is the ecosystem standard (MEDIUM confidence from community docs).

## Data Flow

### Request Flow — income CRUD

```
User (Доходы Dialog)
    ↓
Server Action + Zod (validations/income.ts)
    ↓
Prisma IncomeSource / IncomeActual
    ↓
revalidatePath("/income")  [and "/" only if forecast inputs change — sources/actuals]
    ↓
page reload → listPlanOccurrences + overdue badges
```

**Hard gate:** Action path never touches `BalanceSnapshot`.

### Request Flow — Капитал with overlay

```
page.tsx
  ├─ accounts + snapshots + rates  → computeNetWorthRows (hero)
  │                               → DashboardChartsShell → buildNetWorthSeries (history)
  └─ income sources + actuals     → nw-forecast inputs
                                  → DashboardChartsShell merges forecast points
                                       ↓
                              NetWorthHistoryChart (nw solid + forecast dashed)
```

### Key Data Flows

1. **Plan list / overdue:** sources → virtual slots → left-join actuals → RU highlight «заполни».
2. **Counterparty stats:** group actuals (and/or planned) by `personId` in primary via FX as-of today; partial honesty if missing rate.
3. **NW forecast:** today anchor + future slots → cumulative primary minors → chart overlay.
4. **Non-flow:** actual → BalanceSnapshot; income → `computeNetWorthRows`; income → historical sample dates ≤ today.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Single-user local (this app) | Virtual slot gen for ~12–36 months fine in memory |
| Many sources × long horizon | Cap horizon (90d default); paginate income history |
| Future: income posts to balances | New optional action; still keep historical NW from snapshots only |

### Scaling Priorities

1. **First bottleneck:** Chart payload size if forecasting daily points — sample on pay dates ∪ today ∪ horizonEnd only (sparse, like historical-series).
2. **Second bottleneck:** N+1 Prisma on income page — batch load sources+actuals+people like `/debts`.

## Anti-Patterns

### Anti-Pattern 1: Fold income into `buildNetWorthSeries`

**What people do:** Add income events into historical sample dates / totals.
**Why wrong:** Violates PROJECT lock; past NW would invent cash that never hit BalanceSnapshot; breaks trust in LOCF history.
**Do this instead:** Overlay-only `nw-forecast.ts`; INISO-01 regression tests.

### Anti-Pattern 2: Auto-create BalanceSnapshot on actual

**What people do:** “Received salary → bump account.”
**Why wrong:** Out of scope v1.2; mixes ledgers; wrong account ambiguity.
**Do this instead:** Actual row only; user updates balance on «Счета» when ready.

### Anti-Pattern 3: Materialize all future plan rows in DB

**What people do:** Cron/job inserts 12 months of plan occurrences.
**Why wrong:** Edit dayOfMonth/amount becomes mass rewrite; SQLite clutter.
**Do this instead:** Persist source + actuals; generate slots in pure lib.

### Anti-Pattern 4: Import income into `net-worth.ts`

**What people do:** “One function for all money.”
**Why wrong:** Couples capital inclusion rules to salary schedule; DISOL lessons repeat.
**Do this instead:** Anchor NW from existing pure function; add forecast in separate module.

### Anti-Pattern 5: New Counterparty table without need

**What people do:** `IncomePayor` duplicate of `Person`.
**Why wrong:** Two people UIs; merge hell.
**Do this instead:** Reuse `Person` unless discuss-phase explicitly splits employers vs debt contacts.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| None | — | Local Docker + SQLite only |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| income ↔ Account/BalanceSnapshot | **None (v1.2)** | INISO write gate |
| income ↔ computeNetWorthRows / historical-series | **None** | Read isolation |
| income → `/` chart | Props / pure forecast merge in DashboardChartsShell | Allowed |
| income → Currency / FxRate | FK + LOCF read | Same honesty as debts totals |
| income → Person | FK Restrict | Shared counterparty |
| debts ↔ income | Shared Person only | No shared math modules required |

### New vs Modified (explicit)

| Area | Change |
|------|--------|
| `prisma/schema.prisma` | **New** IncomeSource, IncomeActual; Person/Currency relations |
| `src/lib/income.ts` (+ validations, tests) | **New** |
| `src/lib/nw-forecast.ts` (+ tests) | **New** |
| `src/lib/iniso.test.ts` | **New** isolation |
| `src/app/income/**` | **New** |
| `src/components/income/**` | **New** |
| `src/components/nav.tsx` | **Modify** — «Доходы» link |
| `src/app/page.tsx` | **Modify** — load forecast inputs |
| `DashboardChartsShell` / `NetWorthHistoryChart` | **Modify** — overlay series |
| `src/lib/net-worth.ts` | **No semantic change** |
| `src/lib/historical-series.ts` | **No semantic change** (still ≤ today) |
| `src/lib/locf.ts` / `money.ts` / `dates.ts` | **Reuse** (maybe tiny date helper for day-of-month clamp) |
| Debts domain | **Unchanged** |

## Suggested Build Order (deps)

1. **Schema + pure income math** — models/migration; `listPlanOccurrences`, overdue, day-of-month clamp, counterparty aggregate helpers + Vitest. No UI.
2. **Доходы CRUD + nav** — `/income`, source create (recurring/one-time), Person pick/create, list, DestructiveConfirmStep on delete. Overdue highlight without actuals yet optional stub.
3. **Record actual** — dialog to fill fact (amount/date); unique slot; still no BalanceSnapshot; revalidate `/income` (+ `/` if forecast already wired).
4. **Counterparty stats** — section on `/income` (primary totals, FX partial).
5. **NW forecast overlay** — `nw-forecast.ts` + chart dual series + page payload; horizon default 90d; INISO-01 tests; smoke that historical points bitwise-equal without income.

**Ordering rationale:** Cannot forecast without source definitions; cannot mark overdue without actual join; chart overlay last so capital UX does not block ledger MVP. Schema/math first mirrors v1.1 Phase 8→9→10→11.

**Phase research flags:**

| Topic | Deeper research? |
|-------|------------------|
| Day-of-month / short months | Light — decide clamp algorithm in plan-phase |
| Forecast horizon vs range preset | Discuss — recommend independent 90d forward |
| Person reuse vs split | Discuss if UX confuses employers with debtors |
| Chart Area vs Line for forecast | UI-SPEC — dual dataKey pattern settled |
| Posting actual → balance | Out of scope — do not research into v1.2 |

## Sources

- Codebase (codegraph + reads): `prisma/schema.prisma`, `src/lib/net-worth.ts`, `historical-series.ts`, `locf.ts`, `disol.test.ts`, `DashboardChartsShell.tsx`, `NetWorthHistoryChart.tsx`, `page.tsx`, `src/lib/debts.ts`
- `.planning/PROJECT.md` v1.2 locks (no auto balance bump; forecast overlay not LOCF rewrite)
- Prior v1.1 research pattern (side-ledger + DISOL) in this file’s previous revision
- Recharts community: dual Line + `strokeDasharray` for forecast vs history (MEDIUM)
- Ecosystem: RecurringRule/Source separate from Actual/Transaction; avoid balance post until explicit (MEDIUM)

---
*Architecture research for: Wallet v1.2 income + NW forecast*
*Researched: 2026-09-07*
