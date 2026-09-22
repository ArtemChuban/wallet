# Roadmap: Wallet

## Milestones

- ✅ **v1.0 MVP** — Phases 1–7 (shipped 2026-09-04)
- ✅ **v1.1 Долги людям** — Phases 8–12 (shipped 2026-09-07)
- ✅ **v1.2 Доходы** — Phases 13–17 (shipped 2026-09-08)
- ✅ **v1.3 Кредитка** — Phases 18–22 (shipped 2026-09-10)
- ✅ **v1.4 Local MCP** — Phases 23–26 (shipped 2026-09-11)
- **v1.5 Сберегательный счет** — Phases 27–30 (in progress)

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

<details>
<summary>✅ v1.3 Кредитка (Phases 18–22) — SHIPPED 2026-09-10</summary>

- [x] Phase 18: Bank contract study + discuss locks (2/2 plans) — completed 2026-09-08
- [x] Phase 19: Schema + pure grace domain math (3/3 plans) — completed 2026-09-09
- [x] Phase 20: Obligation CRUD + cycle UI (3/3 plans) — completed 2026-09-09
- [x] Phase 21: Капитал forecast integration (3/3 plans) — completed 2026-09-09
- [x] Phase 22: GRACEISO regression + polish (2/2 plans) — completed 2026-09-10

Full detail: [milestones/v1.3-ROADMAP.md](./milestones/v1.3-ROADMAP.md)

</details>

<details>
<summary>✅ v1.4 Local MCP (Phases 23–26) — SHIPPED 2026-09-11</summary>

- [x] Phase 23: MCP Host + Localhost Safety (2/2 plans) — completed 2026-09-10
- [x] Phase 24: Capital Read Tools (4/4 plans) — completed 2026-09-10
- [x] Phase 25: Side-Ledger Tools + Isolation (4/4 plans) — completed 2026-09-10
- [x] Phase 26: Connect Docs + Policy (4/4 plans) — completed 2026-09-11

Full detail: [milestones/v1.4-ROADMAP.md](./milestones/v1.4-ROADMAP.md)

</details>

### v1.5 Сберегательный счет (Phases 27–31)

- [x] **Phase 27: SAVINGS schema + CRUD** - Distinct SAVINGS type with rate/DOM fields; principal in NW (completed 2026-09-11)
- [x] **Phase 28: Interest math + forecast kind** - Pure monthly interest + `interest` forecast slot kind (completed 2026-09-21)
- [x] **Phase 29: Капитал overlay + SAVISO** - Dashed «Прогноз» interest credits + isolation twin (completed 2026-09-21)
- [x] **Phase 30: MCP PARITY + verify** - Agent reads SAVINGS fields + interest overlay events (completed 2026-09-22)
- [ ] **Phase 31: ASSET ↔ SAVINGS type conversion** - Switch type both ways in account settings

## Phase Details

### Phase 27: SAVINGS schema + CRUD

**Goal**: Users can create and manage SAVINGS accounts whose balances count in net worth like other assets
**Depends on**: Nothing (v1.5 start; builds on shipped capital accounts)
**Requirements**: ACCT-01, ACCT-02, ACCT-03
**Success Criteria** (what must be TRUE):

  1. User can create a SAVINGS account with name, currency, annual interest rate, and accrual day-of-month (type distinct from debit/credit/crypto/cash)
  2. User can edit and see annual rate + accrual day on SAVINGS list/detail and create/edit forms
  3. SAVINGS account balances appear in Капитал net-worth totals and history like other asset accounts
  4. Manual BalanceSnapshot path for SAVINGS works the same as other asset accounts (no auto interest write)

**Plans**: 4/4 plans executed
Plans:

- [x] 27-01-PLAN.md — Wave 0 red Vitest contracts (Zod/soft/NW/display/actions)
- [x] 27-02-PLAN.md — One-way CHECK gate + create tracer (schema→form) + migrate deploy
- [x] 27-03-PLAN.md — Coherent SAVINGS edit action + AccountFormDialog chrome
- [x] 27-04-PLAN.md — List rate%+countdown + page props + D-16 snapshot honesty

**UI hint**: yes

### Phase 28: Interest math + forecast kind

**Goal**: Expected monthly interest is a locked, reusable formula ready for the forecast overlay
**Depends on**: Phase 27
**Requirements**: INT-01
**Success Criteria** (what must be TRUE):

  1. Expected monthly interest for a SAVINGS account equals LOCF balance × annual rate / 12 (no silent compound/APY)
  2. Accrual dates use the account's day-of-month with `clampDayOfMonth` (incl. short months / Feb)
  3. Forecast slot kind `"interest"` carries ΔNW = +interest (positive credit, not grace A′=0)
  4. Interest membership is future-only (accrual dates after today) so past fact line stays untouched by the formula path

**Plans:** 2/2 plans complete

Plans:

- [x] 28-01-PLAN.md — Wave 0 red Vitest contracts (÷12 compound chain + interest kind window)
- [x] 28-02-PLAN.md — Tracer: compound enumerator + interest ΔNW kind + serialized union

### Phase 29: Капитал overlay + SAVISO

**Goal**: Users see future SAVINGS interest on dashed «Прогноз» without rewriting historical NW
**Depends on**: Phase 28
**Requirements**: INT-02, INT-03, SAVISO-01, SAVISO-02
**Success Criteria** (what must be TRUE):

  1. On Капитал `/`, dashed «Прогноз» includes future SAVINGS interest credits alongside income and grace
  2. Missing FX for non-primary SAVINGS shows the same partial-honesty banner pattern as other overlay sources
  3. Recording/viewing interest forecast never creates BalanceSnapshot and never changes historical NW LOCF
  4. Regression suite proves SAVISO (never-calls on snapshot mutates + golden historical series identity without interest)

**Plans:** 2/2 plans complete

Plans:

- [x] 29-01-PLAN.md — Wave 0 red contracts: SAVISO isolation, signed grace totals, tooltip file-scan
- [x] 29-02-PLAN.md — Tracer: interest slots on Прогноз, grace line dip, tooltip block

**UI hint**: yes

### Phase 30: MCP PARITY + verify

**Goal**: Agents see the same SAVINGS read surfaces as the UI (PARITY-01)
**Depends on**: Phase 29
**Requirements**: MCP-01, MCP-02, PARITY-01
**Success Criteria** (what must be TRUE):

  1. Agent can list accounts via MCP including SAVINGS type with annual rate and accrual day-of-month
  2. Agent can get Капитал forecast overlay via MCP including `interest` events with income and grace
  3. New savings read surfaces ship matching MCP read tool fields in the same milestone (PARITY-01 upheld)
  4. MCP descriptions/isolation contract name SAVISO alongside INISO/GRISO; Orca/Nyquist verify overlay visible and historical NW unchanged without new snaps

**Plans:** 2/2 plans complete

Plans:
**Wave 1**

- [x] 30-01-PLAN.md — Tracer: list_accounts SAVINGS fields + overlay interest + SAVISO Wave 0→green

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 30-02-PLAN.md — Orca UAT + COVERAGE.md + D-16 todo gate

**Cross-cutting constraints:**

- No visual changes this phase — MCP + Vitest + Orca only (UI-SPEC)
- Do not reopen Phase 29 chart/tooltip/banner chrome (UI-SPEC)
- Done bar is Vitest contracts plus Orca MCP tool calls, not chart DOM UAT (D-13, D-14, UI-SPEC)

### Phase 31: ASSET ↔ SAVINGS type conversion

**Goal**: User can switch an existing account between `ASSET` and `SAVINGS` in account settings, both directions
**Depends on**: Phase 27 (SAVINGS schema + edit form). Does not block Phases 29–30
**Requirements**: ACCT-04
**Success Criteria** (what must be TRUE):

  1. In account settings, user can change type `ASSET` → `SAVINGS` and must set annual rate + accrual day-of-month (same invariants as create)
  2. User can change type `SAVINGS` → `ASSET`; rate and accrual day clear so the non-SAVINGS CHECK holds
  3. Balance snapshots and historical NW stay; conversion does not write a new snapshot and does not drop history
  4. Other types (`FIAT_CREDIT` and legacy asset aliases) stay immutable — only `ASSET` ↔ `SAVINGS`

**Plans:** 2 plans

Plans:
- [ ] 31-01-PLAN.md — Tracer: Zod + updateAccount ASSET↔SAVINGS matrix + never-calls snapshot
- [ ] 31-02-PLAN.md — UI AccountFormDialog unlock + source-scan tests + UAT scaffold

**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 27. SAVINGS schema + CRUD | 4/4 | Complete    | 2026-09-11 |
| 28. Interest math + forecast kind | 2/2 | Complete    | 2026-09-21 |
| 29. Капитал overlay + SAVISO | 2/2 | Complete    | 2026-09-21 |
| 30. MCP PARITY + verify | 2/2 | Complete    | 2026-09-22 |
| 31. ASSET ↔ SAVINGS type conversion | 0/2 | Planned | - |

---
*Roadmap updated: 2026-09-21 — v1.5 adds Phase 31 ASSET ↔ SAVINGS conversion*
