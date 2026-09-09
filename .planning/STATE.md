---
gsd_state_version: 1.0
milestone: v1.3
milestone_name: Кредитка
current_phase: 21
current_phase_name: Капитал forecast integration
status: phase_complete
stopped_at: Completed 21-03-PLAN.md
last_updated: "2026-09-09T20:43:02.373Z"
last_activity: 2026-09-09
last_activity_desc: Completed 21-03 tooltip two-block grace chrome
state_head: d891de5
progress:
  total_phases: 5
  completed_phases: 2
  total_plans: 11
  completed_plans: 11
  percent: 40
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-09-08 — v1.3 Кредитка)

**Core value:** At any moment, see true net worth (assets minus credit-card debt) in the primary currency and in each account's original currency, with history you can trust over time.
**Current focus:** Phase 21 — Капитал forecast integration

## Current Position

Phase: 21 — Капитал forecast integration
Plan: 21-03 of 03 — complete (all phase plans done)
Status: Phase plans complete — ready for verify-work
Last activity: 2026-09-09 — Completed 21-03 (tooltip C-04 grace chrome)

Progress: [████░░░░░░] 40%

## Performance Metrics

**Velocity:**

- Total plans completed: 56 (v1.0: 24 + v1.1: 18 + v1.2: 14)
- Average duration: —
- Total execution time: —

**By Phase:** v1.3 not started. Prior per-plan metrics in git history / prior STATE.

*Updated after each plan completion*
**Per-Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 18 P01 | 3min | 2 tasks | 2 files |
| Phase 18 P02 | 3min | 3 tasks | 6 files |
| Phase 20 P01 | 9min | 3 tasks | 12 files |
| Phase 20 P02 | 6 | 2 tasks | 5 files |
| Phase 20 P03 | 5min | 2 tasks | 5 files |
| Phase 21 P01 | 4min | 3 tasks | 6 files |
| Phase 21 P02 | 3min | 2 tasks | 5 files |
| Phase 21 P03 | 6min | 2 tasks | 3 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table and Phase 18 CONTEXT.

v1.3 locks from Phase 18 (see `18-CONTEXT.md`):

- Manual «Платёж для беспроцентного»; dual DOM 21→15 next; A′ NW-neutral overlay
- GRISO overlay-only; no APR / min / cash modeling
- Contract notes: T-Bank Platinum ТП 7.90 in phase dir
- [Phase 18]: CONT-01 checklist cites CONTEXT SoT; dual DOM (D-02) + A′ (D-11) product truth over stale ROADMAP SC
- [Phase 18]: Phase 18 Plan 01 docs-only — no prisma/src; Plan 02 owns wording sync
- [Phase 18]: Plan 02 confirmed dual DOM + A′ as planning SoT; CYCLE-01/ROADMAP/PROJECT synced; credit todo folded
- [Phase 18]: CONT-01 verified Complete (18-VERIFICATION.md 8/8 structural)
- [Phase 20]: Грейс label on AccountList trigger for source-scan verify
- [Phase 20]: FormData null note treated as optional empty in grace Zod
- [Phase 20]: CLOSED omitted from mergeGraceListRows until Plan 02
- [Phase 20]: close/reopen are dedicated exports; validate via update schema after load
- [Phase 20]: CLOSED list stays outside mergeGraceListRows — separate collapsed section (D-06)
- [Phase 20]: Edit amount uses formatMinorToMajorExact for input prefill (no thousand spaces)
- [Phase 20]: D-08 sort lives in mergeGraceListRows (all OPEN then CTAs) not only UI
- [Phase 20]: Clear schedule remounts dialog body via formKey so empty-schedule hint returns
- [Phase 20]: UI-SPEC clear-blocked copy shown when OPEN>0; server gate unchanged
- [Phase 21]: A′ grace = FX gate then += 0n (not paired ± offset)
- [Phase 21]: openGraceForecastMembership folds overdue OPEN onto today; CLOSED out
- [Phase 21]: Builder returns excludedMissingFxCurrencies unique alphabetical
- [Phase 21]: Lean OPEN findMany on / for forecastGrace (not nested CLOSED include)
- [Phase 21]: Banner unique FX codes via excludedMissingFxCurrencies.join; no доходы/грейс tags
- [Phase 21]: Tooltip: C-04 subcopy once under grace heading; displayPrimaryMajor on ForecastEvent for D-11

### Pending Todos

- Add timezone selection to settings (general, minor)
- Integrate local AI agent via subprocess (general, minor)

### Blockers/Concerns

- Phase 21: verify-work UAT — recheck tooltip grace block with OPEN obligation (live DB had obligations=[])

### Roadmap Evolution

- Phase 7: LOCF consolidation + Nyquist 3–6 (v1.0)
- Phase 8–12: debts refresh + Nyquist 10–11 (v1.1)
- Phases 13–17: v1.2 Доходы — SHIPPED 2026-09-08
- Phases 18–22: v1.3 Кредитка — roadmap created 2026-09-08; Phase 18 locks dual DOM + A′ in REQUIREMENTS/ROADMAP/PROJECT

## Deferred Items

Items acknowledged and deferred at milestone close, most recent first:

| Category | Item | Status | Deferred At | Milestone |
|----------|------|--------|-------------|-----------|
| todos | 2026-09-05-add-salary-income-tracking-with-forecast.md | promoted → v1.2 (shipped) | 2026-09-07 | v1.1 |
| todos | 2026-09-05-add-timezone-selection-to-settings.md | (presence-only) | 2026-09-07 | v1.1 |
| todos | 2026-09-05-improve-credit-account-type-with-limit-grace-period-and-fore.md | folded/closed via Phase 18 CONT-01 (dual DOM + A′) | 2026-09-08 | v1.3 |
| todos | 2026-09-05-integrate-local-ai-agent-via-subprocess.md | (presence-only) | 2026-09-07 | v1.1 |
| todos | 2026-09-05-merge-debit-crypto-cash-account-types-into-one.md | done via quick 260908-0i7 | 2026-09-08 | v1.2 |
| scope | ACCT-01 delete → ACCT-04 (D-14) | deferred | 2026-09-02 | v1 |

## Session Continuity

Last session: 2026-09-09T20:43:02.281Z
Stopped at: Completed 21-03-PLAN.md
Resume file: None

## Operator Next Steps

- `/gsd-execute-phase 21` — Wave 1 (21-01) → Wave 2 (21-02) → Wave 3 (21-03)
