# Roadmap: Wallet

## Milestones

- ✅ **v1.0 MVP** — Phases 1–7 (shipped 2026-09-04)
- ✅ **v1.1 Долги людям** — Phases 8–12 (shipped 2026-09-07)
- 🚧 **v1.2 Доходы** — Phases 13–17 (all phases complete — ready `/gsd-complete-milestone`)

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

### 🚧 v1.2 Доходы (Phases complete)

**Milestone Goal:** Учёт доходов (регулярная зарплата + разовые) с контрагентами, plan vs actual, мульти-валюта; страница «Доходы»; на Капитале — прогноз NW с регулярной зарплатой; просрочка без факта подсвечена.

- [x] **Phase 13: Income schema + domain math** - Persist sources/actuals; virtual occurrences; DOM clamp; plan≠actual fields (completed 2026-09-07)
- [x] **Phase 14: Доходы CRUD + nav** - «Доходы» page/nav; create/edit/delete recurring + one-time income (completed 2026-09-07)
- [x] **Phase 15: Plan vs actual + overdue** - Record actual; overdue «заполни»; plan vs actual variance on «Доходы» (completed 2026-09-07)
- [x] **Phase 16: Counterparty income stats** - Per-Person Σ in primary with FX LOCF honesty (completed 2026-09-07)
- [x] **Phase 17: NW forecast overlay + isolation** - Капитал dashed forecast from open planned pay (recurring + future one-time); INISO / no BalanceSnapshot writes (completed 2026-09-07)

## Phase Details

### Phase 13: Income schema + domain math

**Goal**: Income domain exists as a side ledger — sources, actuals, virtual plan slots, and day-of-month rules ready for UI
**Depends on**: Phase 12 (v1.1 shipped)
**Requirements**: (foundation — no v1.2 REQ-IDs; enables SRC/ACT/CPTY/FCST/ISO)
**Success Criteria** (what must be TRUE):

  1. Prisma models persist recurring and one-time income sources with Person + Currency FKs and independent plan vs actual fields
  2. Pure domain helpers list virtual plan occurrences with day-of-month clamp (short months never skip)
  3. Vitest covers occurrence identity, overdue predicate inputs, and BigInt money paths without writing BalanceSnapshot

**Plans**: 3/3 plans complete

Plans:
**Wave 1**

- [x] 13-01-PLAN.md — Four-model schema + clampDayOfMonth + listRecurringOccurrences tracer + migrate deploy

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 13-02-PLAN.md — Freeze-aware recurring + one-time + listAllInRange occurrence API

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 13-03-PLAN.md — Overdue/immutability helpers + schema/ISO locks + full suite

### Phase 14: Доходы CRUD + nav

**Goal**: User can manage income sources from a dedicated «Доходы» section
**Depends on**: Phase 13
**Requirements**: SRC-01, SRC-02, UI-01
**Success Criteria** (what must be TRUE):

  1. User can create recurring monthly income (day-of-month, planned amount, currency, Person counterparty)
  2. User can create one-time income (planned date, amount, currency, Person, optional note)
  3. User reaches income via nav «Доходы» and can edit/delete sources; deletes use DestructiveConfirmStep
  4. Recording or listing income never changes account balances (RU copy / behavior matches lock)

**Plans:** 3/3 plans complete

Plans:
**Wave 1**

- [x] 14-01-PLAN.md — Nav + /income shell, Zod validations, nextOpenPlannedAsOf

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 14-02-PLAN.md — Income Server Actions + Person Restrict dual revalidate

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 14-03-PLAN.md — IncomeList + IncomeFormDialog full CRUD UI

**UI hint**: yes

### Phase 15: Plan vs actual + overdue

**Goal**: User can fill facts against plans and see overdue + variance on «Доходы»
**Depends on**: Phase 14
**Requirements**: ACT-01, ACT-02, ACT-03
**Success Criteria** (what must be TRUE):

  1. User can record actual amount and actual date independently; plan fields stay for variance
  2. When planned date is before Moscow today and no actual exists, occurrence shows overdue «заполни»
  3. User can see plan vs actual variance (view/chart) on «Доходы»

**Plans**: 3/3 plans executed

Plans:
**Wave 1**

- [x] 15-01-PLAN.md — Recurring actual upsert tracer + Zod schemas + variance helpers (ACT-01, ACT-03)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 15-02-PLAN.md — Remaining actual actions + RSC overdue/hasActual join (ACT-01, ACT-02)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 15-03-PLAN.md — IncomeFactDialog + overdue/variance chrome + suite gate (ACT-02, ACT-03)

**UI hint**: yes

### Phase 16: Counterparty income stats

**Goal**: User can see how much income came from each Person in primary currency
**Depends on**: Phase 15
**Requirements**: CPTY-01
**Success Criteria** (what must be TRUE):

  1. User can view per-Person income totals on «Доходы» converted to primary via FX LOCF as-of
  2. Missing FX rates surface partial honesty (excluded/incomplete), not invented rates or silent zeros

**Plans**: 2/2 plans complete

Plans:

- [x] 16-01-PLAN.md — Wave 0 + tracer computePersonIncomeStats + page/header native path (CPTY-01)
- [x] 16-02-PLAN.md — Hybrid UI chrome + REQUIREMENTS CPTY-01 sync + VALIDATION gate (CPTY-01)

**UI hint**: yes

### Phase 17: NW forecast overlay + isolation

**Goal**: Капитал shows forward NW projection from open planned pay (recurring + future one-time); historical NW stays account-only
**Depends on**: Phase 16
**Requirements**: FCST-01, ISO-01
**Success Criteria** (what must be TRUE):

  1. On `/`, user sees NW chart with future dashed overlay from open planned income (recurring + future one-time) converted via FX LOCF
  2. Horizon mirrors dashboard lookback preset (`all` capped at 1y); filled/today/overdue slots stay out of overlay
  3. Past NW series / `computeNetWorthRows` unchanged with or without income data; income actions never write BalanceSnapshot
  4. Isolation regressions (file-scan / property) and Nyquist validation for v1.2 income phases are green

**Plans**: 3/3 plans executed

Plans:

- [x] 17-01-PLAN.md — Wave 0 + tracer forecast overlay + domain (membership/horizon/FX)
- [x] 17-02-PLAN.md — INISO one-way gate + suite green + FCST-01 docs sync
- [x] 17-03-PLAN.md — Chart chrome / partial banner + VALIDATION Nyquist gate

**UI hint**: yes

## Progress

| Milestone | Phases | Plans | Status |
|-----------|--------|-------|--------|
| v1.0 | 1–7 | 24/24 | Shipped 2026-09-04 |
| v1.1 | 8–12 | 18/18 | Shipped 2026-09-07 |
| v1.2 | 13–17 | 0/? | In progress |

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 13. Income schema + domain math | 3/3 | Plans complete | 2026-09-07 |
| 14. Доходы CRUD + nav | 3/3 | Not started | 2026-09-07 |
| 15. Plan vs actual + overdue | 3/3 | Not started | 2026-09-07 |
| 16. Counterparty income stats | 2/2 | Planned | 2026-09-07 |
| 17. NW forecast overlay + isolation | 3/3 | Planned | 2026-09-07 |

*Next: `/gsd-execute-phase 17`*
