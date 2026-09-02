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
| **Framework** | Vitest 4.1.11 (greenfield — Wave 0 install in 01-01) |
| **Config file** | `vitest.config.ts` (created in 01-01) |
| **Quick run command** | `npm test` / `npx vitest run` |
| **Full suite command** | `npx vitest run` + `./scripts/smoke-persist.sh` |
| **Estimated runtime** | ~30–120 seconds (unit quick; smoke longer) |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run` (when package.json exists)
- **After every plan wave:** Run `npx vitest run` + Docker build/smoke when Docker files changed
- **Before `/gsd-verify-work`:** Full suite must be green + persist smoke
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | PLAT-01 | T-01-SC | Human confirms SUS package pins | checkpoint | CONTEXT D-01 present | ✅ | ⬜ pending |
| 01-01-02 | 01 | 1 | PLAT-01 | T-01-SC | Pin next 16.3.4 + prisma 7.10.0 | infra | package.json pin check + standalone config | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | PLAT-01 | — | shadcn cn() shell | infra | test components.json + utils cn | ❌ W0 | ⬜ pending |
| 01-W0-01 | 01 | 1 | PLAT-01 | — | Vitest harness + money.test scaffold | infra | `npx vitest run` (may fail red until 01-02) | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 2 | PLAT-01 | T-01-06 | Confirm one-way money/FX contract | checkpoint | CONTEXT D-07 present | ✅ | ⬜ pending |
| 01-02-02 | 02 | 2 | PLAT-01 | T-01-06 | BigInt money/rate; required scale; RATE_SCALE_E8 | unit | `npm test -- --run src/lib/money.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-03 | 02 | 2 | PLAT-01 | T-01-03 | migrate deploy on host file DB | schema-gate | `DATABASE_URL=file:./data/wallet.db npx prisma migrate deploy` | ❌ | ⬜ pending |
| 01-03-01 | 03 | 3 | PLAT-01 | T-01-01 | Compose 127.0.0.1 + health + ready UI | smoke/tracer | `docker compose build && up` + curl health/UI | ❌ | ⬜ pending |
| 01-03-02 | 03 | 3 | PLAT-01 | T-01-02 | DB persists across down/up | smoke | `./scripts/smoke-persist.sh` | ❌ W0 | ⬜ pending |
| 01-03-03 | 03 | 3 | PLAT-01 | T-01-01/04/05 | Bind localhost; USER node; no .db in image; health 503 path | unit+grep | compose/Dockerfile greps + `npm test` | ❌ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` + npm `test` script (Plan 01 Task 2)
- [ ] `src/lib/money.test.ts` — RATE_SCALE_E8 + schema convention assertions (Plan 01 RED → Plan 02 GREEN)
- [ ] `scripts/smoke-persist.sh` — scaffold Plan 01; complete persist proof Plan 03
- [ ] Framework install: `vitest@4.1.11` with pinned Next/Prisma stack after legitimacy gate

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| UI ready page readable in browser | PLAT-01 | Visual/locale copy | Open http://127.0.0.1:3000/ after compose up; confirm «Кошелёк готов» and DB readiness signal (harvested from Plan 03 tracer `<human-check>`) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
