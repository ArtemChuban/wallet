---
phase: 260908-1dm-shrink-wallet-web-docker-image-from-2-66
reviewed: 2026-09-08T01:30:00Z
depth: quick
files_reviewed: 2
files_reviewed_list:
  - Dockerfile
  - docker/entrypoint.sh
findings:
  critical: 0
  warning: 2
  info: 1
  total: 3
status: issues_found
---

# Phase 260908-1dm: Code Review Report

**Reviewed:** 2026-09-08T01:30:00Z
**Depth:** quick
**Files Reviewed:** 2
**Status:** issues_found

## Summary

Quick scan of `Dockerfile` + `docker/entrypoint.sh` after image shrink (standalone + prisma-cli overlay). Focus checks: ownership / `USER node` / `SKIP_MIGRATE` default / ARG alpine|slim look correct. Two warnings: Docker overlay directory-replace semantics, and unlocked `npm install` in `prisma-cli` stage. No secrets, no empty catches, no recursive `chown -R /app`.

## Focus checklist (requested)

| Concern | Verdict |
|---------|---------|
| Ownership via `COPY --chown`; no GB-scale `chown -R` | Pass — all app COPYs use `--chown=node:node`; only `chown node:node /data` |
| `USER node` | Pass — both `runner` and `runner-no-migrate` set `USER node` after privileged setup |
| `SKIP_MIGRATE` not ship default | Pass — `ENV SKIP_MIGRATE=1` only on `runner-no-migrate`; final stage is `runner` (no skip); entrypoint defaults `"${SKIP_MIGRATE:-0}"`; compose `build: .` hits last stage |
| Overlay merge correctness | Fragile — see WR-01 |
| Alpine/slim `ARG NODE_IMAGE` | Pass — global ARG before first `FROM`; apk vs apt detect; slim default documented after alpine fail |

## Warnings

### WR-01: Overlay COPY replaces colliding package dirs (not deep-merge)

**File:** `Dockerfile:86`
**Issue:** `COPY --from=prisma-cli … /prisma-cli/node_modules/ ./node_modules/` merges only at top-level names. Same-named dirs (`prisma`, `@prisma`, …) from the CLI tree **replace** the standalone NFT trees wholesale. SUMMARY/dive already note dual `@prisma`/`prisma` trees across layers; final FS is CLI-wins. Smoke green today, but a future Prisma/NFT layout change can drop client/engines/native paths silently.
**Fix:** Prefer a merge that cannot wipe NFT packages, e.g. copy only CLI package names needed for migrate, or a root-owned `RUN` that `cp -a` merges without deleting dest-only paths:

```dockerfile
# Example: copy named packages only (adjust list to what migrate needs)
COPY --from=prisma-cli --chown=node:node /prisma-cli/node_modules/prisma ./node_modules/prisma
COPY --from=prisma-cli --chown=node:node /prisma-cli/node_modules/@prisma ./node_modules/@prisma
# …effect, fast-check, pure-rand, etc.
```

Or install prisma into a temp dir and `cp -an` (no-clobber) / rsync merge into `./node_modules`.

### WR-02: prisma-cli install has no lockfile (transitive float)

**File:** `Dockerfile:41-43`
**Issue:** Stage runs `npm init -y` + `npm install --omit=dev "prisma@$(…package.json…)"` without `package-lock.json`. Top-level `prisma@7.10.0` is pinned; peers (`effect`, `@prisma/*`, engines) resolve floating at build time — weaker than plan intent (“pin … from existing lock”) and T-1dm-SC.
**Fix:** Reuse root lock for a dedicated install, e.g. copy `package.json` + `package-lock.json`, then `npm ci --omit=dev --ignore-scripts` limited to prisma (or `npm ci` in a workspace that only depends on `prisma`), or generate and commit a lock for the prisma-cli workdir.

## Info

### IN-01: Default `NODE_IMAGE` is slim, not alpine-first

**File:** `Dockerfile:1-10`
**Issue:** Plan D-02 preferred `node:24-alpine` as ARG default; ship default is `node:24-bookworm-slim` after alpine/native ETIMEDOUT. Header documents alpine retry via `--build-arg`. Intentional; not a defect.
**Fix:** None required — keep header + SUMMARY ship-path table as source of truth.

---

_Reviewed: 2026-09-08T01:30:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: quick_
