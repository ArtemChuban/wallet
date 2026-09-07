# Pitfalls Research

**Domain:** Adding income plan-vs-actual + NW forecast overlay to existing LOCF snapshot / dated-FX Wallet
**Researched:** 2026-09-07
**Confidence:** HIGH (codebase integration); MEDIUM (schedule/plan-vs-actual ecosystem)
**Milestone:** v1.2 Доходы

## Critical Pitfalls

### Pitfall 1: Baking income into historical LOCF / `computeNetWorthRows`

**What goes wrong:**
Planned or actual income is folded into `computeNetWorthRows`, `buildNetWorthSeries`, or BalanceSnapshot LOCF. Past Капитал points jump; Core Value (“history you can trust”) dies. Same class of failure as v1.1 debts-in-NW, but sneakier because product *does* want income on the capital chart — as **future overlay only**.

**Why it happens:**
Convenient “just add salary to NW total.” Forecast and fact share one series. PROJECT lock ignored: income must not flow into historical LOCF.

**How to avoid:**
- Keep `computeNetWorthRows` / past `buildNetWorthSeries` account-only.
- New pure builder (e.g. `buildNwForecastOverlay`) starts at **today’s** LOCF NW and adds **future recurring plan** only.
- Isolation test like DISOL-01: `net-worth.ts` must not import income domain; historical series past window unchanged.

**Warning signs:**
- Income imports in `src/lib/net-worth.ts` or past branch of `historical-series.ts`
- Unit tests where past sample dates change when income rows added
- Single `nw` field meaning both fact and forecast

**Phase to address:**
Schema/domain math (contract) + Капитал forecast phase (implementation) + final isolation regression

---

### Pitfall 2: Auto-bumping account balances when marking actual

**What goes wrong:**
Recording факт creates/updates `BalanceSnapshot`. Balances stop being user-authored source of truth; double-count if user also updates account; deferred feature shipped accidentally.

**Why it happens:**
Mental model “income received → money appeared.” Double-entry muscle memory. Todo even floated linking forecast to balances.

**How to avoid:**
- Hard product rule in actions: actual write touches income tables only — **no** `BalanceSnapshot` / `Account` writes in v1.2.
- Copy on form: «баланс счёта не меняется — обновите снимок вручную».
- Regression test: mark actual → snapshot count / amounts unchanged.

**Warning signs:**
- Server action imports balances mutations
- “Apply to account” checkbox in UI
- NW hero jumps on actual without new balance event

**Phase to address:**
Plan/actual CRUD actions (lock) — verify every income mutation phase

---

### Pitfall 3: Mutating plan to match actual (erasing variance)

**What goes wrong:**
On факт entry, code overwrites planned amount/date with actual. Plan-vs-actual always “matches”; overdue/stats lie; forecast template for next months drifts.

**Why it happens:**
Treating plan as editable draft of truth instead of expected baseline. Budget software anti-pattern: “change the plan to match reality.”

**How to avoid:**
- Occurrence = immutable plan fields + optional actual fields (amount, date).
- Edit plan = separate action (affects template / future gens), not side-effect of actual.
- Surface both amount variance and date drift in UI.

**Warning signs:**
- Single amount column
- `UPDATE` that sets planAmount = actualAmount
- Stats use only actual with no planned baseline

**Phase to address:**
Schema + plan/actual domain model (first income phase)

---

### Pitfall 4: Day-of-month 29/30/31 silently skipping months

**What goes wrong:**
Recurring generator uses naive “same day next month” or RRULE `BYMONTHDAY=31`. Apr/Jun/Sep/Nov/Feb get **no** occurrence (RFC 5545: invalid dates ignored). Forecast holes; false overdue gaps.

**Why it happens:**
Calendar libs and Actual Budget-class schedulers hit this; easy to ship without Feb/short-month tests.

**How to avoid:**
- Lock policy: **clamp to last valid day of month** (31→30/29/28) OR explicit «последний день месяца».
- Pure `planDateForMonth(year, month, dayOfMonth)` + Vitest matrix: 31×Feb, 31×Apr, 29×non-leap.
- Do not depend on external rrule skip semantics.

**Warning signs:**
- Missing March plan after Jan 31 salary
- Generator tests only use day ≤ 28

**Phase to address:**
Recurring schedule / occurrence generation (domain phase before CRUD)

---

### Pitfall 5: Double-counting plan + actual in forecast

**What goes wrong:**
Projection adds planned amount for a month that already has actual (or adds both). Future NW overstated; after pay day chart jumps twice.

**Why it happens:**
Separate loops over “all plans” and “all actuals” without occurrence identity. One-time income incorrectly included in recurring forecast.

**How to avoid:**
- Occurrence key: `(incomeSourceId, year-month)` for recurring; one-time = single occurrence.
- Forecast rule: future open plans only; if actual exists for that month → use actual for past/present display, **exclude** that month’s plan from forward sum.
- One-time: never in recurring NW projection (list/stats only unless date still future and explicitly opted in — default **out**).

**Warning signs:**
- Forecast jumps by ~2× salary in pay month
- One-time bonus appears every future month

**Phase to address:**
Forecast builder phase (after schema defines occurrence identity)

---

### Pitfall 6: FX dishonest on multi-currency income / forecast

**What goes wrong:**
Convert with today’s rate for past actuals; use rate `1` or `0` when missing; interpolate; or hide partial. Primary totals and forecast look precise but wrong — same trap as Phase 4/11.

**Why it happens:**
Future dates have no FxRate row; temptation to “just use latest.” Income path reinvented instead of `locfRateAsOf`.

**How to avoid:**
- Past actual → LOCF rate **as-of actual date** (identity if primary).
- Future plan → LOCF last known rate as-of **projected date** (carries forward) + `isPartial` / «курс прогнозный» banner when no rate ever or stale policy requires honesty.
- Never invent rates; never silent exclude without banner.
- BigInt minor + existing `convertOtherMinorToPrimaryMinor`.

**Warning signs:**
- `Number(rate)` or hard-coded `1`
- Forecast in USDT with no FX banner when rates empty
- Stats change when user edits unrelated “today” rate only (for **past** actuals)

**Phase to address:**
Totals/stats phase + forecast phase; reuse FX LOCF helpers

---

### Pitfall 7: Extending `buildNetWorthSeries` past `today` in-place

**What goes wrong:**
Remove `d <= today` filter or sample future dates inside historical builder. Range presets, empty-axes ticks (D-13), stack keys, and “event∪today” sparsity semantics break. Past chart gains fake steps on every pay day with no balance event.

**Why it happens:**
One function for “the chart.” Forecast wants more x-axis points.

**How to avoid:**
- Historical builder stays `≤ today` (CHART-03).
- Concatenate or dual-series: history points + forecast points; chart marks `kind: "actual" | "forecast"`.
- Window: past preset unchanged; forecast horizon = explicit N months forward (product lock), not “30d” lookback.

**Warning signs:**
- `buildNetWorthSeries` tests fail on date filter
- Pay dates appear in past series without balance/FX events

**Phase to address:**
Капитал forecast / chart phase

---

### Pitfall 8: Chart presents forecast as fact (Recharts single Area)

**What goes wrong:**
One solid Area continues past today. User trusts dashed-looking future as measured NW. Tooltip mixes stack accounts with phantom income.

**Why it happens:**
Recharts cannot dash one segment of a single Line/Area; naive append looks continuous.

**How to avoid:**
- Two series: historical solid Area + forecast Line/Area with `strokeDasharray`, null-split at today, shared anchor point.
- Suppress duplicate tooltip/dot on overlap (known Recharts dual-series footgun).
- Russian legend: «Факт» / «Прогноз».

**Warning signs:**
- No visual break at today
- Tooltip shows account stacks on future points

**Phase to address:**
Капитал UI chart phase

---

### Pitfall 9: Overdue logic on wrong calendar / wrong match key

**What goes wrong:**
«Заполни» uses UTC midnight vs `calendarDateToday("Europe/Moscow")`; or matches actual only on exact plan date so early/late pay never clears overdue; or highlights future plans.

**Why it happens:**
Date drift is a first-class requirement; naive `actualDate === planDate` fails. Server vs client TZ diverge.

**How to avoid:**
- Overdue iff `planDate < moscowToday` AND no actual for that occurrence (month key), regardless of actual date drift.
- All “today” comparisons via `calendarDateToday()` (existing A3/D-12).
- Early actual before plan date → occurrence satisfied, not overdue.

**Warning signs:**
- Highlight flickers around 21:00–03:00 Moscow
- Paid early still red; paid late still red forever

**Phase to address:**
Доходы list/overdue UI phase

---

### Pitfall 10: Person/counterparty model coupling with debts

**What goes wrong:**
Reuse `Person` without rules → delete person blocked by debts wipes income link confusion; income “employer” appears in Долги empty states; OR duplicate Counterparty table diverges names and stats.

**Why it happens:**
v1.1 Person is IOU counterparty; income wants “контрагент” too. Schema convenience vs domain clarity.

**How to avoid:**
- Prefer **reuse Person** with clear RU copy: один справочник людей/организаций; debts vs income are separate relations.
- Delete policy: Restrict if any debt **or** income reference; message lists both.
- Stats query income only — never mix debt direction into income stats.

**Warning signs:**
- Separate `IncomeParty` with same unique names as Person
- Delete person succeeds while income rows orphan or cascade-delete history

**Phase to address:**
Schema + counterparties phase

---

### Pitfall 11: IEEE money / weak Prisma constraints

**What goes wrong:**
Float majors in domain math; unique `(sourceId, planDate)` blocks two corrections; missing BigInt — same class as debts pitfalls 4/6.

**Why it happens:**
Copy-paste HTML number inputs; mirroring BalanceSnapshot uniqueness onto events that need multiples.

**How to avoid:**
- BigInt minor end-to-end; Zod major→minor at boundary.
- Allow multiple actual edits via update-in-place or event log; don’t unique-constrain like snapshots unless occurrence is 1:1 by design.

**Warning signs:**
- `amount: number` in lib
- P2002 on second save same day

**Phase to address:**
Schema + validations (first phase)

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Generate occurrences on read only | No backfill job | Slow lists; overdue drift if rule changes | OK for single-user if pure + cached in request |
| Materialize 12 months ahead in DB | Fast UI | Stale rows when dayOfMonth/amount edits; cleanup bugs | Only with regenerate-on-template-change |
| Forecast = last NW × (1+g) | One line of code | Ignores salary calendar; lies vs product | Never for v1.2 |
| Share Person without delete copy | Fast schema | User deletes “employer” confused with debtor | Never without Restrict + RU cascade copy |
| Put forecast math in `page.tsx` | Ships chart fast | Untestable; breaks DISOL-style isolation | Never — pure lib + tests |
| Skip dashed series | Less Recharts pain | Users trust forecast as fact | Never on Капитал |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| `computeNetWorthRows` | Add income contribution rows | Leave untouched; overlay separate |
| `buildNetWorthSeries` | Sample dates > today | Keep ≤ today; separate forecast builder |
| `locfRateAsOf` / FX | Today’s rate for all income | As-of occurrence/plan date; partial banner |
| `BalanceSnapshot` | Write on actual | No writes in v1.2 |
| `Person` (debts) | Silent cascade or parallel party table | Reuse + Restrict; income relation separate |
| `NetWorthHistoryChart` | Append to `nw` only | Dual series fact/forecast + legend |
| `calendarDateToday` | `new Date().toISOString().slice(0,10)` | Moscow helper only |
| DISOL-01 pattern | No income isolation test | Mirror file-scan tests for income↔NW |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Per-day calendar expand for charts | Slow Капитал | Sparse: today + each future plan date only (mirror event∪today) | 5y daily × many sources |
| N+1 Prisma per occurrence | Slow Доходы | Batch sources + actuals; Map join in lib | ~100 sources × 24 months |
| Regenerate all occurrences on every stats view | Write amplification | On-read pure generate or invalidate on template edit | Multi-year materialization |

Single-user SQLite: performance secondary to correctness; still avoid daily dense series (v1.0 D-07 lesson).

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| `window.confirm` on income delete | Accidental wipe; constitution break | DestructiveConfirmStep + RU loss copy |
| Trust client `today` for overdue | Wrong highlight / skip | Server uses `calendarDateToday()` |
| Unvalidated dayOfMonth 0/32 | Corrupt generator | Zod 1–31 + clamp policy tests |

Local single-user: low multi-tenant risk; money integrity + destructive UX still apply.

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Forecast line looks like measured NW | False confidence | Dashed + «Прогноз» legend; banner on FX assumptions |
| No copy that actual ≠ balance update | User expects account bump | Explicit helper text on факт form |
| Overdue only by exact date match | Early/late pay stuck red | Month/occurrence satisfaction |
| Employer vs должник confusion | Wrong nav / delete | Shared Person + section-specific empty copy |
| Amount variance only, ignore date drift | Misses “paid late” | Show plan date + actual date |
| Russian strings mixed EN in errors | Breaks UI constitution | All user-facing RU |

## "Looks Done But Isn't" Checklist

- [ ] **Historical NW unchanged:** Adding income fixtures does not change `buildNetWorthSeries` points ≤ today
- [ ] **No balance side effects:** Mark actual → zero BalanceSnapshot writes
- [ ] **Plan immutable on actual:** After факт, plan amount/date still original; variance visible
- [ ] **DOM 31 safe:** Jan 31 template creates Feb 28/29 occurrence
- [ ] **No double count:** Month with actual excluded from forward plan sum
- [ ] **FX partial:** Foreign income without rate → excluded + banner, not 0
- [ ] **Overdue Moscow:** Plan yesterday, no actual → highlight; early actual → clear
- [ ] **Forecast visual:** Dashed/labeled past today; stacks not inventing future account layers
- [ ] **One-time excluded** from recurring NW projection
- [ ] **Isolation tests:** income module not imported from `net-worth.ts`; actions don’t touch balances
- [ ] **Destructive confirm:** income/source delete uses in-dialog second step
- [ ] **Person delete:** blocked if income references remain

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Income in historical NW | HIGH | Revert series API; restore DISOL-style tests; rebuild chart from account LOCF only |
| Auto balance bumps shipped | HIGH | Stop writes; offer script to delete income-tagged snapshots if any; tell user to re-enter balances |
| Plan overwritten by actuals | MEDIUM | Migration can’t restore — add plan fields if lost; stop mutation path |
| DOM skip months | LOW | Fix generator + backfill missing occurrences |
| Double-count forecast | LOW | Fix occurrence join rule + tests |
| FX silent wrong | MEDIUM | Align to locfRateAsOf + banners; recompute display only (no ledger rewrite) |
| Chart fact/forecast merge | LOW | Split series + legend |

## Pitfall-to-Phase Mapping

Suggested v1.2 phase topics (roadmap may renumber):

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Plan mutate / occurrence identity / BigInt / DOM clamp | **Income schema + domain math** | Vitest: variance fields, Feb/31 matrix, minor math |
| Auto balance bump | **Plan/actual actions** (same or next) | Action test: snapshots untouched |
| Overdue Moscow + date drift | **Доходы page + overdue UI** | Cases: early/late/missing; TZ boundary |
| Person reuse / stats / delete Restrict | **Counterparties + stats** | Delete blocked; stats income-only |
| LOCF pollution / series > today / double-count / FX forecast | **Капитал NW forecast overlay** | Historical golden fixtures unchanged; forecast unit tests |
| Chart dashed fact vs forecast | **Капитал chart UI** | Visual + tooltip: no stack on forecast |
| Isolation regression / Nyquist | **Milestone closure / tech-debt phase** | File-scan tests like `disol.test.ts`; VALIDATION green |

**Ordering rationale:** Domain math before UI; forecast after occurrences exist; isolation last so DISOL-class gates catch late coupling.

## Sources

- Wallet locks: `.planning/PROJECT.md` (v1.2 out-of-scope: no auto balance; income ≠ historical LOCF)
- Codebase: `src/lib/net-worth.ts`, `src/lib/historical-series.ts` (`d <= today`), `src/lib/disol.test.ts`, `src/lib/dates.ts` (Moscow), `prisma/schema.prisma` (Person Restrict)
- v1.1 research/retrospective: debts-in-NW, FX partial honesty, unique-constraint pitfalls
- Plan vs actual: period join + don’t mutate plan (Basedash / Upmetrics variance guides) — confidence MEDIUM
- LOCF ≠ forecast engine (imputation literature; LOCF zero-change assumption) — confidence MEDIUM
- DOM 31 skip: RFC 5545; dateutil#1136; Actual Budget schedule discussions — confidence MEDIUM
- FX: no interpolate; LOCF/stale explicit; as-of transaction date — confidence MEDIUM
- Recharts: dual series + `strokeDasharray` for forecast; dual tooltip footgun — confidence MEDIUM
- codegraph impact: `computeNetWorthRows` → `page.tsx` + `historical-series.ts` only — treat as blast radius

---
*Pitfalls research for: Wallet v1.2 Доходы (income plan-vs-actual + NW forecast on LOCF app)*
*Researched: 2026-09-07*
