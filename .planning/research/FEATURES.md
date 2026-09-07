# Feature Research

**Domain:** Personal income/salary plan-vs-actual ledger + net-worth forecast overlay
**Researched:** 2026-09-07
**Confidence:** HIGH (scope locks from PROJECT.md); MEDIUM (competitor UX patterns via web)
**Milestone:** v1.2 Доходы
**App shape:** Local single-user NW tracker (snapshots + dated FX); income = side ledger like Долги

## Expected Behavior (domain norms)

Industry pattern for plan-vs-actual income:

1. **Template / schedule** — recurring pay (monthly day-of-month) or one-time expected inflow with planned amount + date.
2. **Occurrence / period instance** — each month (or one-shot) becomes a row the user can confirm.
3. **Actual ≠ plan** — when pay lands, user records real amount and real date (bonuses, early/late). Plan stays for variance + forecast baseline.
4. **Status** — pending → received; if calendar past plan date and no actual → **overdue / «заполни»**.
5. **Forecast** — future NW/cash uses **planned** recurring amounts until actual replaces that occurrence; past NW history stays account-snapshot truth.
6. **Accounts stay manual** — in snapshot-first apps (Wallet), marking income received is a ledger fact, **not** an automatic balance bump (YNAB-style register post is a different product class).

Wallet-specific lock: projection = **overlay on Капитал chart**, not rewrite of `computeNetWorthRows` LOCF history.

## Feature Landscape

### Table Stakes (Users Expect These)

| Feature | Why Expected | Complexity | Notes / Wallet deps |
|---------|--------------|------------|---------------------|
| Recurring monthly income (amount, currency, day-of-month) | Salary mental model; every paycheck tool has this | MEDIUM | New IncomeSource/Schedule entity; Moscow calendar DOM (31→last day) needs phase research |
| One-time income | Bonuses, gifts, side pay — users expect both | LOW | Same ledger, `recurrence=ONCE` or separate one-shot rows |
| Plan vs actual (amount + date independent) | Fixed salary still drifts (премии, early/late) | MEDIUM | Plan fields immutable-ish; actual nullable until filled |
| Overdue highlight when plan date passed w/o actual | COUNT/YNAB-style pending→overdue; todo lock «заполни» | LOW–MEDIUM | List sort overdue-first; status pill; Moscow «today» |
| Counterparty on income | Employer/client attribution; mirrors Долги Person | LOW–MEDIUM | **Reuse `Person`** (+ optional new relation); do not invent Employer |
| Per-counterparty income stats | «How much from X?» after multi-source | MEDIUM | Aggregate Σ actual (and/or plan) by Person; FX→primary for mixed currencies |
| Multi-currency income | App already multi-currency capital | LOW | `Currency` FK + BigInt minor; same as Debt |
| Separate «Доходы» page + nav | Parallel to `/debts`; PROJECT lock | LOW | App Router page; Russian-first copy; DestructiveConfirmStep on deletes |
| Manual record actual (no account balance change) | Snapshot model; PROJECT Out of Scope lock | LOW | Explicit UX copy: «факт не меняет баланс счёта» |
| Капитал `/` NW chart + forward projection from recurring + FX | Core milestone differentiator users will judge as “done” | HIGH | New forecast series; **do not** feed income into historical `computeNetWorthRows` |
| FX as-of for projection points | Same honesty as NW dashboard (partial if rate missing) | MEDIUM | Reuse LOCF `getRateAsOf` / batch Maps; last known rate forward |

### Differentiators (Competitive Advantage for *this* app)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Plan≠actual as first-class (not silent overwrite) | Honesty for floating/bonus pay without fake “fixed” | MEDIUM | Variance view: plan vs actual delta per occurrence |
| NW forecast **overlay** (dashed/future segment) on existing Капитал chart | Capital app with income foresight without becoming a budgeter | HIGH | Visual distinct from history; recharts extend series |
| Side ledger income (like debts): never mutates account LOCF | Fits Wallet philosophy; avoids double-entry creep | LOW (policy) | Same DISOL-style isolation as debts vs NW |
| Shared `Person` for debts + income | One counterparty graph (employer also friend/debtor) | MEDIUM | Schema: `Person.incomes[]`; stats tabs later |
| Dated FX LOCF on projected salary points | Rare in paycheck toys; matches Wallet FX honesty | MEDIUM | Partial flag if future date lacks rate |
| Overdue «заполни» as capital hygiene cue | Bridges income page → NW trust | LOW | Optional badge count in nav |

### Anti-Features (Seem Good, Wrong for v1.2)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Auto-update account balance when actual marked | “Money landed” | Breaks snapshot source-of-truth; double-counts if user also edits balance | Manual balances stay SoT; optional future “suggest balance” |
| Full double-entry / transaction posting | Feels “proper” | Scope explosion; not this product | Periodic balance snapshots only |
| Spending / burn / categories / paycheck budget | Monarch/YNAB habit | Out of Core Value; PROJECT deferred | Income ledger + NW overlay only |
| Bank/CSV import of pay | Less typing | Multi-user SaaS path; deferred | Manual CRUD |
| Auto FX APIs | Live rates for projection | App is manual dated FX | Use last LOCF rate; mark partial |
| Multi-year retirement Monte Carlo (Monarch Forecasting) | Fancy NW future | Wrong horizon; needs expenses/returns | Short forward horizon (e.g. 3–12 mo) from recurring plan only |
| Biweekly / RRULE / last-weekday-of-month schedules | Real payroll variety | Complexity vs locked “monthly DOM + one-time” | Stick to DOM + one-time; promote later |
| Merge income into historical NW LOCF | “Past should show raises” | Lies about account balances; PROJECT lock | Forecast overlay only |
| Income affects NW totals the way accounts do | Intuitive mistake | NW = assets − credit debt only | Projection additive to *future* chart, not hero “current NW” |
| Email/push payday reminders | Overdue UX | No notif infra in local Docker app | In-app overdue highlight only |
| Separate Employer entity vs Person | Cleaner naming | Duplicate counterparties with Долги | Reuse `Person` |
| Link actual → specific Account (required) | Trace money | Implies posting; UI pressure to auto-bump | Optional note/account later; not v1.2 |

## Feature Dependencies

```
Currency + dated FX (shipped)
    └──requires──> Multi-currency income amounts/totals
                       └──requires──> Per-counterparty primary stats
                       └──requires──> NW projection FX conversion

Person (shipped, v1.1)
    └──requires──> Income.counterparty (reuse)
                       └──enhances──> Per-counterparty income stats

Income schedule (recurring + one-time)
    └──requires──> Occurrence/plan rows
                       └──requires──> Actual record (amount/date)
                       └──requires──> Overdue status
                       └──requires──> NW forward projection (planned future only)

Account balance LOCF + computeNetWorthRows (shipped)
    └──enhances──> Forecast baseline (current NW as of today)
    └──conflicts──> Feeding income into historical LOCF  [FORBIDDEN v1.2]

«Доходы» page
    └──requires──> Income CRUD + overdue list
NW chart on `/`
    └──requires──> Forecast series builder + FX
```

### Dependency Notes

- **Income counterparty requires Person:** Prefer extend `Person` with income relation over new Employer table — same CRUD patterns (`PersonFormDialog`), Restrict on delete if open incomes (mirror debts).
- **Projection requires schedules + FX, not actuals for future months:** Future points use plan; past/current occurrence with actual uses actual for that point only if included in short horizon (product choice: typically future = plan-only).
- **Projection conflicts with rewriting `computeNetWorthRows`:** Keep pure account math; add `buildIncomeForecastSeries(...)` (name TBD) consumed only by chart overlay.
- **Overdue requires calendar “today”:** Same Moscow default as debts `openedAsOf` / due dates unless timezone settings promoted.
- **Stats require actuals + FX:** Empty stats until some actuals; show plan totals as secondary if useful.

## MVP Definition (v1.2)

### Launch With (v1.2)

- [ ] Recurring monthly income (DOM, amount, currency, Person) — core salary case
- [ ] One-time income — same ledger
- [ ] Plan vs actual with independent amount/date — bonuses / early-late
- [ ] Overdue «заполни» highlight — hygiene
- [ ] «Доходы» page + nav — discoverability
- [ ] Actual does **not** change account balances — honesty lock
- [ ] Капитал chart forward projection from recurring + FX as-of — milestone goal
- [ ] Per-counterparty income stats (basic Σ) — locked target feature

### Add After Validation (v1.x)

- [ ] Optional link/note to destination account (still no auto-post)
- [ ] Plan vs actual variance summary chart on Доходы
- [ ] Nav badge: overdue income count
- [ ] Edit/pause/end recurring template without deleting history
- [ ] Shared Person detail: debts + income tabs

### Future Consideration (v2+)

- [ ] Auto-suggest balance snapshot when actual recorded
- [ ] Biweekly / custom schedules
- [ ] Expense/burn alongside income (cash-flow mode)
- [ ] Credit-card payment due overlay in same forecast engine (todo #4 intersection)
- [ ] Bank import

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Recurring monthly + one-time CRUD | HIGH | MEDIUM | P1 |
| Plan vs actual fields | HIGH | MEDIUM | P1 |
| Overdue highlight | HIGH | LOW | P1 |
| «Доходы» page/nav | HIGH | LOW | P1 |
| Person counterparty reuse | HIGH | LOW–MEDIUM | P1 |
| Multi-currency + FX totals | HIGH | LOW (reuse) | P1 |
| NW forecast overlay + FX | HIGH | HIGH | P1 |
| Per-counterparty stats | MEDIUM–HIGH | MEDIUM | P1 |
| Actual→balance auto-post | MEDIUM | HIGH | **Anti / out** |
| Complex payroll schedules | MEDIUM | HIGH | P3 |
| Retirement Monte Carlo | LOW (this app) | HIGH | P3 / never-for-now |
| Bank sync | MEDIUM | HIGH | Out of scope |

**Priority key:** P1 = v1.2 must ship · P2 = soon after · P3 = later

## Competitor Feature Analysis

| Feature | YNAB | Monarch / Simplifi | Wallet v1.2 approach |
|---------|------|--------------------|----------------------|
| Plan income | Scheduled inflow | Recurring paycheck / Spending Plan | Recurring DOM + one-time templates |
| Actual | Register clear/edit | Bank txn or mark | Manual actual amount+date; no bank |
| Overdue / pending | Yellow underfunded / scheduled list | Bills paid markers | «Заполни» when plan date < today & no actual |
| NW forecast | Not core (budget now) | Long-term Forecasting / cash-flow project | Short overlay on Капитал from recurring plan + FX |
| Affects balances | Yes (account register) | Yes (linked accounts) | **No** — side ledger |
| Counterparty | Payee | Merchant/income source names | Reuse `Person` |
| Multi-currency | Weak / single | Varies | Native + primary via dated FX (existing) |

## Existing Wallet Touchpoints

| Existing | Reuse how |
|----------|-----------|
| `Person` | FK on income; stats by person; Restrict delete if linked incomes |
| `Currency` + dated FX + LOCF | Store native minor; convert stats + projection points |
| `computeNetWorthRows` | Baseline “today” NW only; **never** ingest income historically |
| Recharts NW chart on `/` | Extend with forecast segment / second series |
| `/debts` side-ledger UX | Mirror patterns: list, dialogs, DestructiveConfirmStep, Russian copy |
| Moscow calendar dates (`YYYY-MM-DD`) | Plan date, actual date, DOM occurrence materialization |

## Sources

- PROJECT.md Current Milestone v1.2 locks + Out of Scope (income ≠ balance post; forecast ≠ historical LOCF)
- Todo `2026-09-05-add-salary-income-tracking-with-forecast.md` (fixed vs floating; plan date/amount vs actual)
- YNAB scheduled income vs cleared inflows; assigning future income guidance
- Monarch Forecasting help (named income sources, baseline from actuals — longer horizon than Wallet needs)
- Quicken Simplifi Spending Plan (planned vs actual commitments + forward projection)
- COUNT recurring dashboard (Paid / Pending / Overdue; Still Expecting income)
- Multi-currency NW tools (Wealthos / Worthmap pattern: native store, primary convert)
- Codebase: `Person`/`Debt` prisma models; `computeNetWorthRows` isolation precedent (debts)

**Confidence notes:** Table stakes/anti-features HIGH (aligned to locks + side-ledger precedent). Competitor UX MEDIUM (websearch, verified cross-check). DOM edge cases (31st, pause template) → phase-specific research flag.

---
*Feature research for: income/salary plan-vs-actual + NW forecast (Wallet v1.2)*
*Researched: 2026-09-07*
