# Pitfalls Research

**Domain:** Adding credit-card grace-period tracking + forecast obligations to existing LOCF NW + income-forecast Wallet
**Researched:** 2026-09-08
**Confidence:** HIGH (codebase integration / stock-vs-flow); MEDIUM (bank grace semantics pending contract)
**Milestone:** v1.3 Кредитка

## Critical Pitfalls

### Pitfall 1: Stock/flow double-count — subtract amount-due while debt already in NW

**What goes wrong:**
Капитал «Прогноз» subtracts grace `amountDue` from today’s LOCF NW anchor. Credit debt already reduces NW via `computeNetWorthRows` (limit − available). Forecast dips by the payment **again**. User thinks capital will crash by the bill size; truth for pay-from-own-assets is ≈ **NW-neutral** (cash↓, debt↓). Worse if income overlay still adds salary that same week — chart mixes incompatible assumptions.

**Why it happens:**
Income forecast taught “overlay = cash delta on NW line.” Credit obligation looks like another cash event. Budget/cash-flow muscle memory (YNAB: payment as expense) fights balance-sheet model already shipping debt as liability stock. Product copy says “obligation appears on Прогноз” without defining the **signed NW semantics**.

**How to avoid:**
- Lock overlay math before UI: preferred default for internal pay = **paired transfer** (asset out + credit debt down) → **net 0 NW step**, with obligation shown as marker / annotation / separate cash-need series — OR document a single explicit model and test it.
- Never treat amount-due as a **second liability** stacked on LOCF debt.
- If modeling only cash-out (no debt reduction), banner must say debt snapshot still includes that balance (partial / dishonest otherwise).
- Unit tests: fixture with debt D and amountDue ≤ D → forecast NW must not fall by D+amountDue.

**Warning signs:**
- `ForecastSlot` only has positive `plannedAmountMinor` reused as “always add”; credit forced through same adder with a minus and no debt leg
- Golden: NW after due date = anchor − amountDue while credit LOCF debt unchanged in story
- Tooltip: «обязательство» explained as «капитал упадёт на сумму платежа»

**Phase to address:**
Contract/domain math for overlay semantics (before CRUD) + Капитал forecast integration

---

### Pitfall 2: Baking grace into historical LOCF / BalanceSnapshot (break ISO-01 twin)

**What goes wrong:**
Grace amount-due / early-close writes `BalanceSnapshot`, mutates credit available, or folds into `computeNetWorthRows` / past `buildNetWorthSeries`. Past Капитал jumps; Core Value dies. Same class as income ISO-01 / debts DISOL-01.

**Why it happens:**
“Payment recorded → debt should drop.” Auto-bump temptation. Todo originally floated deriving spend from cycle → balance.

**How to avoid:**
- PROJECT lock: grace entries = **forecast overlay only**; never write BalanceSnapshot / never change past LOCF.
- Mirror INISO: file-scan tests — `net-worth.ts` / `historical-series.ts` must not import grace domain; grace actions never touch snapshot tables.
- RU copy on amount-due / early-close: «снимок долга по счёту не меняется — обновите вручную».

**Warning signs:**
- Server actions import balance mutations
- Past series fixtures change when grace rows added
- Hero NW jumps on grace save without new balance event

**Phase to address:**
Schema + actions (lock) and milestone isolation regression

---

### Pitfall 3: Interest-free vs revolving confusion (and premature interest engine)

**What goes wrong:**
App assumes every cycle stays interest-free; treats min payment as “grace OK”; auto-derives due from current debt; or ships full APR/penalty math before bank contract. User trusts wrong dates/amounts. RU reality: льготный = расчётный + платёжный; full statement payoff ≠ минимальный платёж; cash advances often outside grace; carrying balance can void grace on new purchases.

**Why it happens:**
Marketing “N days without %” oversimplifies. Western “grace period” docs and RU bank schemes differ (fixed vs floating, per-purchase vs statement). Implementers guess instead of reading contract.

**How to avoid:**
- User lock: **manual amount due**; **forecast only**; **contract study before plan lock**.
- Out of scope until contract forces: revolving interest, trailing interest, min-payment engine, restore-grace rules.
- UI vocabulary: «сумма к погашению до конца льготного» ≠ «весь долг по снимку» ≠ «минимальный платёж» — three labels if both debt and amount-due shown.
- Document bank-specific rules in CONTEXT after user supplies contract; do not hard-code VTB/Raiffeisen defaults as product truth.

**Warning signs:**
- Schema fields for APR / daily rate in v1.3
- Amount-due auto-filled from `creditDebtMinor(limit, available)`
- Copy promising «без процентов» without caveats

**Phase to address:**
Discuss / contract study (before schema lock) + domain CRUD copy

---

### Pitfall 4: Deriving amount due from balance-snapshot history

**What goes wrong:**
Cycle spend inferred from LOCF available deltas. Misses cashless timing, multi-account pays, partial early repayments, purchases outside grace, FX, backdated snapshots. Amount wrong; user fights the app.

**Why it happens:**
Todo suggested “calculate from spend in billing cycle.” Snapshot model is not a transaction ledger — PROJECT out-of-scope for v1.3.

**How to avoid:**
- Manual entry only when period closes (product lock).
- Optional later: import/statement — not this milestone.
- If UI shows current debt as hint, label «подсказка, не автозаполнение» and never write it without confirm.

**Warning signs:**
- `amountDue = f(snapshots)` in lib
- Tests asserting due equals debt LOCF

**Phase to address:**
Schema / amount-due CRUD (first write path)

---

### Pitfall 5: Calendar — wrong operator for start vs due (DOM clamp vs +days)

**What goes wrong:**
Monthly **start** day uses RRULE skip (Feb has no 31 → hole) or due date uses income `clampDayOfMonth` on a “due DOM” instead of **start + duration days**. Or duration applied in local TZ / `Date` month arithmetic. Due dates drift vs bank; Moscow midnight flicker like income Pitfall 9.

**Why it happens:**
v1.2 locked DOM clamp for salary. Grace model is **start DOM (monthly) + N calendar days** — different operators. Easy to reuse one helper for both.

**How to avoid:**
- Start occurrence: `clampDayOfMonth(y, m, startDay)` (reuse income policy).
- Due: `addCalendarDays(startAsOf, graceDays)` (existing UTC-safe helper) — **not** clamp of startDay+graceDays as DOM.
- All “today” / overdue via `calendarDateToday("Europe/Moscow")`.
- Vitest matrix: start=31 × Feb; start=15 + 25 days across month boundary; leap/non-leap.

**Warning signs:**
- Missing March cycle after Jan 31 start
- Due always lands on same calendar day-of-month as start
- `new Date().toISOString().slice(0,10)` in grace code

**Phase to address:**
Grace schedule / domain math (before forecast wiring)

---

### Pitfall 6: Income + credit slots collide in one unsigned ForecastSlot

**What goes wrong:**
Credit obligations pushed through income-only `ForecastSlot` (always `+=`). Signs flip ad hoc in UI. Same-day salary + card due cancel silently or double. Partial FX banner attributes wrong domain. Closed/early-paid cycles still in open slot list.

**Why it happens:**
Phase 17 builder is income-shaped. Fastest path = shove credit into `slots[]`.

**How to avoid:**
- Extend slot model with **direction** (`inflow` | `outflow`) **and** explicit netting rules — or separate builders composed at chart layer.
- Open credit obligation = unpaid period with due in (today, horizon]; early close → exclude.
- Same-day: define sum order + tooltip breakdown (income vs grace).
- Keep `nw-forecast.ts` import wall (no Prisma); grace listAll filtered in caller like income.

**Warning signs:**
- Credit amounts always positive in `buildNetWorthForecastSeries`
- Early close leaves dashed dip on chart
- One banner for “excluded FX” mixing USDT salary and EUR card

**Phase to address:**
Forecast integration phase (after period CRUD exists)

---

### Pitfall 7: Early close / period identity bugs (orphan obligations)

**What goes wrong:**
User records early repayment; forecast still carries amount. Or closing one cycle closes all. Or new month auto-opens with stale amount from prior. Overdue highlight stuck after close.

**Why it happens:**
Occurrence identity unclear (`accountId + year-month` vs statement id). Close mutates template instead of period instance. Mirror of income “plan mutated by actual.”

**How to avoid:**
- Period instance identity: stable id; status open|closed; amountDue on instance; closeAsOf optional.
- Forecast: only **open** instances with due > today (or ≥ policy) inside horizon.
- Template (start day + days) edits affect **future** gens, not closed history.
- Overdue: due < moscowToday AND still open — clear on close regardless of close date drift.

**Warning signs:**
- Single amount field on Account, no period table
- Close = delete row (loses audit) without product decision
- Two open amounts for same month

**Phase to address:**
Schema + early-close actions + forecast filter

---

### Pitfall 8: Confusing grace obligations with «Долги» people ledger

**What goes wrong:**
Grace due appears under /debts, creates Person, or DISOL broken by routing card bills into personal-debt NW-adjacent UI. Or opposite: personal debts start showing on Капитал forecast “because obligations.”

**Why it happens:**
Both are “money I owe by a date.” Schema convenience.

**How to avoid:**
- Grace belongs to **credit Account** domain; never Person/Debt tables.
- Forecast credit obligations ≠ debt side ledger (DISOL stays).
- Nav/copy: кредитка льготный ≠ долги людям.

**Warning signs:**
- FK from grace period → Person
- Debts page lists card cycles

**Phase to address:**
Schema boundary (first phase)

---

### Pitfall 9: FX dishonest on multi-currency credit obligations

**What goes wrong:**
Same Phase 4/11/17 trap: invent rate, use 1, convert with wrong as-of, or silent drop. Credit card in USD/EUR on RUB primary — forecast looks precise, wrong.

**Why it happens:**
Future due has no FxRate row; reuse income path incompletely.

**How to avoid:**
- LOCF rate as-of **today** (match income forecast D-13) or documented policy; missing → exclude + shared/partial banner (extend copy for credit).
- BigInt minor + `convertOtherMinorToPrimaryMinor`.
- Never invent rates.

**Warning signs:**
- Hard-coded `1n` rate
- Foreign card due vanishes with no banner
- Banner only mentions «доходы»

**Phase to address:**
Forecast integration + Капитал chrome

---

### Pitfall 10: Skipping contract study → wrong cycle shape locked in schema

**What goes wrong:**
Schema assumes “one start DOM + fixed days forever.” User’s bank uses purchase-dated grace, multiple overlapping льготные, statement cut ≠ calendar month, or weekend due shifts. Costly migration mid-milestone.

**Why it happens:**
PROJECT requires contract before lock; pressure to plan from generic Experian/VTB articles.

**How to avoid:**
- Gate: no PLAN lock on cycle math until contract notes in CONTEXT.
- Prefer flexible fields (startAsOf rule + durationDays + manual amount) over hard-coded bank formulas.
- If contract reveals non-monthly / per-purchase grace, escalate scope — do not silently approximate.

**Warning signs:**
- Roadmap phases start without `CONTRACT.md` / CONTEXT bank section
- Enum of bank brands in schema

**Phase to address:**
Pre-roadmap discuss / first research-backed phase zero

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Reuse income `ForecastSlot` unsigned | Ships chart fast | Sign bugs; tooltip lies; hard to net | Only with explicit direction + tests |
| Auto-fill amountDue from debt LOCF | Less typing | Wrong grace amount; trains bad trust | Hint only, never silent write |
| Interest fields “for later” in schema | Feels complete | Unused columns; wrong mental model | Never until contract forces |
| Materialize 12 months of periods | Fast UI | Stale after template edit | OK if regenerate-on-edit; else on-read |
| Put grace math in `page.tsx` | Fast | Untestable; breaks isolation | Never — pure lib |
| Treat payment as NW−amountDue only | Simple stair | Permanent double-count | Never without paired debt leg or non-NW annotation |
| Skip Moscow helper | Fewer imports | Overdue flicker | Never |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| `computeNetWorthRows` | Add grace contribution rows | Untouched; debt only from LOCF available |
| `buildNetWorthSeries` | Sample grace dues in past | Keep ≤ today; overlay only |
| `buildNetWorthForecastSeries` | Blind minus amountDue | Define stock/flow netting; test NW-neutral pay |
| Income forecast slots | Merge without direction | Typed inflow/outflow or compose series |
| `BalanceSnapshot` | Write on amount-due / close | No writes (ISO twin) |
| `locfRateAsOf` | Invent future FX | LOCF + partial banner |
| `clampDayOfMonth` | Use for due date | Start only; due = `addCalendarDays` |
| `calendarDateToday` | UTC date string | Europe/Moscow |
| Debt / Person | Store card bills as debts | Credit-account periods only |
| INISO / DISOL tests | No grace scan | Extend file-scan + golden past series |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Dense daily series for grace | Slow Капитал | Sparse: today ∪ due dates ∪ horizon (like income) | Multi-year × many cards |
| N+1 periods per account | Slow dashboard | Batch periods; Map by accountId | Many closed cycles retained |
| Recompute all cycles on every hover | UI jank | Memoize pure builder inputs | Harmless at single-user until careless |

Single-user SQLite: correctness > scale; still keep sparse forecast.

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| `window.confirm` on delete period / close | Accidental wipe; constitution break | DestructiveConfirmStep + RU loss copy |
| Trust client `today` for overdue | Wrong highlight | Server Moscow calendar |
| Unvalidated graceDays 0 / huge | Corrupt dues | Zod bounds + tests |
| Client-supplied amount without Zod major→minor | Float / negative debt weirdness | BigInt boundary like income |

Local single-user: money integrity + destructive UX still bind.

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Forecast dip = “I lose NW by bill” | Panic / wrong savings plan | Explain transfer vs spend; NW-neutral if pay from tracked cash |
| Amount due vs snapshot debt unlabeled | User enters wrong number | Show both with clear RU labels |
| Min payment language | Loses grace in real bank | Copy: полная сумма льготного, not минимум |
| Early close looks like delete | Lost history | Close status + История |
| Obligation looks like «Долги» | Wrong nav | Stay on credit account / Капитал only |
| No FX banner for card currency | False precision | Reuse/extend partial forecast banner |
| Dashed line unexplained for credit | Mix with income | Legend: доходы / обязательства / or combined with breakdown |

## "Looks Done But Isn't" Checklist

- [ ] **Stock/flow:** Paying amountDue from own assets does not drop forecast NW by full bill **on top of** existing credit debt (golden test)
- [ ] **ISO twin:** Grace fixtures do not change `buildNetWorthSeries` points ≤ today
- [ ] **No snapshot writes:** amount-due / early-close → zero BalanceSnapshot mutations
- [ ] **Manual amount:** No auto-derive from LOCF debt (hint OK)
- [ ] **Calendar:** start DOM-31 → Feb clamp; due = start + days via `addCalendarDays`
- [ ] **Moscow overdue:** due yesterday + open → highlight; early close → clear
- [ ] **Early close:** obligation removed from forecast slots
- [ ] **Income coexistence:** same-day salary + due has defined net + tooltip
- [ ] **FX partial:** foreign card due missing rate → exclude + banner
- [ ] **Not in Долги:** no Person/Debt coupling
- [ ] **Contract gate:** cycle rules documented from user bank agreement before lock
- [ ] **Destructive confirm:** period delete / irreversible close uses in-dialog second step
- [ ] **Isolation tests:** grace module not imported from `net-worth.ts` / `historical-series.ts`

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Double-count NW forecast | MEDIUM | Fix netting math; recalculate display only; educate via banner |
| Grace in historical NW / snapshots | HIGH | Stop writes; delete grace-tagged snapshots if any; restore ISO tests |
| Wrong calendar operator | LOW | Fix helpers + backfill due dates |
| Revolving engine shipped early | HIGH | Feature-flag off; strip schema; wait for contract |
| Auto-derived amounts | MEDIUM | Clear derived rows; require manual re-entry |
| Slots unsigned collision | LOW | Add direction + regression tests |
| Contract mismatch | HIGH | Migrate period model; may need milestone scope change |

## Pitfall-to-Phase Mapping

Suggested v1.3 phase topics (roadmap may renumber):

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Contract / interest-free vs revolving / no APR engine | **0 — Bank contract study + CONTEXT locks** | Contract notes exist; out-of-scope interest explicit |
| Period identity / manual amount / BigInt / not Долги | **Grace schema + domain math** | Vitest: instance status, minor math, no Person FK |
| DOM clamp start + addCalendarDays due / Moscow | **Schedule generation** | Feb/31 + duration matrix; TZ boundary |
| No BalanceSnapshot / ISO twin | **Amount-due + early-close actions** | Action tests: snapshots untouched; close clears open |
| Stock/flow netting / income slot composition / FX banner | **Капитал forecast integration** | Golden: no double liability; partial FX; early close |
| Chart legend / RU copy / destructive confirm | **Капитал + credit UI** | Legend + confirm step; copy distinguishes debt vs due |
| Isolation regression | **Milestone closure** | File-scan like `iniso.test.ts`; VALIDATION green |

**Ordering rationale:** Contract before schema; schedule math before CRUD; overlay semantics before chart polish; isolation last to catch late coupling into `net-worth.ts`.

## Sources

- Wallet locks: `.planning/PROJECT.md` (v1.3 manual amount; forecast overlay only; contract study; no revolving engine)
- Codebase: `src/lib/net-worth.ts` (credit debt reduces NW), `src/lib/nw-forecast.ts` (income-shaped unsigned slots), `src/lib/dates.ts` (`clampDayOfMonth` / `addCalendarDays` / Moscow), `src/lib/iniso.test.ts` (ISO pattern to mirror)
- Prior research: `.planning/research/PITFALLS.md` v1.2 income (ISO, DOM, FX, chart fact/forecast) — patterns reused, not replaced
- Todo: `.planning/todos/pending/2026-09-05-improve-credit-account-type-with-limit-grace-period-and-fore.md` (derive-from-spend risk; contract need)
- Grace vs revolving: Experian / Wealthsimple / WalletHub (carry balance voids grace) — confidence MEDIUM
- RU льготный = расчётный + платёжный; min ≠ full: VTB, Raiffeisen wiki, RG ProДеньги — confidence MEDIUM (not a substitute for user contract)
- Stock/flow / payment-as-transfer: YNAB credit payment guides; budget double-count articles — confidence MEDIUM
- Valuation double-count analogy (liability already in bridge): EV–equity bridge literature — confidence LOW for product UI, useful metaphor only

---
*Pitfalls research for: Wallet v1.3 Кредитка (grace periods + forecast obligations on LOCF + income-forecast app)*
*Researched: 2026-09-08*
