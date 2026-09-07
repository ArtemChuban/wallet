# Phase 15: Plan vs actual + overdue - Research

**Researched:** 2026-09-07
**Domain:** Income side-ledger actual CRUD + overdue chrome + inline variance on `/income`
**Confidence:** HIGH (repo patterns + schema + domain helpers); MEDIUM (amber token exact oklch values — discretionary)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Separate row CTA opens a dedicated fact dialog — not via «Изменить» definition and not a DebtDetail-style detail sheet. — **Reversibility:** costly — new dialog + actions surface separate from IncomeFormDialog.
- **D-02:** Fact form fields: **actual amount** + **actual date** required; **note** optional (schema already has note).
- **D-03:** First-fill defaults: amount = planned amount for that slot; **actualAsOf = Moscow today** always (not plan date).
- **D-04:** Re-open same dialog to edit existing actual; **delete actual** via DestructiveConfirmStep (slot empty → may become overdue again). Matches Phase 13 D-09 upsert/delete.
- **D-05:** Keep Phase 14 shape: **one row per definition**; fact/overdue chrome applies only to **next open** slot (`nextOpenPlannedAsOf` / one-time plan key). No multi-slot rows, no expand/chevron feed. — **Reversibility:** costly — multi-slot later rewrites list data shape.
- **D-06:** Multiple overdue months on recurring: fill **FIFO one-by-one** via next open (helper already returns earliest unfilled, including past).
- **D-07:** After successful fill, UI advances to the new next open. One-time with actual: row stays as filled («получено») with fact edit/delete. Recurring filled months do **not** remain as separate list rows.
- **D-08:** Overdue row: text badge **«заполни»** + primary CTA button **«Заполни»**.
- **D-09:** Semantic color = **warning amber** (need-to-fill, not destructive error).
- **D-10:** Next open with plan ≥ Moscow today: calm outline CTA **«Внести факт»**, **no** «заполни» badge.
- **D-11:** Sort stays Phase 14 **nearest planned date** within Person group (overdue naturally sorts early; no separate overdue-first pass).
- **D-12:** Variance is an **inline row view** when an actual exists: plan amount, actual amount, delta. **No Recharts** in Phase 15 (chart refinements = Future Requirements).
- **D-13:** Delta in the **source currency** only — no primary FX conversion here (Phase 16 / CPTY-01).
- **D-14:** Delta formula **actual − plan**; RU copy: «больше плана» / «меньше плана» / «как план» when zero.
- **D-15:** Show Δ only for slots that **have an actual**. Next open without actual: no variance numbers.
- **D-16:** Fact dialog shows **read-only** plan date + plan amount for the slot being filled/edited (so user sees what they variance against).
- **D-17:** CTA labels: overdue create **«Заполни»**; non-overdue create **«Внести факт»**; edit mode **«Изменить факт»**; delete confirm Russian copy states fact will be removed and slot may show overdue again.
- **D-18:** One-time filled row shows **plan + actual + Δ** (same variance chrome as D-12).
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

### Deferred Ideas (OUT OF SCOPE)
- Per-Person income stats / FX LOCF honesty — Phase 16
- NW forecast overlay + isolation suite — Phase 17
- Nav badge for overdue income count — Future Requirements
- Variance chart refinements (Recharts) beyond inline MVP — Future Requirements
- Multi-slot history / browse-edit all past recurring actuals — later
- Pause / `endAsOf` on recurring; destination-account on actual — Future / out of scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ACT-01 | Record actual amount + date independently; plan fields stay for variance | Prisma actual models already separate (`amountMinor`/`actualAsOf` vs plan); upsert actions + `IncomeFactDialog`; plan fields never overwritten by fact write |
| ACT-02 | Plan date before Moscow today + no actual → overdue «заполни» | Reuse `isIncomeOverdue(plannedAsOf, hasActual, today)`; list badge + CTA «Заполни»; today from `calendarDateToday("Europe/Moscow")` |
| ACT-03 | Plan vs actual variance on «Доходы» | Inline Δ (`actual − plan`) source currency; one-time filled rows (D-18); fact dialog read-only plan (D-16); **no Recharts** |
</phase_requirements>

## Summary

Phase 15 layers **fact recording**, **overdue chrome**, and **inline variance** on the existing `/income` Person-grouped list. Domain math and Prisma actual tables already exist from Phase 13; Phase 14 ships definition CRUD without fact UX. Implementation is mostly **server actions + Zod + one new dialog + list chrome**, not new packages or schema migrations.

Critical product geometry: chrome applies only to the **next open** slot (D-05/D-06). Recurring filled months leave the list (D-07), so a recurring row’s displayed slot is **never** `hasActual=true`. List-level Δ for ACT-03 therefore lands primarily on **one-time filled** rows (D-18) plus **dialog** plan-vs-fact context (D-16). Recurring FIFO still satisfies ACT-01/ACT-02 via next-open fill + overdue badge.

**Primary recommendation:** Add `IncomeFactDialog` + four actual actions (`upsert*` / `delete*` per kind) using Prisma compound upsert; extend page join to load actual fields for one-time + next-open join for recurring overdue/CTA; amber via new `--warning` CSS vars (no Badge package); omit past-recurring-edit UI.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Upsert/delete income actual | API / Backend (Server Actions) | Database | Zod + Prisma writes; `revalidatePath("/income")` only |
| Occurrence key / overdue predicate | Shared pure lib (`src/lib/income.ts`) | Frontend Server | Already implemented; UI injects Moscow today |
| Next-open FIFO slot identity | Shared pure lib | Frontend Server (page map) | `nextOpenPlannedAsOf` already drives Phase 14 list |
| Fact dialog + overdue/variance chrome | Browser / Client | — | Client dialogs; RSC passes serializable row props |
| Plan immutability after one-time actual | API / Backend | Shared lib | Existing `assertOneTimePlanImmutable` on definition update |
| BalanceSnapshot / NW LOCF | **Must not touch** | — | ISO-01 mindset; file-scan tests already guard actions |
| Recharts variance chart | Deferred (Future) | — | D-12 forbids chart this phase |

## Project Constraints (from .cursor/rules/)

`.cursor/rules/` **absent**. Actionable workspace directives:

- Next.js APIs may differ from training — read `node_modules/next/dist/docs/` before novel App Router usage. [VERIFIED: node_modules/next/dist/docs/01-app/02-guides/server-actions.md]
- Prefer **codegraph** for project search — binary present; index currently weak on `src/` TS symbols (queries returned no hits for `isIncomeOverdue`). Research used Read/Grep. [VERIFIED: shell `codegraph status` + failed queries]
- Before UAT: `.planning/OPERATOR.md` + Orca (`workflow.uat_driver: orca-cli`). [VERIFIED: .planning/config.json]
- Graphify disabled. [VERIFIED: `gsd_run graphify status` → `disabled: true`]
- Milestone stack lock: **zero new npm packages**. [CITED: .planning/research/STACK.md]

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | `16.3.4` | RSC page + Server Actions | Existing `/income` |
| Prisma | `7.10.0` | Actual upsert/delete | Existing models + compound unique |
| Zod | `4.5.4` | Actual payload validation | Mirror `validations/income.ts` / debts repayment |
| Vitest | `4.1.11` | Unit + file-scan tests | Existing suite |
| React / shadcn Dialog/Button/Input/Label | in-repo | Fact dialog UI | Same as IncomeFormDialog |

### Supporting (reuse — do not add)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@/lib/income` | in-repo | `isIncomeOverdue`, `nextOpenPlannedAsOf` | Overdue + FIFO slot |
| `@/lib/dates` | in-repo | `calendarDateToday("Europe/Moscow")`, `formatAsOfDisplay` | Today + display |
| `@/lib/money` | in-repo | `parseMajorToMinor` / `formatMinorToMajor` | Amount parse/format |
| `DestructiveConfirmStep` | in-repo | Delete actual confirm | Never `window.confirm` |
| Recharts / `@/components/ui/chart` | installed | — | **Do not use** (D-12) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Dedicated `IncomeFactDialog` (locked D-01) | Fold into IncomeFormDialog / DebtDetailDialog | Rejected — costly mixing definition vs fact |
| Inline Δ (locked D-12) | Recharts chart | Deferred Future Requirements |
| Prisma `upsert` on compound unique | find+create / find+update | Upsert matches BalanceSnapshot + D-09 re-record |
| `--warning` CSS vars | Tailwind `amber-*` only / `npx shadcn add badge` | Vars match official theming; Badge component **absent** — skip registry add |

**Installation:**

```bash
# Phase 15: ZERO new packages
npm test
```

**Version verification:** Pins from `package.json` this session — `next@16.3.4`, `prisma@7.10.0`, `zod@4.5.4`, `vitest@4.1.11`. [VERIFIED: package.json via node require]

## Package Legitimacy Audit

> Phase installs **no** new external packages.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| *(none)* | — | — | — | — | — | N/A |

**Packages removed due to [SLOP] verdict:** none  
**Packages flagged as suspicious [SUS]:** none  

Do **not** add: badge registry package (unless UI-SPEC later requires), date libs, money libs, chart wrappers.

## Architecture Patterns

### System Architecture Diagram

```
  User on /income
       │
       ▼
  ┌─────────────────────────────────────────────────────────┐
  │ RSC page (force-dynamic)                                │
  │  calendarDateToday(Europe/Moscow)                       │
  │  load defs + actuals → nextOpen / one-time join         │
  │  map: overdue = isIncomeOverdue(slot, hasActual, today) │
  └───────────────┬───────────────────────────┬─────────────┘
                  │                           │
                  ▼                           ▼
        IncomeList chrome              IncomeFactDialog
        - «заполни» badge              - RO plan date/amount
        - CTA Заполни/Внести факт      - amount + actualAsOf + note
        - «Изменить» definition        - upsert / delete actual
        - Δ when hasActual (1x)              │
                  │                           ▼
                  │              Server Actions (actions.ts)
                  │              Zod → parseMajorToMinor
                  │              prisma.*Actual.upsert / delete
                  │              revalidatePath("/income") ONLY
                  │                           │
                  └─────────────── refresh ───┘
                                  │
                                  ▼
                         SQLite actual tables
                         (no BalanceSnapshot)
```

### Recommended Project Structure

```
src/app/income/
├── page.tsx                 # JOIN actual fields; compute overdue/hasActual/Δ props
├── actions.ts               # + upsert/delete actual exports
└── actions.test.ts          # + actual action mocks + isolation scan
src/lib/validations/income.ts  # + upsert/delete actual schemas
src/lib/income.ts              # optional: varianceDeltaMinor helper (pure)
src/lib/income.test.ts         # optional: delta copy helper tests
src/components/income/
├── IncomeList.tsx             # badge + fact CTA + variance chrome
├── IncomeFactDialog.tsx       # NEW
├── IncomeFormDialog.tsx       # untouched except coexistence
└── income-ui.test.ts          # + заполни / DestructiveConfirm / no window.confirm
src/app/globals.css            # + --warning / --warning-foreground (+ @theme)
# NO: prisma migrate (models exist)
# NO: Recharts on /income
```

### Pattern 1: Compound unique upsert (re-record)

**What:** One actual per `(parentId, plannedAsOf)`; re-open = upsert.  
**When to use:** Always for ACT-01 record/edit.  
**Example:**

```typescript
// Source: repo BalanceSnapshot upsert + generated WhereUniqueInput
// [VERIFIED: src/app/accounts/actions.ts:253-257]
// [VERIFIED: src/generated/prisma/models/RecurringIncomeActual.ts:257-270]
await prisma.recurringIncomeActual.upsert({
  where: {
    recurringIncomeId_plannedAsOf: {
      recurringIncomeId,
      plannedAsOf, // slot key — not actualAsOf
    },
  },
  update: { amountMinor, actualAsOf, note: note ?? null },
  create: {
    recurringIncomeId,
    plannedAsOf,
    amountMinor,
    actualAsOf,
    note: note ?? null,
  },
});
```

One-time compound key name: `oneTimeIncomeId_plannedAsOf`. [VERIFIED: src/generated/prisma/models/OneTimeIncomeActual.ts:259]

### Pattern 2: Overdue from pure predicate + Moscow today

**What:** UI never invents overdue logic.  
**Example:**

```typescript
// Source: src/lib/income.ts:75-81
export function isIncomeOverdue(
  plannedAsOf: string,
  hasActual: boolean,
  today: string,
): boolean {
  return plannedAsOf < today && !hasActual;
}
```

Page already uses `calendarDateToday("Europe/Moscow")`. [VERIFIED: src/app/income/page.tsx:13]

### Pattern 3: Fact dialog separate from definition dialog

**What:** Row keeps «Изменить» → `IncomeFormDialog`; new CTA → `IncomeFactDialog`.  
**When to use:** Always (D-01, D-20).

### Anti-Patterns to Avoid

- **Copy debt repayment future-date ban:** `createRepayment` rejects `asOfDate > today` — **forbidden** for income (D-19 allows future `actualAsOf`). [VERIFIED: src/app/debts/actions.ts:470-475]
- **Write BalanceSnapshot / `revalidatePath("/")`:** Isolation file-scan already fails this. [VERIFIED: src/app/income/actions.test.ts:409-415]
- **Multi-slot expand feed:** Deferred (D-05).
- **Recharts on Доходы:** Deferred (D-12).
- **Destructive color for overdue:** Use warning amber, not `--destructive` (D-09).
- **Trust client for plan fields on upsert:** Server loads definition; `plannedAsOf` is slot key; do not mutate definition plan columns in actual actions.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Overdue boolean | Custom date compare in JSX | `isIncomeOverdue` | Already tested; inject today |
| Next overdue month FIFO | Custom month walk in UI | `nextOpenPlannedAsOf` | Horizon + freeze already correct |
| Re-record semantics | Delete+create or unique-ignore hacks | Prisma `upsert` on compound unique | Matches D-09 + BalanceSnapshot |
| Money parse | Float / manual scale | `parseMajorToMinor` + currency.scale | Existing pattern |
| Delete confirm | `window.confirm` | `DestructiveConfirmStep` | Project constitution |
| Warning chrome | New npm badge lib | CSS `--warning` + span chip | Zero packages; Badge.tsx absent |

**Key insight:** Phase 15 is **wiring**, not inventing domain — mistakes come from copying Debt repayment constraints or expanding list shape.

## Discretion Recommendations

| Area | Recommendation | Rationale |
|------|----------------|-----------|
| Past recurring actual edit | **Omit** thin affordance this phase | CONTEXT prefers defer; next-open FIFO covers fill path; multi-slot later |
| Amber token | Add `--warning` / `--warning-foreground` + `@theme inline --color-warning*` in `globals.css`; chip = `<span className="… bg-warning/15 text-warning-foreground …">заполни</span>` | Official shadcn theming extension; no Badge component installed [CITED: ui.shadcn.com/docs/theming] |
| Action names | `upsertRecurringIncomeActual`, `upsertOneTimeIncomeActual`, `deleteRecurringIncomeActual`, `deleteOneTimeIncomeActual` | Upsert = D-09 re-record; delete-by-id mirrors `deleteRepayment` |
| Zod field names | `actualAmountMajor`, `actualAsOf`, `plannedAsOf`, `recurringIncomeId` / `oneTimeIncomeId`, optional `note` | Parallel to `plannedAmountMajor` + repayment `amountMajor`/`asOfDate` |
| ACT-03 recurring list Δ | Rely on dialog RO plan + amount fields; list Δ on **one-time filled** only | Geometric consequence of D-05/D-07 |

## Common Pitfalls

### Pitfall 1: Page does not load one-time actuals

**What goes wrong:** One-time never shows overdue/variance/edit fact.  
**Why it happens:** `page.tsx` includes `actuals` only under `recurringIncomes`, and only `{ recurringIncomeId, plannedAsOf }` — not amount/date/id. One-time `include` has **no** actuals. [VERIFIED: src/app/income/page.tsx:20-34]  
**How to avoid:** Include full actual rows for both kinds; for recurring join actual matching `nextPlannedAsOf` key (usually none); for one-time join by `plannedAsOf`.  
**Warning signs:** ACT-02/03 fail on one-time in UAT.

### Pitfall 2: Using `actualAsOf` as upsert unique key

**What goes wrong:** Duplicate slots or wrong overwrite.  
**Why it happens:** Confusing fact date with occurrence key.  
**How to avoid:** Unique is always `plannedAsOf` (plan slot). Schema: `@@unique([recurringIncomeId, plannedAsOf])`. [VERIFIED: prisma/schema.prisma:141-151]

### Pitfall 3: Recurring list expected to show Δ after fill

**What goes wrong:** Planner adds multi-slot or keeps filled month on list.  
**Why it happens:** Misreading ACT-03 vs D-07.  
**How to avoid:** After upsert, `nextOpenPlannedAsOf` advances; filled month gone; Δ on one-time + dialog.

### Pitfall 4: Default `actualAsOf` = plan date

**What goes wrong:** Violates D-03.  
**How to avoid:** Default `calendarDateToday("Europe/Moscow")` always on first-fill.

### Pitfall 5: Copy repayment “no future dates”

**What goes wrong:** Blocks valid D-19 futures.  
**How to avoid:** Date schema = `YYYY-MM-DD` only; no today upper bound.

### Pitfall 6: Overdue uses destructive styling

**What goes wrong:** Looks like error/delete.  
**How to avoid:** Warning amber token; keep destructive for deletes only.

## Code Examples

### Upsert + revalidate (prescribed)

```typescript
// Source: pattern from src/app/accounts/actions.ts:253-266 + Next server-actions docs
"use server";
import { revalidatePath } from "next/cache";

export async function upsertRecurringIncomeActual(
  _prev: IncomeActionState,
  formData: FormData,
): Promise<IncomeActionState> {
  // Zod safeParse → resolve currency scale from parent def → parseMajorToMinor
  // prisma.recurringIncomeActual.upsert({ where: { recurringIncomeId_plannedAsOf: … } })
  revalidatePath("/income");
  // NEVER revalidatePath("/")
  return { success: true, message: "Сохранено" };
}
```

### Variance (pure)

```typescript
// Prescribed helper — actual − plan (D-14)
export function incomeVarianceMinor(
  actualAmountMinor: bigint,
  plannedAmountMinor: bigint,
): bigint {
  return actualAmountMinor - plannedAmountMinor;
}

// RU copy: delta > 0n → «больше плана»; < 0n → «меньше плана»; 0n → «как план»
```

### Overdue chrome gate

```typescript
const overdue = isIncomeOverdue(row.nextPlannedAsOf, row.hasActual, today);
// overdue → badge «заполни» + Button «Заполни»
// !overdue && !hasActual → outline «Внести факт»
// hasActual (one-time) → «Изменить факт» + inline Δ
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Definition-only `/income` (Phase 14) | Definition + fact dialog + overdue/Δ | Phase 15 | ACT-01..03 |
| Research sketch Recharts variance | Inline row Δ MVP | CONTEXT D-12 | Chart → Future |
| DebtDetail event timeline | Separate fact dialog, no detail sheet | D-01 | Simpler list |

**Deprecated/outdated:**
- Treating ACT-03 as Recharts requirement this phase.
- Phase 14 UI-SPEC “no amber until Phase 15” — now lift that ban for overdue only.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Exact oklch for `--warning` may follow shadcn theming sample (`oklch(0.84 0.16 84)` etc.) | Discretion / Color | UI-SPEC may tune; visual only |
| A2 | Omitting past-recurring-edit is acceptable for ACT-01/03 | Discretion | User may want to fix old months — defer to later phase |
| A3 | List Δ for recurring is not required when D-05/D-07 hold | Architecture | If product expects recurring Δ on list, need multi-slot or last-fill residual — contradicts locked D-07 |

**If A3 conflicts with stakeholder reading of ACT-03:** still honor D-05/D-07; satisfy ACT-03 via one-time + dialog (locked).

## Open Questions

1. **UI-SPEC for Phase 15**
   - What we know: Phase 14 UI-SPEC deferred overdue; `workflow.ui_phase: true`.
   - What's unclear: Exact spacing/copy table for fact dialog — expect `/gsd-ui-phase` after research/plan.
   - Recommendation: Planner leaves UI chrome details to UI-SPEC; research locks behavior + tokens.

2. **Dialog live Δ preview while typing**
   - What we know: D-16 requires RO plan fields; D-14 formula clear.
   - What's unclear: Whether live Δ in dialog is required or only post-save list.
   - Recommendation: Include live Δ in dialog (cheap; helps recurring ACT-03).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vitest / Next | ✓ | v24.5.0 | — |
| npm | scripts | ✓ | 10.9.3 | — |
| Vitest | unit tests | ✓ | 4.1.11 | — |
| Prisma / SQLite | actual writes | ✓ | 7.10.0 | — |
| Orca CLI | UAT later | not probed | — | Operator doc; not Wave 0 |

**Missing dependencies with no fallback:** none for implementation.  
**Step 2.6:** External tools limited to existing Node toolchain — no new services.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest `4.1.11` |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test -- src/lib/income.test.ts src/components/income/income-ui.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ACT-01 | Upsert actual does not mutate plan columns; upsert by plannedAsOf | unit (actions mock) | `npm test -- src/app/income/actions.test.ts` | ✅ extend |
| ACT-01 | Zod rejects non-positive actual amount | unit | same + validations | ❌ Wave 0 schemas |
| ACT-02 | `isIncomeOverdue` matrix | unit | `npm test -- src/lib/income.test.ts` | ✅ already |
| ACT-02 | List source contains «заполни» / warning class; not destructive for badge | file-scan | `npm test -- src/components/income/income-ui.test.ts` | ✅ extend |
| ACT-03 | variance helper / RU copy branches | unit | `src/lib/income.test.ts` | ❌ Wave 0 if helper added |
| ACT-03 | One-time filled row chrome copy present | file-scan | income-ui.test.ts | ❌ Wave 0 |
| ISO light | actions never BalanceSnapshot / `revalidatePath("/")` | file-scan | actions.test.ts | ✅ keep |

### Sampling Rate

- **Per task commit:** `npm test -- src/lib/income.test.ts src/app/income/actions.test.ts src/components/income/income-ui.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work` (Orca UAT)

### Wave 0 Gaps

- [ ] Extend `src/lib/validations/income.ts` with actual upsert/delete schemas + unit coverage (or action tests covering safeParse failures)
- [ ] Extend `src/app/income/actions.test.ts` for upsert/delete actual + keep isolation scan
- [ ] Extend `src/components/income/income-ui.test.ts` for «заполни», «Внести факт», «Изменить факт», DestructiveConfirm on fact delete, ban `window.confirm`
- [ ] Optional: `incomeVarianceMinor` tests if helper extracted
- [ ] Framework install: none

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Local single-user app (existing) |
| V3 Session Management | no | — |
| V4 Access Control | no* | *No multi-user; still validate IDs exist server-side |
| V5 Input Validation | yes | Zod `.strict()` + positive major refine + ISO date regex |
| V6 Cryptography | no | — |

### Known Threat Patterns for income actual writes

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malformed amount / scale overflow | Tampering | Zod + `parseMajorToMinor` + currency.scale check |
| Client spoofs parent id | Tampering | `findUnique` parent before upsert; fail closed |
| Client sends wrong `plannedAsOf` for one-time | Tampering | Server asserts `plannedAsOf === definition.plannedAsOf` |
| Accidental NW pollution | Tampering | No BalanceSnapshot imports; file-scan test; `revalidatePath("/income")` only |
| XSS via note | Tampering | React text binding; Zod max length 500 (existing note schema) |

## Sources

### Primary (HIGH confidence)

- `src/lib/income.ts` — `isIncomeOverdue`, `nextOpenPlannedAsOf`
- `prisma/schema.prisma` — actual models + `@@unique`
- `src/generated/prisma/models/RecurringIncomeActual.ts` — `recurringIncomeId_plannedAsOf`
- `src/app/income/page.tsx` / `IncomeList.tsx` / `actions.ts` / `validations/income.ts`
- `src/app/accounts/actions.ts` — upsert compound unique pattern
- `node_modules/next/dist/docs/01-app/02-guides/server-actions.md` — `revalidatePath` RYW
- `package.json` pins

### Secondary (MEDIUM confidence)

- [ui.shadcn.com/docs/theming](https://ui.shadcn.com/docs/theming) — optional `--warning` tokens
- `.planning/research/STACK.md` — zero new packages
- Phase 13/14 CONTEXT + RESEARCH + 14-UI-SPEC

### Tertiary (LOW confidence)

- WebSearch / GitHub discussion #8986 — shadcn lacks built-in warning by default (corroborates theming doc)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — reuse only; pins verified
- Architecture: HIGH — schema/helpers/actions patterns verified; ACT-03 geometry documented
- Pitfalls: HIGH — page join gap + repayment-date copy verified in source

**Research date:** 2026-09-07  
**Valid until:** 2026-10-07 (stable in-repo patterns; UI-SPEC may refine amber/copy)
