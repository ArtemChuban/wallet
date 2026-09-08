---
phase: "18"
slug: "bank-contract-study-discuss-locks"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-08"
---

# Phase 18 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Docs/CONT-01 gate — structural checklist primary; Vitest smoke for regression only.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x (repo); Phase 18 primarily structural checklist |
| **Config file** | package.json `"test": "vitest run"` |
| **Quick run command** | `npm test -- src/lib/dates.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds (suite); structural checks <2s |

---

## Sampling Rate

- **After every task commit:** structural `test -f` / `rg` decision IDs
- **After every plan wave:** same + confirm REQUIREMENTS CONT-01 ready to flip after verify
- **Before `/gsd-verify-work`:** CONT-01 checklist green; `npm test` green (no new failures)
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 18-*-* | TBD | TBD | CONT-01 | — | N/A (docs) | structural | see RESEARCH Validation Architecture | ✅ CONTEXT/NOTES | ⬜ pending |

*Filled by planner when PLAN.md tasks land. Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `18-CONT-01-CHECKLIST.md` or PLAN acceptance section — maps SC1–4 → D-IDs + file paths
- [ ] Optional structural assert for required artifacts (only if planner wants CI-hard gate)
- [ ] Task to amend ROADMAP Phase 18 SC3 / Phase 19 due-math wording / CYCLE-01 for dual DOM + A′ where needed
- [ ] Framework install: none

*Existing app tests do not cover CONT-01; expected for a docs gate.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dual DOM + A′ overrides documented | CONT-01 | Semantic read | Read CONTEXT D-02, D-11; confirm RESEARCH override table |
| ROADMAP SC ↔ decisions mapped | CONT-01 | Checklist judgment | Acceptance table in PLAN/VERIFICATION |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
