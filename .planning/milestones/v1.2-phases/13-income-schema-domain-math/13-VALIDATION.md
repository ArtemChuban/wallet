---
phase: "13"
slug: "income-schema-domain-math"
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-09-07"
validated: "2026-09-07"
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.11 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/lib/dates.test.ts src/lib/income.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/lib/dates.test.ts src/lib/income.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 13-W0 | 01 | 0 | FND-* | — | N/A | unit stubs | `npx vitest run src/lib/income.test.ts` | ✅ | ✅ green |
| FND-OCC | 01+ | 1+ | FND-OCC | — | N/A | unit | `npx vitest run src/lib/income.test.ts` | ✅ | ✅ green |
| FND-CLAMP | 01+ | 1+ | FND-CLAMP | — | N/A | unit | `npx vitest run src/lib/dates.test.ts` | ✅ | ✅ green |
| FND-OVER | 01+ | 1+ | FND-OVER | — | N/A | unit | `npx vitest run src/lib/income.test.ts` | ✅ | ✅ green |
| FND-MONEY | 01+ | 1+ | FND-MONEY | — | N/A | unit | `npx vitest run src/lib/income.test.ts` | ✅ | ✅ green |
| FND-MIG | 01+ | 1+ | FND-MIG | — | N/A | integration | `npx vitest run src/lib/foundation.test.ts` | ✅ | ✅ green |
| FND-SCHEMA | 03 | 3 | FND-SCHEMA | — | N/A | unit (file-lock) | `npx vitest run src/lib/income.test.ts` | ✅ | ✅ green |
| FND-ISO | 03 | 3 | ISO-01 | — | no NW/historical cross-import | unit file-scan | `npx vitest run src/lib/income.test.ts` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `src/lib/income.ts` + `src/lib/income.test.ts` — FND-OCC / OVER / MONEY / freeze
- [x] Extend `src/lib/dates.test.ts` — clamp matrix (31×Feb leap/non-leap, 31×Apr)
- [x] Update `src/lib/foundation.test.ts` — income table names in migrate allowlist
- [x] `npm install` — restored before migrate/test

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| — | — | All phase behaviors have automated verification. | — |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated 2026-09-07 — vitest green (dates + income + foundation)

## Validation Audit 2026-09-07

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

Reconcile: plan-seeded `draft` map; all automated commands already green post-execute. No new tests required.
