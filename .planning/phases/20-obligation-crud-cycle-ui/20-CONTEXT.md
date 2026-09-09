# Phase 20: Obligation CRUD + cycle UI - Context

**Gathered:** 2026-09-09
**Status:** Ready for planning

<domain>
## Phase Boundary

User manages credit grace schedule + per-cycle obligations on FIAT_CREDIT via AccountList UI: set dual DOM, see current/next + obligation list, enter/edit «Платёж для беспроцентного», early-close / reopen with DestructiveConfirmStep, overdue highlight, RU copy that distinguishes snapshot «Задолженность» from grace amount (CYCLE-02, OBL-01…03, UX-01).

Does **not** deliver: Капитал «Прогноз» wiring (Phase 21), GRACEISO suite (Phase 22), APR / minimum / cash modeling (OOS).

</domain>

<decisions>
## Implementation Decisions

### UI home
- **D-01:** Grace UI is a **separate dialog** from `AccountFormDialog` (debts-like: detail/manage apart from account create/edit). — **Reversibility:** costly — new surface + AccountList entry point; folding back into AccountForm later fights list/button chrome.
- **D-02:** Open via **button/link on the credit row** in `AccountList` (label like «Грейс» / «Беспроцентный») → grace dialog. Not whole-row click; not nested step inside AccountFormDialog.
- **D-03:** **Schedule fields** («Дата выписки» / «Оплатить до») live **in the grace dialog** (top); cycles/amounts below. `AccountFormDialog` keeps name/limit/etc. only — no dual DOM there.
- **D-04:** Empty schedule (both DOM null): show **DOM fields + short hint immediately**; no separate CTA step. Cycle/obligation list appears after schedule is saved.

### Cycle list
- **D-05:** List **persisted** obligations (OPEN + CLOSED). For current/next windows **without** a row: show **CTA «ввести сумму»** — never invent DB placeholder rows (honors Phase 19 D-06).
- **D-06:** CLOSED history **collapsed** behind «Показать оплаченные».
- **D-07:** Overdue chrome: **warn row + short RU interest hint in grace dialog** (Phase 18 D-07) **and** a mark on the AccountList grace button. Do **not** alarm the whole account row (avoid confusion with «Задолженность»).
- **D-08:** Multiple OPEN allowed. Sort: **overdue first**, then nearest `dueAsOf`, then other OPEN.

### Amount / close lifecycle
- **D-09:** Amount entry via **dialog** (IncomeFact / Debt pattern): amount required + optional note; create only with `amountMinor`.
- **D-10:** OPEN amount **editable** in the same dialog; `cycleStartAsOf` / `dueAsOf` frozen (Phase 19 D-05).
- **D-11:** Early close: button «Оплачено» → `DestructiveConfirmStep` with **editable `closedAsOf`** (backdate allowed); default today. No `window.confirm`.
- **D-12:** CLOSED → OPEN **allowed with confirm** (fix mistaken close).

### Schedule edit / UX-01
- **D-13:** Changing DOM: **save immediately** with short hint that **existing obligation rows are not recalculated** (Phase 19 D-04). No blocking confirm for DOM edit.
- **D-14:** Clear schedule (both → null) **allowed when zero OPEN**; **CLOSED rows may remain** (Phase 19 D-14). UI shows empty schedule + collapsed paid history.
- **D-15:** First-time DOM fields start **empty** — no 21/15 preset auto-fill (user types; T-Bank calendar remains documentation truth only).
- **D-16:** UX-01: **short disclaimer next to amount field** that this is not snapshot «Задолженность»; do **not** duplicate snapshot debt in the grace dialog (debt stays on account card).

### Claude's Discretion
- Exact RU microcopy for overdue interest hint, empty-schedule hint, DOM non-recalc hint, amount disclaimer, reopen/close confirms — match Debts/Income tone; Phase 18 D-14…D-19 labels are locked vocabulary.
- Grace button label («Грейс» vs «Беспроцентный») — pick clearest short AccountList chrome.
- Whether amount/close share one dialog or sibling dialogs — keep debts/income patterns consistent.
- Action wiring (`create`/`update`/`close`/`reopen` server actions) packaging — Zod already in `validations/credit-grace.ts`; `updateGraceSchedule` exists.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase / milestone scope
- `.planning/ROADMAP.md` — Phase 20 success criteria (cycle list, amount, early close, overdue, debt≠grace copy); UI hint yes
- `.planning/REQUIREMENTS.md` — CYCLE-02, OBL-01, OBL-02, OBL-03, UX-01; Out of Scope (no APR, no min triad, no snapshot-derived due)
- `.planning/PROJECT.md` — v1.3 goal; DestructiveConfirmStep; Russian-first
- `.planning/STATE.md` — current position Phase 20
- `.planning/OPERATOR.md` — agent-driven UAT

### Prior phase locks (must not reopen)
- `.planning/phases/18-bank-contract-study-discuss-locks/18-CONTEXT.md` — D-01…D-19 (dual DOM, overdue from 16th, A′, RU vocab)
- `.planning/phases/18-bank-contract-study-discuss-locks/18-CONTRACT-NOTES.md` — T-Bank Platinum 21→15 next
- `.planning/phases/19-schema-pure-grace-domain-math/19-CONTEXT.md` — D-01…D-16 (schema, frozen due, amount required, OPEN|CLOSED, pure candidates only)

### Code anchors
- `src/lib/credit-grace.ts` — `listCycleWindows`, `resolveCurrentAndNext`, `isGraceOverdue`
- `src/lib/validations/credit-grace.ts` — create/update Zod + schedule assert
- `src/app/accounts/actions.ts` — `updateGraceSchedule` (extend with obligation CRUD actions)
- `src/components/accounts/AccountList.tsx` — credit row + grace button entry
- `src/components/accounts/AccountFormDialog.tsx` — do not add dual DOM here (D-03)
- `src/components/debts/DebtDetailDialog.tsx` — DestructiveConfirmStep / OPEN|CLOSED UX analog
- `src/components/income/IncomeFactDialog.tsx` — amount dialog analog
- `src/components/ui/destructive-confirm-step.tsx` — early close / reopen confirms
- `prisma/schema.prisma` — `CreditGraceObligation` + dual DOM on Account

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `resolveCurrentAndNext` / `listCycleWindows` / `isGraceOverdue` — drive list + CTA + highlight without inventing rows
- `createCreditGraceObligationSchema` / `updateCreditGraceObligationSchema` — write-path ready
- `updateGraceSchedule` — schedule save + OPEN-block on clear
- `DestructiveConfirmStep` — early close and reopen
- DebtDetailDialog / IncomeFactDialog — dialog UX templates

### Established Patterns
- Side ledgers never write `BalanceSnapshot`
- Manual amounts in minor units + Zod; Russian labels
- No `window.confirm`
- Unique `(accountId, cycleStartAsOf)`; update not second create

### Integration Points
- New grace dialog component(s) under `src/components/accounts/` (or `credit-grace/`)
- AccountList credit row button → dialog
- Server actions on accounts (or dedicated grace actions module) for create/update/close/reopen
- Phase 21 will consume OPEN obligations for forecast — keep membership fields stable

</code_context>

<specifics>
## Specific Ideas

- User repeatedly deferred to Claude on entry pattern, empty state, list hybrid, overdue chrome, amount dialog, DOM defaults, UX-01 disclaimer — locked above under decisions + discretion.
- T-Bank 21→15 remains contract truth but **not** auto-filled into form fields (D-15).

</specifics>

<deferred>
## Deferred Ideas

None new — discussion stayed inside Phase 20. Forecast (21), GRACEISO (22), APR/min/cash remain roadmap/OOS.

</deferred>

---

*Phase: 20-Obligation CRUD + cycle UI*
*Context gathered: 2026-09-09*
