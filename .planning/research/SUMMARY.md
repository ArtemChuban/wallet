# Project Research Summary

**Project:** Wallet v1.2 Доходы
**Domain:** Income/salary plan-vs-actual ledger + NW forecast overlay on existing LOCF snapshot / dated-FX capital app
**Researched:** 2026-09-07
**Confidence:** HIGH

## Executive Summary

Wallet v1.2 adds a third parallel domain — income — beside Accounts/NW and Debts. Experts build this as a **side ledger** (template → virtual occurrences → optional actual), not as YNAB-style register posting. Plan and actual stay first-class; overdue is calendar hygiene («заполни»); forecast is a **short forward overlay** on Капитал, never a rewrite of historical LOCF NW.

**Recommended approach:** zero new npm packages. Extend Prisma (`IncomeSource` + `IncomeActual`, reuse `Person`), pure libs (`income.ts`, `nw-forecast.ts`, day-of-month clamp in `@/lib/dates`), `/income` App Router page mirroring `/debts`, and dual-series recharts (solid fact + dashed forecast) on existing `NetWorthHistoryChart`. Virtual slots on read — persist definitions + actuals only. INISO-01 isolation mirrors DISOL-01: `net-worth.ts` / `historical-series.ts` never import income; actions never write `BalanceSnapshot`.

**Key risks:** (1) folding income into historical LOCF — kill trust; (2) auto-bump balances on actual — out of scope; (3) DOM 31 skip months via rrule semantics; (4) double-count plan+actual in forecast; (5) chart that looks like measured NW past today. Mitigate with schema/math-first phases, clamp policy + Vitest matrix, occurrence-key forecast rules, dual series + RU legend, and isolation regressions at milestone close.

## Key Findings

### Recommended Stack

Add **no** dependencies. Reuse Next.js 16.3.4 App Router, Prisma 7.10.0 + SQLite, React 19.2.8, Zod 4.5.4, recharts 3.10.1, Vitest 4.1.11, shadcn/ui + Tailwind 4. Domain work = migration + TypeScript modules + chart series extension. Reject rrule/date-fns/luxon, cron workers, new chart libs, decimal money packages.

**Core technologies:**
- Next.js 16.3.4 — `/income` RSC + Server Actions; same CRUD/revalidate as debts
- Prisma 7.10.0 + better-sqlite3 — IncomeSource/IncomeActual; BigInt minor; Person FK
- recharts 3.10.1 — forecast via `strokeDasharray` / dual series / optional `ComposedChart`; no new chart lib
- Zod 4.5.4 — dayOfMonth 1–31, amounts, dates at action boundary
- Vitest 4.1.11 — occurrence clamp, overdue, forecast overlay math (pure, no Prisma)
- `@/lib/dates` + money + fx/locf — Moscow calendar, DOM clamp, FX LOCF as-of plan/projection

Details: [STACK.md](./STACK.md)

### Expected Features

Industry pattern: schedule → occurrence → plan≠actual → overdue → forecast from **planned** future only; accounts stay manual snapshots. Wallet locks: projection = overlay; actual ≠ balance post.

**Must have (table stakes):**
- Recurring monthly income (DOM, amount, currency, Person) + one-time
- Plan vs actual (independent amount + date)
- Overdue «заполни» when plan date < Moscow today and no actual
- «Доходы» page + nav; DestructiveConfirmStep on deletes
- Multi-currency + FX LOCF for stats/projection; partial honesty
- Actual does **not** change account balances
- Капитал forward projection from recurring (+ future one-time) + FX
- Per-counterparty income stats (basic Σ primary)

**Should have (competitive):**
- Plan≠actual as first-class variance (not silent overwrite)
- NW forecast dashed overlay on existing Капитал chart
- Side-ledger isolation (DISOL-style; never mutates account LOCF)
- Shared `Person` for debts + income
- Dated FX LOCF on projected salary points

**Defer (v1.x / v2+):**
- Optional account note/link (still no auto-post); variance chart; nav overdue badge; pause/end template; Person debts+income tabs
- Auto-suggest balance snapshot; biweekly/RRULE; burn/budget; Monte Carlo; bank import — out / later

Details: [FEATURES.md](./FEATURES.md)

### Architecture Approach

Income is a third parallel domain: same SQLite/Currency/FX/money — **no** writes into Account/BalanceSnapshot; **no** mutation of historical LOCF. Persist source + actuals; generate plan slots in pure code. Forecast = today NW anchor + cumulative converted future plans in `nw-forecast.ts`; historical path unchanged. Dashboard may import forecast (unlike debts↔page DISOL); overlay is intentional capital UX.

**Major components:**
1. `IncomeSource` / `IncomeActual` — plan definition + fact per `(sourceId, plannedAsOf)`
2. `src/lib/income.ts` — virtual occurrences, overdue, counterparty stats
3. `src/lib/nw-forecast.ts` — forward NW overlay only (not LOCF rewrite)
4. `/income` + income components — CRUD, overdue list, stats (debts UX mirror)
5. `NetWorthHistoryChart` / `DashboardChartsShell` — dual series fact/forecast join at today
6. INISO-01 tests — file-scan + property: past NW identical with/without income data

Details: [ARCHITECTURE.md](./ARCHITECTURE.md)

### Critical Pitfalls

1. **Income in historical LOCF / `computeNetWorthRows`** — keep account-only history; separate forecast builder; INISO-01
2. **Auto-bump BalanceSnapshot on actual** — actions touch income tables only; RU copy; snapshot regression
3. **Mutating plan to match actual** — immutable plan fields; actual optional; separate plan-edit action
4. **DOM 29/30/31 skip months** — clamp to last day of month; Vitest matrix; never rrule skip
5. **Double-count plan+actual / chart as fact** — future open plans only; dual dashed series + «Прогноз» legend

Also watch: FX invent/silent zero; extend `buildNetWorthSeries` past today; wrong Moscow overdue key; Person delete without Restrict; float money.

Details: [PITFALLS.md](./PITFALLS.md)

## Implications for Roadmap

Based on research, suggested phase structure (5–6 phases; mirror v1.1 debts side-ledger order):

### Phase 1: Income schema + domain math
**Rationale:** All features hang on occurrence identity, DOM clamp, BigInt, plan≠actual fields — UI without this reworks later.
**Delivers:** Prisma `IncomeSource`/`IncomeActual` + Person/Currency relations; migration; `income.ts` (`listPlanOccurrences`, overdue, stats helpers); DOM clamp in `@/lib/dates`; Vitest matrix; validations/Zod.
**Addresses:** Recurring + one-time model; plan vs actual fields; Person reuse; multi-currency storage
**Avoids:** Plan mutate on actual; DOM skip; IEEE float; materialize-all-future-rows; new Employer table

### Phase 2: Доходы CRUD + nav
**Rationale:** Ledger discoverability before forecast; debts patterns already proven.
**Delivers:** `/income` page, nav «Доходы», source create/edit/delete (RECURRING/ONE_TIME), Person pick, list with virtual slots, DestructiveConfirmStep, RU copy.
**Uses:** Next Server Actions, shadcn Dialog, existing PersonFormDialog patterns
**Implements:** Income UI shell; revalidate `/income`
**Avoids:** window.confirm; BalanceSnapshot writes; English user strings

### Phase 3: Record actual + overdue polish
**Rationale:** Overdue and variance need actual join; forecast needs occurrence satisfaction rules.
**Delivers:** Record/update actual dialog (amount + date); unique slot; overdue «заполни» (Moscow today, occurrence key, early/late clears); helper text «факт не меняет баланс».
**Addresses:** Plan vs actual UX; overdue hygiene; honesty lock
**Avoids:** Auto balance bump; plan overwrite; UTC today; exact-date-only overdue match

### Phase 4: Counterparty stats
**Rationale:** Depends on actuals + FX; independent of chart; ships locked target feature without blocking capital UX.
**Delivers:** Per-Person Σ on `/income` (actual primary; optional plan secondary); LOCF as-of; partial banner; Person delete Restrict if income refs.
**Addresses:** Per-counterparty income stats; multi-currency honesty
**Avoids:** Mix debt direction into income stats; invent FX rates; cascade-delete history

### Phase 5: NW forecast overlay + chart
**Rationale:** Needs sources + occurrence rules; capital differentiator last so ledger MVP not blocked.
**Delivers:** `nw-forecast.ts` (anchor + cumulative future plans, ~90d horizon, sparse dates); page payload; dual series on `NetWorthHistoryChart` (`strokeDasharray`, join at today, «Факт»/«Прогноз»); FX partial banner; INISO-01 isolation tests.
**Addresses:** Капитал forward projection; forecast overlay differentiator
**Avoids:** LOCF pollution; series > today in historical builder; double-count; one-time in recurring loop; solid Area past today; forecast math in `page.tsx`

### Phase 6 (optional / closure): Isolation + Nyquist
**Rationale:** Catch late coupling; mirror debts milestone gates.
**Delivers:** `iniso.test.ts` file-scan; historical golden fixtures unchanged with income fixtures; VALIDATION green; “looks done” checklist from PITFALLS.
**Avoids:** Silent income imports into `net-worth.ts` / `historical-series.ts`

### Phase Ordering Rationale

- Domain math before UI — generator/clamp/occurrence key is the hard contract
- CRUD → actual → stats → forecast — dependency DAG from FEATURES.md
- Forecast last — needs schedules; chart dual-series is high-complexity UX
- Isolation last (or inside Phase 5 + closure) — DISOL-class gates catch late coupling
- Zero new services — Docker/SQLite unchanged

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** Day-of-month / short-month clamp algorithm (light — lock clamp vs «последний день»)
- **Phase 5:** Forecast horizon vs range preset (discuss — recommend independent 90d forward); Chart Area vs Line / `ComposedChart` (UI-SPEC)
- **Phase 1–2 discuss:** Person reuse vs employer split if UX confuses

Phases with standard patterns (skip research-phase):
- **Phase 2:** App Router CRUD + debts dialog mirror — well-documented in-repo
- **Phase 3:** Actual write + overdue boolean — pure lib patterns settled
- **Phase 4:** FX LOCF totals — reuse debts/NW honesty patterns
- **Phase 6:** Isolation file-scan — copy DISOL-01 shape

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Repo pins + explicit “add zero packages”; recharts APIs cross-checked |
| Features | HIGH | PROJECT.md locks + side-ledger precedent; competitor UX MEDIUM only |
| Architecture | HIGH | Codebase integration clear; chart dual-series UX MEDIUM |
| Pitfalls | HIGH | Codebase + v1.1 DISOL lessons; schedule/FX ecosystem MEDIUM |

**Overall confidence:** HIGH

### Gaps to Address

- **Forecast horizon vs chart range presets:** Discuss/lock 90d (or N months) independent of past lookback during Phase 5 plan
- **Person as employer UX:** Validate copy/empty states; only split tables if discuss-phase forbids mixing
- **One-time in NW projection:** Default out of recurring sum unless future-dated and opted in — confirm in plan-phase
- **ComposedChart vs AreaChart children:** Validate at UI-SPEC; stay on recharts 3.10.1 either way
- **Pause/end recurring without delete history:** Deferred to v1.x — do not bloack v1.2 schema if `active`/`endAsOf` cheap now (Architecture already suggests fields)

## Sources

### Primary (HIGH confidence)
- `package.json` pins — Next 16.3.4, Prisma 7.10.0, recharts 3.10.1, Zod 4.5.4, Vitest 4.1.11
- `.planning/PROJECT.md` v1.2 locks — no auto balance; forecast ≠ historical LOCF
- Codebase — `net-worth.ts`, `historical-series.ts`, `disol.test.ts`, `dates.ts`, `prisma/schema.prisma` (Person), `NetWorthHistoryChart.tsx`, debts side-ledger
- Todo `2026-09-05-add-salary-income-tracking-with-forecast.md`

### Secondary (MEDIUM confidence)
- Recharts dual-series + `strokeDasharray` / `ReferenceLine` community pattern
- YNAB / Monarch / Simplifi / COUNT — plan vs actual, pending/overdue, forecast horizons (Wallet stays short overlay)
- RFC 5545 / rrule DOM skip — reason to reject rrule for salary clamp
- Plan-vs-actual variance guides — do not mutate plan on actual

### Tertiary (LOW confidence)
- Isolated webfetch of recharts API pages without pin cross-check
- npm version checks for rejected libs (rrule, date-fns) — informational only

---
*Research completed: 2026-09-07*
*Ready for roadmap: yes*
