# Roadmap: Wallet

## Overview

Wallet ships as a local Dockerized net-worth tracker: durable SQLite first, then currencies and typed accounts, dated balance snapshots, dated FX (primary ↔ other), a current net-worth dashboard, and historical charts that reuse the same as-of balance and rate rules — so capital history stays trustworthy.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Docker + SQLite Foundation** - Runnable container with durable local SQLite (completed 2026-09-02)
- [x] **Phase 2: Currencies + Accounts** - Free-form currencies, primary, and typed account CRUD (completed 2026-09-03)
- [x] **Phase 3: Dated Balance Snapshots** - As-of balances with backdating and LOCF reads (completed 2026-09-03)
- [x] **Phase 4: Dated FX** - Manual primary ↔ other rates with forward-effective LOCF (completed 2026-09-03)
- [x] **Phase 5: Net Worth Dashboard** - Current NW and per-account native/primary balances (completed 2026-09-03)
- [ ] **Phase 6: Historical Charts** - NW and per-account history using as-of balance × as-of FX

## Phase Details

### Phase 1: Docker + SQLite Foundation

**Goal:** As a local user, I want to run Wallet in Docker with SQLite on the host, so that my data survives container restarts and readiness reflects a migrated database.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: PLAT-01
**Success Criteria** (what must be TRUE):

  1. User can start the app with Docker Compose and open the UI in a browser
  2. App data survives a full container stop/start (SQLite file remains on the host mount)
  3. App reports healthy readiness only when the database is reachable and migrated

**Plans:** 4/4 plans complete
Plans:
**Wave 1**

- [x] 01-01-PLAN.md — Package legitimacy gate + Next scaffold + Wave 0 Vitest

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02-PLAN.md — shadcn/ui shell on App Router

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-03-PLAN.md — One-way money/FX contract + Prisma schema migrate gate

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 01-04-PLAN.md — Docker tracer: migrate-on-start, health, ready UI, persist smoke

### Phase 2: Currencies + Accounts

**Goal:** As a local Wallet user, I want to define free-form currencies with one forever primary and manage typed accounts with credit-limit metadata, so that I can set up capital structure before balances and net worth.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: CURR-01, ACCT-01, ACCT-02
**Success Criteria** (what must be TRUE):

  1. User can create currencies and rely on exactly one seeded primary currency (RUB; no primary switch in v1)
  2. User can create and rename accounts of types fiat debit, fiat credit, crypto, and cash (no account delete in v1 — CONTEXT D-14; archive is ACCT-04)
  3. User can set a required credit limit on a credit account at create time (outstanding debt deferred to Phase 3 balance snapshots — CONTEXT D-09)
  4. Credit limit is stored as metadata only (never treated as an asset in later NW math)

**Plans:** 5/5 plans complete
Plans:
**Wave 1**

- [x] 02-01-PLAN.md — Currency data: isPrimary + RUB seed migration + money/Zod + migrate deploy

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 02-02-PLAN.md — Currencies UI tracer: Dialog create/edit, nav, shadcn

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 02-03-PLAN.md — Account tracer: FIAT_CREDIT + creditLimitMinor metadata, migrate deploy

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 02-04-PLAN.md — Four account types, immutability tests, Russian UI human verify

**Wave 5** *(gap closure — UAT G-02-1 / G-02-2)*

- [x] 02-05-PLAN.md — Controlled name fields in Currency + Account form dialogs (FieldControl warning)

**UI hint**: yes

### Phase 3: Dated Balance Snapshots

**Goal**: User can record account balances as of a chosen date and read the correct as-of balance over time
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: BAL-01, BAL-02
**Success Criteria** (what must be TRUE):

  1. User can set an account balance for a chosen as-of date (including dates in the past)
  2. Asking for balance as of date D returns the latest snapshot with date ≤ D
  3. User can see each account’s current native balance from its latest applicable snapshot
  4. Days before an account’s first snapshot show no invented zero balance

**Plans:** 3/3 plans complete
Plans:
**Wave 1**

- [x] 03-01-PLAN.md — BalanceSnapshot schema + LOCF helpers + Zod + migrate deploy

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 03-02-PLAN.md — Set-balance Dialog + upsert + LOCF list (incl. credit available/debt)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 03-03-PLAN.md — Inline history expand + delete + Russian UI human smoke

**UI hint**: yes

### Phase 4: Dated FX

**Goal:** As a local Wallet user, I want to maintain dated exchange rates between the primary currency and other currencies, so that multi-currency amounts convert honestly as of any date.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: FX-01, FX-02
**Success Criteria** (what must be TRUE):

  1. User can set a dated exchange rate between the primary currency and another currency
  2. Conversion as of date D uses the latest rate with effective date ≤ D
  3. User cannot create FX pairs that are not primary ↔ other
  4. Rate changes apply forward from their date without rewriting earlier as-of conversions

**Plans:** 3/3 plans complete
Plans:
**Wave 1**

- [x] 04-01-PLAN.md — FxRate schema + LOCF helpers + Zod + migrate deploy

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 04-02-PLAN.md — Currencies tabs + SetRateDialog + LOCF rates list

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 04-03-PLAN.md — Rate history expand/delete + Russian UI human smoke

**UI hint**: yes

### Phase 5: Net Worth Dashboard

**Goal**: User can see true current net worth and per-account balances in native and primary currency
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: NW-01, NW-02, NW-03, ACCT-03
**Success Criteria** (what must be TRUE):

  1. User can see current net worth in the primary currency as assets minus credit-card outstanding debt
  2. User can see each account balance in its native currency
  3. User can see each account balance converted to the primary currency
  4. User can see available credit as limit − debt on credit accounts, and that figure never adds to assets

**Plans:** 3/3 plans complete

Plans:
**Wave 1**

- [x] 05-01-PLAN.md — NW lib tracer + hero on / + nav + asset rows

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 05-02-PLAN.md — Credit rows, missing states, partial-warning callout

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 05-03-PLAN.md — Empty state, DB error, Russian UI human verify

**UI hint**: yes

### Phase 6: Historical Charts

**Goal**: User can trust historical net-worth and per-account charts built from as-of balances and as-of FX
**Mode:** mvp
**Depends on**: Phase 5
**Requirements**: CHART-01, CHART-02, CHART-03
**Success Criteria** (what must be TRUE):

  1. User can see a historical net-worth chart in the primary currency
  2. User can see a historical balance chart for an individual account
  3. Each chart point uses balance as of that date × FX as of that date (not today’s rate)
  4. Changing today’s FX does not rewrite earlier chart points that used a prior rate

**Plans:** 3 plans

Plans:
**Wave 1**

- [ ] 06-01-PLAN.md — NW series lib + shadcn Chart + NW history on / with shared range

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 06-02-PLAN.md — Account expand chart + native/primary toggle + shared range

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 06-03-PLAN.md — Credit stacked areas + empty/single-point polish + human verify

**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Docker + SQLite Foundation | 4/4 | Complete    | 2026-09-02 |
| 2. Currencies + Accounts | 5/5 | Complete    | 2026-09-03 |
| 3. Dated Balance Snapshots | 3/3 | Complete    | 2026-09-03 |
| 4. Dated FX | 3/3 | Complete    | 2026-09-03 |
| 5. Net Worth Dashboard | 3/3 | Complete    | 2026-09-03 |
| 6. Historical Charts | 0/3 | Planned | - |

## Coverage Map

| Requirement | Phase |
|-------------|-------|
| PLAT-01 | Phase 1 |
| CURR-01 | Phase 2 |
| ACCT-01 | Phase 2 |
| ACCT-02 | Phase 2 |
| BAL-01 | Phase 3 |
| BAL-02 | Phase 3 |
| FX-01 | Phase 4 |
| FX-02 | Phase 4 |
| NW-01 | Phase 5 |
| NW-02 | Phase 5 |
| NW-03 | Phase 5 |
| ACCT-03 | Phase 5 |
| CHART-01 | Phase 6 |
| CHART-02 | Phase 6 |
| CHART-03 | Phase 6 |

**Coverage:** 15/15 v1 requirements mapped ✓
