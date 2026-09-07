# Phase 16: Counterparty income stats - Research

**Researched:** 2026-09-07
**Domain:** Per-Person income actual aggregates + FX LOCF hybrid display (native + primary)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
### What enters Σ
- **D-01:** Σ includes **actuals only** — not unfilled plan slots. — **Reversibility:** costly — callers and copy assume «получено», not «ожидаемо».
- **D-02:** Recurring and one-time actuals share **one** per-Person Σ (not split by kind).
- **D-03:** Stats numbers only for Person with **≥1 actual**. Empty / plan-only Person groups keep Phase 14 header (name + CTA) with **no** stats digits.
- **D-04:** **No** global page hero («всего получено»). Totals are **per-Person only**.

### FX / hybrid display (CPTY-01 revision)
- **D-05:** **Hybrid honesty:** always show Σ in **native** currency(ies); also show primary converted with LOCF on each fact's **`actualAsOf`** («курс на день получения»). This revises REQUIREMENTS CPTY-01 wording from primary-only Σ to native-first + primary secondary. — **Reversibility:** costly — UI shape and domain aggregate API keyed to dual display.
- **D-06:** Both rows **always visible**: native larger, primary smaller underneath (no mode toggle).
- **D-07:** Multiple currencies for one Person: **one native line per currency** + **one** rolled primary-Σ of convertible facts.
- **D-08:** Missing FX on `actualAsOf`: **exclude** that fact from primary + local «итог неполный» / «нет курса» on **that** Person group (mirror debts `isPartial`); native unchanged. Never invent rates or silent zeros.
- **D-09:** USDT→fiat **withdrawal date** is **out of scope** — not modeled; `actualAsOf` remains receipt date for FX. Capture as Future if needed.

### UI placement
- **D-10:** Stats live in each **Person group header** on `/income` (not a separate «Статистика» catalog). — **Reversibility:** costly — list header component owns dual totals.
- **D-11:** Partial chrome is **per-group** only (no page-level banner; no global hero).
- **D-12:** Layout: amounts **right-aligned** in header — native prominent, primary secondary beneath.

### Time window
- **D-13:** Window = **all-time** (every actual for that Person). No month/YTD/from–to picker in Phase 16. — **Reversibility:** reversible — filter can layer later without schema change if membership stays `actualAsOf`.
- **D-14:** Membership / future filters key off **`actualAsOf`** (not `plannedAsOf`), consistent with FX as-of.
- **D-15:** Quiet label near totals: **«всего»** / **«за всё время»** so all-time is not mistaken for «this month».

### Carried locks (do not re-open)
- Person-grouped `/income` list (14); actuals CRUD + overdue (15); side ledger / no BalanceSnapshot (ISO → 17).
- Reuse `Person`; income stats **never** mix debt I-owe/they-owe.
- FX primitives: `locfRateAsOf` / `convertOtherMinorToPrimaryMinor` / debts-style exclude + `isPartial`.
- Russian UI; DestructiveConfirmStep unchanged this phase.

### Claude's Discretion
- Exact RU microcopy for «всего» vs «за всё время» and partial line (match DebtsPrimaryTotalsHero tone).
- Pure helper shape in `src/lib/income.ts` (or sibling) mirroring `computeDebtPrimaryTotals` but dual native+primary output.
- Whether primary line omits entirely when Person is single-currency **and** that currency is primary (identity — avoid redundant «same number twice»); prefer showing primary only when conversion happened or multi-ccy rollup needs it — pick clearest UX in research/UI-SPEC.

### Deferred Ideas (OUT OF SCOPE)
- Period filter (month / YTD / from–to) — Future Requirements
- Withdrawal / cash-out date or destination-account FX as-of — Future Requirements
- Global «всего получено» hero — explicitly rejected for Phase 16
- NW forecast overlay + isolation — Phase 17
- Formal REQUIREMENTS.md CPTY-01 text update to hybrid (decision locked here as D-05; planner should sync wording)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CPTY-01 | Per-Person income stats (Σ with FX LOCF honesty / partial); CONTEXT D-05 revises to hybrid native+primary | `computePersonIncomeStats` (new) mirrors `computeDebtPrimaryTotals` exclude/`isPartial`; page loads all actuals + rates; `IncomeList` PersonGroup header dual display; vitest + file-scan |
</phase_requirements>

## Summary

Phase 16 is a **pure aggregate + UI chrome** slice on top of Phase 15 actuals. No schema migration, no new npm packages, no BalanceSnapshot writes. Domain work: flatten **all** `RecurringIncomeActual` / `OneTimeIncomeActual` rows per Person (not just the Phase 15 next-open list slot), sum native minors by currency, convert each fact to primary via `locfRateAsOf(..., actualAsOf)` + `convertOtherMinorToPrimaryMinor`, exclude missing FX with per-Person `isPartial`.

Critical seam vs debts: debts page uses `firstHitLocfMap` for **today**; income stats need **per-fact historical as-of** — same call shape as `buildNetWorthSeries` (`locfRateAsOf` inside the loop). Critical seam vs Phase 15 list: UI still shows one row per definition / next-open only, but stats Σ must include **filled history months** already present in Prisma `actuals[]`.

**Primary recommendation:** Extend `src/lib/income.ts` with `computePersonIncomeStats` (dual native+primary, `isPartial`/`no_fx`); wire `src/app/income/page.tsx` to flatten all actuals + batch FX rates; render right-aligned hybrid totals in `PersonGroup` header; sync REQUIREMENTS CPTY-01 to hybrid wording; vitest mirror `debts.test.ts` totals suite + income-ui file-scan.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Flatten all actuals per Person | API / Backend (RSC page) | Database / Storage | Prisma include already loads `actuals`; page maps raw → fact inputs |
| Native Σ by currency | API / Backend (pure lib) | — | Deterministic BigInt math in `income.ts` |
| Primary Σ via LOCF @ `actualAsOf` | API / Backend (pure lib) | Database (FxRate read) | Page loads rates; pure helper consumes pre-resolved or rate rows |
| Partial honesty / exclude | API / Backend (pure lib) | Browser (per-group chrome) | Same semantics as debts; UI only displays flags |
| Person group header hybrid UI | Browser / Client | Frontend Server (props) | `IncomeList` client; stats as serializable props from RSC |
| REQUIREMENTS CPTY-01 wording sync | Planning docs | — | Planner edits REQUIREMENTS.md (D-05) |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Existing `src/lib/income.ts` | in-repo | Counterparty aggregate helpers | ARCHITECTURE + CONTEXT lock; ISO-01 isolation stays |
| Existing `src/lib/locf.ts` `locfRateAsOf` | in-repo | Per-`actualAsOf` FX | Multi-asOf LOCF already used by historical-series |
| Existing `src/lib/money.ts` `convertOtherMinorToPrimaryMinor` / `formatMinorToMajor` | in-repo | Convert + display | Same path as debts totals |
| Existing `src/lib/debts.ts` pattern | in-repo | Exclude + `isPartial` semantic template | CONTEXT carried lock — mirror, do not import debt direction |
| Vitest | 4.1.11 `[VERIFIED: package.json]` | Unit + file-scan | Phase 15 verify pattern |
| Next.js App Router RSC | 16.3.4 `[VERIFIED: package.json]` | Page data load | Existing `/income` page |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Prisma `FxRate` | in-repo schema | Rate rows for LOCF | `findMany` filtered `asOfDate <= maxActualAsOf` (or all ≤ today ∪ max future actual) |
| `DebtsPrimaryTotalsHero` copy | in-repo | Tone for «Итог неполный» | Adapt per-group — do not mount page hero |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `locfRateAsOf` per fact | Debts `firstHitLocfMap(today)` | **Wrong** for D-05 receipt-date FX — rejected |
| New npm money/FX lib | Hand-roll convert | Forbidden — money helpers already ship; zero new packages |
| Separate stats page | Header inline (D-10) | Locked out of scope |

**Installation:**

```bash
# none — zero new packages (STATE / CONTEXT carried lock)
```

**Version verification:** `vitest@4.1.11`, `next@16.3.4` via `package.json` / `node -e require` this session. No new registry packages.

## Package Legitimacy Audit

> Phase installs **no** external packages.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| — | — | — | — | — | N/A | No installs |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Project Constraints (from .cursor/rules/)

`.cursor/rules/` and `.claude/.cursor/rules/` **absent** this session. Actionable constraints from `AGENTS.md` / conventions:

- Next.js agent docs: read `node_modules/next/dist/docs/` before novel Next APIs `[CITED: AGENTS.md]`
- Operator UAT: agent drives `npm run dev` + Orca; ask human only for subjective/hard blockers `[VERIFIED: .planning/codebase/CONVENTIONS.md:5-12]`
- Never `window.confirm` — DestructiveConfirmStep `[VERIFIED: .planning/codebase/CONVENTIONS.md:16-17]`
- Project search: prefer **codegraph** (user rule)

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────┐     Prisma include      ┌──────────────────────────────┐
│ /income RSC │◄────────────────────────│ Person                       │
│ page.tsx    │                         │  ├─ recurringIncomes.actuals │
│             │                         │  └─ oneTimeIncomes.actuals   │
│             │     FxRate findMany     │ Currency.isPrimary + scale   │
│             │◄────────────────────────│ FxRate(asOfDate, rate…)      │
└──────┬──────┘                         └──────────────────────────────┘
       │ flatten ALL actuals (not next-open only)
       │ build fact inputs + rate rows
       ▼
┌────────────────────────────┐
│ computePersonIncomeStats   │  pure income.ts
│  · native Σ by currency    │
│  · per fact locfRateAsOf   │──► convertOtherMinorToPrimaryMinor
│  · exclude no_fx           │
│  · isPartial per person    │
└────────────┬───────────────┘
             │ serializable PersonIncomeStats props
             ▼
┌────────────────────────────┐
│ IncomeList → PersonGroup   │  client
│  header: name | stats| CTA │
│  native lines + primary    │
│  «за всё время» + partial  │
└────────────────────────────┘
```

### Recommended Project Structure

```
src/lib/income.ts                 # + computePersonIncomeStats (+ types)
src/lib/income.test.ts            # + totals / partial / multi-ccy cases
src/app/income/page.tsx           # flatten all actuals; load FxRate; attach stats
src/components/income/IncomeList.tsx  # PersonGroup header stats UI
src/components/income/income-ui.test.ts  # file-scan: всего/неполный/no Debts hero
.planning/REQUIREMENTS.md         # sync CPTY-01 hybrid wording
```

### Pattern 1: Pure dual aggregate (mirror debts, dual output)

**What:** Fact list in → per-person `{ nativeByCurrency[], primaryTotalMinor, isPartial, excludedFacts[] }`.
**When to use:** Always for CPTY-01; keep free of Prisma / net-worth imports (ISO-01 light).
**Example:**

```typescript
// Source: mirror src/lib/debts.ts:132-221 [VERIFIED] + CONTEXT D-05/D-07/D-08
export type IncomeActualFactInput = {
  personId: number;
  currencyCode: string;
  currencyScale: number;
  isPrimaryCurrency: boolean;
  amountMinor: bigint;
  actualAsOf: string; // YYYY-MM-DD — FX as-of + membership
};

export type PersonIncomeStats = {
  personId: number;
  nativeByCurrency: {
    currencyCode: string;
    scale: number;
    totalMinor: bigint;
  }[];
  primaryTotalMinor: bigint;
  isPartial: boolean;
  /** Facts excluded from primary only; native still counted. */
  excludedFactCount: number;
};

// For each fact:
//   native bucket[currencyCode] += amountMinor (always)
//   if isPrimaryCurrency → primary += amountMinor
//   else rate = locfRateAsOf(rates, code, actualAsOf)
//        if rate == null → excludedFactCount++; isPartial = true
//        else primary += convertOtherMinorToPrimaryMinor(...)
```

### Pattern 2: RSC load all actuals + multi-asOf rates

**What:** Keep list chrome mapping (next-open only). Separately flatten `r.actuals` / `o.actuals` for stats.
**When to use:** Phase 16 page wiring.
**Example:**

```typescript
// Source: src/app/income/page.tsx:28-51 already includes all actuals [VERIFIED]
// Pitfall: lines 79-99 only bind next-open slotActual for IncomeRow — stats must
// iterate r.actuals / o.actuals in full.

const rates = await prisma.fxRate.findMany({
  where: { asOfDate: { lte: maxActualAsOf } }, // max over all facts; see Open Questions if empty
  orderBy: { asOfDate: "desc" },
  select: {
    currencyCode: true,
    asOfDate: true,
    rateToPrimaryScaled: true,
  },
});
// Prefer passing rates into pure helper that calls locfRateAsOf per fact
// — do NOT firstHitLocfMap(today) (debts page pattern is wrong here).
```

### Pattern 3: Header hybrid UI (no page hero)

**What:** Right-aligned block in `PersonGroup` header when `stats` present (≥1 actual).
**When to use:** D-03/D-10/D-12.
**Recommend (discretion):** Omit primary secondary line when `nativeByCurrency.length === 1` AND that code is primary AND `!isPartial`. Always show primary when multi-ccy or any conversion or partial.

### Anti-Patterns to Avoid

- **Using next-open `IncomeRow.actual*` as the only facts:** undercounts all-time Σ for recurring with filled history `[VERIFIED: Phase 15 CONTEXT D-05 + page.tsx slot mapping]`.
- **`firstHitLocfMap` @ today for income:** violates D-05 receipt-date LOCF.
- **Silent 0 primary when FX missing:** violates D-08 / FX-02; must exclude + `isPartial`.
- **Importing `computeDebtPrimaryTotals` or debt direction into income stats:** pollutes domain; copy pattern only.
- **Global hero / page-level partial banner:** rejected D-04/D-11.
- **Writing BalanceSnapshot / importing net-worth into `income.ts`:** ISO regression.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| LOCF rate pick | Custom “closest rate” loops | `locfRateAsOf` | Null-before-first semantics already tested |
| Minor→primary convert | Float multiply | `convertOtherMinorToPrimaryMinor` | Truncation / RATE_SCALE_E8 contract |
| Partial UX semantics | Ad-hoc zeros | Debts-style exclude + `isPartial` | User-trusted honesty language |
| Display format | toFixed on Number(bigint) | `formatMinorToMajor` | Scale-safe strings for RSC→client |

**Key insight:** Phase 16 complexity is **data membership** (all actuals + per-asOf FX), not new math libraries.

## Common Pitfalls

### Pitfall 1: Stats from next-open slot only
**What goes wrong:** Recurring with 12 filled months shows only current next-open (often no actual) → empty or tiny Σ.
**Why it happens:** Phase 15 list intentionally hides history rows.
**How to avoid:** Stats path iterates Prisma `actuals[]` fully; vitest with ≥2 actuals on one recurring parent.
**Warning signs:** UI «за всё время» but number matches single month.

### Pitfall 2: Today LOCF instead of `actualAsOf`
**What goes wrong:** Past USDT receipts revalued at today’s rate; honesty claim false.
**Why it happens:** Copy-paste from `src/app/debts/page.tsx` `firstHitLocfMap`.
**How to avoid:** Call `locfRateAsOf(rates, code, fact.actualAsOf)` like historical-series.
**Warning signs:** Changing today’s FX changes historical Person Σ.

### Pitfall 3: Invented / silent primary zeros
**What goes wrong:** Missing rate → `0` primary looks like “no income”.
**Why it happens:** Defaulting null rate to 0n.
**How to avoid:** Mirror debts `excludeReason: "no_fx"`; native still shown; «Итог неполный».
**Warning signs:** Primary 0 with non-empty native non-primary lines and no partial chrome.

### Pitfall 4: Mixing debt into income Σ
**What goes wrong:** I_OWE / THEY_OWE bleed into «Доходы».
**Why it happens:** Shared Person model temptation.
**How to avoid:** Facts only from income actual tables; never join Debt.
**Warning signs:** Income helper imports `@/lib/debts` aggregates.

### Pitfall 5: Stale ARCHITECTURE “as-of today” sketch
**What goes wrong:** Planner follows `.planning/research/ARCHITECTURE.md` counterparty flow (“FX as-of today”).
**Why it happens:** Pre-discuss research outdated vs CONTEXT D-05.
**How to avoid:** CONTEXT D-05 supersedes; cite CONTEXT in plan.
**Warning signs:** Plan text says “LOCF as of Moscow today” for stats.

### Pitfall 6: Showing stats on plan-only Person
**What goes wrong:** Zeros or “0 RUB” on empty actuals confuse «получено».
**How to avoid:** D-03 — omit digits entirely when actual count = 0.

## Code Examples

### Debts exclude + isPartial (template)

```typescript
// Source: src/lib/debts.ts:156-221 [VERIFIED this session]
function toPrimaryMinor(
  debt: DebtPrimaryTotalsInput,
  nativeMinor: bigint,
): bigint | null {
  if (debt.isPrimaryCurrency) {
    return nativeMinor;
  }
  if (debt.rateToPrimaryScaled === null) {
    return null;
  }
  return convertOtherMinorToPrimaryMinor(
    nativeMinor,
    debt.rateToPrimaryScaled,
    debt.currencyScale,
    debt.primaryScale,
  );
}
// Missing FX → includedInTotal: false, excludeReason: "no_fx", isPartial: true
```

### Per-asOf LOCF (correct for income)

```typescript
// Source: src/lib/locf.ts:71-84 [VERIFIED]
export function locfRateAsOf(
  rates: readonly RateRow[],
  currencyCode: string,
  asOfDate: string,
): bigint | null {
  const best = pickLatestAsOf(
    rates,
    (r) => r.currencyCode === currencyCode,
    (r) => r.asOfDate,
    asOfDate,
  );
  return best?.rateToPrimaryScaled ?? null;
}
```

### Partial copy tone (adapt per-group)

```tsx
// Source: src/components/debts/DebtsPrimaryTotalsHero.tsx:39-48 [VERIFIED]
// «Итог неполный» + «нет курса» — reuse wording compressed for Person header,
// not the full page hero layout.
```

### Schema actual fields

```prisma
// Source: prisma/schema.prisma:141-151, 169-179 [VERIFIED]
model RecurringIncomeActual {
  actualAsOf        String // YYYY-MM-DD
  amountMinor       BigInt
  @@unique([recurringIncomeId, plannedAsOf])
}
model OneTimeIncomeActual {
  actualAsOf      String
  amountMinor     BigInt
  @@unique([oneTimeIncomeId, plannedAsOf])
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| RESEARCH ARCHITECTURE: stats FX as-of today | CONTEXT D-05: LOCF @ each `actualAsOf` | 2026-09-07 discuss | Page must multi-asOf rates |
| REQUIREMENTS CPTY-01 primary-only wording | Hybrid native + primary | D-05 lock | Planner syncs REQUIREMENTS |
| Phase 15 variance source-currency only | Phase 16 primary rollup for stats | Phase boundary | Variance chrome unchanged |

**Deprecated/outdated:**
- “Counterparty stats = as-of today primary Σ only” in ARCHITECTURE.md key data flow #2 — superseded by CONTEXT.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Prefer omit primary line on single-currency primary identity (`!isPartial`) | Discretion / Pattern 3 | UI-SPEC may override to always show both (D-06 literal) — confirm in ui-phase |
| A2 | Empty actual set → skip FxRate query or query with sentinel; maxActualAsOf when zero facts | Pattern 2 | Minor perf only |
| A3 | Future `actualAsOf` (Phase 15 D-19) uses LOCF ≤ that date (may equal last rate ≤ today if no future rates) | Pitfalls | Acceptable honesty; not withdrawal modeling |

**If this table is empty:** N/A — three discretion/edge assumptions remain.

## Open Questions

1. **D-06 vs identity omit**
   - What we know: D-06 says both rows always visible; Discretion allows omit when identity.
   - What's unclear: Strict reading conflicts.
   - Recommendation: UI-SPEC locks omit-on-identity; treat Discretion as amendment to D-06 for primary=native single-ccy case. Planner note in plan.

2. **Max rate query bound when some `actualAsOf` > today**
   - What we know: Phase 15 accepts future actualAsOf.
   - What's unclear: Whether rates table ever has future asOfDate.
   - Recommendation: `lte: max(actualAsOf)` across facts (not only today); LOCF still returns last ≤ fact date.

3. **Excluded fact list detail in UI**
   - What we know: Debts hero lists excluded debts; income is per-group compact.
   - Recommendation: Compact «Итог неполный · нет курса» without per-fact list unless UI-SPEC asks; count optional.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node | Vitest / Next | ✓ | v24.5.0 | — |
| npm | scripts | ✓ | 10.9.3 | — |
| Vitest | unit tests | ✓ | 4.1.11 | — |
| SQLite / Prisma | page load | ✓ (project default) | in-repo | — |
| codegraph CLI | research/search | ✓ | installed | ripgrep |
| ctx7 CLI | Next docs | ✗ | — | In-repo Next patterns; no novel Next APIs needed |
| External MCP Context7 | docs | ✗ | — | Skip — phase is in-repo |

**Missing dependencies with no fallback:** none for Phase 16 execution.

**Missing dependencies with fallback:** ctx7 — not required (no new framework APIs).

Step 2.6: external tools audited above; phase is code/config-only + existing DB.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.11 |
| Config file | project vitest config (existing) |
| Quick run command | `npx vitest run -t "computePersonIncomeStats" src/lib/income.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CPTY-01 | Native Σ by currency from all actuals | unit | `npx vitest run -t "computePersonIncomeStats" src/lib/income.test.ts` | ❌ Wave 0 |
| CPTY-01 | Primary convert with rate @ actualAsOf | unit | same | ❌ Wave 0 |
| CPTY-01 | Missing FX → exclude + isPartial; native intact | unit | same | ❌ Wave 0 |
| CPTY-01 | Plan-only Person → no stats / empty result | unit | same | ❌ Wave 0 |
| CPTY-01 | Recurring+one-time merged one Σ | unit | same | ❌ Wave 0 |
| CPTY-01 | Header copy / no global hero / no invent | file-scan | `npx vitest run -t "counterparty stats" src/components/income/income-ui.test.ts` | ❌ Wave 0 |
| ISO light | income.ts still no net-worth/prisma | unit | existing `income isolation` describe | ✅ |

### Sampling Rate

- **Per task commit:** targeted vitest `-t` for touched helper/UI scan
- **Per wave merge:** `npx vitest run src/lib/income.test.ts src/components/income/income-ui.test.ts`
- **Phase gate:** Full suite green before `/gsd-verify-work` (Phase 15 style spot-checks OK if documented)

### Wave 0 Gaps

- [ ] Extend `src/lib/income.test.ts` — `computePersonIncomeStats` cases (native multi-ccy, primary convert, no_fx partial, empty actuals, merged kinds)
- [ ] Extend `src/components/income/income-ui.test.ts` — file-scan for «за всё время»/«всего», «Итог неполный» or «нет курса», absence of page-level DebtsPrimaryTotalsHero on income page, no `window.confirm`
- [ ] Optional: page wiring smoke via file-scan that `page.tsx` calls stats helper / loads `fxRate`

*(Framework already present — no install.)*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Existing app; no new auth |
| V3 Session Management | no | — |
| V4 Access Control | no | Single-user local wallet assumption |
| V5 Input Validation | no* | Read-only aggregates; no new mutations (*existing actual Zod stays) |
| V6 Cryptography | no | FX rates not crypto secrets; use money helpers only |

### Known Threat Patterns for income stats display

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Invented FX / silent zero | Tampering / Info disclosure | null LOCF → exclude + isPartial; never coerce 0 rate |
| Cross-domain data bleed (debts into income) | Elevation / Info | Facts from income actuals only |
| Client-trusted BigInt math | Tampering | Compute on RSC; pass display strings |
| XSS via Person name in header | XSS | Existing React text escaping; no `dangerouslySetInnerHTML` |

## Sources

### Primary (HIGH confidence)

- `src/lib/debts.ts:132-221` — `DebtPrimaryTotalsInput` / `computeDebtPrimaryTotals` / `no_fx` / `isPartial` (Read via codegraph explore this session)
- `src/lib/locf.ts:71-84` — `locfRateAsOf`
- `src/lib/money.ts:146-156` — `convertOtherMinorToPrimaryMinor`
- `src/app/income/page.tsx` — actuals include vs next-open mapping
- `src/app/debts/page.tsx:68-155` — today LOCF map (negative example for this phase)
- `src/lib/historical-series.ts:112-114` — per-sampleDate `locfRateAsOf` (positive example)
- `src/components/debts/DebtsPrimaryTotalsHero.tsx:39-48` — «Итог неполный» tone
- `prisma/schema.prisma:141-179` — actual models
- `.planning/phases/16-counterparty-income-stats/16-CONTEXT.md` — locked decisions
- `package.json` — vitest 4.1.11, next 16.3.4

### Secondary (MEDIUM confidence)

- `.planning/research/ARCHITECTURE.md` — structure (partially superseded on FX as-of)
- `.planning/research/PITFALLS.md` — invent FX; mix debt into income
- Phase 15 VERIFICATION — vitest + file-scan verify pattern

### Tertiary (LOW confidence)

- classify-confidence seam returned LOW for provider `codebase` even with `--verified` — treat as seam gap; provenance still VERIFIED via Read/codegraph

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new deps; versions verified in package.json
- Architecture: HIGH — codegraph + Read of page/debts/locf/income anchors
- Pitfalls: HIGH — CONTEXT + Phase 15 next-open vs all-actuals trap verified in source

**Research date:** 2026-09-07
**Valid until:** 2026-10-07 (stable in-repo patterns; re-check if income list gains multi-slot history)
