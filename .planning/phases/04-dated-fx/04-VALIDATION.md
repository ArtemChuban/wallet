---
phase: "4"
slug: "dated-fx"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-03"
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.11 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/lib/fx.test.ts src/lib/money.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/lib/fx.test.ts src/lib/money.test.ts` (or targeted files for touched module)
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-00-01 | 00 | 0 | FX-02 | — | N/A | unit | `npx vitest run src/lib/fx.test.ts` | ❌ W0 | ⬜ pending |
| 04-00-02 | 00 | 0 | FX-01 | T-04-01 | Zod rejects ≤0 / future / primary | unit | `npx vitest run src/lib/validations/fx.test.ts` | ❌ W0 | ⬜ pending |
| 04-00-03 | 00 | 0 | FX-01 | — | Invert stores rateToPrimaryScaled only | unit | `npx vitest run src/lib/money.test.ts` | ❌ W0 extend | ⬜ pending |
| 04-W1 | 01 | 1 | FX-01,FX-02 | T-04-01 | Server Action Zod + LOCF null | unit | `npx vitest run src/app/currencies/actions.test.ts src/lib/fx.test.ts src/lib/foundation.test.ts` | ❌ W0 | ⬜ pending |
| 04-W2 | 02 | 2 | FX-01 | — | Tabs/Dialog Russian chrome | unit+manual | `npx vitest run src/app/currencies/` + human UI | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/fx.ts` + `src/lib/fx.test.ts` — `getRateAsOf` LOCF + convert helper (FX-02 / D-15–D-17)
- [ ] `src/lib/validations/fx.ts` + `src/lib/validations/fx.test.ts` — Zod schemas
- [ ] Extend `src/lib/money.test.ts` — parse/format/invert rate at scale 8; reject ≤0
- [ ] Extend `src/app/currencies/actions.test.ts` — upsert/delete FX actions
- [ ] Update `src/lib/foundation.test.ts` — expect `FxRate` not `FxRateStub`
- [ ] Framework install: none — vitest already present

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Tabs «Валюты» / «Курсы»; set-rate Dialog Russian chrome | FX-01 | Visual/a11y chrome | Open `/currencies/rates`, switch tabs, open set-rate Dialog, confirm Russian labels and direction toggle |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
