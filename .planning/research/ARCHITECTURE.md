# Architecture Research

**Domain:** Local single-user personal finance / net-worth tracking (balance snapshots + dated FX)
**Researched:** 2026-09-02
**Confidence:** MEDIUM (cross-checked OSS patterns + multi-currency NW guidance; stack-agnostic structure)

## Standard Architecture

### System Overview

Local net-worth trackers that skip full double-entry (Wallet v1) converge on a **snapshot + rate table** core, not a transaction ledger. Closest open-source analog: Ghostfolio-style `Account` + dated balances + dated market/FX series with `toCurrencyAtDate`. Firefly III’s ledger is the alternative industry pattern — correct for cash-flow apps, overkill when the product is “how much where, over time.”

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Presentation (Web UI)                            │
│  Dashboard │ Accounts │ Snapshots │ Currencies/FX │ Charts (as-of)       │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ HTTP / local API
┌───────────────────────────────▼─────────────────────────────────────────┐
│                         Application API                                  │
│  accounts │ balances │ currencies │ fx-rates │ net-worth │ charts        │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────────┐
│                         Domain Services                                  │
│  ┌──────────────┐ ┌────────────────┐ ┌─────────────┐ ┌───────────────┐ │
│  │ AccountSvc   │ │ SnapshotSvc    │ │ Currency/FX │ │ NetWorthSvc   │ │
│  │ types, limit │ │ as-of carry    │ │ dated rates │ │ assets−debt   │ │
│  └──────┬───────┘ └───────┬────────┘ └──────┬──────┘ └───────┬───────┘ │
│         └─────────────────┴────────┬────────┴────────────────┘         │
│                                    │                                     │
│                         FxConvert (as-of lookup)                         │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│                         Persistence                                      │
│  SQLite file on host bind-mount  ←  Docker app container (single writer) │
│  currencies │ accounts │ balance_snapshots │ fx_rates │ app_settings     │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Presentation** | CRUD forms, as-of date pickers, NW total, history charts | SPA or server-rendered pages; Russian-first UI |
| **Accounts API** | Create/update accounts; types; credit limit; currency FK | REST/RPC handlers over AccountSvc |
| **Snapshots API** | Insert/update dated balances (backdating allowed) | One row per (account, as_of_date); upsert |
| **Currency/FX API** | Free-form currencies; one primary; dated primary↔other rates | Manual rate entry only in v1 |
| **NetWorthSvc** | Resolve balances + FX as-of D; convert; assets − credit debt | Pure read path; no stored “converted NW” as source of truth |
| **ChartSvc** | Time series of NW / per-account in primary and native | Calls NetWorthSvc per sample date (or batched query) |
| **SQLite + Docker** | Durable single-file DB; WAL; host volume | One container, bind-mount `./data:/data` |

## Recommended Project Structure

Stack-agnostic layout (map names to whatever STACK.md picks):

```
src/
├── domain/
│   ├── accounts/           # types, validation (credit limit vs debt)
│   ├── snapshots/          # balance as-of carry-forward
│   ├── currencies/         # currency registry + primary flag
│   ├── fx/                 # dated rate store + as-of lookup
│   └── networth/           # conversion + NW aggregation
├── api/                    # HTTP handlers / route modules
├── db/
│   ├── migrations/         # schema evolution
│   ├── schema.sql          # or ORM schema
│   └── client.ts           # connection, PRAGMAs (WAL, FK)
├── ui/                     # pages/components
└── docker/
    ├── Dockerfile
    └── compose snippet notes  # volume mount for SQLite
```

### Structure Rationale

- **`domain/networth` separate from snapshots/FX:** NW is a derived read model. Keeps write paths simple and makes as-of semantics testable without UI.
- **`domain/fx` isolated:** Rate gaps and carry-forward rules are the #1 source of chart bugs in multi-currency apps (Ghostfolio `toCurrencyAtDate` failures).
- **`db/migrations` first-class:** Snapshot/FX schemas evolve; treat SQLite file as product data.

## Architectural Patterns

### Pattern 1: User-Authored Balance Snapshots (not ledger cache)

**What:** Each account’s history is a series of `(as_of_date, amount)` rows. “Balance on day D” = latest snapshot with `as_of_date <= D` (carry-forward). No transactions in v1.

**When to use:** Periodic manual updates (Wallet’s core value). Distinct from fintech “balance_snapshots” that cache sums of ledger entries.

**Trade-offs:** Simple writes and charts; cannot explain *why* a balance changed; backdated edits rewrite intervening history points that carry-forward from that row.

**Example:**
```typescript
// Balance as-of D: latest snapshot on or before D
function balanceAsOf(snapshots: { asOf: string; amount: number }[], date: string): number | null {
  const eligible = snapshots.filter(s => s.asOf <= date).sort((a, b) => b.asOf.localeCompare(a.asOf));
  return eligible[0]?.amount ?? null; // null = no observation yet
}
```

### Pattern 2: Dated FX with Forward Application (as-of semantics)

**What:** Store rates as `(quote_currency, as_of_date, rate_to_primary)`. Rate on D = latest row with `as_of_date <= D`. Primary currency always converts 1:1. v1 only primary ↔ other (no cross pairs).

**When to use:** Historical charts that must not be rewritten when today’s rate changes.

**Trade-offs:** Honest history; requires user to enter rates before foreign balances can contribute to NW; missing rate must be explicit (partial total or block), never silent `undefined` multiply.

**Example:**
```typescript
// Prefer storing: 1 UNIT_OTHER = rate PRIMARY (rate_to_primary)
function toPrimary(amountNative: number, rateToPrimary: number): number {
  return amountNative * rateToPrimary;
}

function rateAsOf(rates: { asOf: string; rate: number }[], date: string): number | null {
  const eligible = rates.filter(r => r.asOf <= date).sort((a, b) => b.asOf.localeCompare(a.asOf));
  return eligible[0]?.rate ?? null;
}
```

### Pattern 3: Compute Net Worth at Read Time

**What:** Do not persist “net worth in primary” as source of truth. On each request/chart sample date D:

1. For each included account, resolve native balance as-of D  
2. Convert with FX as-of D (primary accounts skip FX)  
3. Sum assets; subtract credit-card outstanding debt (also converted)  
4. Credit *limit* is display-only — never enters NW  

**When to use:** Always for Wallet v1. Optional later: materialize chart cache if sample count grows.

**Trade-offs:** Correct under rate/snapshot edits; tiny compute for single-user SQLite.

### Pattern 4: Single-Container SQLite Persistence

**What:** App process owns the `.db` file on a **host bind mount**. Enable `journal_mode=WAL`, `foreign_keys=ON`, `busy_timeout`. One writer.

**When to use:** Local Docker personal tools (PROJECT constraint).

**Trade-offs:** Operational simplicity; no multi-replica; backup = copy file (after checkpoint) or `sqlite3 .backup`.

## Data Model Sketch

```
app_settings
  primary_currency_code  TEXT  -- FK → currencies.code (exactly one primary)

currencies
  code        TEXT PK          -- e.g. RUB, USDT (user-defined, not ISO-forced)
  name        TEXT
  is_primary  INTEGER NOT NULL -- 0/1; enforce ≤1 primary via app + CHECK/trigger

accounts
  id              TEXT/INTEGER PK
  name            TEXT NOT NULL
  type            TEXT NOT NULL  -- 'fiat_debit' | 'fiat_credit' | 'crypto' | 'cash'
  currency_code   TEXT NOT NULL → currencies.code
  credit_limit    NUMERIC NULL   -- only fiat_credit; informational
  include_in_nw   INTEGER DEFAULT 1
  archived        INTEGER DEFAULT 0
  created_at      TEXT

balance_snapshots
  id           PK
  account_id   → accounts.id
  as_of_date   TEXT NOT NULL    -- calendar date (UTC or local-day; pick one, stick to it)
  amount       NUMERIC NOT NULL -- native currency; for fiat_credit = outstanding debt
  note         TEXT NULL
  UNIQUE (account_id, as_of_date)

fx_rates
  id              PK
  currency_code   TEXT NOT NULL → currencies.code  -- the non-primary side
  as_of_date      TEXT NOT NULL
  rate_to_primary NUMERIC NOT NULL  -- 1 unit of currency_code = rate units of primary
  UNIQUE (currency_code, as_of_date)
  -- constraint: currency_code ≠ primary
```

**Credit card convention:** `amount` on snapshots = **debt outstanding** (liability). Available credit = `credit_limit - debt` (UI only). NW contribution = `−toPrimary(debt)`.

**Asset convention:** `amount` = positive holdings. NW contribution = `+toPrimary(amount)`.

### Historical Net Worth Algorithm (as-of)

For report date `D` and sample series `D0..Dn`:

```
NW(D) = Σ over accounts where include_in_nw:
          if type in (fiat_debit, crypto, cash):
            + toPrimary(balanceAsOf(account, D), rateAsOf(account.currency, D))
          if type == fiat_credit:
            − toPrimary(balanceAsOf(account, D), rateAsOf(account.currency, D))

where toPrimary(amt, rate):
  if currency == primary: return amt
  if rate is null: mark sample PARTIAL / exclude account (never invent rate)
  else: return amt * rate_to_primary
```

**Chart rule:** Each chart point uses **that point’s date** for both balance carry-forward and FX carry-forward. Changing a rate dated 2026-06-01 must not alter chart points before that date; it must affect points from that date forward. Changing a balance snapshot dated T affects all points ≥ T until the next snapshot.

**Do not:** Convert all history with “today’s” rate (rewrites the past — called out by PortfolioPilot / multi-currency NW guides).

## Data Flow

### Request Flow (current NW)

```
User opens dashboard (as_of = today or picker)
    ↓
API GET /net-worth?asOf=D
    ↓
NetWorthSvc
    → SnapshotSvc.balanceAsOf(each account, D)
    → FxSvc.rateAsOf(each non-primary currency, D)
    → convert + sum assets − credit debts
    ↓
JSON { totalPrimary, perAccount[], partial?: reason }
    ↓
UI renders total + breakdown
```

### Write Flows

1. **Account create:** UI → Accounts API → validate type/currency/limit → insert `accounts`
2. **Balance update:** UI → Snapshots API → upsert `(account_id, as_of_date, amount)` — backdating allowed
3. **FX update:** UI → FX API → upsert `(currency_code, as_of_date, rate_to_primary)`
4. **Primary change:** rare; settings write + invalidate mental model of all rates (phase needs explicit migration rules)

### Key Data Flows

1. **Snapshot write → chart:** New/edited snapshot changes carry-forward from its date; charts recompute on read.
2. **FX write → chart:** Same; rates apply forward from `as_of_date`.
3. **Native vs primary display:** Per-account charts can plot native amounts without FX; overall NW chart always primary.

### State Management

Single-user app: **server SQLite is the state**. UI may keep short-lived client cache; after any mutation, invalidate NW/chart queries. No multi-tab sync product requirement beyond SQLite consistency.

## Suggested Build Order

Dependencies force this sequence for roadmap phases:

| Order | Component | Why first / after |
|------:|-----------|-------------------|
| 1 | **Docker + SQLite shell** (volume, PRAGMAs, migrations runner) | Everything else persists here |
| 2 | **Currencies + primary setting** | Accounts and FX both FK to currencies |
| 3 | **Accounts** (types, credit_limit, currency) | Snapshots need account_id |
| 4 | **Balance snapshots** (CRUD + as-of query) | Core capital history without FX yet (native-only views) |
| 5 | **FX rates** (CRUD + as-of lookup) | Needed before honest multi-currency totals |
| 6 | **NetWorthSvc** (assets − debt, conversion, partial handling) | Composes 4+5 |
| 7 | **Dashboard current NW + per-account** | First user-visible core value |
| 8 | **Historical charts** (sample dates, as-of FX) | Needs stable NetWorthSvc |
| 9 | Polish (archive accounts, notes, Russian copy) | Non-blocking |

**Phase ordering rationale:** Never build charts before as-of balance + as-of FX exist — charts will bake in wrong semantics. Never attach FX before primary currency exists. Native-only balances can ship before FX for single-currency smoke tests, but multi-currency requirement means FX lands before calling NW “done.”

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Single user, years of weekly snapshots | Monolith + SQLite; recompute charts in process; no cache required |
| Dense daily samples × many accounts | Batch SQL for as-of lookups; optional materialized NW series |
| Multi-user / sync | Out of scope — would force auth, conflict rules, likely leave pure SQLite |

### Scaling Priorities

1. **First bottleneck:** Missing FX rates causing broken or silent totals — handle explicitly in NetWorthSvc.
2. **Second bottleneck:** Accidental DB loss on container recreate — bind-mount + backup path documentation.

## Anti-Patterns

### Anti-Pattern 1: Mutable `accounts.balance` as only truth

**What people do:** Store current balance on the account row; overwrite on each update.  
**Why it's wrong:** No history; charts invent or lose past; backdating impossible.  
**Do this instead:** Append/upsert dated `balance_snapshots`; derive “current” as as-of today.

### Anti-Pattern 2: Convert history with today’s FX

**What people do:** Store only native balances; chart past NW using latest rate.  
**Why it's wrong:** Rewrites history when FX moves (false gains/losses).  
**Do this instead:** Dated `fx_rates` + rate-as-of-date per chart point.

### Anti-Pattern 3: Store only converted primary amounts

**What people do:** User converts mentally and enters RUB for USDT account.  
**Why it's wrong:** Cannot separate asset move vs FX move; native chart lies.  
**Do this instead:** Always store native; convert in NetWorthSvc.

### Anti-Pattern 4: Credit limit in the NW formula

**What people do:** Treat limit as asset or subtract limit instead of debt.  
**Why it's wrong:** Inflates/deflates capital; limit is unused capacity.  
**Do this instead:** NW uses outstanding debt only; show limit/available in UI.

### Anti-Pattern 5: Full double-entry in v1

**What people do:** Copy Firefly III schema on day one.  
**Why it's wrong:** Delays core value; PROJECT explicitly defers transactions.  
**Do this instead:** Snapshot architecture; leave a clean boundary if ledger is added later (snapshots can become opening assertions).

### Anti-Pattern 6: SQLite only inside container layer

**What people do:** Write `/app/data.db` with no volume.  
**Why it's wrong:** `docker compose up --build` deletes net worth history.  
**Do this instead:** Host bind-mount; document backup of the file.

### Anti-Pattern 7: Silent missing FX

**What people do:** Treat missing rate as 0 or 1.  
**Why it's wrong:** Corrupts totals (Ghostfolio-class bugs when rate undefined).  
**Do this instead:** Partial NW flag or block foreign accounts until rate exists for D.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| None in v1 | — | Manual FX and balances only |
| Future FX API | Adapter behind FxSvc | Must still persist dated rates for history |
| Future bank/CSV import | Writer into `balance_snapshots` | Do not bypass as-of model |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| UI ↔ API | HTTP JSON | As-of date always explicit on NW/chart reads |
| API ↔ Domain | Direct calls | Keep FX/snapshot logic out of handlers |
| NetWorthSvc ↔ SnapshotSvc / FxSvc | Sync function calls | NetWorth must not write |
| Domain ↔ SQLite | Repository / SQL | Unique constraints enforce one snapshot/rate per day |

## Sources

- Ghostfolio Prisma schema (`Account`, `AccountBalance`, `MarketData`) and `ExchangeRateDataService.toCurrencyAtDate` behavior — GitHub ghostfolio/ghostfolio [MEDIUM]
- Firefly III account types / liability vs asset / `include_net_worth` — Firefly docs & API [MEDIUM]
- Multi-currency NW: store native, convert with time-consistent rates; avoid rewriting history — PortfolioPilot; TrackWorth; MyMoneyViz [MEDIUM]
- Mozaic Finance: history points frozen at rate-of-day; no reproject with new rates [MEDIUM]
- SQLite + Docker volumes, WAL, single writer — OneUptime; Valters IT; linux-server-admin SQLite/Docker guides [MEDIUM]
- PROJECT.md Wallet constraints (snapshots, manual dated FX primary↔other, Docker+SQLite) [HIGH — project authority]

---
*Architecture research for: local net-worth tracking (balance snapshots + dated FX)*
*Researched: 2026-09-02*
