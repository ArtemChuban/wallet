# Project Research Summary

**Project:** Wallet (v1.3 Кредитка)
**Domain:** Credit-card grace-period tracking + NW forecast obligation overlay (local single-user SQLite app)
**Researched:** 2026-09-08
**Confidence:** HIGH

## Executive Summary

Wallet v1.3 extends an already-shipping capital tracker: FIAT_CREDIT accounts already carry limit + debt via snapshots; Капитал already draws a dashed «Прогноз» Line from open income slots (v1.2). Experts in this niche (manual bill/grace apps + PocketSmith-style “adjust when statement arrives”) separate **cycle template**, **statement amount due**, and **live card debt**. Wallet locks the same honesty: grace START + duration DAYS monthly, **manual** amount due, early close, and forecast overlay only — never snapshot-derived dues, never BalanceSnapshot writes, never historical LOCF rewrite (GRACEISO-01 twin of ISO-01).

**Recommended approach:** add **zero npm packages**. Extend Prisma (`Account.grace*` + child `CreditGraceObligation`), pure `@/lib/credit-grace.ts` (due = `addCalendarDays(start, days)`), signed slots in `@/lib/nw-forecast`, merge into existing `DashboardChartsShell` / one dashed Line. UX stays on credit account + Капитал — not a parallel `/grace` or «Долги» coupling. Bank contract notes gate cycle-rule lock before PLAN precision.

**Key risks:** (1) stock/flow double-count — subtracting amount-due while credit debt already reduces NW; lock Option A (cash-out dip) vs B (markers / parallel series) in discuss before chart polish. (2) calendar operator mix-up — start uses DOM clamp, due uses +days, not one helper for both. (3) shipping APR/revolving or auto-derive from snapshots — out of scope until contract forces. Mitigate with contract phase-zero, GRACEISO tests, Vitest due-date matrix, and RU copy that debt snapshot ≠ льготный amount.

## Key Findings

### Recommended Stack

Reuse the pinned app stack; v1.3 is schema + TypeScript only. See [STACK.md](./STACK.md).

**Core technologies:**
- Next.js 16.3.4 App Router — Server Actions + `revalidatePath` for grace config / amount-due / early close (same as accounts/income)
- Prisma 7.10.0 + better-sqlite3 — `String` YYYY-MM-DD + `BigInt` minor on Account + obligation child; no second DB
- `@/lib/dates` + new `@/lib/credit-grace*.ts` — `addCalendarDays` for due; month walk + clamp for cycle starts; keep Prisma out of unit math
- `@/lib/nw-forecast` + recharts 3.10.1 — signed forecast slots (−grace); one dashed «Прогноз» Line; no new chart lib
- Zod 4.5.4 + Vitest 4.1.11 + shadcn Dialog / DestructiveConfirmStep — validate graceDays > 0; pure cycle/open-set tests; no `window.confirm`

**Do not install:** date-fns / luxon / dayjs, rrule, cron/job queues, money npm libs, interest engines, OCR/PDF parsers.

### Expected Features

Manual local NW tracker extending credit + income-forecast patterns — not YNAB funding, not Monarch sync, not swipe optimizers. See [FEATURES.md](./FEATURES.md).

**Must have (table stakes):**
- Grace cycle on credit account (start date + duration days, monthly) — cycle template
- Cycle instances + manual amount due for interest-free window — never from snapshots
- Early close / paid — removes open obligation from forecast
- Капитал «Прогноз» includes open obligations from due date (FX LOCF honesty / partial banner)
- Historical NW / BalanceSnapshot unaffected (overlay only)
- Bank contract notes before rule lock (may be doc-only)

**Should have (competitive):**
- Debt (snapshot) vs grace due (cycle) side-by-side with clear RU labels
- GRACEISO isolation as trust differentiator (same as income)
- Overdue / «заполни» highlight when due passed without close (P2 after first real miss)

**Defer (v2+ / never in v1.3):**
- Derive due from BalanceSnapshot history; bank/CSV sync; APR/penalty engine
- Min vs statement vs full-debt triad; per-purchase grace; which-card optimizer
- Auto BalanceSnapshot on pay; push reminders; YNAB payment categories

### Architecture Approach

Grace is **not** a fourth parallel ledger like Долги/Доходы. Config lives on `Account` (FIAT_CREDIT); amount/status lives on child `CreditGraceObligation` keyed by `cycleStartAsOf`. Historical path (`net-worth` / `historical-series`) stays untouched; `/` merges income + grace open slots into one signed forecast series. See [ARCHITECTURE.md](./ARCHITECTURE.md).

**Major components:**
1. `Account.graceAnchorAsOf` + `graceDurationDays` — schedule metadata (both null or both set)
2. `CreditGraceObligation` — per-cycle manual `amountMinor`, `dueAsOf` stored at create, OPEN|CLOSED, unique `(accountId, cycleStartAsOf)`
3. `src/lib/credit-grace.ts` — cycle candidates, due math, open membership, overdue (pure + Vitest)
4. `nw-forecast.ts` + `DashboardChartsShell` — signed `deltaMinor` slots; merge with income; FX LOCF as-of today
5. Account UI + `grace-actions.ts` — config, amount entry, early close; **forbidden** BalanceSnapshot writes

**Default overlay semantics (discuss lock):** Option A — negative delta at due date (cash-out approximation until user updates balances). Escalate to Option B if UAT confuses double-count vs existing credit debt.

### Critical Pitfalls

Top risks from [PITFALLS.md](./PITFALLS.md):

1. **Stock/flow double-count** — never treat amount-due as a second liability on top of LOCF debt without an explicit model + golden test (pay from own assets ≈ NW-neutral in truth)
2. **Bake grace into historical LOCF / snapshots** — GRACEISO-01: no import into `net-worth`/`historical-series`; actions never write BalanceSnapshot
3. **Wrong calendar operators** — start = `clampDayOfMonth`; due = `addCalendarDays(start, graceDays)`; Moscow `calendarDateToday`
4. **Unsigned ForecastSlot collision** — extend signed/direction slots before shoving credit into income-only adder
5. **Skip contract study** — do not lock schema/cycle math on generic bank articles; user contract → CONTEXT before PLAN lock

## Implications for Roadmap

Based on research, suggested phase structure (renumber to continue after v1.2 Phase 17):

### Phase 18: Bank contract study + discuss locks
**Rationale:** PROJECT gate — cycle start semantics, monthly repeat/clamp, interest-free vs revolving OOS, overlay Option A vs B must precede plan precision.
**Delivers:** CONTEXT / contract notes; locked decisions (start definition, duration, NW-semantics A|B, vocabulary: льготный ≠ долг по снимку ≠ минимум).
**Addresses:** Contract research (P1); anti-features (no APR engine, no sync).
**Avoids:** Pitfalls 3, 10 (wrong grace model / premature schema lock).

### Phase 19: Schema + pure grace domain math
**Rationale:** Data model + calendar operators before any UI; isolation boundary at schema (Account vs Долги).
**Delivers:** Prisma migration (`Account.grace*` + `CreditGraceObligation`); `credit-grace.ts` + Vitest (Feb/31, +days across month, open membership); Zod validations.
**Addresses:** Cycle config; obligation instance identity; BigInt minor.
**Avoids:** Pitfalls 5, 7, 8 (calendar, orphan periods, Person/Debt coupling); no amount-due derivation (Pitfall 4).

### Phase 20: Amount-due + early-close actions/UI
**Rationale:** Manual obligation CRUD must exist before forecast wiring; GRACEISO write-path lock here.
**Delivers:** Account grace fields UI; create obligation / early close / list open|closed; DestructiveConfirmStep; RU copy that snapshots unchanged.
**Addresses:** Manual amount due; early close; keep limit+debt snapshots independent.
**Avoids:** Pitfalls 2, 4, 7 (snapshot writes, auto-derive, close bugs).

### Phase 21: Капитал forecast integration (signed slots + FX)
**Rationale:** Depends on open obligations + signed `nw-forecast`; highest integration risk (stock/flow + income coexistence).
**Delivers:** Extend `ForecastSlot` with signed `deltaMinor`; `page.tsx` + `DashboardChartsShell` merge; partial FX banner for credit; early close clears dip; golden no double-liability test.
**Addresses:** Прогноз from due date; FX honesty; income coexistence.
**Avoids:** Pitfalls 1, 6, 9 (double-count, unsigned slots, FX invent).

### Phase 22: GRACEISO regression + UAT polish
**Rationale:** Catch late coupling; legend/copy/overdue after core math green.
**Delivers:** File-scan like `iniso.test.ts`; past-series golden identity; overdue highlight; chart legend (доходы / обязательства); Orca UAT path config→amount→forecast→close→history unchanged.
**Addresses:** Isolation SoT; overdue P2; Russian-first chrome.
**Avoids:** Pitfall 2 residual; UX panic from unexplained dip.

### Phase Ordering Rationale

- Contract/discuss before schema — bank rule mismatch = high recovery cost
- Pure schedule math before CRUD — due dates must be trustworthy before users enter amounts
- Obligation write path before chart — open-set membership is the forecast input
- Overlay semantics + signed slots before polish — stock/flow is the milestone’s sharpest pitfall
- Isolation + UAT last — mirrors v1.2 INISO closure pattern

### Research Flags

Phases likely needing deeper research during planning (`/gsd-plan-phase --research` or discuss):
- **Phase 18:** User bank contract specifics (statement day vs purchase day; weekend shifts; cash-advance carve-outs) — sparse until user supplies PDF/notes
- **Phase 21:** Overlay Option A vs B UX + same-day income+grace tooltip/netting — ecosystem analogies only MEDIUM; needs product lock

Phases with standard patterns (skip heavy research-phase):
- **Phase 19:** Prisma + pure dates — well-documented in-repo (`dates.ts`, income month walk)
- **Phase 20:** Server Actions + Dialogs + DestructiveConfirm — copy income/debt patterns
- **Phase 22:** INISO-style file-scan + Orca UAT — established milestone closure

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Repo pins + codebase; reject date-fns/rrule with clear fit reasons |
| Features | HIGH | PROJECT locks + domain norms; ecosystem UX MEDIUM but does not change MVP |
| Architecture | HIGH | Clear integration with income forecast + ISO walls; NW-semantics Option A/B still discuss |
| Pitfalls | HIGH | Codebase stock/flow + calendar traps verified; bank revolving details MEDIUM pending contract |

**Overall confidence:** HIGH

### Gaps to Address

- **Bank contract content:** User must supply agreement; until then keep schema flexible (anchor + durationDays + manual amount) — handle in Phase 18
- **NW overlay semantics A vs B:** Architecture defaults A; Pitfalls prefers explicit netting/markers if double-count confuses — lock in discuss before Phase 21 plan
- **Month-advance clamp for next cycle start:** Product must lock end-of-month behavior after contract (reuse income clamp vs bank rule)
- **Past-due open in forecast:** Architecture says `dueAsOf > today` → UI only; confirm policy if product wants overdue still on dashed line
- **Partial pay / edit amount after entry:** P2/P3 — promote only if UAT demands

## Sources

### Primary (HIGH confidence)
- `.planning/PROJECT.md` — v1.3 locks (manual amount, overlay only, contract study, OOS revolving)
- `package.json` pins — Next 16.3.4, Prisma 7.10.0, recharts 3.10.1, Zod 4.5.4, Vitest 4.1.11
- Codebase — `dates.ts`, `nw-forecast.ts`, `DashboardChartsShell.tsx`, `NetWorthHistoryChart.tsx`, `iniso.test.ts`, `prisma/schema.prisma`, income occurrence patterns
- Todo `2026-09-05-improve-credit-account-type-with-limit-grace-period-and-fore.md` — problem statement / derive-from-spend risk

### Secondary (MEDIUM confidence)
- PocketSmith / Monarch Bill Sync / YNAB credit models — manual adjust vs sync vs category funding
- TodayKa / Swipeity / BillWise — cycle-date focus
- T-Bank / VTB / Sovcombank / Raiffeisen explainers — расчётный → льготный; min ≠ full payoff
- Centinel / Simplifi / BudgetLabs — cash-out vs double-count guidance for card payments on forecasts
- Prior v1.2 PITFALLS — ISO, DOM, FX, chart fact/forecast patterns reused

### Tertiary (LOW confidence)
- npm registry versions for rejected libs (date-fns, rrule, cron-parser) — confirm-only
- Experian / Wealthsimple / WalletHub grace-void-on-carry articles — not a substitute for user contract
- EV–equity double-count metaphor — UI metaphor only

---
*Research completed: 2026-09-08*
*Ready for roadmap: yes*
*Milestone: v1.3 Кредитка*
