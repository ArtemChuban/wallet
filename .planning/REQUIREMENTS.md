# Requirements: Wallet v1.3 Кредитка

**Defined:** 2026-09-08
**Core Value:** At any moment, see true net worth (assets minus credit-card debt) in the primary currency and in each account's original currency, with history you can trust over time.

## v1.3 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Cycle

- [x] **CYCLE-01**: User can set statement day-of-month and due day-of-month on a credit account (monthly repeat); statement DOM uses `clampDayOfMonth` (D-03); due is next-month DOM (this bank: 15) per dual-DOM SoT (D-02) — prefer `statementDayOfMonth` + `dueDayOfMonth` over sole `graceDurationDays`
- [x] **CYCLE-02**: User can see cycle instances for a credit account (current / next due)

### Obligation

- [x] **OBL-01**: User can manually enter the amount due by the end of the interest-free window for a cycle
- [ ] **OBL-02**: User can record early repayment / close of that obligation
- [ ] **OBL-03**: When due date has passed without close, UI highlights the obligation so the user can act

### Forecast

- [ ] **GRFCST-01**: On Капитал `/`, «Прогноз» includes open credit grace obligations from their due dates
- [ ] **GRFCST-02**: Forecast credit slots use FX LOCF honesty (partial banner when rate missing)

### Isolation / clarity

- [ ] **GRISO-01**: Grace actions never write `BalanceSnapshot` or change historical NW LOCF
- [ ] **UX-01**: UI clearly distinguishes snapshot credit debt from grace amount due (Russian copy)

### Contract gate

- [x] **CONT-01**: Bank contract studied and grace rules documented in phase CONTEXT before plan lock

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
| Full APR / penalty / revolving interest engine | D-07/D-10 — overdue highlight + RU hint only; no APR/penalty math |
| Cash / cash-like ops (59.9%) modeling | D-08 — fully OOS |
| Bank rule «missed minimum voids next interest-free» | D-09 — not modeled (needs min/triad UI) |
| Penalty 20%, overlimit fee, insurance % | D-10 — all OOS; grace payoff + forecast visibility only |
| Auto-update BalanceSnapshot when grace obligation closed | Snapshot remains source of truth |
| Minimum vs statement vs full-debt triad UI | D-09/D-16 — one manual «Платёж для беспроцентного» field; min hidden |
| Bank / CSV / API sync of statements | Manual-only app |
| Per-purchase grace windows | Needs transaction ledger Wallet does not have |
| Feeding grace into historical `computeNetWorthRows` / LOCF | GRISO-01; forecast overlay only |
| Debts affecting net worth | Still DISOL-01 |
| Push / email due reminders | In-app overdue highlight only |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| CONT-01 | Phase 18 | Complete |
| CYCLE-01 | Phase 19 | Complete |
| CYCLE-02 | Phase 20 | Complete |
| OBL-01 | Phase 20 | Complete |
| OBL-02 | Phase 20 | Pending |
| OBL-03 | Phase 20 | Pending |
| UX-01 | Phase 20 | Pending |
| GRFCST-01 | Phase 21 | Pending |
| GRFCST-02 | Phase 21 | Pending |
| GRISO-01 | Phase 22 | Pending |

**Coverage:**

- v1.3 requirements: 10 total
- Mapped to phases: 10
- Unmapped: 0

---
*Requirements defined: 2026-09-08*
*Last updated: 2026-09-08 after v1.3 roadmap (phases 18–22)*
