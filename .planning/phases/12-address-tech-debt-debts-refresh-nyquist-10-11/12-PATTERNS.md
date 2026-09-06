# Phase 12: Address tech debt debts refresh + Nyquist 10–11 - Pattern Map

**Mapped:** 2026-09-06
**Files analyzed:** 15
**Analogs found:** 14 / 15

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/debts/DebtDetailDialog.tsx` | component | request-response | self (`onSuccess` shell) + `AccountFormDialog.tsx` success effect | exact |
| `src/components/debts/DebtFormDialog.tsx` | component | request-response | self + `AccountFormDialog.tsx` | exact |
| `src/components/debts/PersonFormDialog.tsx` | component | request-response | self + `AccountFormDialog.tsx` | exact |
| `src/components/debts/DebtsList.tsx` | component | request-response | self (`handleConfirmDelete`) | exact |
| `src/app/debts/page.tsx` | component (RSC) | request-response / transform | self remaining map + `src/lib/debts.ts` `assertStatusSynced` | exact |
| `src/lib/debts.ts` | utility | transform | self JSDoc on peer asserts | exact |
| `src/components/ui/destructive-confirm-step.tsx` | component | request-response | `src/components/debts/DestructiveConfirmStep.tsx` (move) + `src/components/ui/button.tsx` home | exact |
| `src/components/debts/DestructiveConfirmStep.tsx` | component (delete after move) | — | same file content → `ui/` | exact |
| `src/components/accounts/AccountList.tsx` | component | request-response | self import path only | exact |
| `src/components/accounts/AccountList.test.ts` | test | transform (source grep) | self | exact |
| `src/app/debts/actions.ts` | controller (Server Actions) | request-response | self `revalidatePath("/debts")` + DISOL comment | exact (keep) |
| `src/app/debts/actions.test.ts` | test | request-response | self `not.toHaveBeenCalledWith("/")` | exact (keep) |
| `.planning/phases/10-repayments-close-write-off/10-VALIDATION.md` | config | batch (docs) | `.planning/phases/08-debts-schema-domain-math/08-VALIDATION.md` + `07-03-PLAN.md` | exact |
| `.planning/phases/11-charts-primary-totals/11-VALIDATION.md` | config | batch (docs) | `08-VALIDATION.md` + `07-03-PLAN.md` | exact |
| `.planning/phases/12-address-tech-debt-debts-refresh-nyquist-10-11/12-VALIDATION.md` | config | batch (docs) | self draft + `08-VALIDATION.md` close pattern | exact |

## Pattern Assignments

### `src/components/debts/DebtDetailDialog.tsx` (component, request-response)

**Analog:** self shell `onSuccess` (lines 591–622) + `AccountFormDialog.tsx` success gate (lines 107–111)

**No `useRouter` / `router.refresh` in repo** — wire NEW import from `next/navigation` at success sites (RESEARCH Pattern 1). Prefer shell wrapper so all body paths (useActionState effect + confirm deletes + forgive) inherit one refresh.

**Imports pattern** (add alongside existing):

```typescript
import { useRouter } from "next/navigation";
```

**Core success pattern today** (lines 153–157, 180, 194, 213, 616):

```typescript
useEffect(() => {
  if (repayState?.success || sizeState?.success) {
    onSuccess();
  }
}, [repayState, sizeState, onSuccess]);

// confirm paths:
onSuccess();

// shell:
onSuccess={() => onOpenChange(false)}
```

**Wire pattern** (recommended — shell only):

```typescript
export function DebtDetailDialog(...) {
  const router = useRouter();
  // ...
  onSuccess={() => {
    router.refresh();
    onOpenChange(false);
  }}
}
```

**Error handling:** keep existing — only call `onSuccess` / refresh after `result.success`; failures set `actionError` and do not refresh.

---

### `src/components/debts/DebtFormDialog.tsx` (component, request-response)

**Analog:** self (lines 173–177, 205, 583) + `AccountFormDialog.tsx` (107–111)

**Core success pattern** (lines 173–177, 583):

```typescript
useEffect(() => {
  if (state?.success) {
    onSuccess();
  }
}, [state, onSuccess]);

// shell:
onSuccess={() => setOpen(false)}
```

**Wire pattern:**

```typescript
const router = useRouter();
onSuccess={() => {
  router.refresh();
  setOpen(false);
}}
```

Same for delete confirm path (`handleConfirmDelete` → `onSuccess()` after success) — inherits shell refresh.

---

### `src/components/debts/PersonFormDialog.tsx` (component, request-response)

**Analog:** self (lines 62–66, 153) + `AccountFormDialog.tsx`

**Core pattern** (lines 62–66, 153):

```typescript
useEffect(() => {
  if (state?.success) {
    onSuccess();
  }
}, [state, onSuccess]);

onSuccess={() => setOpen(false)}
```

**Wire:** same `router.refresh()` before `setOpen(false)` — person create/rename also `revalidatePath("/debts")` server-side.

---

### `src/components/debts/DebtsList.tsx` (component, request-response)

**Analog:** self `handleConfirmDelete` (lines 123–137)

**Core mutation pattern** (lines 123–137):

```typescript
function handleConfirmDelete() {
  startTransition(async () => {
    const formData = new FormData();
    formData.set("personId", String(person.id));
    const result = await deletePerson(formData);
    if (!result.success) {
      setConfirmOpen(false);
      setDeleteError(
        result.message ?? "Не удалось удалить. Попробуйте снова.",
      );
      return;
    }
    setConfirmOpen(false);
  });
}
```

**Wire pattern:**

```typescript
const router = useRouter();
// on success only:
setConfirmOpen(false);
router.refresh();
```

**Import update** (TD-UIHOME-01) — change line 11:

```typescript
import { DestructiveConfirmStep } from "@/components/ui/destructive-confirm-step";
```

**CLOSED bucketing** (lines 111–112) — keep status-based; do not switch to remaining-only:

```typescript
const openDebts = person.debts.filter((d) => d.status !== "CLOSED");
const closedDebts = person.debts.filter((d) => d.status === "CLOSED");
```

---

### `src/app/debts/page.tsx` (RSC page, request-response / transform)

**Analog:** self remaining compute (lines 83–117, 121–141) + `src/lib/debts.ts` `assertStatusSynced` (64–71)

**Imports pattern** — extend debts import (lines 7–11):

```typescript
import {
  assertStatusSynced,
  computeDebtPrimaryTotals,
  remainingMinor,
  type DebtPrimaryTotalsInput,
} from "@/lib/debts";
```

**Core remaining pattern today** (lines 83–96):

```typescript
debts: p.debts.map((d) => {
  const remaining = remainingMinor(
    d.initialAmountMinor,
    d.sizeChanges.map((s) => s.deltaMinor),
    d.repayments.map((r) => r.amountMinor),
  );
  return {
    // ...
    remainingMinor: remaining.toString(),
    status: d.status,
```

**Wire assert** immediately after `remaining` (both people map and totalsInputs map — or once and reuse):

```typescript
const remaining = remainingMinor(/* ... */);
assertStatusSynced(d.status, remaining);
```

**Error handling:** hard throw (`status desync: have …, want …`) — no coerce to `statusForRemaining` for display (RESEARCH open Q2).

---

### `src/lib/debts.ts` (utility, transform)

**Analog:** self JSDoc on `assertRepaymentAmount` / `assertSizeDelta` / `assertStatusSynced`

**Document `assertInitialImmutable`** (lines 108–118) — do NOT wire into update action (RESEARCH Q1). Extend JSDoc to point at Zod gate:

```typescript
/**
 * Reject mutation of create-time principal (DEBT-03 / D-03).
 * Size-change events are the only adjustment path after create.
 *
 * Runtime enforcement: `updateDebtMetaSchema` omits initial fields + `.strict()`
 * (`src/lib/validations/debts.ts`). This helper is the unit-test contract for that
 * invariant — not called from Server Actions (no proposed initial on update path).
 */
export function assertInitialImmutable(
  storedInitialMinor: bigint,
  proposedInitialMinor: bigint,
): void {
  // unchanged body
}
```

**Zod analog** (`src/lib/validations/debts.ts` lines 107–118) — cite in docs only:

```typescript
export const updateDebtMetaSchema = z
  .object({
    debtId: z.coerce.number().int().positive(),
    direction: debtDirectionSchema.optional(),
    dueDate: optionalDueDateSchema,
    note: optionalNoteSchema,
  })
  .strict();
```

Keep existing tests in `src/lib/debts.test.ts` (lines 117–138).

---

### `src/components/ui/destructive-confirm-step.tsx` (component, move)

**Analog:** `src/components/debts/DestructiveConfirmStep.tsx` (full file, lines 1–52) + UI home peers (`button.tsx`, `dialog.tsx`)

**Move pattern:** file content unchanged; new path under `src/components/ui/`; filename kebab-case to match `button.tsx` / `dialog.tsx` (not PascalCase filenames in `ui/`).

**Imports pattern** (from source lines 1–4):

```typescript
"use client";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
```

**Core presentational pattern** (lines 21–51) — copy verbatim:

```typescript
export function DestructiveConfirmStep({
  message,
  confirmLabel,
  backLabel = "Назад",
  pending = false,
  onConfirm,
  onBack,
}: DestructiveConfirmStepProps) {
  return (
    <div className="grid gap-4">
      <p className="text-base text-foreground">{message}</p>
      <DialogFooter>
        {/* outline Back + destructive Confirm; pending → «Удаление…» */}
      </DialogFooter>
    </div>
  );
}
```

**Delete** old `src/components/debts/DestructiveConfirmStep.tsx` after import graph updated.

**Consumers to update** (grep-verified):

| File | Old import |
|------|------------|
| `DebtsList.tsx` | `@/components/debts/DestructiveConfirmStep` |
| `DebtFormDialog.tsx` | same |
| `DebtDetailDialog.tsx` | same |
| `AccountList.tsx` | same |

New: `@/components/ui/destructive-confirm-step`

---

### `src/components/accounts/AccountList.tsx` (component, import only)

**Analog:** self line 8

**Change:**

```typescript
import { DestructiveConfirmStep } from "@/components/ui/destructive-confirm-step";
```

No behavior change to `startTransition` delete confirm (lines 157+).

---

### `src/components/accounts/AccountList.test.ts` (test, source grep)

**Analog:** self (lines 1–23)

**Current checks** match symbol name only — still pass after relocate if import uses `DestructiveConfirmStep`. Optional strengthen:

```typescript
expect(listSrc).toMatch(/@\/components\/ui\/destructive-confirm-step/);
expect(listSrc).not.toMatch(/@\/components\/debts\/DestructiveConfirmStep/);
```

---

### `src/app/debts/actions.ts` (Server Actions — keep)

**Analog:** self — already correct for TD-REFRESH-01 server half

**Core pattern** (example createRepayment close + comment lines 442–444, 591):

```typescript
/**
 * ... revalidatePath("/debts") only — never dashboard root (DISOL-01 / T-10-04).
 */
revalidatePath("/debts");
return { success: true, message: "..." };
```

**MUST NOT** add `revalidatePath("/")`. No `router.refresh` here (client-only).

---

### `src/app/debts/actions.test.ts` (test — keep / optional extend)

**Analog:** self DISOL assertions (e.g. lines 88–89):

```typescript
expect(revalidatePath).toHaveBeenCalledWith("/debts");
expect(revalidatePath).not.toHaveBeenCalledWith("/");
```

Client `router.refresh` is not unit-tested here unless planner adds component/source grep. Prefer:

```bash
rg -n 'router\.refresh' src/components/debts
```

---

### `10-VALIDATION.md` / `11-VALIDATION.md` (config, docs reconcile)

**Analog:** `.planning/phases/08-debts-schema-domain-math/08-VALIDATION.md` frontmatter + Validation Audit; procedure from `.planning/milestones/v1.0-phases/07-address-tech-debt-locf-consolidation-nyquist-3-6/07-03-PLAN.md` Task 1

**Target frontmatter** (`08-VALIDATION.md` lines 1–10):

```yaml
status: validated
nyquist_compliant: true
wave_0_complete: true
validated: "2026-09-06"   # execution date
```

**Validation Audit append pattern** (`08-VALIDATION.md` lines 95–105):

```markdown
## Validation Audit 2026-09-06

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

**Evidence:** `npm test` → PASS. State A: Wave 0 ❌/⬜ rows were stale vs filesystem; listed test files already on disk. No auditor spawn — zero MISSING.
```

**Procedure (07-03-PLAN):** run `npm test` green first; flip File Exists / Status columns for present files; check Wave 0 boxes; keep historical task IDs; do not invent product tests unless path truly absent.

---

### `12-VALIDATION.md` (config — already seeded draft)

**Analog:** self draft in phase dir + close like `08-VALIDATION.md` after TD work green

Update map rows for TD-REFRESH / TD-STATUS / TD-UIHOME when wired; flip frontmatter only after suite + grep evidence.

---

## Shared Patterns

### Client refresh after debt mutations

**Source:** RESEARCH Next.js `useRouter` (no in-repo analog) + Dialog `onSuccess` shells  
**Apply to:** `DebtDetailDialog`, `DebtFormDialog`, `PersonFormDialog`, `DebtsList` deletePerson success

```typescript
import { useRouter } from "next/navigation";

const router = useRouter();
// only after success:
router.refresh();
```

Pair with existing server `revalidatePath("/debts")`. Never refresh as substitute for revalidating `/`.

### DISOL-01 (no dashboard revalidate)

**Source:** `src/app/debts/actions.ts` comments + `actions.test.ts`  
**Apply to:** any touch of actions during refresh work

```typescript
expect(revalidatePath).not.toHaveBeenCalledWith("/");
```

### Status sync hard assert on read

**Source:** `src/lib/debts.ts` lines 63–71  
**Apply to:** `src/app/debts/page.tsx` after every `remainingMinor` used for props/totals

```typescript
export function assertStatusSynced(
  status: DebtStatus,
  remaining: bigint,
): void {
  const expected = statusForRemaining(remaining);
  if (status !== expected) {
    throw new Error(`status desync: have ${status}, want ${expected}`);
  }
}
```

### Shared UI component home

**Source:** `src/components/ui/*.tsx` kebab filenames + `"use client"` for interactive primitives  
**Apply to:** relocated confirm step

Export name stays `DestructiveConfirmStep`; path kebab under `ui/`.

### Evidence-first Nyquist reconcile

**Source:** Phase 07 plan + Phase 08 VALIDATION Audit  
**Apply to:** 10, 11, then 12 VALIDATION.md

Frontmatter flip + map columns + Validation Audit citing `npm test`; auditor only if true MISSING.

### Source-grep smoke tests

**Source:** `AccountList.test.ts` lines 4–22  
**Apply to:** optional path assertion after relocate; optional `router.refresh` grep tests

```typescript
const listSrc = readFileSync("src/components/accounts/AccountList.tsx", "utf8");
expect(listSrc).toMatch(/DestructiveConfirmStep/);
```

## No Analog Found

| File / Concern | Role | Data Flow | Reason |
|----------------|------|-----------|--------|
| `useRouter` + `router.refresh()` | hook / client cache | request-response | Zero matches under `src/`. Copy Next 16.3 docs pattern from RESEARCH; place calls in existing `onSuccess` / delete success sites |

## Metadata

**Analog search scope:** `src/components/debts/`, `src/components/accounts/`, `src/components/ui/`, `src/app/debts/`, `src/lib/debts*`, `.planning/phases/08*`, `.planning/milestones/v1.0-phases/07*`  
**Files scanned:** ~93 under `src/` (+ phase VALIDATION docs); `rg router.refresh|useRouter` → 0 hits  
**Tracked-source gate:** all named analogs verified via `git ls-files`  
**Pattern extraction date:** 2026-09-06
