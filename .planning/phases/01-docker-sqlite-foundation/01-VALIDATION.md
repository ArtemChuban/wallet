---
phase: "1"
slug: "docker-sqlite-foundation"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-02"
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.11 (greenfield — Wave 0 install) |
| **Config file** | none — Wave 0 `vitest.config.ts` |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run` + `./scripts/smoke-persist.sh` |
| **Estimated runtime** | ~30–120 seconds (unit quick; smoke longer) |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run` + Docker build/smoke when Docker files changed
- **Before `/gsd-verify-work`:** Full suite must be green + persist smoke
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-W0-01 | 00 | 0 | PLAT-01 | — | N/A | infra | `npx vitest run` | ❌ W0 | ⬜ pending |
| 01-*-* | TBD | TBD | PLAT-01 | T-01-01 | Bind 127.0.0.1 only | unit | `npx vitest run src/lib/money.test.ts` | ❌ W0 | ⬜ pending |
| 01-*-* | TBD | TBD | PLAT-01 | T-01-01 | Fixed DB path; no user path | integration | `npx vitest run` | ❌ W0 | ⬜ pending |
| 01-*-* | TBD | TBD | PLAT-01 | T-01-02 | Host DB not world-readable | smoke | `./scripts/smoke-persist.sh` | ❌ W0 | ⬜ pending |
| 01-*-* | TBD | TBD | PLAT-01 | — | UI ready page loads | smoke | `curl -f http://127.0.0.1:3000/` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` + npm `test` script
- [ ] `src/lib/money.test.ts` — RATE_SCALE_E8 + schema convention assertions (no Float money; BigInt; Currency.scale)
- [ ] `scripts/smoke-persist.sh` — compose up, assert DB file + health 200 after down/up
- [ ] Framework install: `npm install -D vitest`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| UI ready page readable in browser | PLAT-01 | Visual/locale copy | Open http://127.0.0.1:3000/ after compose up; confirm Russian ready copy if present |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
