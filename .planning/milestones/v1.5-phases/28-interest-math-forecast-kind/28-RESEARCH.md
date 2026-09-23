# Phase 28: Interest math + forecast kind - Research

**Researched:** 2026-09-21
**Domain:** Pure monthly SAVINGS interest (bigint ÷12) + `ForecastSlotKind` `"interest"` ΔNW
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
### Compound forecast (overrides research “flat today LOCF each month”)
- **D-01:** Forecast shows **monthly** credits on accrual DOM (not daily). User sees **which day** interest arrives and **how much**; NW stair-steps on those credits. — **Reversibility:** costly — membership + chart semantics assume discrete monthly slots.
- **D-02:** **Compound in overlay:** each slot = `(runningPrincipal × annualRateBps) / (12 × 10000)` truncated; after credit, running principal += that interest for the next month. Start principal = **this account’s LOCF balance as of today** only. — **Reversibility:** costly — overrides `.planning/research/SUMMARY.md` “flat non-compounding” default; tests and enumerator must encode growth chain. Per-slot formula remains ÷12 (not APY/`Math.pow`).
- **D-03:** Income/grace overlay amounts **do not** enter the interest principal base. — **Reversibility:** reversible locally.
- **D-04:** Multiple SAVINGS accounts compound **independently**; NW sums their Δ. — **Reversibility:** reversible.

### Rate / calendar / currency inputs
- **D-05:** All future slots in a run use **current** `Account.annualRateBps` + `accrualDayOfMonth` (no rate history in v1.5). — **Reversibility:** costly if rate history added later.
- **D-06:** Interest computed in **account-currency minor**; FX LOCF conversion stays Phase 29 overlay assembly (same pattern as income slots). — **Reversibility:** costly if primary math is inlined early.
- **D-07:** Accrual dates via **reuse** of `nextAccrualAsOf` / `clampDayOfMonth` (one calendar truth with list countdown). Membership is **future-only**: `plannedAsOf > today` (income-style window). — **Reversibility:** costly — SC #2/#4 + `slotInWindow`.

### Rounding & zero membership
- **D-08:** Truncate toward **0**; single division: `(balanceMinor × annualRateBps) / (12 × 10000)`. — **Reversibility:** costly — golden tests lock truncate.
- **D-09:** Compound chain feeds **truncated** interest only (no fractional remainder carry across months).
- **D-10:** Emit a slot **only if** `interestMinor > 0` after truncate. Covers: missing/zero LOCF balance, `annualRateBps === 0`, sub-minor months. No zero-amount calendar placeholders.

### Phase 28 API surface
- **D-11:** Deliver **`src/lib/savings-interest.ts`**: monthly interest helper + compound membership enumerator over `[today, horizon]` (research name sketch: `listInterestSlotsInRange` / equivalent) — pure, no Prisma/NW imports. — **Reversibility:** costly — Phase 29/30 callers depend on this API.
- **D-12:** Extend `ForecastSlotKind` with `"interest"`; `slotInWindow` like income (`> today`); builder ΔNW = **+displayPrimary** (not grace `0n`). Unit-test builder path in Phase 28. **Do not** wire DashboardChartsShell / page / MCP loaders here (Phase 29+). — **Reversibility:** costly — SC #3.
- **D-13:** `ForecastSlot.parentId` for interest = **`accountId`**. Optional `accountId` / `accountName` metadata may mirror grace for later tooltips (Phase 29 discretion).

### Claude's Discretion
- Exact helper/export names inside `savings-interest.ts` (must satisfy D-02, D-07–D-11).
- Whether `savings-accrual-display.ts` re-exports shared calendar bits vs interest importing display helpers — prefer no second calendar implementation.
- Horizon argument shape (caller passes `horizonEnd` like grace membership; Phase 29 supplies preset horizon).
- Micro-details of sorting/stable order when multiple accounts share an accrual date.
- Ban `Math.pow` / APY conversion on interest path in tests (label stays «годовой %» / ÷12).

### Deferred Ideas (OUT OF SCOPE)
- **ASSET ↔ SAVINGS type conversion in account settings** — user wants edit-type both ways; **separate roadmap phase** (reopens Phase 27 D-08 type immutability). Not Phase 28–30.
- Капитал dashed «Прогноз» wire + FX partial banner + SAVISO — Phase 29
- MCP list_accounts / forecast interest events + PARITY-01 — Phase 30
- Rate history, auto BalanceSnapshot, daily/min-balance engines, legend split by kind — PROJECT / REQUIREMENTS Out of Scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INT-01 | Expected monthly interest for a SAVINGS account equals LOCF balance × annual rate / 12, credited on the account's accrual day-of-month (with `clampDayOfMonth`) | `monthlyInterestMinor` bigint ÷12 (D-08) on a per-account running principal that **starts** at today LOCF and then adds truncated credits (D-02). Dates from `nextAccrualAsOf` / `clampDayOfMonth`. First future slot equals today-LOCF × rate / 12; later slots use the grown principal. No `Math.pow` / APY. |
</phase_requirements>

## Summary

Phase 28 is a pure-library add. New `src/lib/savings-interest.ts` turns each SAVINGS account’s **today LOCF minor** plus current `annualRateBps` and `accrualDayOfMonth` into future monthly slots. `src/lib/nw-forecast.ts` learns kind `"interest"`: same future window as income (`plannedAsOf > today`), ΔNW = +converted amount (grace stays `0n`). No Dashboard, page, or MCP membership wire (D-12). No new npm packages.

**D-02 overrides the milestone research default.** `.planning/research/SUMMARY.md` says multi-month overlay uses flat today’s LOCF × rate/12 per slot (non-compounding). `.planning/research/ARCHITECTURE.md` Anti-Pattern 4 says the same. CONTEXT D-02 replaces that: each month is still `(runningPrincipal × annualRateBps) / (12 × 10000)` truncated toward 0, then `runningPrincipal += interestMinor` only when that value is `> 0`. Per-slot math stays ÷12. APY / `Math.pow` stays banned. INT-01 and roadmap SC #1 (“no silent compound/APY”) mean “do not replace ÷12 with a compound-rate factor,” not “keep every month on the original LOCF.”

**Primary recommendation:** Export `monthlyInterestMinor` and `listInterestSlotsInRange` from `src/lib/savings-interest.ts` (import `nextAccrualAsOf`, do not copy the calendar). Widen `ForecastSlotKind` and branch `slotInWindow` so `"interest"` uses the income predicate. Keep the builder addend `0n` only for `"grace"`. Unit-test both modules. Widen `SerializedForecastEvent.kind` so existing `kind: e.kind` still typechecks; do not load interest slots in the shell or MCP loader.

## Project Constraints (from .cursor/rules/)

No `.cursor/rules/*.mdc` in the repo. Constraints that still bind this phase:

- **PARITY-01** (AGENTS.md / REQUIREMENTS): a new user-visible read surface needs a matching read-only MCP tool in the same milestone. Phase 28 ships no UI and no MCP tool (D-12). Do not add MCP fields here. Phase 30 owns PARITY-01.
- **Next.js agent rules:** this phase does not touch App Router APIs. Stay in `src/lib/*`.
- **Import wall** (existing `nw-forecast.ts` header): forecast builder stays free of Prisma, historical NW, and `credit-grace`. Interest math stays free of Prisma, `net-worth`, `historical-series`, and `nw-forecast` (D-11).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Monthly interest minor + compound chain | API / Backend (pure `src/lib`) | — | Bigint formula and running principal; no DOM, no DB |
| Accrual date series | API / Backend (pure `src/lib`) | — | Reuse `nextAccrualAsOf` / `clampDayOfMonth`; caller passes `today` |
| Forecast ΔNW for kind `"interest"` | API / Backend (`nw-forecast.ts`) | — | Stair-step already lives here; slots are inputs |
| Today LOCF balance + FX to primary | Database / Storage (Phase 29 caller) | API / Backend builder FX gate (already shipped) | D-06: Phase 28 tests inject balance and currency flags; builder already converts non-primary non-grace slots |
| Капитал chart / MCP events | — (out of phase) | — | D-12 defers shell + `loadForecastOverlay` membership to Phases 29–30 |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript bigint `/` | Node v24.5.0 (this machine) | Truncate-toward-0 division | D-08 single division; no decimal.js / float APR `[VERIFIED: node probe]` `[CITED: https://tc39.es/ecma262/multipage/ecmascript-data-types-and-values.html]` |
| `src/lib/dates.ts` `clampDayOfMonth` | in-repo | DOM onto short months | Already the calendar truth; leap + non-leap tests exist |
| `src/lib/savings-accrual-display.ts` `nextAccrualAsOf` | in-repo | Next accrual YYYY-MM-DD | D-07 reuse; list countdown already calls it |
| `src/lib/nw-forecast.ts` `buildNetWorthForecastSeries` | in-repo | Overlay stair-step | Kind widen + window + ΔNW; do not fork a second series builder |
| vitest | 4.1.11 (`package.json` devDependency; `./node_modules/.bin/vitest --version`) | Unit tests | Existing `src/**/*.test.ts` runner |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `src/lib/savings-rate.ts` `parsePercentToBps` | in-repo | bps already stored on Account | Do not re-parse percent inside interest math. Input is `annualRateBps: number` |
| `forecastHorizonEnd` | in-repo | Preset → horizon end | Phase 29 caller. Enumerator takes `horizonEnd: string` (grace shape). Do not import `nw-forecast` from `savings-interest.ts` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| bigint `(balance × bps) / 120000n` | `decimal.js`, float `balance * rate / 12`, `Math.pow(1+r, 1/12)-1` | Locked out. Float drifts; APY factor is a different number than ÷12 |
| Flat LOCF every month (SUMMARY / ARCHITECTURE Anti-Pattern 4) | D-02 compound chain | User lock overrides research default. Do not re-litigate |
| Copy `clampDayOfMonth` into `savings-interest.ts` | Import `nextAccrualAsOf` | Second calendar will drift from list countdown |

**Installation:** none. Do not add packages.

**Version verification:** no new package names. Runtime: Node `v24.5.0`, npm `10.9.3`, vitest `4.1.11`.

## Package Legitimacy Audit

Phase installs no external packages. Legitimacy gate not run. Nothing to approve, flag, or remove.

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
tests / Phase 29 caller
        │  account { id, todayLocfMinor, annualRateBps, accrualDayOfMonth, currency* }
        │  today, horizonEnd
        ▼
listInterestSlotsInRange                         (savings-interest.ts)
        │  per account, principal starts at today LOCF only
        │  cursor = addCalendarDays(today, 1)
        │  accrual = nextAccrualAsOf(cursor, DOM)  → clampDayOfMonth
        │  interest = (principal × bps) / (12 × 10000)   truncate toward 0
        │  if interest > 0: emit slot, principal += interest
        │  cursor = addCalendarDays(accrual, 1)
        │  stop when accrual > horizonEnd
        ▼
InterestForecastSlot[]     (no ForecastSlot import)
        │  Phase 28 tests map by hand; Phase 29 maps:
        │  kind:"interest", parentId=accountId, plannedAmountMinor=interestMinor
        ▼
buildNetWorthForecastSeries                      (nw-forecast.ts)
        │  slotInWindow: interest ⇒ plannedAsOf > today && plannedAsOf <= horizonEnd
        │  FX LOCF as of today (existing); miss ⇒ exclude + partial flag
        │  ΔNW: grace → 0n; income → +display; interest → +display
        ▼
ForecastPoint[] stair-step
        ✗ does not call buildNetWorthSeries / BalanceSnapshot
```

Phase 28 stops at the builder return value inside unit tests. `DashboardChartsShell` and `loadForecastOverlay` keep building only income + grace slots.

### Recommended Project Structure

```
src/lib/
├── savings-interest.ts            # NEW — monthlyInterestMinor + listInterestSlotsInRange
├── savings-interest.test.ts       # NEW — ÷12, truncate, compound chain, Feb, future-only, zero skip
├── nw-forecast.ts                 # MODIFY — kind "interest", slotInWindow, explicit ΔNW
├── nw-forecast.test.ts            # MODIFY — interest +ΔNW, today excluded, grace still 0
└── mcp/reads/load-forecast-overlay.ts  # MODIFY type only — SerializedForecastEvent.kind union
```

Do not create `savings-interest` Prisma models. Do not edit `historical-series.ts`, account actions, `DashboardChartsShell.tsx`, `page.tsx`, or `src/lib/mcp/tools/forecast.ts` in this phase.

### Pattern 1: Compound membership enumerator

**What:** One running principal per account. Start = injected today LOCF. Each future accrual date gets one truncated monthly credit; that credit is the only amount added before the next month.
**When to use:** All Phase 28 slot generation.
**Example:**

```typescript
// Prescribed. Division semantics: ECMAScript BigInt::divide → ℤ(truncate(quotient)).
// Node v24.5.0: (1_000_000n * 1650n) / (12n * 10000n) === 13750n
//               (100n * 10000n) / (12n * 10000n) === 8n
//               (-100n * 10000n) / (12n * 10000n) === -8n
export function monthlyInterestMinor(
  balanceMinor: bigint,
  annualRateBps: number,
): bigint {
  if (annualRateBps <= 0 || balanceMinor <= 0n) return 0n;
  return (balanceMinor * BigInt(annualRateBps)) / (12n * 10000n);
}
```

Walk (do not emit `plannedAsOf <= today`):

```typescript
let cursor = addCalendarDays(today, 1);
let principal = account.balanceMinor;
while (cursor <= horizonEnd) {
  const accrual = nextAccrualAsOf(cursor, account.accrualDayOfMonth);
  if (accrual > horizonEnd) break;
  const interestMinor = monthlyInterestMinor(principal, account.annualRateBps);
  if (interestMinor > 0n) {
    emit({ plannedAsOf: accrual, interestMinor, parentId: account.accountId });
    principal += interestMinor; // D-09: truncated value only
  }
  cursor = addCalendarDays(accrual, 1); // nextAccrualAsOf is sticky on the accrual day
}
```

`nextAccrualAsOf` returns this month when `clamp >= today` argument `[VERIFIED: src/lib/savings-accrual-display.ts:8-16]`:

```typescript
export function nextAccrualAsOf(today: string, dayOfMonth: number): string {
  const [ys, ms] = today.split("-");
  const y = Number(ys);
  const m = Number(ms);
  const thisMonth = clampDayOfMonth(y, m, dayOfMonth);
  if (thisMonth >= today) return thisMonth;
  // else next month via addCalendarDays(..., 32) then clampDayOfMonth
}
```

Income loader already starts the day after today `[VERIFIED: src/lib/mcp/reads/load-forecast-overlay.ts:194]`:

```typescript
const from = addCalendarDays(today, 1);
```

and drops non-future rows `[VERIFIED: src/lib/mcp/reads/load-forecast-overlay.ts:261]`:

```typescript
if (!(o.plannedAsOf > today)) continue;
```

Match that. If the cursor is left on the accrual day, `nextAccrualAsOf` returns the same day forever.

### Pattern 2: Kind widen without wiring callers

**What:** `"interest"` is a third `ForecastSlotKind`. Window matches income. ΔNW matches income. Grace stays `0n`.
**When to use:** `nw-forecast.ts` only, plus the serialized-event union so `tsc` stays green.
**Example:** current kind and addend `[VERIFIED: src/lib/nw-forecast.ts:18]` and `[VERIFIED: src/lib/nw-forecast.ts:81-92,149]`:

```typescript
export type ForecastSlotKind = "income" | "grace";

function slotInWindow(
  kind: ForecastSlotKind,
  plannedAsOf: string,
  today: string,
  horizonEnd: string,
): boolean {
  if (plannedAsOf > horizonEnd) return false;
  if (kind === "income") {
    return plannedAsOf > today;
  }
  // grace: allows today after overdue fold (D-01, D-04)
  return plannedAsOf >= today;
}

const primaryMinor = slot.kind === "grace" ? 0n : displayPrimaryMinor;
```

Change the union to `"income" | "grace" | "interest"`. Branch interest with income (`plannedAsOf > today`). If interest falls through the current grace `return`, accrual **on today** enters the overlay and SC #4 fails.

Replace the ternary with an exhaustive switch: `"income"` and `"interest"` return `displayPrimaryMinor`; `"grace"` returns `0n`; `default` assigns `never`. The current ternary already adds every non-grace kind, so a forgotten case would credit NW. Exhaustiveness makes the next kind a compile error.

`ForecastSlot.parentId` for interest = `accountId` (D-13). Also set optional `accountId` (and `accountName` when the fixture has a name) so Phase 29 tooltips can mirror grace. Do not set `dueAsOf` unless a test needs it; grace owns that field.

### Pattern 3: Pure module, caller-owned LOCF

**What:** `savings-interest.ts` imports only `@/lib/dates` (`addCalendarDays`) and `@/lib/savings-accrual-display` (`nextAccrualAsOf`). No Prisma, no `locf`, no `money` FX, no `nw-forecast`, no `income`, no `credit-grace`.
**When to use:** Always for this file.
**Example:** Grace membership shape to copy, not its overdue fold `[VERIFIED: src/lib/credit-grace.ts:292-296]`:

```typescript
export function openGraceForecastMembership(
  obligations: readonly GraceForecastObligationInput[],
  today: string,
  horizonEnd: string,
): GraceForecastMembership[] {
```

Interest signature: `(accounts, today, horizonEnd) => slots`. Inclusive horizon end (`plannedAsOf === horizonEnd` is inside; `>` is outside), exclusive today. Do not fold overdue accruals onto today (that is grace). A missed past accrual is absent from the forecast; principal is still today’s LOCF, not “LOCF plus skipped months.”

Sort output by `plannedAsOf` ascending, then `accountId` ascending, so two accounts on the same DOM have a stable order. The builder’s date sort is stable and date-only `[VERIFIED: src/lib/nw-forecast.ts:183-188]`; pinning order in the enumerator keeps tests deterministic.

### Anti-Patterns to Avoid

- **Flat multi-month assertion:** `N` slots each equal to the first month. D-02 makes month 2 larger when month 1 credited. Pitfall 4’s “horizon grows faster than 12 × one month on fixed LOCF” detector is now the **expected** compound chain, not a bug.
- **APY “fix”:** `(1 + bps/10000)^(1/12) - 1` or `Math.pow`. 12% ÷12 on `1_000_000n` is `10000n` per first month, not the APY monthly factor.
- **Interest kind with grace ΔNW:** tooltip without a stair-step. SC #3 fails.
- **Interest window `>= today`:** copies grace overdue fold. SC #4 fails. `nextAccrualAsOf("2026-02-28", 31)` is `"2026-02-28"` `[VERIFIED: src/lib/savings-accrual-display.test.ts:12-14]`.
- **Importing `nw-forecast` from interest math** or **importing interest math from `historical-series` / `net-worth`.**
- **Wiring `DashboardChartsShell` or `loadForecastOverlay` membership** in this phase.
- **Remainder carry:** storing the truncated-away fraction and adding it next month (D-09).
- **Zero-amount placeholder slots** on months that truncate to 0 (D-10).
- **Shared principal across accounts** (D-04) or **adding income/grace amounts into principal** (D-03).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Short-month / Feb DOM | New date clamp | `clampDayOfMonth` via `nextAccrualAsOf` | Leap 2024-02-29 and non-leap 2025-02-28 already tested |
| Truncate-toward-0 money | `Math.trunc(Number(...))`, decimal lib | bigint `/` | Number overflows past 2^53; bigint division is the locked op |
| Forecast stair-step / FX | Second series function | `buildNetWorthForecastSeries` | FX-as-of-today, partial banner counters, grace `0n` already correct |
| Overlay horizon presets | Duplicate day offsets inside interest lib | Caller passes `horizonEnd` | `forecastHorizonEnd` stays in `nw-forecast.ts` |

**Key insight:** The only new algorithm is the running-principal loop. Calendar, FX, and the stair-step already exist.

## Common Pitfalls

### Pitfall 1: Sticky `nextAccrualAsOf`
**What goes wrong:** Infinite loop or a single repeated accrual date.
**Why it happens:** On the accrual day, `thisMonth >= today` returns that same day.
**How to avoid:** Advance `cursor` to `addCalendarDays(accrual, 1)` after every month, including months that emit nothing.
**Warning signs:** Test timeout; duplicate `plannedAsOf`.

### Pitfall 2: Today’s accrual included
**What goes wrong:** Fact line and overlay both show the credit the user may already have snapshotted (milestone pitfall 7).
**Why it happens:** `nextAccrualAsOf(today, dom)` returns today when today is the clamped DOM; grace window is `>= today`.
**How to avoid:** Start at `addCalendarDays(today, 1)` and `slotInWindow` interest branch `> today`. Do not add a synthetic “today interest” into the starting principal.
**Warning signs:** Slot dated equal to `today`; builder `includedSlotCount` includes it.

### Pitfall 3: Implementing SUMMARY flat math
**What goes wrong:** Every month uses the original LOCF. User lock D-02 fails.
**Why it happens:** SUMMARY line “flat today’s LOCF × rate/12” and ARCHITECTURE Anti-Pattern 4 still read as the default.
**How to avoid:** Tests: `1_000_000n` at `1200` bps → month 1 `10000n`, month 2 `10100n` (probe below). Do not assert `10000n` twice.
**Warning signs:** Principal argument ignored after the first slot.

### Pitfall 4: Silent APY
**What goes wrong:** Numbers disagree with «годовой %» / ÷12.
**Why it happens:** Industry notes say “don’t divide APY by 12,” which invites the inverse “fix.”
**How to avoid:** One division by `12n * 10000n`. Test file (or a one-line source assert) fails if `savings-interest.ts` contains `Math.pow`.
**Warning signs:** First month on `1_000_000n` at 12% is not `10000n`.

### Pitfall 5: Floor-toward-−∞ on a negative LOCF
**What goes wrong:** Negative balances emit a negative “interest” slot or use `Math.floor` semantics (`-9` instead of `-8`).
**Why it happens:** JS `Math.floor` is not bigint `/`.
**How to avoid:** Guard `balanceMinor <= 0n` → `0n` and D-10 `> 0` before emit. bigint `/` already truncates toward 0 (`-100n * 10000n / 120000n === -8n` on Node v24.5.0).
**Warning signs:** A slot with `interestMinor < 0n`.

### Pitfall 6: Type widen breaks MCP serialize
**What goes wrong:** `tsc` fails in `load-forecast-overlay.ts` even with zero interest membership.
**Why it happens:** `[VERIFIED: src/lib/mcp/reads/load-forecast-overlay.ts:31-32]`

```typescript
export type SerializedForecastEvent = {
  kind: "income" | "grace";
```

maps `[VERIFIED: src/lib/mcp/reads/load-forecast-overlay.ts:91-92]`:

```typescript
forecastEvents: p.forecastEvents.map((e) => ({
  kind: e.kind,
```

`ForecastEvent.kind` is `ForecastSlotKind`. Widening the union makes `e.kind` not assignable to `"income" | "grace"`.
**How to avoid:** Widen `SerializedForecastEvent.kind` to `"income" | "grace" | "interest"` in the same change. Do not add SAVINGS queries, do not change `forecast.ts` prose, do not push interest slots into `openSlots`. Chart code filters `e.kind === "grace"` only `[VERIFIED: src/components/dashboard/NetWorthHistoryChart.tsx:64]` and keeps compiling.
**Warning signs:** Assignability error on `kind: e.kind` only.

### Pitfall 7: Compounding inside the builder
**What goes wrong:** ΔNW uses a principal the builder recomputes from prior forecast points, mixing income/grace into the savings base (breaks D-03) or double-counting.
**Why it happens:** “Running principal” sounds like the NW stair-step.
**How to avoid:** Compound only inside `listInterestSlotsInRange`. Builder adds precomputed `plannedAmountMinor` like income.
**Warning signs:** `nw-forecast.ts` imports `savings-interest` or reads `annualRateBps`.

## Code Examples

### Golden minors (Node v24.5.0 probe)

```typescript
// (balanceMinor * BigInt(bps)) / (12n * 10000n)
// 1_000_000n @ 1650 bps (16.50% on 10000.00 scale-2) → 13750n
// 1_000_000n @ 1200 bps → 10000n; next principal 1_010_000n → 10100n
// 100n @ 10000 bps → 8n; next principal 108n → 9n  (no fractional carry)
// 1n @ 1 bps → 0n  (D-10: no slot)
// -100n @ 10000 bps → -8n (toward 0; guard skips emit)
```

`10000.00` major at scale 2 is `1_000_000n` via existing `parseMajorToMinor` (do not reimplement). `1650` bps is `parsePercentToBps("16.50")` `[VERIFIED: src/lib/savings-rate.ts:7-10]`:

```typescript
/**
 * Parse UI percent major (up to 2 frac digits) → annualRateBps Int.
 * "16.50" → 1650; "0" → 0. Rejects negatives and Int overflow (D-01…D-03).
 */
export function parsePercentToBps(major: string): number {
```

Schema stores that int `[VERIFIED: prisma/schema.prisma:110-114]`:

```prisma
  /// Annual rate in bps (1650 = 16.50%). Required iff type == SAVINGS (D-01, D-14, D-15).
  /// SQLite CHECK Account_savings_rate_invariant enforces SAVINGS ↔ rate+DOM (else null).
  annualRateBps       Int?
  /// Accrual day-of-month 1–31. Required iff type == SAVINGS (D-05, D-15).
  accrualDayOfMonth   Int?
```

CHECK `[VERIFIED: prisma/migrations/20260911161446_savings_account/migration.sql:41-47]`:

```sql
CONSTRAINT "Account_savings_rate_invariant" CHECK (
    (
        type = 'SAVINGS'
        AND annualRateBps IS NOT NULL
        AND annualRateBps >= 0
        AND accrualDayOfMonth IS NOT NULL
        AND accrualDayOfMonth BETWEEN 1 AND 31
```

`BigInt(annualRateBps)` is exact: Prisma Int max in the parser is `2147483647` `[VERIFIED: src/lib/savings-rate.ts:4]`:

```typescript
const PRISMA_INT_MAX = 2147483647;
```

### Calendar reuse

`clampDayOfMonth` `[VERIFIED: src/lib/dates.ts:56-66]`:

```typescript
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

Existing expectations `[VERIFIED: src/lib/dates.test.ts:40-50]`:

```typescript
expect(clampDayOfMonth(2025, 2, 31)).toBe("2025-02-28");
expect(clampDayOfMonth(2024, 2, 31)).toBe("2024-02-29");
expect(clampDayOfMonth(2026, 4, 31)).toBe("2026-04-30");
```

Enumerator expectations to lock:

- `today = "2026-02-10"`, DOM 31, `horizonEnd = "2026-03-31"` → accruals `2026-02-28`, `2026-03-31`.
- `today = "2026-02-28"`, DOM 31, same horizon → only `2026-03-31` (the 28th is not future).
- `today = "2024-02-01"`, DOM 31 → `2024-02-29` when that date is `<= horizonEnd`.

### Builder contrast (grace stays flat)

Grace future slot does not move NW `[VERIFIED: src/lib/nw-forecast.test.ts:301-322]` (fixture `today = "2026-03-01"` at line 9):

```typescript
expect(
  result.points.find((p) => p.asOfDate === "2026-03-15")?.forecastPrimaryMinor,
).toBe(1_000_000n);
```

Interest test: same anchor `1_000_000n`, slot `kind: "interest"`, `plannedAmountMinor: 50_000n`, `plannedAsOf: "2026-03-15"`, primary currency → that point’s `forecastPrimaryMinor` is `1_050_000n`. Same-day interest + grace moves NW by the interest amount only (mirror of the income+grace test at lines 387–403). Slot with `plannedAsOf === today` and `kind: "interest"` → `includedSlotCount === 0`.

### ECMAScript division

DATA_q4n8w2lr_START
BigInt::divide: If y = 0ℤ, throw a RangeError. Let quotient be ℝ(x) / ℝ(y). Return ℤ(truncate(quotient)).
DATA_q4n8w2lr_END

`[CITED: https://tc39.es/ecma262/multipage/ecmascript-data-types-and-values.html]` section 6.1.6.2.5. MDN: BigInt `/` truncates toward zero and discards the remainder `[CITED: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Division]`. Divisor here is the constant `120000n`, so the RangeError path does not apply. Do not mix `bigint` and `number` in the same `/` (TypeError).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Milestone research: flat today-LOCF × rate/12 every month | D-02 truncated compound chain, still ÷12 per slot | CONTEXT 2026-09-21 | Tests must encode growth; SUMMARY/ARCHITECTURE flat sentences are stale for this phase |
| `ForecastSlotKind = "income" \| "grace"` | Add `"interest"` with income window and income ΔNW | This phase | Compile-compat widen of `SerializedForecastEvent.kind` |
| Grace overdue fold onto today | Interest skips `<= today` | D-07 | No “catch-up” slot |

**Deprecated/outdated:**
- SUMMARY “Multi-month overlay uses **flat** today’s LOCF × rate/12 per slot (non-compounding).” Superseded by D-02 for implementation. Leave the research file unchanged; plans follow CONTEXT.
- ARCHITECTURE Anti-Pattern 4 “Each month’s interest = today’s LOCF × rate/12 (flat).” Same override. Anti-Pattern 5 (grace ΔNW=0 for interest) still applies.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Widening `ForecastSlotKind` makes `kind: e.kind` fail `tsc` against `SerializedForecastEvent["kind"]` until that union is widened. Types were read; `tsc` was not run this session. | Pitfall 6 | If a cast already exists (it does not in the lines read), the one-line union widen is unnecessary but harmless. If `tsc` fails elsewhere, fix only the assignability site — still no membership wire. |

**If this table is empty:** not empty — A1 only.

## Open Questions

1. **None that block planning.** Sort key (`plannedAsOf`, then `accountId`) is the discretion recommendation above. Horizon stays a caller-supplied `horizonEnd` string.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | bigint division, vitest | ✓ | v24.5.0 | — |
| npm | scripts | ✓ | 10.9.3 | — |
| vitest | INT-01 unit tests | ✓ | 4.1.11 | — |
| graphify | cross-doc graph | ✗ disabled | — | codegraph + file reads (used) |
| ctx7 / Context7 MCP | library docs | ✗ | — | WebSearch + ECMAScript spec text |

**Missing dependencies with no fallback:** none

**Missing dependencies with fallback:** graphify, ctx7

Step 2.6 external services: none. No DB migration in this phase.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 4.1.11 |
| Config file | `vitest.config.ts` (`environment: "node"`, `include: ["src/**/*.test.ts"]`) |
| Quick run command | `./node_modules/.bin/vitest run src/lib/savings-interest.test.ts src/lib/nw-forecast.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INT-01 | `1_000_000n` @ 1650 → `13750n`; @ 1200 → `10000n` then `10100n` on `1_010_000n` | unit | `./node_modules/.bin/vitest run src/lib/savings-interest.test.ts` | ❌ Wave 0 |
| INT-01 | `100n` @ 10000 bps → `8n`; chain next `9n`; `1n` @ 1 bps and bps `0` and balance `0n` emit no slot | unit | same | ❌ Wave 0 |
| INT-01 | DOM 31: 2026-02-10 → 2026-02-28 + 2026-03-31; 2026-02-28 today → only 2026-03-31; leap 2024-02-29 | unit | same | ❌ Wave 0 |
| INT-01 | Two accounts, same DOM, independent principals; sort `plannedAsOf` then `accountId` | unit | same | ❌ Wave 0 |
| INT-01 | `savings-interest.ts` source has no `Math.pow` | unit | same | ❌ Wave 0 |
| INT-01 | kind `"interest"` primary slot ΔNW = +amount; `plannedAsOf === today` excluded; same-day grace does not add; grace-only test still flat | unit | `./node_modules/.bin/vitest run src/lib/nw-forecast.test.ts` | ❌ cases (file exists) |

No manual-only checks. No browser UAT this phase (no UI).

### Sampling Rate

- **Per task commit:** `./node_modules/.bin/vitest run src/lib/savings-interest.test.ts src/lib/nw-forecast.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/lib/savings-interest.test.ts` — INT-01 formula, compound chain, clamp series, future-only, zero skip, no `Math.pow`
- [ ] `src/lib/nw-forecast.test.ts` — interest ΔNW, today excluded, grace regression kept
- [ ] Framework install: none

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Single-user local app; this phase adds no auth surface |
| V3 Session Management | no | No session |
| V4 Access Control | no | No new route or MCP tool |
| V5 Input Validation | yes | Callers pass `bigint` minor + integer bps. Helper returns `0n` for `annualRateBps <= 0` or `balanceMinor <= 0n`. Do not coerce through `Number` / `parseFloat`. DOM 1–31 is already CHECK-enforced; do not invent a second validator that disagrees with `clampDayOfMonth` |
| V6 Cryptography | no | No secrets. Do not hand-roll rounding beyond bigint `/` |

`security_asvs_level` is 1 (`security_enforcement` true).

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Float interest drifts forecast vs locked formula | Tampering | bigint multiply then `/ 120000n` only |
| Accrual `<= today` added into dashed forecast and double-counts a manual snapshot | Tampering | `plannedAsOf > today` in enumerator and `slotInWindow` |
| Interest folded into `buildNetWorthSeries` / snapshots | Tampering | No import of interest from historical NW; no snapshot writes in this phase |
| Negative LOCF emitted as a debit slot | Tampering | `> 0n` gate after toward-0 division |
| Bigint / number mix throws or coerces | Denial of service (test red) | `BigInt(annualRateBps)` once; divisor `12n * 10000n` |

## Sources

### Primary (HIGH confidence)

- `.planning/phases/28-interest-math-forecast-kind/28-CONTEXT.md` — D-01…D-13 (overrides flat default)
- `src/lib/nw-forecast.ts` — `ForecastSlotKind`, `slotInWindow`, ΔNW ternary (lines 18, 81–92, 149)
- `src/lib/savings-accrual-display.ts` — `nextAccrualAsOf` (lines 8–16)
- `src/lib/dates.ts` — `clampDayOfMonth` (lines 56–66)
- `src/lib/mcp/reads/load-forecast-overlay.ts` — income `from = today+1`, serialized kind union (lines 31–32, 91–92, 194, 261)
- `prisma/schema.prisma` + `prisma/migrations/20260911161446_savings_account/migration.sql` — bps + DOM CHECK
- Node v24.5.0 probe of the locked division (positives, zero, negative toward 0, compound pair)

### Secondary (MEDIUM confidence)

- ECMAScript `BigInt::divide` returns `ℤ(truncate(quotient))` — https://tc39.es/ecma262/multipage/ecmascript-data-types-and-values.html
- MDN BigInt division truncates toward zero — https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Division
- `.planning/research/SUMMARY.md`, `ARCHITECTURE.md`, `PITFALLS.md` — build order and isolation; **flat multi-month policy overridden by D-02**

### Tertiary (LOW confidence)

- none

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; bigint behavior probed on Node v24.5.0 and matched to the spec operation
- Architecture: HIGH — kinds, windows, and import boundaries read from current source; D-02 is a user lock
- Pitfalls: HIGH — sticky accrual, grace-window fallthrough, and serialize assignability follow from the lines quoted

**Research date:** 2026-09-21
**Valid until:** 2026-10-21 (stable in-repo math; re-check if `ForecastSlotKind` or `nextAccrualAsOf` changes)
