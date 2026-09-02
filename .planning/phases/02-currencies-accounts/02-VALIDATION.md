---
phase: "2"
slug: "currencies-accounts"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-02"
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.11 |
| **Config file** | `vitest.config.ts` (`include: src/**/*.test.ts`) |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10–60 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite green + migrate on empty DB shows RUB primary + manual RU UI smoke
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-W0-01 | 01 | 0 | CURR-01 | — | Zod currency rules (scale 0–18, unique code) | unit | `npm test -- src/lib/validations/currency.test.ts` | ❌ W0 | ⬜ pending |
| 02-W0-02 | 01 | 0 | ACCT-01/02 | — | Zod account rules; creditLimit > 0; no debt field | unit | `npm test -- src/lib/validations/account.test.ts` | ❌ W0 | ⬜ pending |
| 02-W0-03 | 01 | 0 | ACCT-02 | T-02-05 | money parse/format + creditLimitMinor BigInt | unit | `npm test -- src/lib/money.test.ts` | ⚠️ extend | ⬜ pending |
| TBD | TBD | TBD | CURR-01 | T-02-03 | Seeded RUB primary; create secondary; name-only update | unit + schema | `npm test -- src/lib/currency*.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | ACCT-01 | T-02-01 | Four types; name update; reject type/currency change; no delete | unit | account action/schema tests | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | ACCT-02 | T-02-05 | FIAT_CREDIT creditLimitMinor > 0; other types null; BigInt | unit | Zod + prisma constraint tests | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Planner fills concrete Task IDs when PLAN.md waves are authored.*

---

## Wave 0 Requirements

- [ ] `src/lib/money.test.ts` — add parse/format + `creditLimitMinor BigInt` schema assertions
- [ ] `src/lib/validations/currency.test.ts` — CURR-01 Zod rules
- [ ] `src/lib/validations/account.test.ts` — ACCT-01/02 Zod rules (credit required, no debt field)
- [ ] Optional integration: better-sqlite3 in-memory migrate+seed assert one primary (pattern in `foundation.test.ts`)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Russian UI chrome on `/currencies` and `/accounts` | CURR-01, ACCT-01 | Locale/visual copy | After migrate + app up: open both routes; confirm RU labels, empty states, Dialog create/edit |
| Seeded RUB appears as primary on fresh volume | CURR-01 | Docker migrate path | Empty `data/`, migrate deploy (or compose up); list currencies shows RUB primary |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
