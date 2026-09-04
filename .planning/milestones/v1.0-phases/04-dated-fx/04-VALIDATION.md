---
phase: "4"
slug: "dated-fx"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-09-03"
validated: "2026-09-04"
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
| 04-00-01 | 00 | 0 | FX-02 | — | N/A | unit | `npx vitest run src/lib/fx.test.ts` | ✅ | ✅ green |
| 04-00-02 | 00 | 0 | FX-01 | T-04-01 | Zod rejects ≤0 / future / primary | unit | `npx vitest run src/lib/validations/fx.test.ts` | ✅ | ✅ green |
| 04-00-03 | 00 | 0 | FX-01 | — | Invert stores rateToPrimaryScaled only | unit | `npx vitest run src/lib/money.test.ts` | ✅ | ✅ green |
| 04-W1 | 01 | 1 | FX-01,FX-02 | T-04-01 | Server Action Zod + LOCF null | unit | `npx vitest run src/app/currencies/actions.test.ts src/lib/fx.test.ts src/lib/foundation.test.ts` | ✅ | ✅ green |
| 04-W2 | 02 | 2 | FX-01 | — | Tabs/Dialog Russian chrome | unit+manual | `npx vitest run src/app/currencies/` + human UI | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `src/lib/fx.ts` + `src/lib/fx.test.ts` — `getRateAsOf` LOCF + convert helper (FX-02 / D-15–D-17)
- [x] `src/lib/validations/fx.ts` + `src/lib/validations/fx.test.ts` — Zod schemas
- [x] Extend `src/lib/money.test.ts` — parse/format/invert rate at scale 8; reject ≤0
- [x] Extend `src/app/currencies/actions.test.ts` — upsert/delete FX actions
- [x] Update `src/lib/foundation.test.ts` — expect `FxRate` not `FxRateStub`
- [x] Framework install: none — vitest already present

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Tabs «Валюты» / «Курсы»; set-rate Dialog Russian chrome | FX-01 | Visual/a11y chrome | Open `/currencies/rates`, switch tabs, open set-rate Dialog, confirm Russian labels and direction toggle |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-09-04 (Phase 07 Nyquist reconcile — evidence on disk + suite green)

---

## Validation Audit 2026-09-04

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

### Notes

- Evidence-first reconcile (Phase 07 Plan 03 / NYQ-04): Wave 0 files already on disk (`fx.test.ts`, `validations/fx.test.ts`, `money.test.ts`, `currencies/actions.test.ts`, `foundation.test.ts`).
- No MISSING Wave 0 paths — auditor not spawned.
- Full suite evidence: `npm test` → 153 passed (2026-09-04, post LOCF consolidation).
- Historical task IDs preserved; File Exists / Status flipped to present/green; Wave 0 boxes checked.
