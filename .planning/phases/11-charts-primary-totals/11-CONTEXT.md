# Phase 11: Charts + primary totals - Context

**Gathered:** 2026-09-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Debt detail shows one stacked remaining composition chart (native currency) inside the «История» tab; `/debts` shows I-owe / they-owe primary hero totals with FX partial honesty (banner + excluded list). Also bring the same excluded-list partial banner pattern to Капитал (`/`). Isolation from net-worth math remains (DISOL-01).

Does **not** deliver: separate repayment-only chart, range presets on debt charts, editable open date after create, debt list filters/search, NW inclusion of debts, cross-currency repayments.

**Requirement interpretation (locked here):** DCHART-01 + DCHART-02 are satisfied by **one stacked chart** (cumulative repaid + remaining = current principal), not two separate charts.

</domain>

<decisions>
## Implementation Decisions

### Chart surface (debt detail)
- **D-01:** Charts live inside the existing **«История»** tab of `DebtDetailDialog` — not a new «Графики» tab and not an always-visible header block.
- **D-02:** Within «История», order is **charts first, then event timeline**.
- **D-03:** Layout is a **single stacked chart** (not two separate charts). Stack layers: **cumulative repaid** + **remaining**; sum equals **current principal** at each point. — **Reversibility:** costly — UI and series builder couple DCHART-01/02 into one composition.

### Series / stack math
- **D-04:** Time axis starts at the debt’s **open calendar date**; until the first event, series is **flat at initial** (repaid=0, remaining=initial). After events, **step** updates; after the last event, **flat to today** (Europe/Moscow).
- **D-05:** Range control: **«всё» only** — no 30д/90д/1г presets on this chart.
- **D-06:** **Size-change** events change the **total stack height** (current principal); do **not** add a third stack series for size-change. Repaid and remaining proportions recompute on that date.
- **D-07:** Event ordering for series matches Phase 8 **D-10**: across repayments and size-changes, order by `asOfDate` then insert `id`.

### Debt open date (needed for past-dated create + series start)
- **D-08:** Debt create gains a required calendar **«Дата»** field (`YYYY-MM-DD`): may be in the past; default = today Europe/Moscow. Series start uses this field (not wall-clock `createdAt` alone). — **Reversibility:** one-way — schema + create form + backfill/migration for existing debts.
- **D-09:** Open date is **immutable after create** (same constitution as initial amount).

### Primary totals hero (`/debts`)
- **D-10:** Hero sits in the **page header above the list**, same family as Капитал on `/`.
- **D-11:** Two **side-by-side columns**: «Я должен» | «Мне должны», each with primary-currency amount (`computeDebtPrimaryTotals` / Phase 8 D-16–D-19: OPEN only, exclude missing FX, `isPartial`).
- **D-12:** Hero is **always shown**, including when both totals are **0**.
- **D-13:** When `isPartial`: show banner in the Капитал style (**«Итог неполный»** + short RU helper) **plus a list of excluded debts** with **reason** (at least which currency / missing rate). — **Reversibility:** reversible UI.

### Капитал partial banner parity
- **D-14:** Update `/` (Капитал) partial banner to the **same pattern**: list excluded accounts with reason (missing balance and/or missing FX), not banner-only copy. In scope for this phase for honesty UX consistency.

### Claude's Discretion
- Exact Recharts stack series keys, colors, tooltip formatting (reuse dashboard `ChartContainer` / money formatters).
- Empty-history microcopy when timeline has no events but chart still shows flat initial→today.
- Exact RU wording for excluded-debt / excluded-account list rows as long as currency (and reason) are visible.
- How to backfill `openedAsOf` (or chosen field name) for existing Debt rows in migration (e.g. `createdAt` → Moscow calendar date).
- Whether chart component lives under `src/components/debts/` vs shared chart helpers; must not import debt series into `historical-series.ts` / `net-worth.ts` / `/` beyond the partial-banner list UX on `/`.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope
- `.planning/PROJECT.md` — v1.1 debts side-ledger; destructive-confirm constitution; debts never change NW
- `.planning/REQUIREMENTS.md` — DCHART-01, DCHART-02, DTOTAL-01, DISOL-01 (apply DCHART interpretation in this CONTEXT)
- `.planning/ROADMAP.md` — Phase 11 goal and success criteria
- `.planning/STATE.md` — milestone position

### Prior phase decisions
- `.planning/phases/08-debts-schema-domain-math/08-CONTEXT.md` — remaining math; size-change ledger; primary totals helpers D-16–D-19; series deferred here (D-23); DISOL-01
- `.planning/phases/09-people-debts-crud-nav/09-CONTEXT.md` — `/debts` list; Russian UI; create dialog patterns
- `.planning/phases/10-repayments-close-write-off/10-CONTEXT.md` — `DebtDetailDialog` tabs; charts deferred to Phase 11 on detail surface

### Milestone research
- `.planning/research/ARCHITECTURE.md` — chart series sketch; client RangePreset note (**superseded for debt chart:** «всё» only per D-05)
- `.planning/research/FEATURES.md` — remaining + repayment chart table stakes
- `.planning/research/PITFALLS.md` — detail charts stay **native** currency; primary only for list totals as-of today
- `.planning/research/SUMMARY.md` — Phase 11 deliverables; reuse recharts

### Existing code
- `src/lib/debts.ts` — `remainingMinor`, `computeDebtPrimaryTotals`, event ordering inputs
- `src/components/debts/DebtDetailDialog.tsx` — «История» tab host for chart
- `src/components/debts/DebtsList.tsx` / `src/app/debts/page.tsx` — hero placement above list
- `src/components/ui/chart.tsx` — `ChartContainer` / Recharts wrappers
- `src/components/dashboard/NetWorthHistoryChart.tsx` — stack chart precedent (`stackOffset="sign"`)
- `src/app/page.tsx` — Капитал hero + current partial banner (extend per D-14)
- `src/lib/historical-series.ts` — **do not** couple debt series here (DISOL-01); debt series belongs in debts domain module
- `prisma/schema.prisma` — add immutable open-date field on `Debt`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `computeDebtPrimaryTotals` — aggregates + `isPartial` + per-debt rows for excluded list
- `DebtDetailDialog` tab «История» — mount chart above timeline
- `ChartContainer` + Recharts Area stack (NetWorthHistoryChart) — visual precedent for stacked composition
- Money formatters / primary code from dashboard hero

### Established Patterns
- Russian UI; Dialog detail (not nested routes)
- OPEN-only totals; missing FX → exclude + `isPartial`
- Calendar dates `YYYY-MM-DD`; today = Europe/Moscow
- DISOL-01: no debt imports in `net-worth.ts`, `historical-series.ts`; `/` may only gain richer partial listing for **accounts**, not debt math

### Integration Points
- New debt series builder (e.g. `buildDebtPrincipalStackSeries`) + Vitest in debts domain
- Schema/migration: Debt open date; create Zod + `DebtFormDialog` field
- `/debts` page: load FX as-of today, compute totals, render hero + banner list
- `/` page: enrich partial banner with excluded account reasons
- Chart UI inside `DebtDetailDialog` history panel

</code_context>

<specifics>
## Specific Ideas

- User initially assumed one chart; clarified that remaining vs repayments are different, then locked **one stack** so repaid + remaining compose principal (closes both DCHART reqs).
- Past-dated debt open is explicit product need — not only wall-clock create.
- Partial honesty should name **which currencies** fail conversion; same UX on Капитал.
- Discussion questions in Russian; this CONTEXT stays English for agents.

</specifics>

<deferred>
## Deferred Ideas

- Separate repayment-amounts-only chart — rejected in favor of stack (D-03)
- Range presets on debt chart — rejected (D-05)
- Editable open date after create — rejected (D-09)
- Cross-currency repayments, NW inclusion of debts, list filters — out of milestone / other requirements

None folded from todos (no matching todos).

</deferred>

---

*Phase: 11-Charts + primary totals*
*Context gathered: 2026-09-05*
