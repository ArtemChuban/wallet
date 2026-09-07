# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-09-04
**Phases:** 7 | **Plans:** 24 | **Tasks:** 65

### What Was Built

- Dockerized Next.js + Prisma/SQLite with host persistence and health/ready gates
- Free-form currencies (RUB primary), four account types, credit metadata
- Dated balance snapshots + dated FX with LOCF as-of semantics
- Net-worth dashboard and historical charts (NW + per-account, credit stacks)
- Shared LOCF module and Nyquist validation for phases 3–6

### What Worked

- Vertical MVP slices (schema → actions → Russian UI → human verify) kept phases shippable
- Pure `computeNetWorthRows` / series builders made Phase 6 reuse Phase 5 math cleanly
- Gap-closure decimal work (02-05 FieldControl, Phase 7 LOCF) closed audit debt without new features

### What Was Inefficient

- Triplicate LOCF scanners shipped across pages/series before Phase 7 consolidation
- VALIDATION.md left draft for phases 3–6 until audit forced Nyquist closure
- Some UAT items stayed human-only (FieldControl console, restart smoke) across re-verify cycles

### Patterns Established

- INTEGER/BigInt money + FX×10^8 scale locked early (Phase 1)
- Server Actions + Zod + shadcn Dialog for Russian CRUD
- LOCF: batch Maps on pages; thin Prisma `get*AsOf`; shared `locf.ts` for scanners/series
- Dashboard `/` = Капитал; readiness is secondary chrome

### Key Lessons

1. Consolidate shared domain helpers (LOCF) in-milestone when three copies appear — do not wait for audit
2. Keep VALIDATION.md green with suite evidence as phases ship, not only at milestone audit
3. Intentional scope deferrals (no account delete) need REQUIREMENTS/CONTEXT alignment early to avoid audit noise

### Cost Observations

- Model mix: not tracked this milestone
- Timeline: ~3 calendar days (2026-09-02 → 2026-09-04)
- Notable: Phase 01-04 persist smoke was longest plan (~77 min); most plans 2–6 min

---

## Milestone: v1.1 — Долги людям

**Shipped:** 2026-09-07
**Phases:** 5 | **Plans:** 18 | **Tasks:** 46

### What Was Built

- Side ledger: Person/Debt/repayment/size-change with remaining math isolated from NW (DISOL-01)
- `/debts` CRUD + nav; DestructiveConfirmStep constitution
- Repayments, early forgive, timeline, principal stack chart, primary I-owe/they-owe totals
- Audit→Phase 12: refresh shells, UI-home move, Nyquist 10–12; forgive opaque-error fix at close

### What Worked

- Size-change ledger (not writeOff column) kept audit trail honest
- Milestone audit → insert Phase 12 closed tech debt before archive
- Diagnose-only debug (G-10-5/G-10-8) then targeted client fix at close unblocked clean archive

### What Was Inefficient

- Optional concurrency UAT opaque path needed two debug sessions after 10-04 server map
- VALIDATION.md for 10–11 stayed draft until Phase 12 (repeat of v1.0 Nyquist lag)
- DestructiveConfirmStep lived under `components/debts/` until Phase 12 UI-home move

### Patterns Established

- Debts never import into NW / historical-series (DISOL scan)
- In-dialog destructive confirm only — no `window.confirm` for irreversible actions
- Stale writes: map P2025 → refresh RU; field errors before opaque catch-all on client

### Key Lessons

1. Client error chaining matters as much as server catch maps for UAT concurrency truth
2. Ship Nyquist VALIDATION with phase evidence; do not wait for milestone audit
3. Cross-domain UI primitives belong in `components/ui/` from first consumer

### Cost Observations

- Timeline: ~4 calendar days (2026-09-04 → 2026-09-07)
- Plans: 18; suite ~265 tests at Phase 12 close

---

## Milestone: v1.2 — Доходы

**Shipped:** 2026-09-08
**Phases:** 5 | **Plans:** 14 | **Tasks:** 39

### What Was Built

- Income side ledger: four Prisma models, freeze-aware virtual occurrences, DOM clamp
- `/income` CRUD + Person Restrict; plan vs actual + overdue «заполни» + variance
- Per-Person hybrid income stats (native Σ + primary FX LOCF honesty)
- Капитал dashed «Прогноз» overlay from open planned pay; INISO keeps past NW income-free

### What Worked

- Side-ledger pattern (same as debts) kept ISO-01 isolation clean with file-scan gates
- Forecast as overlay (not LOCF mutation) made FCST/ISO requirements compose without conflict
- Nyquist validate-phase 13–17 reconciled before close — no late cleanup phase needed

### What Was Inefficient

- Phase 16 Orca UAT hit runtime_open_timeout; closed with SSR/Vitest override
- codegraph index lagged new forecast symbols at audit time
- Income actions intentionally skip `revalidatePath('/')` → soft-lag Капитал until fresh load

### Patterns Established

- Income actual ≠ BalanceSnapshot; forecast = ComposedChart dashed Line + hinge + partial banner
- Month-keyed freeze (A2): frozen actual plannedAsOf wins over differing DOM candidate
- Reuse Person for income counterparties; zero new npm packages

### Key Lessons

1. Isolation scans (DISOL/INISO) at plan time beat post-hoc audit debt
2. Soft revalidate tradeoffs for forecast chrome need explicit UI lock in CONTEXT
3. Agent UAT (Orca) still needs timeout budget for heavier pages

### Cost Observations

- Timeline: ~1 calendar day (2026-09-07 → 2026-09-08)
- Plans: 14; suite ~296 tests at Phase 13–17 close
- Notable: most plans 2–7 min; forecast chrome densest (17-01/03)

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | — | 7 | First GSD cycle; audit inserted Phase 7 for LOCF + Nyquist |
| v1.1 | — | 5 | Audit inserted Phase 12; side-ledger domain + DISOL isolation |
| v1.2 | — | 5 | Second side ledger (income) + forecast overlay; Nyquist closed in-phase |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 153 | — | Vitest + Wave 0 harness from Phase 1 |
| v1.1 | ~265 | — | Debts domain + disol scan + forgive error helper |
| v1.2 | ~296 | — | Income domain + INISO scan + nw-forecast overlay |

### Top Lessons (Verified Across Milestones)

1. Shared LOCF path prevents scanner drift across dashboard/charts/pages
2. Russian-first human verify at plan end catches UI contract gaps early
3. Nyquist VALIDATION lag repeats unless closed in-phase — budget a cleanup phase or gate earlier
4. Audit-open todos/debug/quick must be cleared or acknowledged before milestone close
5. Side ledgers (debts, income) stay out of historical NW via explicit isolation suites
