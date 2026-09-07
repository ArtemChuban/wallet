# Phase 15: Plan vs actual + overdue - Context

**Gathered:** 2026-09-07
**Status:** Ready for planning

<domain>
## Phase Boundary

User records income actuals against plan slots on «Доходы», sees overdue «заполни» chrome when plan date is before Moscow today with no actual, and sees plan vs actual variance on the same page (ACT-01, ACT-02, ACT-03).

Does **not** deliver: per-Person primary totals / FX honesty (Phase 16), NW forecast overlay / isolation suite (Phase 17), nav overdue badge, multi-slot history feed, Recharts variance chart polish.

</domain>

<decisions>
## Implementation Decisions

### Record-actual entry
- **D-01:** Separate row CTA opens a dedicated fact dialog — not via «Изменить» definition and not a DebtDetail-style detail sheet. — **Reversibility:** costly — new dialog + actions surface separate from IncomeFormDialog.
- **D-02:** Fact form fields: **actual amount** + **actual date** required; **note** optional (schema already has note).
- **D-03:** First-fill defaults: amount = planned amount for that slot; **actualAsOf = Moscow today** always (not plan date).
- **D-04:** Re-open same dialog to edit existing actual; **delete actual** via DestructiveConfirmStep (slot empty → may become overdue again). Matches Phase 13 D-09 upsert/delete.

### Slot surface on list
- **D-05:** Keep Phase 14 shape: **one row per definition**; fact/overdue chrome applies only to **next open** slot (`nextOpenPlannedAsOf` / one-time plan key). No multi-slot rows, no expand/chevron feed. — **Reversibility:** costly — multi-slot later rewrites list data shape.
- **D-06:** Multiple overdue months on recurring: fill **FIFO one-by-one** via next open (helper already returns earliest unfilled, including past).
- **D-07:** After successful fill, UI advances to the new next open. One-time with actual: row stays as filled («получено») with fact edit/delete. Recurring filled months do **not** remain as separate list rows.

### Overdue chrome «заполни»
- **D-08:** Overdue row: text badge **«заполни»** + primary CTA button **«Заполни»**.
- **D-09:** Semantic color = **warning amber** (need-to-fill, not destructive error).
- **D-10:** Next open with plan ≥ Moscow today: calm outline CTA **«Внести факт»**, **no** «заполни» badge.
- **D-11:** Sort stays Phase 14 **nearest planned date** within Person group (overdue naturally sorts early; no separate overdue-first pass).

### Variance (ACT-03 MVP)
- **D-12:** Variance is an **inline row view** when an actual exists: plan amount, actual amount, delta. **No Recharts** in Phase 15 (chart refinements = Future Requirements).
- **D-13:** Delta in the **source currency** only — no primary FX conversion here (Phase 16 / CPTY-01).
- **D-14:** Delta formula **actual − plan**; RU copy: «больше плана» / «меньше плана» / «как план» when zero.
- **D-15:** Show Δ only for slots that **have an actual**. Next open without actual: no variance numbers.

### Fact dialog context + row after fill (Claude)
- **D-16:** Fact dialog shows **read-only** plan date + plan amount for the slot being filled/edited (so user sees what they variance against).
- **D-17:** CTA labels: overdue create **«Заполни»**; non-overdue create **«Внести факт»**; edit mode **«Изменить факт»**; delete confirm Russian copy states fact will be removed and slot may show overdue again.
- **D-18:** One-time filled row shows **plan + actual + Δ** (same variance chrome as D-12).

### Validations + definition edit (Claude)
- **D-19:** Actual amount must be **&gt; 0** (positive minor). `actualAsOf` any valid calendar date (past/future OK; independent of plan). Note optional free text.
- **D-20:** «Изменить» definition remains available while next open is overdue. Changing recurring DOM/plan amount follows Phase 13 freeze: slots **with** actual keep their keys; unfilled slots regenerate from current definition. Fact CTA stays separate from definition edit.

### Carried locks (do not re-open)
- Occurrence key `(parentId, plannedAsOf)`; at most one actual per slot; upsert = re-record (13 D-06/D-09).
- `isIncomeOverdue(plannedAsOf, hasActual, today)` — today injected, Moscow calendar (13).
- One-time plan immutable after actual exists (13 D-08 / `assertOneTimePlanImmutable`).
- Person-grouped list; side ledger; no BalanceSnapshot writes (14 + ISO mindset).
- Never `window.confirm` — DestructiveConfirmStep only.

### Claude's Discretion
- Minimal path (if needed) to edit a **past** recurring actual that is not the current next-open row — without building a multi-slot history feed. Prefer deferring UI until a real need; planner may omit or add a thin affordance.
- Exact amber token / badge component (reuse existing warning styles vs small new chip) — match app patterns in UI-SPEC/research.
- Server action names / Zod schemas mirroring debts repayment style.

### Folded Todos
- **Add salary/income tracking with plan vs actual and forecast** (`.planning/todos/pending/2026-09-05-add-salary-income-tracking-with-forecast.md`) — ACT-01/02/03 slice of that milestone todo (CRUD done in 14; stats/forecast remain 16–17).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone / phase scope
- `.planning/ROADMAP.md` — Phase 15 goal, success criteria, UI hint; Phases 16–17 boundaries
- `.planning/REQUIREMENTS.md` — ACT-01, ACT-02, ACT-03; Future: nav badge, variance chart refinements
- `.planning/PROJECT.md` — side-ledger income, «заполни» product language, DestructiveConfirmStep constitution
- `.planning/STATE.md` — v1.2 locks (side ledger, Person reuse, ISO)

### Prior phase decisions
- `.planning/phases/13-income-schema-domain-math/13-CONTEXT.md` — occurrence identity, freeze, overdue predicate, actual models
- `.planning/phases/14-dohody-crud-nav/14-CONTEXT.md` — list/Person grouping, next planned display, no fact UX yet
- `.planning/phases/14-dohody-crud-nav/14-UI-SPEC.md` — overdue chrome deferred to Phase 15; copy patterns

### Research / operator
- `.planning/research/SUMMARY.md` / `ARCHITECTURE.md` / `PITFALLS.md` — side ledger, isolation
- `.planning/OPERATOR.md` — agent-driven UAT (Orca)
- `.planning/todos/pending/2026-09-05-add-salary-income-tracking-with-forecast.md` — folded origin problem

### Code anchors
- `src/lib/income.ts` — `isIncomeOverdue`, `nextOpenPlannedAsOf`, `list*Occurrences`
- `src/components/income/IncomeList.tsx` — row chrome + CTA hooks
- `src/components/income/IncomeFormDialog.tsx` — definition edit stays separate
- `src/app/income/actions.ts` — extend with record/update/delete actual actions
- `src/lib/validations/income.ts` — Zod for actual payloads
- `src/components/ui/destructive-confirm-step.tsx` — delete actual
- `src/components/debts/DebtDetailDialog.tsx` — repayment create/delete pattern analog (not UX copy)
- `prisma/schema.prisma` — `RecurringIncomeActual` / `OneTimeIncomeActual`
- `src/lib/dates.ts` — `calendarDateToday` (Europe/Moscow)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `isIncomeOverdue` / `nextOpenPlannedAsOf` — overdue predicate + FIFO slot identity
- `IncomeList` / `IncomeFormDialog` — extend list chrome; keep definition dialog separate
- `DestructiveConfirmStep` — delete actual confirm
- `DebtDetailDialog` repayment actions — server-action + dialog form pattern for events
- Recharts / Chart UI exist on dashboard — **not** required for ACT-03 MVP this phase
- Money/date helpers: `formatMinorToMajor`, `calendarDateToday`, `formatAsOfDisplay`

### Established Patterns
- Person-grouped list; «Изменить» for definitions; Russian UI
- Server actions + Zod; `revalidatePath('/income')`; side ledger never touches BalanceSnapshot
- Phase 14 UI-SPEC: no amber overdue until this phase

### Integration Points
- New fact dialog component under `src/components/income/`
- Actual CRUD in `src/app/income/actions.ts` + validations
- List row: badge + dual CTA labels + variance inline when `hasActual`
- Page load must join next-open slot + optional actual for chrome/Δ
- Tests: domain overdue + UI file/copy patterns; UAT via Orca

</code_context>

<specifics>
## Specific Ideas

- Discussion prompts in Russian (product UI Russian-first — already locked).
- User delegated slot surface, variance MVP, dialog context, validations, and definition-vs-overdue edit to Claude; entry UX and overdue chrome chosen explicitly.

</specifics>

<deferred>
## Deferred Ideas

- Per-Person income stats / FX LOCF honesty — Phase 16
- NW forecast overlay + isolation suite — Phase 17
- Nav badge for overdue income count — Future Requirements
- Variance chart refinements (Recharts) beyond inline MVP — Future Requirements
- Multi-slot history / browse-edit all past recurring actuals — later
- Pause / `endAsOf` on recurring; destination-account on actual — Future / out of scope

### Reviewed Todos (not folded)
- Improve credit account type — out of scope (weak match)
- (Other pending todos from match set with score &lt; 0.4 — not folded)

</deferred>

---

*Phase: 15-Plan vs actual + overdue*
*Context gathered: 2026-09-07*
