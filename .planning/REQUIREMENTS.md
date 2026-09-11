# Requirements: Wallet v1.5 Сберегательный счет

**Defined:** 2026-09-11
**Core Value:** At any moment, see true net worth (assets minus credit-card debt) in the primary currency and in each account's original currency, with history you can trust over time.

## v1.5 Requirements

### Account

- [ ] **ACCT-01**: User can create and manage accounts of type `SAVINGS` (distinct from debit/credit/crypto/cash) with name, currency, annual interest rate, and accrual day-of-month
- [ ] **ACCT-02**: SAVINGS account balances are included in net worth totals and history like other asset accounts (not excluded as a side ledger)
- [ ] **ACCT-03**: User can see annual interest rate and accrual day-of-month on SAVINGS account UI (list/detail and create/edit)

### Interest forecast

- [ ] **INT-01**: Expected monthly interest for a SAVINGS account equals LOCF balance × annual rate / 12, credited on the account's accrual day-of-month (with `clampDayOfMonth`)
- [ ] **INT-02**: On Капитал `/`, dashed «Прогноз» includes future SAVINGS interest credits as overlay slots (ΔNW = +interest; future accrual dates only)
- [ ] **INT-03**: Interest forecast slots use FX LOCF honesty (partial banner when primary conversion rate missing for non-primary SAVINGS)

### Isolation

- [ ] **SAVISO-01**: Savings interest forecast never writes `BalanceSnapshot` or changes historical NW LOCF
- [ ] **SAVISO-02**: Regression suite asserts SAVISO isolation (never-calls on snapshot mutates + golden historical series identity without interest)

### MCP

- [ ] **MCP-01**: Agent can list accounts via MCP including SAVINGS type with annual rate and accrual day-of-month fields
- [ ] **MCP-02**: Agent can get Капитал forecast overlay via MCP including interest events alongside income and grace
- [ ] **PARITY-01**: Standing rule upheld — new user-visible savings read surfaces ship matching MCP read tool fields in the same milestone

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

Filled by roadmap.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ACCT-01 | — | Pending |
| ACCT-02 | — | Pending |
| ACCT-03 | — | Pending |
| INT-01 | — | Pending |
| INT-02 | — | Pending |
| INT-03 | — | Pending |
| SAVISO-01 | — | Pending |
| SAVISO-02 | — | Pending |
| MCP-01 | — | Pending |
| MCP-02 | — | Pending |
| PARITY-01 | — | Pending |

**Coverage:**
- v1.5 requirements: 11 total
- Mapped to phases: 0
- Unmapped: 11 ⚠️

---
*Requirements defined: 2026-09-11*
*Last updated: 2026-09-11 after v1.5 scoping*
