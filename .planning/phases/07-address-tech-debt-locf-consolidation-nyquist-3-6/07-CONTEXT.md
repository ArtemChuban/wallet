# Phase 7: Address tech debt: LOCF consolidation + Nyquist 3–6 - Context

**Gathered:** 2026-09-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Consolidate triplicate LOCF (Prisma single-row helpers unused in prod, page batch Maps, historical-series pure helpers) into one shared path with unchanged semantics, and close Nyquist for phases 3–6 by moving their `VALIDATION.md` from `draft` / NOT-VALIDATED to a validated state with evidence. No new user-facing features. LOCF contracts stay: null before first row (BAL-02 / FX D-15), unique as-of identity, batch reads for list/dashboard pages, charts keep event∪today + as-of balance × as-of FX (CHART-03).

</domain>

<decisions>
## Implementation Decisions

### Scope lock (user)
- **D-01:** User will default to «решай сам» for implementation gray areas — skip interactive discuss Q&A; researcher/planner choose concrete designs inside the boundary below. — **Reversibility:** reversible — can re-discuss later without code migration.
- **D-02:** Phase scope = **LOCF consolidation + Nyquist validate phases 3–6** only (roadmap title + audit highest-value items 1–2). Adjacent audit debt (nav «Валюты», PROJECT.md Active sync, optional Phase 1/2/3 smoke re-runs) stays **out of this phase** unless planner finds a zero-cost drive-by that does not expand plans. — **Reversibility:** reversible — fold extras in a later cleanup phase.

### LOCF semantics (locked from prior phases — not renegotiated)
- **D-03:** LOCF = latest row with `asOfDate ≤ D`; before first row return `null` — never invent `0` / `1` (BAL-02, FX D-15 / Phase 4).
- **D-04:** List and dashboard “current” reads stay **batch** (one `findMany` + Map / shared builder), not N× `get*AsOf` round-trips (Phase 3 batch preference).
- **D-05:** Chart series keep pure multi-date LOCF over prefetched snapshots/rates; behavior must remain CHART-03-compatible (as-of × as-of, D-16 skip null FX on primary account series).

### Claude's Discretion
- Canonical LOCF API shape (pure-only vs hybrid maps+as-of vs Prisma-first) — prefer minimal drift from current architecture (audit: pages batch + series pure; helpers unused in prod).
- Fate of public `getBalanceAsOf` / `getRateAsOf` (keep as thin wrappers, internalize, or remove after rewiring tests).
- Module layout (`balances.ts`/`fx.ts` vs new `locf.ts` vs shared pure extract).
- Parity / regression proof strategy (dedicated parity suite vs retarget existing Vitest vs light smoke) — must keep BAL-02 / FX-02 / CHART-03 green.
- Nyquist close path: run `/gsd-validate-phase` for 3–6 and/or reconcile VALIDATION.md with existing verify+Vitest evidence; sequencing relative to LOCF refactor (before / after / interleaved) — choose whatever minimizes false gaps and rework.
- How aggressively to delete duplicated page Map loops once a shared builder exists.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Audit / roadmap
- `.planning/v1-MILESTONE-AUDIT.md` — triplicate LOCF debt; Nyquist 3–6 NOT-VALIDATED; recommended follow-ups
- `.planning/ROADMAP.md` — Phase 7 entry (LOCF consolidation + Nyquist 3–6)
- `.planning/STATE.md` — open tech_debt rows (maintainability LOCF, nyquist 3–6); prior LOCF contracts
- `.planning/REQUIREMENTS.md` — BAL-02, FX-02, CHART-03 and related REQ-IDs must stay satisfied

### Prior phase decisions
- `.planning/phases/03-dated-balance-snapshots/03-CONTEXT.md` — LOCF null-before-first; batch list LOCF; credit available semantics
- `.planning/phases/04-dated-fx/04-CONTEXT.md` — `getRateAsOf` null before first (D-15); uniqueness; forward-effective
- `.planning/phases/05-net-worth-dashboard/05-CONTEXT.md` — dashboard LOCF inputs into NW
- `.planning/phases/06-historical-charts/06-CONTEXT.md` — event∪today; D-16 null FX skip; CHART-03 as-of×as-of

### Nyquist drafts to close
- `.planning/phases/03-dated-balance-snapshots/03-VALIDATION.md` — status: draft
- `.planning/phases/04-dated-fx/04-VALIDATION.md` — status: draft
- `.planning/phases/05-net-worth-dashboard/05-VALIDATION.md` — status: draft
- `.planning/phases/06-historical-charts/06-VALIDATION.md` — status: draft

### Code touchpoints
- `src/lib/balances.ts` — `getBalanceAsOf` (tests-primary today)
- `src/lib/fx.ts` — `getRateAsOf` (tests-primary today)
- `src/lib/historical-series.ts` — `locfAmountAsOf` / `locfRateAsOf` + series builders
- `src/app/accounts/page.tsx` — batch balance LOCF Map
- `src/app/currencies/rates/page.tsx` — batch FX LOCF Map
- `src/app/page.tsx` — batch balance+FX Maps for dashboard/charts

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `getBalanceAsOf` / `getRateAsOf` — single-row Prisma LOCF; covered by unit tests; unused in prod pages
- Page Map loops (`locfByAccount` / `locfByCurrency`) — production “today” LOCF for lists/dashboard
- `locfAmountAsOf` / `locfRateAsOf` in `historical-series.ts` — pure multi-date LOCF for charts
- Existing Vitest suites: `balances.test.ts`, `fx.test.ts`, historical-series / CHART-03 coverage

### Established Patterns
- Prefetch `findMany` with `asOfDate <= today` (or full series window), then first-hit Map or scan
- Never invent zero balance / unit rate before first dated row
- Money stays bigint minor / scaled rate; UI formats separately

### Integration Points
- `/accounts`, `/currencies/rates`, `/` (dashboard + chart data prep) must call shared LOCF after refactor
- Chart builders must keep feeding `computeNetWorthRows` with per-date LOCF inputs
- VALIDATION.md for phases 3–6 updated via validate-phase / evidence reconciliation — no product UI change required for Nyquist half

</code_context>

<specifics>
## Specific Ideas

User explicitly asked to skip remaining discuss Q&A («везде буду отвечать решай сам»). Prefer shipping CONTEXT with discretion over more options. No additional product UX preferences.

</specifics>

<deferred>
## Deferred Ideas

- Nav «Валюты» landing on `/currencies/rates` vs `/currencies` (audit discoverability)
- Sync PROJECT.md Active → Validated for charts
- Optional re-run Phase 1 persist smoke; close Phase 2/3 human console / empty-CTA unverified behaviors
- Any new LOCF features or chart UX changes

</deferred>

---

*Phase: 7-address-tech-debt-locf-consolidation-nyquist-3-6*
*Context gathered: 2026-09-04*
