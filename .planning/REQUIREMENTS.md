# Requirements: Wallet v1.2 Доходы

**Defined:** 2026-09-07
**Core Value:** At any moment, see true net worth (assets minus credit-card debt) in the primary currency and in each account's original currency, with history you can trust over time.

## v1.2 Requirements

Requirements for milestone v1.2. Each maps to roadmap phases.

### Sources

- [x] **SRC-01**: User can create recurring monthly income with day-of-month, planned amount, currency, and Person counterparty
- [x] **SRC-02**: User can create one-time income with planned date, amount, currency, Person counterparty, and optional note

### Plan vs actual

- [x] **ACT-01**: User can record actual amount and actual date independently from the plan (plan fields stay for variance)
- [x] **ACT-02**: When planned date is before Moscow today and no actual exists, UI highlights the occurrence as overdue («заполни»)
- [x] **ACT-03**: User can see plan vs actual variance (view/chart) on «Доходы»

### Counterparties

- [ ] **CPTY-01**: User can view per-Person income stats (Σ in primary with FX LOCF honesty / partial)

### Доходы UI

- [x] **UI-01**: User has «Доходы» page + nav with income CRUD; deletes use DestructiveConfirmStep; recording actual does not change account balances

### Капитал forecast

- [ ] **FCST-01**: On `/`, user sees NW chart with future dashed overlay from recurring planned income converted via FX LOCF (one-time income not included in forecast)

### Isolation

- [ ] **ISO-01**: Income never mutates historical NW LOCF / `computeNetWorthRows`; income actions never write `BalanceSnapshot`

## Future Requirements

Deferred beyond v1.2. Tracked but not in current roadmap.

- Pause / end date on recurring income templates
- Nav badge for overdue income count
- Optional destination-account note on actual (still no auto-post)
- Person detail tabs combining debts + income
- Timezone selection in settings (Moscow calendar remains default)
- Credit account grace / statement forecasting
- Merge debit+crypto+cash account types
- Local AI agent via subprocess
- One-time income included in NW forecast overlay
- Variance chart refinements beyond ACT-03 MVP

## Out of Scope

Explicit exclusions for this milestone.

| Item | Reason |
|------|--------|
| Auto `BalanceSnapshot` when actual recorded | Snapshot remains source of truth; user lock |
| Biweekly / RRULE / last-weekday schedules | Complexity; locked to monthly DOM + one-time |
| Separate Employer entity | Reuse `Person` |
| Feeding income into historical LOCF / `computeNetWorthRows` | Breaks trust; ISO-01 |
| One-time amounts in Капитал forecast | User chose FCST recurring-only |
| Monte Carlo / multi-year retirement forecast | Wrong product shape |
| Bank/CSV import, auto FX APIs | Manual-only app |
| Spending / burn / budgeting categories | Not Core Value |
| Debts affecting NW | Still DISOL-01 |
| Nav «Валюты» discoverability / ACCT-04 delete | Residual v1 debt |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SRC-01 | Phase 14 | Complete |
| SRC-02 | Phase 14 | Complete |
| ACT-01 | Phase 15 | Complete |
| ACT-02 | Phase 15 | Complete |
| ACT-03 | Phase 15 | Complete |
| CPTY-01 | Phase 16 | Pending |
| UI-01 | Phase 14 | Complete |
| FCST-01 | Phase 17 | Pending |
| ISO-01 | Phase 17 | Pending |

*Mapped 2026-09-07 — roadmap phases 13–17 (Phase 13 foundation, no REQ-IDs).*
