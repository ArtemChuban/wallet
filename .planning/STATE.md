---
gsd_state_version: 1.0
current_phase: 04
current_phase_name: dated-fx
status: planning
stopped_at: Phase 4 plans created (04-01..04-03)
last_updated: "2026-09-03T13:14:50.410Z"
last_activity: 2026-09-03
last_activity_desc: Phase 4 PLAN.md files authored — ready for plan-check / execute
state_head: 879b33e39f24c3849d6d8720b9d335c178e40cb5
progress:
  total_phases: 6
  completed_phases: 3
  total_plans: 15
  completed_plans: 12
  percent: 50
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-09-02)

**Core value:** At any moment, see true net worth (assets minus credit-card debt) in the primary currency and in each account's original currency, with history you can trust over time.
**Current focus:** Phase 4 — Dated FX

## Current Position

Phase: 04 (dated-fx) — READY TO EXECUTE
Plan: 01 (of 03) ready to execute
Status: Plans complete — awaiting execute
Last activity: 2026-09-03 — Phase 4 plans 04-01..04-03 created

Progress: [█████░░░░░] 50%

## Performance Metrics

**Velocity:**

- Total plans completed: 12
- Average duration: —
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 4 | - | - |
| 03 | 3 | - | - |
| 02 | 5 | - | - |

**Recent Trend:**

- Last 5 plans: —
- Trend: —

*Updated after each plan completion*
**Per-Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 01 P01 | 4min | 2 tasks | 23 files |
| Phase 01 P02 | 2min | 2 tasks | 6 files |
| Phase 01 P03 | 3min | 3 tasks | 7 files |
| Phase 01 P04 | 77min | 3 tasks | 15 files |
| Phase 02-currencies-accounts P01 | 4min | 3 tasks | 7 files |
| Phase 02-currencies-accounts P02 | 4min | 2 tasks | 10 files |
| Phase 02-currencies-accounts P03 | 5min | 3 tasks | 11 files |
| Phase 02-currencies-accounts P04 | 35min | 3 tasks | 4 files |
| Phase 02-currencies-accounts P05 | 1min | 2 tasks | 2 files |
| Phase 03 P01 | 5min | 3 tasks | 7 files |
| Phase 03-dated-balance-snapshots P02 | 6min | 3 tasks | 6 files |
| Phase 03-dated-balance-snapshots P03 | 15min | 3 tasks | 4 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Roadmap follows research build order: persist → currencies/accounts → snapshots → FX → NW dashboard → charts
- Polish-only / Russian ops hardening folded into UI-bearing phases (no standalone polish phase)
- v1 excludes transactions, auto FX APIs, and bank sync
- Phase 1 locks Next.js + Prisma + shadcn (D-01–D-04); money INTEGER + scale + rate×10^8 (D-07–D-09)
- [Phase 01]: Human-approved exact pins: next@16.3.4, prisma 7.10.0 stack, better-sqlite3@13.0.3 (no Prisma 8 RC)
- [Phase 01]: Scaffolded create-next-app via temp dir rsync because repo root already had .planning/
- [Phase 01]: Used shadcn defaults (-d): base-nova style, CSS variables, lucide icons
- [Phase 01]: Kept Plan 01 layout fonts/globals.css import; Task 2 already satisfied
- [Phase 01]: Human locked-context: INTEGER minor units, required Currency.scale, FX × 10^8 BigInt
- [Phase 01]: Host DATABASE_URL default file:./data/wallet.db; Compose overrides later
- [Phase 01]: Safe/larger COPY of node_modules + src/generated into runner for migrate + Prisma client
- [Phase 01]: npm overrides pin better-sqlite3@13.0.3; rebuild native addon in Docker deps stage
- [Phase 01]: Ready page force-dynamic so DB status is not baked at image build time
- [Phase 02]: Kept D-01 seed in migration SQL with Currency_one_primary partial unique index — CONTEXT D-01/D-02; migrate deploy must seed RUB
- [Phase 02]: Briefly stopped wallet-web container so host migrate deploy could unlock SQLite — Compose app held data/wallet.db lock
- [Phase 02]: Used Select for create scale 0–18 with hidden FormData field — Select UX for bounded scale; hidden input posts FormData for Server Action
- [Phase 02]: Remount CurrencyFormBody on Dialog open so useActionState success does not stick — Stale success closed Dialog immediately on reopen
- [Phase 02]: Serialized creditLimitMinor as string for client Dialog props (RSC BigInt boundary)
- [Phase 02]: Briefly stopped wallet-web so host migrate deploy could unlock SQLite
- [Phase 02]: SelectValue uses TYPE_LABELS formatter so trigger shows Russian type labels, not enum codes
- [Phase 02]: Human-verify checkpoint PASSED after Select label defect fix (user: Все окей)
- [Phase 02]: Controlled dialog name via mount-init useState; formKey remount resets; no post-mount prop sync useEffect
- [Phase 02]: Create and edit name Inputs both controlled so control mode never flips across revalidatePath
- [Phase 03]: BalanceSnapshot + accountId_asOfDate unique; LOCF null-before-first; calendarDateToday Europe/Moscow
- [Phase 03]: Future-date and credit 0..limit deferred to Plan 02 Server Actions
- [Phase 03]: Batch LOCF on page with findMany lte today (not N getBalanceAsOf calls)
- [Phase 03]: Credit labels shipped in tracer dialog; bounds enforced in Task 2 TDD
- [Phase 03]: Human-verify PASS for Russian /accounts balance chrome (set, LOCF, credit, history delete)
- [Phase 03]: History panel bg-muted/40; delete destructive; expand aria Показать/Скрыть историю балансов

### Pending Todos

None yet.

### Blockers/Concerns

- SQLite journal_mode (WAL vs DELETE) — prefer WAL on native btrfs; confirm in Plan 04 smoke
- Package legitimacy human gate before npm install (Plan 01)
- One-way money/FX door human decision before schema (Plan 03)

## Deferred Items

Items acknowledged and deferred at milestone close, most recent first:

| Category | Item | Status | Deferred At | Milestone |
|----------|------|--------|-------------|-----------|
| *(none)* | | | | |

## Session Continuity

Last session: 2026-09-03T13:15:00.000Z
Stopped at: Phase 4 plans created (04-01..04-03)
Resume file: /home/artem/Documents/wallet/.planning/phases/04-dated-fx/04-01-PLAN.md
