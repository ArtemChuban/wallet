# Phase 9: People + debts CRUD + nav - Context

**Gathered:** 2026-09-04
**Status:** Ready for planning

<domain>
## Phase Boundary

User can manage people and debts in a dedicated «Долги» section: `/debts` list grouped by person, create/rename/delete people (delete blocked when debts exist), create/edit/delete debts (without repayments UI), Russian empty states, and nav link «Долги».

Does **not** deliver: repayment/close/write-off UX (Phase 10), remaining/repayment charts or primary totals hero (Phase 11), debt list filters/search, or NW coupling.

Also in this phase (user-locked consistency work): migrate balance-snapshot delete from `window.confirm` to the same in-dialog second-step destructive confirm pattern.

</domain>

<decisions>
## Implementation Decisions

### List structure
- **D-01:** `/debts` shows debts **grouped by person** (person header, debts nested under). No flat-only list; no separate person-detail route in this phase.
- **D-02:** Debt rows are **compact**: direction label + remaining + currency code. Due date and note appear only in dialogs.
- **D-03:** List includes **all people**, including those with zero debts. Empty groups show «Нет долгов» plus create-debt CTA.
- **D-04:** Person groups sorted **A–Z by name**; within a group, debts **newest first** (by `id`).

### Person create / manage
- **D-05:** People management on `/debts` **and** create-person inside debt create dialog (both paths).
- **D-06:** Inside debt create dialog, **new person = name field in the same dialog**; one submit creates person + debt when that path is used.
- **D-07:** Person **delete** control on every person group. If the person has debts: show Russian blocked error (PERSON-02 / Restrict). If none: proceed via destructive confirm (see D-16).
- **D-08:** Person **rename** via dialog from the group header (mirror `AccountFormDialog` edit pattern).

### Debt create / edit
- **D-09:** After create, editable fields are **meta only**: direction, due date, note. Initial amount, currency, and person are **locked** (aligns with `updateDebtMetaSchema` / Phase 8 D-03).
- **D-10:** Edit dialog shows locked fields as **read-only** (not hidden).
- **D-11:** Direction labels in UI: **«Я должен»** / **«Мне должны»**.
- **D-12:** Creating a debt from a person group **pre-selects** that person; user may switch to another existing person or new-person name field.

### Debt delete + destructive UX constitution
- **D-13:** Phase 9 **includes debt delete**. Cascade removes repayment/size-change events (Phase 8 D-21).
- **D-14:** Debt delete control lives **only inside the debt edit dialog** (not on the list row).
- **D-15:** Debt delete confirm copy **mentions cascade** — debt and all repayment/size-change history will be deleted.
- **D-16:** **App-wide constitution (also recorded in `.planning/PROJECT.md`):** never use `window.confirm` for destructive actions. Always use an **in-dialog second step** («точно удалить?» / equivalent) with Russian copy stating what is lost. Applies to debt delete, person delete, balance-snapshot delete, and all future destructive UX.
- **D-17:** Phase 9 **migrates** account balance-snapshot delete from `window.confirm` to the same second-step dialog pattern.

### Nav
- **D-18:** Nav order: **Главная · Счета · Долги · Валюты**. Link «Долги» → `/debts`.
- **D-19:** «Долги» is active for **any pathname under `/debts`** (prefix match, including future nested routes).

### Empty states + page CTAs
- **D-20:** When there are no people: empty state **«Нет людей»** + short RU helper + CTA to add a person (and/or create debt) — same pattern family as `AccountList` empty.
- **D-21:** Empty person group: **«Нет долгов»** + **«Новый долг»** button.
- **D-22:** When people already exist, page header shows **both** global CTAs: **«Новый человек»** and **«Новый долг»**.

### Claude's Discretion
- Exact Dialog/Sheet component layout and shared confirm-step component extraction (as long as D-16 holds).
- Exact RU microcopy wording (titles, button labels) as long as direction labels (D-11) and empty-state intents (D-20–D-21) hold.
- Server Actions module layout under `src/app/debts/`; reuse Zod from `src/lib/validations/debts.ts`.
- Whether remaining on the row uses `remainingMinor` from loaded events or denormalized display fields — must match Phase 8 math.
- Visual density of person group headers vs account list rows.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope
- `.planning/PROJECT.md` — v1.1 debts side-ledger; **UI constitution for destructive confirms** (Context + Key Decisions)
- `.planning/REQUIREMENTS.md` — PERSON-01, PERSON-02, DEBT-01, DNAV-01
- `.planning/ROADMAP.md` — Phase 9 goal and success criteria
- `.planning/STATE.md` — current milestone position

### Prior phase decisions
- `.planning/phases/08-debts-schema-domain-math/08-CONTEXT.md` — ledger model, Restrict/Cascade, `updateDebtMeta` scope, no NW coupling
- `.planning/milestones/v1.0-phases/02-currencies-accounts/02-CONTEXT.md` — Dialog create/edit (D-18), Russian UI (D-20)

### Milestone research
- `.planning/research/ARCHITECTURE.md` — `/debts` routes sketch; actions under `src/app/debts/`
- `.planning/research/FEATURES.md` — people/debts table stakes; grouped list; empty states

### Existing code
- `prisma/schema.prisma` — `Person`, `Debt`, events; `onDelete: Restrict` / `Cascade`
- `src/lib/debts.ts` — `remainingMinor`, status helpers
- `src/lib/validations/debts.ts` — create/rename person, create debt, updateDebtMeta
- `src/components/nav.tsx` — nav links + active rules
- `src/components/accounts/AccountFormDialog.tsx` — create/edit dialog pattern
- `src/components/accounts/AccountList.tsx` — list + empty state; snapshot delete UX to migrate
- `src/app/accounts/actions.ts` — Server Actions + `deleteBalanceSnapshot` confirm migration target

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AccountFormDialog` / `CurrencyFormDialog` — Dialog + Server Action + field errors pattern for person/debt forms
- `AccountList` empty state — template for «Нет людей» / per-group empty
- `createPersonSchema`, `renamePersonSchema`, `createDebtSchema`, `updateDebtMetaSchema` — already ship shape validation
- `remainingMinor` / money format helpers — compact row remaining display
- `Nav` links array — add «Долги» and reorder per D-18

### Established Patterns
- Russian UI chrome; Dialog for create/edit (not separate routes)
- Server Actions under `src/app/<area>/actions.ts` with Zod + `revalidatePath`
- Money as BigInt minor units; display via `formatMinorToMajor`
- Destructive actions must follow D-16 (no `window.confirm`)

### Integration Points
- New `src/app/debts/page.tsx` + `actions.ts` + `src/components/debts/**`
- `src/components/nav.tsx` link order and `/debts` active prefix
- Snapshot delete path in accounts list/actions — confirm UX only (no schema change)
- Must not import debt modules into `net-worth.ts`, `historical-series.ts`, or `/` (DISOL-01)

</code_context>

<specifics>
## Specific Ideas

- User asked to record destructive-confirm rule in **project constitution** (`.planning/PROJECT.md`), not only Phase 9 context, so later phases inherit it.
- Nav order given explicitly as free text: Главная, Счета, Долги, Валюты (reorders existing Валюты/Счета relative positions).
- Discussion conducted in Russian for UX copy decisions; agent docs stay English.

</specifics>

<deferred>
## Deferred Ideas

- Repayments, close/write-off, reopen — **Phase 10**
- Remaining/repayment charts and «я должен»/«мне должны» primary totals hero — **Phase 11**
- Debt list filters/search, interest, cross-currency repayments, NW inclusion — out of milestone / future REQUIREMENTS
- Person-detail nested route (`/debts/[personId]`) — not chosen for Phase 9; revisit only if list UX fails

None folded from todos (no matching todos).

</deferred>

---

*Phase: 9-People + debts CRUD + nav*
*Context gathered: 2026-09-04*
