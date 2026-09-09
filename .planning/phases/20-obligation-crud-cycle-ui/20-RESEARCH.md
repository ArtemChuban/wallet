# Phase 20: Obligation CRUD + cycle UI - Research

**Researched:** 2026-09-09
**Domain:** Next.js App Router UI + Server Actions for credit grace schedule/obligations (RU copy)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
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

### Deferred Ideas (OUT OF SCOPE)
None new — discussion stayed inside Phase 20. Forecast (21), GRACEISO (22), APR/min/cash remain roadmap/OOS.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CYCLE-02 | User can see cycle instances for a credit account (current / next due) | Drive list from `resolveCurrentAndNext` + persisted rows; CTA for windows without rows (D-05); schedule fields in grace dialog (D-03/D-04) |
| OBL-01 | User can manually enter amount due by end of interest-free window | Amount dialog + `createCreditGraceObligationSchema` → `amountMinor`; no placeholders (D-09 / Phase 19 D-06) |
| OBL-02 | User can record early repayment / close | «Оплачено» → DestructiveConfirmStep + editable `closedAsOf`; reopen CLOSED→OPEN with confirm (D-11/D-12); no `window.confirm` |
| OBL-03 | When due passed without close, UI highlights | `isGraceOverdue(dueAsOf, today)` on OPEN rows + grace-button mark; do not alarm whole account row (D-07) |
| UX-01 | Distinguish snapshot debt vs grace amount (RU) | Locked vocab Phase 18 D-14/D-15; disclaimer by amount field; no snapshot debt inside grace dialog (D-16); prefer «Задолженность» on account card copy where credit debt shown |
</phase_requirements>

## Summary

Phase 20 is **UI + write-path CRUD** on top of Phase 19 schema/math. `updateGraceSchedule` already persists dual DOM; obligation Zod schemas exist but **no create/update/close/reopen actions and no grace UI**. Planner should add a dedicated grace dialog opened from the FIAT_CREDIT row in `AccountList`, wire schedule save at the top of that dialog, merge `resolveCurrentAndNext` candidates with Prisma obligations for the hybrid list, and mirror Income/Debts dialog + `DestructiveConfirmStep` patterns for amount and close/reopen.

Do **not** invent placeholder obligation rows, put DOM fields in `AccountFormDialog`, alarm the whole account row for overdue, call `window.confirm`, write `BalanceSnapshot`, or wire Капитал «Прогноз» (Phase 21).

**Primary recommendation:** Extend `src/app/accounts/actions.ts` + `accounts/page.tsx` props; ship `CreditGraceDialog` (+ amount sibling dialog) under `src/components/accounts/`; reuse pure helpers + existing Zod; source-scan tests for confirm/copy + action unit tests for CRUD isolation.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Grace dialog chrome / cycle list / overdue highlight | Browser / Client | Frontend Server (RSC props) | Client dialogs like Debts/Income; `today` + schedule/obligations from RSC |
| Dual DOM schedule save | API / Backend (`updateGraceSchedule`) | Browser (form) | Already exists; UI only moves into grace dialog |
| Obligation create/update/close/reopen | API / Backend (new server actions) | Browser (dialogs) | Zod + Prisma; never BalanceSnapshot |
| Cycle candidates (current/next) | API / Backend (pure `credit-grace.ts`) | Browser (CTA merge) | Pure candidates only — UI adds CTAs, never auto-inserts DB rows |
| Overdue predicate | API / Backend (`isGraceOverdue`) | Browser (warn chrome) | Calendar compare vs injected `today` |
| Snapshot «Задолженность» display | Browser (`AccountList` / LOCF) | — | Stays on account card; grace dialog disclaimer only (D-16) |
| Forecast membership | — (Phase 21) | — | Keep obligation fields stable; no chart work here |

## Project Constraints (from .cursor/rules/ + AGENTS.md)

`.cursor/rules/` — **none found** this session.

From `AGENTS.md` / workspace:

- Next.js in this repo may differ from training data — read `node_modules/next/dist/docs/` before Next-touching code. Verified Next **16.3.4** docs under `node_modules/next/dist/docs/01-app/02-guides/server-actions.md` and `forms.md`.
- Before UAT / `/gsd-verify-work`: read `.planning/OPERATOR.md`; agent drives `npm run dev` + Orca (`orca-ide` / `orca`).
- User search preference: use **codegraph** for project search (used this session).
- `workflow.nyquist_validation: true` and `security_enforcement: true` in `.planning/config.json` — Validation Architecture + Security Domain required.
- ROADMAP Phase 20 **UI hint: yes** — expect `/gsd-ui-phase` / UI-SPEC before or with plan waves.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | **16.3.4** `[VERIFIED: package.json / npm view]` | RSC page + Server Actions | Existing Wallet pattern |
| React | **19.2.8** `[VERIFIED: npm view react version]` | `useActionState`, client dialogs | Same as Debts/Income |
| Zod | **4.5.4** `[VERIFIED: npm view zod version]` | Write-path validation | `createCreditGraceObligationSchema` / `updateCreditGraceObligationSchema` already in-repo |
| Prisma / SQLite | pinned in repo (Phase 19) | `CreditGraceObligation` CRUD | Schema already shipped |
| Vitest | **4.1.11** (package.json) / registry latest separate | Action + UI source tests | `vitest.config.ts` includes `src/**/*.test.ts` |
| In-repo UI | Dialog / Button / Input / Label / `DestructiveConfirmStep` | Confirm + forms | No new component library |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `src/lib/credit-grace.ts` | in-repo | `listCycleWindows`, `resolveCurrentAndNext`, `isGraceOverdue`, `dueAsOfForCycle` | List merge + overdue + server due freeze |
| `src/lib/money.ts` | in-repo | `parseMajorToMinor` / `formatMinorToMajor` | Amount dialog ↔ `amountMinor` |
| `src/lib/dates.ts` / `calendarDateToday` | in-repo | Moscow today for overdue + default `closedAsOf` | Inject `today` from page (same as AccountList) |
| lucide-react | existing | Optional chevron for collapsed CLOSED | Match AccountList expand pattern if needed |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Separate grace dialog (D-01) | Fields inside `AccountFormDialog` | **Rejected** — locked D-01/D-03 |
| Auto-create DB rows for current/next | CTA-only until amount entered | **Rejected** — D-05 / Phase 19 D-06/D-12 |
| `window.confirm` for close | DestructiveConfirmStep | **Rejected** — D-11 / project pattern |
| New npm date/UI packages | Existing Dialog + dates helpers | Unnecessary |
| Dedicated `/grace` route | Dialog on `/accounts` | Heavier navigation; debts/income stay dialog-first |

**Installation:**

```bash
# No new packages — reuse next / react / zod / vitest / prisma already in package.json
```

**Version verification:** `npm view next|zod|vitest version` run 2026-09-09 → next 16.3.4, zod 4.5.4, vitest registry 5.0.0 (repo pins 4.1.11 — keep repo pin).

## Package Legitimacy Audit

> Phase installs **no** new external packages. Seam check run on already-pinned `zod` only for completeness.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| zod (already installed 4.5.4) | npm | existing pin | ~247M/wk | github.com/colinhacks/zod | SUS (too-new signal) | **Reuse existing pin — do not reinstall**; no planner install task |

**Packages removed due to [SLOP] verdict:** none  
**Packages flagged as suspicious [SUS]:** zod flagged by seam on age only while already in tree with huge downloads — **no new install**; no `checkpoint:human-verify` for install. Do not add other packages.

## Architecture Patterns

### System Architecture Diagram

```text
[/accounts RSC]
  load Account + dual DOM + creditGraceObligations
  today = calendarDateToday()
        │
        ▼
[AccountList]──credit row──►[Грейс button]──►[CreditGraceDialog]
                                │                      │
                     overdue mark on button            ├─ Schedule form → updateGraceSchedule
                     (not whole row)                   │     (hint: rows not recalc)
                                                       │
                                                       ├─ Hybrid list:
                                                       │     resolveCurrentAndNext(schedule, today)
                                                       │       ⊕ persisted OPEN/CLOSED
                                                       │     missing window → CTA «ввести сумму»
                                                       │     CLOSED behind «Показать оплаченные»
                                                       │     OPEN overdue → warn + interest hint
                                                       │
                                                       ├─ Amount dialog → create / update OPEN
                                                       │     Zod amountMajor → parseMajorToMinor
                                                       │     server freezes dueAsOf via dueAsOfForCycle
                                                       │
                                                       └─ «Оплачено» / reopen → DestructiveConfirmStep
                                                             (+ editable closedAsOf on close)
                                                             no window.confirm
                                                             never BalanceSnapshot
```

### Recommended Project Structure

```
src/
├── app/accounts/
│   ├── page.tsx              # EXTEND: select DOM + obligations; pass to AccountList
│   ├── actions.ts            # EXTEND: create/update/close/reopen obligation actions
│   └── actions.test.ts       # EXTEND: CRUD + no BalanceSnapshot calls
├── components/accounts/
│   ├── AccountList.tsx       # EXTEND: grace button + overdue mark (FIAT_CREDIT only)
│   ├── CreditGraceDialog.tsx # NEW: schedule + hybrid list + close/reopen steps
│   └── CreditGraceAmountDialog.tsx  # NEW (or nested): amount create/edit
├── components/ui/
│   └── destructive-confirm-step.tsx  # OPTIONAL: children / pendingLabel for close date
├── lib/
│   ├── credit-grace.ts       # reuse (no math rewrite)
│   └── validations/credit-grace.ts  # reuse schemas; add unit tests Wave 0
└── (no net-worth / historical-series / nw-forecast edits)
```

### Pattern 1: Hybrid candidate + persisted list (CYCLE-02 / D-05)

**What:** Compute `{current, next}` with `resolveCurrentAndNext`. Index persisted obligations by `cycleStartAsOf`. Render OPEN rows + CTAs for candidate windows lacking a row; never insert empty Prisma rows.

**When to use:** Grace dialog body after schedule exists.

**Example:**

```typescript
// Source: src/lib/credit-grace.ts:130-170 (verbatim behavior)
const { current, next } = resolveCurrentAndNext(schedule, today);
// schedule null → { current: null, next: null }
// Gap after due before next statement → current null, next = upcoming
const byStart = new Map(obligations.map((o) => [o.cycleStartAsOf, o]));

function rowFor(window: { cycleStartAsOf: string; dueAsOf: string } | null) {
  if (!window) return null;
  const existing = byStart.get(window.cycleStartAsOf);
  if (existing) return { kind: "row" as const, obligation: existing };
  return { kind: "cta" as const, window }; // «ввести сумму» — no DB write yet
}
```

### Pattern 2: Server Action + useActionState (OBL-01/02)

**What:** Match existing accounts/income/debts: `(prev, formData) => ActionState`, Zod `safeParse`, `revalidatePath("/accounts")` (+ `/` only if already done by schedule action — keep consistent with `updateGraceSchedule`).

**When to use:** All grace mutations.

**Example:**

```typescript
// Source pattern: src/app/accounts/actions.ts:192-263 + validations/credit-grace.ts:101-115
"use server";
export async function createCreditGraceObligation(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const validated = createCreditGraceObligationSchema.safeParse({
    accountId: formData.get("accountId"),
    cycleStartAsOf: formData.get("cycleStartAsOf"),
    dueAsOf: formData.get("dueAsOf"),
    amountMajor: formData.get("amountMajor"),
    status: "OPEN",
    note: formData.get("note"),
  });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }
  // assert FIAT_CREDIT + assertAccountHasGraceSchedule
  // dueAsOf = dueAsOfForCycle(cycleStartAsOf, account.dueDayOfMonth) // server SoT
  // amountMinor = parseMajorToMinor(amountMajor, currency.scale)
  // prisma.creditGraceObligation.create — catch P2002 → RU duplicate message
  // never prisma.balanceSnapshot.*
  revalidatePath("/accounts");
  revalidatePath("/");
  return { success: true, message: "Сохранено" };
}
```

### Pattern 3: DestructiveConfirmStep + editable closedAsOf (OBL-02 / D-11)

**What:** Stock `DestructiveConfirmStep` is message + footer only (`src/components/ui/destructive-confirm-step.tsx:6-51`). Close needs an editable date. Prefer **optional `children`** (date field between message and footer) + optional `pendingLabel` (today hardcodes «Удаление…»).

**When to use:** Early close and reopen confirms.

### Anti-Patterns to Avoid

- **DOM fields in AccountFormDialog** — violates D-03.
- **Inventing OPEN rows without amount** — violates D-05 / Phase 19 D-06.
- **Alarming entire account row for overdue** — violates D-07; confuse with «Задолженность».
- **Recomputing stored `dueAsOf` on DOM edit** — violates Phase 19 D-04/D-05; UI hint only (D-13).
- **Preset 21/15 autofill** — violates D-15.
- **Showing snapshot debt inside grace dialog** — violates D-16.
- **`window.confirm`** — violates D-11; RateList still has one — do not copy.
- **Writing BalanceSnapshot from grace actions** — GRISO preview; Phase 22 hardens.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cycle current/next | Custom month loops in UI | `resolveCurrentAndNext` | Already tested for gap/inclusive due |
| Overdue | New status enum | `isGraceOverdue` + OPEN | Phase 18/19: overdue is calendar, not DB status |
| Amount/minor conversion | Ad-hoc float | `parseMajorToMinor` / Zod amountMajor | Same as debts/income |
| Confirm UX | `window.confirm` | `DestructiveConfirmStep` | Project lock |
| Schedule pairing | Loose two independent fields | `updateGraceScheduleSchema` | Both-null-or-both-set |
| Due at create | Trust client-only due | `dueAsOfForCycle` on server | Tamper-resistant freeze |

**Key insight:** Phase 19 already solved calendar truth; Phase 20 is composition + Russian chrome + CRUD discipline.

## Common Pitfalls

### Pitfall 1: Auto-creating obligation placeholders
**What goes wrong:** Empty/zero rows pollute forecast Phase 21 and unique key space.  
**Why it happens:** Desire to “show” current/next as DB entities.  
**How to avoid:** CTA «ввести сумму» until amount dialog succeeds (D-05).  
**Warning signs:** `create` without `amountMajor` / nullable amountMinor.

### Pitfall 2: Overdue mark on whole credit row
**What goes wrong:** User thinks «Задолженность» / LOCF debt is wrong.  
**Why it happens:** Copy income list row-level urgency.  
**How to avoid:** Warn inside grace dialog + mark **grace button only** (D-07).  
**Warning signs:** `text-destructive` on account name / LocfDisplay.

### Pitfall 3: Client-supplied `dueAsOf` diverges after DOM edit
**What goes wrong:** New create uses stale candidate due while schedule changed.  
**Why it happens:** UI cached window from previous schedule.  
**How to avoid:** Server recomputes `dueAsOf` via `dueAsOfForCycle` at create; refresh candidates after schedule save.  
**Warning signs:** Stored due not matching next-month DOM for **new** rows.

### Pitfall 4: Clear schedule while OPEN exists
**What goes wrong:** Action rejects; UI looks broken.  
**Why it happens:** Clear control always visible.  
**How to avoid:** Disable clear or show existing action message when OPEN count > 0; CLOSED may remain (D-14).  
**Warning signs:** User clears both DOMs with open «К оплате» rows.

### Pitfall 5: DestructiveConfirmStep pending copy «Удаление…» on close
**What goes wrong:** Close/reopen shows delete-ish pending text.  
**Why it happens:** Component hardcodes pending label.  
**How to avoid:** Add `pendingLabel` prop or local footer for grace confirms.  
**Warning signs:** UX review flags «Удаление…» during «Оплачено».

### Pitfall 6: Duplicate cycle create instead of update
**What goes wrong:** P2002 or silent second attempt.  
**Why it happens:** CTA still shown after create; race.  
**How to avoid:** After create, list uses row; update path for OPEN amount (D-10 / Phase 19 D-16); surface RU P2002 message.  
**Warning signs:** Unique constraint errors in UI as generic failure.

### Pitfall 7: Gap day UI empty for “current”
**What goes wrong:** After due before next statement, `current` is null — only `next` CTA.  
**Why it happens:** Locked Pattern 3 in Phase 19 tests.  
**How to avoid:** Still list any overdue OPEN persisted rows (sort D-08); do not invent current.  
**Warning signs:** Overdue OPEN missing because UI only renders `current`/`next`.

## Code Examples

### Overdue chrome (OBL-03)

```tsx
// Source pattern: src/components/income/IncomeList.tsx:118-121 (warning badge)
import { isGraceOverdue } from "@/lib/credit-grace";

const overdue =
  obligation.status === "OPEN" &&
  isGraceOverdue(obligation.dueAsOf, today);

// Row: bg-warning/15 text-warning-foreground + short interest hint (Phase 18 D-07)
// AccountList grace button: small warn mark when any OPEN overdue — not whole row (D-07)
```

### OPEN sort (D-08)

```typescript
function sortOpen(a: Obl, b: Obl, today: string): number {
  const ao = isGraceOverdue(a.dueAsOf, today) ? 0 : 1;
  const bo = isGraceOverdue(b.dueAsOf, today) ? 0 : 1;
  if (ao !== bo) return ao - bo;
  if (a.dueAsOf !== b.dueAsOf) return a.dueAsOf < b.dueAsOf ? -1 : 1;
  return a.cycleStartAsOf < b.cycleStartAsOf ? -1 : 1;
}
```

### RU vocabulary (UX-01 / Phase 18)

Locked strings (use verbatim):

- Snapshot debt: **«Задолженность»** (Phase 18 D-14) — AccountList today still says `долг` at `AccountList.tsx:76` `[VERIFIED: src/components/accounts/AccountList.tsx:75-77]` — change credit LOCF debt label to «Задолженность» for UX-01 on this surface; do not paste debt amount into grace dialog (D-16).
- Grace amount: **«Платёж для беспроцентного»** (D-15)
- Schedule: **«Дата выписки»** / **«Оплатить до»** (D-17)
- Status UX: **«К оплате»** / **«Оплачено»** (D-18)

Discretion microcopy (recommend; planner may tweak in UI-SPEC):

- Empty schedule hint: «Укажите день выписки и день оплаты — как в банке. Циклы появятся после сохранения.»
- DOM non-recalc: «Смена дат не пересчитывает уже сохранённые обязательства.»
- Amount disclaimer: «Это не «Задолженность» по снимку баланса — сумма с выписки для беспроцентного периода.»
- Overdue interest: «Срок оплаты прошёл — банк может начислить проценты.»
- Button chrome: **«Грейс»** (short); dialog title **«Беспроцентный период»**.
- Close confirm: «Отметить обязательство оплаченным?» + date field «Дата оплаты».
- Reopen confirm: «Вернуть в «К оплате»? Дата оплаты будет очищена.»

### Page data extension

```typescript
// Source today: src/app/accounts/page.tsx:14-16 — Account include currency only
// Extend select/include:
prisma.account.findMany({
  include: {
    currency: true,
    creditGraceObligations: { orderBy: { cycleStartAsOf: "desc" } },
  },
  orderBy: { name: "asc" },
});
// Serialize BigInt amountMinor → string for client props (same as LOCF)
// Pass statementDayOfMonth, dueDayOfMonth on AccountListItem
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No grace UI | Separate grace dialog + list button | Phase 20 | CYCLE-02…UX-01 |
| Sole duration-days SoT | Dual DOM + frozen due | Phase 18–19 | UI must not autofill 21/15 as truth engine |
| Research overlay A dip | A′ NW-neutral (Phase 21) | Phase 18 | Do not foreshadow dip copy in Phase 20 UI |
| AccountForm owns all credit fields | Form = name/limit; grace = dialog | Phase 20 D-01/D-03 | Split surfaces |

**Deprecated/outdated:**

- Autofill bank 21/15 into empty DOM fields — documentation only (D-15).
- Deriving grace amount from BalanceSnapshot — REQUIREMENTS OOS.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Optional `children` / `pendingLabel` on DestructiveConfirmStep is acceptable vs fully custom confirm footer | Pattern 3 / Pitfall 5 | UI-SPEC may prefer zero shared-component change — then duplicate footer layout locally |
| A2 | Renaming AccountList `долг` → «Задолженность» is in Phase 20 UX-01 scope; dashboard «долг» can wait | UX-01 | User wants dashboard renamed same wave — expand tasks |
| A3 | `revalidatePath("/")` on obligation CRUD (mirror schedule action) is desired even without forecast UI | Pattern 2 | Extra RSC work; could revalidate `/accounts` only until Phase 21 |

**If empty table were required:** not applicable — three discretion assumptions logged.

## Open Questions (RESOLVED)

1. **Amount dialog nesting vs sibling** — **RESOLVED:** sibling `CreditGraceAmountDialog` (IncomeFact pattern); close/reopen stay steps inside `CreditGraceDialog` (20-01 / 20-02 plans).
2. **Dashboard «долг» label** — **RESOLVED:** AccountList + grace dialog only this phase; dashboard rename out of scope (20-03 / RESEARCH A2).
3. **Close action shape** — **RESOLVED:** thin wrappers `closeCreditGraceObligation` / `reopenCreditGraceObligation` over update semantics (20-02).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | build/test | ✓ | v24.5.0 | — |
| npm | scripts | ✓ | 10.9.3 | — |
| Vitest (repo) | Nyquist tests | ✓ | 4.1.11 (package.json) | — |
| Next.js | app | ✓ | 16.3.4 | — |
| SQLite / Prisma | CRUD | ✓ | existing | — |
| Orca browser | UAT later | probe at verify | — | Operator.md fallback ask human |

**Missing dependencies with no fallback:** none for implementation.  
**Missing dependencies with fallback:** Orca only needed at verify-work — not plan-block.

Step 2.6: external tools present for code/test; no new services.

## Validation Architecture

> `workflow.nyquist_validation` is **true** in `.planning/config.json`.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.11 |
| Config file | `vitest.config.ts` (`src/**/*.test.ts`, node env) |
| Quick run command | `npx vitest run src/app/accounts/actions.test.ts src/lib/validations/credit-grace.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CYCLE-02 | Hybrid list: candidates + CTA, no placeholder create | unit (pure merge helper optional) + UI source | `npx vitest run src/lib/credit-grace.test.ts` + new UI test | ✅ math / ❌ UI |
| OBL-01 | create with amountMinor; reject without schedule | unit action | `npx vitest run src/app/accounts/actions.test.ts` | ❌ Wave 0 (extend) |
| OBL-02 | close sets CLOSED+closedAsOf; reopen clears; no window.confirm | unit + UI source | actions.test + components test | ❌ Wave 0 |
| OBL-03 | isGraceOverdue drives highlight; button mark not whole row | unit + UI source | credit-grace.test + AccountList/grace UI test | ✅ predicate / ❌ UI |
| UX-01 | RU labels / disclaimer present; no debt duplicate in grace dialog | UI source scan | new `credit-grace-ui.test.ts` | ❌ Wave 0 |
| GRISO preview | grace actions never call balanceSnapshot | unit | actions.test expect not called | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** targeted vitest files touched
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/lib/validations/credit-grace.test.ts` — schema pairing / positive amount / closedAsOf refine
- [ ] Extend `src/app/accounts/actions.test.ts` — create / update / close / reopen / P2002 / no `balanceSnapshot` / no schedule when OPEN clear already covered
- [ ] `src/components/accounts/credit-grace-ui.test.ts` (or AccountList.test extend) — DestructiveConfirmStep import, no `window.confirm`, locked RU strings, grace button only on credit
- [ ] Optional pure `mergeGraceListRows` unit if planner extracts merge from component

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no (single-user local app) | — |
| V3 Session Management | no | — |
| V4 Access Control | soft | Validate account exists + `FIAT_CREDIT` + schedule before writes |
| V5 Input Validation | yes | Zod `create`/`update`/`updateGraceScheduleSchema`; coerce ids |
| V6 Cryptography | no | — |

### Known Threat Patterns for grace CRUD

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Crafted FormData (bad DOM / amount / status) | Tampering | Zod safeParse; reject partial schedule; positive amount |
| Create without schedule | Tampering | `assertAccountHasGraceSchedule` |
| Client spoofed `dueAsOf` | Tampering | Server `dueAsOfForCycle` at create |
| Duplicate cycle insert | Tampering | @@unique + P2002 → RU error; prefer update |
| Accidental BalanceSnapshot write | Tampering / Integrity | Actions only touch `creditGraceObligation` / Account DOM; test asserts |
| Clear schedule with OPEN | Elevation of privilege vs data rules | Existing openCount gate in `updateGraceSchedule` |
| XSS via note | XSS | React text nodes; Zod max 500 trim |

## Sources

### Primary (HIGH confidence)

- `[VERIFIED: .planning/phases/20-obligation-crud-cycle-ui/20-CONTEXT.md]` — D-01…D-16 locks
- `[VERIFIED: src/lib/credit-grace.ts:1-170]` — helpers; overdue `dueAsOf < today`
- `[VERIFIED: src/lib/validations/credit-grace.ts:48-132]` — create/update Zod + assert schedule
- `[VERIFIED: src/app/accounts/actions.ts:188-263]` — `updateGraceSchedule` OPEN-block clear
- `[VERIFIED: prisma/schema.prisma:43-46,107-130]` — `GraceObligationStatus` OPEN\|CLOSED; obligation model
- `[VERIFIED: src/components/accounts/AccountList.tsx:36-48,75-77,245-271]` — list item shape; `долг` label; no grace button yet
- `[VERIFIED: src/app/accounts/page.tsx:9-98]` — does not load DOM/obligations yet
- `[VERIFIED: src/components/ui/destructive-confirm-step.tsx:6-51]` — confirm API; pending «Удаление…»
- `[VERIFIED: node_modules/next/dist/docs/01-app/02-guides/server-actions.md]` — revalidatePath + single response
- `[VERIFIED: node_modules/next/dist/docs/01-app/02-guides/forms.md]` — useActionState + Zod safeParse pattern
- `[CITED: Phase 18 CONTEXT D-14…D-19]` — RU vocabulary
- `[CITED: Phase 19 CONTEXT D-04…D-16]` — frozen due, no placeholders, clear rules

### Secondary (MEDIUM confidence)

- IncomeList warning badge pattern `[VERIFIED: src/components/income/IncomeList.tsx:118-121]`
- IncomeFactDialog amount dialog pattern `[VERIFIED: structure via Read]`
- DebtDetailDialog DestructiveConfirmStep steps `[VERIFIED: structure via Read]`

### Tertiary (LOW confidence)

- WebSearch Zod FormData articles — align with in-repo pattern only `[ASSUMED` community blogs; prefer local Next docs + existing actions]
- classify-confidence seam returned LOW for webfetch even with `--verified` — treated local Next docs as `[VERIFIED: path]` via Read, not seam tier

## Metadata

**Confidence breakdown:**

- Standard stack: **HIGH** — versions from package.json / npm view; no new deps
- Architecture: **HIGH** — CONTEXT locks + existing Debts/Income/Account patterns + Phase 19 math
- Pitfalls: **HIGH** — derived from locked decisions + gap-day tests + confirm component limits

**Research date:** 2026-09-09  
**Valid until:** 2026-10-09 (stable app patterns; revisit if Next major or schema changes)

### Discretion recommendations (for planner)

1. Button label **«Грейс»**; dialog title **«Беспроцентный период»**.
2. Amount = **sibling dialog**; close/reopen = **steps inside** grace dialog.
3. Actions live in **`src/app/accounts/actions.ts`** (mocks already stub `creditGraceObligation.create/update`).
4. Extend `DestructiveConfirmStep` with optional `children` + `pendingLabel` for close date UX.
