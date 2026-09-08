# Feature Research

**Domain:** Credit-card grace period / statement obligation + net-worth forecast overlay
**Researched:** 2026-09-08
**Confidence:** HIGH (product locks from PROJECT.md + user intent); MEDIUM (ecosystem UX via web)
**Milestone:** v1.3 Кредитка
**App shape:** Local single-user NW tracker (manual balance snapshots + dated FX); no bank sync; credit = limit + debt already shipped; income forecast overlay (v1.2) is the pattern to extend — not re-list as new

## Expected Behavior (domain norms → Wallet lock)

Industry mental model (RU banks + bill/grace apps):

1. **Cycle template** — recurring billing/grace cycle: statement/cutoff anchor + days (or fixed due DOM) until interest-free pay deadline.
2. **Cycle instance** — each month closes → bank publishes statement with amounts (min pay / «платёж для беспроцентного периода» / full debt).
3. **Amount due (grace-preserving)** — user records the amount that must be paid by due date to keep grace. In connected apps this syncs; in manual apps user types from bank UI/PDF.
4. **Status** — open obligation → paid/closed (full or early); overdue if due passed without close.
5. **Forecast / cash planning** — upcoming obligation hits cashflow/NW projection **from the due date** as planned outflow; clearing it removes the future hit.
6. **Live card debt ≠ statement due** — current outstanding debt (Wallet snapshots) drifts from the frozen statement amount; products that stay honest treat them separately.

Wallet-locked shape (do not fight):

| Intent | Norm match |
|--------|------------|
| Grace START + duration DAYS, monthly repeat | Cycle template (TodayKa/Swipeity/BillWise cutoff→due; RU выписка→льготный) |
| When period ends → **manual** amount due | PocketSmith “adjust when bill arrives”; anti-sync |
| Amount on Капитал «Прогноз» from due date | PocketSmith/Monarch recurring bill foresight; extend v1.2 overlay |
| Early close → forecast drops obligation | Paid/closed clears unpaid bill |
| Amount **never** derived from snapshots | Explicit anti-feature vs “compute from spend” |
| Contract later for exact rules | Bank-specific grace math stays research flag |

Parallel to v1.2 income: schedule → occurrence → manual fact → overdue cue → forecast overlay only (ISO-01 twin). Not YNAB payment-category funding. Not Monarch Spinwheel sync.

## Feature Landscape

### Table Stakes (Users Expect These)

For *this* product shape (manual, local, snapshot NW + existing credit + dashed Прогноз). Missing these = v1.3 feels incomplete.

| Feature | Why Expected | Complexity | Notes / Wallet deps |
|---------|--------------|------------|---------------------|
| Grace cycle on credit account (start date + duration days, monthly) | Every grace/bill tool starts with cycle dates; RU user thinks «дата выписки + N дней» | MEDIUM | Extend existing credit Account; Moscow calendar; month-end edge cases → contract/phase research |
| Generate / list open cycle instances | Users need “this period / next due” not only template fields | MEDIUM | Analog income occurrences; one open cycle per account typical |
| Manual amount due for interest-free window | Without bank sync, statement amount is the only honest source; PROJECT lock | LOW–MEDIUM | Enter after cycle ends; currency = account currency |
| Early close / mark paid (stops forecast) | Paying before due is normal; open obligation must clear | LOW–MEDIUM | Mirror debt early-close / income actual; DestructiveConfirm if destructive |
| Obligation on Капитал «Прогноз» from due date | Core milestone deliverable; capital foresight | HIGH | Extend `nw-forecast` / DashboardChartsShell; **overlay only** — no BalanceSnapshot / historical LOCF rewrite |
| FX honesty on forecast points | Same as income forecast partial banner | MEDIUM | Reuse FX LOCF Maps; exclude/partial if rate missing |
| Overdue / «заполни» when due passed w/o close | Income overdue pattern; otherwise silent interest risk | LOW–MEDIUM | Highlight on credit UI; optional nav badge later |
| Keep credit limit + debt snapshots unchanged by grace entries | Debt SoT stays snapshots; grace is obligation ledger | LOW (policy) | Grace amount ≠ auto debt delta |
| Russian-first copy for cycle / due / paid | App constitution | LOW | Align with Капитал / Доходы vocabulary |

### Differentiators (Advantage for *this* app)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Grace obligations as NW **forecast overlay** (not budget category, not bill calendar alone) | Capital app sees *when* NW dips for grace pay — rare vs YNAB/Monarch | HIGH | Compose with income forecast slots; dashed «Прогноз» already shipped |
| Manual amount due + early close as first-class (no sync lie) | Fits Docker/SQLite honesty; no Plaid/Spinwheel | LOW–MEDIUM | Product philosophy differentiator |
| Isolation: grace never rewrites past NW (ISO-01 sibling) | Same trust model as income INISO | LOW (policy) | Hard assert in tests like income |
| Credit debt (snapshot) + grace due (cycle) side-by-side | User sees “owe now” vs “must pay by date to keep grace” | MEDIUM | UX: two numbers, one account — avoid conflation |
| Contract-driven cycle rules (user supplies bank PDF) | Avoid wrong revolving/per-purchase grace guesses | Research gate | Document before plan lock; may refine start/duration semantics |

### Anti-Features (Seem Good, Wrong for v1.3)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Derive amount due from balance-snapshot history | “App should know spend” | Snapshots ≠ statement; mid-cycle debt ≠ grace pay; PROJECT Out of Scope | Manual entry from bank statement line |
| Bank / CSV / Plaid sync of statement | Less typing | Cloud/auth path; deferred | Manual CRUD |
| Full APR / penalty / revolving interest engine | “Show cost of missing grace” | Contract-complex; scope explosion | Grace track + forecast only unless contract forces |
| Auto-update debit/credit BalanceSnapshot on pay | “Money moved” | Breaks snapshot SoT; double-count | User edits balances separately; close only clears obligation |
| Minimum payment vs statement vs full-debt triad UI | Bank statements show all three | Extra states; v1.3 cares about grace-preserving amount | One manual “сумма к оплате до конца льготного” field |
| Per-purchase / per-transaction grace windows | Some cards work that way | Needs tx ledger Wallet doesn’t have | Monthly cycle only until contract says otherwise |
| “Which card to swipe” max interest-free optimizer | TodayKa/Swipeity core | Different product; multi-card strategy | Out of scope |
| YNAB-style payment category funding from spends | Budgeters expect it | Requires categories + register | Not this product |
| Merge obligation into historical `computeNetWorthRows` | “Past should show the bill” | Lies about account balances | Forecast overlay from due date forward only |
| Push / email due reminders | BillWise/Monarch habit | No notif infra in local Docker | In-app overdue highlight |
| Auto-create next cycle amount as average of past | PocketSmith average budget | Invents money; conflicts with manual lock | Blank amount until user enters |
| Multi-card utilization / credit-score coaching | Cardue/CardCycle | Analytics creep | Limit + debt already enough |

## Feature Dependencies

```
Credit account: limit + debt (shipped v1.0)
    └──requires──> Grace cycle template on credit account
                       └──requires──> Cycle instances + manual amount due
                           └──requires──> Early close / paid status
                               └──requires──> Прогноз overlay from due date

Income forecast overlay + FX LOCF (shipped v1.2)
    └──enhances──> Credit obligations share same dashed Прогноз series / partial FX banner
    └──conflicts──> Feeding grace into historical NW LOCF (ISO-01)

Balance snapshots (shipped)
    └──conflicts──> Deriving amount due from snapshots
    └──enhances──> Display debt vs grace due as separate facts

Bank contract study (user supplies)
    └──requires──> Exact start/duration / statement semantics before plan lock
```

### Dependency Notes

- **Grace template requires credit account:** Only credit type gets cycle fields; debit/crypto/cash unchanged.
- **Amount due requires cycle instance:** Template alone cannot hit forecast; need dated due + amount.
- **Прогноз requires open obligation with due date + amount:** Closed/early-paid excluded from series (like income actual clears plan slot).
- **Shared forecast infra enhances credit:** Reuse `nw-forecast` composition, hinge, dashed Line — do not invent second chart system.
- **Snapshots conflict with derivation:** Debt LOCF remains independent; paying grace is not automatic debt=0.
- **Contract study gates cycle math:** Start+days monthly is the product intent; bank may define “start” as statement day vs purchase day — document before implementation lock.

## MVP Definition

### Launch With (v1.3)

Minimum to validate locked intent.

- [ ] Grace START + duration DAYS on credit account; monthly repeat — cycle template
- [ ] Manual amount due when period ends — obligation instance
- [ ] Early close / paid — removes open obligation
- [ ] Капитал «Прогноз» includes open obligations from due date (FX LOCF honesty)
- [ ] Historical NW / BalanceSnapshot unaffected (forecast overlay only)
- [ ] Bank contract notes captured before rule lock (may be doc-only phase)

### Add After Validation (v1.3.x / next)

- [ ] Overdue highlight / nav cue when due passed w/o close — trigger: first real missed cycle
- [ ] Multi-credit-card cycle list on one screen — trigger: >1 credit account in use
- [ ] Edit amount due after entry (correction) — trigger: user typos from statement
- [ ] Partial pay of grace amount — trigger: contract or user asks; else keep binary open/closed

### Future Consideration (v2+)

- [ ] Bank/CSV import of statement amount + due
- [ ] Interest/penalty calculator from contract APR
- [ ] Suggest balance snapshot after pay (still manual confirm)
- [ ] Per-transaction grace / which-card optimizer
- [ ] Min vs grace vs full debt breakdown UI

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Grace start + days monthly | HIGH | MEDIUM | P1 |
| Manual amount due | HIGH | LOW–MEDIUM | P1 |
| Early close clears forecast | HIGH | LOW–MEDIUM | P1 |
| Прогноз overlay from due date | HIGH | HIGH | P1 |
| Overlay-only isolation (no NW rewrite) | HIGH | MEDIUM | P1 |
| Contract study before rule lock | HIGH | LOW (research) | P1 |
| Overdue UI | MEDIUM | LOW | P2 |
| Edit/correct amount due | MEDIUM | LOW | P2 |
| Partial payments | LOW–MEDIUM | MEDIUM | P3 |
| Interest engine / bank sync / swipe optimizer | LOW (for this product) | HIGH | P3 / never in v1.3 |

**Priority key:**
- P1: Must have for v1.3 launch
- P2: Should have soon after core works
- P3: Nice / defer

## Competitor Feature Analysis

| Feature | YNAB | Monarch Bill Sync | PocketSmith | Grace apps (TodayKa/Swipeity) | Wallet v1.3 |
|---------|------|-------------------|-------------|-------------------------------|-------------|
| Cycle dates | Not primary | Due date (+ statement via bureau) | Via budgets/calendar | Statement + due core | START + days monthly |
| Amount due source | Payment category from spends | Synced statement / min | Manual/avg budget then adjust | Often N/A (date focus) | **Manual only** |
| Paid / close | Transfer to CC | Auto when txn matches | Budget vs actual | Reminders | Manual early close |
| NW / cash forecast | Budget available, not grace NW | Recurring calendar | Transfer budget → forecast | Rarely NW | **Dashed Прогноз on Капитал** |
| Bank sync | Optional import | Required for Bill Sync | Optional | Usually none | **None** |
| Interest engine | No | No | No | Some APR toys | **Out of scope** |

## Categories for Requirements Scoping

Use these buckets when writing REQUIREMENTS / phase plans:

| Category | Includes | Excludes |
|----------|----------|----------|
| **Cycle config** | Start date, duration days, monthly recurrence, credit-account binding | Per-txn grace, multi-cutoff optimizers |
| **Obligation entry** | Manual amount due, due date derived from cycle, edit/correct | Snapshot-derived amounts, min/full triad |
| **Lifecycle** | Open → paid/early-close; overdue cue | Auto-pay detection, partial-pay (unless promoted) |
| **Forecast overlay** | Include open obligations from due date; FX partial; compose with income | Historical LOCF rewrite, hero current-NW mutation |
| **Isolation / SoT** | Snapshots remain debt SoT; grace ledger separate | Auto balance bumps on close |
| **Contract research** | Document bank grace rules before lock | Guessing revolving semantics |

## Sources

- PROJECT.md v1.3 locks (manual amount, forecast overlay, contract study) — HIGH
- Todo `2026-09-05-improve-credit-account-type-with-limit-grace-period-and-fore.md` — HIGH (problem statement)
- Monarch Bill Sync help/blog (statement balance, min due, paid detection) — MEDIUM
- YNAB credit-card payment model (category funding, not statement dates) — MEDIUM
- PocketSmith CC transfer budgets + NW forecast (adjust when bill arrives) — MEDIUM
- TodayKa / Swipeity / BillWise (manual cycle dates, interest-free focus) — MEDIUM
- T-Bank / VTB / Sovcombank grace & statement explainers (расчётный → выписка → льготный; платёж для беспроцентного) — MEDIUM

---
*Feature research for: Wallet v1.3 credit grace + forecast obligations*
*Researched: 2026-09-08*
