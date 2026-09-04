# Phase 1: Docker + SQLite Foundation - Research

**Researched:** 2026-09-02
**Domain:** Next.js standalone Docker + Prisma 7 SQLite (file DB on host bind-mount)
**Confidence:** HIGH (stack pins + official Next/Prisma/SQLite docs); MEDIUM (standalone+migrate image packaging details)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
### Runtime shape
- **D-01:** Use **Next.js** with `output: 'standalone'` (not the research default of Hono + Vite SPA). — **Reversibility:** costly — framework choice touches Dockerfile, entrypoint, routing, and all later UI/API work.
- **D-02:** SQLite access and mutations live in **Route Handlers / Server Actions** only (no second DB worker process). Prisma migrate runs in the **Docker entrypoint before `next start`**. — **Reversibility:** costly — process topology and migrate lifecycle are Compose/entrypoint contracts.
- **D-03:** **Prisma** is the ORM (not Drizzle). Use Prisma’s SQLite provider with a file DB on the mounted volume. — **Reversibility:** costly — schema, migrations, and all data access follow Prisma.
- **D-04:** **shadcn/ui** is the UI component library on the Next App Router shell (Phase 1 ready page may use it lightly). — **Reversibility:** costly — component and styling conventions for later UI phases.
- **D-05:** Docker image: **multi-stage Node 24 bookworm** build + **bookworm-slim** runtime with Next standalone output (not Alpine). — **Reversibility:** reversible — image base can change with rebuild effort.
- **D-06:** Phase 1 browser proof: minimal **“Wallet OK”** (or Russian equivalent) ready page **plus** a health/readiness signal that the database is reachable and migrated.

### Money column type
- **D-07:** Store account/balance money as **INTEGER minor units**, never IEEE float / REAL. — **Reversibility:** one-way — changing representation later needs a data migration and touches every money field.
- **D-08:** Each currency has a **required `scale`** set at currency create time (no guessed default). — **Reversibility:** one-way — scale is part of how integers map to display amounts; changing scale without migration corrupts history.
- **D-09:** Store FX rates as **INTEGER with fixed scale 10^8** (rate × 10^8). — **Reversibility:** one-way — rate column semantics are a cross-phase contract for FX and charts.

### Claude's Discretion
- **Host data path:** Prefer research default bind-mount `./data:/data` with `DATABASE_PATH` / Prisma `file:` URL under `/data` unless planning finds a blocker.
- **SQLite journal_mode:** Prefer WAL with FK/`busy_timeout` PRAGMAs; document or fall back to DELETE if the host FS (e.g. virtiofs/NFS) proves unsafe — confirm during plan/execute smoke test.
- Exact health route shape, Russian vs English copy on the ready page, and Prisma client singleton patterns — choose standard Next + Prisma practices.

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope. Host path and journal mode left to Claude’s discretion (research defaults), not deferred as new capabilities.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PLAT-01 | App runs in Docker with all data in local SQLite on the host | Compose one `web` service; bind-mount `./data:/data`; `DATABASE_URL=file:/data/wallet.db`; entrypoint `prisma migrate deploy` then standalone `node server.js`; health Route Handler gates readiness on DB + migrations; persist smoke test after `compose down/up` |
</phase_requirements>

## Summary

Phase 1 is a greenfield Walking Skeleton: a Next.js 16 App Router app in Docker Compose with SQLite on a host bind-mount, Prisma migrations on container start, a minimal ready page, and a readiness probe that only passes when the DB is reachable and migrated. Project-level research recommended Hono + Drizzle; **CONTEXT overrides that** — plan for Next.js + Prisma + shadcn/ui only.

Prisma’s current stable line for this work is **7.10.0** (matched `prisma` + `@prisma/client`). Do **not** install npm `latest` for the CLI (`8.0.0-rc.*` as of research day). Prisma 7 requires `prisma.config.ts` for the SQLite `file:` URL, a generated client with required `output`, and the **`@prisma/adapter-better-sqlite3`** driver adapter (pulls in native `better-sqlite3`). That native addon is why **bookworm build + bookworm-slim runtime** (D-05) is the right base, not Alpine.

Money/FX storage rules must land in the **first migration stub**: Prisma `BigInt` columns (map to SQLite `INTEGER`) for minor-unit money and rate×10^8; required `Currency.scale`; no `Float`/`Decimal` money fields. Host FS here is native Linux **btrfs** — prefer **WAL** + FK + `busy_timeout`; document DELETE fallback for virtiofs/NFS hosts.

**Primary recommendation:** Scaffold Next 16 + Prisma 7.10 + better-sqlite3 adapter + shadcn shell; multi-stage Dockerfile from official `with-docker` pattern adapted to bookworm; Compose `./data:/data`; entrypoint migrate-then-start; `/api/health` + Russian “Wallet OK” page; BigInt money/rate schema stub.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Docker Compose / image lifecycle | API / Backend (container) | CDN / Static — | Single `web` process owns start, migrate, serve |
| SQLite file persistence | Database / Storage | API / Backend | Host bind-mount is source of truth; app opens file path |
| Prisma migrate-on-start | API / Backend | Database / Storage | Entrypoint applies migrations before accepting traffic |
| Ready / status UI page | Browser / Client | Frontend Server (SSR) | App Router page proves UI shell; may SSR lightly |
| Health / readiness signal | API / Backend | — | Route Handler queries DB; Compose/`curl` consume it |
| Money/FX column conventions | Database / Storage | API / Backend | Schema stub locks INTEGER semantics for later phases |
| shadcn component primitives | Browser / Client | Frontend Server (SSR) | UI library on App Router; Phase 1 uses lightly |

## Project Constraints (from .cursor/rules/)

No `.cursor/rules/` directory present in the workspace.

Actionable constraints from `.claude/CLAUDE.md` / `.planning/PROJECT.md` that planners must honor:

- Runtime must be Dockerized; data must be SQLite on the host (no cloud DB).
- Single local user — no auth/multi-tenant in v1.
- CONTEXT stack override (Next + Prisma + shadcn) supersedes research STACK.md Hono/Drizzle defaults.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js | **24.x** Docker `node:24-bookworm` (build) + `node:24-bookworm-slim` (runtime) | Runtime | Active LTS; matches D-05; glibc for native `better-sqlite3` `[VERIFIED: npm next@16.3.4 engines node>=20.9.0; official Next with-docker uses Node 24 slim]` |
| Next.js | **16.3.4** | App Router UI + Route Handlers | Locked D-01; `output: 'standalone'` for Docker `[VERIFIED: npm registry 2026-09-02]` |
| React / react-dom | **19.2.8** | UI | Next 16 peer ecosystem `[VERIFIED: npm registry]` |
| Prisma CLI | **7.10.0** | Migrate / generate | Pin matched pair; avoid `prisma@latest` RC8 `[VERIFIED: npm dist-tags; prisma.io Docker guide pins 7.10.0]` |
| `@prisma/client` | **7.10.0** | ORM client | Must match CLI major/minor `[VERIFIED: npm registry]` |
| `@prisma/adapter-better-sqlite3` | **7.10.0** | SQLite driver adapter | Required for Prisma 7 local SQLite `[CITED: prisma.io/docs/orm/v7/.../sqlite]` |
| better-sqlite3 | **13.0.3** | Native SQLite driver | Adapter dependency; sync single-writer `[VERIFIED: npm registry]` |
| TypeScript | **5.x** (Next default) or **7.0.2** if toolchain allows | Types | Prisma 7 requires TS ≥5.4 `[CITED: prisma.io upgrade-to-v7]` — prefer Next-compatible TS first if 7 conflicts with tooling `[ASSUMED]` |
| Docker Compose | **v2+** (host has Compose **v5.1.4**) | Orchestration | One service + bind-mount `[VERIFIED: docker compose version on host]` |
| shadcn/ui | CLI `shadcn@latest` (source components) | UI primitives | Locked D-04 `[CITED: ui.shadcn.com/docs/installation/next]` |
| Tailwind CSS | **4.3.3** | Styling | shadcn/Next default path `[VERIFIED: npm registry]` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | **4.5.4** | Request/env validation | Health/env parsing; later API boundaries `[VERIFIED: npm registry]` |
| dotenv | **17.4.2** | Load `.env` for Prisma CLI | `import "dotenv/config"` in `prisma.config.ts` `[CITED: prisma.io Docker / v7 upgrade]` |
| class-variance-authority / clsx / tailwind-merge | **0.7.1 / 2.1.1 / 3.6.0** | shadcn `cn()` helpers | After `shadcn init` `[VERIFIED: npm registry]` |
| lucide-react | **1.39.0** | Icons | Optional Phase 1 polish `[VERIFIED: npm registry]` |
| vitest | **4.1.11** | Unit tests | Wave 0 schema/constant tests `[VERIFIED: npm registry]` |
| decimal.js | — | Display/math later | **Defer** — Phase 1 locks INTEGER storage; not required to install now `[ASSUMED]` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Prisma 7.10 + adapter | Prisma 6.19.x classic engines | Less adapter/native complexity; not current Prisma Docker docs path; still overrides Drizzle but fights “current Prisma” |
| Prisma 8 RC | — | **Rejected** — `latest` is RC; unsuitable for foundation |
| Named Docker volume | Bind `./data` | Named volume more reliable on Docker Desktop; CONTEXT prefers host-visible `./data` — keep bind on this Linux host |
| Alpine Node | bookworm | Smaller image; worse native addon story — conflicts with D-05 |

**Installation (illustrative pins — lockfile is source of truth):**

```bash
npx create-next-app@latest . --ts --eslint --tailwind --app --src-dir --import-alias "@/*"
npm install next@16.3.4 react@19.2.8 react-dom@19.2.8 \
  @prisma/client@7.10.0 @prisma/adapter-better-sqlite3@7.10.0 better-sqlite3@13.0.3 \
  zod@4.5.4 dotenv@17.4.2
npm install -D prisma@7.10.0 typescript vitest @types/better-sqlite3
npx prisma init --datasource-provider sqlite
npx shadcn@latest init
```

**Version verification (2026-09-02):** `next@16.3.4`, `prisma@7.10.0`, `@prisma/client@7.10.0`, `@prisma/adapter-better-sqlite3@7.10.0`, `better-sqlite3@13.0.3`, `react@19.2.8`.

## Package Legitimacy Audit

| Package | Registry | Age / publishedAt signal | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|--------------------------|-----------|-------------|---------|-------------|
| next | npm | 2026-08-31 | ~55M/wk | vercel/next.js | SUS (too-new) | Flagged — official; human-verify pin |
| prisma | npm | 2026-08-26 | ~17M/wk | prisma | SUS (too-new) | Flagged — pin **7.10.0** not RC8 |
| @prisma/client | npm | 2026-08-25 | ~16M/wk | prisma/prisma | SUS (too-new) | Flagged — match CLI |
| @prisma/adapter-better-sqlite3 | npm | 2026-08-25 | ~179k/wk | prisma/prisma | SUS (too-new) | Flagged — required by Prisma 7 SQLite docs |
| better-sqlite3 | npm | 2026-08-05 | ~10M/wk | WiseLibs/better-sqlite3 | SUS (too-new) | Flagged — native build in bookworm |
| zod / vitest / tailwindcss / cva / clsx / tailwind-merge / dotenv / typescript | npm | varies | high | official repos | OK or SUS(too-new) | Approved / flag per seam |
| lucide-react | npm | 2026-09-01 | ~98M/wk | lucide-icons | SUS (too-new) | Optional; flag if installed |

**Packages removed due to [SLOP] verdict:** none

**Packages flagged as suspicious [SUS]:** `next`, `prisma`, `@prisma/client`, `@prisma/adapter-better-sqlite3`, `better-sqlite3`, `lucide-react` (and any other “too-new” hits) — planner inserts `checkpoint:human-verify` before install. Seam reason is age heuristic, not missing source; packages are official with high downloads.

*Do not install `prisma@8.0.0-rc.*` — RC, not Phase 1 baseline.*

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ Host (Linux btrfs)                                              │
│  ./data/wallet.db (+ -wal/-shm)  ←── bind mount ──┐             │
│  browser → http://127.0.0.1:3000                  │             │
└───────────────────────────────────────────────────┼─────────────┘
                                                    │
┌───────────────────────────────────────────────────▼─────────────┐
│ Docker Compose service: web                                     │
│                                                                 │
│  ENTRYPOINT                                                     │
│    1) prisma migrate deploy  (needs prisma/ + prisma.config.ts) │
│    2) exec node server.js    (Next standalone)                  │
│                                                                 │
│  Next.js process                                                │
│    ┌──────────────┐    ┌────────────────────┐                   │
│    │ app/page     │    │ app/api/health     │                   │
│    │ Ready UI     │    │ readiness probe    │                   │
│    └──────┬───────┘    └─────────┬──────────┘                   │
│           │ Server Components / Route Handlers only             │
│           └──────────────┬──────────────────────────────────────│
│                          ▼                                      │
│              PrismaClient + PrismaBetterSqlite3                 │
│              DATABASE_URL=file:/data/wallet.db                  │
│              PRAGMA WAL / FK / busy_timeout on connect          │
└─────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
/
├── Dockerfile
├── docker-compose.yml
├── docker/entrypoint.sh
├── prisma/
│   ├── schema.prisma          # models + generator output path
│   └── migrations/            # committed SQL migrations
├── prisma.config.ts           # datasource url from env
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx           # ready page
│   │   └── api/health/route.ts
│   ├── components/ui/         # shadcn
│   ├── lib/
│   │   ├── db.ts              # Prisma singleton + adapter + PRAGMAs
│   │   ├── money.ts           # RATE_SCALE_E8 = 100_000_000n constant
│   │   └── utils.ts           # cn()
│   └── generated/prisma/      # prisma generate output (gitignore or commit per team choice)
├── data/.gitkeep              # host mount target (ignore *.db)
├── next.config.ts             # output: 'standalone' + tracing includes
└── package.json
```

### Pattern 1: Next standalone multi-stage image (bookworm)

**What:** Official Next `with-docker` three-stage flow (deps → builder → runner), adapted to `node:24-bookworm` for install/build (compile `better-sqlite3`) and `node:24-bookworm-slim` runner; copy `.next/standalone`, `.next/static`, `public`.

**When to use:** Always for D-01 + D-05.

**Example:**

```dockerfile
# Source pattern: https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile
# Adapt bases to bookworm / bookworm-slim; add build deps for better-sqlite3;
# copy prisma/ + prisma.config.ts; entrypoint migrate then node server.js
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
# Ensure prisma CLI + engines available (tracing includes and/or explicit copy)
USER node
ENTRYPOINT ["./docker/entrypoint.sh"]
```

### Pattern 2: Prisma 7 SQLite + migrate-on-start

**What:** `datasource db { provider = "sqlite" }` without `url`; URL in `prisma.config.ts`; runtime `PrismaBetterSqlite3` adapter; production `prisma migrate deploy` before server.

**When to use:** Locked D-02/D-03.

**Example:**

```typescript
// Source: https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/sqlite
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const url = process.env.DATABASE_URL ?? "file:/data/wallet.db";
const adapter = new PrismaBetterSqlite3({ url });
export const prisma = new PrismaClient({ adapter });
```

```typescript
// prisma.config.ts — Source: https://www.prisma.io/docs/guides/deployment/docker
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: env("DATABASE_URL") },
});
```

### Pattern 3: Readiness Route Handler

**What:** `GET /api/health` returns 200 only if SQLite opens and migrations are applied (e.g. can query `_prisma_migrations` or a stub model); 503 otherwise. Compose `healthcheck` curls this URL. Ready page is separate UI proof (D-06).

**When to use:** Success criterion 3.

### Pattern 4: Schema stub locks money conventions

**What:** First migration includes `Currency.scale Int` (required), money fields as `BigInt`, FX rate as `BigInt` with app constant `RATE_SCALE_E8 = 100_000_000n`. No domain CRUD UI in Phase 1.

**When to use:** D-07–D-09 before any later phase writes money.

### Anti-Patterns to Avoid

- **DB path inside image layer / wrong mount:** Writing `/app/*.db` while mounting `./data` elsewhere → silent data loss on recreate `[CITED: .planning/research/PITFALLS.md]`.
- **Float / Prisma `Float` for money or rates:** Corrupts NW trust `[VERIFIED: CONTEXT D-07/D-09]`.
- **Prisma `Int` for rate×10^8:** `100 * 10^8` already exceeds Int32 max — use **`BigInt`** (still SQLite INTEGER) `[CITED: prisma SQLite type mappings; arithmetic]`.
- **`prisma@latest` (v8 RC) or mismatched CLI/client:** Breaks generate/migrate.
- **Alpine + better-sqlite3 without care:** Conflicts with D-05; musl pain.
- **Health = process up only:** Must prove DB reachable **and** migrated.
- **Migrate at image build against empty path:** Migrations must run at **container start** against the mounted volume (D-02).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Minimal Next Docker image | Custom node server bundler | `output: 'standalone'` + official with-docker pattern | NFT tracing already solved |
| SQLite access in Next | Raw `sqlite3` C API wrappers | Prisma 7 + `@prisma/adapter-better-sqlite3` | Locked ORM; migrations included |
| UI primitives | Custom Button/Card from scratch | shadcn/ui | Locked D-04 |
| Money float math | IEEE `number` columns | `BigInt` minor units + `scale` | D-07–D-09 |
| Ad-hoc migrate scripts | Hand-written SQL apply | `prisma migrate deploy` | Idempotent migration history |
| Second DB sidecar | Extra container for SQLite | Same process + volume | D-02 single writer |

**Key insight:** Hardest Phase 1 engineering is **getting Prisma migrate + better-sqlite3 into the standalone runner**, not the ready page. Plan explicit Dockerfile/tracing tasks for that seam.

## Common Pitfalls

### Pitfall 1: Standalone image missing Prisma CLI / migrations / native addon

**What goes wrong:** `migrate deploy` fails at start; or Client cannot load `better-sqlite3`.
**Why it happens:** Standalone NFT does not include unused CLI; native addon not traced; `prisma/` not copied.
**How to avoid:** Import adapter from `lib/db.ts` so NFT sees it; set `outputFileTracingIncludes` for prisma packages; copy `prisma/`, `prisma.config.ts`, and any required CLI bits; verify in CI/`docker compose` smoke.
**Warning signs:** `Cannot find module 'better-sqlite3'`, `prisma: not found`, empty migrations folder in container.

### Pitfall 2: Volume / UID permissions on `/data`

**What goes wrong:** Cannot create DB or `-wal`/`-shm`.
**Why it happens:** Container runs as `node` (uid 1000) but host `./data` owned differently or not writable.
**How to avoid:** `mkdir -p data` with mode allowing container user; document `chown`; entrypoint fails loudly if `/data` not writable.
**Warning signs:** `SQLITE_CANTOPEN`, read-only DB errors.

### Pitfall 3: WAL on unsupported filesystem

**What goes wrong:** Corruption / lock errors on virtiofs/NFS.
**Why it happens:** WAL needs same-host shared memory `[CITED: sqlite.org/wal.html]`.
**How to avoid:** Default WAL on this Linux btrfs host; document DELETE fallback; smoke `PRAGMA integrity_check` after persist test.
**Warning signs:** `database disk image is malformed`, frequent `SQLITE_BUSY`.

### Pitfall 4: Prisma 7 config / generate surprises

**What goes wrong:** Build fails — missing `output`, URL still in schema, client imported from `@prisma/client` default.
**Why it happens:** Prisma 7 breaking changes `[CITED: prisma.io/docs/guides/upgrade-prisma-orm/v7]`.
**How to avoid:** Follow v7 generator (`provider = "prisma-client"`, required `output`); `prisma.config.ts` for URL; explicit `prisma generate` in Docker build (migrate no longer auto-generates).
**Warning signs:** Deprecation errors on `url` in schema; empty `node_modules/.prisma`.

### Pitfall 5: Health passes before migrate finishes

**What goes wrong:** Compose marks healthy while schema missing.
**Why it happens:** Healthcheck hits TCP/port or static page only.
**How to avoid:** Entrypoint blocks on migrate; health queries migrated schema; Compose `start_period` generous for first migrate.
**Warning signs:** UI loads but later phases crash on missing tables.

## Code Examples

### next.config standalone + Prisma tracing

```typescript
// Source: Next.js output file tracing + community Prisma standalone pattern
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

### Schema stub (money conventions)

```prisma
// Discrete values for planner/executor — money/rate as BigInt → SQLite INTEGER
// RATE_SCALE_E8 application constant = 100000000 (rate * 10^8)

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

> Stub table names may be replaced by real Phase 2–4 models **if** column types/semantics stay identical; do not introduce `Float` money columns later.

### Health Route Handler

```typescript
// Source: Next.js App Router Route Handler convention
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

### Compose fragment

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

### Entrypoint

```sh
#!/bin/sh
set -e
npx prisma migrate deploy
exec node server.js
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hono + Vite + Drizzle (project research) | Next.js + Prisma + shadcn (CONTEXT) | 2026-09-02 discuss-phase | All Phase 1 plans follow CONTEXT |
| Prisma 6 URL in schema + implicit engines | Prisma 7 `prisma.config.ts` + driver adapters | Prisma 7 | Extra adapter + generate output path |
| Prisma CLI `latest` = stable | `latest` = 8 RC (research day) | 2026-09 | Pin 7.10.0 explicitly |
| TEXT decimal money (research option) | INTEGER/`BigInt` minor units + scale (CONTEXT) | 2026-09-02 | Schema stub must not use TEXT money |

**Deprecated/outdated for this phase:**

- Research default Hono/Drizzle stack — overridden.
- Alpine-first Next Docker blogs — conflict with D-05 + better-sqlite3.
- IEEE float money — forbidden.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Next.js default TS toolchain may prefer TS 5.x over TS 7.0.2 from STACK.md | Standard Stack | Pin conflict — resolve at scaffold |
| A2 | `outputFileTracingIncludes` paths above are sufficient for migrate CLI in runner | Architecture / Pitfalls | May need extra COPY of prisma CLI node_modules |
| A3 | Russian ready-page copy is preferred (“Кошелёк готов” / similar) | Discretion | UX only |
| A4 | `decimal.js` can wait until display/FX math phases | Supporting | Early UI may invent float formatting |
| A5 | Prisma generator default ESM works with Next 16 without `package.json` `"type":"module"` | Prisma 7 | May need `moduleFormat = "cjs"` if import errors |
| A6 | Stub model names can be temporary if column semantics preserved | Schema stub | Extra migration churn if renamed carelessly |

## Open Questions (RESOLVED)

1. **Standalone runner: minimal NFT vs ship prisma CLI deps**
   - What we know: Community copies `prisma/` + tracing includes; official Prisma Docker guide is not Next-standalone-specific.
   - What's unclear: Smallest reliable image layout for `migrate deploy` + better-sqlite3.
   - Recommendation: Plan a dedicated Docker smoke task; prefer slightly larger image over fragile partial copies.
   - RESOLVED (Plan 04): Prefer larger/safe COPY — ship `prisma/`, `prisma.config.ts`, `outputFileTracingIncludes`, and/or explicit Prisma CLI bits; prove with docker compose tracer + persist smoke, not minimal fragile NFT.

2. **Commit vs gitignore `src/generated/prisma`**
   - What we know: Prisma 7 requires custom output.
   - What's unclear: Team preference for committing generated client.
   - Recommendation: Generate in Docker build + local `postinstall`/`prisma generate`; gitignore generated output unless tooling forces commit.
   - RESOLVED (Plan 03): gitignore `src/generated/`; run `prisma generate` in Docker build and via postinstall or before local build.

3. **Exact ready-page Russian string**
   - Discretion — pick one phrase in plan and stick to it for UAT.
   - RESOLVED (Plan 04): «Кошелёк готов»

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Docker | Compose stack | ✓ | 29.5.3 | — |
| Docker Compose | PLAT-01 | ✓ | v5.1.4 | — |
| Node.js (host) | Local scaffold/tests | ✓ | v24.5.0 | Use container-only build |
| npm | Install | ✓ | 10.9.3 | — |
| Host FS for SQLite | WAL decision | ✓ | btrfs on `/` (native Linux) | Prefer WAL; DELETE if moved to virtiofs/NFS |
| codegraph | Project search rule | ✗ (not initialized) | — | Use rg/Read until `codegraph init` |
| ctx7 CLI | Docs lookup | ✗ | — | WebFetch / official URLs (used) |
| Graphify | Cross-doc graph | Disabled | — | Continue without graph |

**Missing dependencies with no fallback:** none for Phase 1 execution on this host.

**Missing dependencies with fallback:** codegraph (uninitialized), ctx7 (WebFetch used).

## Validation Architecture

> `workflow.nyquist_validation` is enabled in `.planning/config.json`.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.11 (to install — greenfield) |
| Config file | none yet — Wave 0 `vitest.config.ts` |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run` + Docker persist smoke script |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PLAT-01 | Schema has no Float money; BigInt money/rate; Currency.scale required | unit | `npx vitest run src/lib/money.test.ts` | ❌ Wave 0 |
| PLAT-01 | `RATE_SCALE_E8 === 100000000n` | unit | `npx vitest run src/lib/money.test.ts` | ❌ Wave 0 |
| PLAT-01 | `/api/health` 200 when DB migrated; 503 when DB missing | integration | `npx vitest run` (mocked prisma) and/or compose smoke | ❌ Wave 0 |
| PLAT-01 | Data survives `docker compose down && up` | smoke | `./scripts/smoke-persist.sh` | ❌ Wave 0 |
| PLAT-01 | UI ready page loads | smoke/manual | `curl -f http://127.0.0.1:3000/` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run`
- **Per wave merge:** `npx vitest run` + Docker build/smoke when Docker files changed
- **Phase gate:** Full suite green + persist smoke before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `vitest.config.ts` + `npm` test script
- [ ] `src/lib/money.test.ts` — RATE_SCALE_E8 + schema convention assertions
- [ ] `scripts/smoke-persist.sh` — compose up, write marker row or touch via API, down/up, assert DB file + health 200
- [ ] Framework install: `npm install -D vitest`

## Security Domain

> `security_enforcement` enabled (ASVS level 1).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Single local user — no auth in v1 |
| V3 Session Management | no | — |
| V4 Access Control | partial | Bind publish to `127.0.0.1`; no LAN exposure by default |
| V5 Input Validation | yes | Zod on any env/query inputs; health is read-only |
| V6 Cryptography | no | No app-level crypto beyond TLS-less local HTTP |

### Known Threat Patterns for Next + SQLite Docker

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| LAN exposure of finance UI | Information Disclosure | Compose `127.0.0.1:3000:3000` |
| World-readable host DB | Information Disclosure | `chmod 700 data/`; document perms |
| Path traversal via DB path env | Tampering | Fixed `file:/data/wallet.db` in Compose; do not take raw user path |
| Supply-chain RC packages | Tampering | Pin Prisma 7.10.0; legitimacy checkpoints |
| Running container as root | Elevation | `USER node` in runner |
| Demo DB baked into image | Tampering / Spoofing | Empty volume + migrate on start only |

## Sources

### Primary (HIGH confidence)

- CONTEXT.md / REQUIREMENTS.md / ROADMAP.md — locked decisions & PLAT-01
- [Next.js with-docker Dockerfile](https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile) — standalone multi-stage, Node 24, `HOSTNAME=0.0.0.0`
- [Prisma Docker guide](https://www.prisma.io/docs/guides/deployment/docker) — Prisma 7.10.0 pins, `prisma.config.ts`, migrate on start, Debian slim openssl note
- [Prisma 7 SQLite](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/sqlite) — adapter + `file:` URL
- [Upgrade to Prisma ORM 7](https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7) — adapters, config, generate changes
- [sqlite.org WAL](https://www.sqlite.org/wal.html) — network FS shared-memory constraint
- [shadcn Next install](https://ui.shadcn.com/docs/installation/next) — init/add flow
- npm registry — versions verified 2026-09-02
- Host probes — Docker/Node/btrfs availability

### Secondary (MEDIUM confidence)

- Next.js deploying docs — Docker templates index
- Prisma GitHub discussions / gists — standalone + `migrate deploy` packaging
- `.planning/research/*` — pitfalls & volume layout (stack overridden by CONTEXT)

### Tertiary (LOW confidence)

- Third-party “self-host Next Docker 2026” articles — corroborate standalone copy steps only

## Metadata

**Confidence breakdown:**

- Standard stack: **HIGH** — npm pins + official Prisma/Next docs; CONTEXT locks framework/ORM
- Architecture: **HIGH** for app topology; **MEDIUM** for exact standalone+migrate file set
- Pitfalls: **HIGH** — SQLite Docker/WAL + Prisma 7 footguns well documented

**Research date:** 2026-09-02  
**Valid until:** ~2026-10-02 (Prisma majors moving fast — re-check `prisma` dist-tags before execute if delayed)
