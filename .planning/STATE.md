---
gsd_state_version: 1.0
milestone: v1.4
milestone_name: Local MCP
current_phase: 26
current_phase_name: Connect Docs + Policy
status: planning
stopped_at: Phase 25 complete
last_updated: "2026-09-10T18:03:55.552Z"
last_activity: 2026-09-10
last_activity_desc: Phase 25 complete, transitioned to Phase 26
state_head: 236a4e176a6985ade84dd6db8d9e22a85cbd9e37
progress:
  total_phases: 4
  completed_phases: 2
  total_plans: 10
  completed_plans: 10
  percent: 50
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-09-10 — v1.4 Local MCP)

**Core value:** At any moment, see true net worth (assets minus credit-card debt) in the primary currency and in each account's original currency, with history you can trust over time.
**Current focus:** Phase 25 executing — next 25-02 get_forecast_overlay tracer

## Current Position

Phase: 26 of 26 (Connect Docs + Policy)
Plan: Not started
Status: Ready to plan
Last activity: 2026-09-10 — Phase 25 complete, transitioned to Phase 26

Progress: [███░░░░░░░] 25%

## Performance Metrics

**Velocity:**

- Total plans completed: 69 (v1.0: 24 + v1.1: 18 + v1.2: 14 + v1.3: 13)
- Average duration: —
- Total execution time: —

**By Phase:** v1.3 complete (18–22). v1.4: Phase 23 complete; Phase 24 verified — next Phase 25.

*Updated after each plan completion*
**Per-Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 25 P01 | 3min | 3 tasks | 8 files |
| Phase 25 P02 | 4min | 2 tasks | 4 files |
| Phase 25 P03 | 4min | 2 tasks | 4 files |
| Phase 25 P04 | 5min | 3 tasks | 8 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.

v1.4 locks (pending execution):

- In-app MCP host (not sidecar / not app-spawned agent)
- MCP v1.4 = read-only + Streamable HTTP on `/api/mcp`
- Localhost Host/Origin + Compose `127.0.0.1` publish only
- [Phase 25]: optionalHorizonEndSchema YYYY-MM-DD; default today+365 stays in forecast loader (D-04)
- [Phase 25]: optionalIncomeRangeSchema both-or-neither from/to for list_income (A2)
- [Phase 25]: disol MCP walls on load-net-worth-asof + tools/net-worth only (D-05)
- [Phase 25]: Anchor via loadNetWorthAsOf(today) accounts-only; rates/income/grace batched beside it
- [Phase 25]: Horizon default stays in resolveForecastHorizonEnd — not resolveAsOf (D-04)
- [Phase 25]: Instructions list get_forecast_overlay now; list_* tools named as next (Plan 03–04)
- [Phase 25]: Totals colocated in list_debts (no get_debt_totals tool)
- [Phase 25]: Default OPEN filter via filterDebtsForList; includeClosed optional widen
- [Phase 25]: D-08 isolation one-liner in LIST_DEBTS_DESCRIPTION only — no payload meta flags
- [Phase 25]: Default list_income = next_open page parity; range only when both from+to set (A2)
- [Phase 25]: Grace CTA rows included with kind open|cta; CLOSED omitted
- [Phase 25]: D-08 one-liners in descriptions + instructions only — no payload meta; no named essay

### Pending Todos

- Add timezone selection to settings (general, minor)

### Blockers/Concerns

- mcp-handler export shape — verify at Phase 23 install (research flag; not blocking roadmap)
- Cursor CLI transport string — smoke in Phase 26; `mcp-remote` only on real fail
- Nyquist VALIDATION still draft on archived phases 19–22 (carry-forward tech debt)

### Roadmap Evolution

- Phase 7: LOCF consolidation + Nyquist 3–6 (v1.0)
- Phase 8–12: debts refresh + Nyquist 10–11 (v1.1)
- Phases 13–17: v1.2 Доходы — SHIPPED 2026-09-08
- Phases 18–22: v1.3 Кредитка — SHIPPED 2026-09-10
- Phases 23–26: v1.4 Local MCP — roadmap created 2026-09-10

## Deferred Items

Items acknowledged and deferred at milestone close, most recent first:

| Category | Item | Status | Deferred At | Milestone |
|----------|------|--------|-------------|-----------|
| todos | 2026-09-05-add-salary-income-tracking-with-forecast.md | promoted → v1.2 (shipped) | 2026-09-07 | v1.1 |
| todos | 2026-09-05-add-timezone-selection-to-settings.md | (presence-only) | 2026-09-07 | v1.1 |
| todos | 2026-09-05-improve-credit-account-type-with-limit-grace-period-and-fore.md | folded/closed via Phase 18 CONT-01 (dual DOM + A′) | 2026-09-08 | v1.3 |
| todos | 2026-09-05-integrate-local-ai-agent-via-subprocess.md | closed → v1.4 Local MCP (completed 2026-09-10) | 2026-09-07 | v1.1 |
| todos | 2026-09-05-merge-debit-crypto-cash-account-types-into-one.md | done via quick 260908-0i7 | 2026-09-08 | v1.2 |
| scope | ACCT-01 delete → ACCT-04 (D-14) | deferred | 2026-09-02 | v1 |

## Session Continuity

Last session: 2026-09-10T18:03:55.462Z
Stopped at: Phase 25 complete
Resume file: .planning/phases/25-side-ledger-tools-isolation/25-VERIFICATION.md
