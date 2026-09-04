# Wallet

## What This Is

A local, single-user personal finance site for tracking net worth across accounts (fiat debit, fiat credit, crypto USDT, cash). Runs in Docker with SQLite on the host; no cloud accounts. v1 ships account balances, multi-currency conversion to a primary currency, historical net-worth charts with shared LOCF semantics — not budgeting or transaction categorization.

## Core Value

At any moment, see true net worth (assets minus credit-card debt) in the primary currency and in each account's original currency, with history you can trust over time.

## Current State

**Shipped:** v1.0 MVP (2026-09-04)

Local Dockerized net-worth tracker: SQLite → currencies/accounts → dated balances → dated FX → current NW dashboard → historical charts (as-of balance × as-of FX). ~16k LOC TypeScript/TSX. Stack: Next.js 16 App Router, Prisma 7 + SQLite, shadcn/ui, recharts, Vitest (153 tests). Russian-first UI.

## Current Milestone: v1.1 Долги людям

**Goal:** Учёт долгов «я должен» / «мне должны» в отдельном разделе — люди, долги, частичные погашения с историей и графиком — без влияния на net worth.

**Target features:**
- Сущность «человек» → несколько долгов на одного
- Долг: направление, валюта, начальная сумма, опц. due date, опц. заметка; остаток = initial − Σ погашений
- Погашения только в валюте долга, с as-of датой (бэкдейт разрешён)
- График: остаток во времени + суммы погашений
- Закрытие: авто при остатке 0 или досрочно со списанием/прощением остатка
- Сводка totals «я должен» / «мне должны» в primary (FX as-of)
- Отдельный nav «Долги»; NW/charts не меняют смысл

## Requirements

### Validated

- ✓ User can create and manage accounts of types: fiat debit card, fiat credit card, crypto (e.g. USDT), cash — v1.0
- ✓ User can define currencies freely (not hardcoded) and pick one primary currency (e.g. RUB) — v1.0
- ✓ User can set/update an account balance as of a chosen date (backdating allowed) — v1.0
- ✓ Credit-card accounts store credit limit and outstanding debt (debt derived from limit − available) — v1.0
- ✓ App runs in Docker; all data persists in local SQLite — v1.0
- ✓ User can set exchange rates primary ↔ other as of a chosen date (manual) — v1.0
- ✓ Charts and totals as of a date use the FX rate effective for that date (rate changes apply forward from their date) — v1.0
- ✓ User can see current net worth overall and per-account balances (native + primary; credit debt reduces NW; available never an asset) — v1.0
- ✓ User can see balance history charts per account and overall (in primary currency and originals where relevant) — v1.0
- ✓ Shared LOCF path (`src/lib/locf.ts`) for pages + historical-series; Nyquist VALIDATION closed for phases 3–6 — v1.0

### Active

- [ ] User can create and manage people (counterparties) and attach multiple debts to one person
- [ ] User can create debts with direction (I owe / they owe me), currency, initial amount, optional due date, optional note
- [ ] Remaining balance = initial − sum of repayments; repayments only in debt currency with as-of date (backdating allowed)
- [ ] User can record partial repayments with history and see a chart of remaining balance over time plus repayment amounts
- [ ] Debt auto-closes at remaining 0; user can also close early by writing off / forgiving remaining
- [ ] Debts section shows totals «I owe» / «they owe me» in primary currency using FX as-of (debts never change net worth)
- [ ] Separate nav section «Долги» (Russian-first UI)

### Out of Scope

- Transaction history / income-expense posting — still periodic balance snapshots only
- Spending analytics, monthly burn, category cash-flow — deferred
- Long-term savings goals with target dates — deferred (not this milestone)
- Interest / penalties on personal debts — principal only in v1.1
- Debt list filters / search — deferred (single list)
- Repayments in a different currency than the debt — deferred
- Debts affecting net worth — explicitly excluded; tracking alongside capital only
- Credit-card payment due date / minimum payment reminders — deferred
- Bank/CSV import or API sync — deferred; manual only
- Automatic FX from external APIs — deferred; manual rates only
- FX between arbitrary non-primary pairs — primary ↔ other only
- Multi-user / auth / cloud sync — single local user
- Nav «Валюты» discoverability / account delete (ACCT-04) — residual v1 debt, not this milestone unless promoted later

## Context

Shipped v1.0: capital visibility across disconnected money places (bank, USDT, cash, credit debt) in one local Docker + SQLite app. UI Russian-first. Residual audit tech debt: some human-only FieldControl/restart smoke checks; nav «Валюты» lands on rates not currency list.

v1.1 adds personal debts (people ↔ money owed) as a parallel domain: same money/FX primitives for primary totals and charts, but debt balances must not flow into `computeNetWorthRows` or NW charts.

## Constraints

- **Runtime**: Dockerized web app — must run as a local container
- **Data**: SQLite only, stored locally on host — no external DB
- **Users**: Single user, local — no multi-tenant or SaaS
- **FX v1**: Manual dated rates, primary ↔ other only
- **Balances v1**: Manual dated snapshots, not double-entry ledger

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Docker + SQLite local stack | User already plans to run site in container; data stays on disk | ✓ Good — PLAT-01 shipped |
| Balance snapshots with date (not transactions) | User updates occasionally; wants history charts without full ledger | ✓ Good — Phase 3 |
| Manual dated FX, primary ↔ other | Two currencies for now; historical charts need rate-as-of-date | ✓ Good — Phase 4 |
| Credit card: limit + debt; debt reduces net worth | Matches real mental model (e.g. 500k limit, 250k debt) | ✓ Good — Phases 3+5 |
| Defer spend/cash-flow/debts/goals | Ship capital visibility first | ✓ Good — still correct for v1 |
| `/` is NW dashboard (Капитал); readiness not primary UX | D-01/D-02 — capital at a glance | ✓ Good — Phase 5 |
| Pure `computeNetWorthRows` for Phase 6 reuse | Charts need same inclusion math | ✓ Good — Phase 5–6 |
| Shared hybrid LOCF (`pickLatestAsOf` + `firstHitLocfMap` + typed wrappers) | Kill triplicate scanners; keep page batch Maps + series pure | ✓ Good — Phase 7 |
| Keep Prisma `getBalanceAsOf` / `getRateAsOf` as thin findFirst | LOCF-04; pages stay on batch Maps | ✓ Good — Phase 7 |
| Person entity → many debts | One counterparty, multiple open/closed debts | — Pending v1.1 |
| Remaining = initial − Σ repayments | Audit trail of principal + payments | — Pending v1.1 |
| Repayments same currency + dated as-of | Match balance/FX backdating model; no cross-currency pay | — Pending v1.1 |
| Debts excluded from NW | Capital stays account-based; debts are side ledger | — Pending v1.1 |
| Early close = write-off/forgive remaining | Auto-close at 0 insufficient for real settlements | — Pending v1.1 |
| Primary totals for I-owe / they-owe via FX as-of | Same conversion honesty as NW dashboard | — Pending v1.1 |

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
*Last updated: 2026-09-04 after starting milestone v1.1 Долги людям*
