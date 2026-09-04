# Phase 1: Docker + SQLite Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-02
**Phase:** 1-Docker + SQLite Foundation
**Areas discussed:** Runtime shape, Money column type

---

## Runtime shape

| Option | Description | Selected |
|--------|-------------|----------|
| Hono + Vite SPA (research) | One Node process API + static dist; one Compose service | |
| Next.js standalone | App Router, output standalone in Docker | ✓ |
| You decide | Follow research unless blocker | |

**User's choice:** Next.js standalone
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Route Handlers / Server Actions only | Drizzle/Prisma in server code; migrate in entrypoint | ✓ |
| Separate lightweight worker process | Second process for DB migrate/health | |
| You decide | Prefer one Compose service | |

**User's choice:** Route Handlers / Server Actions only
**Notes:** Later clarified ORM = Prisma (not Drizzle).

| Option | Description | Selected |
|--------|-------------|----------|
| Multi-stage bookworm | Build native deps + next build; bookworm-slim runtime | ✓ |
| Alpine | Smaller; musl friction for native addons | |
| You decide | Prefer bookworm | |

**User's choice:** Multi-stage bookworm
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal ready page | Wallet OK + health DB migrated | ✓ |
| Bare Next default only | Health API enough | |
| You decide | Smallest page proving UI + DB | |

**User's choice:** Minimal ready page
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| (freeform) | Prisma ORM; shadcn/ui | ✓ |

**User's choice:** Use Prisma instead of Drizzle; shadcn/ui as UI lib
**Notes:** User freeform mid-area; replaces research Drizzle recommendation.

---

## Money column type

| Option | Description | Selected |
|--------|-------------|----------|
| TEXT + decimal.js | Store decimal strings; Prisma String | |
| INTEGER minor units | Cents-like ints + currencies.scale | ✓ |
| You decide | Prefer TEXT unless SQL aggregations needed | |

**User's choice:** INTEGER minor units
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Required on currency create | User sets scale; no default guess | ✓ |
| Default 2, editable | ISO-like; crypto must raise scale | |
| You decide | Default 2 + UI hint for crypto | |

**User's choice:** Required on currency create
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| TEXT + decimal.js for rates only | Hybrid balances INTEGER / rates TEXT | |
| Fixed-scale INTEGER for rates too | One storage style; fixed rate scale | ✓ |
| You decide | Prefer hybrid | |

**User's choice:** Fixed-scale INTEGER for rates
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| 10^8 | Common FX/crypto convention | ✓ |
| 10^12 | More headroom | |
| You decide | Prefer 10^8 | |

**User's choice:** 10^8
**Notes:** —

---

## Claude's Discretion

- Host bind path (`./data:/data` default)
- SQLite journal_mode (WAL preferred; DELETE if FS unsafe)
- Exact health route and ready-page copy language details

## Deferred Ideas

None

## Skipped gray areas (not discussed)

- Host data path
- SQLite journal / FS safety
