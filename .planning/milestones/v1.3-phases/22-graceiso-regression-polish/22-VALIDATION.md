---
phase: "22"
slug: "graceiso-regression-polish"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-10"
---

# Phase 22 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Sourced from `22-RESEARCH.md` Validation Architecture + plans 22-01 / 22-02.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.11 |
| **Config file** | `vitest.config.ts` (`include: src/**/*.test.ts`) |
| **Quick run command** | `npx vitest run src/lib/griso.test.ts src/app/accounts/actions.test.ts` |
| **Full suite command** | `npx vitest run src/lib/griso.test.ts src/lib/iniso.test.ts src/lib/nw-forecast.test.ts src/lib/credit-grace.test.ts src/components/dashboard/nw-forecast-ui.test.ts src/app/accounts/actions.test.ts` |
| **Estimated runtime** | ~30–90 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/lib/griso.test.ts src/app/accounts/actions.test.ts` (Wave 0 stub task: `griso.test.ts` alone is enough until write-gates land)
- **After every plan wave:** Full suite command above
- **Before `/gsd-verify-work`:** Full suite must be green; then D-12 gate hygiene (Plan 02)
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 22-01-T1 | 01 | 1 | GRISO-01 SC2–3 | T-22-02 | Wave 0 stubs non-poisoning | unit scaffold | `npx vitest run src/lib/griso.test.ts` | ❌ Wave 0 | ⬜ pending |
| 22-01-T2 | 01 | 1 | GRISO-01 SC2–3 | T-22-02/03/04 | File-scan walls + past-series golden + FIAT_CREDIT | unit + file-scan | `npx vitest run src/lib/griso.test.ts src/lib/iniso.test.ts src/lib/nw-forecast.test.ts src/lib/credit-grace.test.ts src/components/dashboard/nw-forecast-ui.test.ts` | ❌ → ✅ | ⬜ pending |
| 22-01-T3 | 01 | 1 | GRISO-01 SC1 | T-22-01 | Five grace mutations never call balanceSnapshot upsert/delete | unit (mock) | `npx vitest run src/lib/griso.test.ts src/app/accounts/actions.test.ts src/lib/nw-forecast.test.ts src/lib/credit-grace.test.ts src/components/dashboard/nw-forecast-ui.test.ts` | ⚠️ expand schedule | ⬜ pending |
| 22-02-T1 | 02 | 2 | GRISO-01 | T-22-06 | REQ checkbox only after suite green | docs grep | `grep -E '^- \[x\] \*\*GRISO-01\*\*' .planning/REQUIREMENTS.md && grep -E '\| GRISO-01 \| Phase 22 \| Complete \|' .planning/REQUIREMENTS.md` | ✅ docs | ⬜ pending |
| 22-02-T2 | 02 | 2 | GRISO-01 | T-22-06 | ROADMAP/STATE sync; suite still green | unit + docs | Full suite + ROADMAP/STATE greps | ✅ | ⬜ pending |
| GRISO smoke | 01 | 1 | GRISO-01 | T-22-02 | Keep credit-grace thin smoke | unit | `npx vitest run src/lib/credit-grace.test.ts` | ✅ keep | ⬜ pending |
| Phase 21 regression | 01 | 1 | — | — | Forecast A′ / UI still green | unit | `npx vitest run src/lib/nw-forecast.test.ts src/lib/credit-grace.test.ts src/components/dashboard/nw-forecast-ui.test.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GRISO-01 SC1 | Grace mutations never call balanceSnapshot upsert/delete | unit (mock) | `npx vitest run src/app/accounts/actions.test.ts` | ✅ partial — expand schedule |
| GRISO-01 SC2 | Past LOCF identical; no grace API fields | unit (golden) | `npx vitest run src/lib/griso.test.ts` | ❌ Wave 0 |
| GRISO-01 SC3 | File-scan walls twin of INISO | unit (file-scan) | `npx vitest run src/lib/griso.test.ts` | ❌ Wave 0 |
| GRISO-01 (smoke) | net-worth/historical-series ∌ credit-grace; page inputs clean | unit | `npx vitest run src/lib/credit-grace.test.ts` | ✅ keep |
| Phase 21 regression | Forecast A′ / membership / UI scan | unit | Phase 21 trio above | ✅ must stay green |

---

## Wave 0 Requirements

- [ ] `src/lib/griso.test.ts` — covers GRISO-01 SC2–SC3 (D-01/D-05–D-07/D-09–D-10); plant non-poisoning `it.todo` / `describe.skip` first (Plan 01 T1), then green tracer (T2)
- [ ] `src/app/accounts/actions.test.ts` — add `updateGraceSchedule` never-calls (and optionally unified GRISO describe) (Plan 01 T3)
- [ ] Framework install: none

*(Framework already installed — no Vitest install task.)*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Optional Orca smoke (D-13) | GRISO-01 | Only if `/gsd-verify-work` / OPERATOR demands live chrome | Agent: `npm run dev` + Orca; confirm no new UI chrome required for isolation — primary evidence remains automated suite |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
