# Phase 8: Debts schema + domain math - Context

**Gathered:** 2026-09-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Persist people/debts ledger primitives and lock remaining / status / primary-totals domain math in pure helpers with tests — **no UI, no nav, no chart series, no NW coupling**.

Delivers: Prisma models `Person`, `Debt`, repayment events, and **size-change events**; pure helpers for principal/remaining, status sync, over-repayment rejection, and I-owe / they-owe primary totals (OPEN only, FX as-of honesty); Vitest coverage; hard gate that `net-worth.ts`, `historical-series.ts`, and `/` do not import debt code.

Does **not** deliver: `/debts` CRUD UI (Phase 9), repayment/close actions UX (Phase 10), remaining/repayment charts (Phase 11). Series builders are explicitly out of Phase 8.

**Requirement overrides vs REQUIREMENTS.md (locked here):** DEBT-02/DEBT-03 narrative (`initial − Σ repayments − writeOff`, immutable initial after first repayment) is **replaced** by the size-change ledger model below. Downstream agents MUST follow this CONTEXT, not the old writeOff formula.

</domain>

<decisions>
## Implementation Decisions

### Ledger model (replaces writeOff field)
- **D-01:** No `writeOffMinor` on `Debt` and no special `WRITE_OFF` repayment type. — **Reversibility:** one-way — schema + remaining formula; undoing needs migration and rewrite of helpers/tests.
- **D-02:** Two event tables: **repayments** and **size changes** (separate models). Size changes are signed and may go **both up and down**. — **Reversibility:** one-way — two tables vs unified event table is a migration.
- **D-03:** `Debt.initialAmountMinor` is the original principal at create (**must be > 0**); it is **not edited directly**. Adjustments go through size-change events.
- **D-04:** Math:
  - `currentPrincipal = initialAmountMinor + Σ deltaMinor`
  - `remaining = currentPrincipal − Σ repayment.amountMinor`
  - Early close = size-change **down by current remaining** (delta ≠ 0) so remaining hits 0, then status `CLOSED` (same auto-close rule as any path to zero).
- **D-05:** Size-change row stores **`deltaMinor` (signed)**, not absolute principal-after. Reject **`deltaMinor === 0`**.
- **D-06:** Both repayments and size changes may have optional nullable **`note`**.
- **D-07:** Size changes have calendar **`asOfDate`** (`YYYY-MM-DD`) with **backdating allowed**, same convention as repayments / balance snapshots.

### Same-day events & ordering
- **D-08:** Allow **multiple repayments** on the same `asOfDate` (no unique on `(debtId, asOfDate)`).
- **D-09:** Allow **multiple size changes** on the same `asOfDate` (same policy).
- **D-10:** When ordering events for remaining / future series: **strict insert `id` order** across both event kinds (not “all size changes then repayments”).

### Status & close/reopen
- **D-11:** Persist enum **`OPEN` | `CLOSED`** on `Debt`. Do **not** store `closedAt`.
- **D-12:** **Auto-close:** whenever remaining reaches **0** → `CLOSED`. **Auto-reopen:** whenever remaining becomes **> 0** → `OPEN`.
- **D-13:** Hard invariant in helpers: **`status` always synced with remaining** (`CLOSED` ↔ remaining == 0, `OPEN` ↔ remaining > 0). Desync is a bug.
- **D-14:** Events **are allowed** on `CLOSED` debts; after apply, status recomputes from remaining.
- **D-15:** **Remaining must never be < 0** — reject repayments that exceed remaining and size-change downs that would make `currentPrincipal < Σ repayments`.

### Primary totals helpers (Phase 8 ships API; UI Phase 11)
- **D-16:** Totals include **OPEN debts only**.
- **D-17:** Missing FX for non-primary currency → **exclude** that debt from the side total and set **`isPartial`** (same honesty as NW dashboard).
- **D-18:** Helper takes explicit **`asOfDate`** (caller passes “today” Europe/Moscow); LOCF rate as of that date; primary currency uses identity (no FxRate row required).
- **D-19:** Return shape mirrors **`computeNetWorthRows`**: per-debt rows (native remaining, primary contribution or excluded, flags) **plus** aggregates `iOwePrimaryMinor` / `theyOwePrimaryMinor` / `isPartial`.

### Schema FK / delete
- **D-20:** `Person` → `Debt`: **`onDelete: Restrict`** (aligns with PERSON-02 — cannot delete person with debts).
- **D-21:** `Debt` → repayments / size changes: **`onDelete: Cascade`** (deleting a debt removes its event history).
- **D-22:** `Currency` → `Debt`: **`onDelete: Restrict`** (same as Account / FxRate).

### Phase 8 scope cut
- **D-23:** Phase 8 implements **remaining + status sync + validation + primary totals** helpers and tests only. **Do not** implement `buildDebtRemainingSeries` / repayment series in this phase — defer to Phase 11.
- **D-24:** **DISOL-01 hard gate:** no debt imports in `src/lib/net-worth.ts`, `src/lib/historical-series.ts`, or `src/app/page.tsx`. Suggested new module: `src/lib/debts.ts` (name flexible).

### Claude's Discretion
- Exact Prisma model/field names (`DebtSizeChange` vs `DebtAdjustment`, etc.) as long as D-01–D-22 hold.
- Zod validation module layout under `src/lib/validations/`.
- Whether repayment `amountMinor` must be strictly `> 0` (recommended yes, symmetric with reject zero size delta).
- Direction enum labels (`I_OWE` / `THEY_OWE`) and Person `name` `@unique` (research default) unless planner finds a conflict.
- Optional Debt fields already in roadmap/research (`dueDate`, `note` on Debt) — include in schema for Phase 9 readiness even though UI is later; planner may slim if it blocks migrate.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope
- `.planning/PROJECT.md` — v1.1 debts side-ledger; debts never change NW
- `.planning/REQUIREMENTS.md` — DEBT-02, DEBT-03, DISOL-01 mapped to Phase 8 (**apply CONTEXT overrides for DEBT-02/03**)
- `.planning/ROADMAP.md` — Phase 8 goal and success criteria
- `.planning/STATE.md` — current milestone position

### Milestone research
- `.planning/research/ARCHITECTURE.md` — Person→Debt→events sketch; NW isolation; **note:** writeOff field suggestion **superseded by D-01–D-04**
- `.planning/research/FEATURES.md` — table stakes vs deferrals
- `.planning/research/PITFALLS.md` — NW leak, over-repayment, cascade delete, write-off pitfalls
- `.planning/research/SUMMARY.md` — phase build order

### Prior phase decisions (archived v1.0)
- `.planning/milestones/v1.0-phases/01-docker-sqlite-foundation/01-CONTEXT.md` — INTEGER/BigInt money; Prisma + SQLite
- `.planning/milestones/v1.0-phases/02-currencies-accounts/02-CONTEXT.md` — Currency FK patterns; Russian UI later
- `.planning/milestones/v1.0-phases/03-dated-balance-snapshots/03-CONTEXT.md` — asOfDate YYYY-MM-DD; LOCF; Europe/Moscow today
- `.planning/milestones/v1.0-phases/04-dated-fx/04-CONTEXT.md` — getRateAsOf null before first; convertOtherMinorToPrimaryMinor
- `.planning/milestones/v1.0-phases/05-net-worth-dashboard/05-CONTEXT.md` — computeNetWorthRows shape; partial FX honesty; primary identity
- `.planning/milestones/v1.0-phases/07-address-tech-debt-locf-consolidation-nyquist-3-6/07-CONTEXT.md` — shared LOCF helpers for rate as-of

### Existing schema / code
- `prisma/schema.prisma` — extend with Person/Debt/event models; mirror Restrict/Cascade patterns
- `src/lib/money.ts` — BigInt minor parse/format; `convertOtherMinorToPrimaryMinor`
- `src/lib/net-worth.ts` — isolation target; totals return-shape analog
- `src/lib/fx.ts` / `src/lib/locf.ts` — rate as-of for totals conversion
- `src/lib/net-worth.test.ts` / `src/lib/money.test.ts` — Vitest patterns to mirror

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `parseMajorToMinor` / `formatMinorToMajor` — money I/O later; helpers stay on BigInt minors
- `convertOtherMinorToPrimaryMinor` — primary totals for non-primary debts
- `computeNetWorthRows` — pattern for rows + aggregates + `isPartial`
- Shared LOCF (`src/lib/locf.ts`) + `getRateAsOf` — FX as-of for totals (batch in pages later)

### Established Patterns
- Money as INTEGER/BigInt minor units; never float
- `asOfDate` as `String` YYYY-MM-DD
- Prisma `onDelete: Restrict` for Currency-linked money entities
- Pure domain libs + Vitest co-located `*.test.ts`
- Primary currency conversion uses identity (no FxRate row)

### Integration Points
- New migration adding Person / Debt / DebtRepayment / DebtSizeChange (names discretionary)
- New `src/lib/debts.ts` (+ tests) — no wiring into `/` or NW modules
- Docker migrate-on-start must apply new migration cleanly (Phase 8 success criterion)

</code_context>

<specifics>
## Specific Ideas

- User explicitly preferred a **size-change transaction type** so initial size stays visible and change history is auditable — simpler mental model than writeOff field.
- Discussion language: Russian UI later; schema/math decisions recorded in English for agents.

</specifics>

<deferred>
## Deferred Ideas

- Chart series helpers (`buildDebtRemainingSeries`, repayment amounts) — **Phase 11** (D-23)
- People/debts CRUD UI, nav «Долги» — **Phase 9**
- Repayment/close Server Actions UX, delete repayment reopen flows in UI — **Phase 10** (domain rules locked here)
- Debt list filters/search, interest, cross-currency repayments, NW inclusion — out of milestone / future REQUIREMENTS

None — discussion stayed within clarifying Phase 8 schema + math (size-change model updates DEBT-02/03 interpretation).

</deferred>

---

*Phase: 8-Debts schema + domain math*
*Context gathered: 2026-09-04*
