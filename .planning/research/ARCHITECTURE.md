# Architecture Research

**Domain:** Savings account type + interest NW forecast overlay (v1.5) on existing wallet
**Researched:** 2026-09-11
**Confidence:** HIGH (codebase seams verified; ecosystem “overlay ≠ history” MEDIUM)

## Standard Architecture

### System Overview

v1.5 does **not** add a new side-ledger table family. SAVINGS is a first-class `Account` (asset in historical NW via `BalanceSnapshot` LOCF). Expected interest is a **forecast-only addend** on the existing dashed «Прогноз» pipeline — same isolation posture as income (ΔNW > 0), opposite of grace (A′ ΔNW = 0).

```
┌─────────────────────────────────────────────────────────────────────────┐
│  UI: /accounts (CRUD)          UI: Капитал `/` DashboardChartsShell       │
│  create/update SAVINGS         fact Line + dashed «Прогноз» Line          │
└──────────────┬───────────────────────────────┬──────────────────────────┘
               │ mutate                        │ read assemble
               ▼                               ▼
┌──────────────────────────┐    ┌──────────────────────────────────────────┐
│ Account (type=SAVINGS)   │    │ Membership fold (page + MCP twin)         │
│ annualRate* +            │───▶│ income slots │ grace A′ │ interest slots │
│ accrualDayOfMonth*       │    └────────────────────┬─────────────────────┘
│ BalanceSnapshot (manual) │                         ▼
└──────────────┬───────────┘    ┌──────────────────────────────────────────┐
               │ LOCF           │ buildNetWorthForecastSeries (pure)         │
               ▼                │ kind income → +ΔNW │ grace → 0 │ interest→+ΔNW│
┌──────────────────────────┐    └────────────────────┬─────────────────────┘
│ computeNetWorthRows /    │                         ▼
│ historical-series        │    dashed overlay + get_forecast_overlay MCP
│ (accounts-only; NO       │
│  interest inputs)        │    Isolation: SAVISO twin of INISO/GRISO
└──────────────────────────┘    (never write BalanceSnapshot from interest)
```

\*Type-gated nullable columns — same CHECK pattern as `creditLimitMinor` / grace DOM.

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `Account` + `AccountType.SAVINGS` | Persist savings metadata + manual balances | Prisma enum + nullable rate/DOM + SQLite CHECK |
| `BalanceSnapshot` | Source of truth for principal (manual) | Unchanged write path; LOCF via `locf.ts` |
| `computeNetWorthRows` / `historical-series` | Historical + as-of NW (accounts only) | Treat SAVINGS as asset (`isAssetType`); **no interest field** |
| `savings-interest` (NEW pure lib) | Monthly interest amount + accrual date membership | Twin of `income.ts` / `credit-grace.ts` — no Prisma / NW |
| `nw-forecast.ts` | Stair-step overlay from slots | Extend `ForecastSlotKind`; interest like income (+primary) |
| `DashboardChartsShell` + `page.tsx` | UI membership → builder | Add `forecastSavings` props; concat slots |
| `load-forecast-overlay.ts` | MCP page-parity loader | Same membership as shell |
| MCP `list_accounts` / `get_forecast_overlay` | PARITY-01 read surfaces | Expose rate/DOM + `kind: interest` events; SAVISO copy |
| Isolation tests | Regression wall | `saviso.test.ts` twin of `iniso`/`griso` |

## Recommended Project Structure

```
prisma/
├── schema.prisma                 # MODIFY — AccountType.SAVINGS + rate/DOM fields
└── migrations/…_savings_…/       # NEW — RedefineTables + Account_savings_invariant

src/lib/
├── account-type.ts               # MODIFY — isSavingsType; isAssetType includes SAVINGS
├── validations/account.ts        # MODIFY — create/update schemas for SAVINGS fields
├── savings-interest.ts           # NEW — pure: monthlyInterestMinor + listInterestSlotsInRange
├── saviso.test.ts                # NEW — import walls + golden series identity
├── nw-forecast.ts                # MODIFY — ForecastSlotKind += "interest"
├── nw-forecast.test.ts           # MODIFY — interest ΔNW + window rules
├── net-worth.ts                  # MODIFY — NetWorthAccountType union only
├── historical-series.ts          # MODIFY — SeriesAccount type union only (no interest API)
├── locf.ts                       # UNCHANGED — reuse locfAmountAsOf / locfRateAsOf
├── money.ts / dates.ts           # UNCHANGED — clampDayOfMonth; minor math
└── mcp/
    ├── create-handler.ts         # MODIFY — instructions + SAVISO
    ├── isolation-contract.test.ts
    ├── tools/accounts.ts         # MODIFY — annualRate + accrualDayOfMonth + isSavings
    ├── tools/forecast.ts         # MODIFY — description mentions interest
    └── reads/load-forecast-overlay.ts  # MODIFY — interest membership

src/components/dashboard/
└── DashboardChartsShell.tsx      # MODIFY — forecastSavings → slots

src/app/
├── page.tsx                      # MODIFY — load SAVINGS + pass forecast props
└── accounts/actions.ts           # MODIFY — create/update SAVINGS; never interest→snapshot
```

### Structure Rationale

- **Pure `savings-interest.ts`:** Matches income/grace isolation — forecast math never imports Prisma, `net-worth`, or `historical-series`.
- **Fields on `Account` (not new ledger):** Interest schedule is account metadata (like grace DOM on FIAT_CREDIT), not a parallel entity. Principal stays `BalanceSnapshot`.
- **MCP under existing tools first:** New UI reads = extend `list_accounts` + `get_forecast_overlay`. Dedicated `list_savings` only if a separate savings page appears (PARITY-01).

## Architectural Patterns

### Pattern 1: Type-gated Account columns (FIAT_CREDIT → SAVINGS)

**What:** Nullable columns valid only for one `AccountType`, enforced by SQLite CHECK + Zod write gates.
**When to use:** Metadata that belongs to one account kind (credit limit, grace DOM, savings rate/DOM).
**Trade-offs:** Wide `Account` row vs separate tables; CHECK keeps honesty; RedefineTables migration is the established SQLite path.

**Example:**
```typescript
// Mirror Account_grace_dom_invariant:
// SAVINGS ⇒ annualRateBps NOT NULL AND accrualDayOfMonth IN 1..31
// non-SAVINGS ⇒ both NULL
export function assertSavingsFieldsAllowed(
  type: string,
  annualRateBps: number | null,
  accrualDayOfMonth: number | null,
): boolean {
  const anySet = annualRateBps != null || accrualDayOfMonth != null;
  if (!anySet) return type !== "SAVINGS"; // SAVINGS requires both at create
  return type === "SAVINGS";
}
```

### Pattern 2: Forecast overlay membership (income → interest)

**What:** Caller builds `ForecastSlot[]`; pure `buildNetWorthForecastSeries` converts FX (LOCF rate as of **today**), sorts dates, cumulative stair-step from NW anchor.
**When to use:** Any expected future cash that must not rewrite past NW.
**Trade-offs:** Duplicate membership in `DashboardChartsShell` and `load-forecast-overlay` (already true for income/grace) — keep both in lockstep or extract shared assembler later.

**Example:**
```typescript
// nw-forecast.ts — interest behaves like income for ΔNW
export type ForecastSlotKind = "income" | "grace" | "interest";

const primaryMinor = slot.kind === "grace" ? 0n : displayPrimaryMinor;
// slotInWindow: interest uses income rule (plannedAsOf > today)
```

### Pattern 3: Isolation twin (INISO/GRISO → SAVISO)

**What:** Static import bans + golden `buildNetWorthSeries` identity; MCP descriptions name the rule; never-write BalanceSnapshot from interest paths.
**When to use:** Every overlay/side feature that agents might fold into historical NW.
**Trade-offs:** More source-scan tests; prevents silent regressions when wiring forecast.

### Pattern 4: Soft asset inclusion

**What:** `isAssetType` / `isCreditType` soft-read helpers; create path enum narrower than read path.
**When to use:** Legacy types (FIAT_DEBIT/CRYPTO/CASH) still readable; create allows ASSET | FIAT_CREDIT | **SAVINGS**.
**Trade-offs:** SAVINGS is new create-path type (unlike deferred legacy merges).

## Data Flow

### Request Flow (interest on «Прогноз»)

```
Manual BalanceSnapshot (principal)
    ↓ locfAmountAsOf(today)
NW anchor (computeNetWorthRows) ──────────────┐
    ↓                                         │
savings-interest: monthly = bal × rate/12     │
    + clampDayOfMonth accrual dates in window │
    ↓                                         ▼
ForecastSlot{ kind:"interest", … } → buildNetWorthForecastSeries
    ↓
mergeFactAndForecast → dashed Line
    ↓
serializeForecastPayload → get_forecast_overlay
```

### State Management

No client store for interest. Server RSC loads accounts/snapshots/rates; client shell memoizes forecast from props (existing `useMemo` pattern).

### Key Data Flows

1. **Historical NW:** `BalanceSnapshot` + FX LOCF → `computeNetWorthRows` / `buildNetWorthSeries`. SAVINGS rows included as assets. Interest **never** enters these APIs.
2. **Interest forecast:** LOCF principal **as of today** (flat, non-compounding across months — compound OOS) × annual%/12 → slots on accrual DOM → overlay only.
3. **FX honesty:** Reuse forecast FX gate (`locfRateAsOf(rates, code, today)`); missing rate → exclude slot + partial banner (same as income).
4. **MCP parity:** Same membership loader as UI; descriptions cite SAVISO; payloads stay free of `isolation` meta flags (description-only, like DISOL/INISO/GRISO).

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Single-user local SQLite (this product) | Flat monthly interest + sparse overlay dates; no cache layer |
| Many SAVINGS × long horizon | Slot gen is O(accounts × months); 1y cap already in `forecastHorizonEnd` |
| Agent traffic | Read-only MCP; same Prisma reads as page — no extra write load |

### Scaling Priorities

1. **First bottleneck:** Duplicated shell/MCP membership drift — extract shared `assembleForecastSlots` if third caller appears.
2. **Second bottleneck:** N/A for local single-user; do not add interest materialization tables.

## Anti-Patterns

### Anti-Pattern 1: Auto BalanceSnapshot on accrual day

**What people do:** Cron/job writes interest into `BalanceSnapshot`.
**Why it's wrong:** Breaks INISO/GRISO twin; pollutes historical LOCF; OOS for v1.5.
**Do this instead:** Overlay-only; user manually updates balance when bank posts interest.

### Anti-Pattern 2: Feed interest into `computeNetWorthRows`

**What people do:** Add projected interest to as-of / series totals.
**Why it's wrong:** Forecast becomes “fact”; golden past-series identity fails.
**Do this instead:** Slots → `buildNetWorthForecastSeries` only.

### Anti-Pattern 3: Side-ledger tables for interest

**What people do:** `SavingsAccrual` entity like `RecurringIncome`.
**Why it's wrong:** Interest is deterministic from account fields + LOCF balance; extra tables add sync debt.
**Do this instead:** Columns on `Account` + pure slot generator (grace-DOM pattern).

### Anti-Pattern 4: Compounding projected principal inside overlay

**What people do:** Month N interest on balance+prior interest.
**Why it's wrong:** OOS (“simple annual%÷12”); diverges from manual snapshot truth.
**Do this instead:** Each month’s interest = **today’s** LOCF × rate/12 (flat).

### Anti-Pattern 5: Grace-style ΔNW=0 for interest

**What people do:** Show tooltip but add 0 to forecast.
**Why it's wrong:** Interest should raise expected NW (income-like).
**Do this instead:** `primaryMinor = displayPrimaryMinor` for `kind: "interest"`.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| None | — | Local SQLite only; no bank APR APIs |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Account CRUD ↔ BalanceSnapshot | Server actions | Unchanged; SAVINGS uses same snapshot upserts |
| Account metadata ↔ forecast | Props / MCP loader | Rate+DOM + LOCF amount → interest slots |
| `nw-forecast` ↔ `net-worth` / `historical-series` | **None** | Import wall (INISO/GRISO/SAVISO) |
| `savings-interest` ↔ Prisma | **None** | Pure; callers load rows |
| UI forecast ↔ MCP forecast | Shared pure builder + mirrored membership | PARITY-01 |
| LOCF | `locfAmountAsOf` / `locfRateAsOf` | Interest base + FX; do not invent rates |

### New vs Modified (explicit)

| Artifact | Change |
|----------|--------|
| `AccountType` + Account columns + CHECK | **NEW** enum member + fields + migration |
| `savings-interest.ts`, `saviso.test.ts` | **NEW** |
| `nw-forecast` kinds + shell/page/MCP loader | **MODIFY** |
| `account-type`, validations, accounts actions/UI | **MODIFY** |
| `list_accounts` / `get_forecast_overlay` / handler instructions | **MODIFY** (PARITY) |
| `locf.ts`, BalanceSnapshot schema, debts/income/grace domains | **UNCHANGED** contracts |
| Auto interest → snapshot | **OUT OF SCOPE** |

### Suggested build order (deps)

1. **Schema + soft types** — `SAVINGS` enum, `annualRateBps` + `accrualDayOfMonth`, CHECK invariant, `isAssetType`/`isSavingsType`. Unblocks everything.
2. **Pure interest lib + unit tests** — monthly minor math, DOM clamp series, window `> today`. No UI yet.
3. **`nw-forecast` kind `interest`** — ΔNW addend + `slotInWindow` + unit tests (can mock slots without Prisma).
4. **Account create/update Zod + actions + UI** — user can create SAVINGS with rate/DOM; snapshot path unchanged.
5. **Wire Капитал membership** — `page.tsx` + `DashboardChartsShell` concat interest slots with income/grace.
6. **SAVISO isolation suite** — import bans, golden series identity, actions never-write snapshot from interest.
7. **MCP PARITY** — extend `list_accounts` + `get_forecast_overlay` + handler/isolation-contract copy (after UI read surface exists).
8. **Nyquist / Orca UAT** — overlay visible; historical NW unchanged with/without savings rate.

**Ordering rationale:** Schema → pure math → overlay kind → CRUD → UI wire → isolation proof → MCP (parity same milestone, after UI) → verify. Never invert 5 before 3 (shell needs kind). Never ship MCP before UI read surface (PARITY-01).

## Sources

- Codebase: `prisma/schema.prisma`, `src/lib/nw-forecast.ts`, `src/lib/locf.ts`, `src/lib/net-worth.ts`, `src/components/dashboard/DashboardChartsShell.tsx`, `src/lib/mcp/reads/load-forecast-overlay.ts`, `src/lib/mcp/tools/{forecast,accounts}.ts`, `src/lib/{iniso,griso}.test.ts`, `prisma/migrations/20260909090903_credit_grace_dual_dom/migration.sql`
- Project locks: `.planning/PROJECT.md` (v1.5; INISO/GRISO/PARITY; auto-snapshot OOS)
- Ecosystem (MEDIUM): Net Worth View / ledger_finance / wealthtrajectory — dated snapshots + separate projection overlays [confidence: MEDIUM]

---
*Architecture research for: wallet v1.5 SAVINGS + interest forecast*
*Researched: 2026-09-11*
