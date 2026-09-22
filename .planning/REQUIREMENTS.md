# Requirements: Wallet v1.5 Сберегательный счет

**Defined:** 2026-09-11
**Core Value:** At any moment, see true net worth (assets minus credit-card debt) in the primary currency and in each account's original currency, with history you can trust over time.

## v1.5 Requirements

### Account

- [x] **ACCT-01**: User can create and manage accounts of type `SAVINGS` (distinct from debit/credit/crypto/cash) with name, currency, annual interest rate, and accrual day-of-month
- [x] **ACCT-02**: SAVINGS account balances are included in net worth totals and history like other asset accounts (not excluded as a side ledger)
- [x] **ACCT-03**: User can see annual interest rate and accrual day-of-month on SAVINGS account UI (list/detail and create/edit)
- [ ] **ACCT-04**: User can switch an existing account between `ASSET` and `SAVINGS` in account settings (both directions); `SAVINGS` requires rate + accrual day; leaving `SAVINGS` clears those fields; snapshots and historical NW stay; other types stay immutable

### Interest forecast

- [x] **INT-01**: Expected monthly interest for a SAVINGS account equals LOCF balance × annual rate / 12, credited on the account's accrual day-of-month (with `clampDayOfMonth`)
- [x] **INT-02**: On Капитал `/`, dashed «Прогноз» includes future SAVINGS interest credits as overlay slots (ΔNW = +interest; future accrual dates only)
- [x] **INT-03**: Interest forecast slots use FX LOCF honesty (partial banner when primary conversion rate missing for non-primary SAVINGS)

### Isolation

- [x] **SAVISO-01**: Savings interest forecast never writes `BalanceSnapshot` or changes historical NW LOCF
- [x] **SAVISO-02**: Regression suite asserts SAVISO isolation (never-calls on snapshot mutates + golden historical series identity without interest)

### MCP

- [x] **MCP-01**: Agent can list accounts via MCP including SAVINGS type with annual rate and accrual day-of-month fields
- [x] **MCP-02**: Agent can get Капитал forecast overlay via MCP including interest events alongside income and grace
- [x] **PARITY-01**: Standing rule upheld — new user-visible savings read surfaces ship matching MCP read tool fields in the same milestone

## Future Requirements

### Deferred from scoping / research

- Overdue accrual UX («проценты должны были капнуть — обнови баланс»)
- Chart legend / tooltip polish separating income vs interest vs grace kinds
- Dated interest-rate history
- Compound / daily / min-balance bank accrual engines
- Auto `BalanceSnapshot` when interest accrues
- Savings goals with target dates
- Timezone selection in settings
- MCP write / mutate tools; in-app chat UI

## Out of Scope

| Feature | Reason |
|---------|--------|
| Auto BalanceSnapshot on accrual day | User lock — forecast overlay only; manual snapshot remains SoT |
| Compound / APY / daily accrual engines | Locked simple annual%/12; bank rules vary |
| Flag `isSavings` on FIAT_DEBIT | User lock — distinct `SAVINGS` type |
| Model interest as income side-ledger | Interest is capital growth expectation on an account, not INISO income |
| Long-term savings goals | Separate product surface |
| Tax / НДФЛ withholding on interest | Out of NW tracker scope |
| MCP writes / in-app chat | Still deferred after v1.4 |
| Publish MCP beyond localhost | Locked out |
| Timezone picker | Moscow calendar default; separate todo |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ACCT-01 | Phase 27 | Complete |
| ACCT-02 | Phase 27 | Complete |
| ACCT-03 | Phase 27 | Complete |
| ACCT-04 | Phase 31 | Pending (31-01 server done; 31-02 UI) |
| INT-01 | Phase 28 | Complete |
| INT-02 | Phase 29 | Complete |
| INT-03 | Phase 29 | Complete |
| SAVISO-01 | Phase 29 | Complete |
| SAVISO-02 | Phase 29 | Complete |
| MCP-01 | Phase 30 | Complete |
| MCP-02 | Phase 30 | Complete |
| PARITY-01 | Phase 30 | Complete |

**Coverage:**

- v1.5 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0 ✓

---
*Requirements defined: 2026-09-11*
*Last updated: 2026-09-11 after v1.5 roadmap*
