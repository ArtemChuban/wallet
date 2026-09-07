---
phase: 260908-1dm-shrink-wallet-web-docker-image-from-2-66
plan: 01
subsystem: infra
tags: [docker, next-standalone, prisma, better-sqlite3, image-size]

requires: []
provides:
  - "wallet-web runner: Next standalone + prisma-cli overlay (no full builder node_modules)"
  - "COPY --chown ownership (no recursive chown -R /app)"
  - "runner-no-migrate measurement target + SKIP_MIGRATE"
  - "Ship tag wallet-web:latest ~808MB (was ~2.66GB)"
affects: [docker-compose, deploy]

actuals:
  tokens: 1471
  tasks: 3
  commits: 1

tech-stack:
  added: []
  patterns:
    - "prisma-cli dedicated install stage merged into standalone node_modules"
    - "ARG NODE_IMAGE same-libc multi-stage; apk vs apt toolchain detect"
    - "twin target runner-no-migrate for Prisma CLI size tax"

key-files:
  created: []
  modified:
    - Dockerfile
    - docker/entrypoint.sh

key-decisions:
  - "D-02 fallback shipped: node:24-bookworm-slim (alpine failed — better-sqlite3 node-gyp ETIMEDOUT on unofficial-builds headers)"
  - "D-01 primary overlay shipped (no npm ci --omit=dev fallback needed)"
  - "D-03 migrate stays in entrypoint; SKIP_MIGRATE only on measurement target"

patterns-established:
  - "Default final stage = runner (migrate); --target runner-no-migrate for tax twin"
  - "Never RUN chown -R after large COPY; use COPY --chown=node:node"

requirements-completed: [QUICK-1dm-DOCKER-SHRINK]

coverage:
  - id: D1
    description: "Ship image is standalone + prisma-cli overlay under ~1GB"
    requirement: QUICK-1dm-DOCKER-SHRINK
    verification:
      - kind: other
        ref: "docker image inspect wallet-web:migrate → 808464140 bytes"
        status: pass
    human_judgment: false
  - id: D2
    description: "Container runs prisma migrate deploy then serves /api/health"
    requirement: QUICK-1dm-DOCKER-SHRINK
    verification:
      - kind: integration
        ref: "docker run wallet-web:migrate + curl http://127.0.0.1:3001/api/health"
        status: pass
    human_judgment: false
  - id: D3
    description: "Prisma CLI size tax quantified (twin tags + du + dive)"
    requirement: QUICK-1dm-DOCKER-SHRINK
    verification:
      - kind: other
        ref: "migrate 808MB vs no-migrate 574MB; du prisma/@prisma; CI=true dive --ci"
        status: pass
    human_judgment: false

duration: 9min
completed: 2026-09-08
status: complete
---

# Phase 260908-1dm Plan 01: Shrink wallet-web Docker image Summary

**Cut wallet-web from ~2.66GB → ~808MB by dropping full builder `node_modules` + recursive chown, shipping Next standalone + dedicated `prisma@7.10.0` CLI overlay on bookworm-slim (alpine tried, failed).**

## Performance

- **Duration:** 9 min
- **Tasks:** 3/3
- **Commits:** 1 (T2/T3 measurement-only — no further code commits)

## Accomplishments

- Rewrote multi-stage `Dockerfile`: same-libc `ARG NODE_IMAGE`, apk/apt toolchain detect, `prisma-cli` stage, `COPY --chown` hygiene, no full-modules COPY, no `chown -R /app`.
- Default final stage `runner` = migrate-in-image; `--target runner-no-migrate` measurement twin with `SKIP_MIGRATE=1`.
- Smoke: migrate deploy + `{"status":"ok"}` on `/api/health` against ephemeral volume.
- Tagged ship image `wallet-web:latest` = migrate build.

## Ship path (fallbacks)

| Decision | Outcome |
|----------|---------|
| D-02 alpine | **Tried first** — `npm ci` / better-sqlite3 `node-gyp` **ETIMEDOUT** fetching `node-v24.20.0-headers` from unofficial-builds (musl compile path). |
| D-02 slim | **Shipped** — `NODE_IMAGE` default `node:24-bookworm-slim` (compose `build: .` works). |
| D-01 overlay | **Shipped** — standalone + prisma-cli merge. |
| D-01 `npm ci --omit=dev` | **Not needed** — smoke green on overlay. |

## Image sizes vs baseline

| Tag | `docker images` | Raw inspect bytes |
|-----|-----------------|-------------------|
| Baseline (pre) | ~2.66GB | — |
| `wallet-web:migrate` / `:latest` | **808MB** | 808,464,140 |
| `wallet-web:no-migrate` | **574MB** | 573,815,291 |
| Reduction vs 2.66GB | **~69.6%** | — |

**Prisma CLI / migrate tooling tax (D-03):**

| Metric | Value |
|--------|-------|
| Twin delta (migrate − no-migrate) | **~235MB** (234,648,849 bytes) |
| Build-stage `du -sh /prisma-cli` | **253M** |
| Layer `COPY …/prisma-cli/node_modules` | **235MB** (`docker history`) |
| In-image `du`: `prisma` | 41M |
| In-image `du`: `@prisma` | 196M |
| In-image `du`: `effect` | 33M |
| In-image `du`: `fast-check` / `pure-rand` | 4.2M / 320K |

**dive (`CI=true dive --ci wallet-web:migrate`):** efficiency **81.0%**; wastedBytes **~303MB** (Count=2 duplicates — NFT standalone already carries some `@prisma`/`prisma` paths; overlay merges again). Largest waste paths: `schema-engine-debian-openssl-1.1.x` (57MB×2), `@prisma/studio-core` UI bundles (30MB×2 each). Dominant ship layers: standalone **332MB** + prisma-cli overlay **235MB** — **no** ~1GB full-modules or ~1GB recursive ownership layers.

## Task commits

| Task | Name | Commit | Notes |
|------|------|--------|-------|
| 1 | Tracer: alpine standalone + prisma-cli overlay | `ba8beb3` | Dockerfile + entrypoint |
| 2 | Smoke migrate+HTTP | (reuse `ba8beb3`) | Primary path green; no code change |
| 3 | Measure Prisma CLI tax | (reuse `ba8beb3`) | Tags + du + dive; `docker tag` → `:latest` |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Default final stage was `runner-no-migrate`**
- **Found during:** Task 1 verify (image lacked `.bin/prisma`, had `SKIP_MIGRATE=1`)
- **Issue:** Docker builds last stage by default; measurement stage was last → ship tag accidentally no-CLI.
- **Fix:** Reordered so `runner` (with prisma-cli COPY) is the final stage.
- **Files modified:** `Dockerfile`
- **Commit:** `ba8beb3`

**2. [Rule 3 - Blocking] Alpine native rebuild failed**
- **Found during:** Task 1 first `docker build`
- **Issue:** better-sqlite3 node-gyp ETIMEDOUT on musl header download.
- **Fix:** D-02 fallback — default `NODE_IMAGE=node:24-bookworm-slim`; alpine retry documented in Dockerfile header.
- **Files modified:** `Dockerfile`
- **Commit:** `ba8beb3`

## Known Stubs

None.

## Threat Flags

None beyond plan register (no new endpoints/packages).

## Self-Check: PASSED

- FOUND: `Dockerfile`, `docker/entrypoint.sh`
- FOUND: commit `ba8beb3`
- FOUND: SUMMARY `status: complete`
- FOUND: `wallet-web:migrate` 808MB, `wallet-web:no-migrate` 574MB, `wallet-web:latest` 808MB
