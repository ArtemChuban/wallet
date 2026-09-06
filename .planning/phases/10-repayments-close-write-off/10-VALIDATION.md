---
phase: "10"
slug: "repayments-close-write-off"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-09-05"
validated: "2026-09-07"
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.11 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/app/debts/actions.test.ts src/lib/validations/debts.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/app/debts/actions.test.ts src/lib/validations/debts.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 1 | REPAY-01 | T-10-01 | Over-repay rejected by assert | unit | `npx vitest run src/app/debts/actions.test.ts; test $? -ne 0` | ✅ | ✅ green |
| 10-01-02 | 01 | 1 | REPAY-01, DEBT-04 | T-10-01, T-10-04 | createRepayment + CLOSED at zero + detail Dialog | unit | `npx vitest run src/app/debts/actions.test.ts && grep -q createRepayment src/app/debts/actions.ts` | ✅ | ✅ green |
| 10-01-03 | 01 | 1 | DISOL-01 | T-10-04 | DISOL + suite green | unit | `npx vitest run src/lib/debts.test.ts && npx vitest run src/app/debts/actions.test.ts` | ✅ | ✅ green |
| 10-02-01 | 02 | 2 | REPAY-03 | T-10-03 | delete schemas + red reopen tests | unit | `npx vitest run src/lib/validations/debts.test.ts` | ✅ | ✅ green |
| 10-02-02 | 02 | 2 | REPAY-02, REPAY-03 | T-10-03 | deleteRepayment + timeline + confirm | unit | `npx vitest run src/app/debts/actions.test.ts src/lib/validations/debts.test.ts` | ✅ | ✅ green |
| 10-02-03 | 02 | 2 | D-11..D-13 | — | CLOSED subsection UX | smoke | `grep -q 'Закрытые' src/components/debts/DebtsList.tsx` | ✅ | ✅ green |
| 10-03-01 | 03 | 3 | DEBT-05 | — | Human lock isForgive persistence | checkpoint | decision `isForgive-boolean` | n/a | ✅ green |
| 10-03-02 | 03 | 3 | DEBT-05 | T-10-02 | migrate + forgive/size-change actions | unit+migrate | `DATABASE_URL=file:./data/wallet.db npx prisma migrate deploy` + vitest actions | ✅ | ✅ green |
| 10-03-03 | 03 | 3 | DEBT-05 / D-07..D-10 | T-10-02 | Forgive UI + «Списание» labels | unit/smoke | vitest + grep Простить/Списание | ✅ | ✅ green |
| 10-04-01 | 04 | 4 | REPAY-01 / G-10-5 | T-10-G5-01 | createRepayment P2025 → refresh RU + revalidate /debts | unit | `grep -q 'maps P2025 not-found to refresh' src/app/debts/actions.test.ts && npx vitest run src/app/debts/actions.test.ts -t "maps P2025 not-found to refresh"` | ✅ | ✅ green |
| 10-04-02 | 04 | 4 | REPAY-03, DEBT-05 / G-10-5 | T-10-G5-02 | All event actions map staleness; peer-delete then create still succeeds | unit | `npx vitest run src/app/debts/actions.test.ts` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Note (waivers): Distinct «Списание» timeline label / dedicated `isForgive` column and live multi-tab concurrency polish remain accepted product waivers — not reopened. Forgive ships as `forgiveRemaining` + «Простить» UI; P2025 staleness map covers concurrency server path.*

---

## Wave 0 Requirements

- [x] `src/app/debts/actions.test.ts` — stubs/extend for create/delete/forgive + status sync + over-repay + revalidatePath("/debts") only
- [x] `src/lib/validations/debts.test.ts` — deleteRepaymentSchema / deleteSizeChangeSchema (+ forgive if separate)
- [x] Optional: pure helper test for timeline sort / label mapping
- [x] Framework install: none — vitest already present

*Existing infrastructure covers framework; Wave 0 extends phase-specific tests.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Debt row opens detail Dialog | D-01/D-02 | Dialog open UX | Click debt row on /debts → detail Dialog with forms + history |
| «Простить остаток» confirm copy | D-09 | RU copy + amount | Confirm shows remaining amount and that debt will close |
| «Закрытые (N)» collapsed default | D-11/D-12 | Accordion UX | CLOSED debts under collapsed subsection; expand to open detail |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-09-07 (evidence-first reconcile Phase 12 Plan 03 / NYQ-10)

---

## Validation Audit 2026-09-07

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

**Evidence:** quick smoke `npx vitest run src/app/debts/actions.test.ts src/lib/debts.test.ts` → PASS (75). Full suite `npm test` → 25 files / 265 tests PASS (0 FAIL).

State A audit: draft VALIDATION map was stale (Wave 0 ❌/⬜ pending vs filesystem). On disk: `actions.test.ts`, `validations/debts.test.ts`, `debts.test.ts`, forgiveRemaining coverage, «Простить» UI, P2025 refresh map. No MISSING Wave 0 paths — auditor not spawned. Historical task IDs preserved; File Exists / Status → present/green; Wave 0 boxes checked. Waived «Списание» / isForgive column / concurrency polish not reopened.
