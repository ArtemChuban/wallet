# Roadmap: Wallet

## Milestones

- ✅ **v1.0 MVP** — Phases 1–7 (shipped 2026-09-04)
- 🚧 **v1.1 Долги людям** — Phases 8–11 (in planning)

## Overview

v1.1 adds a personal-debts side ledger (people → debts → dated repayments) with charts and primary totals, without changing net-worth semantics. Build order: schema + pure math → CRUD/nav → repayments/close → charts/totals.

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

- [ ] **Phase 8: Debts schema + domain math** — Person/Debt/DebtRepayment models; remaining, write-off, primary totals helpers + tests; NW untouched
- [ ] **Phase 9: People + debts CRUD + nav** — `/debts` list, person/debt dialogs, «Долги» nav, RU empty states
- [ ] **Phase 10: Repayments + close/write-off** — Dated repayments, history, delete/reopen, auto-close, early forgive
- [ ] **Phase 11: Charts + primary totals** — Remaining + repayment charts; I-owe/they-owe primary hero with FX partial banner

## Phase Details

### Phase 8: Debts schema + domain math

**Goal:** Persist people/debts/repayments and lock remaining/write-off/totals math in pure functions with tests — no NW coupling.
**Depends on:** v1.0 complete (Currency, FxRate, money helpers)
**Requirements:** DEBT-02, DEBT-03, DISOL-01
**Success Criteria:**

  1. Prisma models Person, Debt, DebtRepayment, DebtSizeChange migrate cleanly on Docker start
  2. Pure helpers: remaining = initial + Σ delta − Σ repayments; reject over-repayment (CONTEXT D-04; not writeOff field)
  3. initialAmountMinor not edited after create; adjustments via size-change events (D-03)
  4. No debt imports exist in `net-worth.ts`, `historical-series.ts`, or `/` page

**Plans:** 1/3 plans executed

Plans:
**Wave 1**

- [x] 08-01-PLAN.md — Decision gate + schema/migration tracer + remainingMinor + DISOL scan + migrate deploy

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 08-02-PLAN.md — Domain asserts (DEBT-03) + computeDebtPrimaryTotals (D-16–D-19)
- [ ] 08-03-PLAN.md — Zod validations/debts + full suite green

### Phase 9: People + debts CRUD + nav

**Goal:** User can manage people and debts in a dedicated «Долги» section (without repayments UI yet).
**Depends on:** Phase 8
**Requirements:** PERSON-01, PERSON-02, DEBT-01, DNAV-01
**Success Criteria:**

  1. User can create, rename, and list people in Russian UI
  2. User can delete a person only when they have no debts (blocked otherwise)
  3. User can create/edit a debt (direction, currency, initial, optional due/note) attached to a person
  4. Nav shows «Долги» linking to `/debts` with correct active state

**Plans:** TBD

### Phase 10: Repayments + close/write-off

**Goal:** Partial dated repayments with history/delete, auto-close at zero, early write-off close.
**Depends on:** Phase 9
**Requirements:** REPAY-01, REPAY-02, REPAY-03, DEBT-04, DEBT-05
**Success Criteria:**

  1. User can add a same-currency repayment with as-of date (backdating allowed)
  2. User can see repayment history and delete a repayment with remaining recalculated
  3. Debt closed at zero reopens when a deletion leaves remaining > 0
  4. Debt auto-closes at remaining 0; user can close early with recorded write-off/forgive

**Plans:** TBD

### Phase 11: Charts + primary totals

**Goal:** Debt detail charts (native) and section-level primary totals with FX honesty.
**Depends on:** Phase 10
**Requirements:** DCHART-01, DCHART-02, DTOTAL-01, DISOL-01
**Success Criteria:**

  1. User sees remaining-over-time chart in the debt’s currency
  2. User sees repayment-amounts chart for the debt
  3. `/debts` shows «я должен» / «мне должны» totals in primary with partial banner when FX missing
  4. Капитал (`/`) net-worth figures unchanged when debts exist (isolation still holds)

**Plans:** TBD

## Progress

| Phase | Milestone | Plans complete | Status |
|-------|-----------|----------------|--------|
| 1–7 | v1.0 | 24/24 | Shipped |
| 8 | v1.1 | 0/3 | In Progress|
| 9 | v1.1 | 0/TBD | Not started |
| 10 | v1.1 | 0/TBD | Not started |
| 11 | v1.1 | 0/TBD | Not started |

---
*Roadmap created: 2026-09-04 for milestone v1.1*
