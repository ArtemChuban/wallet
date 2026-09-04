# Phase 10: Repayments + close/write-off - Context

**Gathered:** 2026-09-04
**Status:** Ready for planning

<domain>
## Phase Boundary

User can record same-currency dated repayments on a debt, see mixed event history, delete repayments/size-changes (remaining + status recalculate, including reopen), auto-close at remaining 0, and early-close via forgive (size-change down by remaining) — all from a dedicated debt detail Dialog opened from `/debts`.

Does **not** deliver: remaining/repayment charts or primary totals hero (Phase 11), cross-currency repayments, repayments that update account snapshots, debt list filters/search, or NW coupling.

</domain>

<decisions>
## Implementation Decisions

### Debt detail surface
- **D-01:** Repayments, history, forgive, and size-change live in a **dedicated debt detail Dialog** — not inside `DebtFormDialog`, not as a list-row repay-only dialog.
- **D-02:** Opening detail: **click the entire debt row** on `/debts`. Meta edit remains a separate control path.
- **D-03:** Container is **Dialog** (existing `src/components/ui/dialog.tsx`). Do **not** add Sheet for this phase.
- **D-04:** Debt meta edit (direction / due / note) stays in **separate `DebtFormDialog`**. Detail Dialog has **«Изменить»** that opens it. Debt delete stays in edit dialog (Phase 9 D-14).

### History
- **D-05:** History is a **mixed timeline**: repayments **and** size-changes. Event order for domain math remains Phase 8 D-10 (`asOfDate` + insert `id`); UI list is **newest first**.
- **D-06:** User can **delete both** repayments and size-changes. Each delete uses **in-dialog second-step confirm** (Phase 9 D-16). After delete: remaining + status recompute (auto-reopen if remaining > 0).
- **D-07:** Event type labels (RU): **«Погашение»** for repayments; **«Изменение суммы»** for manual size-changes; **«Списание»** for events created via the forgive button (D-09).

### Early forgive / size-change
- **D-08:** Provide **both**: one-tap **«Простить остаток»** (creates size-change delta = −current remaining) **and** a manual **«Изменение суммы»** form for other deltas (up/down). Math/close rules unchanged from Phase 8 D-04 / D-12.
- **D-09:** «Простить остаток» requires **in-dialog confirm** stating the remaining amount being written off and that the debt will close.
- **D-10:** Forgive form fields: **`asOfDate` required** (backdating allowed, Europe/Moscow conventions as elsewhere); **note optional**.

### CLOSED debts on list
- **D-11:** CLOSED debts stay in the **same person group**, under a **collapsed «Закрытые (N)»** subsection (not a page-global closed section).
- **D-12:** «Закрытые» subsection is **collapsed by default**.
- **D-13:** CLOSED debts keep **full detail access**: add repayment / size-change / forgive, delete events, open «Изменить» meta, delete debt. Status always recomputes from remaining (Phase 8 D-14).

### Claude's Discretion
- Exact Dialog layout density for detail (form above vs below history).
- Exact RU microcopy for confirm steps and empty history, as long as D-07 labels and D-09 confirm intent hold.
- How to distinguish «Списание» rows from manual size-changes in persistence (e.g. note convention vs optional reason enum) — prefer minimal schema change; must not break Phase 8 ledger (no `writeOffMinor`, no WRITE_OFF repayment type).
- Whether «Простить остаток» is hidden when remaining is already 0.
- Server Action module layout under `src/app/debts/`; reuse `createRepaymentSchema` / `createSizeChangeSchema` and domain asserts.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope
- `.planning/PROJECT.md` — v1.1 debts side-ledger; destructive-confirm constitution; same-currency repayments
- `.planning/REQUIREMENTS.md` — REPAY-01, REPAY-02, REPAY-03, DEBT-04, DEBT-05 (Phase 10); apply Phase 8 CONTEXT overrides for remaining/write-off math
- `.planning/ROADMAP.md` — Phase 10 goal and success criteria
- `.planning/STATE.md` — milestone position

### Prior phase decisions
- `.planning/phases/08-debts-schema-domain-math/08-CONTEXT.md` — ledger (no writeOff field); remaining math; auto-close/reopen; events on CLOSED; size-change = early close
- `.planning/phases/09-people-debts-crud-nav/09-CONTEXT.md` — grouped list; DebtFormDialog; destructive confirm D-16; nav `/debts` prefix

### Milestone research
- `.planning/research/ARCHITECTURE.md` — debts routes / actions sketch
- `.planning/research/FEATURES.md` — repayments / open-closed table stakes
- `.planning/research/PITFALLS.md` — over-repayment; early close must record adjustment (**superseded mechanism:** size-change per Phase 8, not writeOff field); note D-14 allows events on CLOSED (supersedes “reject on CLOSED” pitfall suggestion)

### Existing code
- `prisma/schema.prisma` — `Debt`, `DebtRepayment`, `DebtSizeChange`, `OPEN`/`CLOSED`
- `src/lib/debts.ts` — `remainingMinor`, `statusForRemaining`, `assertRepaymentAmount`, `assertSizeDelta`, `assertStatusSynced`
- `src/lib/validations/debts.ts` — `createRepaymentSchema`, `createSizeChangeSchema`
- `src/app/debts/actions.ts` — extend with repayment / size-change / delete-event actions
- `src/components/debts/DebtsList.tsx` — row click → detail; closed subsection
- `src/components/debts/DebtFormDialog.tsx` — meta edit + debt delete
- `src/components/debts/DestructiveConfirmStep.tsx` — confirm pattern for deletes / forgive
- `src/components/ui/dialog.tsx` — Dialog primitive

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `createRepaymentSchema` / `createSizeChangeSchema` — shape validation ready; wire Server Actions
- `assertRepaymentAmount` / `assertSizeDelta` / `statusForRemaining` — domain gates after parse
- `DebtFormDialog` + `DestructiveConfirmStep` — edit meta + confirm UX patterns
- `DebtsList` person grouping — add per-person collapsed «Закрытые»
- Money helpers `parseMajorToMinor` / `formatMinorToMajor` — form I/O

### Established Patterns
- Russian UI; Dialog (not routes) for forms
- Server Actions + Zod + `revalidatePath` under `src/app/debts/`
- Destructive = in-dialog second step, never `window.confirm`
- Status derived from remaining; no `closedAt`
- DISOL-01: no debt imports in NW / historical-series / `/`

### Integration Points
- New detail Dialog component (e.g. `DebtDetailDialog`) opened from `DebtsList` row click
- New actions: create/delete repayment, create/delete size-change, forgive helper action
- List must load events (or remaining + status) to split OPEN vs CLOSED subsections
- Auto-close/reopen happens inside write path after remaining recompute — not a separate status toggle

</code_context>

<specifics>
## Specific Ideas

- Discussion conducted in Russian for UX labels; agent docs (this file) stay English.
- User deferred surface choice between dedicated detail vs list-row repay to Claude → locked dedicated detail (history/forgive/close need one surface; Phase 11 charts will hang there later).
- User deferred forgive entry to Claude → locked both one-tap forgive and manual size-change.

</specifics>

<deferred>
## Deferred Ideas

- Remaining/repayment charts and «я должен»/«мне должны» primary totals — **Phase 11**
- Cross-currency repayments (REPAY-04), repayments updating account snapshots (REPAY-05) — out of milestone
- Debt list filters/search, interest — out of milestone
- Sheet primitive — rejected for Phase 10; revisit only if Dialog UX fails on mobile

None folded from todos (no matching todos).

</deferred>

---

*Phase: 10-Repayments + close/write-off*
*Context gathered: 2026-09-04*
