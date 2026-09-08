---
phase: "19"
slug: "schema-pure-grace-domain-math"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-08"
---

# Phase 19 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/lib/credit-grace.test.ts src/lib/dates.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/lib/credit-grace.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 19-01-T1 | 01 | 1 | CYCLE-01 | T-19-01 | Dual DOM both-null-or-both + FIAT_CREDIT-only | unit | `npx vitest run src/lib/validations/account.test.ts` | ❌ W0 | ⬜ pending |
| 19-01-T2 | 01 | 1 | CYCLE-01 | T-19-01 | Schema CHECKs reject partial / non-credit DOM | migration/sqlite | discretionary probe after migrate | ❌ W0 | ⬜ pending |
| 19-02-T1 | 02 | 2 | CYCLE-01 | T-19-02 | due = next-month DOM not sole addCalendarDays | unit | `npx vitest run src/lib/credit-grace.test.ts` | ❌ W0 | ⬜ pending |
| 19-02-T2 | 02 | 2 | CYCLE-01 | — | statement clamp Feb/31; null schedule empty | unit | `npx vitest run src/lib/credit-grace.test.ts src/lib/dates.test.ts` | ❌ / ✅ dates | ⬜ pending |
| 19-02-T3 | 02 | 2 | CYCLE-01 | T-19-03 | overdue after inclusive due; no NW import | unit | `npx vitest run src/lib/credit-grace.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Planner may renumber task IDs; update this map when plans finalize.*

---

## Wave 0 Requirements

- [ ] `src/lib/credit-grace.test.ts` — stubs for CYCLE-01 math (21→15, Feb clamp, null schedule, overdue, current/next)
- [ ] Extend `src/lib/validations/account.test.ts` (or new grace validation test) — dual-DOM pairing
- [ ] Framework install: none — Vitest already present

*Existing infrastructure covers framework; Wave 0 adds phase-specific test files.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| SQLite CHECK rejects partial DOM / non-FIAT_CREDIT | CYCLE-01 | Prisma does not express CHECK in schema language; migrate SQL probe | After migrate, attempt invalid inserts via sqlite3 and confirm reject |

*All pure-math behaviors have automated Vitest verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
