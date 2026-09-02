---
phase: 01-docker-sqlite-foundation
plan: 01
subsystem: infra
tags: [nextjs, prisma, vitest, sqlite, docker-ready]

requires: []
provides:
  - Pinned Next 16.3.4 + Prisma 7.10.0 dependency set
  - App Router src/ scaffold with standalone next.config
  - Wave 0 Vitest harness and money.test.ts (RED until Plan 03)
  - smoke-persist.sh stub and data/.gitkeep mount target
affects:
  - 01-02-shadcn
  - 01-03-prisma-money
  - 01-04-docker-compose

actuals:
  tokens: 91749
  tasks: 2
  commits: 2

tech-stack:
  added:
    - next@16.3.4
    - react@19.2.8
    - react-dom@19.2.8
    - prisma@7.10.0
    - @prisma/client@7.10.0
    - @prisma/adapter-better-sqlite3@7.10.0
    - better-sqlite3@13.0.3
    - zod@4.5.4
    - dotenv@17.4.2
    - vitest@4.1.11
    - @types/better-sqlite3@9.6.0
  patterns:
    - output standalone + outputFileTracingIncludes for prisma/better-sqlite3
    - Wave 0 RED money/schema tests before Plan 03 implementation

key-files:
  created:
    - package.json
    - package-lock.json
    - next.config.ts
    - vitest.config.ts
    - src/app/layout.tsx
    - src/app/page.tsx
    - src/lib/money.test.ts
    - scripts/smoke-persist.sh
    - data/.gitkeep
    - .env.example
    - .dockerignore
    - .gitignore
  modified: []

key-decisions:
  - "Human-approved exact pins: next@16.3.4, prisma stack 7.10.0, better-sqlite3@13.0.3 (no Prisma 8 RC)"
  - "Scaffolded via create-next-app in temp dir then rsynced because repo root already had .planning/"

patterns-established:
  - "Exact npm version pins for foundation stack (no caret on locked packages)"
  - "gitignore data/*.db and src/generated/; keep data/.gitkeep only"
  - "npm test = vitest run; money conventions asserted in Wave 0 RED"

requirements-completed: [PLAT-01]

coverage:
  - id: D1
    description: Human-approved SUS package pins installed exactly (next 16.3.4, prisma 7.10.0 stack)
    requirement: PLAT-01
    verification:
      - kind: other
        ref: "node -e package.json pin check (next===16.3.4, prisma includes 7.10.0)"
        status: pass
    human_judgment: true
    rationale: Supply-chain legitimacy required human npmjs.com confirmation before install
  - id: D2
    description: Next App Router scaffold with standalone output and Wave 0 Vitest/smoke stubs
    requirement: PLAT-01
    verification:
      - kind: other
        ref: "PLAN.md automated verify (package.json + vitest.config.ts + money.test.ts + smoke + standalone)"
        status: pass
      - kind: unit
        ref: "src/lib/money.test.ts#RATE_SCALE_E8 (RED until Plan 03)"
        status: fail
    human_judgment: false

duration: 4min
completed: 2026-09-02
status: complete
---

# Phase 01 Plan 01: Docker SQLite Foundation Scaffold Summary

**Human-approved Next 16.3.4 + Prisma 7.10.0 App Router scaffold with Wave 0 Vitest RED harness and persist-smoke stub.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-09-02T14:58:16Z
- **Completed:** 2026-09-02T15:02:31Z
- **Tasks:** 2/2
- **Files modified:** 23 (Task 2 commit)

## Accomplishments

- Cleared supply-chain gate (T-01-SC) with human-approved exact pins; no Prisma 8 RC
- Landed TypeScript App Router tree under `src/` with `output: "standalone"` and Prisma NFT includes
- Added Wave 0 `vitest` + `money.test.ts` (RED until Plan 03) and `scripts/smoke-persist.sh` stub for Plan 04

## Task Commits

Each task was committed atomically:

1. **Task 1: Confirm SUS package legitimacy before install** - _(no code commit; human-verify gate)_
2. **Task 2: Scaffold Next App Router + pinned deps + Wave 0 Vitest** - `2aada71` (feat)

**Plan metadata:** _(pending docs commit)_

## Files Created/Modified

- `package.json` / `package-lock.json` - Exact pinned Next/Prisma/vitest stack + `test` script
- `next.config.ts` - `output: "standalone"` + `outputFileTracingIncludes` for prisma/better-sqlite3
- `vitest.config.ts` - Vitest targeting `src/**/*.test.ts` with `@/` alias
- `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css` - App Router shell
- `src/lib/money.test.ts` - Wave 0 RED RATE_SCALE_E8 + schema convention tests
- `scripts/smoke-persist.sh` - Executable stub exiting 1 until Plan 04
- `data/.gitkeep` - Host bind-mount target
- `.env.example` - `DATABASE_URL=file:./data/wallet.db` + localhost publish note
- `.gitignore` / `.dockerignore` - Ignore DB runtime files and build artifacts

## Decisions Made

- Used create-next-app@16.3.4 in `/tmp` then rsync into repo (root already contained `.planning/`)
- Kept prisma CLI in `dependencies` (not only devDependencies) per plan action for later Docker migrate path
- Left default create-next-app home page; ready UI copy deferred to Plan 04

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] create-next-app refused nonempty repo root**
- **Found during:** Task 2 (Scaffold Next App Router)
- **Issue:** `create-next-app` aborted because `.planning/` and `.gsd/` already existed
- **Fix:** Scaffolded into `/tmp/wallet-next-scaffold`, rsynced app files into repo, then pinned deps with `--save-exact`
- **Files modified:** scaffold tree under repo root
- **Verification:** PLAN.md automated verify exited 0
- **Committed in:** `2aada71`

---

**Total deviations:** 1 auto-fixed (Rule 3)
**Impact on plan:** Necessary to land scaffold without deleting planning artifacts. No scope creep.

## Issues Encountered

None beyond the nonempty-directory scaffold workaround above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 02 can run `shadcn init` on this App Router shell
- Plan 03 can add `money.ts`, Prisma schema, and turn Wave 0 tests GREEN
- Plan 04 owns Dockerfile/Compose and completes `smoke-persist.sh`
- No Dockerfile, `components.json`, or prisma schema in this plan (by design)

## Self-Check: PASSED

- FOUND: package.json, next.config.ts, vitest.config.ts, src/lib/money.test.ts, scripts/smoke-persist.sh, data/.gitkeep
- FOUND: commit 2aada71
- ABSENT (expected): Dockerfile, components.json, prisma/schema.prisma

---
*Phase: 01-docker-sqlite-foundation*
*Completed: 2026-09-02*
