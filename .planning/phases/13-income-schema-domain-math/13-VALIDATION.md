---
phase: "13"
slug: "income-schema-domain-math"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-07"
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
| 13-W0 | 01 | 0 | FND-* | — | N/A | unit stubs | `npx vitest run src/lib/income.test.ts` | ❌ W0 | ⬜ pending |
| FND-OCC | 01+ | 1+ | FND-OCC | — | N/A | unit | `npx vitest run src/lib/income.test.ts` | ❌ W0 | ⬜ pending |
| FND-CLAMP | 01+ | 1+ | FND-CLAMP | — | N/A | unit | `npx vitest run src/lib/dates.test.ts` | ⚠️ extend | ⬜ pending |
| FND-OVER | 01+ | 1+ | FND-OVER | — | N/A | unit | `npx vitest run src/lib/income.test.ts` | ❌ W0 | ⬜ pending |
| FND-MONEY | 01+ | 1+ | FND-MONEY | — | N/A | unit | `npx vitest run src/lib/income.test.ts` | ❌ W0 | ⬜ pending |
| FND-MIG | 01+ | 1+ | FND-MIG | — | N/A | integration | `npx vitest run src/lib/foundation.test.ts` | ⚠️ allowlist | ⬜ pending |
| FND-SCHEMA | 03 | 3 | FND-SCHEMA | — | N/A | unit (file-lock) | `npx vitest run src/lib/income.test.ts` | ❌ W0 | ⬜ pending |
| FND-ISO | 03 | 3 | ISO-01 | — | no NW/historical cross-import | unit file-scan | `npx vitest run src/lib/income.test.ts` | ❌ optional | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/income.ts` + `src/lib/income.test.ts` — FND-OCC / OVER / MONEY / freeze stubs
- [ ] Extend `src/lib/dates.test.ts` — clamp matrix (31×Feb leap/non-leap, 31×Apr)
- [ ] Update `src/lib/foundation.test.ts` — add income table names to migrate allowlist
- [ ] `npm install` — restore `node_modules` before migrate/test

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| — | — | All phase behaviors have automated verification. | — |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
