# Roadmap: Wallet

## Milestones

- ✅ **v1.0 MVP** — Phases 1–7 (shipped 2026-09-04)
- ✅ **v1.1 Долги людям** — Phases 8–12 (shipped 2026-09-07)
- ✅ **v1.2 Доходы** — Phases 13–17 (shipped 2026-09-08)
- 🚧 **v1.3 Кредитка** — Phases 18–22 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1–7) — SHIPPED 2026-09-04</summary>

- [x] Phase 1: Docker + SQLite Foundation (4/4 plans) — completed 2026-09-02
- [x] Phase 2: Currencies + Accounts (5/5 plans) — completed 2026-09-03
- [x] Phase 3: Dated Balance Snapshots (3/3 plans) — completed 2026-09-03
- [x] Phase 4: Dated FX (3/3 plans) — completed 2026-09-03
- [x] Phase 5: Net Worth Dashboard (3/3 plans) — completed 2026-09-03
- [x] Phase 6: Historical Charts (3/3 plans) — completed 2026-09-04
- [x] Phase 7: Address tech debt: LOCF consolidation + Nyquist 3–6 (3/3 plans) — completed 2026-09-04

Full detail: [milestones/v1.0-ROADMAP.md](./milestones/v1.0-ROADMAP.md)

</details>

<details>
<summary>✅ v1.1 Долги людям (Phases 8–12) — SHIPPED 2026-09-07</summary>

- [x] Phase 8: Debts schema + domain math (3/3 plans) — completed 2026-09-04
- [x] Phase 9: People + debts CRUD + nav (4/4 plans) — completed 2026-09-05
- [x] Phase 10: Repayments + close/write-off (4/4 plans) — completed 2026-09-05
- [x] Phase 11: Charts + primary totals (4/4 plans) — completed 2026-09-06
- [x] Phase 12: Address tech debt: debts refresh + Nyquist 10–11 (3/3 plans) — completed 2026-09-07

Full detail: [milestones/v1.1-ROADMAP.md](./milestones/v1.1-ROADMAP.md)

</details>

<details>
<summary>✅ v1.2 Доходы (Phases 13–17) — SHIPPED 2026-09-08</summary>

- [x] Phase 13: Income schema + domain math (3/3 plans) — completed 2026-09-07
- [x] Phase 14: Доходы CRUD + nav (3/3 plans) — completed 2026-09-07
- [x] Phase 15: Plan vs actual + overdue (3/3 plans) — completed 2026-09-07
- [x] Phase 16: Counterparty income stats (2/2 plans) — completed 2026-09-07
- [x] Phase 17: NW forecast overlay + isolation (3/3 plans) — completed 2026-09-07

Full detail: [milestones/v1.2-ROADMAP.md](./milestones/v1.2-ROADMAP.md)

</details>

### 🚧 v1.3 Кредитка (In Progress)

**Milestone Goal:** Track monthly credit-card grace periods (start + days), manually record amount owed / early close, and show open obligations on Капитал «Прогноз» without rewriting historical NW.

- [ ] **Phase 18: Bank contract study + discuss locks** - Document bank grace rules; lock cycle/overlay decisions before schema
- [ ] **Phase 19: Schema + pure grace domain math** - Persist grace config + obligation model; trustworthy due-date math
- [ ] **Phase 20: Obligation CRUD + cycle UI** - Amount due, early close, cycle list, overdue highlight, debt≠grace copy
- [ ] **Phase 21: Капитал forecast integration** - «Прогноз» includes open grace obligations with FX LOCF honesty
- [ ] **Phase 22: GRACEISO regression + polish** - Prove grace never touches BalanceSnapshot / historical NW LOCF

## Phase Details

### Phase 18: Bank contract study + discuss locks

**Goal**: Grace cycle rules and NW overlay semantics are locked from the user's bank contract before any schema/plan precision
**Depends on**: Phase 17 (v1.2 shipped)
**Requirements**: CONT-01
**Success Criteria** (what must be TRUE):
  1. User-supplied bank contract (or notes) is studied and grace rules are written into phase CONTEXT
  2. Locked decisions exist for: cycle start definition, duration-in-days, monthly repeat/clamp, interest-free vs revolving OOS
  3. Overlay NW semantics Option A vs B is decided (or explicitly deferred with default A) before Phase 19 plan lock
  4. Vocabulary locked in Russian: льготный период ≠ долг по снимку ≠ минимум платежа
**Plans**: TBD

### Phase 19: Schema + pure grace domain math

**Goal**: Credit grace schedule and obligation identity exist as data + pure math ready for UI
**Depends on**: Phase 18
**Requirements**: CYCLE-01
**Success Criteria** (what must be TRUE):
  1. Credit account can store grace-period start date and duration (days); both null or both set
  2. Pure helpers compute monthly cycle candidates and due dates via `addCalendarDays(start, days)` (month-edge / Feb cases covered)
  3. Obligation model can persist per-cycle amount/status keyed by cycle start without deriving dues from BalanceSnapshot
**Plans**: TBD

### Phase 20: Obligation CRUD + cycle UI

**Goal**: User manages grace cycles and obligations on the credit account with clear RU copy
**Depends on**: Phase 19
**Requirements**: CYCLE-02, OBL-01, OBL-02, OBL-03, UX-01
**Success Criteria** (what must be TRUE):
  1. User can see cycle instances for a credit account (current / next due)
  2. User can manually enter amount due by end of interest-free window for a cycle
  3. User can record early repayment / close of that obligation (DestructiveConfirmStep; no `window.confirm`)
  4. When due date has passed without close, UI highlights the obligation so the user can act
  5. UI clearly distinguishes snapshot credit debt from grace amount due (Russian copy)
**Plans**: TBD
**UI hint**: yes

### Phase 21: Капитал forecast integration

**Goal**: Open grace obligations appear on Капитал «Прогноз» with the same FX honesty as income forecast
**Depends on**: Phase 20
**Requirements**: GRFCST-01, GRFCST-02
**Success Criteria** (what must be TRUE):
  1. On Капитал `/`, dashed «Прогноз» includes open credit grace obligations from their due dates
  2. Forecast credit slots use FX LOCF honesty; missing rate shows partial banner (never invents rates)
  3. Early-closed obligations no longer move the forecast; income + grace coexist on one signed series
**Plans**: TBD
**UI hint**: yes

### Phase 22: GRACEISO regression + polish

**Goal**: Historical NW and BalanceSnapshot stay grace-free; milestone isolation is regression-proof
**Depends on**: Phase 21
**Requirements**: GRISO-01
**Success Criteria** (what must be TRUE):
  1. Grace config / amount-due / early-close actions never write BalanceSnapshot
  2. Historical NW / past LOCF series stay identical with vs without grace data (golden / identity check)
  3. Isolation is covered by automated regression (file-scan / suite twin of INISO) suitable for milestone close
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1–7 | v1.0 | — | Complete | 2026-09-04 |
| 8–12 | v1.1 | — | Complete | 2026-09-07 |
| 13–17 | v1.2 | — | Complete | 2026-09-08 |
| 18. Bank contract study + discuss locks | v1.3 | 0/TBD | Not started | - |
| 19. Schema + pure grace domain math | v1.3 | 0/TBD | Not started | - |
| 20. Obligation CRUD + cycle UI | v1.3 | 0/TBD | Not started | - |
| 21. Капитал forecast integration | v1.3 | 0/TBD | Not started | - |
| 22. GRACEISO regression + polish | v1.3 | 0/TBD | Not started | - |

---
*Roadmap updated: 2026-09-08 — v1.3 Кредитка phases 18–22*
