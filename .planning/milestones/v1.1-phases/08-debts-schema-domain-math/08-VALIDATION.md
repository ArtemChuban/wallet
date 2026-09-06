---
phase: "08"
slug: "debts-schema-domain-math"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-09-04"
validated: "2026-09-05"
---

# Phase 08 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.11 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/lib/debts.test.ts src/lib/validations/debts.test.ts` |
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

Built from actual PLAN task order (checkpoint / tracer / auto / tdd). Task IDs = `{phase}-{plan}-{task}` 1-indexed within each plan.

| Task ID | Plan | Task name (short) | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|-------------------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | Confirm size-change ledger schema (D-01, D-02) | 1 | DEBT-02 | T-08-01 | Lock two-table size-change model before migrate | checkpoint | human decision (`size-change-two-tables`) | n/a | ✅ green |
| 08-01-02 | 01 | Tracer: schema + remainingMinor + DISOL scan | 1 | DEBT-02, DISOL-01 | T-08-01, T-08-04 | D-04 remaining; status sync; no NW debt imports | unit | `npx vitest run src/lib/debts.test.ts` | ✅ | ✅ green |
| 08-01-03 | 01 | Host migrate deploy + foundation allow-list | 1 | DEBT-02 | T-08-02, T-08-03 | Person/Debt/events live; Restrict/Cascade applied | smoke | `npx vitest run src/lib/foundation.test.ts` (+ migrate deploy during exec) | ✅ | ✅ green |
| 08-02-01 | 02 | Domain asserts (repay / size / initial / status) | 2 | DEBT-02, DEBT-03 | T-08-01, T-08-07 | Illegal money throws; initialAmountMinor immutable | unit | `npx vitest run src/lib/debts.test.ts` | ✅ | ✅ green |
| 08-02-02 | 02 | computeDebtPrimaryTotals OPEN-only + FX | 2 | DEBT-02 | T-08-04 | OPEN-only; isPartial; primary identity | unit | `npx vitest run src/lib/debts.test.ts` | ✅ | ✅ green |
| 08-03-01 | 03 | Wave 0 red Zod tests for debts validations | 2 | DEBT-03 | T-08-07 | Zod cases; update-meta has no initial field | unit | `npx vitest run src/lib/validations/debts.test.ts` | ✅ | ✅ green |
| 08-03-02 | 03 | Implement validations/debts.ts + full suite | 2 | DEBT-03, DISOL-01 | T-08-04, T-08-07 | Zod shapes green; DISOL scan via full suite | unit | `npx vitest run src/lib/validations/debts.test.ts src/lib/debts.test.ts` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Docker migrate-on-start:* deferred as equivalent gate — see Plan 01 success criteria / Manual-Only row (entrypoint + host migrate).

---

## Wave 0 Requirements

- [x] `src/lib/debts.test.ts` — DEBT-02/03, status, rejects, totals, DISOL-01
- [x] `src/lib/debts.ts` — implementation under test
- [x] `src/lib/validations/debts.test.ts` — Zod Wave 0 (Plan 03)
- [x] Migration `prisma/migrations/20260904180755_debts_schema/` for Person/Debt/DebtRepayment/DebtSizeChange

*Existing infrastructure covers framework (Vitest already installed).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Prisma migrate deploy on Docker start | schema | Optional smoke only — **deferred** as equivalent to `docker/entrypoint.sh` (`prisma migrate deploy`) + Plan 01 host migrate deploy gate | No required Docker compose smoke this phase; optional: `docker compose up` and confirm migrate applies without error |
| Schema size-change model lock (08-01-01) | DEBT-02 | Human checkpoint before migrate | Recorded in SUMMARY: `size-change-two-tables` (D-01/D-02) |

*Automated coverage exists for DEBT-02, DEBT-03, DISOL-01; rows above are checkpoint/optional ops.*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-09-05

---

## Validation Audit 2026-09-05

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

**Evidence:** `npx vitest run src/lib/debts.test.ts src/lib/validations/debts.test.ts src/lib/foundation.test.ts` → PASS (56+11) FAIL (0).

State A audit: draft VALIDATION map was stale (Wave 0 ❌ pending); filesystem + SUMMARY evidence showed all DEBT-02, DEBT-03, DISOL-01 paths already green. No auditor spawn — zero MISSING/PARTIAL gaps.
