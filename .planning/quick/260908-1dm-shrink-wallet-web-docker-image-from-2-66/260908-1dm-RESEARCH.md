# Quick 260908-1dm: Shrink wallet-web Docker image — Research

**Researched:** 2026-09-08
**Domain:** Next.js standalone + Prisma 7 + better-sqlite3 Docker image size
**Confidence:** HIGH (baseline layers verified locally; Prisma 7 migrate deps cited from upstream)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Primary runner deps: minimal runtime — Next standalone + `src/generated` + only packages needed for `prisma migrate deploy` + `better-sqlite3` (no full builder `node_modules` COPY).
- Fallback if primary fails: `npm ci --omit=dev` (or equivalent) in runner — still smaller than builder full tree.
- Primary base: try `node:24-alpine` (accept musl + native rebuild risk).
- Fallback base: keep `node:24-bookworm-slim`.
- Migrate stays in-entrypoint (`prisma migrate deploy`); Prisma CLI remains in runner.
- Must measure/surface Prisma CLI / migrate tooling size tax (with vs without).

### Claude's Discretion
- Exact minimal runtime package/path list
- How to stage alpine vs slim (ARG / comments / dual targets)
- How to measure Prisma CLI footprint
- Whether build stays bookworm while only runner tries alpine

### Deferred Ideas (OUT OF SCOPE)
- (none listed in CONTEXT)
</user_constraints>

## Summary

Baseline `wallet-web:latest` = **2.66GB**. `docker history` shows two dominant runner layers: **`COPY …/node_modules` ≈ 1.05GB** and **`RUN chmod + chown -R node:node /app` ≈ 1.07GB**. The chown layer is classic BuildKit ownership rewrite duplication of the just-copied trees — fixing that alone can reclaim ~1GB even before pruning deps. [VERIFIED: `docker history wallet-web:latest`]

Standalone is already enabled (`output: "standalone"`) and tracing includes prisma/better-sqlite3 paths; runner still overlays the entire builder `node_modules` (full `npm ci`, including dev tooling). [VERIFIED: `Dockerfile:50-51`, `next.config.ts:3-17`]

**Primary recommendation:** Drop full `node_modules` COPY; ship `.next/standalone` + `src/generated` + a **Prisma CLI closure overlay**; use `COPY --chown=node:node` (never `RUN chown -R` after large COPYs); try alpine with **same-libc build+runner**; fall back to `npm ci --omit=dev` then `bookworm-slim` per CONTEXT.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary | Rationale |
|------------|--------------|-----------|-----------|
| Next app serve | Container runner | — | `node server.js` from standalone |
| Native SQLite binding | Builder (compile) → runner (load) | — | better-sqlite3 `.node` must match runner libc |
| `prisma migrate deploy` | Runner entrypoint | — | Locked in-image migrate |
| Image size / layer hygiene | Dockerfile multi-stage | — | COPY/chown/base image choices |

## Baseline anatomy (actionable)

| Layer | Size | Fix |
|-------|------|-----|
| `COPY .next/standalone` | ~304MB | Keep (app runtime) |
| `COPY node_modules` (full builder) | ~1.05GB | **Remove** — primary shrink |
| `RUN chown -R node:node /app` | ~1.07GB | **Eliminate** — `COPY --chown=node:node` |
| `node:24-bookworm-slim` + openssl | ~240MB | Alpine try = smaller OS; openssl/ca still needed |

Host top-level hint (not image layers): full `node_modules` ≈ 1.2GB; `prisma`+`@prisma`+`effect`+`better-sqlite3` selective sum ≈ **274MB** before dedupe with standalone. [VERIFIED: host `du`]

## Standard Stack (no new packages)

| Piece | Version / pin | Role |
|-------|---------------|------|
| Next standalone | already `output: "standalone"` + `outputFileTracingIncludes` | App runtime NFT tree [VERIFIED: `next.config.ts:3-17`] |
| Prisma CLI | `prisma@7.10.0` (lock) | `migrate deploy` in entrypoint [VERIFIED: `package.json:27`] |
| better-sqlite3 | `13.0.3` override | Native DB [VERIFIED: `package.json:21,49-51`] |
| Base | `node:24-alpine` → fallback `node:24-bookworm-slim` | CONTEXT lock |
| Size tool | `dive` (present at `~/.local/bin/dive`) | Layer inspection [VERIFIED: `command -v dive`] |

**Installation:** none — Dockerfile/entrypoint/config only.

## Package Legitimacy Audit

No new registry packages. **N/A — none / REMOVED none / SUS none.**

## Architecture Patterns

### Recommended runner shape

```
deps (build toolchain + npm ci + rebuild better-sqlite3)
  → builder (prisma generate + next build)
  → [optional] prisma-cli (npm i prisma@exact in empty dir --omit=dev)
  → runner (slim/alpine + openssl)
       COPY --chown=node:node standalone, static, public, prisma/, prisma.config.ts,
            src/generated, entrypoint
       COPY --chown=node:node prisma-cli/node_modules → merge into ./node_modules
       # NO full builder node_modules; NO RUN chown -R /app
```

### Discretion: minimal Prisma migrate closure

**Prefer dedicated install stage** (full production closure for `prisma@7.10.0`) over hand-picking folders — Prisma 7 `@prisma/config` pulls `effect` → `fast-check` → `pure-rand`; cherry-picks fail with `Cannot find package 'effect'`. [CITED: github.com/prisma/prisma/discussions/28759] [CITED: answeroverflow.com/m/1519382873092919366]

If cherry-pick preferred (faster iterate), start from community-proven list and **smoke `migrate deploy` in-container** until green:

`prisma`, `@prisma/**`, `effect`, `fast-check`, `pure-rand`, `dotenv`, plus `@prisma/config` peers (`c12`, `deepmerge-ts`, `empathic`) and whatever loader Prisma uses for `.ts` config (`jiti` present on host). [CITED: discussion #28759] [ASSUMED: exact peer set may grow with patch versions — verify by running migrate]

Standalone already traces app DB path via `outputFileTracingIncludes` for `prisma`, `@prisma`, `better-sqlite3`, `src/generated/prisma`. [VERIFIED: `next.config.ts:10-16`] Overlay must **merge** into standalone `node_modules`, not replace the whole tree.

### Discretion: alpine vs slim staging

Use one ARG, same libc for **deps+builder+runner** when alpine:

```dockerfile
ARG NODE_IMAGE=node:24-alpine
# fallback documented: NODE_IMAGE=node:24-bookworm-slim
```

**Do not** build natives on bookworm and copy into alpine runner — host engines today are `schema-engine-debian-openssl-3.0.x` (glibc). [VERIFIED: `file node_modules/@prisma/engines/schema-engine-debian-openssl-3.0.x`] Alpine needs musl rebuild of better-sqlite3 (`apk add python3 make g++`) and Prisma engines fetched for musl/openssl during `npm ci`/`prisma generate` on alpine.

Runner still needs TLS/certs: alpine `apk add --no-cache openssl ca-certificates`; slim already uses apt openssl. [ASSUMED: prisma schema-engine dynamic link needs openssl libs on alpine — confirm at first alpine build]

### Fallback path (a) — CONTEXT

If minimal overlay fails migrate/start/native load → runner stage:

```dockerfile
COPY package.json package-lock.json prisma prisma.config.ts ./
RUN npm ci --omit=dev && npm rebuild better-sqlite3
# then COPY standalone/static/public/generated/entrypoint over/merge carefully
```

Still smaller than current (drops builder **devDependencies** + chown bloat), but keeps fat prod deps (`next`, `lucide-react`, etc.).

### Fallback path (b) — CONTEXT

If alpine build/runtime/native fails → set `NODE_IMAGE=node:24-bookworm-slim`, keep deps toolchain via apt `python3 make g++` (current pattern). [VERIFIED: `Dockerfile:5-16`]

### Entrypoint integration

Keep `./node_modules/.bin/prisma migrate deploy` then `exec node server.js`. [VERIFIED: `docker/entrypoint.sh:6-10`] Ensure `.bin/prisma` exists after overlay (symlink from `prisma` package).

## Don't Hand-Roll

| Problem | Don't | Use |
|---------|-------|-----|
| Prisma 7 migrate deps | Copy only `node_modules/prisma` | Full CLI closure install or verified multi-package list |
| Ownership | `RUN chown -R` after GB copies | `COPY --chown=node:node` |
| Cross-libc natives | Copy `.node`/engines bookworm→alpine | Rebuild on target libc |
| App deps | Reinstall all prod deps as primary | Standalone NFT + migrate overlay |

## Common Pitfalls

1. **chown layer doubling** — current 1.07GB layer; fix first/always. Warning: image ≈ 2× content after ownership RUN.
2. **Prisma 7 `prisma.config.ts`** — `defineConfig`/`env` from `prisma/config` need `@prisma/config` + `effect` tree; NFT misses migrate-only imports. [CITED: prisma discussion #28759]
3. **glibc engines on alpine** — `schema-engine-debian-*` will not run on musl.
4. **better-sqlite3 musl** — often no prebuild → need `python3 make g++` in deps stage. [CITED: WiseLibs better-sqlite3 discussion #1270]
5. **Overlay order** — copy prisma-cli modules then standalone (or reverse carefully) so app `@prisma/client`/adapter win on overlap; test migrate + HTTP smoke.
6. **`outputFileTracingIncludes` already lists prisma** — including whole `node_modules/prisma` in NFT can inflate standalone (~304MB already); prefer migrate overlay for CLI-only weight rather than widening NFT further. [ASSUMED: measuring which bytes sit in standalone vs overlay needs one build]

## Measure Prisma CLI size tax (required)

Do **all three** so SUMMARY can quote a number:

1. **Build twin tags** (same Dockerfile, ARG):
   - `wallet-web:migrate` — final image with CLI overlay / migrate entrypoint
   - `wallet-web:no-migrate` — identical but omit prisma-cli COPY; entrypoint skips migrate (measurement-only tag, not ship default)
   - Compare: `docker images wallet-web --format '{{.Tag}} {{.Size}}'`
2. **In-container `du`** on migrate image:
   - `docker run --rm --entrypoint du wallet-web:migrate -sh /app/node_modules/prisma /app/node_modules/@prisma /app/node_modules/effect …`
3. **`dive wallet-web:migrate`** — attribute layer(s) that added the CLI overlay; paste largest efficient paths into SUMMARY.

Optional fourth: dedicated `prisma-cli` stage `RUN du -sh /prisma-cli` printed in build log = pure CLI closure before merge.

## Code Examples

### COPY hygiene (replace current pattern)

```dockerfile
# BAD (current): duplicates ~1GB
# COPY --from=builder /app/node_modules ./node_modules
# RUN chown -R node:node /app

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=node:node /app/src/generated ./src/generated
COPY --from=prisma-cli --chown=node:node /prisma-cli/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/docker/entrypoint.sh ./docker/entrypoint.sh
RUN chmod +x ./docker/entrypoint.sh
USER node
```

### prisma-cli stage (preferred overlay)

```dockerfile
FROM ${NODE_IMAGE} AS prisma-cli
WORKDIR /prisma-cli
COPY --from=builder /app/package.json /tmp/pkg.json
RUN npm init -y >/dev/null \
  && npm install --omit=dev --no-audit --no-fund \
       "prisma@$(node -p "require('/tmp/pkg.json').dependencies.prisma")"
# Note: pin exact 7.10.0 from lock; adjust if package.json uses range
```

[ASSUMED: exact `npm init` snippet shape — pattern from public Prisma 7 Docker examples; verify version pin against lockfile during execute]

## Assumptions Log

| # | Claim | Risk if Wrong |
|---|-------|---------------|
| A1 | Alpine needs openssl apk + musl engine fetch | First alpine build fails at migrate |
| A2 | Cherry-pick peer list incomplete without install-stage | Migrate missing-module loop |
| A3 | Widening NFT further is worse than CLI overlay | Standalone grows without helping migrate |
| A4 | `npm ci --omit=dev` fallback still ≪ 2.66GB after chown fix | Fallback disappointing; still must drop chown -R |

## Open Questions (RESOLVED)

1. **Simplify `prisma.config.ts`?** RESOLVED: deferred / out of scope. Upstream notes plain `export default { …; url: process.env.DATABASE_URL }` reduces `@prisma/config`/`effect` need. [CITED: github.com/prisma/issues/28607] — not in CONTEXT lock; do not block primary path.
2. **Can `shadcn` stay out of runtime?** RESOLVED: deferred / out of scope. It's a prod dependency today — standalone may still pull unused weight; out of scope unless a later NFT audit.

## Environment Availability

| Dependency | Required By | Available | Notes |
|------------|-------------|-----------|-------|
| Docker | build/measure | ✓ | `wallet-web:latest` 2.66GB present |
| dive | layer audit | ✓ | `/home/artem/.local/bin/dive` |
| node 24 images | bases | ✓ | bookworm-slim inspect ~160MB uncompressed |
| Build toolchain | native rebuild | via image | apt/apk in deps stage |

## Validation Architecture

| Property | Value |
|----------|-------|
| Framework | Vitest (host) + Docker smoke |
| Quick check | `docker images` size + `docker run` migrate+curl |
| Host gate | `npx vitest run src/lib/foundation.test.ts` (existing migrate gate) |

| Behavior | Test | Exists? |
|----------|------|---------|
| Image ≪ 2.66GB | `docker images wallet-web` | Wave 0 measure |
| migrate deploy in container | run entrypoint against empty `/data` volume | ❌ add in execute |
| App serves | HTTP smoke after start | ❌ add in execute |
| Prisma CLI tax documented | twin-tag or du/dive in SUMMARY | ❌ required by CONTEXT |

## Security Domain

| ASVS | Applies | Control |
|------|---------|---------|
| V5 Input Validation | no change | — |
| V6 Cryptography | no | no new crypto |
| Supply chain | yes | no new npm pkgs; base image pin by tag already |

| Threat | Mitigation |
|--------|------------|
| Larger attack surface from full node_modules | Remove unused builder/dev trees from runner |
| Running as root | Keep `USER node`; fix chown via COPY flags |

## Sources

### Primary
- Local `docker history wallet-web:latest` — layer sizes
- `Dockerfile`, `docker/entrypoint.sh`, `next.config.ts`, `package.json` — read this session
- Next.js `output` docs — standalone + `outputFileTracingIncludes` [CITED: nextjs.org/docs/.../output]

### Secondary
- Prisma discussion #28759 — migrate deps missing under standalone
- Answer Overflow / Prisma 7 `effect` missing on migrate
- better-sqlite3 Alpine toolchain guidance

## Metadata

**Confidence:** Stack/baseline HIGH; alpine success MEDIUM until first build; exact cherry-pick list MEDIUM (prefer install-stage).

**Valid until:** ~30 days (Node/Prisma patch churn)
