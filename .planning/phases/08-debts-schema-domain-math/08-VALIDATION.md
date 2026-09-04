---
phase: "08"
slug: "debts-schema-domain-math"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-04"
---

# Phase 08 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.11 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/lib/debts.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/lib/debts.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | DEBT-02 | T-08-01 | remaining never negative; over-repay rejected | unit | `npx vitest run src/lib/debts.test.ts` | ❌ W0 | ⬜ pending |
| 08-01-02 | 01 | 1 | DEBT-03 | T-08-01 | initialAmountMinor not mutated; size-change path only | unit | `npx vitest run src/lib/debts.test.ts` | ❌ W0 | ⬜ pending |
| 08-02-01 | 02 | 2 | DISOL-01 | T-08-04 | no debt imports in NW/series/`/` | unit | `npx vitest run src/lib/debts.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/debts.test.ts` — stubs/coverage for DEBT-02/03, status, rejects, totals, DISOL-01
- [ ] `src/lib/debts.ts` — implementation under test
- [ ] Migration under `prisma/migrations/` for Person/Debt/DebtRepayment/DebtSizeChange

*Existing infrastructure covers framework (Vitest already installed).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Prisma migrate deploy on Docker start | schema | Needs running Docker/SQLite volume | `docker compose up` (or project equivalent); confirm migrate applies without error |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
