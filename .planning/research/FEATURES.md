# Feature Research

**Domain:** Local single-user personal net-worth / balance-snapshot finance
**Researched:** 2026-09-02
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist for a net-worth product. Missing these = feels incomplete vs spreadsheet or Empower/Monarch/Lunch Money class tools. Confidence MEDIUM (cross-checked competitor marketing + Lunch Money docs + self-hosted Firefly patterns).

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Account CRUD with asset vs liability types | Every NW product models "what I own" vs "what I owe"; wrong typing silently corrupts totals | LOW | Map Wallet types: fiat debit/cash/crypto → asset; fiat credit → liability |
| Current net worth = assets − liabilities | Core definition everywhere (Lunch Money, Empower, Firefly, Totala) | LOW | Credit outstanding debt subtracts; credit *limit* is metadata, not NW |
| Per-account current balances | Dashboard without account list is useless | LOW | Show native currency balance always |
| Primary (display) currency | Users think in one home currency (RUB for this project) | LOW | Free-form currency codes, not a hardcoded 14-currency list |
| Multi-currency accounts + convert to primary | Multi-currency portfolios are table stakes in modern NW trackers (Totala, Quantive, Zinfai, Spendly, Firefly) | MEDIUM | v1: primary ↔ other rates only (per PROJECT.md) |
| Historical net-worth chart over time | "How did capital change?" is the reason people leave spreadsheets for an app | MEDIUM | Needs dated balances + dated FX to be trustworthy |
| Dated balance entry / snapshots | Manual trackers (Totala monthly confirm, Lunch Money month snapshots, Quantive measurements, Worth it) treat point-in-time balances as the source of truth | MEDIUM | Backdating required; last-known balance as-of a chart date |
| Liability accounts (credit cards / debt) | Aggregators always include cards/loans; omitting debt overstates wealth | LOW | Store outstanding balance as liability; optional credit limit for mental model |
| Crypto as an account/asset type | Expected when crypto is part of real capital (Monarch, Lunch Money, Delta/CoinStats niche) | LOW | v1: balance snapshot of e.g. USDT, not live ticker P&L |
| Local persistence / data ownership signal | Differentiates this class from cloud SaaS; user constraint is Docker + SQLite | LOW | Table stakes *for this product class*, not for Monarch |

### Differentiators (Competitive Advantage)

Not required to "be a finance app," but align with Core Value: trustworthy capital over time, local, manual, multi-currency.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Manual dated FX rates (user-owned history) | Auto FX APIs rewrite history or hide FX gain/loss; manual dated rates make charts reproducible | MEDIUM | Rate effective from date forward; charts use rate as-of query date |
| Dual display: native + primary on same view | Clarity when holding USDT + RUB; reduces "which number is real?" confusion | LOW | Common in local multi-currency tools; rare as first-class UX in US bank-sync apps |
| Credit limit + debt fields together | Matches real card mental model (limit 500k, debt 250k) without implying available credit is an asset | LOW | Available credit = limit − debt is derived display only — never add to NW |
| Free-form currencies (not enum) | Starting with RUB+USDT; avoids product lock-in to USD-centric lists | LOW | Need validation for uniqueness; no need for ISO completeness day one |
| Snapshot-first UX (not transaction chore) | Totala markets "a minute a month"; matches occasional update habit in PROJECT.md | MEDIUM | Opposes Firefly double-entry and Monarch transaction review |
| As-of-date net worth reconstruction | Pick any past date → balances carried forward + FX as-of that date | HIGH | Harder than "monthly column only"; strongest trust story if done right |
| Per-account balance history charts | Diagnose which pocket moved capital; Lunch Money "by account" chart is the bar | MEDIUM | Depends on snapshot density |
| Zero bank login / no aggregator | Privacy + reliability for users burned by broken Plaid links (Totala messaging) | LOW | Constraint already; market as intentional |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Full transaction ledger / double-entry | Feels "more accurate"; Firefly users expect it | Different product; forces daily bookkeeping; conflicts with snapshot NW model | Stay on dated snapshots; defer ledger to post-v1 if ever |
| Bank / Plaid / Open Banking sync | "Automatic like Monarch" | Credential risk, sync breakage, Docker/local mismatch, out of scope | Manual snapshots; optional CSV later |
| Automatic live FX APIs | Less typing | Historical charts lie if rates aren't frozen as-of date; API dependency breaks local-only promise | Manual dated rates; optional fetch later that *writes* a dated rate row |
| Budgets / envelopes / category spend | YNAB/Actual muscle memory | Needs transactions; dilutes capital-visibility MVP | Phase 2+ after NW trust proven |
| Income/expense cash-flow analytics | "Where did money go?" | Same dependency on transactions | Phase 2+ |
| Savings goals with target dates / FIRE | Totala/Quantive differentiators | Premature optimization before history exists | Phase 2 after ≥3–6 months of snapshots |
| Debts to/from people with due dates | Social IOUs feel like accounts | Different lifecycle (reminders, partial repay); pollutes NW types | Phase 2 separate "IOU" entity |
| Credit-card due date / minimum payment reminders | Natural once cards exist | Notification/scheduling complexity; not capital visibility | Defer; show limit+debt only in v1 |
| Live crypto market prices / P&L | Delta/CoinStats users expect it | Turns app into portfolio tracker; needs oracles; blurs snapshot truth | Manual USDT (or token) balance updates |
| Investment holdings / tickers / allocation | Empower/Monarch investors | Huge market-data surface | Single balance per account until demanded |
| Arbitrary cross rates (EUR↔USDT without primary) | Completeness | Rate graph complexity; triangulation bugs | v1 only primary ↔ other |
| Multi-user / household sharing | Monarch couples feature | Auth, permissions, conflicts with single local user | Out of scope |
| Real-time everything / push sync | SaaS habit | Useless for monthly snapshot cadence | On-demand page load |

## Feature Dependencies

```
Currencies + primary currency
    └──requires──> Accounts (typed, each with currency)
                       └──requires──> Dated balance snapshots
                       └──requires──> Credit limit/debt fields (credit type only)

Dated FX rates (primary ↔ other)
    └──requires──> Currencies + primary

Current net worth (primary)
    └──requires──> Accounts + latest snapshots + FX as-of today

Historical NW / account charts
    └──requires──> Dated snapshots + dated FX + as-of reconstruction

Dual native+primary display
    └──enhances──> Current NW + charts

Available credit (limit − debt)
    └──enhances──> Credit accounts
    └──conflicts──> Treating available credit as an asset

Transactions / budgets / cash-flow
    └──conflicts──> Snapshot-only v1 model (different source of truth)

Auto FX API
    └──enhances──> Dated FX rates (only if it inserts dated rows)
    └──conflicts──> Silent live conversion without history

Goals / FIRE / IOUs / payment reminders
    └──requires──> Stable NW history (post-validation)
```

### Dependency Notes

- **Charts require dated FX + dated balances:** Converting all history with *today's* rate rewrites the past (Totala/Lunch Money both emphasize period-correct rates).
- **As-of reconstruction requires carry-forward rules:** Balance on date D = latest snapshot with date ≤ D; FX on date D = latest rate with effective date ≤ D.
- **Credit limit enhances credit accounts but must not enter NW math:** Only outstanding debt is a liability.
- **Budgets/transactions conflict with v1:** Building both sources of truth early causes reconciliation hell (wealth-tracker-oss documents balance-vs-transaction classes explicitly).

## MVP Definition

### Launch With (v1)

Minimum to validate Core Value: trusted capital over time, local, multi-currency.

- [ ] Account management (debit, credit, crypto, cash) with currency — without types, NW is undefined
- [ ] Credit accounts: outstanding debt + credit limit; debt reduces NW — matches real card model
- [ ] Free-form currencies + one primary — RUB/USDT starting set
- [ ] Manual dated balance snapshots (backdating allowed) — history source of truth
- [ ] Manual dated FX primary ↔ other (forward-effective) — history-correct conversion
- [ ] Current NW + per-account balances (native and primary) — daily question answered
- [ ] Historical charts: overall NW + per-account (primary; native where useful) — time trend
- [ ] Docker + local SQLite persistence — deployment constraint

### Add After Validation (v1.x)

Ship once weekly/monthly update habit sticks and chart trust is confirmed.

- [ ] CSV export of accounts/snapshots/rates — backup and spreadsheet escape hatch
- [ ] Faster snapshot UX (copy-forward previous balances, "unchanged" confirm) — Totala-style minute-a-month
- [ ] Closed/archived accounts (exclude from current NW, keep history) — Lunch Money pattern
- [ ] Optional assisted FX: fetch rate and *save* as dated manual row — keeps local truth
- [ ] Simple assets/liabilities breakdown on chart (by type) — Lunch Money "by type" view
- [ ] Data backup/restore documentation or one-click SQLite dump — local-app hygiene

### Future Consideration (v2+)

Defer until capital visibility is proven; these are typically phase-2 in the domain.

- [ ] Transaction import / ledger — only if snapshots feel too coarse
- [ ] Budgets / envelopes / category cash-flow — separate product surface
- [ ] Long-term savings goals / FIRE runway — needs history first (Totala/Quantive path)
- [ ] Debts to/from people with due dates — separate entity model
- [ ] Credit-card payment reminders — scheduling surface
- [ ] Bank sync / aggregator — conflicts with local privacy posture
- [ ] Live market prices for crypto/equities — portfolio-tracker scope
- [ ] Arbitrary non-primary FX pairs — only if >2 currencies and triangulation demanded
- [ ] Multi-device sync / auth — expands threat model

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Account CRUD + types | HIGH | LOW | P1 |
| Credit debt (+ limit metadata) | HIGH | LOW | P1 |
| Currencies + primary | HIGH | LOW | P1 |
| Dated balance snapshots | HIGH | MEDIUM | P1 |
| Dated FX primary ↔ other | HIGH | MEDIUM | P1 |
| Current NW + per-account (native/primary) | HIGH | MEDIUM | P1 |
| Historical NW + account charts | HIGH | MEDIUM | P1 |
| As-of-date reconstruction rules | HIGH | HIGH | P1 |
| Copy-forward / quick monthly update UX | MEDIUM | LOW | P2 |
| CSV export / backup | MEDIUM | LOW | P2 |
| Archive/closed accounts | MEDIUM | LOW | P2 |
| Assisted dated FX fetch | MEDIUM | MEDIUM | P2 |
| Assets vs liabilities chart breakdown | MEDIUM | LOW | P2 |
| Transactions / budgets | MEDIUM | HIGH | P3 |
| Goals / FIRE | MEDIUM | MEDIUM | P3 |
| People IOUs | LOW | MEDIUM | P3 |
| Payment reminders | LOW | MEDIUM | P3 |
| Bank sync | LOW* | HIGH | P3 |
| Live crypto prices | LOW* | HIGH | P3 |

\*High value for *other* product personas; low for this project's validated constraints.

**Priority key:**
- P1: Must have for launch
- P2: Should have after core trust validated
- P3: Nice to have / future milestone

## Competitor Feature Analysis

| Feature | Empower / Monarch | Lunch Money / Totala / Quantive | Firefly III / Actual | Our Approach (Wallet v1) |
|---------|-------------------|----------------------------------|----------------------|---------------------------|
| Net worth total | Auto from linked accounts | Snapshots / manual confirm | Derived from ledger (Firefly) or secondary (Actual) | Manual snapshots → assets − liabilities |
| Account types | Banks, cards, loans, investments, crypto, property | Broad assets/liabilities + crypto | Asset/liability accounts; Actual = budget accounts | Debit, credit, crypto, cash only |
| Multi-currency | Limited / weak in many US apps | Strong (period FX, base currency) | Firefly strong; Actual weak | Free-form currencies; primary ↔ other FX |
| History | Daily sync series | Monthly snapshots (editable) | Continuous from transactions | Dated snapshots + carry-forward |
| FX | Live/provider | Historical rate for period | Exchange rate tables | Manual dated rates only |
| Credit cards | Synced liability | Liability in NW | Liability accounts | Debt reduces NW; limit is metadata |
| Crypto | Synced or manual | Manual or holdings | Manual balances | Manual USDT-style balance |
| Budgets | First-class (esp. Monarch) | Optional / adjacent | Actual core; Firefly secondary | Anti-feature for v1 |
| Transactions | First-class | First-class (Lunch Money) | First-class | Out of scope v1 |
| Goals / FIRE | Partial | Differentiator (Totala/Quantive) | Piggy banks (Firefly) | Phase 2+ |
| Bank sync | Core | Explicitly avoided (Totala) or optional | Optional importers | Never in v1 |
| Local / self-host | No | Partial (privacy claims) | Yes | Docker + SQLite required |

## Sources

- Lunch Money Net Worth docs — monthly snapshots, assets−liabilities, historical FX to primary ([support.lunchmoney.app/home/net-worth](https://support.lunchmoney.app/home/net-worth)) — confidence MEDIUM (official docs + web cross-check)
- Totala product positioning — manual monthly confirm, multi-currency period FX, no bank login ([totala.app](https://totala.app/)) — confidence MEDIUM
- Quantive — spreadsheet-replacement NW, multi-currency display, manual entry, history/forecast tiers ([usequantive.app](https://usequantive.app/)) — confidence MEDIUM
- Empower / Monarch reviews — aggregation-first NW + budgets/transactions as separate surfaces (NerdWallet, Rob Berger, Monarch site) — confidence MEDIUM
- Firefly III vs Actual Budget comparisons — multi-currency NW from ledger vs envelope budgets ([selfhosting.sh](https://selfhosting.sh/compare/actual-budget-vs-firefly/), Firefly NetWorth helper) — confidence MEDIUM
- Snapshot + stored FX pattern in open-source trackers (e.g. kuyan monthly snapshots with rates in SQLite) — confidence MEDIUM
- Delta / CoinStats — live portfolio/P&L crypto trackers; contrast vs balance-snapshot NW (anti-pattern for v1 scope) — confidence MEDIUM
- PROJECT.md validated scope — Wallet v1 constraints and out-of-scope list — confidence HIGH (project authority)

---
*Feature research for: local personal net-worth / balance-snapshot finance*
*Researched: 2026-09-02*
