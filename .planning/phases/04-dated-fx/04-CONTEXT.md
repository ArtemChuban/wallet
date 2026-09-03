# Phase 4: Dated FX - Context

**Gathered:** 2026-09-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver manual dated exchange rates between the primary currency and every other currency, with forward-effective LOCF reads (FX-01, FX-02). User sets a rate as of a chosen date; conversion as of date D uses the latest rate with effective date ≤ D. Only primary ↔ other pairs (no arbitrary cross pairs). Rate changes apply forward from their date without rewriting earlier as-of conversions. Phase 4 ships rate CRUD UI plus a LOCF rate helper for later phases — not net-worth totals, charts, or API-fetched rates.

</domain>

<decisions>
## Implementation Decisions

### Entry surface (inside Currencies)
- **D-01:** FX UI lives **inside Currencies**, not a separate top-level `/fx` nav item. — **Reversibility:** reversible — a dedicated nav link can be added later without changing the rate model.
- **D-02:** Currencies area uses **tabs**: «Валюты» | «Курсы».
- **D-03:** Default landing for the currencies area opens **«Курсы»** (rates-first for this phase’s workflow).
- **D-04:** URL paths: **`/currencies`** = currency list tab; **`/currencies/rates`** = rates tab. — **Reversibility:** costly — path is the shareable contract for nav and bookmarks; changing it needs redirects.

### Rate entry
- **D-05:** Set-rate Dialog includes a **direction toggle**. Storage always persists **`rateToPrimaryScaled`** (primary units per 1 unit of other × 10⁸, Phase 1 D-09 / stub). Inverse UI input is converted before write.
- **D-06:** Default direction on open: **«1 other = N primary»** (matches storage).
- **D-07:** Other-currency picker lists **all non-primary currencies** (even with zero accounts).
- **D-08:** Default as-of date = **today** in **Europe/Moscow**; **future dates forbidden** (mirror Phase 3 D-12).
- **D-09:** Entered/stored rate must be **> 0**; zero and negative rejected with Russian error copy.

### List vs history
- **D-10:** Rates tab lists **one row per non-primary currency** showing **current LOCF rate** (as of today) **plus the as-of date** of the rate that produced it; history opens by **expanding the row** (same pattern as account balance history). — **Reversibility:** reversible — layout can change without touching uniqueness.
- **D-11:** At most **one rate per (currencyCode, asOfDate)** — same-date set **upserts/overwrites**. — **Reversibility:** costly — uniqueness is the LOCF contract; relaxing it breaks as-of reads.
- **D-12:** Past rates may be **overwritten** (set with that date) and **deleted**.
- **D-13:** **Delete UI lives only in the expand history list** — not inside the set-rate Dialog (mirror Phase 3 D-11).
- **D-14:** Currency with **no rates yet** shows **«Нет курса»** plus a set-rate action (not a silent blank row).

### Missing rate / convert semantics
- **D-15:** `getRateAsOf(currencyCode, D)` returns **`null`** when no rate has `asOfDate ≤ D` — never invent `0` or `1` for a non-primary currency (parallel to BAL-02). — **Reversibility:** one-way — callers (Phase 5–6) must handle null; inventing a default later would rewrite historical honesty.
- **D-16:** **Primary → primary** conversion is always **identity (×1)** with **no FX row** stored for the primary currency against itself.
- **D-17:** Phase 4 UI is **rate CRUD + LOCF helper only** — **no** amount convert/preview calculator on the rates tab. Amount × rate UI belongs to Phase 5 (net worth). Prove LOCF/convert math in unit tests on the helper.

### Claude's Discretion
- Rename/replace `FxRateStub` with the real Prisma model; unique constraint shape `(currencyCode, asOfDate)`; Server Action / Zod wiring; Russian chrome labels for tabs/dialog/errors; expand/collapse affordance; rate parse/format helpers next to `RATE_SCALE_E8` in `src/lib/money.ts` (or sibling module) — choose standard Next.js + Prisma + shadcn patterns consistent with Phases 1–3.
- History ordering newest-first (mirror Phase 3 D-14) unless a strong reason appears during planning.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope
- `.planning/PROJECT.md` — manual dated FX, primary ↔ other only; Russian-first UI
- `.planning/REQUIREMENTS.md` — **FX-01**, **FX-02** (Phase 4); note **FX-03** API fetch is v2; out of scope: automatic live FX, arbitrary non-primary pairs
- `.planning/ROADMAP.md` — Phase 4 success criteria (dated rate, LOCF ≤ D, primary↔other only, forward-effective)
- `.planning/STATE.md` — Phase 1–3 money/UI/LOCF contracts already locked

### Prior phase decisions
- `.planning/phases/01-docker-sqlite-foundation/01-CONTEXT.md` — INTEGER money; **rate × 10⁸** (D-09); Next.js + Prisma + shadcn; Server Actions
- `.planning/phases/02-currencies-accounts/02-CONTEXT.md` — seeded primary RUB forever; Dialog CRUD; Russian chrome; currency codes Latin
- `.planning/phases/03-dated-balance-snapshots/03-CONTEXT.md` — LOCF null-before-first; upsert same date; delete only in history; no future dates; DD.MM.YYYY display; Europe/Moscow today

### Existing schema / code
- `prisma/schema.prisma` — `FxRateStub { currencyCode, asOfDate, rateToPrimaryScaled }`; replace stub with real model + unique
- `src/lib/money.ts` — `RATE_SCALE_E8`; extend with rate parse/format
- `src/lib/balances.ts` — LOCF pattern (`getBalanceAsOf`) to mirror for rates
- `src/components/nav.tsx` — currencies link; rates nested under `/currencies/rates` (no new top-level item)
- `src/app/currencies/` — host for list + rates tab routes
- `src/components/accounts/AccountList.tsx` / `SetBalanceDialog.tsx` — expand-history + Dialog patterns to reuse for rates

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `RATE_SCALE_E8` / money helpers — rate storage and decimal input at fixed scale 10⁸
- `getBalanceAsOf` / calendar today helpers — LOCF query shape and Moscow calendar date
- Account list expand + SetBalanceDialog — UX template for per-currency rate rows and set-rate Dialog
- Currency list / Dialog — Currencies area already Russian Dialog CRUD

### Established Patterns
- Server Actions + Zod validation; Russian error strings
- Upsert on compound unique key; revalidatePath after mutations
- DD.MM.YYYY display with hidden YYYY-MM-DD ISO field
- Nav: top-level «Валюты» stays; rates are a child path, not a fourth top-level link

### Integration Points
- Replace `FxRateStub` via Prisma migrate; enforce unique `(currencyCode, asOfDate)` and FK/check that currency is non-primary
- Add `/currencies/rates` route + tab chrome on currencies layout
- Export `getRateAsOf` (and optionally convert-minor helper returning null on missing rate) for Phase 5–6
- Primary currency never appears as an FX “other” row and never has self-rate rows

</code_context>

<specifics>
## Specific Ideas

- Discussion language for questions: Russian (UI already Russian-first).
- Rate direction toggle is UX only — persisted column remains `rateToPrimaryScaled`.
- Empty rate state copy: «Нет курса».

</specifics>

<deferred>
## Deferred Ideas

- **FX-03** optional API fetch + save as dated manual row — v2 (REQUIREMENTS.md)
- Amount convert / net-worth preview UI — Phase 5
- Historical charts using as-of FX — Phase 6
- Automatic live FX without dated rows — out of scope (REQUIREMENTS.md)
- Arbitrary non-primary FX pairs — out of scope for v1

</deferred>

---

*Phase: 4-Dated FX*
*Context gathered: 2026-09-03*
