# Requirements: Wallet

**Defined:** 2026-09-02
**Core Value:** At any moment, see true net worth (assets minus credit-card debt) in the primary currency and in each account's original currency, with history you can trust over time.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Accounts

- [ ] **ACCT-01**: User can create, edit, and delete accounts with types: fiat debit, fiat credit, crypto, cash
- [ ] **ACCT-02**: For credit accounts, user can set credit limit and outstanding debt; debt reduces net worth
- [ ] **ACCT-03**: User can see available credit as limit − debt (display only, never counted as asset)

### Currencies

- [ ] **CURR-01**: User can create currencies and set one primary currency (e.g. RUB)

### FX

- [ ] **FX-01**: User can set a dated exchange rate between primary and another currency
- [ ] **FX-02**: Totals and charts as of date D use the latest rate with effective date ≤ D

### Balances

- [ ] **BAL-01**: User can set an account balance as of a chosen date (backdating allowed)
- [ ] **BAL-02**: Balance as of date D is the latest snapshot with date ≤ D

### Net Worth

- [ ] **NW-01**: User can see current net worth (assets − credit debt) in primary currency
- [ ] **NW-02**: User can see each account balance in its native currency
- [ ] **NW-03**: User can see each account balance converted to primary currency

### Charts

- [ ] **CHART-01**: User can see historical net-worth chart in primary currency
- [ ] **CHART-02**: User can see historical balance chart per account
- [ ] **CHART-03**: Chart points use as-of balance × as-of FX (no rewrite with today’s rate)

### Platform

- [x] **PLAT-01**: App runs in Docker with all data in local SQLite on the host

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Accounts

- **ACCT-04**: User can archive/close accounts (exclude from current NW, keep history)

### Balances

- **BAL-03**: User can copy-forward previous balances / confirm unchanged for faster updates

### FX

- **FX-03**: User can optionally fetch a rate from an API and save it as a dated manual row

### Net Worth / Charts

- **NW-04**: User can see assets vs liabilities breakdown on charts
- **PLAT-02**: User can export CSV / back up SQLite data

### Cash flow & goals (post-v1 product surface)

- **FLOW-01**: User can track spending and where money goes
- **DEBT-01**: User can track debts to/from people with due dates
- **GOAL-01**: User can set long-term purchase goals with target dates
- **CARD-01**: User can see credit-card payment due date reminders

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Full transaction ledger / double-entry | Conflicts with snapshot-first v1 model |
| Bank / CSV / API sync for transactions | Manual updates only; local privacy posture |
| Automatic live FX without dated rows | Would rewrite or hide historical truth |
| Arbitrary non-primary FX pairs | v1 only primary ↔ other |
| Budgets / envelopes / category spend | Needs transactions; dilutes capital MVP |
| Live crypto market prices / P&L | Portfolio-tracker scope, not snapshot NW |
| Multi-user / auth / cloud sync | Single local user |
| Investment holdings / tickers | Single balance per account until demanded |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PLAT-01 | Phase 1 | Complete |
| CURR-01 | Phase 2 | Pending |
| ACCT-01 | Phase 2 | Pending |
| ACCT-02 | Phase 2 | Pending |
| BAL-01 | Phase 3 | Pending |
| BAL-02 | Phase 3 | Pending |
| FX-01 | Phase 4 | Pending |
| FX-02 | Phase 4 | Pending |
| NW-01 | Phase 5 | Pending |
| NW-02 | Phase 5 | Pending |
| NW-03 | Phase 5 | Pending |
| ACCT-03 | Phase 5 | Pending |
| CHART-01 | Phase 6 | Pending |
| CHART-02 | Phase 6 | Pending |
| CHART-03 | Phase 6 | Pending |

**Coverage:**

- v1 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0 ✓

---
*Requirements defined: 2026-09-02*
*Last updated: 2026-09-02 after roadmap creation*
