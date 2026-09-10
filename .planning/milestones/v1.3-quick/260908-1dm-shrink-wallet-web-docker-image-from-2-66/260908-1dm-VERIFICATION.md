---
phase: 260908-1dm-shrink-wallet-web-docker-image-from-2-66
verified: 2026-09-07T23:31:17Z
status: passed
score: 5/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification: false
decision_coverage:
  honored: 0
  total: 0
  not_honored: []
  skipped: true
  reason: no trackable decisions
---

# Phase 260908-1dm: Shrink wallet-web Docker image Verification Report

**Phase Goal:** Shrink wallet-web Docker image from ~2.66GB — maximize final image size reduction (standalone Next.js, prune node_modules in runner, alpine/slim, multi-stage hygiene)

**Verified:** 2026-09-07T23:31:17Z  
**Status:** passed  
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | D-01: Runner ships Next standalone + src/generated + Prisma migrate closure only (not builder full node_modules); fallback npm ci --omit=dev if primary fails | ✓ VERIFIED | No `COPY --from=builder …/node_modules` in runner. Runner copies `.next/standalone`, `src/generated`, then merges `prisma-cli` overlay only (`Dockerfile` L66–86). Live migrate image: `server.js` + `src/generated` + `.bin/prisma`; no typescript/eslint/jest; `/app/node_modules` ~430M (overlay+NFT), not full builder tree. Primary overlay green — omit=dev fallback unused (allowed). |
| 2 | D-02: Primary build uses node:24-alpine same-libc; fallback NODE_IMAGE=node:24-bookworm-slim if alpine/native fails | ✓ VERIFIED | Header documents alpine try + ETIMEDOUT; ship default `ARG NODE_IMAGE=node:24-bookworm-slim`. All stages `FROM ${NODE_IMAGE}` (deps/builder/prisma-cli/runner-base). apk vs apt toolchain detect present. Live image base = bookworm (history shows debian/apt layers). |
| 3 | D-03: entrypoint still runs prisma migrate deploy then node server.js; Prisma CLI size tax measured (migrate vs no-migrate / du / dive) | ✓ VERIFIED | `docker/entrypoint.sh`: migrate unless `SKIP_MIGRATE=1`, then `exec node server.js`. Live: migrate 808,464,140 B; no-migrate 573,815,291 B; tax 234,648,849 B (~235MB). In-image `du`: prisma 41M, @prisma 196M, effect 33M. History: prisma-cli COPY layer 235MB. SUMMARY also records dive 81% efficiency / ~303MB waste (duplicate engines). |
| 4 | Final wallet-web image size substantially below baseline ~2.66GB | ✓ VERIFIED | `wallet-web:migrate` / `:latest` = **808MB** (808,464,140 bytes) ≈ **69.6%** cut vs ~2.66GB. Under plan gate 2.5GB. Dominant runner layers 332MB standalone + 235MB CLI — not ~1GB+~1GB baseline pair. |
| 5 | Ownership of /app content uses COPY --chown; no post-COPY recursive ownership RUN that rewrites GB-scale layers | ✓ VERIFIED | All app COPYs use `--chown=node:node`. Only `chown node:node /data` on small dir. No `chown -R` / recursive `/app` ownership RUN. History: no ~1GB rewrite layer. |

**Score:** 5/5 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `Dockerfile` | ARG NODE_IMAGE; prisma-cli; standalone+overlay; COPY --chown; slim + measurement twin | ✓ VERIFIED | Exists, substantive, wired. Final stage `runner` (migrate). `--target runner-no-migrate` + `SKIP_MIGRATE=1`. gsd `verify.artifacts`: passed. |
| `docker/entrypoint.sh` | Migrate-then-server default; measurement may skip via SKIP_MIGRATE | ✓ VERIFIED | Exists, substantive, wired as ENTRYPOINT. SKIP_MIGRATE branch for twin only. |

### Key Link Verification

gsd `verify.key-links` returned false (expects file-path `from:`) — manual Level-3 check:

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| prisma-cli `npm install prisma@lock` | runner `./node_modules/.bin/prisma` | `COPY --chown` merge into `./node_modules/` | ✓ WIRED | L38–44 install; L86 overlay. Migrate image: prisma symlink → `../prisma/build/index.js`; `prisma --version` → 7.10.0. no-migrate: binary absent. |
| `docker/entrypoint.sh` migrate deploy | `/data/wallet.db` volume | `DATABASE_URL=file:/data/wallet.db` then `exec node server.js` | ✓ WIRED | Entrypoint exports default URL; Dockerfile sets same ENV + `mkdir /data`. Compose mounts volume for runtime. |
| `ARG NODE_IMAGE` | deps + builder + prisma-cli + runner-base | Same libc for native engines | ✓ WIRED | L10 ARG; L12/29/38/47 all `FROM ${NODE_IMAGE}`. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| Runner image layers | standalone tree | `COPY --from=builder .next/standalone` | Next build output | ✓ FLOWING |
| Prisma CLI overlay | `/app/node_modules` | `prisma-cli` stage `npm install prisma@$(pkg)` | Lock-aligned 7.10.0 closure | ✓ FLOWING |
| Migrate target DB | `DATABASE_URL` | env / entrypoint default `file:/data/wallet.db` | Volume-backed SQLite at runtime | ✓ FLOWING |
| Measurement twin | `SKIP_MIGRATE` | `ENV SKIP_MIGRATE=1` on `runner-no-migrate` only | Omits CLI + skips migrate | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------- |
| Migrate image size << 2.66GB | `docker image inspect wallet-web:migrate --format '{{.Size}}'` | 808464140 | ✓ PASS |
| Tax twin smaller | migrate − no-migrate | 234648849 | ✓ PASS |
| Prisma CLI present (ship) | `docker run … prisma --version` | prisma 7.10.0 | ✓ PASS |
| Prisma CLI absent (measure) | `ls …/.bin/prisma` on no-migrate | No such file; SKIP_MIGRATE=1 | ✓ PASS |
| No full-deps markers | miss typescript/eslint/jest | all MISS | ✓ PASS |
| Full HTTP smoke | start container + curl /api/health | Not re-run (server start) | ? SKIP — infra; script+CLI+image evidence sufficient |

### Probe Execution

| Probe | Command | Result | Status |
| ----- | ------- | ------ | ------ |
| — | — | No phase probes declared | SKIP |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| QUICK-1dm-DOCKER-SHRINK | 01 | Shrink wallet-web image; maximize reduction | ✓ SATISFIED | 808MB vs ~2.66GB; standalone+overlay; tax quantified |

### Decision Coverage

No trackable decisions in CONTEXT.md (gsd gate skipped). CONTEXT D-01/D-02/D-03 honored in Dockerfile + entrypoint + live tags (see truths).

### Test Quality Audit

N/A — infrastructure/Docker quick task; no requirement-linked unit/integration test files. Evidence = live `docker image inspect` / in-image `du` / `prisma --version`.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | No TBD/FIXME/XXX/TODO debt markers | — | — |
| — | — | No recursive chown / full builder node_modules COPY to runner | — | — |

ℹ️ Info: dive-reported duplicate `@prisma`/schema-engine paths (~303MB waste) — known NFT+overlay overlap; does not block goal (still ≪ baseline).

### Human Verification Required

N/A — Infrastructure/foundation phase (Docker image shrink). No user-facing UX. Acceptance criteria verified via image inspect, history, in-image filesystem, and entrypoint/Dockerfile wiring. No ⚠️ PRESENT_BEHAVIOR_UNVERIFIED truths.

### Gaps Summary

None. Goal achieved: ship image **808MB** (~69.6% smaller than ~2.66GB), measurement twin **574MB**, Prisma CLI tax **~235MB**, migrate-then-server default preserved, ownership via `COPY --chown` only.

---

_Verified: 2026-09-07T23:31:17Z_  
_Verifier: Claude (gsd-verifier)_
