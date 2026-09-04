# Phase 09: People + debts CRUD + nav - Research

**Researched:** 2026-09-04
**Domain:** Next.js App Router CRUD UI + Server Actions over existing Prisma Person/Debt ledger
**Confidence:** HIGH

## Summary

Phase 9 is almost entirely product UI and Server Actions on top of Phase 8 persistence and pure math. Schema (`Person`, `Debt`, Cascade/Restrict), Zod shapes (`createPersonSchema`, `renamePersonSchema`, `createDebtSchema`, `updateDebtMetaSchema`), and `remainingMinor` already exist. Missing pieces: `/debts` page, debts components, nav link/order, and migration of balance-snapshot delete off `window.confirm`.

**Primary recommendation:** Mirror `accounts` patterns (`page.tsx` RSC load → client list/dialogs → `actions.ts` Zod + Prisma + `revalidatePath`), add «Долги» nav, compute remaining on the server for compact rows, and implement destructive confirms as an in-Dialog second step (no new packages, no `window.confirm`).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### List structure
- **D-01:** `/debts` shows debts **grouped by person** (person header, debts nested under). No flat-only list; no separate person-detail route in this phase.
- **D-02:** Debt rows are **compact**: direction label + remaining + currency code. Due date and note appear only in dialogs.
- **D-03:** List includes **all people**, including those with zero debts. Empty groups show «Нет долгов» plus create-debt CTA.
- **D-04:** Person groups sorted **A–Z by name**; within a group, debts **newest first** (by `id`).

#### Person create / manage
- **D-05:** People management on `/debts` **and** create-person inside debt create dialog (both paths).
- **D-06:** Inside debt create dialog, **new person = name field in the same dialog**; one submit creates person + debt when that path is used.
- **D-07:** Person **delete** control on every person group. If the person has debts: show Russian blocked error (PERSON-02 / Restrict). If none: proceed via destructive confirm (see D-16).
- **D-08:** Person **rename** via dialog from the group header (mirror `AccountFormDialog` edit pattern).

#### Debt create / edit
- **D-09:** After create, editable fields are **meta only**: direction, due date, note. Initial amount, currency, and person are **locked** (aligns with `updateDebtMetaSchema` / Phase 8 D-03).
- **D-10:** Edit dialog shows locked fields as **read-only** (not hidden).
- **D-11:** Direction labels in UI: **«Я должен»** / **«Мне должны»**.
- **D-12:** Creating a debt from a person group **pre-selects** that person; user may switch to another existing person or new-person name field.

#### Debt delete + destructive UX constitution
- **D-13:** Phase 9 **includes debt delete**. Cascade removes repayment/size-change events (Phase 8 D-21).
- **D-14:** Debt delete control lives **only inside the debt edit dialog** (not on the list row).
- **D-15:** Debt delete confirm copy **mentions cascade** — debt and all repayment/size-change history will be deleted.
- **D-16:** **App-wide constitution (also recorded in `.planning/PROJECT.md`):** never use `window.confirm` for destructive actions. Always use an **in-dialog second step** («точно удалить?» / equivalent) with Russian copy stating what is lost. Applies to debt delete, person delete, balance-snapshot delete, and all future destructive UX.
- **D-17:** Phase 9 **migrates** account balance-snapshot delete from `window.confirm` to the same second-step dialog pattern.

#### Nav
- **D-18:** Nav order: **Главная · Счета · Долги · Валюты**. Link «Долги» → `/debts`.
- **D-19:** «Долги» is active for **any pathname under `/debts`** (prefix match, including future nested routes).

#### Empty states + page CTAs
- **D-20:** When there are no people: empty state **«Нет людей»** + short RU helper + CTA to add a person (and/or create debt) — same pattern family as `AccountList` empty.
- **D-21:** Empty person group: **«Нет долгов»** + **«Новый долг»** button.
- **D-22:** When people already exist, page header shows **both** global CTAs: **«Новый человек»** and **«Новый долг»**.

### Claude's Discretion
- Exact Dialog/Sheet component layout and shared confirm-step component extraction (as long as D-16 holds).
- Exact RU microcopy wording (titles, button labels) as long as direction labels (D-11) and empty-state intents (D-20–D-21) hold.
- Server Actions module layout under `src/app/debts/`; reuse Zod from `src/lib/validations/debts.ts`.
- Whether remaining on the row uses `remainingMinor` from loaded events or denormalized display fields — must match Phase 8 math.
- Visual density of person group headers vs account list rows.

### Deferred Ideas (OUT OF SCOPE)
- Repayments, close/write-off, reopen — **Phase 10**
- Remaining/repayment charts and «я должен»/«мне должны» primary totals hero — **Phase 11**
- Debt list filters/search, interest, cross-currency repayments, NW inclusion — out of milestone / future REQUIREMENTS
- Person-detail nested route (`/debts/[personId]`) — not chosen for Phase 9; revisit only if list UX fails

None folded from todos (no matching todos).
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PERSON-01 | User can create, rename, and list people (counterparties) | `createPersonSchema` / `renamePersonSchema`; `/debts` grouped list; PersonFormDialog mirroring AccountFormDialog |
| PERSON-02 | User can delete a person only when that person has no debts | Schema `onDelete: Restrict`; pre-count debts + RU blocked message; confirm step when debt count is 0 |
| DEBT-01 | User can create and edit a debt with direction, currency, initial, optional due/note | `createDebtSchema` + `updateDebtMetaSchema`; create dialog full fields; edit dialog meta-only with locked read-only fields |
| DNAV-01 | Separate nav section «Долги» | Extend `nav.tsx` links per D-18/D-19 |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| List people + debts grouped | Frontend Server (SSR/RSC) | Browser / Client | RSC loads Prisma rows + formats remaining; client renders expand/dialogs |
| Person/debt CRUD mutations | API / Backend (Server Actions) | Browser / Client | Zod + Prisma in `"use server"`; Dialog forms call actions |
| Remaining display | API / Backend (compute on load) | — | Pure `remainingMinor` on server; serialize string for client (BigInt boundary) |
| Person delete guard | Database / Storage + Backend | Browser | Restrict FK + app pre-check for RU message |
| Debt delete cascade | Database / Storage | Backend | Prisma `onDelete: Cascade` on events; action calls `debt.delete` |
| Nav «Долги» active state | Browser / Client | — | `usePathname` prefix match like `/accounts` |
| Destructive confirm UX | Browser / Client | — | In-dialog second step; no browser `confirm` |
| DISOL-01 isolation | Frontend Server + Backend | — | Keep debts out of `net-worth.ts`, `historical-series.ts`, `/` |

## Project Constraints (from .cursor/rules/)

None found — `.cursor/rules/` is absent in this repo. Follow `AGENTS.md` / `CLAUDE.md` Next.js agent rules: read `node_modules/next/dist/docs/` before assuming Next APIs. Graphify/codegraph disabled (`graphify.enabled` false) — codebase research used direct file reads.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.3.4 (pinned) | App Router, RSC, Server Actions | Already scaffolded; accounts pattern proven `[VERIFIED: package.json:17-27]` |
| react / react-dom | 19.2.8 | Client Dialogs + `useActionState` | Matches AccountFormDialog `[VERIFIED: package.json:27-28]` |
| prisma / @prisma/client | 7.10.0 | Person/Debt persistence | Phase 8 models ready `[VERIFIED: package.json:19-27]` |
| zod | 4.5.4 | Action input validation | Existing debts schemas `[VERIFIED: package.json:34]` |
| vitest | 4.1.11 | Unit tests for actions | Existing `*.test.ts` pattern `[VERIFIED: package.json:47]` |
| @base-ui/react | (Dialog via shadcn) | Dialog primitive | `dialog.tsx` already uses it `[VERIFIED: src/components/ui/dialog.tsx:4]` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| better-sqlite3 + adapter | 13.0.3 / 7.10.0 | SQLite host | Existing `ensureSqlitePragmas` (`foreign_keys=ON`) |
| lucide-react | ^1.39.0 | Icons if needed | Optional; accounts uses Chevron for history |
| Tailwind / existing Button Input Label Select | — | Form chrome | Reuse; do not invent new design system |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| In-Dialog second-step confirm | shadcn AlertDialog (new UI file) | Extra component; no hard need — Dialog state machine satisfies D-16 |
| Compound createPerson+Debt action | Two sequential submits | Violates D-06 one-submit; race/orphan person |
| Catch-only P2003 for PERSON-02 | Pre-count debts | Prefer pre-count for clear RU copy; keep P2003 catch as belt |

**Installation:**

```bash
# No new packages required for Phase 9
```

**Version verification:** Project pins used (not registry latest). Registry `npm view prisma` currently reports `8.0.0-rc.13` — **do not upgrade**; stay on `7.10.0` `[VERIFIED: package.json:27]`.

## Package Legitimacy Audit

> Phase 9 installs **no new external packages**. Audit below covers already-pinned stack only (legitimacy seam flagged `too-new` on high-download packages — treat as non-blocking for already-approved pins).

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| next | npm | pinned 16.3.4 | ~55M/wk | github.com/vercel/next.js | SUS (too-new) | Approved — already in tree; no install |
| prisma | npm | pinned 7.10.0 | ~17M/wk | prisma | SUS (too-new) | Approved — already in tree; no install |
| zod | npm | pinned 4.5.4 | ~275M/wk | colinhacks/zod | SUS (too-new) | Approved — already in tree |
| vitest | npm | pinned 4.1.11 | ~100M/wk | vitest-dev | SUS (too-new) | Approved — already in tree |
| @base-ui/react | npm | existing | ~11M/wk | mui/base-ui | SUS (too-new) | Approved — already in tree |

**Packages removed due to [SLOP] verdict:** none  
**Packages flagged as suspicious [SUS]:** existing pins only — **no planner install checkpoint** (no new installs)

## Architecture Patterns

### System Architecture Diagram

```text
[Browser Nav «Долги»] --> GET /debts (RSC)
                              |
                              v
                    prisma.person.findMany
                    (include debts + events + currency)
                              |
                              v
                    remainingMinor(...) per debt
                    serialize BigInt -> string
                              |
                              v
                    DebtsList (client) grouped A-Z
                         |            |
                         v            v
              Person/Debt Dialogs   DestructiveConfirmStep
                         |
                         v
              src/app/debts/actions.ts
              Zod -> ensureSqlitePragmas -> Prisma
              revalidatePath("/debts")
                         |
         +---------------+----------------+
         |                                |
         v                                v
  Person delete: count debts==0?     Debt delete: debt.delete
  else RU blocked / Restrict         Cascade events
```

### Recommended Project Structure

```
src/app/debts/
├── page.tsx              # RSC: load people+debts, CTAs, empty
├── actions.ts            # create/rename/delete person; create/updateMeta/delete debt
└── actions.test.ts       # vitest mocks like accounts/actions.test.ts
src/components/debts/
├── DebtsList.tsx         # grouped list, empty states, group CTAs
├── PersonFormDialog.tsx  # create + rename
├── DebtFormDialog.tsx    # create (full) + edit (meta + locked + delete)
└── DestructiveConfirmStep.tsx  # optional shared second-step (discretion)
src/components/nav.tsx    # reorder + «Долги»
src/components/accounts/AccountList.tsx  # migrate snapshot delete confirm (D-17)
```

### Pattern 1: Account-style Server Action + Dialog

**What:** `"use server"` actions return `{ errors?, message?, success? }`; client `useActionState` + remount `formKey` on open.  
**When to use:** All person/debt forms.  
**Example:** Follow `AccountFormDialog` open/`formKey` remount `[VERIFIED: src/components/accounts/AccountFormDialog.tsx:296-328]`.

### Pattern 2: Compound person+debt create (D-06)

**What:** One submit path: either existing `personId` **or** new person name; never both. Use Prisma nested write or `$transaction`.  
**When to use:** Debt create dialog «новый человек» field.  
**Recommendation:** Nested write preferred for atomicity:

```typescript
// Source: https://www.prisma.io/docs/orm/prisma-client/queries/transactions
// Nested create — person + debt in one statement [CITED: prisma.io transactions]
await prisma.person.create({
  data: {
    name: newPersonName,
    debts: {
      create: {
        direction,
        currencyCode,
        initialAmountMinor,
        dueDate,
        note,
        status: "OPEN",
      },
    },
  },
});
```

`createDebtSchema` requires `personId` `[VERIFIED: src/lib/validations/debts.ts:62-80]` — quote:

```typescript
export const createDebtSchema = z
  .object({
    personId: z.coerce.number().int().positive(),
    direction: debtDirectionSchema,
    currencyCode: currencyCodeSchema,
    initialAmountMajor: z.string().trim().min(1, "Введите корректную сумму"),
    dueDate: optionalDueDateSchema,
    note: optionalNoteSchema,
  })
```

Planner must either (a) validate existing-person path with `createDebtSchema` and new-person path with `createPersonSchema` + debt fields minus `personId`, or (b) add a thin compound form schema in `validations/debts.ts`. Do not hand-roll money parsing — use `parseMajorToMinor` + currency scale check like accounts.

### Pattern 3: Remaining on list rows

**What:** Load `initialAmountMinor`, `sizeChanges.deltaMinor[]`, `repayments.amountMinor[]`; call `remainingMinor`.  
**When to use:** Compact debt rows (D-02).  
**Quote** `[VERIFIED: src/lib/debts.ts:21-28]`:

```typescript
export function remainingMinor(
  initialAmountMinor: bigint,
  sizeDeltas: readonly bigint[],
  repaymentAmounts: readonly bigint[],
): bigint {
  const principal = currentPrincipalMinor(initialAmountMinor, sizeDeltas);
  const paid = repaymentAmounts.reduce((sum, a) => sum + a, 0n);
  return principal - paid;
}
```

Serialize as string for client props (same BigInt RSC boundary as accounts).

### Pattern 4: Destructive confirm (D-16 / D-17)

**What:** Dialog local state `confirmingDelete: boolean`; first click «Удалить» → second step with RU copy; confirm calls action.  
**When to use:** Person delete, debt delete, balance-snapshot delete.  
**Anti-pattern:** `window.confirm` — still present in AccountList `[VERIFIED: src/components/accounts/AccountList.tsx:157-162]`:

```typescript
    const confirmed = window.confirm(
      `Удалить снимок за ${dateLabel}? Это нельзя отменить.`,
    );
```

### Anti-Patterns to Avoid

- **Importing `@/lib/debts` into NW surface:** Breaks DISOL-01; Phase 8 test already gates `net-worth.ts`, `historical-series.ts`, `page.tsx` `[VERIFIED: src/lib/debts.test.ts:284-294]`.
- **Editable initial/currency/person on edit:** Violates D-09 / `updateDebtMetaSchema` (no initial fields, `.strict()`) `[VERIFIED: src/lib/validations/debts.ts:86-93]`.
- **Flat debt list or `/debts/[personId]`:** Out of scope (D-01 / deferred).
- **Repayment UI or primary totals hero:** Phase 10/11.
- **New AlertDialog package solely for confirms:** Unnecessary; existing Dialog suffices.
- **Skipping `ensureSqlitePragmas`:** SQLite needs `PRAGMA foreign_keys=ON` for Restrict `[VERIFIED: src/lib/db.ts:26-31]`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Remaining math | Ad-hoc initial − payments | `remainingMinor` | Phase 8 size-change ledger |
| Money parse/format | Number/float | `parseMajorToMinor` / `formatMinorToMajor` | Scale + BigInt |
| Person/debt form chrome | Custom modal | shadcn Dialog + AccountFormDialog patterns | Proven RU UX |
| FK delete policy | Soft-delete tables | Schema Restrict/Cascade | Already migrated |
| Browser confirm | `window.confirm` | In-dialog second step | PROJECT constitution |
| Validation | Manual if-chains | Existing Zod schemas | Field errors + strict() |

**Key insight:** Phase 9 is wiring, not domain invention — reuse Phase 8 contracts and Phase 2–3 UI patterns.

## Common Pitfalls

### Pitfall 1: createDebtSchema vs D-06 new person
**What goes wrong:** Form posts empty `personId` and Zod fails; or person created then debt fails → orphan.  
**Why:** Schema requires `personId`.  
**How to avoid:** Branch validation + nested create / `$transaction`.  
**Warning signs:** Tests only cover existing-person path.

### Pitfall 2: PERSON-02 UX vs raw P2003
**What goes wrong:** Generic «не удалось» instead of clear blocked message.  
**Why:** Relying only on DB error.  
**How to avoid:** `prisma.debt.count({ where: { personId } })` before delete; map P2003 as fallback `[CITED: prisma.io referential-actions — Restrict → P2003]`.

### Pitfall 3: BigInt over RSC boundary
**What goes wrong:** Client serialization error.  
**Why:** Debt amounts are BigInt.  
**How to avoid:** `.toString()` on page like accounts creditLimit/snapshots.

### Pitfall 4: Nav order / active state regression
**What goes wrong:** Wrong highlight or order vs D-18.  
**Why:** Current links are Главная, Валюты, Счета `[VERIFIED: src/components/nav.tsx:7-11]`.  
**How to avoid:** Explicit array: `/`, `/accounts`, `/debts`, `/currencies/rates`; active for `/debts` via `pathname === href || pathname.startsWith(\`${href}/\`)` (same as accounts branch).

### Pitfall 5: Leaving RateList on window.confirm
**What goes wrong:** Constitution incomplete app-wide.  
**Why:** D-17 scopes Phase 9 migration to **balance-snapshot** only; RateList also uses `window.confirm` `[VERIFIED: grep src/components/currencies/RateList.tsx]`.  
**How to avoid:** Do not expand Phase 9 unless user asks; note leftover for later.

### Pitfall 6: Status on create
**What goes wrong:** Creating CLOSED debt.  
**Why:** Misunderstanding auto-close.  
**How to avoid:** Create with positive initial → remaining > 0 → default `OPEN` is correct; do not expose status in Phase 9 UI.

## Code Examples

### Nav links target shape

```typescript
// Target order per D-18 [ASSUMED layout; current source order differs]
const links = [
  { href: "/", label: "Главная" },
  { href: "/accounts", label: "Счета" },
  { href: "/debts", label: "Долги" },
  { href: "/currencies/rates", label: "Валюты" },
] as const;
```

Current source `[VERIFIED: src/components/nav.tsx:7-11]`:

```typescript
const links = [
  { href: "/", label: "Главная" },
  { href: "/currencies/rates", label: "Валюты" },
  { href: "/accounts", label: "Счета" },
] as const;
```

### Direction UI map (D-11)

```typescript
const DIRECTION_LABELS = {
  I_OWE: "Я должен",
  THEY_OWE: "Мне должны",
} as const;
// Enum values [VERIFIED: prisma/schema.prisma:30-33]
// enum DebtDirection { I_OWE THEY_OWE }
```

### deletePerson sketch

```typescript
await ensureSqlitePragmas();
const debtCount = await prisma.debt.count({ where: { personId } });
if (debtCount > 0) {
  return { message: "Нельзя удалить человека, пока есть долги" }; // RU wording discretion
}
await prisma.person.delete({ where: { id: personId } });
revalidatePath("/debts");
```

### deleteDebt sketch (Cascade)

```typescript
// Debt → repayments/sizeChanges onDelete: Cascade
// [VERIFIED: prisma/schema.prisma:65-78]
await prisma.debt.delete({ where: { id: debtId } });
revalidatePath("/debts");
```

### Empty state family

AccountList empty title `[VERIFIED: src/components/accounts/AccountList.tsx:293-299]`:

```typescript
          <h2 className="text-base font-semibold text-foreground">Нет счетов</h2>
          <p className="max-w-prose text-base text-muted-foreground">
            Создайте первый счёт, чтобы учитывать активы и кредиты.
```

Debts empty: same layout with «Нет людей» (D-20).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| writeOffMinor field | size-change events + remainingMinor | Phase 8 | Edit must not touch initial |
| Person detail routes in early research | Single `/debts` grouped list | Phase 9 CONTEXT D-01 | No nested routes |
| `window.confirm` deletes | In-dialog second step | Phase 9 constitution | Migrate snapshot delete |

**Deprecated/outdated:**
- Early FEATURES.md “block if open debts only” — PERSON-02 / Restrict is **any** debts, not only OPEN.
- Milestone research SUMMARY still mentions writeOff formula — superseded by Phase 8 CONTEXT.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Exact RU blocked-delete copy for PERSON-02 | Code Examples | Microcopy tweak only |
| A2 | Nested `person.create` + `debts.create` preferred over interactive `$transaction` | Pattern 2 | Either works; nested is simpler |
| A3 | RateList `window.confirm` stays until a later polish | Pitfall 5 | Constitution inconsistency until migrated |
| A4 | No AlertDialog component needed | Standard Stack | If UI-SPEC later requires AlertDialog, add via shadcn |

**If this table is empty:** N/A — assumptions listed above.

## Open Questions (RESOLVED)

1. **Shared DestructiveConfirmStep extraction?** — **RESOLVED**
   - What we know: Discretion allows shared component; D-16 must hold for three call sites (person, debt, snapshot).
   - Resolution: Extract `DestructiveConfirmStep` in **Plan 02** (≥2 call sites across Plans 02–04); Plan 04 reuses it for AccountList snapshot delete when import path is clean.

2. **Compound Zod schema location?** — **RESOLVED**
   - What we know: `createDebtSchema` needs `personId`.
   - Resolution: **Plan 03** uses action-local branch (existing `createPersonSchema` + debt fields minus `personId`); add thin exported `createDebtWithNewPersonSchema` only if tests need a named export.

3. **RateList confirm migration?** — **RESOLVED**
   - What we know: Out of D-17 scope.
   - Resolution: Leave RateList unchanged this phase (**Plan 04** / Pitfall 5); optional follow-up todo outside Phase 9 plans.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next/Vitest | ✓ | v24.5.0 | — |
| npm | scripts | ✓ | 10.9.3 | — |
| SQLite via Prisma | CRUD | ✓ | better-sqlite3 13.0.3 | — |
| ctx7 / Context7 MCP | External docs | ✗ | — | Local `node_modules/next/dist/docs` + WebSearch/WebFetch |
| codegraph/graphify | Project search | ✗ disabled | — | Direct Read/Grep |

**Missing dependencies with no fallback:** none for Phase 9 execution.

**Missing dependencies with fallback:** Context7 → local Next docs + Prisma official docs.

Step 2.6: External tools needed only for optional docs; runtime stack present.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 4.1.11 |
| Config file | (project default / existing vitest usage) |
| Quick run command | `npx vitest run src/app/debts/actions.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PERSON-01 | createPerson / renamePerson Zod+action success paths | unit | `npx vitest run src/app/debts/actions.test.ts` | ❌ Wave 0 |
| PERSON-02 | deletePerson blocked when debts>0; succeeds when 0 | unit | same | ❌ Wave 0 |
| DEBT-01 | createDebt parses amount; updateDebtMeta ignores initial smuggle | unit | same + existing `validations/debts.test.ts` | ⚠️ validations ✅; actions ❌ |
| DNAV-01 | Nav includes «Долги» href `/debts` and order | unit or smoke | optional nav test / manual | ❌ Wave 0 |
| D-16/D-17 | No `window.confirm` in AccountList snapshot delete | unit/grep | `rg window.confirm src/components/accounts` | ❌ Wave 0 |
| DISOL-01 | Keep existing isolation tests green | unit | `npx vitest run src/lib/debts.test.ts` | ✅ |

### Sampling Rate

- **Per task commit:** targeted vitest file(s) for touched module
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/app/debts/actions.test.ts` — PERSON-01/02, DEBT-01 action behaviors (mock prisma like accounts)
- [ ] Optional: nav link assertion test or plan manual DNAV-01 human-verify
- [ ] Snapshot confirm migration regression: assert AccountList has no `window.confirm`

*(Existing validations/debts.test.ts and debts.test.ts cover schemas/math — keep green; do not re-test remaining formula unless wiring wrong.)*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Local single-user app; no auth layer |
| V3 Session Management | no | — |
| V4 Access Control | no | Single-user; still validate IDs exist |
| V5 Input Validation | yes | Zod schemas + `.strict()` on meta update |
| V6 Cryptography | no | No new crypto |

### Known Threat Patterns for Next Server Actions + Prisma

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Smuggled initial amount on edit | Tampering | `updateDebtMetaSchema` omits initial; `.strict()` |
| Delete person with debts | Tampering / Elevation | Restrict + count pre-check |
| Direct POST to Server Action | Spoofing | Local app; still validate every field (Next docs warn actions are POST-reachable) `[CITED: next/dist/docs/.../07-mutating-data.md]` |
| Orphan / partial create | Tampering | Nested create / transaction for D-06 |
| XSS via note/name | Tampering | React text escaping; Zod max lengths |

## Sources

### Primary (HIGH confidence)

- `prisma/schema.prisma` — Person/Debt enums, Restrict/Cascade
- `src/lib/validations/debts.ts` — create/rename/createDebt/updateDebtMeta
- `src/lib/debts.ts` — remainingMinor
- `src/components/nav.tsx`, `AccountFormDialog.tsx`, `AccountList.tsx`, `accounts/actions.ts`
- `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md` — Server Actions
- Prisma referential actions docs — Restrict → P2003
- Prisma transactions docs — nested / `$transaction`
- `.planning/phases/09-people-debts-crud-nav/09-CONTEXT.md`, `08-CONTEXT.md`, `PROJECT.md` constitution

### Secondary (MEDIUM confidence)

- `.planning/research/ARCHITECTURE.md` / `FEATURES.md` / `STACK.md` (partially superseded by Phase 8/9 CONTEXT)

### Tertiary (LOW confidence)

- WebSearch community CRUD dialog articles (ignored for stack choices; in-repo patterns authoritative)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — reuse pinned tree; no new installs
- Architecture: HIGH — accounts mirror + locked CONTEXT
- Pitfalls: HIGH — schema/Zod gaps (D-06) and confirm migration verified in source

**Research date:** 2026-09-04  
**Valid until:** 2026-10-04 (stable stack; re-check if Next/Prisma pins change)
