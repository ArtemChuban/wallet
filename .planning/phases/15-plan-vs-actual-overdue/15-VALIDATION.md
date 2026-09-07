---
phase: "15"
slug: "plan-vs-actual-overdue"
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-09-07"
validated: "2026-09-07"
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.11 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/lib/income.test.ts src/app/income/actions.test.ts src/components/income/income-ui.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick run command above
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 15-W0 | 01 | 0 | ACT-* | — | N/A | stubs | `npx vitest run src/lib/validations/income.test.ts` | ✅ | ✅ green |
| ACT-01 | 01+ | 1+ | ACT-01 | T-15-01 | Zod + parent exists; no plan mutate | unit | `npx vitest run src/app/income/actions.test.ts` | ✅ | ✅ green |
| ACT-01-Z | 01+ | 1+ | ACT-01 | T-15-01 | reject non-positive actual | unit | `npx vitest run src/lib/validations/income.test.ts` | ✅ | ✅ green |
| ACT-02 | 02+ | 2+ | ACT-02 | — | «заполни» + warning, not destructive | unit/file-scan | `npx vitest run src/components/income/income-ui.test.ts` | ✅ | ✅ green |
| ACT-03 | 02+ | 2+ | ACT-03 | — | Δ copy / one-time filled chrome | unit | `npx vitest run src/lib/income.test.ts src/components/income/income-ui.test.ts` | ✅ | ✅ green |
| ISO | * | * | ISO light | T-15-04 | no BalanceSnapshot / no revalidate `/` | file-scan | `npx vitest run src/app/income/actions.test.ts` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Extend `src/lib/validations/income.ts` — actual upsert/delete Zod schemas + unit coverage
- [x] Extend `src/app/income/actions.test.ts` — upsert/delete actual + isolation scan
- [x] Extend `src/components/income/income-ui.test.ts` — «заполни», «Внести факт», «Изменить факт», DestructiveConfirm on fact delete
- [x] `incomeVarianceMinor` / phrase helpers covered in `income.test.ts`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Overdue amber chrome + fact dialog UX on live «Доходы» | ACT-02, ACT-03 | Visual / Orca UAT | Agent-driven per `.planning/OPERATOR.md` + Orca after phase gate |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated 2026-09-07 — vitest green (validations/actions/income/ui)

## Validation Audit 2026-09-07

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

Reconcile: plan-seeded `draft` map; ACT-* automated coverage green post-execute. Manual visual chrome retained as non-blocking.
