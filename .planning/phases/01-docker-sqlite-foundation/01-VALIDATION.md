---
phase: "1"
slug: "docker-sqlite-foundation"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-09-02"
validated: "2026-09-02"
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.11 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm test` / `npx vitest run` |
| **Full suite command** | `npx vitest run` + `./scripts/smoke-persist.sh` |
| **Estimated runtime** | ~30–120 seconds (unit quick; smoke longer — wave-gate) |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run` — keep under 30s
- **After every plan wave:** Run `npx vitest run` + Docker build/smoke when Docker files changed (wave-gate; may exceed 30s)
- **Before `/gsd-verify-work`:** Full suite must be green + persist smoke
- **Max feedback latency:** 120 seconds for wave-gate; per-commit unit/greps target &lt;30s

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | PLAT-01 | T-01-SC | Human confirms SUS package pins; CONTEXT locks D-01 | unit | `npx vitest run src/lib/foundation.test.ts` | ✅ | ✅ green |
| 01-01-02 | 01 | 1 | PLAT-01 | T-01-SC | Pin next 16.3.4 + prisma 7.10.0 + standalone | unit | `npx vitest run src/lib/foundation.test.ts` | ✅ | ✅ green |
| 01-W0-01 | 01 | 1 | PLAT-01 | — | Vitest harness + money.test scaffold | unit | `npx vitest run` | ✅ | ✅ green |
| 01-02-01 | 02 | 2 | PLAT-01 | — | shadcn init + cn() + globals.css | unit | `npx vitest run src/lib/foundation.test.ts` | ✅ | ✅ green |
| 01-02-02 | 02 | 2 | PLAT-01 | — | layout imports globals.css | unit | `npx vitest run src/lib/foundation.test.ts` | ✅ | ✅ green |
| 01-03-01 | 03 | 3 | PLAT-01 | T-01-06 | Confirm one-way money/FX contract (D-07 in CONTEXT) | unit | `npx vitest run src/lib/foundation.test.ts` | ✅ | ✅ green |
| 01-03-02 | 03 | 3 | PLAT-01 | T-01-06 | BigInt money/rate; required scale; RATE_SCALE_E8 | unit | `npx vitest run src/lib/money.test.ts` | ✅ | ✅ green |
| 01-03-03 | 03 | 3 | PLAT-01 | T-01-03 | migrate deploy on host file DB | integration | `npx vitest run src/lib/foundation.test.ts -t "prisma migrate deploy"` | ✅ | ✅ green |
| 01-04-01 | 04 | 4 | PLAT-01 | T-01-01 | Compose 127.0.0.1 + health + ready UI | smoke/tracer (wave-gate) | `docker compose build && docker compose up -d` + curl health/UI | ✅ | ✅ green |
| 01-04-02 | 04 | 4 | PLAT-01 | T-01-02 | DB persists across down/up | smoke (wave-gate) | `./scripts/smoke-persist.sh` | ✅ | ✅ green |
| 01-04-03 | 04 | 4 | PLAT-01 | T-01-01/04/05 | Bind localhost; USER node; no .db in image; health 503 path | unit | `npx vitest run` (foundation + health route tests) | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `vitest.config.ts` + npm `test` script (Plan 01 Task 2)
- [x] `src/lib/money.test.ts` — RATE_SCALE_E8 + schema convention assertions (Plan 01 RED → Plan 03 GREEN)
- [x] `scripts/smoke-persist.sh` — scaffold Plan 01; complete persist proof Plan 04
- [x] Framework install: `vitest@4.1.11` with pinned Next/Prisma stack after legitimacy gate
- [x] `src/lib/foundation.test.ts` — Nyquist gap fill (pins, shadcn, security binds, migrate gate)
- [x] `src/app/api/health/route.test.ts` — readiness 200/503 paths

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| UI ready page readable in browser | PLAT-01 | Visual/locale copy | Open http://127.0.0.1:3000/ after compose up; confirm «Кошелёк готов» and DB readiness signal (harvested from Plan 04 tracer `<human-check>`) |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Per-commit feedback latency &lt;30s; wave-gate Docker smoke may be longer (documented)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-09-02 (Nyquist validate-phase audit)

---

## Validation Audit 2026-09-02

| Metric | Count |
|--------|-------|
| Gaps found | 11 |
| Resolved | 11 |
| Escalated | 0 |

### Notes

- Added `src/lib/foundation.test.ts` covering package pins, CONTEXT D-01/D-07, shadcn shell, Docker security binds, smoke script presence, and behavioral `prisma migrate deploy` against a fresh file DB.
- Plan verify string `prisma migrate status | grep 'up to date'` does **not** match Prisma 7.10.0 CLI output (`Migrations: 0 applied, 0 pending` even when DB already migrated). Requirement filled via better-sqlite3 assertion on `_prisma_migrations` + stub tables after `migrate deploy` (WARNING: status-string grep fragile; do not rely on it).
- Wave-gate smokes re-run green: compose health/UI curl path; `./scripts/smoke-persist.sh` PASS.
- Existing `money.test.ts` (2) + `health/route.test.ts` (3) remain green; full suite 16 tests PASS.
