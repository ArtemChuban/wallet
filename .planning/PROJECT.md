# Wallet

## What This Is

A local, single-user personal finance site for tracking net worth across accounts (asset + credit), a parallel «Долги» side ledger, a «Доходы» income ledger with plan vs actual and NW forecast from recurring pay, and credit-card grace-period tracking with A′ NW-neutral payment amounts on the Капитал «Прогноз» overlay. Exposes an in-app read-only MCP server at `/api/mcp` (localhost only) so external CLI agents query the same capital + side-ledger data. Runs in Docker with SQLite on the host; no cloud accounts. Not budgeting or transaction categorization.

## Core Value

At any moment, see true net worth (assets minus credit-card debt) in the primary currency and in each account's original currency, with history you can trust over time.

## Current State

**Shipped:** v1.0 MVP (2026-09-04); **v1.1 Долги людям (2026-09-07)**; **v1.2 Доходы (2026-09-08)**; **v1.3 Кредитка (2026-09-10)**; **v1.4 Local MCP (2026-09-11)**.

Local Dockerized net-worth tracker + personal-debts + income + credit-grace ledgers + in-process MCP: SQLite → currencies/accounts → dated balances → dated FX → NW dashboard/charts with dashed «Прогноз» from income and open grace obligations (A′ ΔNW=0) → `/debts` + `/income` + account «Грейс» → Streamable HTTP MCP at `http://127.0.0.1:3000/api/mcp` (Host/Origin + Compose loopback). Stack: Next.js 16 App Router, Prisma 7 + SQLite, mcp-handler / MCP SDK, shadcn/ui, recharts, Vitest. Russian-first UI. Debts never change NW (DISOL-01). Income never writes BalanceSnapshot / past LOCF (ISO-01 / INISO-01). Grace never writes BalanceSnapshot / past LOCF (GRISO-01). Agents stay at UI parity (PARITY-01).

## Current Milestone: v1.5 Сберегательный счет

**Goal:** Новый тип счёта SAVINGS с годовой ставкой и днём начисления; вклад ожидаемых процентов в dashed «Прогноз» на Капитал без переписывания historical NW / LOCF.

**Target features:**
- Тип счёта `SAVINGS` (отдельный от debit/credit/crypto/cash)
- Поля: годовой %, день месяца начисления
- Математика: баланс × ставка / 12 → ожидаемое начисление в день месяца
- Overlay «Прогноз» на `/` (как income) — только прогноз, без авто BalanceSnapshot
- MCP read-tools под PARITY-01 для нового read-surface

## Requirements

### Validated

- ✓ User can create and manage accounts of types: fiat debit card, fiat credit card, crypto (e.g. USDT), cash — v1.0
- ✓ User can define currencies freely (not hardcoded) and pick one primary currency (e.g. RUB) — v1.0
- ✓ User can set/update an account balance as of a chosen date (backdating allowed) — v1.0
- ✓ Credit-card accounts store credit limit and outstanding debt (debt derived from limit − available) — v1.0
- ✓ App runs in Docker; all data persists in local SQLite — v1.0
- ✓ User can set exchange rates primary ↔ other as of a chosen date (manual) — v1.0
- ✓ Charts and totals as of a date use the FX rate effective for that date (rate changes apply forward from their date) — v1.0
- ✓ User can see current net worth overall and per-account balances (native + primary; credit debt reduces NW; available never an asset) — v1.0
- ✓ User can see balance history charts per account and overall (in primary currency and originals where relevant) — v1.0
- ✓ Shared LOCF path (`src/lib/locf.ts`) for pages + historical-series; Nyquist VALIDATION closed for phases 3–6 — v1.0

### Validated (v1.1)

- ✓ User can create and manage people (counterparties) and attach multiple debts to one person — Phase 9
- ✓ User can create debts with direction (I owe / they owe me), currency, initial amount, optional due date, optional note — Phase 9
- ✓ Remaining balance = initial + Σ size-change − Σ repayments; repayments only in debt currency with as-of date — Phases 8–10
- ✓ User can record partial repayments with history and see native principal stack (Погашено + Остаток) in «История» — Phases 10–11
- ✓ Debt auto-closes at remaining 0; user can also close early by writing off / forgiving remaining — Phase 10
- ✓ Debts section shows totals «я должен» / «мне должны» in primary with FX partial honesty; debts never change NW — Phases 8+11
- ✓ Separate nav section «Долги» (Russian-first UI) — Phase 9
- ✓ Debts mutations refresh `/debts` client+server without touching Капитал `/`; status↔remaining hard-asserted — Phase 12
- ✓ Shared DestructiveConfirmStep under `components/ui/`; Nyquist VALIDATION closed for phases 10–12 — Phase 12

### Validated (v1.2)

- ✓ User can create recurring monthly income (amount, currency, day-of-month, counterparty) and one-time income — Phases 13–14
- ✓ User can attach/select a counterparty on income and view per-counterparty income stats — Phases 14+16
- ✓ User can record planned vs actual income manually (actual does not change account balances in v1.2) — Phase 15
- ✓ User has a separate «Доходы» page/nav for income CRUD and overdue highlighting — Phases 14–15
- ✓ On Капитал `/`, user sees NW chart with future projection including recurring + future one-time pay via FX LOCF overlay — Phase 17 (FCST-01)
- ✓ When a planned income date has passed without an actual, UI highlights it so the user can fill it in — Phase 15
- ✓ Historical NW / BalanceSnapshot stay income-free (INISO) — Phase 17 (ISO-01)

### Validated (v1.3)

- ✓ Bank contract studied; dual DOM + A′ NW-neutral + RU vocab locked in CONTEXT before schema — Phase 18 (CONT-01)
- ✓ Credit account stores statementDayOfMonth + dueDayOfMonth (clamp; FIAT_CREDIT-only) — Phase 19 (CYCLE-01)
- ✓ User sees cycle instances (current / next) and «Грейс» CRUD for amount due / early close / overdue — Phase 20 (CYCLE-02, OBL-01…03, UX-01)
- ✓ Капитал «Прогноз» shows open grace obligations as A′ NW-neutral (ΔNW=0 + tooltip; FX LOCF honesty) — Phase 21 (GRFCST-01/02)
- ✓ Grace never writes BalanceSnapshot or changes historical NW LOCF (GRISO regression twin) — Phase 22 (GRISO-01)

### Validated (v1.4)

- ✓ Running wallet exposes in-process Streamable HTTP MCP at `/api/mcp` (same Next.js lifecycle; no sidecar / agent spawn) — Phase 23 (HOST-01)
- ✓ MCP accepts only localhost clients (Host/Origin guard + Compose `127.0.0.1` publish) — Phase 23 (HOST-02)
- ✓ Agent can list accounts / get NW as-of / get account balance / list FX rates via MCP with page-parity honesty — Phase 24 (CAP-01…04)
- ✓ Agent can list debts, income, grace obligations, and forecast overlay via MCP without folding side ledgers into historical NW — Phase 25 (SIDE-01…04; DISOL/INISO/GRISO)
- ✓ MCP tools declare `readOnlyHint` + named isolation copy; Claude Code / Cursor connect docs — Phase 26 (CLI-01/02)
- ✓ Standing PARITY-01 rule in AGENTS.md — new user-visible read surfaces ship matching MCP tools same phase — Phase 26

### Active

- User can create and manage SAVINGS accounts with annual interest rate and day-of-month accrual
- User sees expected monthly interest (balance × rate / 12) on Капитал dashed «Прогноз» overlay
- Interest forecast never writes BalanceSnapshot or changes historical NW LOCF (savings isolation twin of INISO/GRISO)
- New savings read surfaces expose matching read-only MCP tools (PARITY-01)

### Out of Scope

- Auto-updating account balance snapshots when income is marked received — deferred (manual balances stay source of truth)
- Deriving amount due from balance-snapshot history — v1.3 shipped manual entry only
- Full revolving interest / penalty calculation engine — grace tracking + forecast only
- Transaction history / expense posting / full double-entry — still periodic balance snapshots only
- Spending analytics, monthly burn, category cash-flow — deferred
- Interest / penalties on personal debts — principal only
- Debt list filters / search — deferred (single list)
- Repayments in a different currency than the debt — deferred
- Debts affecting net worth — explicitly excluded; tracking alongside capital only
- Income amounts flowing into `computeNetWorthRows` historical LOCF (projection is forecast overlay, not rewriting past NW) — locked
- Grace feeding historical `computeNetWorthRows` / LOCF — locked GRISO-01
- Bank/CSV import or API sync — deferred; manual only
- Automatic FX from external APIs — deferred; manual rates only
- FX between arbitrary non-primary pairs — primary ↔ other only
- Multi-user / auth / cloud sync — single local user
- Timezone selection in settings — deferred (Moscow calendar still default; todo acknowledged at v1.4 close)
- Auto BalanceSnapshot when savings interest accrues — deferred (v1.5 forecast overlay only)
- Compound / daily accrual engines beyond simple annual%÷12 monthly — deferred
- Long-term savings goals with target dates — still deferred
- Local AI agent via subprocess spawn from app — superseded by in-app MCP host; CLI agent stays external
- MCP write / mutate tools — deferred (v1.4 shipped read-only)
- In-app chat / «Ассистент» UI — deferred (CLI connects to MCP)
- Nav «Валюты» discoverability / account delete (ACCT-04) — residual debt
- Chart legend separating доходы vs обязательства on «Прогноз» — deferred
- Cash / APR / min-payment / «missed min voids grace» bank rules — D-07…D-10 OOS
- Publish MCP on `0.0.0.0` / LAN — locked out (localhost only)

## Context

Shipped v1.0: capital visibility across disconnected money places (bank, USDT, cash, credit debt) in one local Docker + SQLite app. UI Russian-first.

v1.1: personal debts as parallel domain; DISOL-01.

v1.2: income side ledger + Капитал «Прогноз» from open planned pay; INISO-01.

v1.3 (2026-09-10): credit grace dual-DOM schedules, manual «Платёж для беспроцентного», A′ overlay, GRISO isolation. Audit `tech_debt`: Nyquist VALIDATION still draft on phases 19–22 (carry-forward).

v1.4 (2026-09-11): in-app read-only MCP (`mcp-handler` + Streamable HTTP) with capital + side-ledger tools, named DISOL/INISO/GRISO annotations, Claude/Cursor connect docs, PARITY-01 AGENTS block. Audit `tech_debt`: SUMMARY transport wording, 25-01 frontmatter, 26-VERIFICATION/UAT doc drift. Nyquist 23–26 compliant. Deferred todo: savings account + interest NW forecast.

**UI constitution — destructive actions:** Never use `window.confirm` for deletes or irreversible actions. In-app second step with Russian copy. App-wide from Phase 9.

**Operator preferences:** See `.planning/OPERATOR.md` (agent-driven UAT via `npm run dev` + Orca).

## Constraints

- **Runtime**: Dockerized web app — must run as a local container
- **Data**: SQLite only, stored locally on host — no external DB
- **Users**: Single user, local — no multi-tenant or SaaS
- **FX v1**: Manual dated rates, primary ↔ other only
- **Balances v1**: Manual dated snapshots, not double-entry ledger
- **MCP parity (PARITY-01)**: Any new user-visible read surface must expose matching read-only MCP tool(s) in the same milestone/phase — agents stay at UI parity
- **MCP**: Read-only; localhost only; no app-spawned agent; no in-app chat (writes/chat deferred)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Docker + SQLite local stack | User already plans to run site in container; data stays on disk | ✓ Good — PLAT-01 shipped |
| Balance snapshots with date (not transactions) | User updates occasionally; wants history charts without full ledger | ✓ Good — Phase 3 |
| Manual dated FX, primary ↔ other | Two currencies for now; historical charts need rate-as-of-date | ✓ Good — Phase 4 |
| Credit card: limit + debt; debt reduces net worth | Matches real mental model (e.g. 500k limit, 250k debt) | ✓ Good — Phases 3+5 |
| Defer spend/cash-flow/debts/goals | Ship capital visibility first | ✓ Good — still correct for v1 |
| `/` is NW dashboard (Капитал); readiness not primary UX | D-01/D-02 — capital at a glance | ✓ Good — Phase 5 |
| Pure `computeNetWorthRows` for Phase 6 reuse | Charts need same inclusion math | ✓ Good — Phase 5–6 |
| Shared hybrid LOCF (`pickLatestAsOf` + `firstHitLocfMap` + typed wrappers) | Kill triplicate scanners; keep page batch Maps + series pure | ✓ Good — Phase 7 |
| Keep Prisma `getBalanceAsOf` / `getRateAsOf` as thin findFirst | LOCF-04; pages stay on batch Maps | ✓ Good — Phase 7 |
| Person entity → many debts | One counterparty, multiple open/closed debts | ✓ Good — Phase 9 |
| Remaining = initial + Σ delta − Σ repayments | Audit trail; size-change events not writeOff field | ✓ Good — Phase 8 |
| Repayments same currency + dated as-of | Match balance/FX backdating model; no cross-currency pay | ✓ Good — Phase 10 |
| Debts excluded from NW | Capital stays account-based; debts are side ledger | ✓ Good — Phases 8+11 DISOL |
| Early close = write-off/forgive remaining | Auto-close at 0 insufficient for real settlements | ✓ Good — Phase 10 |
| Primary totals for I-owe / they-owe via FX as-of | Same conversion honesty as NW dashboard | ✓ Good — Phase 11 |
| One stacked principal chart (repaid+remaining) in История | Product lock vs separate charts; D-03 | ✓ Good — Phase 11 |
| Debt.openedAsOf required + immutable after create | Series start date; Moscow calendar backfill | ✓ Good — Phase 11 |
| Destructive confirm = in-dialog second step, never `window.confirm` | Accidental deletes; consistent RU UX; honest cascade copy | Locked Phase 9 — app-wide constitution |
| Agent-driven UAT (Orca browser + `npm run dev`); human only for subjective/parallel/blocked | Avoid repetitive conversational UAT; same for Cursor / Claude Code / Codex | Locked — see `.planning/OPERATOR.md` |
| DebtDetailDialog = tabs (Погашение / Изменение / Простить / История), not stacked forms | User approved mock variant 1 over primary-CTA; reduces modal overload | ✓ Good — quick 2026-09-05 |
| Income = side ledger; actual ≠ BalanceSnapshot; forecast overlay only | Keep historical NW account-only; ISO-01 | ✓ Good — Phase 17 INISO + Orca |
| Forecast = dashed «Прогноз» Line + hinge; FX exclude → partial banner | Forecast-not-fact UX; never invent rates | ✓ Good — Phase 17 |
| Credit grace amount due = manual entry (not derived from snapshots) | User lock for v1.3; snapshot history stays balance source of truth | ✓ Good — Phase 20 |
| Credit grace obligations = forecast overlay only (no historical NW rewrite); A′ ΔNW=0 | Same isolation pattern as income ISO-01; FX banner honesty | ✓ Good — Phase 21–22 |
| Bank contract study before grace-rule lock | User supplies contract; avoid guessing revolving/grace semantics | ✓ Good — Phase 18 |
| Dual DOM (statement + due next month) over sole graceDurationDays | Matches T-Bank Platinum ТП 7.90 calendar (21→15) | ✓ Good — Phase 18–19 |
| GRISO twin of INISO (`griso.test.ts` + never-calls ×5) | Regression-proof historical NW free of grace | ✓ Good — Phase 22 |
| In-app MCP host (not sidecar / not app-spawned agent) | CLI agent stays external; wallet exposes tools on localhost | ✓ Good — Phase 23 |
| MCP v1.4 = read-only + Streamable HTTP on `/api/mcp` | Thin slice; writes + chat UI deferred | ✓ Good — Phases 23–26 |
| Localhost Host/Origin + Compose `127.0.0.1` publish only | Finance data must not hit LAN by default | ✓ Good — Phase 23 |
| String bigint minors + server-side convert (no agent FX invent) | Match Капитал honesty / partial totals | ✓ Good — Phase 24 |
| SIDE tools page-parity + named DISOL/INISO/GRISO in descriptions only | Isolation walls without payload meta flags | ✓ Good — Phases 25–26 |
| PARITY-01 via AGENTS.md BEGIN/END only (no .cursor/rules) | Standing rule survives agent runtime swaps | ✓ Good — Phase 26 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-09-11 — milestone v1.5 Сберегательный счет started*
