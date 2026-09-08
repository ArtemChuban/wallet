# Requirements: Wallet v1.3 Кредитка

**Defined:** 2026-09-08
**Core Value:** At any moment, see true net worth (assets minus credit-card debt) in the primary currency and in each account's original currency, with history you can trust over time.

## v1.3 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Cycle

- [ ] **CYCLE-01**: User can set grace-period start date and duration (days) on a credit account; the cycle repeats monthly
- [ ] **CYCLE-02**: User can see cycle instances for a credit account (current / next due)

### Obligation

- [ ] **OBL-01**: User can manually enter the amount due by the end of the interest-free window for a cycle
- [ ] **OBL-02**: User can record early repayment / close of that obligation
- [ ] **OBL-03**: When due date has passed without close, UI highlights the obligation so the user can act

### Forecast

- [ ] **GRFCST-01**: On Капитал `/`, «Прогноз» includes open credit grace obligations from their due dates
- [ ] **GRFCST-02**: Forecast credit slots use FX LOCF honesty (partial banner when rate missing)

### Isolation / clarity

- [ ] **GRISO-01**: Grace actions never write `BalanceSnapshot` or change historical NW LOCF
- [ ] **UX-01**: UI clearly distinguishes snapshot credit debt from grace amount due (Russian copy)

### Contract gate

- [ ] **CONT-01**: Bank contract studied and grace rules documented in phase CONTEXT before plan lock

## Future Requirements

Deferred beyond v1.3. Tracked but not in current roadmap.

- Chart legend separating доходы vs обязательства on «Прогноз»
- Timezone selection in settings
- Local AI agent via subprocess
- Account delete (ACCT-04)
- Auto-apply income actual → BalanceSnapshot
- Pause / end date on recurring income templates
- Nav badge for overdue income / grace counts

## Out of Scope

Explicit exclusions for this milestone.

| Item | Reason |
|------|--------|
| Derive amount due from balance-snapshot history | Manual entry lock for v1.3 |
| Full APR / penalty / revolving interest engine | Grace track + forecast only unless contract study forces more |
| Auto-update BalanceSnapshot when grace obligation closed | Snapshot remains source of truth |
| Minimum vs statement vs full-debt triad UI | One manual «сумма к оплате до конца льготного» field |
| Bank / CSV / API sync of statements | Manual-only app |
| Per-purchase grace windows | Needs transaction ledger Wallet does not have |
| Feeding grace into historical `computeNetWorthRows` / LOCF | GRISO-01; forecast overlay only |
| Debts affecting net worth | Still DISOL-01 |
| Push / email due reminders | In-app overdue highlight only |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CONT-01 | — | Pending |
| CYCLE-01 | — | Pending |
| CYCLE-02 | — | Pending |
| OBL-01 | — | Pending |
| OBL-02 | — | Pending |
| OBL-03 | — | Pending |
| GRFCST-01 | — | Pending |
| GRFCST-02 | — | Pending |
| GRISO-01 | — | Pending |
| UX-01 | — | Pending |

**Coverage:**
- v1.3 requirements: 10 total
- Mapped to phases: 0
- Unmapped: 10 (filled by roadmapper)

---
*Requirements defined: 2026-09-08*
*Last updated: 2026-09-08 after v1.3 requirements confirmation*
