# Phase 1: Docker + SQLite Foundation - Pattern Map

**Mapped:** 2026-09-02
**Files analyzed:** 18
**Analogs found:** 0 / 18

**Repo state:** Greenfield. Live tree under `/home/artem/Documents/wallet` has GSD/planning tooling only (`.planning/`, `.cursor/`, `.claude/`). No tracked `Dockerfile`, `docker-compose.yml`, `*.prisma`, `next.config.*`, `src/`, or app `package.json`. `git ls-files` for app sources is empty. CONTEXT.md “Reusable Assets: None” confirmed by inspection.

**Pattern source for planner:** Use excerpts below copied from `01-RESEARCH.md` (and official Next/Prisma docs cited there). Do **not** copy Hono/Vite/Drizzle layouts from `.planning/research/STACK.md` — CONTEXT D-01–D-04 override those.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `Dockerfile` | config | batch | — (none in repo) | none |
| `docker-compose.yml` | config | request-response | — | none |
| `docker/entrypoint.sh` | utility | batch | — | none |
| `prisma/schema.prisma` | model | CRUD | — | none |
| `prisma/migrations/` (initial) | migration | transform | — | none |
| `prisma.config.ts` | config | file-I/O | — | none |
| `next.config.ts` | config | transform | — | none |
| `package.json` (+ lockfile) | config | batch | — | none |
| `src/lib/db.ts` | service | request-response | — | none |
| `src/lib/money.ts` | utility | transform | — | none |
| `src/lib/utils.ts` | utility | transform | — | none |
| `src/app/layout.tsx` | component | request-response | — | none |
| `src/app/page.tsx` | component | request-response | — | none |
| `src/app/api/health/route.ts` | route | request-response | — | none |
| `src/components/ui/*` (shadcn) | component | request-response | — | none |
| `data/.gitkeep` (+ ignore `*.db`) | config | file-I/O | — | none |
| `vitest.config.ts` | config | batch | — | none |
| `src/lib/money.test.ts` | test | transform | — | none |
| `scripts/smoke-persist.sh` | utility | batch | — | none |

Optional scaffolding also greenfield (same “none”): `tsconfig.json`, `.dockerignore`, `.gitignore`, `.env.example`, `components.json`, `src/generated/prisma/` (generate output; prefer gitignore).

## Pattern Assignments

### `Dockerfile` (config, batch)

**Analog:** none in repo — follow RESEARCH Pattern 1 (Next `with-docker` adapted to bookworm).

**Core pattern** (from `01-RESEARCH.md` Pattern 1):
```dockerfile
ARG NODE_VERSION=24-bookworm
FROM node:${NODE_VERSION} AS dependencies
WORKDIR /app
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

FROM node:${NODE_VERSION} AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

FROM node:24-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
USER node
ENTRYPOINT ["./docker/entrypoint.sh"]
```

**Planner notes:** Add build deps for `better-sqlite3`; ensure Prisma CLI bits available for migrate in runner (NFT includes and/or explicit COPY). External canonical: vercel/next.js `examples/with-docker/Dockerfile`.

---

### `docker-compose.yml` (config, request-response)

**Analog:** none — RESEARCH Compose fragment.

**Core pattern:**
```yaml
services:
  web:
    build: .
    ports:
      - "127.0.0.1:3000:3000"
    environment:
      DATABASE_URL: "file:/data/wallet.db"
    volumes:
      - ./data:/data
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
      interval: 5s
      timeout: 3s
      retries: 20
      start_period: 40s
```

**Shared constraints:** Single `web` service; bind `./data:/data`; bind publish to localhost only (ASVS V4).

---

### `docker/entrypoint.sh` (utility, batch)

**Analog:** none — RESEARCH Entrypoint.

**Core pattern:**
```sh
#!/bin/sh
set -e
npx prisma migrate deploy
exec node server.js
```

**Error handling:** `set -e` fails loud if migrate or `/data` unwritable. Do not start `server.js` until migrate succeeds (D-02).

---

### `prisma/schema.prisma` (model, CRUD)

**Analog:** none — RESEARCH schema stub (D-07–D-09).

**Core pattern:**
```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "sqlite"
}

model Currency {
  code  String @id
  name  String
  scale Int // required at create — no DB default
}

model FxRateStub {
  id                   Int    @id @default(autoincrement())
  currencyCode         String
  asOfDate             String // YYYY-MM-DD
  rateToPrimaryScaled  BigInt // primary_units_per_1_other * 10^8
}

model BalanceAmountStub {
  id           Int    @id @default(autoincrement())
  amountMinor  BigInt // minor units per Currency.scale
}
```

**Validation / anti-patterns:** No `Float`/`Decimal` money; rates `BigInt` not `Int`; `Currency.scale` required with no DB default.

---

### `prisma/migrations/` (migration, transform)

**Analog:** none. First migration must encode schema stub semantics. Apply at **container start** via `prisma migrate deploy`, never against empty path at image build (D-02).

---

### `prisma.config.ts` (config, file-I/O)

**Analog:** none — RESEARCH Pattern 2.

**Imports + core pattern:**
```typescript
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: env("DATABASE_URL") },
});
```

---

### `next.config.ts` (config, transform)

**Analog:** none — RESEARCH Code Examples.

**Core pattern:**
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/prisma/**/*",
      "./node_modules/@prisma/**/*",
      "./node_modules/better-sqlite3/**/*",
    ],
  },
};

export default nextConfig;
```

---

### `package.json` (config, batch)

**Analog:** none. Pin stack from RESEARCH Standard Stack: `next@16.3.4`, `react@19.2.8`, `prisma`/`@prisma/client`/`@prisma/adapter-better-sqlite3@7.10.0`, `better-sqlite3@13.0.3`, `zod`, `dotenv`, `vitest` (dev). Scripts: `build`, `start`, `test` (`vitest run`), `prisma` generate/migrate. Prefer `create-next-app` scaffold then pin versions — do not follow research Hono package set.

---

### `src/lib/db.ts` (service, request-response)

**Analog:** none — RESEARCH Pattern 2 + Prisma 7 SQLite docs.

**Imports + core pattern:**
```typescript
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const url = process.env.DATABASE_URL ?? "file:/data/wallet.db";
const adapter = new PrismaBetterSqlite3({ url });
export const prisma = new PrismaClient({ adapter });
```

**Planner extension (discretion):** Prisma client singleton for Next hot-reload (`globalThis` guard); on connect apply `PRAGMA journal_mode=WAL`, `foreign_keys=ON`, `busy_timeout` — fall back to DELETE journal only if host FS unsafe.

**Auth:** none (single local user; no auth middleware).

---

### `src/lib/money.ts` (utility, transform)

**Analog:** none. Export `RATE_SCALE_E8 = 100_000_000n` and any helpers that keep money/rate as `bigint` only. No IEEE float APIs for storage.

---

### `src/lib/utils.ts` (utility, transform)

**Analog:** none. After `shadcn init`, standard `cn()` via `clsx` + `tailwind-merge` (shadcn Next install path). Phase 1 may use lightly.

---

### `src/app/layout.tsx` / `src/app/page.tsx` (component, request-response)

**Analog:** none. App Router shell + ready page (D-06). Prefer Russian ready copy (e.g. “Кошелёк готов”) per RESEARCH A3; prove UI + DB together, not health-only. May SSR lightly and optionally touch `prisma` for status signal on page.

---

### `src/app/api/health/route.ts` (route, request-response)

**Analog:** none — RESEARCH Health Route Handler.

**Imports + core + error handling:**
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    // Optionally assert migrations applied via _prisma_migrations count > 0
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch {
    return NextResponse.json({ status: "not_ready" }, { status: 503 });
  }
}
```

**Validation:** Read-only; no user path input. Compose healthcheck consumes this URL only (not TCP-only).

---

### `src/components/ui/*` (component, request-response)

**Analog:** none. Generate via `npx shadcn@latest init` then add only what ready page needs. Do not hand-roll Button/Card (RESEARCH Don't Hand-Roll).

---

### `data/.gitkeep` (config, file-I/O)

**Analog:** none. Host mount target; gitignore `*.db`, `*-wal`, `*-shm`. Document `chmod 700` / uid 1000 writability for container `node` user.

---

### `vitest.config.ts` + `src/lib/money.test.ts` (config/test, transform)

**Analog:** none. Wave 0 from RESEARCH Validation Architecture: assert `RATE_SCALE_E8 === 100000000n`; schema conventions (no Float money; BigInt money/rate; required `scale`). Command: `npx vitest run`.

---

### `scripts/smoke-persist.sh` (utility, batch)

**Analog:** none. Compose up → write marker / assert health 200 → `down`/`up` → assert `./data/wallet.db` persists + health 200 (PLAT-01).

## Shared Patterns

### No authentication
**Source:** CONTEXT / RESEARCH Security Domain  
**Apply to:** All routes and pages  
Single local user — no auth middleware, sessions, or multi-tenant guards in Phase 1.

### Database access boundary
**Source:** CONTEXT D-02  
**Apply to:** All mutations and queries  
SQLite only from Route Handlers / Server Actions / server components via `src/lib/db.ts`. No second DB worker process.

### Error / readiness responses
**Source:** RESEARCH health example  
**Apply to:** `src/app/api/health/route.ts` and Compose healthcheck  
200 + `{ status: "ok" }` when DB reachable (and migrated); 503 + `{ status: "not_ready" }` otherwise. Entrypoint blocks start until migrate succeeds.

### Money / FX storage contract
**Source:** CONTEXT D-07–D-09 + RESEARCH schema stub  
**Apply to:** `prisma/schema.prisma`, `src/lib/money.ts`, tests  
INTEGER/`BigInt` minor units; required `Currency.scale`; FX `BigInt` at scale `10^8`. Never `Float` for money/rates.

### Docker volume contract
**Source:** RESEARCH Architecture + Pitfalls  
**Apply to:** Dockerfile, Compose, entrypoint, `data/`  
`DATABASE_URL=file:/data/wallet.db`; bind `./data:/data`; never write DB into image layer; migrate at start against mounted volume.

### Import alias
**Source:** RESEARCH create-next-app + Prisma output  
**Apply to:** App TypeScript  
`@/*` → `src/*`; Prisma client from `@/generated/prisma/client` (not default `@prisma/client` path for generated output).

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `Dockerfile` | config | batch | No Docker assets in repo |
| `docker-compose.yml` | config | request-response | No Compose files |
| `docker/entrypoint.sh` | utility | batch | No shell entrypoints |
| `prisma/schema.prisma` | model | CRUD | No ORM/schema |
| `prisma/migrations/` | migration | transform | No migrations |
| `prisma.config.ts` | config | file-I/O | No Prisma 7 config |
| `next.config.ts` | config | transform | No Next app |
| `package.json` | config | batch | No app package.json (only hook tooling under `.cursor`/`.claude`) |
| `src/lib/db.ts` | service | request-response | No DB client |
| `src/lib/money.ts` | utility | transform | No domain utils |
| `src/lib/utils.ts` | utility | transform | No shadcn `cn()` yet |
| `src/app/layout.tsx` | component | request-response | No App Router |
| `src/app/page.tsx` | component | request-response | No pages |
| `src/app/api/health/route.ts` | route | request-response | No Route Handlers |
| `src/components/ui/*` | component | request-response | No UI components |
| `data/.gitkeep` | config | file-I/O | No data dir |
| `vitest.config.ts` | config | batch | No test harness |
| `src/lib/money.test.ts` | test | transform | No tests |
| `scripts/smoke-persist.sh` | utility | batch | No smoke scripts |

**Planner action:** Treat `01-RESEARCH.md` Code Examples + Architecture Patterns as the sole in-repo pattern library for Phase 1. Prefer official Next `with-docker` and Prisma Docker/SQLite v7 docs over project-level Hono/Drizzle research.

## Metadata

**Analog search scope:** repo root; `src/`, `app/`, `prisma/`, Docker filenames; `git ls-files` for `*.ts`/`*.tsx`/`Dockerfile*`/`docker-compose*`/`*.prisma`/`next.config.*`/`package.json` (excluding `.cursor`/`.claude` tooling)  
**Files scanned:** live root + find depth 3 for Docker/Next/Prisma markers; RESEARCH recommended structure (18 primary targets)  
**Tracked-source gate:** N/A — no candidate analog paths exist in tracked app source  
**codegraph:** unavailable (not initialized) — used filesystem/`git ls-files`  
**Pattern extraction date:** 2026-09-02
