# Phase 2: Currencies + Accounts - Context

**Gathered:** 2026-09-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver free-form currencies with exactly one primary, plus typed account CRUD (fiat debit, fiat credit, crypto, cash). Credit accounts store a required credit limit as metadata only. Outstanding debt is **not** a Phase 2 account field — it comes later as credit-account balance snapshots (Phase 3). Covers CURR-01, ACCT-01, ACCT-02 (limit portion). No dated balances, FX rates, net-worth math, or charts in this phase.

</domain>

<decisions>
## Implementation Decisions

### Primary currency
- **D-01:** Seed the primary currency in a Prisma migration: code `RUB`, name `Рубль`, scale `2`. — **Reversibility:** one-way — seed migration and “exactly one primary” are a data contract for later FX and NW.
- **D-02:** No primary switch in v1 — the seeded currency remains the only primary forever. — **Reversibility:** costly — adding switch later needs FX/history rules.
- **D-03:** Primary cannot be deleted (same as all currencies — see D-07).
- **D-04:** After seed, only the **name** is editable in the app; **code** and **scale** are immutable.

### Currency create & identity
- **D-05:** Currency codes are free short strings (uniqueness only) — not ISO-restricted. Users may use codes like `RUB`, `USDT`.
- **D-06:** Scale is a free integer **0–18** at create time (required; no guessed default — aligns with Phase 1 D-08).
- **D-07:** No currency delete for any currency (primary or secondary) in v1.
- **D-08:** After create, only **name** is editable; code and scale locked forever.

### Credit fields (Phase 2)
- **D-09:** Phase 2 stores **`creditLimit` only** on credit accounts. Outstanding debt is **not** stored on Account here — debt will be the credit account’s balance via Phase 3 dated snapshots. Credit limit is metadata only (never an asset in later NW math). — **Reversibility:** costly — splitting debt into Phase 3 balances is the NW/charts path; reversing would reintroduce dual sources of truth.
- **D-10:** Credit limit is **required** and must be **> 0** when account type is credit.
- **D-11:** Credit limit is **immutable after create** in v1 (future edit may be added later — see Deferred).
- **D-12:** Account **type** is locked after create.

### Accounts ↔ currency binding
- **D-13:** Every account has a required currency, locked forever after create. — **Reversibility:** one-way — changing currency after balances exist would corrupt history.
- **D-14:** No account delete in v1 (archive/close is ACCT-04 / later).
- **D-15:** After create, only account **name** is editable (type, currency, credit limit fixed).
- **D-16:** Account names are **globally unique**.

### UI / nav
- **D-17:** Two routes: `/currencies` and `/accounts`, with simple nav (Russian labels).
- **D-18:** List pages + create/edit via **Dialog/Sheet** (not separate create/edit routes).
- **D-19:** Keep `/` as the ready/status page; add nav links to Currencies and Accounts. Phase 5 will replace home with the NW dashboard later.
- **D-20:** All UI chrome in **Russian** (labels, errors, empty states, account-type names). Currency **codes** remain Latin identifiers as entered (e.g. RUB, USDT).

### Claude's Discretion
- Exact shadcn primitives (Dialog vs Sheet), nav layout (top vs side), form validation copy wording, Prisma field names/enums for account type, and how `isPrimary` (or equivalent) is represented given “seeded forever primary” — choose standard Next.js + Prisma + shadcn patterns consistent with Phase 1.
- Money input UX for credit limit (reuse/extend `src/lib/money.ts` helpers as needed).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope
- `.planning/PROJECT.md` — single-user local wallet; Russian-first; free-form currencies; credit limit + debt mental model
- `.planning/REQUIREMENTS.md` — **CURR-01**, **ACCT-01**, **ACCT-02** (Phase 2); note ACCT-03 / NW / balances are later phases
- `.planning/ROADMAP.md` — Phase 2 goal and success criteria
- `.planning/STATE.md` — Phase 1 money/FX contracts already locked

### Prior phase decisions
- `.planning/phases/01-docker-sqlite-foundation/01-CONTEXT.md` — Next.js + Prisma + shadcn; INTEGER minor units; required `Currency.scale`; Server Actions / Route Handlers; rate × 10^8

### Existing schema / code
- `prisma/schema.prisma` — stub `Currency { code, name, scale }`; no Account yet; FX/balance stubs for later phases
- `src/lib/money.ts` — `RATE_SCALE_E8` contract
- `src/app/layout.tsx` — `lang="ru"`
- `src/app/page.tsx` — Russian ready page to keep + extend with nav

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Currency` Prisma model stub (`code`, `name`, `scale`) — extend with primary designation; seed RUB in migration
- shadcn `Button` + base-nova setup (`components.json`) — add Dialog/Sheet and form controls as needed
- `src/lib/db.ts` Prisma client + SQLite pragmas
- `src/lib/money.ts` — extend for display/parse of minor units using currency scale

### Established Patterns
- App Router + Server Components; DB only via Route Handlers / Server Actions (Phase 1 D-02)
- Money as INTEGER/BigInt minor units; never float
- Russian ready copy already on home

### Integration Points
- New `/currencies` and `/accounts` routes under `src/app`
- Shared nav in root layout (or shell) linking from ready home
- Migrate: seed primary RUB; add Account model + creditLimit; primary flag/constraint
- Replace/extend stub schema carefully so Phase 3–4 stubs remain coherent

</code_context>

<specifics>
## Specific Ideas

- User: create primary currency **in migration**, then edit **name** from the app (code/scale stay fixed — revised from earlier “edit code and cents” idea).
- Seed exactly: **RUB / Рубль / scale 2**.
- UI fully Russian, but codes like **RUB**, **USDT** used as currency codes.
- Debt intentionally deferred to Phase 3 balance snapshots so there is one money path.

</specifics>

<deferred>
## Deferred Ideas

- Editable credit limit after create (possibly dated history) — post-v1 / later enhancement
- Account archive/close (**ACCT-04**) — v2 requirements
- Primary currency switch — not in v1
- Currency or account delete — not in v1
- Available-credit display (limit − debt) — **ACCT-03**, Phase 5
- Replace home ready page with NW dashboard — Phase 5

</deferred>

---

*Phase: 2-Currencies + Accounts*
*Context gathered: 2026-09-02*
