<!-- GSD:project-start source:PROJECT.md -->

## Project

**Wallet**

A local, single-user personal finance site for tracking net worth across accounts (fiat debit, fiat credit, crypto USDT, cash). Runs in Docker with SQLite on the host; no cloud accounts. v1 focuses on account balances, multi-currency conversion to a primary currency, and historical net-worth charts — not budgeting or transaction categorization yet.

**Core Value:** At any moment, see true net worth (assets minus credit-card debt) in the primary currency and in each account's original currency, with history you can trust over time.

### Constraints

- **Runtime**: Dockerized web app — must run as a local container
- **Data**: SQLite only, stored locally on host — no external DB
- **Users**: Single user, local — no multi-tenant or SaaS
- **FX v1**: Manual dated rates, primary ↔ other only
- **Balances v1**: Manual dated snapshots, not double-entry ledger

<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->

## Technology Stack

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| Node.js | **24.x Active LTS** (Docker: `node:24-bookworm`) | Runtime | Active LTS as of 2026-09 (Krypton); Maintenance LTS 22.x also fine. Avoid Current 26 for Docker base until LTS. | HIGH |
| TypeScript | **7.x** (`typescript@7.0.2`) | Language | Type-safe domain math (FX, money) and shared Zod schemas end-to-end. | HIGH |
| Hono | **4.13.x** (`hono@4.13.5`) | HTTP API | Tiny Node server; serves static SPA + JSON from one process/port. Fits local Docker better than Next.js App Router (no SSR/SEO need). | MEDIUM |
| `@hono/node-server` | **2.1.x** (`@hono/node-server@2.1.1`) | Node adapter | Official Node listener for Hono; simple `serve()` entrypoint for Docker `CMD`. | HIGH |
| Vite | **8.2.x** (`vite@8.2.2`) | Frontend build | Fast SPA build; prod assets copied into image and served by Hono. | HIGH |
| React | **19.2.x** (`react@19.2.8`) | UI | Dominant chart/form ecosystem; Russian UI + Recharts/TanStack Query mature. | HIGH |
| React Router | **8.x** (`react-router@8.3.1`) | Client routing | SPA routes (dashboard, accounts, FX, charts) without Next.js. Pick library or framework mode and stay consistent. | HIGH |
| Drizzle ORM | **0.45.x** (`drizzle-orm@0.45.2`) | SQLite access | Type-safe schema + SQL migrations; first-class `better-sqlite3` / libsql / `node:sqlite`. Lighter than Prisma for local file DB. | HIGH |
| drizzle-kit | **0.31.x** (`drizzle-kit@0.31.10`) | Migrations | `generate` in dev; `migrate` at container start. Keep as **production** dependency (or ship a small migrate script) so Docker entrypoint can migrate. | HIGH |
| better-sqlite3 | **13.x** (`better-sqlite3@13.0.3`) | SQLite driver | Fast sync driver; ideal for single-writer local app. Enable `journal_mode = WAL`. Prefer over async `sqlite3`. | HIGH |
| Zod | **4.x** (`zod@4.5.4`) | Validation | Shared request/domain schemas; pair with `@hono/zod-validator`. | HIGH |
| Docker Compose | Compose v2 | Orchestration | One `web` service + bind-mount `./data:/data` for SQLite persistence. | HIGH |

### Supporting Libraries

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| decimal.js | **10.6.x** (`decimal.js@10.6.0`) | Money & FX arithmetic | **Always** — never use IEEE floats for balances/rates. | HIGH |
| Recharts | **3.10.x** (`recharts@3.10.1`) | Balance / net-worth history charts | Sparse snapshot series (tens–hundreds of points). Declarative JSX; enough for v1 line charts. | MEDIUM |
| `@tanstack/react-query` | **5.x** (`@tanstack/react-query@5.102.8`) | Client data cache | Account/snapshot/FX mutations + chart refetch. | HIGH |
| date-fns | **4.x** (`date-fns@4.4.0`) | Calendar dates (as-of, chart axes) | Date-only semantics without timezone footguns; format for `ru` locale. | HIGH |
| i18next + react-i18next | **26.x / 17.x** (`i18next@26.4.1`, `react-i18next@17.0.13`) | Russian-first UI | Default `lng: 'ru'`; keep English keys optional. Skip if you hardcode Russian strings for a personal v1. | MEDIUM |
| Tailwind CSS | **4.x** (`tailwindcss@4.3.3`) | Styling | Fast local UI without a design-system project. | HIGH |
| `@hono/zod-validator` | **0.9.x** | Route validation | Validate bodies/queries at API boundary. | MEDIUM |
| dotenv | **17.x** | Config | `DATABASE_PATH=/data/wallet.db` etc. | HIGH |
| lucide-react | **0.5xx+** (current major churn) | Icons | Optional UI polish. | LOW (version floats often) |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Vitest **4.x** (`vitest@4.1.11`) | Unit/integration tests | Test FX as-of lookup + net-worth pure functions first (highest bug density). |
| tsx | Run TS scripts | Dev migrate/seed without compile. |
| `@types/better-sqlite3` | Types | Dev dependency. |
| ESLint + Prettier (or Biome) | Lint/format | Team preference; not domain-critical. |
| multi-stage Dockerfile | Image size + native build | **Build stage:** `python3`, `make`, `g++` for better-sqlite3. **Runtime:** `node:24-bookworm-slim`, non-root user, `VOLUME`/`bind` on `/data`. Avoid Alpine unless you accept musl rebuild pain. |

## Installation

# Core runtime / API / DB

# Keep migrate tooling available in the container

# Frontend

# Dev

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Hono + Vite SPA | **Next.js 16.x** (`next@16.3.4`) standalone | Team already lives in Next; wants RSC/file routing. Still viable with `output: 'standalone'` + volume for SQLite — heavier for a single-user local tool. |
| Hono + Vite SPA | **SvelteKit** | Prefer Svelte; excellent for local apps. Charts ecosystem thinner than React. |
| Hono + Vite SPA | **TanStack Start + Drizzle + libsql** | Want newer fullstack Vite meta-framework; docs already show Docker+SQLite+migrate-on-start. Slightly less battle-scarred than Hono templates. |
| better-sqlite3 | **@libsql/client** (file: URL) | Prefer official Drizzle get-started path or future remote replica; adds little for pure local file. |
| better-sqlite3 | **node:sqlite** (built-in) | Want zero native addon; confirm Node 24 stability for your image before betting the store on it. |
| Drizzle | **Prisma** | Team insists on Prisma Client UX; expect heavier generate step and historically more SQLite friction. |
| Recharts | **react-chartjs-2 + Chart.js 4.x** | Expect thousands of points or need canvas performance; overkill for periodic manual snapshots. |
| decimal.js | **big.js** | Want smaller API surface; decimal.js is the safer default for money. |
| decimal.js | **dinero.js v2** | Avoid for v1 — npm still shows `2.0.0-alpha.*`. |
| i18next | Hardcoded Russian strings | Personal-only tool and you accept rewrite if language ever changes. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| IEEE `number` / float columns for money or FX | Rounding errors corrupt net worth and chart trust | `TEXT` decimal strings + `decimal.js`, or `INTEGER` minor units + per-currency `scale` |
| PostgreSQL / MySQL / cloud DB | Violates local SQLite constraint; ops overhead | SQLite file on host volume |
| Prisma Migrate as default | Extra generate/engine weight for a single-file app | Drizzle schema + SQL migrations |
| Full double-entry libraries / Beancount / Firefly-style ledger core | v1 is balance snapshots, not transactions | Snapshot + dated FX tables |
| NextAuth / Better Auth / OAuth | Single local user; no cloud auth in v1 | No auth (bind localhost / Docker network only) |
| Auto FX APIs (CBR, exchangerate.host, etc.) | Out of scope for v1; breaks “manual dated rates” | Manual `fx_rates` rows |
| Electron / Tauri | User wants Dockerized web app | Browser → container HTTP |
| Alpine Node images without care | better-sqlite3 native builds fail or need rebuilds | `node:24-bookworm` (+ slim runtime) |
| Trading chart stacks (Lightweight Charts, react-financial-charts) | Built for OHLC/candles, not sparse NW lines | Recharts line charts |
| Bun as primary Docker runtime (v1) | Native addon + image story clearer on Node LTS | Node 24; revisit Bun later if desired |

## Stack Patterns by Variant

- Use Hono to serve `dist/` static files and `/api/*`.
- One compose service, port `3000:3000`, volume `./data:/data`.
- Because: matches single-user local ops and sync SQLite.
- Use Next.js with `output: 'standalone'`, Drizzle, better-sqlite3 (or libsql file), migrate on start.
- Because: fewer moving parts for Next-experienced builders; accept larger image and SSR complexity you may not need.
- Prefer `INTEGER` minor units + `currencies.scale`.
- Because: exact integer math in SQL; still use decimal.js at boundaries.
- Prefer `TEXT` amounts + decimal.js everywhere.
- Because: no wrong scale assumption; Drizzle `numeric()` / text mode maps cleanly.

## Docker + SQLite conventions (bind to this stack)

| Concern | Recommendation |
|---------|----------------|
| DB path | `DATABASE_PATH=/data/wallet.db` (env) |
| Persistence | Compose bind-mount `./data:/data` (host-visible, easy backup) |
| PRAGMAs | `journal_mode=WAL`, `foreign_keys=ON`, `busy_timeout=5000` |
| Migrations | Entrypoint: `drizzle-kit migrate` (or `tsx src/db/migrate.ts`) then `node dist/server.js` |
| Native addon | Compile better-sqlite3 in Debian build stage; copy `node_modules` or rebuild in runner |
| Backups | Copy/rsync `./data/`; optional Litestream later — not required for v1 |

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `drizzle-orm@0.45.x` | `drizzle-kit@0.31.x` | Keep major/minor pair in sync; do not mix ancient kit with new ORM. |
| `drizzle-orm` better-sqlite3 driver | `better-sqlite3@13.x` | Sync API: **do not** `async` inside `db.transaction()` callbacks. |
| `hono@4.x` | `@hono/node-server@2.1.x`, `@hono/zod-validator@0.9.x` | Node adapter required for Docker long-running process. |
| `react@19.x` | `recharts@3.x`, `@tanstack/react-query@5.x`, `react-router@8.x` | Verified current majors on npm 2026-09-02. |
| `vite@8.x` | `@vitejs/plugin-react@6.1.x` | Match Vite major to plugin major. |
| `typescript@7.x` | `vitest@4.x`, project `moduleResolution` bundler/nodenext | New TS major — pin and confirm Vite/ESLint plugins support it early. |
| Node **24** image | `better-sqlite3@13` | Use matching glibc image (bookworm); test arm64 if host is Apple Silicon → Linux VM. |
| `zod@4.x` | Hono zod-validator 0.9.x | Zod 4 is current; avoid mixing Zod 3 types in shared schemas. |

## Money & FX storage (stack implication)

| Choice | Stack mapping |
|--------|----------------|
| Amounts | `TEXT` (decimal string) **or** `INTEGER` minor units — pick one project-wide |
| Rates | `TEXT`/`NUMERIC`-as-text: units of **primary per 1 unit of other** (document direction once) |
| As-of | ISO date (`YYYY-MM-DD`) columns; resolve with `MAX(as_of) WHERE as_of <= :d` |
| Math library | `decimal.js` in domain services before chart serialization |

## Sources

- npm registry (`npm view … version`) — versions verified **2026-09-02** — confidence **HIGH**
- [Node.js release schedule](https://github.com/nodejs/Release) — Node 24 Active LTS — confidence **HIGH**
- [Drizzle SQLite get started](https://orm.drizzle.team/docs/get-started/sqlite-new) — drivers, migrate/push — confidence **MEDIUM** (docs also advertise `@rc` in places; stable **0.45.2** used from npm)
- [better-sqlite3](https://www.npmjs.com/package/better-sqlite3) / WiseLibs docs — WAL, sync API — confidence **HIGH**
- Ecosystem templates (Hono+Vite+Drizzle+SQLite starters; Next/TanStack+SQLite Docker guides) — confidence **MEDIUM**
- Chart comparisons (Recharts vs Chart.js for time series) — Recharts for sparse NW data — confidence **MEDIUM**
- Money storage consensus (no floats; integer minor units or decimal strings) — confidence **HIGH**

<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
