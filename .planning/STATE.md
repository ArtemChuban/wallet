---
gsd_state_version: 1.0
milestone: v1.4
milestone_name: Local MCP
current_phase: 25
current_phase_name: Side-Ledger Tools + Isolation
status: executing
stopped_at: Completed 25-02-PLAN.md
last_updated: "2026-09-10T17:43:07.041Z"
last_activity: 2026-09-10
last_activity_desc: Completed 25-01 Wave 0 stubs + horizon schema + disol MCP walls
state_head: 2d926c68c75919507bcaf55d5bff77fafb97488c
progress:
  total_phases: 4
  completed_phases: 1
  total_plans: 10
  completed_plans: 8
  percent: 25
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-09-10 — v1.4 Local MCP)

**Core value:** At any moment, see true net worth (assets minus credit-card debt) in the primary currency and in each account's original currency, with history you can trust over time.
**Current focus:** Phase 25 executing — next 25-02 get_forecast_overlay tracer

## Current Position

Phase: 25 of 26 (Side-Ledger Tools + Isolation)
Plan: 3 of 4 (25-02 next)
Status: Ready to execute
Last activity: 2026-09-10 — Completed 25-01-PLAN.md

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

Last session: 2026-09-10T17:43:06.959Z
Stopped at: Completed 25-02-PLAN.md
Resume file: None
