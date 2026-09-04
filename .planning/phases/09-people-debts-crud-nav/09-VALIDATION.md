---
phase: "09"
slug: "people-debts-crud-nav"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-04"
---

# Phase 09 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.x |
| **Config file** | existing project vitest setup |
| **Quick run command** | `npx vitest run src/app/debts/actions.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run targeted vitest for touched module
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 09-W0-01 | 00 | 0 | PERSON-01 | — | N/A | unit stub | `npx vitest run src/app/debts/actions.test.ts` | ❌ W0 | ⬜ pending |
| 09-W0-02 | 00 | 0 | PERSON-02 | T-09-02 | delete blocked when debts>0 | unit stub | same | ❌ W0 | ⬜ pending |
| 09-W0-03 | 00 | 0 | DEBT-01 | T-09-01 | initial smuggle rejected | unit stub | same + validations/debts.test.ts | ⚠️ | ⬜ pending |
| 09-W0-04 | 00 | 0 | DNAV-01 | — | N/A | unit/smoke | nav assert or manual | ❌ W0 | ⬜ pending |
| 09-W0-05 | 00 | 0 | D-16/D-17 | — | no window.confirm in AccountList | grep/unit | `rg window.confirm src/components/accounts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/app/debts/actions.test.ts` — PERSON-01/02, DEBT-01 action behaviors (mock prisma like accounts)
- [ ] Optional: nav link assertion test or plan manual DNAV-01 human-verify
- [ ] Snapshot confirm migration regression: assert AccountList has no `window.confirm`

*Existing `validations/debts.test.ts` and `debts.test.ts` cover schemas/math — keep green.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| «Долги» nav active state + Russian CRUD chrome | DNAV-01 / PERSON-01 | Visual active-state + copy | Open `/debts`, confirm nav label/order/active; create/rename person; create debt |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
