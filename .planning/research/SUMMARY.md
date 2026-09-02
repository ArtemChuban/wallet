# Project Research Summary

**Project:** Wallet
**Domain:** Local single-user personal finance / net-worth tracking (balance snapshots + dated FX)
**Researched:** 2026-09-02
**Confidence:** MEDIUM-HIGH

## Executive Summary

Wallet is a local, Dockerized, single-user net-worth tracker — not a budget app and not a double-entry ledger. Experts who ship this product class (Totala/Lunch Money–style manual NW, Ghostfolio-like dated balances + rates) build around **user-authored balance snapshots** and **dated FX rates**, then compute assets − credit debt at read time for any as-of date. That is the right architecture for Wallet: occasional “how much where” updates, trustworthy history, free-form currencies with one primary (RUB-first), and no bank sync or live market prices in v1.

Recommended approach: **Node 24 LTS + Hono API + Vite/React SPA + Drizzle + better-sqlite3 + decimal.js + Recharts**, one Compose service, SQLite on a host bind-mount (`DATABASE_PATH=/data/wallet.db`). Domain logic owns LOCF as-of for balances and rates; NetWorthSvc never stores converted NW as source of truth; credit **limit** is display-only while outstanding **debt** subtracts from NW. Ship features in dependency order: persistence → currencies/accounts → snapshots → FX → current NW → charts.

Key risks are semantic, not scale: rewriting history with today’s FX, IEEE float money, treating credit limit as wealth, broken snapshot LOCF/backdating, and losing the SQLite file when Docker volumes are wrong. Mitigate by freezing money types and as-of helpers before UI polish, golden fixtures for FX/credit/LOCF, and a persist smoke test on first runnable milestone. Defer transactions, budgets, auto FX APIs, and bank sync — they conflict with the snapshot-first core value.

## Key Findings

### Recommended Stack

Prescriptive stack for a local SPA+API finance tool: one Node process serves JSON and static assets; sync SQLite fits single-writer Docker; avoid Next.js/SSR and cloud DBs. Details in [STACK.md](./STACK.md).

**Core technologies:**
- **Node.js 24.x (bookworm image):** Active LTS runtime; Debian base for better-sqlite3 native builds
- **Hono 4.x + @hono/node-server:** Tiny API that also serves Vite `dist/` — better fit than Next for local single-user
- **Vite 8 + React 19 + React Router 8:** Russian-first SPA (dashboard, accounts, FX, charts)
- **Drizzle ORM 0.45 + drizzle-kit + better-sqlite3 13:** Type-safe schema/migrations; WAL; migrate on container start
- **Zod 4 + decimal.js:** Boundary validation and exact money/FX math (never IEEE floats)
- **Recharts 3 + TanStack Query 5:** Sparse NW time series + mutation/refetch cache
- **Docker Compose:** One `web` service, `./data:/data` bind-mount

**Critical version notes:** Keep `drizzle-orm` / `drizzle-kit` paired; do not `async` inside better-sqlite3 transaction callbacks; prefer bookworm over Alpine for native addon; pin TypeScript 7 early against Vite/ESLint plugins.

### Expected Features

v1 validates “trusted capital over time,” not cash-flow. Competitive edge is manual dated FX + snapshot UX, not aggregation. Details in [FEATURES.md](./FEATURES.md).

**Must have (table stakes / P1):**
- Account CRUD with types (fiat debit, fiat credit, crypto, cash) — asset vs liability typing
- Credit accounts: outstanding debt reduces NW; credit limit is metadata only
- Free-form currencies + one primary (e.g. RUB)
- Dated balance snapshots with backdating; LOCF as-of for “balance on D”
- Manual dated FX primary ↔ other only; rate applies forward from its date
- Current NW + per-account balances (native and primary)
- Historical charts: overall NW + per-account (primary; native where useful)
- Docker + local SQLite persistence

**Should have (competitive / P2 after trust):**
- Dual native + primary display as first-class UX
- Copy-forward / quick monthly snapshot UX
- CSV export / backup hygiene; archived accounts; optional assisted FX that *writes* dated rows
- Assets vs liabilities chart breakdown

**Defer (v2+ / anti-features for v1):**
- Transaction ledger, budgets, cash-flow analytics
- Bank/Plaid sync, live crypto prices, arbitrary cross rates
- Goals/FIRE, people IOUs, payment reminders, multi-user/auth

### Architecture Approach

Snapshot + rate-table core (not Firefly-style ledger). Presentation → API → domain services (Account, Snapshot, Currency/FX, NetWorth/Chart) → SQLite. NW is a derived read model: for date D, LOCF native balances, LOCF rates, convert, sum assets − credit debt; missing FX → partial/block, never invent 0 or 1. Details in [ARCHITECTURE.md](./ARCHITECTURE.md).

**Major components:**
1. **Persistence (Docker + SQLite)** — WAL/FK PRAGMAs, migrations on start, host volume for `wallet.db`
2. **Currencies + Accounts** — free-form codes, single primary, typed accounts, credit_limit nullable
3. **SnapshotSvc** — upsert `(account_id, as_of_date)`; balanceAsOf = latest `as_of <= D`
4. **FxSvc** — `rate_to_primary` dated rows; rateAsOf LOCF; single `toPrimary()` helper
5. **NetWorthSvc / ChartSvc** — read-time aggregation per sample date; charts consume domain, do not invent FX policy
6. **Presentation** — Russian-first CRUD, as-of pickers, NW total, history charts

### Critical Pitfalls

Top risks from [PITFALLS.md](./PITFALLS.md):

1. **Today’s FX on historical points** — Persist native amounts + dated rates; every chart point uses rate `as_of <= D`
2. **Float money / REAL columns** — TEXT decimals or integer minor units + decimal.js; ban float in first schema PR
3. **Credit limit counted as wealth** — NW = assets − outstanding debt only; golden fixture (cash − debt, limit ignored)
4. **Wrong snapshot LOCF / backdating** — Upsert by `(account, as_of_date)`; never confuse `created_at` with `as_of`; no silent zero before first snapshot
5. **Docker SQLite data loss / WAL on bad FS** — Mount exact DB dir; persist smoke test; document WAL vs DELETE on virtiofs/NFS
6. **FX pair direction drift** — Canonical `primary units per 1 other`; one conversion function before charts

## Implications for Roadmap

Based on research, suggested phase structure (maps to architecture build order + pitfall prevention order):

### Phase 1: Docker + SQLite Foundation
**Rationale:** Everything persists here; wrong volume = silent capital loss. Money types must be locked before any domain math.
**Delivers:** Multi-stage Dockerfile, Compose with `./data:/data`, `DATABASE_PATH`, Drizzle schema stub + migrate-on-start, WAL/FK/busy_timeout, health endpoint, persist smoke test.
**Addresses:** Local persistence / data ownership (table stakes); Docker constraint from PROJECT.md.
**Avoids:** Pitfall 5 (ephemeral DB / bad mount); Pitfall 2 (float money in schema from day one).
**Uses:** Node 24 bookworm, better-sqlite3, drizzle-kit in image.

### Phase 2: Currencies + Accounts
**Rationale:** Accounts and FX both depend on currency registry and primary; credit type rules must exist before NW math.
**Delivers:** Free-form currencies, exactly one primary, account CRUD (debit/credit/crypto/cash), credit_limit field, Russian-capable forms.
**Addresses:** Account CRUD + types; currencies + primary; credit limit + debt fields (debt amount still via snapshots in Phase 3).
**Avoids:** Pitfall 3 setup (limit never enters asset lists); document credit UX labels early.
**Implements:** AccountSvc, currencies domain, Accounts/Currencies API + UI.

### Phase 3: Dated Balance Snapshots
**Rationale:** Capital history source of truth; charts must not invent as-of rules. Native-only views can smoke-test single-currency before FX.
**Delivers:** Snapshot upsert with explicit as-of date (default today, backdating allowed), uniqueness per account/day, balanceAsOf LOCF API, per-account current/native display.
**Addresses:** Dated balance entry / snapshots; per-account current balances (native).
**Avoids:** Pitfall 4 (mutable `accounts.balance`, wrong LOCF, gap-as-zero).
**Implements:** SnapshotSvc, Snapshots API + UI.

### Phase 4: Dated FX (Primary ↔ Other)
**Rationale:** Honest multi-currency totals require forward-effective rates and one canonical pair direction before any NW “done” claim.
**Delivers:** FX rate CRUD dated rows, `rate_to_primary` schema, rateAsOf LOCF, `toPrimary()`, reject non-primary pairs, UI copy for “applies from date forward.”
**Addresses:** Manual dated FX; multi-currency conversion constraint.
**Avoids:** Pitfalls 1, 6, 7 (history rewrite, direction bugs, silent missing rate).
**Implements:** FxSvc, FX API + UI; Vitest fixtures for rate step changes.

### Phase 5: Net Worth Dashboard
**Rationale:** First delivery of Core Value — current capital in primary + dual native/primary per account. Composes snapshots + FX + credit rules.
**Delivers:** NetWorthSvc (assets − credit debt, partial FX handling), dashboard as-of today (or picker), per-account breakdown, available credit as derived display only.
**Addresses:** Current NW; dual native + primary display; credit debt in NW formula.
**Avoids:** Pitfall 3 (limit in NW); Pitfall 7 (all conversion through one helper).
**Implements:** NetWorth API + dashboard UI; golden NW fixture.

### Phase 6: Historical Charts
**Rationale:** Charts last so they cannot bake a second FX/balance policy. Needs frozen as-of helpers + sample-date strategy (union of snapshot/rate dates).
**Delivers:** Overall NW history + per-account series in primary (and native where useful); step/LOCF plotting; empty/gap UX (“нет данных”); fixture: flat native + step FX ⇒ single jump on rate date.
**Addresses:** Historical NW + account charts; as-of reconstruction.
**Avoids:** Pitfalls 1 and 6 (today’s rate, interpolate/mismatch FX policy).
**Implements:** ChartSvc + Recharts pages; TanStack Query invalidation after mutations.

### Phase 7: Harden + Russian Polish (v1 ship)
**Rationale:** Non-blocking for domain correctness but required for personal daily use and safe local ops.
**Delivers:** i18n/ru copy polish, localhost bind default, DB dir permissions notes, backup/restore docs, optional archive flag / notes if cheap.
**Addresses:** Local ops UX; Russian-first context from PROJECT.md.
**Avoids:** Security/UX pitfalls (LAN exposure, limit shown as capital, gap-as-zero).
**Defer to v1.x milestone:** CSV export, copy-forward monthly UX, assisted FX fetch, assets/liabilities chart split.

### Phase Ordering Rationale

- **Persist money correctly → snapshot as-of → credit NW rules → dated FX → charts** — matches pitfall-to-phase mapping and architecture suggested build order.
- Group currencies with accounts (Phase 2) because both are low-complexity CRUD with shared FKs; keep snapshots and FX separate so LOCF policies can be tested in isolation.
- Never call NW or charts “done” before FX as-of exists — multi-currency is a validated Active requirement.
- P2 features (CSV, copy-forward, assisted FX) wait until weekly/monthly habit and chart trust are validated.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** Confirm journal_mode (WAL vs DELETE) against actual Docker host FS; better-sqlite3 multi-stage copy strategy for arm64 if relevant.
- **Phase 3–4:** Exact money storage choice project-wide (TEXT decimal vs INTEGER minor units + `currencies.scale`) — STACK presents both; pick once in plan-phase.
- **Phase 6:** Chart sample-date density and gap UX (library step series vs daily calendar) — sparse Recharts patterns.

Phases with standard patterns (skip research-phase):
- **Phase 2:** Standard CRUD + Zod validation on Hono.
- **Phase 5:** Composition of already-tested domain helpers into a read API.
- **Phase 7:** i18n/Tailwind polish and Compose bind hardening — well-documented.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | npm versions verified 2026-09-02; Node 24 LTS; framework choice MEDIUM but constrained by Docker+SPA needs |
| Features | MEDIUM | Competitor docs + PROJECT.md alignment; no user validation yet (Active requirements unvalidated) |
| Architecture | MEDIUM | Cross-checked Ghostfolio/Firefly/multi-currency NW guides; stack-agnostic structure maps cleanly to recommended stack |
| Pitfalls | MEDIUM | SQLite WAL + money + FX history claims cross-checked; host-FS journal choice needs plan-time confirmation |

**Overall confidence:** MEDIUM-HIGH — enough to roadmap v1; freeze money representation and LOCF fixtures early in planning.

### Gaps to Address

- **Money column representation:** TEXT + decimal.js vs INTEGER minor units — decide in Phase 1/3 planning; do not mix.
- **Calendar date timezone:** Pick local-day vs UTC date-only for `as_of_date` and stick to it (ARCHITECTURE flags this).
- **Same-day snapshot/rate uniqueness:** Last-write-wins vs reject — define in snapshot/FX plans.
- **Partial NW UX:** Block foreign accounts vs show partial total with reason — product choice in Phase 5.
- **Primary currency change rules:** Rare path; needs explicit migration/invalidate rules if allowed in v1 (ARCHITECTURE: phase needs rules).
- **i18next vs hardcoded Russian:** STACK MEDIUM — personal v1 may hardcode; decide in Phase 7 or earlier UI phase.

## Sources

### Primary (HIGH confidence)
- PROJECT.md — validated constraints, Active requirements, out-of-scope list
- npm registry (2026-09-02) — package versions in STACK.md
- [Node.js Release schedule](https://github.com/nodejs/Release) — Node 24 Active LTS
- better-sqlite3 / WiseLibs docs — WAL, sync API
- [sqlite.org WAL](https://www.sqlite.org/wal.html) — network FS / shared-memory constraints

### Secondary (MEDIUM confidence)
- Drizzle SQLite get-started — drivers, migrate patterns
- Lunch Money / Totala / Quantive — snapshot NW, period FX, no-bank positioning
- Ghostfolio — AccountBalance + toCurrencyAtDate patterns
- Firefly III — asset/liability / include_net_worth contrast (ledger anti-pattern for v1)
- PortfolioPilot / TrackWorth / MyMoneyViz / Mozaic — native storage + time-consistent FX
- Docker persistence + field reports (virtiofs/WAL corruption)
- GnuCash pricedb — latest-on-or-before price semantics

### Tertiary (LOW confidence)
- lucide-react version pin — churny; optional
- Blnk Finance snapshot analogy — useful but not same domain
- Bun as Docker runtime — deferred revisit only

---
*Research completed: 2026-09-02*
*Ready for roadmap: yes*
