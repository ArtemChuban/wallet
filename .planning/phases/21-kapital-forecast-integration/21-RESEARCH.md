# Phase 21: Капитал forecast integration - Research

**Researched:** 2026-09-09
**Domain:** NW forecast overlay — A′ grace slots + FX LOCF honesty on Капитал `/`
**Confidence:** HIGH (codebase + locked CONTEXT); MEDIUM (tooltip DOM/CSS polish)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Carried locks (do not re-open)
- **C-01:** A′ NW-neutral: at due, obligation **visible**, forecast **NW delta = 0** (Phase 18 D-11). — **Reversibility:** costly — chart/tests and signed-slot design depend on it.
- **C-02:** Visibility via tooltip / point detail — **not** a second chart series (Phase 18 D-12).
- **C-03:** Same-day income + grace: **one** cumulative «Прогноз» series; tooltip distinguishes kinds (Phase 18 D-13).
- **C-04:** Tooltip RU: «Платёж для беспроцентного» + «NW без изменения (оплата карты)» (Phase 18 D-19).
- **C-05:** FX LOCF **as of today**; missing rate → exclude slot; never invent rates (Phase 17 D-13–D-16; GRFCST-02).
- **C-06:** Horizon mirrors dashboard lookback preset (`30d`/`90d`/`1y`; `all`→1y) (Phase 17 D-05).
- **C-07:** CLOSED / early-closed obligations **out** of forecast; OPEN only (roadmap SC; Phase 19/20 lifecycle).

#### Due-date membership
- **D-01:** Membership includes **all OPEN** obligations that land in the overlay window — including **overdue** (`dueAsOf < today`). — **Reversibility:** costly — differs from income forecast (which ignores overdue); tests and slot builders must branch on grace vs income.
- **D-02:** Overdue OPEN **fold onto today** (hinge / today sample), not onto the past `dueAsOf`.
- **D-03:** Fold applies to overdue of **any age** while status stays OPEN (no lookback cutoff).
- **D-04:** Future dues: include only `dueAsOf` in `(today, horizonEnd]`. Beyond horizon → exclude. `dueAsOf === today` lands on the today bucket with folded overdue.
- **D-05:** Primary-currency grace slots always convertible; non-primary use LOCF @ today; FX miss → exclude (same honesty as income).

#### Flat A′ visibility
- **D-06:** Always **sample the due date** on the dashed series even when ΔNW=0 (flat segment), so the tooltip can show the grace block. — **Reversibility:** costly — sparse sampler and chart point metadata must carry zero-delta events.
- **D-07:** If the horizon has **only** grace slots (no income) → still show a **flat** dashed «Прогноз» (today → horizon) so due tooltips work. Do not hide the series merely because NW is unchanged.
- **D-08:** **No** on-line visual distinction between grace days and income days — one dashed «Прогноз»; kind only in tooltip (honors C-02).
- **D-09:** Overdue folded to today appear in the **today tooltip** next to the account stack / NW, with grace copy (C-04) and ΔNW=0 — not hinge-only chrome and not grace-dialog-only.

#### Same-day tooltip
- **D-10:** Same calendar day with income + grace → **two blocks in one tooltip**: forecast/income contribution first; grace block with D-19 copy below. (Layout chosen under Claude discretion; see Discretion.)
- **D-11:** Grace block **shows obligation amount** (account currency and/or primary after successful FX) even though ΔNW=0.
- **D-12:** Multiple OPEN on one day → **one tooltip row per obligation** (account identity + amount), not a single aggregate line.
- **D-13:** FX-excluded grace slots are **omitted from the tooltip**; honesty is the shared partial banner only (mirror income).

#### Partial FX banner
- **D-14:** Keep **one** quiet banner near the NW chart (existing tone: «Прогноз неполный · нет курса …»).
- **D-15:** Banner must list **every missing currency code** that caused an exclusion (income and/or grace). Example: `Прогноз неполный · нет курса USD, EUR`.
- **D-16:** Do **not** tag slot kind / target («доходы» / «грейс») in the banner — currency codes only.
- **D-17:** Duplicate currency across income + grace → list the code **once**.
- **D-18:** If FX exclusions remove **all** includable slots and the series is hidden → **still show** the same incomplete banner with the full missing-code list (Phase 17 D-16 family).

### Claude's Discretion
- Exact two-block tooltip DOM/CSS within D-10 (ordering locked: income/forecast then grace).
- How A′ zero delta is represented in pure math (`nw-forecast` membership with 0 addend vs explicit offset leg) — simplest correct approach under C-01…C-03 / D-06.
- Whether today-bucket grace rows share payload shape with future forecast tooltip rows — pick one metadata model for chart points.
- Exact RU microcopy polish for multi-currency banner joining (comma/list) — match existing «Прогноз неполный» voice.
- Page load / `DashboardChartsShell` wiring for OPEN obligations — research/plan.

### Deferred Ideas (OUT OF SCOPE)
- Chart legend separating доходы vs обязательства on «Прогноз» — already tracked beyond v1.3 in `.planning/REQUIREMENTS.md` Deferred.
- GRACEISO regression / historical identity checks — Phase 22.

None else raised in discussion that expands Phase 21 scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GRFCST-01 | On Капитал `/`, «Прогноз» includes open credit grace obligations from their due dates | Extend slot membership + shell merge; A′ 0 NW addend; sample due dates; today-fold overdue; tooltip per-obligation rows |
| GRFCST-02 | Forecast credit slots use FX LOCF honesty (partial banner when rate missing) | Same `locfRateAsOf(..., today)` path as income; exclude on miss; banner lists unique missing codes across income+grace |
</phase_requirements>

## Summary

Phase 21 wires **OPEN** `CreditGraceObligation` rows into the existing dashed «Прогноз» overlay on `/`. Product lock is **A′ NW-neutral** (C-01): grace is **visible on the line** (sampled due / folded today) with **ΔNW = 0**, not a cash-out dip. That **overrides** milestone research’s default signed `−grace` sketch in `.planning/research/ARCHITECTURE.md` — do **not** plan negative NW deltas. Income and grace share **one** cumulative series; kinds appear only in tooltips (C-02/C-03). FX honesty mirrors Phase 17: LOCF @ today, exclude + partial banner, never invent rates (GRFCST-02 / C-05).

Current code already builds income-only forecast via `buildNetWorthForecastSeries` + `DashboardChartsShell` + dashed `Line`, but: (1) builder hard-filters `plannedAsOf > today` (blocks today-fold grace), (2) banner says «нет курса» **without codes** (fails D-15), (3) `page.tsx` loads **no** grace obligations, (4) tooltip has **no** grace/income event metadata. Planner must extend pure forecast math + chart payload, not invent a second series.

**Primary recommendation:** Extend `ForecastSlot` with `kind: "income" | "grace"`; grace contributes `0n` to the cumulative sum after FX gate; return unique `excludedMissingFxCurrencies`; load OPEN obligations on `/` and merge in `DashboardChartsShell`; attach per-point event metadata for tooltips.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| OPEN obligation fetch for overlay | Frontend Server (SSR) | Database | `page.tsx` Prisma load (mirror income); serialize to client props |
| Grace membership + today-fold | API / Backend (pure lib) | Browser | Pure date/status rules in `credit-grace` or shell helper — no clock in lib |
| FX convert + cumulative series | API / Backend (pure lib) | — | `nw-forecast.ts` owns LOCF @ today + stair-step; import wall |
| Merge income+grace → one series | Browser / Client | — | `DashboardChartsShell` already owns income slot assembly |
| Dashed «Прогноз» paint | Browser / Client | — | Existing `NetWorthHistoryChart` `Line` |
| Tooltip income/grace blocks | Browser / Client | — | Custom tooltip reads point metadata via Recharts payload |
| Partial FX banner + code list | Browser / Client | — | Shell banner near chart |
| Historical NW / hero total | API / Backend | Database | **Must stay grace-free** (Phase 22 GRISO); no writes from this phase |

## Project Constraints (from .cursor/rules/ / conventions)

- No `.cursor/rules/` dir present this session; `.planning/codebase/CONVENTIONS.md` applies:
  - Agent-driven UAT: `npm run dev` + Orca (`orca-ide` / `orca`); ask human only for subjective / races / hard blockers.
  - Never `window.confirm` — N/A for this overlay phase (no new destructive UI).
- AGENTS.md / Next: breaking Next APIs — prefer existing App Router patterns already in `page.tsx` / client shell; no new routing.
- User rule: project search via **codegraph** (used for blast radius / callers).

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Existing `src/lib/nw-forecast.ts` | in-repo | Cumulative sparse forecast | Phase 17 SoT; extend, don’t fork |
| Existing `src/lib/credit-grace.ts` | in-repo | OPEN status / overdue / list shapes | Phase 19–20; currency inherits Account |
| Existing `src/lib/locf.ts` + `money.ts` | in-repo | LOCF rate @ today + convert | Same honesty as income |
| recharts | 3.10.1 `[VERIFIED: package.json]` | ComposedChart + dashed Line + tooltip | Already wired; zero new chart lib |
| Vitest | 4.1.11 `[VERIFIED: package.json]` | Unit + file-scan tests | `vitest.config.ts` include `src/**/*.test.ts` |
| Next.js | 16.3.4 `[VERIFIED: package.json]` | `/` RSC data load | Existing `page.tsx` pattern |
| Prisma / SQLite | 7.10.0 `[VERIFIED: package.json]` | `CreditGraceObligation` | Schema already shipped Phase 19 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zod | 4.5.4 | — | **Not required** for overlay read path (no new write schema) |
| React | 19.2.8 | Client shell/chart | Existing |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| A′ 0-addend slots | Signed `−grace` NW dip | **Rejected** by Phase 18 D-11 / C-01 — stock/flow double-count |
| Second chart series for grace | One dashed «Прогноз» | **Rejected** by C-02 |
| Parallel `grace-forecast.ts` builder | Extend `nw-forecast` | Duplicates FX/horizon; worse INISO walls |

**Installation:** none — **zero new npm packages** (carried Phase 17/18 lock).

**Version verification:** `npm view recharts version` → `3.10.1` (matches lock). Vitest registry latest ≠ project pin; keep **4.1.11**.

## Package Legitimacy Audit

> Phase installs **no** new packages. Audit of already-pinned stack (sanity only):

| Package | Registry | Age / publish | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|---------------|-----------|-------------|---------|-------------|
| recharts | npm | published 2026-07-25 | ~48M/wk | github.com/recharts/recharts | OK | Already in tree — Approved |
| vitest | npm | pin 4.1.11 (registry latest flagged too-new) | high | github.com/vitest-dev/vitest | SUS (latest) | **Do not upgrade**; keep pin — no install |
| zod | npm | pin 4.5.4 | high | github.com/colinhacks/zod | SUS (latest) | No new install this phase |

**Packages removed due to [SLOP] verdict:** none  
**Packages flagged as suspicious [SUS]:** registry “too-new” on latest vitest/zod only — **irrelevant** (no install).  
**New packages to install:** none.

## Architecture Patterns

### System Architecture Diagram

```text
[Prisma CreditGraceObligation OPEN]
           │
           ▼
   page.tsx (RSC) ──loads──► forecastGrace[] + forecastIncome[] + rates + NW anchor
           │
           ▼
 DashboardChartsShell (client)
   │  income: listAllInRange → kind=income slots (plannedAsOf > today)
   │  grace:  OPEN → fold overdue/today → kind=grace slots (sampleAsOf)
   │                    │
   │                    ▼
   │         buildNetWorthForecastSeries
   │           • FX LOCF @ today per slot
   │           • income: += primaryMinor
   │           • grace:  FX gate then += 0n  (A′)
   │           • sample: today ∪ event dates ∪ horizonEnd
   │           • excludedMissingFxCurrencies unique
   │                    │
   │         mergeFactAndForecast → NetWorthChartPoint[+events]
   │                    │
   ├─► NetWorthHistoryChart (one dashed «Прогноз» Line)
   │         tooltip: fact stack | future forecast
   │                  + income block then grace rows (D-10)
   └─► partial banner «Прогноз неполный · нет курса CODE, …»

 net-worth.ts / historical-series.ts ──X── no grace imports (Phase 22)
```

### Recommended Project Structure

```
src/
├── app/page.tsx                          # + OPEN obligations (+ account currency/name)
├── lib/
│   ├── nw-forecast.ts                    # EXTEND: kind, 0-addend grace, FX code list, events
│   ├── nw-forecast.test.ts               # A′ / fold / banner codes / income regression
│   ├── credit-grace.ts                   # optional: mapOpenToForecastMembership helper
│   └── credit-grace.test.ts              # membership/fold unit tests if helper lives here
└── components/dashboard/
    ├── DashboardChartsShell.tsx          # merge grace props; banner codes; point metadata
    ├── NetWorthHistoryChart.tsx          # tooltip two-block + today grace rows
    └── nw-forecast-ui.test.ts            # file-scan: banner codes, tooltip RU strings
```

### Pattern 1: Kind-aware ForecastSlot (A′ 0 addend)

**What:** Keep one builder; income adds converted primary; grace passes FX gate then adds `0n`, still sampling the date.
**When to use:** Always for Phase 21 (C-01, D-06).
**Example:**

```typescript
// Recommended shape — planner/executor may name fields; values must match locks.
export type ForecastSlotKind = "income" | "grace";

export type ForecastSlot = {
  kind: ForecastSlotKind;
  parentId: number; // income def id OR obligation id
  plannedAsOf: string; // sample date AFTER fold (today or due)
  plannedAmountMinor: bigint; // display/FX amount (grace still set)
  currencyCode: string;
  currencyScale: number;
  isPrimaryCurrency: boolean;
  // grace-only metadata for tooltips (optional on income):
  accountId?: number;
  accountName?: string;
  dueAsOf?: string; // original due before fold (for copy / tests)
};

// Builder contribution:
// if kind === "income" → running += primaryMinor
// if kind === "grace"  → FX gate only; running += 0n; keep event on date
```

**Discretion pick (recommended):** **0 addend after FX gate**, not a paired ±debt/cash offset leg. Simplest correct under C-01; avoids inventing synthetic debt relief.

### Pattern 2: Membership at boundary (grace ≠ income)

**What:** Income stays Phase 17: open future only (`plannedAsOf > today`). Grace: OPEN; overdue/any age → fold to `today`; `dueAsOf === today` → today; future in `(today, horizonEnd]`.
**When to use:** Slot assembly in shell or `credit-grace` helper — **before** builder.
**Critical:** Today’s builder also filters `plannedAsOf > today` `[VERIFIED: src/lib/nw-forecast.ts:81-84]` — must become **kind-aware** or grace today-fold never enters the series.

```typescript
// Verbatim current filter (must change for grace):
// if (!(slot.plannedAsOf > today) || slot.plannedAsOf > horizonEnd) {
//   continue;
// }
```

### Pattern 3: Point metadata for tooltips (Recharts)

**What:** Put event arrays on the chart datum; custom tooltip reads `payload[0].payload`.
**When to use:** D-09…D-13.
**Evidence:** Existing chart already does `const point = payload[0]?.payload as NetWorthChartPoint` `[VERIFIED: src/components/dashboard/NetWorthHistoryChart.tsx:69-75]`. Recharts 3: extra fields on data objects pass through tooltip payload `[CITED: github.com/recharts/recharts issues/tooltip patterns]`.

**Discretion pick (recommended):** **One metadata model** for today + future: e.g. `forecastEvents: { kind, … }[]` on the point. Today tooltip: account stack **then** grace events. Future: «Прогноз» amount block **then** grace rows (D-10 order). Income detail rows optional if aggregate «Прогноз» amount already shown — but same-day income+grace must still show grace block below.

### Pattern 4: Banner currency list

**What:** Builder returns `excludedMissingFxCurrencies: string[]` (unique, stable sort). Shell renders `Прогноз неполный · нет курса ${codes.join(", ")}`.
**When to use:** Any exclusion from income or grace (D-14…D-18).
**Current gap:** banner hardcodes «нет курса» with **no codes** `[VERIFIED: src/components/dashboard/DashboardChartsShell.tsx:359-368]`.

### Anti-Patterns to Avoid

- **Signed −grace NW dip:** reopens stock/flow double-count (PITFALLS #1); locked A′.
- **Second Line/Area for grace:** violates C-02 / D-08.
- **Import grace into `net-worth` / `historical-series`:** Phase 22 GRISO; keep file-scan walls.
- **Invent FX / use rate 1:** violates C-05 / GRFCST-02.
- **Leave CLOSED in overlay:** violates C-07.
- **Sample past `dueAsOf` for overdue:** violates D-02 (fold to today).
- **Hide series when only grace (flat):** violates D-07.
- **Banner labels «доходы»/«грейс»:** violates D-16.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Calendar / overdue | Custom Date math | `isGraceOverdue`, YYYY-MM-DD compare | Already Moscow-calendar convention |
| FX convert | Ad-hoc multiply | `locfRateAsOf` + `convertOtherMinorToPrimaryMinor` | Scale + LOCF edge cases |
| Horizon mapping | Fixed 90d | `forecastHorizonEnd(preset, today)` | C-06 locked |
| Chart library | Custom canvas | Existing recharts ComposedChart | Already dashed Line |
| Obligation currency | New FK | `Account.currency*` join on load | Phase 19 D-08 |

**Key insight:** Hard problem is **membership + metadata**, not chart math. Reuse Phase 17 builder with kind branching.

## Common Pitfalls

### Pitfall 1: Income filter kills grace today-fold
**What goes wrong:** Overdue/today grace never appears; D-01/D-02 fail.
**Why:** Builder `plannedAsOf > today` + income shell `from = today+1`.
**How to avoid:** Kind-aware membership; income path unchanged; grace allows `sampleAsOf >= today`.
**Warning signs:** Tests only cover future dues; overdue OPEN invisible on `/`.

### Pitfall 2: Treating A′ as “skip sampling”
**What goes wrong:** Flat NW → no point on due day → no tooltip (D-06 fail).
**Why:** Optimizer removes zero-delta dates from `dateSet`.
**How to avoid:** Always `dateSet.add(sampleAsOf)` for included grace after FX gate.

### Pitfall 3: showForecast false for grace-only
**What goes wrong:** D-07 flat series hidden because “no NW change.”
**Why:** Equating “useful overlay” with nonzero cumulative delta.
**How to avoid:** `includedSlotCount` counts FX-included grace slots even with 0 addend; `showForecast = includedSlotCount > 0` stays.

### Pitfall 4: Banner without codes / kind tags
**What goes wrong:** D-15/D-16 fail UAT.
**Why:** Phase 17 chrome only printed «нет курса».
**How to avoid:** Unique currency list from builder; join with `", "`.

### Pitfall 5: Polluting historical LOCF
**What goes wrong:** Core value / GRISO broken early.
**Why:** Temptation to “fix” NW by writing snapshots on close.
**How to avoid:** Overlay-only; no BalanceSnapshot in this phase; keep INISO-style import bans (extend scan to ban `credit-grace` in net-worth/historical — Phase 22 owns full GRACEISO, but Phase 21 must not introduce imports).

### Pitfall 6: Unsigned slot collision (stale research)
**What goes wrong:** Shoving grace through income-only adder with a silent minus.
**Why:** Old ARCHITECTURE signed-delta sketch.
**How to avoid:** Explicit `kind` + 0 addend; update tests that assume all slots add amount.

## Code Examples

### Existing builder FX gate (extend, don’t replace)

```typescript
// Source: src/lib/nw-forecast.ts:81-103 [VERIFIED]
for (const slot of slots) {
  if (!(slot.plannedAsOf > today) || slot.plannedAsOf > horizonEnd) {
    continue;
  }
  let primaryMinor: bigint;
  if (slot.isPrimaryCurrency) {
    primaryMinor = slot.plannedAmountMinor;
  } else {
    const rate = locfRateAsOf(rates, slot.currencyCode, today);
    if (rate === null) {
      excludedMissingFxCount += 1;
      continue;
    }
    primaryMinor = convertOtherMinorToPrimaryMinor(
      slot.plannedAmountMinor,
      rate,
      slot.currencyScale,
      primaryScale,
    );
  }
  converted.push({ plannedAsOf: slot.plannedAsOf, primaryMinor });
}
```

**Grace change sketch:** collect `excludedMissingFxCurrencies`; for `kind==="grace"` push `{ plannedAsOf, primaryMinor: 0n, events: [...] }` after successful FX (or primary); income keeps `primaryMinor` as today.

### Status enum (OPEN only)

```prisma
# Source: prisma/schema.prisma:43-46 [VERIFIED]
enum GraceObligationStatus {
  OPEN
  CLOSED
}
```

### Obligation fields for membership

```prisma
# Source: prisma/schema.prisma:116-123 [VERIFIED]
model CreditGraceObligation {
  id             Int                   @id @default(autoincrement())
  accountId      Int
  cycleStartAsOf String
  dueAsOf        String // frozen at create (D-05)
  amountMinor    BigInt
  status         GraceObligationStatus @default(OPEN)
```

### page.tsx gap — no grace today

`Home` Promise.all loads accounts, snapshots, rates, income — **not** `creditGraceObligation` `[VERIFIED: src/app/page.tsx:19-84]`. Accounts page pattern to mirror:

```typescript
# Pattern from src/app/accounts/page.tsx:14-19 [VERIFIED]
prisma.account.findMany({
  include: {
    currency: true,
    creditGraceObligations: {
      orderBy: { cycleStartAsOf: "desc" },
    },
  },
})
```

For `/`, prefer lean query: OPEN only + account currency/name fields needed for slots (discretion: nested include on accounts vs separate `findMany` where status OPEN).

### Tooltip RU (locked copy)

- Label: «Платёж для беспроцентного»
- Sub: «NW без изменения (оплата карты)»
- Amount: native and/or primary major via existing `formatMinorToMajor` / `formatChartNumber`

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Research signed −grace NW dip | A′ ΔNW=0 + tooltip | Phase 18 D-11 | Slot math + tests must not expect NW drop |
| Income-only `ForecastSlot` | kind-aware slots | Phase 21 | Builder + shell + tooltip |
| Banner «нет курса» bare | List unique FX codes | Phase 21 D-15 | Builder returns code set |
| Ignore overdue income | Fold overdue grace to today | Phase 21 D-01–D-03 | Branch membership |

**Deprecated/outdated:**
- `.planning/research/ARCHITECTURE.md` “−grace / signed delta as NW truth” — **override** with A′.
- Dual-DOM research `graceDurationDays` SoT — already overridden Phase 19; irrelevant to overlay math beyond frozen `dueAsOf`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Stable sort for missing FX codes = alphabetical by code | Banner | Microcopy order only — low |
| A2 | Showing primary-converted amount when FX ok is enough for D-11 (native optional) | Tooltip | May want both codes — confirm in UAT if picky |
| A3 | Extending `NetWorthChartPoint` index signature for event arrays is acceptable | Chart types | Type cleanup if Recharts complains |

**If empty of HIGH-risk assumptions:** A′ representation and metadata model are **discretion picks above**, not unverified product facts.

## Open Questions

1. **Lean vs nested Prisma load on `/`**
   - What we know: accounts page already nests obligations.
   - What's unclear: payload size if many CLOSED rows.
   - Recommendation: filter `status: "OPEN"` in query; CLOSED never needed for overlay (C-07).

2. **Income rows in future tooltip**
   - What we know: today future tooltip is aggregate «Прогноз» only.
   - What's unclear: whether D-10 “forecast/income contribution first” means keep aggregate line or expand per-income.
   - Recommendation: keep aggregate «Прогноз» amount as first block; grace block below — satisfies D-10 without redesigning income detail.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | tests / Next | ✓ | v24.5.0 | — |
| npm | scripts | ✓ | 10.9.3 | — |
| Vitest | Nyquist unit | ✓ | 4.1.11 (pin) | — |
| SQLite / Prisma | OPEN load | ✓ | in project | — |
| orca / orca-ide | UAT | ✓ | on PATH | — |
| `npm run dev` | UAT | ✓ | Next 16.3.4 | — |

**Missing dependencies with no fallback:** none  
**Missing dependencies with fallback:** none  
Step 2.6: external tools available for this code/config phase.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.11 |
| Config file | `vitest.config.ts` (`include: src/**/*.test.ts`) |
| Quick run command | `npx vitest run src/lib/nw-forecast.test.ts src/lib/credit-grace.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GRFCST-01 | OPEN future due sampled; ΔNW unchanged vs income-only baseline | unit | `npx vitest run src/lib/nw-forecast.test.ts -t "grace"` | ❌ Wave 0 |
| GRFCST-01 | Overdue OPEN folds to today sample | unit | `npx vitest run src/lib/nw-forecast.test.ts` or credit-grace membership | ❌ Wave 0 |
| GRFCST-01 | CLOSED / early-closed excluded | unit | membership helper tests | ❌ Wave 0 |
| GRFCST-01 | Grace-only → non-empty flat points (D-07) | unit | `nw-forecast.test.ts` | ❌ Wave 0 |
| GRFCST-01 | Same-day income+grace: cumulative uses income only; both events in metadata | unit | `nw-forecast.test.ts` | ❌ Wave 0 |
| GRFCST-02 | Missing FX excludes grace; codes listed unique with income | unit | `nw-forecast.test.ts` | ❌ Wave 0 |
| GRFCST-02 | Banner string includes codes; no kind tags | file-scan | `npx vitest run src/components/dashboard/nw-forecast-ui.test.ts` | ⚠️ exists — extend |
| GRFCST-01 | Tooltip RU strings present | file-scan | same ui test | ❌ Wave 0 lines |
| Isolation | `net-worth` / `historical-series` still ban credit-grace | file-scan | extend `credit-grace.test.ts` / light scan (full GRACEISO = Phase 22) | ✅ partial (`credit-grace.test.ts` already scans) |
| Income regression | Existing Phase 17 forecast tests still green | unit | `npx vitest run src/lib/nw-forecast.test.ts` | ✅ |

### Sampling Rate

- **Per task commit:** `npx vitest run src/lib/nw-forecast.test.ts src/components/dashboard/nw-forecast-ui.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] Extend `src/lib/nw-forecast.test.ts` — A′ 0-delta, today-fold, grace-only flat, FX codes, CLOSED out, income regression
- [ ] Membership helper tests if extracted to `credit-grace.ts`
- [ ] Extend `src/components/dashboard/nw-forecast-ui.test.ts` — banner codes pattern; tooltip copy «Платёж для беспроцентного» / «NW без изменения»
- [ ] Optional shell unit for merge metadata if logic non-trivial

*(Framework already installed — no Vitest install task.)*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Single-user local app |
| V3 Session Management | no | — |
| V4 Access Control | no | Local SQLite; no multi-tenant |
| V5 Input Validation | partial | Read-only overlay; no new write endpoints — existing Zod on CRUD stays |
| V6 Cryptography | no | FX LOCF not crypto; never invent rates (integrity of display) |

### Known Threat Patterns for forecast overlay

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Invented FX rates → false NW | Tampering / Info disclosure | Exclude slot + banner; LOCF only |
| Grace leaking into historical LOCF | Tampering | Import wall; no BalanceSnapshot writes |
| XSS via account name in tooltip | Tampering | React text nodes (existing); no `dangerouslySetInnerHTML` |
| Over-fetch CLOSED obligations | Information | Prefer `status: OPEN` query filter |

## Sources

### Primary (HIGH confidence)

- `21-CONTEXT.md` — locked D-01…D-18 / C-01…C-07
- `18-CONTEXT.md` — A′ D-11…D-13, D-19 copy
- `17-CONTEXT.md` — income membership, FX LOCF, horizon, INISO walls
- `src/lib/nw-forecast.ts` — builder filter, cumulative, partial counts
- `src/components/dashboard/DashboardChartsShell.tsx` — income merge, banner
- `src/components/dashboard/NetWorthHistoryChart.tsx` — tooltip hinge split
- `src/app/page.tsx` — data load gap
- `prisma/schema.prisma` — OPEN\|CLOSED, frozen `dueAsOf`
- `src/lib/credit-grace.ts` — `isGraceOverdue`, OPEN list shapes
- codegraph explore/callers — blast radius: shell, page, nw-forecast.test

### Secondary (MEDIUM confidence)

- `.planning/research/ARCHITECTURE.md` / `PITFALLS.md` — stock/flow, unsigned slots (**override dip**)
- Recharts tooltip payload patterns (web / GitHub) — extra fields on datum

### Tertiary (LOW confidence)

- Alphabetical FX code join microcopy (A1)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new packages; pins verified in `package.json` + `npm view recharts`
- Architecture: HIGH — code anchors Read this session; A′ locks explicit
- Pitfalls: HIGH — grounded in current builder filter + banner gap + research PITFALLS

**Research date:** 2026-09-09  
**Valid until:** ~2026-10-09 (stable overlay domain; revisit if ForecastSlot public API changes)
