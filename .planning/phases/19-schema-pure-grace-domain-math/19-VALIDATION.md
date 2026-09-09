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
| 19-01-T1 | 01 | 1 | CYCLE-01 | — | Decision gate D-03/D-09 one-way schema doors | checkpoint | n/a (human) | — | ⬜ pending |
| 19-01-T2 | 01 | 1 | CYCLE-01 | T-19-01 | Dual DOM + obligation Cascade + due next-month tracer | unit + schema | `npx vitest run src/lib/credit-grace.test.ts` + schema/migration greps | ❌ W0 | ⬜ pending |
| 19-01-T3 | 01 | 1 | CYCLE-01 | T-19-01 | Host migrate + foundation CreditGraceObligation allowlist | migrate + unit | `DATABASE_URL=file:./data/wallet.db npx prisma migrate deploy` + `npx vitest run src/lib/foundation.test.ts` | ❌ W0 | ⬜ pending |
| 19-02-T1 | 02 | 2 | CYCLE-01 | T-19-02 | listCycleWindows / resolveCurrentAndNext; null empty | unit | `npx vitest run src/lib/credit-grace.test.ts` | ❌ W0 | ⬜ pending |
| 19-02-T2 | 02 | 2 | CYCLE-01 | T-19-03 | overdue after inclusive due; NW isolation | unit + grep | `npx vitest run src/lib/credit-grace.test.ts` + isolation grep | ❌ W0 | ⬜ pending |
| 19-03-T1 | 03 | 2 | CYCLE-01 | T-19-01 | Dual DOM Zod both-null-or-both | unit | `npx vitest run src/lib/validations/account.test.ts` | ✅ extend | ⬜ pending |
| 19-03-T2 | 03 | 2 | CYCLE-01 | T-19-01/02 | updateGraceSchedule + D-14 OPEN clear + obligation Zod | unit + grep | `npx vitest run src/lib/validations/account.test.ts` + action greps | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

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
