# Requirements: Wallet

**Defined:** 2026-09-04
**Milestone:** v1.1 Долги людям
**Core Value:** At any moment, see true net worth (assets minus credit-card debt) in the primary currency and in each account's original currency, with history you can trust over time.

## v1.1 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### People

- [ ] **PERSON-01**: User can create, rename, and list people (counterparties)
- [ ] **PERSON-02**: User can delete a person only when that person has no debts

### Debts

- [ ] **DEBT-01**: User can create and edit a debt with direction (I owe / they owe me), currency, initial amount, optional due date, optional note
- [x] **DEBT-02**: Remaining balance = initial − sum of repayments − write-off
- [ ] **DEBT-03**: Initial amount cannot change after the first repayment
- [ ] **DEBT-04**: Debt auto-closes when remaining reaches 0
- [ ] **DEBT-05**: User can close early by writing off / forgiving remaining

### Repayments

- [ ] **REPAY-01**: User can record a partial repayment in the debt’s currency with an as-of date (backdating allowed)
- [ ] **REPAY-02**: User can see repayment history for a debt
- [ ] **REPAY-03**: User can delete a repayment; remaining recalculates; debt reopens if it was closed at zero and remaining > 0

### Charts & totals

- [ ] **DCHART-01**: User can see remaining-balance-over-time chart in the debt’s currency
- [ ] **DCHART-02**: User can see repayment-amounts chart for a debt
- [ ] **DTOTAL-01**: Debts section shows totals «I owe» / «they owe me» in primary with partial banner when FX missing

### Nav / isolation

- [ ] **DNAV-01**: Separate nav section «Долги»
- [x] **DISOL-01**: Debts never change net worth or NW charts

## Future Requirements

Deferred beyond v1.1. Tracked but not in current roadmap.

### People / Debts

- **PERSON-03**: User can merge duplicate people
- **DEBT-06**: User can filter/search debts by status, direction, counterparty, due soon
- **DEBT-07**: Interest or penalty adjustments on personal debts

### Repayments

- **REPAY-04**: User can repay in a different currency than the debt
- **REPAY-05**: Repayment can optionally update an account balance snapshot

### Goals / cash flow

- **GOAL-01**: User can set long-term purchase goals with target dates
- **FLOW-01**: User can track spending and where money goes

### Residual v1 debt (not this milestone)

- **ACCT-04**: User can archive/close/delete accounts
- **NAV-CURR-01**: Nav «Валюты» lands on currency list (discoverability)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Debts included in net worth | Explicit product decision — side ledger only |
| Savings goals | Deferred; not selected for v1.1 |
| Debt list filters | Single list for v1.1 |
| Cross-currency repayments | Complexity; same-currency only |
| Interest / penalties | Principal only |
| Transaction ledger on accounts | Still snapshot-based capital |
| Auto FX / bank import | Unchanged from v1 deferrals |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PERSON-01 | Phase 9 | Pending |
| PERSON-02 | Phase 9 | Pending |
| DEBT-01 | Phase 9 | Pending |
| DEBT-02 | Phase 8 | Complete |
| DEBT-03 | Phase 8 | Pending |
| DEBT-04 | Phase 10 | Pending |
| DEBT-05 | Phase 10 | Pending |
| REPAY-01 | Phase 10 | Pending |
| REPAY-02 | Phase 10 | Pending |
| REPAY-03 | Phase 10 | Pending |
| DCHART-01 | Phase 11 | Pending |
| DCHART-02 | Phase 11 | Pending |
| DTOTAL-01 | Phase 11 | Pending |
| DNAV-01 | Phase 9 | Pending |
| DISOL-01 | Phase 8 + 11 | Complete |

**Coverage:**

- v1.1 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0

---
*Requirements defined: 2026-09-04*
*Last updated: 2026-09-04 after roadmap mapping*
