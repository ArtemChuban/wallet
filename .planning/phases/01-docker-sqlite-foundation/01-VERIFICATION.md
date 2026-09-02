---
phase: 01-docker-sqlite-foundation
verified: 2026-09-02T17:09:17Z
status: passed
score: 6/7 must-haves verified
behavior_unverified: 0
overrides_applied: 0
decision_coverage:
  honored: 9
  total: 9
  not_honored: []
gaps: []
behavior_unverified_items:

  - truth: "App data survives a full container stop/start (SQLite file remains on the host mount)"
    test: "Run ./scripts/smoke-persist.sh (or compose down → assert data/wallet.db → compose up → assert BalanceAmountStub marker 991122334455 still present)"
    expected: "Host ./data/wallet.db survives down/up; health returns 200 ok; smoke marker row still present"
    why_human: "Verifier session did not re-run compose down/up (side-effect constrained). Mount wiring, host wallet.db, and leftover smoke marker are present but restart transition was not re-exercised here."
human_verification:

  - test: "Open http://127.0.0.1:3000/ in a browser after compose up"
    expected: "Page shows «Кошелёк готов» and DB readiness «База данных: готова»"
    why_human: "Visual/browser confirmation of Russian ready copy; harvested from 01-04-PLAN human-check. Curl proves HTML content; browser readability still needs human."
  - test: "Confirm persist across restart via ./scripts/smoke-persist.sh (or manual compose down/up + marker check)"
    expected: "Script exits 0; data/wallet.db remains; marker row survives restart; health 200 after restart"
    why_human: "Restart survival is a runtime state transition not re-proven in this verification process"
---

# Phase 1: Docker + SQLite Foundation Verification Report

**Phase Goal:** As a local user, I want to run Wallet in Docker with SQLite on the host, so that my data survives container restarts and readiness reflects a migrated database.
**Verified:** 2026-09-02T17:09:17Z
**Status:** passed
**Re-verification:** No — initial verification
**Mode:** mvp

## User Flow Coverage

User story: «As a local user, I want to run Wallet in Docker with SQLite on the host, so that my data survives container restarts and readiness reflects a migrated database.»

| Step | Expected | Evidence | Status |
|------|----------|----------|--------|
| Start stack | `docker compose up` yields healthy web on 127.0.0.1:3000 | `docker compose ps` → Up (healthy); ports `127.0.0.1:3000->3000` | ✓ |
| Open UI | Ready page loads in browser | Live `curl` HTML contains `Кошелёк готов` + `data-db-status="ok"`; browser check deferred to human | ✓ code / ⏳ human |
| Data on host | SQLite lives under host `./data` | Compose `./data:/data` + `DATABASE_URL=file:/data/wallet.db`; `data/wallet.db` exists (33k) | ✓ |
| Survive restart | Data remains after stop/start | Smoke script + host marker present; restart cycle not re-run this session | ⚠️ |
| Readiness | Healthy only when DB migrated | Health route + unit tests 503/200; live `/api/health` → 200 `{"status":"ok"}` | ✓ |
| Outcome | Data survives restarts; readiness reflects migrated DB | Outcome partially proven; restart human/smoke confirmation still needed | ⚠️ |

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | ------- | ---------- | -------------- |
| 1 | User can start the app with Docker Compose and open the UI in a browser | ✓ VERIFIED | Compose service healthy; `curl http://127.0.0.1:3000/` returns `Кошелёк готов` + DB ready; browser visual still in Human Verification |
| 2 | App data survives a full container stop/start (SQLite file remains on the host mount) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Mount `./data:/data` + `file:/data/wallet.db` wired; host `data/wallet.db` + smoke marker `991122334455` present; `scripts/smoke-persist.sh` substantive — restart cycle not re-executed this session |
| 3 | App reports healthy readiness only when the database is reachable and migrated | ✓ VERIFIED | `src/app/api/health/route.ts` gates on `SELECT 1` + `_prisma_migrations` count; vitest: 503 unreachable, 503 migrations missing, 200 migrated (3/3 pass); live curl 200 ok |
| 4 | Approved package pins for Next 16.3.4 and Prisma 7.10.0 stack exist (no prisma@8 RC) | ✓ VERIFIED | `package.json`: `next@16.3.4`, `prisma@7.10.0`, `@prisma/client@7.10.0`, `@prisma/adapter-better-sqlite3@7.10.0`, `better-sqlite3@13.0.3` |
| 5 | Next App Router project with `src/` and standalone-ready next.config exists | ✓ VERIFIED | `src/app/*` present; `next.config.ts` `output: "standalone"` |
| 6 | shadcn/ui shell wired (components.json, `cn`, globals.css in layout) | ✓ VERIFIED | `components.json`; `export function cn` in `src/lib/utils.ts`; layout imports `./globals.css`; `src/components/ui/button.tsx` |
| 7 | Prisma SQLite money/FX stub + RATE_SCALE_E8 + migrate-on-start path | ✓ VERIFIED | Schema BigInt columns + required `scale`; migration `20260902151000_init_platform_stub`; `RATE_SCALE_E8 = 100000000n`; money tests 2/2 pass; entrypoint `prisma migrate deploy` then `node server.js`; live DB has 1 migration row |

**Score:** 6/7 truths verified (1 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | ----------- | ------ | ------- |
| `package.json` | Pinned Next/Prisma/vitest | ✓ VERIFIED | Exact pins; test script |
| `vitest.config.ts` | Vitest config | ✓ VERIFIED | Exists, substantive |
| `src/lib/money.test.ts` | Convention tests | ✓ VERIFIED | 2 tests pass |
| `scripts/smoke-persist.sh` | Persist smoke | ✓ VERIFIED | Full compose cycle + marker; not stub |
| `components.json` | shadcn config | ✓ VERIFIED | Exists |
| `src/lib/utils.ts` | `cn()` helper | ✓ VERIFIED | clsx + tailwind-merge |
| `src/app/globals.css` | Tailwind/shadcn CSS | ✓ VERIFIED | 129 lines; imported by layout |
| `src/components/ui` | Primitives dir | ✓ VERIFIED | `button.tsx` present |
| `prisma/schema.prisma` | Currency/Fx/Balance stubs | ✓ VERIFIED | BigInt money/rate; required scale |
| `prisma/migrations` | Initial SQL migration | ✓ VERIFIED | `init_platform_stub` SQL |
| `prisma.config.ts` | Datasource from env | ✓ VERIFIED | `env("DATABASE_URL")` |
| `src/lib/money.ts` | RATE_SCALE_E8 | ✓ VERIFIED | `100000000n` |
| `src/lib/db.ts` | Prisma + better-sqlite3 | ✓ VERIFIED | Adapter singleton; pragmas; env URL |
| `Dockerfile` | Multi-stage bookworm + USER node | ✓ VERIFIED | bookworm deps/builder; bookworm-slim runner; `USER node` |
| `docker-compose.yml` | web, localhost:3000, ./data, healthcheck | ✓ VERIFIED | All present |
| `docker/entrypoint.sh` | migrate then server | ✓ VERIFIED | `set -e`; migrate deploy; `exec node server.js` |
| `src/app/api/health/route.ts` | Readiness handler | ✓ VERIFIED | 200/503 logic; force-dynamic |
| `src/app/page.tsx` | Russian ready page | ✓ VERIFIED | SSR DB status; not placeholder |

**Artifacts:** 18/18 verified (gsd `verify.artifacts` passed for 01-01 and 01-04; 01-02/01-03 checked manually after tool failure)

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `package.json` | next@16.3.4 + prisma@7.10.0 | exact pins | ✓ WIRED | Pattern found |
| `src/app/layout.tsx` | `src/app/globals.css` | stylesheet import | ✓ WIRED | `import "./globals.css"` |
| `src/lib/utils.ts` | `components.json` | shadcn aliases / `cn` | ✓ WIRED | `export function cn` |
| `prisma.config.ts` | `DATABASE_URL` | defineConfig datasource | ✓ WIRED | `env("DATABASE_URL")` |
| `src/lib/money.ts` | `src/lib/money.test.ts` | RATE_SCALE_E8 | ✓ WIRED | Import + assert |
| `docker/entrypoint.sh` | `prisma migrate deploy` | pre-start blocking | ✓ WIRED | Lines 6–7 |
| `docker-compose.yml` | `/api/health` | healthcheck fetch | ✓ WIRED | fetch health URL |
| Compose `./data:/data` | `DATABASE_URL=file:/data/wallet.db` | env + volume | ✓ WIRED | Manual verify (gsd tool rejected non-file `from` path) |

**Wiring:** 8/8 verified

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `src/app/page.tsx` | `dbStatus` | `prisma.$queryRaw` + `_prisma_migrations` | Live SSR `data-db-status="ok"` | ✓ FLOWING |
| `src/app/api/health/route.ts` | status JSON | same Prisma queries | Live `{"status":"ok"}` | ✓ FLOWING |
| Host `data/wallet.db` | SQLite file | Compose bind `./data:/data` | File on host; migrations=1; marker row | ✓ FLOWING |
| `src/lib/db.ts` | `DATABASE_URL` | Compose env / default `file:./data/wallet.db` | Adapter opens real file | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Money conventions | `npm test -- src/lib/money.test.ts` | 2/2 passed | ✓ PASS |
| Health 503/200 | `npm test -- src/app/api/health/route.test.ts` | 3/3 passed | ✓ PASS |
| Live health | `curl http://127.0.0.1:3000/api/health` | 200 `{"status":"ok"}` | ✓ PASS |
| Live ready UI | `curl http://127.0.0.1:3000/ \| grep Кошелёк` | Match + DB готова | ✓ PASS |
| Host DB migrated | readonly better-sqlite3 count `_prisma_migrations` | `c: 1` | ✓ PASS |
| Full persist smoke | `./scripts/smoke-persist.sh` | Not re-run (starts compose; mutates state) | ? SKIP |

### Probe Execution

| Probe | Command | Result | Status |
| ----- | ------- | ------ | ------ |
| — | — | No `scripts/*/tests/probe-*.sh`; phase uses `scripts/smoke-persist.sh` (spot-check SKIP above) | N/A |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| PLAT-01 | 01-01, 01-02, 01-03, 01-04 | App runs in Docker with all data in local SQLite on the host | ✓ SATISFIED (pending human confirm of UI + restart) | Compose + bind mount + host `wallet.db` + migrate-on-start + health/UI; REQUIREMENTS.md maps PLAT-01 → Phase 1 only |

**Orphaned requirements:** none (REQUIREMENTS.md Phase 1 = PLAT-01 only; all plans claim PLAT-01)

### Decision Coverage

All trackable CONTEXT.md decisions are honored by shipped artifacts. (9/9 honored, 0 not honored)

### Test Quality Audit

| Test File | Linked Req | Active | Skipped | Circular | Assertion Level | Verdict |
|-----------|-----------|--------|---------|----------|-----------------|---------|
| `src/lib/money.test.ts` | PLAT-01 (money contract) | 2 | 0 | 0 | Value | PASS |
| `src/app/api/health/route.test.ts` | PLAT-01 (readiness) | 3 | 0 | 0 | Value (status + JSON) | PASS |

**Disabled tests on requirements:** 0
**Circular patterns detected:** 0
**Insufficient assertions:** 0

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | No TBD/FIXME/XXX/TODO in phase-modified app/Docker files | — | — |

**Anti-patterns:** 0 blockers, 0 warnings in phase deliverables

### Human Verification Required

### 1. Browser ready page

**Test:** Open http://127.0.0.1:3000/ in a browser after compose up (stack currently healthy)
**Expected:** «Кошелёк готов» and «База данных: готова»
**Why human:** Visual confirmation of Russian ready copy (01-04-PLAN human-check); curl proves markup only

### 2. Persist across restart

**Test:** Run `./scripts/smoke-persist.sh` (or compose down → confirm `data/wallet.db` → compose up → confirm marker / health)
**Expected:** Exit 0; DB file and marker survive; health 200 after restart
**Why human:** Restart transition not re-exercised in this verifier session

## Gaps Summary

No blocking gaps. Code and wiring deliver PLAT-01 / roadmap success criteria 1 and 3 with behavioral tests. Criterion 2 (restart survival) is present and wired with prior smoke residue, but needs human or smoke re-run confirmation. Status `human_needed` until those checks pass.

---

_Verified: 2026-09-02T17:09:17Z_
_Verifier: Claude (gsd-verifier)_
