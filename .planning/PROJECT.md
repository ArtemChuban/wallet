# Wallet

## What This Is

A local, single-user personal finance site for tracking net worth across accounts (fiat debit, fiat credit, crypto USDT, cash). Runs in Docker with SQLite on the host; no cloud accounts. v1 focuses on account balances, multi-currency conversion to a primary currency, and historical net-worth charts — not budgeting or transaction categorization yet.

## Core Value

At any moment, see true net worth (assets minus credit-card debt) in the primary currency and in each account's original currency, with history you can trust over time.

## Requirements

### Validated

- ✓ User can create and manage accounts of types: fiat debit card, fiat credit card, crypto (e.g. USDT), cash — Phase 2
- ✓ User can define currencies freely (not hardcoded) and pick one primary currency (e.g. RUB) — Phase 2
- ✓ User can set/update an account balance as of a chosen date (backdating allowed) — Phase 3
- ✓ Credit-card accounts store credit limit and outstanding debt (debt derived from limit − available) — Phase 3
- ✓ App runs in Docker; all data persists in local SQLite — Phase 1

### Active

- [ ] User can set exchange rates primary ↔ other as of a chosen date (manual)
- [ ] Charts and totals as of a date use the FX rate effective for that date (rate changes apply forward from their date)
- [ ] User can see current net worth overall and per-account balances
- [ ] User can see balance history charts per account and overall (in primary currency and originals where relevant)

### Out of Scope

- Transaction history / income-expense posting — v1 is periodic balance snapshots only
- Spending analytics, monthly burn, category cash-flow — deferred post-v1
- Debts to/from people with due dates — deferred
- Long-term savings goals with target dates — deferred
- Credit-card payment due date / minimum payment reminders — deferred (mentioned, not v1)
- Bank/CSV import or API sync — deferred; manual only
- Automatic FX from external APIs — deferred; manual rates only
- FX between arbitrary non-primary pairs — v1 only primary ↔ other
- Multi-user / auth / cloud sync — single local user

## Context

Today money lives in disconnected places: bank app transactions, USDT crypto, cash, credit debt, and mental goals — with no single net-worth view. User wants one local place to periodically update "how much where" and see capital over time. Starting currencies will likely be just two (e.g. RUB + USDT). UI language and day-to-day use are Russian-first personal tooling. Existing repo currently has GSD tooling only; application code not started (greenfield product).

## Constraints

- **Runtime**: Dockerized web app — must run as a local container
- **Data**: SQLite only, stored locally on host — no external DB
- **Users**: Single user, local — no multi-tenant or SaaS
- **FX v1**: Manual dated rates, primary ↔ other only
- **Balances v1**: Manual dated snapshots, not double-entry ledger

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Docker + SQLite local stack | User already plans to run site in container; data stays on disk | — Pending |
| Balance snapshots with date (not transactions) | User updates occasionally; wants history charts without full ledger | — Pending |
| Manual dated FX, primary ↔ other | Two currencies for now; historical charts need rate-as-of-date | — Pending |
| Credit card: limit + debt; debt reduces net worth | Matches real mental model (e.g. 500k limit, 250k debt) | — Pending |
| Defer spend/cash-flow/debts/goals | Ship capital visibility first | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-09-03 after Phase 03*
