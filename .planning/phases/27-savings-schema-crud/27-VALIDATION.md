---
phase: "27"
slug: "savings-schema-crud"
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-11"
---

# Phase 27 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.x |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/lib/account-type.test.ts src/lib/validations/account.test.ts src/lib/net-worth.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30–90 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick vitest subset (expand as files land)
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 27-W0 | 00 | 0 | ACCT-01…03 | — | N/A | stubs | extend listed tests | ❌ W0 | ⬜ pending |
| TBD | 01+ | 1+ | ACCT-01 | T-27-01 | Zod+CHECK reject bad rate/DOM | unit | `npx vitest run src/lib/validations/account.test.ts` | ✅ extend | ⬜ pending |
| TBD | 01+ | 1+ | ACCT-02 | — | SAVINGS in NW asset path | unit | `npx vitest run src/lib/net-worth.test.ts src/lib/account-type.test.ts` | ✅ extend | ⬜ pending |
| TBD | 01+ | 1+ | ACCT-03 | — | days-until / list helpers | unit | `npx vitest run src/lib/savings-accrual-display.test.ts` | ❌ W0 | ⬜ pending |
| TBD | 01+ | 1+ | ACCT-01 | T-27-02 | create/update no snapshot side effects | unit | `npx vitest run src/app/accounts/actions.test.ts` | ✅ extend | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Planner fills concrete Task IDs when PLAN.md lands.*

---

## Wave 0 Requirements

- [ ] Extend `src/lib/validations/account.test.ts` — SAVINGS create/update refine (ACCT-01)
- [ ] Extend `src/lib/account-type.test.ts` — SAVINGS label + `isAssetType` (ACCT-02/03)
- [ ] Extend `src/lib/net-worth.test.ts` — SAVINGS inclusion (ACCT-02)
- [ ] New `src/lib/savings-accrual-display.test.ts` — clamp + today/next month (ACCT-03)
- [ ] Extend `src/app/accounts/actions.test.ts` — create/update SAVINGS; no BalanceSnapshot on metadata update
- [ ] Optional: UI source scan for «Годовой %» / «День начисления» / «Накопительный»

*Existing Vitest infrastructure covers framework — no install Wave 0.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| List secondary line RU copy (сегодня / через N дн.) | ACCT-03 | Visual/pluralization judgment | Orca: create SAVINGS, confirm list subtitle under name |
| Create/edit dialog field gate | ACCT-01/03 | Interaction UX | Orca: type switch ASSET↔SAVINGS shows/hides rate+DOM |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
