---
phase: 01-docker-sqlite-foundation
reviewed: 2026-09-02T17:02:00Z
depth: standard
files_reviewed: 26
files_reviewed_list:
  - package.json
  - next.config.ts
  - vitest.config.ts
  - tsconfig.json
  - .dockerignore
  - .gitignore
  - .env.example
  - components.json
  - Dockerfile
  - docker-compose.yml
  - docker/entrypoint.sh
  - scripts/smoke-persist.sh
  - prisma/schema.prisma
  - prisma/migrations/20260902151000_init_platform_stub/migration.sql
  - prisma.config.ts
  - data/.gitkeep
  - src/app/layout.tsx
  - src/app/page.tsx
  - src/app/globals.css
  - src/app/api/health/route.ts
  - src/app/api/health/route.test.ts
  - src/lib/db.ts
  - src/lib/money.ts
  - src/lib/money.test.ts
  - src/lib/utils.ts
  - src/components/ui/button.tsx
findings:
  critical: 0
  warning: 5
  info: 5
  total: 10
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-09-02T17:02:00Z
**Depth:** standard
**Files Reviewed:** 26
**Status:** issues_found

## Summary

Reviewed Docker/SQLite foundation sources from plans 01–04 (Compose stack, Prisma stub, money constant, health readiness, ready page, smoke script). Loopback publish, gitignored DB artifacts, BigInt money columns, and migrate-on-start entrypoint look sound for a local single-user app. Main gaps: duplicated readiness logic, production image shipping devDependencies, bind-mount permission/UID fragility, SQLite dual-writer corruption risk, and a process-global pragma flag that does not match SQLite’s per-connection `foreign_keys` semantics.

## Warnings

### WR-01: Duplicated DB readiness checks can drift

**File:** `src/app/page.tsx:5-16` and `src/app/api/health/route.ts:10-24`
**Issue:** `getDbReadiness()` and `GET /api/health` both run pragmas, `SELECT 1`, and `_prisma_migrations` COUNT with separate try/catch copies. A future change to readiness rules (e.g. require successful `finished_at`, integrity check) can update one path and leave the other lying.
**Fix:** Extract a shared helper (e.g. `getReadiness(): Promise<{ ok: boolean }>`) in `src/lib/db.ts` or `src/lib/readiness.ts` and call it from both the page and the route.

```ts
// src/lib/readiness.ts
export async function getDbReadiness(): Promise<"ok" | "not_ready"> {
  try {
    await ensureSqlitePragmas();
    await prisma.$queryRaw`SELECT 1`;
    const rows = await prisma.$queryRaw<Array<{ c: number | bigint }>>`
      SELECT COUNT(*) AS c FROM _prisma_migrations
    `;
    return Number(rows[0]?.c ?? 0) > 0 ? "ok" : "not_ready";
  } catch {
    return "not_ready";
  }
}
```

### WR-02: `sqlitePragmasApplied` flag vs per-connection `foreign_keys`

**File:** `src/lib/db.ts:26-31`
**Issue:** `PRAGMA foreign_keys=ON` is per SQLite connection; `journal_mode=WAL` is persistent on the file. `PrismaBetterSqlite3.connect()` constructs a **new** `better-sqlite3` `Database` each call. A process-global `sqlitePragmasApplied` means a later reconnect skips re-applying `foreign_keys`. No FK relations exist in the stub schema today, so behavior is correct now — but phase 02+ FKs can be silently unenforced after reconnect. `timeout: 5000` in the adapter config already covers busy wait on each new client; the busy_timeout PRAGMA is redundant.
**Fix:** Apply `foreign_keys=ON` on every connection (adapter wrapper / hook), or clear the flag when the client is disposed and always re-run non-persistent pragmas. Prefer setting FK in a small wrapper around `createBetterSQLite3Client` if you fork/wrap the factory; at minimum re-run `PRAGMA foreign_keys=ON` without the global short-circuit:

```ts
export async function ensureSqlitePragmas(): Promise<void> {
  // WAL is DB-persistent; still safe to set once.
  if (!globalForPrisma.sqlitePragmasApplied) {
    await prisma.$executeRawUnsafe("PRAGMA journal_mode=WAL");
    globalForPrisma.sqlitePragmasApplied = true;
  }
  // Per-connection — must run whenever this connection is used.
  await prisma.$executeRawUnsafe("PRAGMA foreign_keys=ON");
}
```

### WR-03: Runner image includes full `node_modules` (devDependencies)

**File:** `Dockerfile:16` and `Dockerfile:51`
**Issue:** Dependencies stage runs `npm ci` without `NODE_ENV=production` / `--omit=dev`, then the runner copies the entire tree. Production image therefore contains `vitest`, `eslint`, `typescript`, `@types/*`, etc. Larger attack surface and image size; contradicts usual production hardening.
**Fix:** Install production deps for the runner (keep a separate path for `prisma` CLI, already in `dependencies`):

```dockerfile
# dependencies stage for runtime
RUN npm ci --omit=dev && npm rebuild better-sqlite3

# optional: separate build stage with full npm ci for next build
```

Or prune before the runner COPY: `npm prune --omit=dev` in the builder after `npm run build`.

### WR-04: Bind-mount `/data` ownership not enforced at start

**File:** `Dockerfile:38-39`, `docker/entrypoint.sh:1-10`, `docker-compose.yml:11-12`
**Issue:** Image `chown node:node /data` is overridden by `./data:/data`. Process runs as `USER node` (UID 1000). If host `./data` is not writable by UID 1000, `prisma migrate deploy` fails with a generic Prisma/SQLite error. RESEARCH pitfall called for a loud writability check; smoke/`chmod 700` help on the happy path but entrypoint does not verify.
**Fix:** Preflight in `docker/entrypoint.sh` before migrate:

```sh
if ! touch /data/.write_test 2>/dev/null; then
  echo "entrypoint: /data not writable by $(id -u); chown host ./data to UID $(id -u) or run chmod/chown" >&2
  exit 1
fi
rm -f /data/.write_test
```

### WR-05: Host + container concurrent writers on same SQLite file

**File:** `docker-compose.yml:11-12`, `scripts/smoke-persist.sh:62-64`, `src/lib/db.ts:10-12`
**Issue:** Host `./data/wallet.db` is the same inode as container `/data/wallet.db`. Smoke correctly `compose stop`s before host writes; normal use can still run `npm run dev` / Prisma Studio on the host while Compose `web` is up. Concurrent writers on one SQLite file risk corruption (data loss).
**Fix:** Document as hard rule (README already leans Docker XOR host). Stronger: refuse start if a lock/pid file exists, or use separate DB paths for host-dev vs Compose. Example guard in entrypoint / host scripts:

```sh
# Document + enforce: never attach a second writer to ./data/wallet.db
# while compose web is running.
```

## Info

### IN-01: WAL → DELETE fallback is documentation only

**File:** `src/lib/db.ts:22-25`, README SQLite journal section
**Issue:** Comment/README describe DELETE fallback for virtiofs/NFS, but code always sets WAL and treats failure as not-ready (via callers’ catch). Acceptable on native Linux btrfs for this phase; virtiofs hosts will flap unhealthy instead of soft-falling back.
**Fix:** Optional try/catch around WAL with `PRAGMA journal_mode=DELETE` fallback when WAL set fails.

### IN-02: Entrypoint logs full `DATABASE_URL`

**File:** `docker/entrypoint.sh:6`
**Issue:** `echo "prisma migrate deploy (DATABASE_URL=${DATABASE_URL})"` prints the URL. Fine for SQLite paths; unsafe if the URL later gains credentials.
**Fix:** Log only that migrate is starting, or redact userinfo from the URL.

### IN-03: Runner base image tag ignores `NODE_VERSION` ARG

**File:** `Dockerfile:3-4` vs `Dockerfile:26`
**Issue:** Build stages use `ARG NODE_VERSION=24-bookworm`; runner hardcodes `node:24-bookworm-slim`. ARG bumps can desync glibc/Node between build and runtime.
**Fix:** `ARG NODE_VERSION=24-bookworm` + `FROM node:${NODE_VERSION%-bookworm}-bookworm-slim` or a second `ARG`/`FROM node:24-bookworm-slim`.

### IN-04: `shadcn` CLI package is a runtime dependency

**File:** `package.json:27`
**Issue:** `"shadcn": "^4.20.0"` lives under `dependencies`, so it is installed into the Docker runner with WR-03. CLI is not needed at runtime.
**Fix:** Move `shadcn` to `devDependencies` (keep `class-variance-authority` / `clsx` / `tailwind-merge` / UI runtime deps as needed).

### IN-05: Health handler swallows all errors

**File:** `src/app/api/health/route.ts:22-24`
**Issue:** Bare `catch` returns 503 with no server-side log. Correct for readiness probes; makes production diagnosis harder.
**Fix:** `console.error` (or structured logger) before returning 503 in non-test environments.

---

_Reviewed: 2026-09-02T17:02:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
