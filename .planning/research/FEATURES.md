# Feature Research

**Domain:** Local net-worth tracker — savings account type + monthly interest NW forecast (Wallet v1.5)
**Researched:** 2026-09-11
**Confidence:** HIGH (PROJECT.md locks + existing income/grace forecast code); MEDIUM (competitor / bank ecosystem)

**Scope:** NEW v1.5 surfaces only — `SAVINGS` account type, annual % + accrual DOM, dashed «Прогноз» interest overlay, PARITY-01 MCP reads. Do **not** re-list shipped capital/debts/income/grace/MCP host features except as **dependencies**.

## How savings + interest forecast typically work

**Bank mental model (RU накопительный / HYSA peers):**
- User sees **annual %**; bank often accrues on daily or minimum balance, then **credits** once per month on a fixed day or open-anniversary cycle.
- Credited interest becomes part of the live balance — in bank apps that happens server-side.

**NW / personal-finance apps (YNAB, Empower, Monarch, NetWorthCast):**
- Most **do not** simulate bank accrual DOM on the capital chart.
- Interest shows up either via **synced balance** after the bank credits it, or via a **growth/return rate** used only in **goals / multi-year projections** (Monarch Goals: compound `(1+r)^(1/12)-1`; defaults ~3% savings). YNAB has no interest projection. Empower projects retirement scenarios, not per-account accrual days.
- Apps almost never auto-write historical ledger rows from accrual math when the product is snapshot-based.

**Wallet lock (fits local snapshot tracker):**
1. Distinct account type `SAVINGS` (asset in NW, like debit — not a flag on `FIAT_DEBIT`).
2. Fields: annual % + day-of-month accrual.
3. Expected credit = `balance × rate / 12` (simple monthly; not APY compound, not daily).
4. Future credits land only on Капитал dashed «Прогноз» — **same isolation family as income (INISO) / grace (GRISO)**.
5. When bank actually pays, user **manually** updates `BalanceSnapshot` — app never invents history.
6. New read surfaces → matching read-only MCP tools (PARITY-01).

## Feature Landscape

### Table Stakes (Users Expect These)

Missing any → v1.5 feels incomplete for a savings milestone.

| Feature | Why Expected | Complexity | Notes / deps on existing |
|---------|--------------|------------|--------------------------|
| Distinct `SAVINGS` account type | User lock; peers treat savings as first-class asset class; flag-on-debit confuses UI + MCP filters | MEDIUM | Extends Prisma `AccountType`, soft-read helpers (`account-type.ts`), NW asset inclusion (`net-worth.ts` / LOCF), account create/edit UI |
| Annual interest rate on SAVINGS | Banks quote % годовых; without rate forecast is empty | LOW | SAVINGS-only field (mirror credit-limit / grace DOM FIAT_CREDIT-only pattern); validate >0 or ≥0 per product lock |
| Accrual day-of-month | RU/bank payday mental model; income already uses DOM | LOW | Reuse `clampDayOfMonth` from `dates.ts` (income + grace already ship clamp) |
| SAVINGS balances in NW like other assets | Savings is capital, not a side ledger | LOW | Same asset path as `FIAT_DEBIT` / `CASH` / `CRYPTO`; no DISOL exclusion |
| Manual dated BalanceSnapshot for SAVINGS | Snapshot SoT already expected for all accounts | LOW | Existing account balance CRUD — no new mutation model |
| Expected monthly interest = `balance × annualRate / 12` | Standard simple monthly approximation; user lock | LOW–MEDIUM | Principal = LOCF balance as-of accrual date (or today-anchor policy — phase research); bigint minors + scale |
| Interest points on Капитал dashed «Прогноз» | Users already learned overlay from income + A′ grace | MEDIUM | Extend `ForecastSlotKind` / `buildNetWorthForecastSeries` in `nw-forecast.ts`; chart already renders dashed forecast |
| Past accrual dates do **not** rewrite historical NW | Same honesty as INISO/GRISO — overdue interest = reminder to update balance, not invented LOCF | MEDIUM | Isolation twin (name TBD, e.g. SAVISO); never-calls BalanceSnapshot from forecast path |
| FX LOCF honesty for non-primary SAVINGS | Forecast already excludes missing FX + partial banner | LOW–MEDIUM | Same gate as income slots in `nw-forecast.ts` |
| Rate + accrual day visible on account UI | Without display, type is opaque | LOW | Account list/detail + create/edit forms; Russian copy |
| MCP read parity for new surfaces | PARITY-01 standing rule | LOW–MEDIUM | Extend `list_accounts` metadata; extend `get_forecast_overlay` events with interest kind; optional list/detail if UI adds dedicated surface |

### Differentiators (Advantage for *this* app)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| DOM-timed interest on capital «Прогноз» | Peers push growth into goals/FIRE charts; Wallet shows **when** next credit hits NW stair-step | MEDIUM | Accrual DOM + horizon membership fold (income pattern: future slots only) |
| Unified overlay stack (income + grace A′ + savings interest) | One dashed line answers “what moves NW next?” | MEDIUM | Add `kind: "interest"` (or `"savings"`) events; keep ΔNW = +interest (unlike grace A′ ΔNW=0) |
| Forecast-only / no auto-snapshot (INISO twin) | Snapshot honesty preserved; user stays SoT after bank credits | LOW–MEDIUM | Explicit anti-auto-post — rare vs “set rate and forget” compound apps |
| Typed `SAVINGS` + rate metadata (not debit flag) | Clean filters, MCP schemas, credit-only vs savings-only field invariants | LOW | Matches FIAT_CREDIT metadata discipline |
| Isolation regression tests | Prevent forecast path from writing history | LOW | Twin of `iniso.test.ts` / `griso.test.ts` |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Auto `BalanceSnapshot` on accrual day | “Then NW history matches forecast” | PROJECT OOS; invents money; breaks LOCF trust; twin of income auto-post trap | Forecast overlay only; user updates balance after bank credit |
| Compound / daily accrual engines | “Match bank APY / ежедневный остаток” | High complexity; RU bank rules vary (min vs daily balance, anniversary cycles); OOS | Simple `rate/12` monthly credit; defer engines |
| Flag `isSavings` on `FIAT_DEBIT` | “Fewer enum values” | User lock against; muddies type filters + field invariants | New `SAVINGS` enum value |
| Savings goals / target dates | Monarch-style goal growth | Separate product surface; OOS for v1.5 | Defer goals; capital forecast only |
| Timezone picker for accrual | “Correct midnight” | Acknowledged debt; Moscow calendar still default | Keep existing calendar convention |
| MCP write tools for rate / balance | Agent updates after credit | MCP writes OOS | Read-only tools; UI mutate |
| Model as income side-ledger | “Interest is income” | Income never touches account balances (INISO); savings interest **is** capital growth expectation on an account | Account-typed forecast slots, not `RecurringIncome` |
| Simulate min-balance / daily-balance bank rules | Match Sber накопительный | Needs transaction history Wallet doesn’t have | Approximate from LOCF snapshot balance |
| Variable / welcome rate schedules | Banks change rates + надбавки | Schema + UX explosion | Single annual % field; user edits when rate changes |
| Tax withholding (НДФЛ) on interest | RU deposit tax reality | Out of NW tracker scope | Ignore; show gross expected credit |
| Legend split доходы vs % vs grace on chart | Clarity | Deferred tech debt already noted | Single dashed «Прогноз»; event tooltips distinguish kinds |

## Feature Dependencies

```
Account CRUD + AccountType enum
    └──requires──> SAVINGS type + rate% + accrualDayOfMonth fields
                       └──requires──> Balance LOCF (principal for × rate/12)
                       └──requires──> clampDayOfMonth (dates.ts)
                              └──requires──> Interest forecast slots
                                     └──requires──> nw-forecast.ts + NetWorthHistoryChart «Прогноз»
                                     └──enhances──> FX LOCF partial banner
                                     └──conflicts──> Auto BalanceSnapshot / historical LOCF rewrite

Existing income + grace overlay
    └──enhances──> Shared dashed series (new event kind)

UI read surfaces (account + forecast)
    └──requires──> MCP read tools same milestone (PARITY-01)
```

### Dependency Notes

- **SAVINGS type requires account CRUD + NW asset path:** New enum must soft-read safely and sum as asset like debit/cash/crypto.
- **Interest amount requires balance LOCF:** Principal is latest snapshot as-of accrual date (policy detail for phase research — today-anchor vs as-of-slot).
- **Accrual DOM requires `clampDayOfMonth`:** Same Feb-31 clamp as recurring income / grace statement DOM.
- **Forecast overlay requires `nw-forecast.ts`:** Extend slot kinds; keep import wall (no DB clients inside pure builder).
- **Interest ΔNW conflicts with grace A′ semantics:** Interest **adds** expected NW; grace stays ΔNW=0 — do not reuse A′ math.
- **Interest forecast conflicts with auto-snapshot:** Same wall as INISO/GRISO — overlay never writes `BalanceSnapshot`.
- **MCP requires UI read surface:** PARITY-01 — ship tools in same milestone as user-visible reads.

## MVP Definition

### Launch With (v1.5)

Minimum for milestone goal — savings visible in capital + honest interest forecast.

- [ ] `SAVINGS` account type + CRUD (name, currency, rate%, accrual DOM) — essential type lock
- [ ] SAVINGS in NW totals / history like other assets — capital truth
- [ ] Monthly expected interest `balance × rate / 12` on accrual DOM — core math
- [ ] Dashed «Прогноз» overlay includes future interest credits — user-visible value
- [ ] No auto BalanceSnapshot / no historical LOCF rewrite (isolation twin) — trust wall
- [ ] MCP read parity for new account fields + forecast interest events — PARITY-01

### Add After Validation (v1.x)

- [ ] Overdue accrual UX (“проценты должны были капнуть — обнови баланс”) — after users miss credits
- [ ] Chart legend / tooltip polish separating income vs interest vs grace — deferred legend debt
- [ ] Rate history (dated rate changes) — if users change % often
- [ ] Optional compound monthly `(1+r)^(1/12)-1` toggle — only if simple /12 drifts vs bank statements

### Future Consideration (v2+)

- [ ] Daily / min-balance engines — needs richer balance history
- [ ] Auto-snapshot on accrual — only if user explicitly opts in later
- [ ] Savings goals with target dates — separate milestone
- [ ] Tax / НДФЛ netting — out of NW core
- [ ] MCP writes — after read-only proven

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| `SAVINGS` type + rate% + accrual DOM CRUD | HIGH | MEDIUM | P1 |
| Asset NW inclusion for SAVINGS | HIGH | LOW | P1 |
| `balance × rate / 12` expected credit | HIGH | LOW–MEDIUM | P1 |
| «Прогноз» interest overlay slots | HIGH | MEDIUM | P1 |
| Isolation twin (no auto-snapshot / no LOCF rewrite) | HIGH | LOW–MEDIUM | P1 |
| MCP read parity (accounts + forecast events) | HIGH | LOW–MEDIUM | P1 |
| Account UI shows rate + DOM | MEDIUM | LOW | P1 |
| Overdue-accrual highlight | MEDIUM | LOW–MEDIUM | P2 |
| Chart legend split by forecast kind | MEDIUM | LOW | P2 |
| Dated rate history | LOW | MEDIUM | P3 |
| Compound / daily engines | LOW (for v1.5) | HIGH | P3 |
| Auto BalanceSnapshot | LOW (harmful now) | MEDIUM | Anti / defer |
| Savings goals | MEDIUM | HIGH | P3 / OOS |

**Priority key:**
- P1: Must have for v1.5 launch
- P2: Should have soon after
- P3: Nice to have / future

## Competitor Feature Analysis

| Feature | Monarch Money | Empower / YNAB | NetWorthCast | Wallet v1.5 approach |
|---------|---------------|----------------|--------------|----------------------|
| Savings as account type | Linked accounts; type defaults growth % | Synced accounts; YNAB manual NW | Liquid assets w/ return rates | Explicit `SAVINGS` enum + rate fields |
| Interest / growth math | Goals: compound monthly from annual growth | Empower: retirement scenarios; YNAB: none | Per-asset compound multi-year | Simple `annual%/12` monthly credit |
| Accrual day-of-month | Not on NW chart | Not modeled | Not DOM-based | First-class accrual DOM + clamp |
| Where projection shows | Goals timeline (dotted) | Retirement planner / none | 30y NW forecast | Капитал dashed «Прогноз» (near horizon) |
| Writes balance history from rate | No (bank sync) | Sync or manual | Projection only | **Never** — manual snapshots only |
| Side-by-side income/grace/interest | Goals ≠ capital overlay | Separate tools | Income/expense in forecast engine | One overlay: income + A′ grace + interest |

## Expected behavior (local NW tracker)

1. User creates SAVINGS with e.g. 16% and accrual day 15.
2. Balance snapshots stay manual; today NW includes savings principal like debit.
3. On each future accrual date in chart horizon, «Прогноз» steps up by `LOCF(balance) × 0.16 / 12` (FX-gated to primary).
4. Past accrual days with no new snapshot do **not** invent interest in historical series — user updates balance when bank credits.
5. Agents calling MCP see same rate/DOM metadata and forecast interest events; no write tools.

## Sources

- PROJECT.md v1.5 locks (SAVINGS type, rate/12, overlay-only, PARITY-01, OOS list) — **HIGH**
- Wallet code: `nw-forecast.ts`, `income.ts` DOM clamp, `iniso`/`griso` isolation twins, MCP `load-forecast-overlay` — **HIGH**
- Gerald / calculators: monthly interest ≈ principal × annual/12 — **MEDIUM** (websearch verified)
- Monarch Help: Growth Rates in Save Up Goals (compound monthly, defaults 3% savings) — **MEDIUM** (search synthesis; help page Cloudflare-blocked on fetch)
- YNAB / Empower comparisons: no DOM interest overlay on capital — **MEDIUM**
- Sber накопительный: daily/min balance + period-end credit / anniversary DOM — **MEDIUM** (why full bank engine is anti-feature)
- NetWorthCast: per-asset return rates + long compound NW forecast — **MEDIUM**

---
*Feature research for: Wallet v1.5 Сберегательный счет*
*Researched: 2026-09-11*
