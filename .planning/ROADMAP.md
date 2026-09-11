# Roadmap: Wallet

## Milestones

- ✅ **v1.0 MVP** — Phases 1–7 (shipped 2026-09-04)
- ✅ **v1.1 Долги людям** — Phases 8–12 (shipped 2026-09-07)
- ✅ **v1.2 Доходы** — Phases 13–17 (shipped 2026-09-08)
- ✅ **v1.3 Кредитка** — Phases 18–22 (shipped 2026-09-10)
- 🚧 **v1.4 Local MCP** — Phases 23–26 (in progress)

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

### 🚧 v1.4 Local MCP (In Progress)

**Milestone Goal:** In-app read-only MCP over localhost HTTP/SSE so external CLI agents query wallet data without the app spawning subprocesses.

- [x] **Phase 23: MCP Host + Localhost Safety** - In-process Streamable HTTP at `/api/mcp` with Host/Origin + loopback publish
- [x] **Phase 24: Capital Read Tools** - Accounts, NW, balances, FX via read-only MCP (completed 2026-09-10)
- [x] **Phase 25: Side-Ledger Tools + Isolation** - Debts, income, grace, forecast overlay; DISOL/INISO/GRISO locked (completed 2026-09-10)
- [ ] **Phase 26: Connect Docs + Policy** - Claude/Cursor connect snippets, readOnlyHint + isolation copy, PARITY-01 materialization

## Phase Details

### Phase 23: MCP Host + Localhost Safety

**Goal**: Running wallet exposes in-process Streamable HTTP MCP on localhost only — same Next lifecycle, no sidecar
**Depends on**: Nothing (v1.4 start; app already ships through Phase 22)
**Requirements**: HOST-01, HOST-02
**Success Criteria** (what must be TRUE):

  1. Wallet (dev or Docker) serves MCP at `/api/mcp` inside the same Next.js process (no sidecar process, no agent spawn)
  2. External client can complete MCP initialize against that URL (curl or Inspector smoke)
  3. Requests with non-localhost Host/Origin are rejected
  4. Compose host publish remains `127.0.0.1:3000:3000` (not `0.0.0.0`)

**Plans**: 2/2 plans executed
Plans:

- [x] 23-01-PLAN.md — SUS gate + Wave 0 stubs + install MCP deps
- [x] 23-02-PLAN.md — Tracer guarded /api/mcp + wallet_ping + Vitest + curl/Compose smoke

### Phase 24: Capital Read Tools

**Goal**: External agent can read accounts, net worth, balances, and FX via MCP with the same honesty as Капитал UI
**Depends on**: Phase 23
**Requirements**: CAP-01, CAP-02, CAP-03, CAP-04
**Success Criteria** (what must be TRUE):

  1. Agent can list accounts with types, currencies, and credit metadata via MCP
  2. Agent can get net worth as-of a date via MCP with partial-FX honesty (missing rates surfaced, not invented)
  3. Agent can get an account's native and primary balance as-of a date via MCP
  4. Agent can list FX rates / rate-as-of (primary↔other) via MCP

**Plans**: 4/4 plans executed

Plans:

- [x] 24-01-PLAN.md — Wave 0 stubs + serialize + as-of (D-05/06/08/09)
- [x] 24-02-PLAN.md — Tracer get_net_worth (CAP-02) + capital-era instructions
- [x] 24-03-PLAN.md — list_accounts (CAP-01) + get_account_balance (CAP-03)
- [x] 24-04-PLAN.md — list_fx_rates (CAP-04) + D-15 finalize + full regression

### Phase 25: Side-Ledger Tools + Isolation

**Goal**: Agent can read Долги / Доходы / Грейс / forecast overlay without folding side ledgers into historical NW
**Depends on**: Phase 24
**Requirements**: SIDE-01, SIDE-02, SIDE-03, SIDE-04
**Success Criteria** (what must be TRUE):

  1. Agent can list debts and debt primary totals via MCP; debts never appear folded into NW tool output (DISOL-01)
  2. Agent can list income (plan/actual/overdue) via MCP; MCP path never writes BalanceSnapshot (INISO-01)
  3. Agent can list grace obligations via MCP; historical NW LOCF remains grace-free (GRISO-01)
  4. Agent can get Капитал forecast overlay (income + A′ grace) via MCP

**Plans**: 4/4 plans executed

Plans:

- [x] 25-01-PLAN.md — Wave 0 SIDE stubs + optionalHorizonEndSchema + disol MCP walls
- [x] 25-02-PLAN.md — Tracer get_forecast_overlay (SIDE-04 sparse series)
- [x] 25-03-PLAN.md — list_debts + DISOL contract (SIDE-01)
- [x] 25-04-PLAN.md — list_income + list_grace_obligations + isolation-contract finalize (SIDE-02/03)

### Phase 26: Connect Docs + Policy

**Goal**: Claude Code / Cursor CLI can connect with copy-paste configs; tools declare read-only + isolation; PARITY standing rule is project-visible
**Depends on**: Phase 25
**Requirements**: CLI-01, CLI-02, PARITY-01
**Success Criteria** (what must be TRUE):

  1. Every shipped MCP tool declares `readOnlyHint` and DISOL/INISO/GRISO isolation rules in server/tool descriptions
  2. Docs show Claude Code (`type: http`) and Cursor (`url`) copy-paste configs for the localhost MCP URL, with prerequisite that the wallet app is already running
  3. PARITY-01 is materialized as a standing project constraint/rule so any new user-visible read surface ships matching MCP read tool(s) in the same milestone/phase

**Plans**: 1/4 plans executed

Plans:

- [x] 26-01-PLAN.md — CLI-01 tracer: flip isolation-contract, annotate wallet_ping, named instructions + list_debts DISOL
- [ ] 26-02-PLAN.md — CLI-01 expand: income/grace/forecast named prose + CAP polish + full mcp suite
- [ ] 26-03-PLAN.md — CLI-02 README Claude/Cursor copy-paste configs after Quick start
- [ ] 26-04-PLAN.md — PARITY-01 AGENTS block + PROJECT/REQUIREMENTS close-out + 26-UAT dual-client scaffold

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Docker + SQLite Foundation | v1.0 | 4/4 | Complete | 2026-09-02 |
| 2. Currencies + Accounts | v1.0 | 5/5 | Complete | 2026-09-03 |
| 3. Dated Balance Snapshots | v1.0 | 3/3 | Complete | 2026-09-03 |
| 4. Dated FX | v1.0 | 3/3 | Complete | 2026-09-03 |
| 5. Net Worth Dashboard | v1.0 | 3/3 | Complete | 2026-09-03 |
| 6. Historical Charts | v1.0 | 3/3 | Complete | 2026-09-04 |
| 7. LOCF consolidation + Nyquist | v1.0 | 3/3 | Complete | 2026-09-04 |
| 8. Debts schema + domain math | v1.1 | 3/3 | Complete | 2026-09-04 |
| 9. People + debts CRUD + nav | v1.1 | 4/4 | Complete | 2026-09-05 |
| 10. Repayments + close/write-off | v1.1 | 4/4 | Complete | 2026-09-05 |
| 11. Charts + primary totals | v1.1 | 4/4 | Complete | 2026-09-06 |
| 12. Debts refresh + Nyquist | v1.1 | 3/3 | Complete | 2026-09-07 |
| 13. Income schema + domain math | v1.2 | 3/3 | Complete | 2026-09-07 |
| 14. Доходы CRUD + nav | v1.2 | 3/3 | Complete | 2026-09-07 |
| 15. Plan vs actual + overdue | v1.2 | 3/3 | Complete | 2026-09-07 |
| 16. Counterparty income stats | v1.2 | 2/2 | Complete | 2026-09-07 |
| 17. NW forecast overlay + isolation | v1.2 | 3/3 | Complete | 2026-09-07 |
| 18. Bank contract study + discuss locks | v1.3 | 2/2 | Complete | 2026-09-08 |
| 19. Schema + pure grace domain math | v1.3 | 3/3 | Complete | 2026-09-09 |
| 20. Obligation CRUD + cycle UI | v1.3 | 3/3 | Complete | 2026-09-09 |
| 21. Капитал forecast integration | v1.3 | 3/3 | Complete | 2026-09-09 |
| 22. GRACEISO regression + polish | v1.3 | 2/2 | Complete | 2026-09-10 |
| 23. MCP Host + Localhost Safety | v1.4 | 2/2 | Complete | 2026-09-10 |
| 24. Capital Read Tools | v1.4 | 4/4 | Complete    | 2026-09-10 |
| 25. Side-Ledger Tools + Isolation | v1.4 | 4/4 | Complete    | 2026-09-10 |
| 26. Connect Docs + Policy | v1.4 | 1/4 | In Progress|  |
