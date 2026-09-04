---
phase: 01-docker-sqlite-foundation
plan: 04
subsystem: infra
tags: [docker, compose, sqlite, prisma, health, readiness, nextjs]

requires:
  - phase: 01-03
    provides: Prisma schema stub, host migrate path, db singleton
  - phase: 01-01
    provides: Next standalone scaffold, smoke stub, data/.gitkeep
provides:
  - Docker Compose stack with migrate-on-start entrypoint
  - Localhost-only publish and host ./data SQLite persistence
  - /api/health readiness gated on migrated DB
  - Russian ready page proving UI + DB
  - Automated persist smoke across compose down/up
affects:
  - phase-02-currencies
  - later compose/deploy phases

actuals:
  tokens: 10167
  tasks: 3
  commits: 4

tech-stack:
  added: []
  patterns:
    - Multi-stage node:24-bookworm build + bookworm-slim runner, USER node
    - Entrypoint prisma migrate deploy then node server.js
    - Compose ./data:/data with DATABASE_URL=file:/data/wallet.db
    - force-dynamic ready page + health Route Handler
    - npm overrides better-sqlite3@13.0.3 for host and image

key-files:
  created:
    - Dockerfile
    - docker-compose.yml
    - docker/entrypoint.sh
    - src/app/api/health/route.ts
    - src/app/api/health/route.test.ts
  modified:
    - src/app/page.tsx
    - src/app/layout.tsx
    - src/lib/db.ts
    - next.config.ts
    - tsconfig.json
    - scripts/smoke-persist.sh
    - README.md
    - package.json
    - .dockerignore

key-decisions:
  - "Safe/larger COPY of node_modules + src/generated into runner for migrate + Prisma client"
  - "npm overrides pin better-sqlite3@13.0.3; rebuild native addon in Docker deps stage"
  - "Ready page force-dynamic so DB status is not baked at image build time"

patterns-established:
  - "Compose healthcheck hits /api/health (not TCP-only)"
  - "Persist proof via BalanceAmountStub marker row in smoke-persist.sh"
  - "Health returns 503 not_ready when DB or migrations unavailable"

requirements-completed: [PLAT-01]

coverage:
  - id: D1
    description: Docker Compose up yields ready UI and /api/health ok with host DB file
    requirement: PLAT-01
    verification:
      - kind: other
        ref: "docker compose build && up + curl /api/health ok + curl / | Кошелёк готов + test -f data/wallet.db"
        status: pass
    human_judgment: true
    rationale: Browser readability of Russian ready copy confirmed by human at tracer checkpoint
  - id: D2
    description: SQLite persists across compose down/up (marker row survives)
    requirement: PLAT-01
    verification:
      - kind: e2e
        ref: "./scripts/smoke-persist.sh"
        status: pass
    human_judgment: false
  - id: D3
    description: Readiness fails closed (503) when DB unreachable; localhost bind + USER node
    requirement: PLAT-01
    verification:
      - kind: unit
        ref: "src/app/api/health/route.test.ts#returns 503 when database is unreachable"
        status: pass
      - kind: other
        ref: "grep 127.0.0.1:3000:3000 + USER node + no COPY/ADD .db + npm test"
        status: pass
    human_judgment: false

duration: 77min
completed: 2026-09-02
status: complete
---

# Phase 01 Plan 04: Docker Compose + SQLite Persistence Summary

**Compose stack with migrate-on-start, localhost bind, Russian ready page, and automated host-volume persist smoke for PLAT-01.**

## Performance

- **Duration:** 77 min (includes human tracer verify pause)
- **Started:** 2026-09-02T15:14:54Z
- **Completed:** 2026-09-02T17:00:12Z
- **Tasks:** 3/3
- **Files modified:** 15 tracked across plan commits

## Accomplishments

- Multi-stage bookworm/bookworm-slim Docker image runs as `USER node` with entrypoint migrate then `server.js`
- Compose publishes `127.0.0.1:3000:3000`, mounts `./data:/data`, healthchecks `/api/health`
- Ready page «Кошелёк готов» SSR-proves DB readiness; health 200 only when migrations present
- `./scripts/smoke-persist.sh` writes a BalanceAmountStub marker and proves survival across down/up

## Task Commits

Each task was committed atomically:

1. **Task 1: End-to-end Docker ready path** - `8a61540` (feat)
2. **Host-dev better-sqlite3 dedupe (orchestrator/human follow-up)** - `b0e2253` (fix)
3. **Task 2: Persist smoke + volume permission hardening** - `90cc9c8` (feat)
4. **Task 3: Readiness negative path + security bind assertions** - `5780a2c` (test)

**Plan metadata:** `c3ebd9b` (docs: complete plan)

## Files Created/Modified

- `Dockerfile` - bookworm build, slim runner, prisma + generated client COPY, better-sqlite3 rebuild
- `docker-compose.yml` - web service, localhost publish, volume, healthcheck
- `docker/entrypoint.sh` - `prisma migrate deploy` then `exec node server.js`
- `src/app/api/health/route.ts` + `route.test.ts` - readiness + 503 unit coverage
- `src/app/page.tsx` / `layout.tsx` - Russian ready UI, `lang=ru`, force-dynamic
- `scripts/smoke-persist.sh` - full persist smoke (replaces Plan 01 stub)
- `README.md` - Compose quick start, chmod 700, WAL note, T-01-01/T-01-02
- `next.config.ts` / `package.json` - serverExternalPackages + overrides for better-sqlite3@13.0.3

## Decisions Made

- Prefer larger runner COPY (full `node_modules` + `src/generated`) so migrate and Prisma client work in standalone
- After npm overrides removed nested adapter copy, rebuild top-level `better-sqlite3` in Docker deps stage
- Force-dynamic on ready page so image build does not bake `not_ready`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Prisma generate during deps `npm ci`**
- **Found during:** Task 1
- **Issue:** postinstall `prisma generate` failed without schema in deps stage
- **Fix:** COPY `prisma/` + `prisma.config.ts` before `npm ci` with dummy `DATABASE_URL`
- **Files modified:** `Dockerfile`
- **Commit:** `8a61540`

**2. [Rule 3 - Blocking] Nested better-sqlite3 bindings missing in image**
- **Found during:** Task 1
- **Issue:** Adapter nested `better-sqlite3@12` lacked native bindings → health 503
- **Fix:** Rebuild nested addon; later superseded by overrides to single `13.0.3` + `npm rebuild better-sqlite3`
- **Files modified:** `Dockerfile`, `package.json` (overrides in `b0e2253`)
- **Commit:** `8a61540`, `b0e2253`, `90cc9c8`

**3. [Rule 3 - Blocking] BigInt TS target**
- **Found during:** Task 1 Docker build
- **Issue:** `tsconfig` ES2017 rejected BigInt literals
- **Fix:** `target: ES2020`
- **Files modified:** `tsconfig.json`
- **Commit:** `8a61540`

**4. [Rule 3 - Blocking] Generated client + static ready page**
- **Found during:** Task 1 verify
- **Issue:** `src/generated` missing in runner; page prerender baked `not_ready`
- **Fix:** COPY generated client; `export const dynamic = "force-dynamic"`
- **Files modified:** `Dockerfile`, `src/app/page.tsx`, `src/app/api/health/route.ts`
- **Commit:** `8a61540`

**5. [Rule 2 - Security] Exclude `.env` from build context**
- **Found during:** Task 1
- **Issue:** Builder saw host `.env`
- **Fix:** Add `.env` / `.env.*` to `.dockerignore`
- **Files modified:** `.dockerignore`
- **Commit:** `8a61540`

**6. [Rule 3 - Blocking] Dockerfile nested rebuild broke after overrides**
- **Found during:** Task 2 smoke
- **Issue:** Nested path no longer exists under overrides
- **Fix:** `npm ci && npm rebuild better-sqlite3` at top level
- **Files modified:** `Dockerfile`
- **Commit:** `90cc9c8`

---

**Total deviations:** 6 auto-fixed (Rules 2–3)
**Impact on plan:** Required for green Docker health and persist smoke; no scope creep beyond PLAT-01.

## Authentication Gates

None.

## Threat Flags

None beyond plan threat model (T-01-01..05 mitigated: localhost bind, chmod 700 guidance, fixed DATABASE_URL, USER node, no `.db` in image).

## Known Stubs

None — ready page and health use live Prisma queries; smoke writes a real marker row (platform stub table by design until domain phases).

## Issues Encountered

Human tracer pause after Task 1; host `npm run dev` DB failure fixed in `b0e2253` (overrides + `serverExternalPackages`) before Task 2 resumed.

## User Setup Required

None — local Docker only. Recommend `chmod 700 data` on host.

## Next Phase Readiness

Phase 01 plans complete. Ready for phase verify / next milestone phase (currencies). Do not COPY `wallet.db` into images; keep migrate-on-start.

## Self-Check: PASSED

- FOUND: Dockerfile, docker-compose.yml, docker/entrypoint.sh, health route + test, smoke-persist.sh, README.md, 01-04-SUMMARY.md
- FOUND: commits 8a61540, b0e2253, 90cc9c8, 5780a2c
- VERIFIED: smoke-persist PASS; npm test 5/5; compose localhost + USER node greps

---
*Phase: 01-docker-sqlite-foundation*
*Completed: 2026-09-02*
