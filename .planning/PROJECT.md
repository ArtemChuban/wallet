# Wallet

## What This Is

A local, single-user personal finance site for tracking net worth across accounts (fiat debit, fiat credit, crypto USDT, cash). Runs in Docker with SQLite on the host; no cloud accounts. v1 ships account balances, multi-currency conversion to a primary currency, historical net-worth charts with shared LOCF semantics — not budgeting or transaction categorization.

## Core Value

At any moment, see true net worth (assets minus credit-card debt) in the primary currency and in each account's original currency, with history you can trust over time.

## Current State

**Shipped:** v1.0 MVP (2026-09-04)

Local Dockerized net-worth tracker: SQLite → currencies/accounts → dated balances → dated FX → current NW dashboard → historical charts (as-of balance × as-of FX). ~16k LOC TypeScript/TSX. Stack: Next.js 16 App Router, Prisma 7 + SQLite, shadcn/ui, recharts, Vitest (153 tests). Russian-first UI.

## Next Milestone Goals

Define via `/gsd-new-milestone`. Likely candidates from Out of Scope / residual debt:

- Nav discoverability (Валюты → rates vs list)
- Transaction history / income-expense (if desired)
- Auto FX or bank import (still deferred unless promoted)

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

_(none — next milestone defines fresh requirements via `/gsd-new-milestone`)_

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

Shipped v1.0: capital visibility across disconnected money places (bank, USDT, cash, credit debt) in one local Docker + SQLite app. UI Russian-first. Residual audit tech debt: some human-only FieldControl/restart smoke checks; nav «Валюты» lands on rates not currency list.

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
*Last updated: 2026-09-04 after v1.0 milestone*
