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
| 27-01-T1 | 01 | 0 | ACCT-01…03 | T-27-02/03/04 | Red Zod/soft/NW contracts | stubs | `npx vitest run src/lib/validations/account.test.ts src/lib/account-type.test.ts src/lib/net-worth.test.ts; test $? -ne 0` | ✅ extend | ⬜ pending |
| 27-01-T2 | 01 | 0 | ACCT-01/03 | T-27-05 | Red display + create actions; update todo/skip | stubs | `npx vitest run src/lib/savings-accrual-display.test.ts src/app/accounts/actions.test.ts; test $? -ne 0` | ❌→✅ W0 | ⬜ pending |
| 27-02-T2 | 02 | 1 | ACCT-01/02 | T-27-01…04 | Zod+CHECK+create+NW | unit | `npx vitest run src/lib/validations/account.test.ts src/lib/account-type.test.ts src/lib/net-worth.test.ts && npx vitest run src/app/accounts/actions.test.ts -t 'createAccount'` | ✅ | ⬜ pending |
| 27-02-T3 | 02 | 1 | ACCT-01 | — | migrate deploy live | migrate | `DATABASE_URL=file:./data/wallet.db npx prisma migrate deploy` | ✅ | ⬜ pending |
| 27-03-T1 | 03 | 2 | ACCT-01 | T-27-01/05 | update SAVINGS; no snapshot | unit | `npx vitest run src/app/accounts/actions.test.ts src/lib/validations/account.test.ts` | ✅ | ⬜ pending |
| 27-03-T2 | 03 | 2 | ACCT-03 | — | form labels/title | source+unit | `grep -q 'Изменить счёт' src/components/accounts/AccountFormDialog.tsx` | ✅ | ⬜ pending |
| 27-04-T1 | 04 | 3 | ACCT-03 | — | days-until clamp | unit | `npx vitest run src/lib/savings-accrual-display.test.ts` | ❌→✅ | ⬜ pending |
| 27-04-T2 | 04 | 3 | ACCT-03 | — | list rate+countdown | source+unit | `grep -q annualRateBps src/app/accounts/page.tsx` | ✅ | ⬜ pending |
| 27-04-T3 | 04 | 3 | ACCT-02 | T-27-05 | SAVINGS snapshot manual only | unit | `npx vitest run src/app/accounts/actions.test.ts && npm test` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Extend `src/lib/validations/account.test.ts` — SAVINGS createAccountSchema refine (ACCT-01); update refine owned by Plan 03 — **27-01-T1**
- [ ] Extend `src/lib/account-type.test.ts` — SAVINGS label + `isAssetType` (ACCT-02/03) — **27-01-T1**
- [ ] Extend `src/lib/net-worth.test.ts` — SAVINGS inclusion (ACCT-02) — **27-01-T1**
- [ ] New `src/lib/savings-accrual-display.test.ts` — clamp + today/next month (ACCT-03) — **27-01-T2**
- [ ] Extend `src/app/accounts/actions.test.ts` — create SAVINGS hard-fail (Plan 02 greens); update/no-snapshot as `it.todo` / `describe.skip` owned by Plan 03 — **no hard-fail cross-wave poison** — **27-01-T2**
- [ ] Optional: UI source scan for «Годовой %» / «День начисления» / «Накопительный» — covered in 27-02/03/04 greps

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
