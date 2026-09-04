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

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | — | 7 | First GSD cycle; audit inserted Phase 7 for LOCF + Nyquist |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 153 | — | Vitest + Wave 0 harness from Phase 1 |

### Top Lessons (Verified Across Milestones)

1. Shared LOCF path prevents scanner drift across dashboard/charts/pages
2. Russian-first human verify at plan end catches UI contract gaps early
