# Phase 3: Dated Balance Snapshots - Context

**Gathered:** 2026-09-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver dated account balance snapshots with LOCF reads (BAL-01, BAL-02). User sets balances as of a chosen date (including past dates; future dates forbidden). As-of date D returns the latest snapshot with date ≤ D. Days before an account’s first snapshot show no invented zero. Credit outstanding debt is derived from credit-account snapshots: user enters remaining available credit; debt = creditLimit − available (Phase 2 D-09). No FX rates, net-worth totals, or charts in this phase.

</domain>

<decisions>
## Implementation Decisions

### Entry surface
- **D-01:** Set balance via **Dialog on the accounts list** (per-row action → amount + as-of date). No dedicated `/balances` route and no `/accounts/[id]` page in this phase. — **Reversibility:** reversible — routing can be added later without changing the snapshot model.
- **D-02:** Account row shows **current LOCF balance** (as of today) **plus the as-of date** of the snapshot that produced it.
- **D-03:** Default as-of date in the dialog is **today**.
- **D-04:** When an account has **no snapshots yet**, show an emphasized CTA **«Задать первый баланс»** (not a plain empty/dash row).

### Credit debt semantics (FIAT_CREDIT)
- **D-05:** For credit accounts, the user enters **remaining available credit** (how much of the limit is left), not outstanding debt and not a signed balance. Example: limit 5000, enter 3000 → debt 2000. — **Reversibility:** one-way — storage and UI labels assume “available”; flipping to debt-first needs a data migration and copy rewrite.
- **D-06:** Persist **available (remaining)** in the snapshot row; **debt is always derived** as `creditLimitMinor − availableMinor` on read. Never store debt as a second money field.
- **D-07:** Validate strictly: **0 ≤ available ≤ credit limit**.
- **D-08:** Credit account list row shows **both available and debt** plus snapshot date. Non-credit rows show native balance + date (D-02).

### Same-date rules & history mutation
- **D-09:** At most **one snapshot per (account, asOfDate)** — a new set for the same date **overwrites**. — **Reversibility:** costly — uniqueness is the LOCF contract; relaxing it breaks as-of reads.
- **D-10:** Past snapshots may be **overwritten** (via set-balance with that date) and **deleted**.
- **D-11:** **Delete UI lives only in the per-account snapshot history list** — not inside the set-balance dialog.
- **D-12:** **Future as-of dates are forbidden** — today and past only.

### List vs history display
- **D-13:** Snapshot history opens by **expanding the account row** (inline under the account). Not a separate Sheet/Dialog-only history surface.
- **D-14:** History ordered **newest first** (date descending).
- **D-15:** Non-credit history rows: **date + amount** only (no “current” marker).
- **D-16:** Credit history rows: **date + available** only (debt not repeated in history lines; list header already shows both per D-08).

### Claude's Discretion
- Exact Prisma model naming (replace `BalanceAmountStub`), unique constraint shape, Server Action error copy wording, expand/collapse affordance details, and LOCF query helper placement — choose standard Next.js + Prisma + shadcn patterns consistent with Phases 1–2.
- Money input UX reuses/extends `src/lib/money.ts` (`parseMajorToMinor` / `formatMinorToMajor`) with currency scale from the account’s locked currency.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope
- `.planning/PROJECT.md` — snapshot-first balances (not ledger); Russian-first UI; credit limit + debt mental model
- `.planning/REQUIREMENTS.md` — **BAL-01**, **BAL-02** (Phase 3); note **BAL-03** copy-forward is v2
- `.planning/ROADMAP.md` — Phase 3 goal and success criteria
- `.planning/STATE.md` — Phase 1–2 money/UI contracts already locked

### Prior phase decisions
- `.planning/phases/01-docker-sqlite-foundation/01-CONTEXT.md` — INTEGER minor units; required `Currency.scale`; Next + Prisma + shadcn; Server Actions
- `.planning/phases/02-currencies-accounts/02-CONTEXT.md` — accounts/currencies UI; **D-09** debt via Phase 3 snapshots; Dialog CRUD; Russian chrome; credit limit metadata only

### Existing schema / code
- `prisma/schema.prisma` — `BalanceAmountStub`, `FxRateStub.asOfDate` (`YYYY-MM-DD`), `Account` + `creditLimitMinor`
- `src/lib/money.ts` — `parseMajorToMinor` / `formatMinorToMajor`
- `src/app/accounts/page.tsx` — accounts list host for balance UI
- `src/components/accounts/AccountList.tsx` — row UI to extend with balance + expandable history
- `src/components/accounts/AccountFormDialog.tsx` — Dialog/form pattern to mirror for set-balance

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AccountList` / `AccountFormDialog` — extend list rows + Dialog pattern for set-balance
- `src/lib/money.ts` — parse/format minor units with currency scale
- `Account.creditLimitMinor` — required for credit available validation and debt derivation
- `BalanceAmountStub` — replace with real dated balance model (account FK + asOfDate + amountMinor)

### Established Patterns
- App Router + Server Components; mutations via Server Actions
- BigInt money serialized as string across RSC → client boundary
- Russian UI labels; Dialog create/edit on list pages (no separate create routes)
- `asOfDate` as `YYYY-MM-DD` string (already on FxRateStub)

### Integration Points
- Extend `/accounts` list — current LOCF + date, set-balance Dialog, expandable history + delete
- Prisma migrate: real balance snapshot table + unique (accountId, asOfDate); remove/replace stub
- LOCF read helper used by list “current” display and later phases (FX/NW/charts)

</code_context>

<specifics>
## Specific Ideas

- Credit mental model (user): enter **остаток лимита**, not «сколько должен». Example: limit 5000, enter 3000 → debt 2000.
- First-balance empty state CTA copy: **«Задать первый баланс»**.
- Discussion language for questions: Russian (UI already Russian-first).

</specifics>

<deferred>
## Deferred Ideas

- **BAL-03** copy-forward / confirm unchanged — v2 (REQUIREMENTS.md)
- Dedicated `/balances` page or per-account detail route — not chosen for v1 Phase 3
- Available-credit as NW dashboard concept (**ACCT-03**) — Phase 5 (list already shows available+debt for credit in Phase 3 per D-08; full NW math still Phase 5)
- FX, net worth totals, charts — Phases 4–6

</deferred>

---

*Phase: 3-Dated Balance Snapshots*
*Context gathered: 2026-09-03*
