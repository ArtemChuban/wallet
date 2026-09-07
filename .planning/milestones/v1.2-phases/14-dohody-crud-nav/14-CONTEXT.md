# Phase 14: Доходы CRUD + nav - Context

**Gathered:** 2026-09-07
**Status:** Ready for planning

<domain>
## Phase Boundary

User manages income sources from a dedicated «Доходы» section: nav entry, create/edit/delete recurring and one-time income (SRC-01, SRC-02, UI-01), DestructiveConfirmStep on deletes, and RU honesty that recording/listing income never changes account balances.

Does **not** deliver: record actual / overdue «заполни» chrome / variance (Phase 15), per-Person stats (Phase 16), NW forecast overlay (Phase 17), pause/`endAsOf` on recurring.

</domain>

<decisions>
## Implementation Decisions

### List layout
- **D-01:** Group income by **Person** (same structure as «Долги»). — **Reversibility:** costly — list/page data shape and components mirror DebtsList grouping.
- **D-02:** Within a person group, order rows by **nearest planned date** (recurring + one-time in one timeline).
- **D-03:** Show **all people** from the directory (empty groups + CTA), not only people with income.
- **D-04:** Each row shows **type + amount + currency + planned date** (no truncated note in the compact row).

### Create entry
- **D-05:** Single CTA **«Новый доход»** opens one dialog with a **kind toggle** (recurring ↔ one-time) at the top — not two separate create buttons.
- **D-06:** Creating from inside a person group **pre-fills Person** (`defaultPersonId` pattern); user may change it.
- **D-07:** Dialog supports **existing / new Person** inline (same pattern as DebtFormDialog).
- **D-08:** Create defaults: **kind = recurring**, **currency = primary**.

### Page content depth
- **D-09:** Primary entities are **definitions** (RecurringIncome / OneTimeIncome). Row shows the **next planned date** for sorting/display — not a multi-slot occurrence feed. No record-actual UX and no overdue «заполни» styling in this phase.
- **D-10:** «Next» planned date for recurring may be a **past plan slot with no actual** (overdue-eligible); still shown as a normal date — Phase 15 owns overdue chrome.
- **D-11:** Short RU copy in the **page header** that income does **not** change account balances.
- **D-12:** Edit via **«Изменить»** button on the row → same dialog pattern as debts (not row-click-to-edit).

### Nav + page chrome
- **D-13:** Nav order: **Главная · Счета · Доходы · Долги · Валюты** («Доходы» after «Счета»). — **Reversibility:** reversible — single `links` array in `nav.tsx`.
- **D-14:** Route **`/income`**; nav label **«Доходы»**.
- **D-15:** Page header CTAs: **«Новый человек»** + **«Новый доход»** (parity with debts header).
- **D-16:** Allow **delete Person** from «Доходы» with **Restrict** when income and/or debts still reference them (same integrity idea as debts).

### Carried locks (do not re-open)
- Two definition models + two actual models (Phase 13 D-03/D-04); Cascade actuals on definition delete; Person Restrict; DestructiveConfirmStep for destructive confirms; side ledger / no BalanceSnapshot writes (ISO-01 mindset; full isolation suite Phase 17).
- Delete income **source** uses DestructiveConfirmStep (UI-01).

### Claude's Discretion
- **D-09 detail:** Chose definitions-as-entities + computed next planned date over a virtual multi-slot list, to keep Phase 14 CRUD-focused and avoid implying fill-actual before Phase 15. Planner/researcher may pick helper (`listInRange` vs single-next) as long as D-02/D-10 display rules hold.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone / phase scope
- `.planning/ROADMAP.md` — Phase 14 goal, success criteria, UI hint; Phases 15–17 boundaries
- `.planning/REQUIREMENTS.md` — SRC-01, SRC-02, UI-01 (this phase); ACT/CPTY/FCST/ISO later
- `.planning/PROJECT.md` — side-ledger income, UI constitution (DestructiveConfirmStep), Russian-first
- `.planning/STATE.md` — v1.2 locks (side ledger, Person reuse, ISO)

### Prior phase decisions
- `.planning/phases/13-income-schema-domain-math/13-CONTEXT.md` — schema split, occurrence identity, freeze/immutability, Cascade/Restrict
- `.planning/research/SUMMARY.md` / `ARCHITECTURE.md` / `PITFALLS.md` / `STACK.md` — v1.2 research (zero new packages, isolation)

### Operator / patterns
- `.planning/OPERATOR.md` — agent-driven UAT (Orca)
- `.planning/codebase/CONVENTIONS.md` — UAT + no `window.confirm`

### Code anchors
- `src/components/nav.tsx` — add «Доходы» `/income` after Счета
- `src/app/debts/page.tsx` — page shell + header CTAs pattern
- `src/components/debts/DebtsList.tsx` — Person-grouped list + DestructiveConfirmStep delete person
- `src/components/debts/DebtFormDialog.tsx` — create/edit dialog, existing/new Person, defaultPersonId
- `src/components/debts/PersonFormDialog.tsx` — «Новый человек»
- `src/components/ui/destructive-confirm-step.tsx` — required for deletes
- `src/lib/income.ts` — occurrence helpers from Phase 13 (next planned date / range)
- `prisma/schema.prisma` — RecurringIncome / OneTimeIncome (+ actuals) models

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `DebtsList` / `DebtFormDialog` / `PersonFormDialog` — closest UX analogs for Person groups, dialogs, delete confirm
- `Nav` links array — one entry for «Доходы»
- `src/lib/income.ts` — pure occurrence math for next planned date display
- `DestructiveConfirmStep` — income source delete + person delete confirms
- Money/date helpers: `formatMinorToMajor`, `calendarDateToday` (Europe/Moscow)

### Established Patterns
- Server page `force-dynamic` + Prisma load → client list with dialogs
- Server actions + Zod validations; `revalidatePath` for the feature route
- Side ledger never writes `BalanceSnapshot` or mutates NW historical series
- Russian UI copy; file-scan style tests for nav hrefs where debts/accounts already do

### Integration Points
- New `src/app/income/page.tsx` + `actions.ts` + `src/components/income/*`
- Extend `nav.tsx` + `nav.test.ts`
- Person create/delete actions may be reused or thin-wrapped from debts actions (Restrict across debts **and** income)
- Phase 15 will layer actual/overdue on the same `/income` surface — keep list/API shaped for that without implementing it now

</code_context>

<specifics>
## Specific Ideas

- User wants discussion prompts in **Russian**; product UI remains Russian-first (already project lock).
- Mirror Долги feel: people-first, header person+entity CTAs, «Изменить» on row.

</specifics>

<deferred>
## Deferred Ideas

- Overdue «заполни» styling + record actual + variance — Phase 15
- Per-Person income stats / FX honesty — Phase 16
- NW forecast overlay + isolation suite — Phase 17
- Pause / end date on recurring; nav overdue badge; destination-account note on actual — Future Requirements

### Reviewed Todos (not folded)
- Add salary/income tracking with plan vs actual and forecast — milestone origin; Phase 14 is CRUD/nav slice only (rest across 15–17); user chose not to fold again
- Improve credit account type — out of scope
- Merge debit/crypto/cash account types — out of scope
- Add timezone selection to settings — out of scope
- Integrate local AI agent via subprocess — out of scope

</deferred>

---

*Phase: 14-Доходы CRUD + nav*
*Context gathered: 2026-09-07*
