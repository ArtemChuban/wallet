---
gsd_state_version: 1.0
milestone: v1.5
milestone_name: Сберегательный счет (Phases 27–31)
current_phase: 30
current_phase_name: mcp-parity-verify
status: planning
stopped_at: Phase 30 plans created
last_updated: "2026-09-22T09:09:01.929Z"
last_activity: 2026-09-22
last_activity_desc: Phase 30 PLAN.md files written (30-01, 30-02)
state_head: d5789fd14a130bf673abc2e02fcc2ea1197d5bbb
progress:
  total_phases: 5
  completed_phases: 3
  total_plans: 10
  completed_plans: 8
  percent: 60
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-09-11 — v1.5 Сберегательный счет)

**Core value:** At any moment, see true net worth (assets minus credit-card debt) in the primary currency and in each account's original currency, with history you can trust over time.
**Current focus:** Phase 30 — MCP PARITY + verify

## Current Position

Phase: 30 (mcp-parity-verify) — READY TO EXECUTE
Plan: 30-01 ready (2 plans)
Status: Ready to execute
Last activity: 2026-09-22 — Phase 30 plans created

Progress: [██████░░░░] 60%

## Performance Metrics

**Velocity:**

- Total plans completed: 83 (v1.0: 24 + v1.1: 18 + v1.2: 14 + v1.3: 13 + v1.4: 14)
- Average duration: —
- Total execution time: —

**By Phase:** v1.5 not started. Prior: v1.4 Local MCP complete (23–26).

*Updated after each plan completion*
**Per-Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 25 P01 | 3min | 3 tasks | 8 files |
| Phase 25 P02 | 4min | 2 tasks | 4 files |
| Phase 25 P03 | 4min | 2 tasks | 4 files |
| Phase 25 P04 | 5min | 3 tasks | 8 files |
| Phase 26 P01 | 2min | 2 tasks | 6 files |
| Phase 26 P03 | 4min | 2 tasks | 1 files |
| Phase 26 P02 | 3min | 3 tasks | 11 files |
| Phase 26 P04 | 2min | 3 tasks | 5 files |
| Phase 27 P01 | 3min | 2 tasks | 5 files |
| Phase 27 P02 | 4min | 3 tasks | 10 files |
| Phase 27 P03 | 4min | 2 tasks | 7 files |
| Phase 27 P04 | 3min | 3 tasks | 3 files |
| Phase 28-interest-math-forecast-kind P01 | 6min | 2 tasks | 2 files |
| Phase 28-interest-math-forecast-kind P02 | 5min | 2 tasks | 4 files |
| Phase 29 P01 | 5min | 3 tasks | 3 files |
| Phase 29 P02 | 3min | 2 tasks | 4 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table. v1.5 locks from scoping/research: distinct `SAVINGS` AccountType (not flag on debit); annual%÷12 monthly; forecast overlay only (no auto BalanceSnapshot); SAVISO twin of INISO/GRISO; PARITY-01 MCP in same milestone.

- [Phase 27]: Wave 0: update/D-16 as describe.skip+it.todo only (Plan 03); create hard-fail
- [Phase 27]: formatAccrualCountdown(today, nextAsOf) locked in Wave 0 tests for Plan 04
- [Phase 27]: Auto-selected savings-check-enum (D-14/D-15) for Account_savings_rate_invariant
- [Phase 27]: createAccount omits savings columns for non-SAVINGS; form gates FormData
- [Phase 27]: Single updateAccount action; updateAccountName kept as alias
- [Phase 27]: Zod updateAccountSchema optional rate/DOM; SAVINGS requiredness after findUnique
- [Phase 27]: Page/list pass annualRateBps+DOM for edit prefill (countdown Plan 04)
- [Phase 27]: formatAccrualCountdown(today, nextAsOf) two-arg; days via UTC calendar delta
- [Phase 27]: page.tsx rate/DOM serialize from 27-03; 27-04 wired list secondary only
- [Phase 27]: No interest ÷12 / auto snapshot writer (Phases 28–30)
- [Phase 28]: Month-2 compound expect is 10100n, not a second flat 10000n (D-02 overrides research flat LOCF)
- [Phase 28]: InterestAccountInput and InterestForecastSlot field names match Plan 28-02 so GREEN does not rewrite expects
- [Phase 28]: Today-dated interest includedSlotCount 0 is the hard fail; future +ΔNW already passes on the non-grace addend
- [Phase 28]: Month-2 credit is the truncated interest on principal grown by month 1 only (10000n then 10100n)
- [Phase 28]: slotInWindow and ΔNW both exhaust ForecastSlotKind so interest cannot fall through to the grace predicate or a silent addend
- [Phase 29]: SAVINGS golden series equals snapshot minors only; unused interest fixture voided (SAVISO-02)
- [Phase 29]: D-11 Wave 0 red locks dipped primary grace totals; plannedAmountMinor stays positive
- [Phase 29]: INT-03 FX: missing lists USD; today-dated rate includes; next-day rate drops
- [Phase 29]: D-11 grace line addend is -displayPrimaryMinor; plannedAmountMinor and displayPrimaryMajor stay positive
- [Phase 29]: forecastSavings uses InterestAccountInput keys; balanceMinor string on RSC, BigInt in shell
- [Phase 29]: Interest block mounts only on future tooltip between Прогноз level and grace (D-06)

### Pending Todos

- Add timezone selection to settings (general, minor)

### Blockers/Concerns

- None blocking Phase 27 planning
- Nyquist VALIDATION still draft on archived phases 19–22 (carry-forward tech_debt from v1.3)
- v1.4 audit tech_debt: SUMMARY transport wording; 25-01 frontmatter; 26-VERIFICATION/UAT doc drift
- Phase 28 plan must lock principal LOCF as-of policy (today-anchor flat vs as-of accrual) + truncate policy for bps÷12

### Roadmap Evolution

- Phase 7: LOCF consolidation + Nyquist 3–6 (v1.0)
- Phase 8–12: debts refresh + Nyquist 10–11 (v1.1)
- Phases 13–17: v1.2 Доходы — SHIPPED 2026-09-08
- Phases 18–22: v1.3 Кредитка — SHIPPED 2026-09-10
- Phases 23–26: v1.4 Local MCP — SHIPPED 2026-09-11
- Phases 27–30: v1.5 Сберегательный счет — roadmap created 2026-09-11
- Phase 31 added: ASSET ↔ SAVINGS type conversion in account settings (both ways; reopens Phase 27 type immutability for this pair only)

## Deferred Items

Items acknowledged and deferred at milestone close, most recent first:

| Category | Item | Status | Deferred At | Milestone |
|----------|------|--------|-------------|-----------|
| todos | 2026-09-10-savings-account-type-with-interest-nw-forecast.md | promoted → v1.5 (active) | 2026-09-11 | v1.4 |
| todos | 2026-09-05-add-salary-income-tracking-with-forecast.md | promoted → v1.2 (shipped) | 2026-09-07 | v1.1 |
| todos | 2026-09-05-add-timezone-selection-to-settings.md | (presence-only) | 2026-09-07 | v1.1 |
| todos | 2026-09-05-improve-credit-account-type-with-limit-grace-period-and-fore.md | folded/closed via Phase 18 CONT-01 (dual DOM + A′) | 2026-09-08 | v1.3 |
| todos | 2026-09-05-integrate-local-ai-agent-via-subprocess.md | closed → v1.4 Local MCP (completed 2026-09-10) | 2026-09-07 | v1.1 |
| todos | 2026-09-05-merge-debit-crypto-cash-account-types-into-one.md | done via quick 260908-0i7 | 2026-09-08 | v1.2 |
| scope | ACCT-01 delete → ACCT-04 (D-14) | deferred | 2026-09-02 | v1 |

## Session Continuity

Last session: 2026-09-22
Stopped at: Phase 30 plans created (30-01 tracer, 30-02 UAT)
Resume file: .planning/phases/30-mcp-parity-verify/30-01-PLAN.md

## Operator Next Steps

- Execute Phase 30: `/gsd-execute-phase 30`
