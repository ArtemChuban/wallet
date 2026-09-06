# Phase 12: Address tech debt: debts refresh + Nyquist 10–11 - Research

**Researched:** 2026-09-06
**Domain:** Next.js App Router cache refresh + debts domain invariants + Nyquist VALIDATION.md reconcile
**Confidence:** HIGH (codebase + Next 16.3 local docs + Phase 07 precedent); MEDIUM (exact client `router.refresh` necessity vs Server Action RSC payload alone)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
No CONTEXT.md for this phase. Locked scope is **only** from `.planning/v1.1-MILESTONE-AUDIT.md` `tech_debt` + ROADMAP Phase 12 goal. Do not invent product UX preferences.

Authoritative actionable debt (aggregate + per-phase YAML):

1. Nyquist: validate phases 10 and 11 (`VALIDATION.md` draft → validated).
2. Unused asserts: `assertInitialImmutable`, `assertStatusSynced` (tests-only) — wire or document.
3. UI home: `DestructiveConfirmStep` under `components/debts/` used by accounts — relocate or document.
4. Fragile refresh: `revalidatePath`-only after mutations — add `router.refresh` or equivalent.
5. Status vs remaining: DebtsList CLOSED bucket on DB `status`; remaining recomputed on page — desync risk.
6. Phase 09: RateList still uses `window.confirm` — **explicitly out of D-17 scope** (do not expand into RateList polish).

### Claude's Discretion
- Wire vs document for unused asserts (pick one clear outcome per helper).
- Relocate vs document for `DestructiveConfirmStep` UI home.
- Exact refresh mechanism (`router.refresh` client vs server `refresh()` vs both) as long as list/detail props update after mutations and DISOL-01 holds (`/` never revalidated from debt actions).
- Evidence-first Nyquist reconcile (Phase 07 style) vs full interactive `/gsd-validate-phase` auditor when Wave 0 files already exist.

### Deferred Ideas (OUT OF SCOPE)
Accepted product waivers (Phase 10) — do **not** reopen:

- Distinct «Списание» timeline label / `isForgive` column
- Live multi-tab concurrency opaque UX polish (10-05 cancelled); server P2025 map remains

Also out of scope:

- RateList `window.confirm` migration (audit: out of D-17 scope)
- New product features, filters, cross-currency repay, NW inclusion of debts
</user_constraints>

<phase_requirements>
## Phase Requirements

IDs derived from audit `tech_debt` (REQUIREMENTS.md has no Phase 12 REQ rows — all v1.1 product REQs already Complete).

| ID | Description | Research Support |
|----|-------------|------------------|
| TD-REFRESH-01 | After debt mutations, `/debts` list/detail props refresh reliably (not fragile RSC stale) | Keep `revalidatePath("/debts")`; add client `router.refresh()` on success (or equiv.); never touch `/` |
| TD-STATUS-01 | CLOSED bucketing and remaining display stay consistent (desync impossible or hard-fail) | Page `remainingMinor` + `assertStatusSynced`; list buckets on synced status |
| TD-ASSERT-01 | `assertInitialImmutable` / `assertStatusSynced` either wired at runtime or documented as test-only contracts | Wire status assert on read path; document initial assert → Zod omit |
| TD-UIHOME-01 | `DestructiveConfirmStep` has a correct shared home (or documented intentional debts/ home) | Relocate to `src/components/ui/` + update import graph |
| NYQ-10 | Phase 10 `VALIDATION.md` → `status: validated`, `nyquist_compliant: true` | Evidence-first reconcile; Wave 0 files present |
| NYQ-11 | Phase 11 `VALIDATION.md` → `status: validated`, `nyquist_compliant: true` | Same pattern as NYQ-10 / Phase 07 |
| NYQ-12 | Phase 12 itself has VALIDATION.md covering TD-* + Nyquist close | Seed + validate Wave 0 for this phase's tests |
</phase_requirements>

## Summary

Phase 12 is a **maintainability / process** phase after a green v1.1 audit (`tech_debt` status, 15/15 REQs satisfied). Product waivers stay closed. Work splits into (A) small code fixes on debts refresh + status/assert hygiene + shared confirm UI home, and (B) Nyquist docs reconcile for phases 10–11 mirroring Phase 07’s evidence-first close.

Server Actions already call `revalidatePath("/debts")` on every successful mutation (17 call sites). Next.js 16.3 docs state that `revalidatePath` inside a Server Action includes a fresh RSC Payload in the same response — yet the audit still flags client-held props as fragile, and **no** `router.refresh` exists under `src/`. DebtsList buckets CLOSED by persisted `Debt.status` while `page.tsx` recomputes `remainingMinor` from events and passes DB `status` through — `assertStatusSynced` exists but is never called outside tests. `assertInitialImmutable` is likewise tests-only; runtime DEBT-03 is Zod `updateDebtMetaSchema` omit + `.strict()`. `DestructiveConfirmStep` lives under `components/debts/` but is imported by `AccountList`.

**Primary recommendation:** (1) belt-and-suspenders refresh — keep `revalidatePath("/debts")`, add `router.refresh()` on client success paths; (2) call `assertStatusSynced` after page remaining compute; (3) document `assertInitialImmutable` as Zod-backed test contract; (4) move `DestructiveConfirmStep` to `src/components/ui/`; (5) evidence-first flip 10/11 VALIDATION.md after `npm test` green (auditor only if true MISSING).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Cache invalidate after debt write | API / Backend (Server Actions) | Frontend Server (RSC re-render) | `revalidatePath` only works server-side; Action response carries RSC Payload |
| Client list/dialog prop refresh | Browser / Client | Frontend Server | `router.refresh()` clears Client Cache; merges new RSC without full navigation |
| Remaining + status invariant | API / Backend + page RSC | — | Writes already `statusForRemaining`; page must assert/sync before UI |
| CLOSED list bucketing | Browser / Client (`DebtsList`) | Database / Storage (`Debt.status`) | UI filters on prop `status`; correctness depends on synced status |
| Shared destructive confirm UI | Browser / Client | CDN / Static — | Presentational; move file home only |
| Nyquist VALIDATION reconcile | — (planning artifacts) | — | Docs + optional test gaps; no runtime tier |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.3.4 | App Router, Server Actions, `revalidatePath`, `useRouter` | Pinned project stack [VERIFIED: package.json:26] |
| react / react-dom | 19.2.8 | Client dialogs, `useActionState`, transitions | Pinned [VERIFIED: package.json:28-29] |
| vitest | 4.1.11 | Unit/smoke tests | Existing Nyquist harness [VERIFIED: package.json:47] |
| zod | 4.5.4 | FormData schemas; DEBT-03 omit gate | Existing [VERIFIED: package.json:34] |
| @prisma/client + prisma | 7.10.0 | Debt status persistence | Existing; no schema change expected |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| existing `@/lib/debts` | in-repo | `remainingMinor`, `statusForRemaining`, asserts | Status sync + tests |
| existing Vitest mocks for `revalidatePath` | in-repo | Action tests | Keep DISOL-01 assertions (`not.toHaveBeenCalledWith("/")`) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Client `router.refresh()` | Server-only `revalidatePath` (status quo) | Docs say Action RSC refresh should suffice; audit rejects status quo as fragile |
| Client `router.refresh()` | `refresh()` from `next/cache` inside actions | Server `refresh` refetches RSC without invalidating data cache; still need path invalidate for force-dynamic/data freshness — keep `revalidatePath` |
| Relocate confirm to `ui/` | Document debts/ as intentional shared home | Docs-only cheaper; cross-domain import remains smell |
| Bucket CLOSED by `remaining === 0n` | Keep status + assert | Bucketing by remaining masks write bugs; assert keeps single source of truth |

**Installation:**

```bash
# No new packages — reuse pinned stack
```

**Version verification:** `next@16.3.4`, `vitest@4.1.11` from `package.json` (no registry install this phase).

## Package Legitimacy Audit

> No external packages to install this phase.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| — | — | — | — | — | — | N/A — no installs |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```text
[Client DebtsList / DebtDetailDialog / DebtFormDialog]
        |  Server Action call (form action | startTransition await)
        v
[src/app/debts/actions.ts]
        |  Prisma $transaction + statusForRemaining write
        |  revalidatePath("/debts")  ← NEVER revalidatePath("/")
        v
[Next Action response = return value + RSC Payload for /debts]
        |
        +--> Client merges RSC (list remaining/status/timeline)
        |
        +--> [RECOMMENDED] router.refresh() on success
               clears Client Cache; re-fetches RSC if merge missed

[src/app/debts/page.tsx RSC]
        |  remainingMinor(events) + pass status from DB
        |  [RECOMMENDED] assertStatusSynced(status, remaining)
        v
[DebtsList] open = status!==CLOSED ; closed = status===CLOSED
[computeDebtPrimaryTotals] filters status===OPEN
```

### Recommended Project Structure

```
src/
├── app/debts/
│   ├── actions.ts          # keep revalidatePath("/debts"); no `/`
│   ├── actions.test.ts     # assert refresh + DISOL; optional refresh spy if added
│   └── page.tsx            # remainingMinor + assertStatusSynced before serialize
├── components/
│   ├── ui/
│   │   └── destructive-confirm-step.tsx   # NEW home (moved)
│   ├── debts/              # update imports; remove old file
│   └── accounts/AccountList.tsx           # update import
└── lib/debts.ts            # JSDoc: assertInitialImmutable = test/Zod contract
.planning/phases/
├── 10-.../10-VALIDATION.md # draft → validated
├── 11-.../11-VALIDATION.md # draft → validated
└── 12-.../12-VALIDATION.md # seed for this phase
```

### Pattern 1: Belt-and-suspenders debts refresh

**What:** Keep server `revalidatePath("/debts")`; on client success call `router.refresh()` from `next/navigation`.
**When to use:** Every successful debt/person mutation that should update list/detail props while Dialog/local state may hold stale `debt` props.
**Example:**

```typescript
// Source: Next.js useRouter + Server Actions guides
// [CITED: node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-router.md]
// [CITED: node_modules/next/dist/docs/01-app/02-guides/server-actions.md]
"use client";
import { useRouter } from "next/navigation";

const router = useRouter();
// after result.success / useActionState success:
router.refresh();
```

Server side stays:

```typescript
// [VERIFIED: src/app/debts/actions.ts — multiple sites]
revalidatePath("/debts");
// MUST NOT: revalidatePath("/");
```

### Pattern 2: Page-level status sync assert

**What:** After computing `remaining`, call `assertStatusSynced(d.status, remaining)` before serializing props / totals inputs.
**When to use:** RSC page load for `/debts` (catches write-order bugs early).
**Example:**

```typescript
// Source: domain helpers
// [VERIFIED: src/lib/debts.ts:56-71]
// statusForRemaining: remaining === 0n ? "CLOSED" : "OPEN"
// assertStatusSynced throws: `status desync: have ${status}, want ${expected}`
const remaining = remainingMinor(/* ... */);
assertStatusSynced(d.status, remaining);
```

### Pattern 3: Evidence-first Nyquist close (Phase 07)

**What:** State A drafts exist; Wave 0 test files already on disk; run suite; flip frontmatter + map rows; append Validation Audit; spawn `gsd-nyquist-auditor` only for true MISSING.
**When to use:** Phases 10 and 11 (and seeding 12).
**Example frontmatter target:**

```yaml
status: validated
nyquist_compliant: true
wave_0_complete: true
validated: "2026-09-06"
```

`[VERIFIED: .planning/phases/08-debts-schema-domain-math/08-VALIDATION.md:6-9]` quotes:
`status: validated` / `nyquist_compliant: true` / `wave_0_complete: true`

### Anti-Patterns to Avoid

- **`revalidatePath("/")` from debt actions:** violates DISOL-01 / T-10-04.
- **Frontmatter-only Nyquist flip:** leave Wave 0 / Status columns stale — Phase 07 Pitfall 4.
- **Reopening «Списание» / isForgive / concurrency polish:** waived; out of scope.
- **Migrating RateList off `window.confirm`:** audit marks out of D-17 scope.
- **Deleting unused asserts without docs or wire:** debt item unresolved.
- **Bucketing CLOSED only by remaining while hero uses status:** splits semantics; prefer assert + single status source.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Post-mutation UI refresh | Custom event bus / local debt state mirrors | `revalidatePath` + `router.refresh` | Framework RSC merge already defined |
| Status/remaining consistency | Ad-hoc UI heuristics | `assertStatusSynced` + `statusForRemaining` | Already tested domain helpers |
| Initial immutability | New Server Action guard path | Keep `updateDebtMetaSchema` omit + `.strict()` | DEBT-03 already enforced at boundary |
| Confirm UX | Second confirm component for accounts | Shared `DestructiveConfirmStep` (moved) | D-16/D-17 already shipped |
| Nyquist harness | New test runner | Vitest 4.1.11 + VALIDATION.md reconcile | Phase 07 proven path |

**Key insight:** Debt is inconsistency and docs drift — not missing product code. Prefer wire existing helpers + evidence reconcile over new abstractions.

## Common Pitfalls

### Pitfall 1: Client success closes Dialog but list stays stale
**What goes wrong:** User closes detail after repay; row remaining/status unchanged until hard reload.
**Why it happens:** Audit: Client Cache / prop snapshot; `revalidatePath` alone may not clear all client layers in practice.
**How to avoid:** Call `router.refresh()` in shared success handler (DebtDetailDialog `onSuccess`, DebtFormDialog success, DebtsList deletePerson success).
**Warning signs:** UAT “list wrong until F5”; Dialog reopen shows old timeline.

### Pitfall 2: Status OPEN with remaining 0n (or reverse)
**What goes wrong:** Debt in open group with 0 remaining; hero includes or excludes wrongly.
**Why it happens:** Write path forgot `status` update; page trusts DB status for buckets/totals while recomputing remaining for display.
**How to avoid:** `assertStatusSynced` on page after `remainingMinor`; keep write paths on `statusForRemaining`.
**Warning signs:** `status desync` throw; CLOSED subsection count ≠ zero-remaining rows.

### Pitfall 3: DISOL regression while “fixing refresh”
**What goes wrong:** Debt mutation revalidates `/` and NW charts flicker/recompute.
**Why it happens:** Copy-paste from accounts/currency actions which intentionally revalidate `/`.
**How to avoid:** Keep action comments + tests `expect(revalidatePath).not.toHaveBeenCalledWith("/")`.
**Warning signs:** Failures in disol / actions tests; dashboard refetch on repay.

### Pitfall 4: Nyquist validated with ❌ W0 still listed
**What goes wrong:** Audit milestone still sees NOT-VALIDATED semantics / partial maps.
**Why it happens:** Only YAML `status` flipped.
**How to avoid:** Update File Exists / Status columns; check Wave 0 boxes; append Validation Audit citing `npm test` green; set `wave_0_complete: true`.
**Warning signs:** Frontmatter validated but table rows still `⬜ pending` / `❌ W0`.

### Pitfall 5: Moving DestructiveConfirmStep without updating tests
**What goes wrong:** Import path breaks; AccountList.test string match fails.
**Why it happens:** Multiple call sites across debts + accounts.
**How to avoid:** Update all imports + `AccountList.test.ts` path expectation; grep for old path.
**Warning signs:** `Cannot find module '@/components/debts/DestructiveConfirmStep'`.

## Code Examples

### Current CLOSED bucket (status-based)

```typescript
// [VERIFIED: src/components/debts/DebtsList.tsx:111-112]
const openDebts = person.debts.filter((d) => d.status !== "CLOSED");
const closedDebts = person.debts.filter((d) => d.status === "CLOSED");
```

### Current page remaining vs status pass-through

```typescript
// [VERIFIED: src/app/debts/page.tsx:84-96]
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

### Asserts (definitions)

```typescript
// [VERIFIED: src/lib/debts.ts:64-71]
export function assertStatusSynced(
  status: DebtStatus,
  remaining: bigint,
): void {
  const expected = statusForRemaining(remaining);
  if (status !== expected) {
    throw new Error(`status desync: have ${status}, want ${expected}`);
  }
}

// [VERIFIED: src/lib/debts.ts:112-118]
export function assertInitialImmutable(
  storedInitialMinor: bigint,
  proposedInitialMinor: bigint,
): void {
  if (proposedInitialMinor !== storedInitialMinor) {
    throw new Error("initialAmountMinor is immutable after create");
  }
}
```

### Zod gate for DEBT-03 (runtime)

```typescript
// [VERIFIED: src/lib/validations/debts.ts:111-119]
export const updateDebtMetaSchema = z
  .object({
    debtId: z.coerce.number().int().positive(),
    direction: debtDirectionSchema.optional(),
    dueDate: optionalDueDateSchema,
    note: optionalNoteSchema,
  })
  .strict();
```

### DestructiveConfirmStep import graph (current)

| Consumer | Import path |
|----------|-------------|
| `DebtsList.tsx` | `@/components/debts/DestructiveConfirmStep` |
| `DebtFormDialog.tsx` | same |
| `DebtDetailDialog.tsx` | same |
| `AccountList.tsx` | same (cross-domain) |

File: `src/components/debts/DestructiveConfirmStep.tsx` [VERIFIED: exists; no `pendingLabel` prop — hardcoded «Удаление…»]

### revalidatePath("/debts") mutation surface

Exported actions that revalidate `/debts` on success: `createPerson`, `renamePerson`, `deletePerson`, `createDebt`, `updateDebtMeta`, `deleteDebt`, `createRepayment`, `deleteRepayment`, `createSizeChange`, `forgiveRemaining`, `deleteSizeChange` [VERIFIED: `rg '^export async function' src/app/debts/actions.ts`].

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hope `revalidatePath` alone updates client | Pair with `router.refresh` when Client Cache risk | Next App Router guidance + audit | Reliable list after Dialog mutations |
| VALIDATION.md left draft post-execute | Evidence-first reconcile in tech-debt phase | Phase 07 (v1.0) | Nyquist COMPLIANT without product churn |
| Domain asserts only in unit tests | Assert on RSC read for status sync | Phase 12 recommendation | Desync fails loud |

**Deprecated/outdated:**

- Treating Phase 10/11 Wave 0 paths as missing — files exist (`actions.test.ts`, `debts.test.ts`, stack series tests, P2025 maps).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Client `router.refresh()` is still needed despite Action RSC Payload merge | Refresh pattern | Extra no-op refresh if Action merge always sufficient — low risk; audit still wants it |
| A2 | Interactive `/gsd-validate-phase` user gate can be satisfied by evidence-first docs reconcile without always spawning auditor | Nyquist | Planner may need four formal validate-phase runs if hooks require auditor |
| A3 | Relocating confirm to `src/components/ui/` is preferred over docs-only | UI home | Team may prefer document-in-place; either closes TD-UIHOME-01 |

## Open Questions

1. **Wire `assertInitialImmutable` into any action?**
   - What we know: No action accepts proposed initial on update; Zod `.strict()` rejects smuggled fields.
   - What's unclear: Whether planner wants dead-code wire for symmetry.
   - Recommendation: **Document** (JSDoc + comment pointing at `updateDebtMetaSchema`); keep tests. Do not fake-call with identical values in update path.

2. **Soft vs hard fail on status desync at page render?**
   - What we know: `assertStatusSynced` throws Error.
   - What's unclear: Prefer error boundary vs coerce `statusForRemaining(remaining)` for display.
   - Recommendation: **Hard assert** (throw) — desync is invariant violation; fix writes, don’t paper over.

3. **Must `/gsd-validate-phase` run interactively for 10 and 11?**
   - What we know: Phase 07 closed 3–6 docs-only with suite green; workflow State A allows reconcile; auditor only for MISSING.
   - Recommendation: Evidence-first reconcile in Phase 12 plans; optional validate-phase only if gap analysis finds MISSING.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| node | tests / Next | ✓ | v24.5.0 | — |
| npm / npx | vitest, prisma | ✓ | 10.9.3 | — |
| vitest | Nyquist + TD tests | ✓ | 4.1.11 | — |
| prisma CLI | migrate deploy in prior verify cmds | ✓ | 7.10.0 (dep) | — |
| SQLite data dir | integration-style action tests | ✓ (mkdir -p data) | — | `DATABASE_URL=file:./data/wallet.db` |

**Missing dependencies with no fallback:** none

**Missing dependencies with fallback:** none

Step 2.6: external tools needed only for Vitest/Prisma already present.

## Validation Architecture

> `workflow.nyquist_validation: true` in `.planning/config.json` — section required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.11 |
| Config file | `vitest.config.ts` (`include: ["src/**/*.test.ts"]`) |
| Quick run command | `npx vitest run src/app/debts/actions.test.ts src/lib/debts.test.ts src/components/accounts/AccountList.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TD-REFRESH-01 | Success actions call `revalidatePath("/debts")` only; client refresh wired | unit + grep | `npx vitest run src/app/debts/actions.test.ts` + grep `router.refresh` under `src/components/debts` | ✅ actions tests / ❌ refresh grep until implemented |
| TD-STATUS-01 | Page asserts status synced with remaining | unit | extend `src/lib/debts.test.ts` + optional page/smoke grep `assertStatusSynced` in `page.tsx` | ✅ assert tests / ❌ page wire |
| TD-ASSERT-01 | Initial assert documented or wired; status assert outcome clear | unit/docs | `npx vitest run src/lib/debts.test.ts -t assert` | ✅ |
| TD-UIHOME-01 | Confirm imported from new UI home; AccountList still uses it | unit | `npx vitest run src/components/accounts/AccountList.test.ts` | ✅ (update path) |
| NYQ-10 | 10-VALIDATION frontmatter validated + compliant | docs + suite | `npm test` + grep frontmatter | ✅ draft exists |
| NYQ-11 | 11-VALIDATION frontmatter validated + compliant | docs + suite | `npm test` + grep frontmatter | ✅ draft exists |
| NYQ-12 | 12-VALIDATION.md seeded | docs | file exists under phase dir | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run src/app/debts/actions.test.ts src/lib/debts.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green; 10/11/12 VALIDATION.md show `status: validated` + `nyquist_compliant: true`

### Wave 0 Gaps

- [ ] Wire/tests for `router.refresh` (or document Decision if Action-only refresh accepted — default: wire)
- [ ] `assertStatusSynced` call in `src/app/debts/page.tsx` + grep/automated verify
- [ ] Relocate `DestructiveConfirmStep` + update `AccountList.test.ts`
- [ ] Reconcile `.planning/phases/10-repayments-close-write-off/10-VALIDATION.md`
- [ ] Reconcile `.planning/phases/11-charts-primary-totals/11-VALIDATION.md`
- [ ] Create `.planning/phases/12-address-tech-debt-debts-refresh-nyquist-10-11/12-VALIDATION.md`

**Phase 10/11 Wave 0 note:** Listed test files already on disk (`src/app/debts/actions.test.ts`, `src/lib/validations/debts.test.ts`, `src/lib/debts.test.ts` with `buildDebtPrincipalStackSeries`, `src/lib/net-worth.test.ts`, `src/lib/disol.test.ts`). Draft maps still mark some rows `❌ W0` / `⬜ pending` — stale relative to shipped code. Reconcile like Phase 07; do not invent duplicate product tests unless a named path is truly absent.

**Prior verify commands (reuse):**

```bash
npx vitest run src/lib/debts.test.ts
mkdir -p data && DATABASE_URL="file:./data/wallet.db" npx prisma migrate deploy && npx vitest run src/app/debts/actions.test.ts
npm test
```

## Security Domain

> `security_enforcement: true`, ASVS level 1.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Local single-user wallet; no auth layer this phase |
| V3 Session Management | no | — |
| V4 Access Control | no | No multi-user ACL |
| V5 Input Validation | yes | Existing Zod schemas on FormData; do not weaken `.strict()` |
| V6 Cryptography | no | No new crypto |

### Known Threat Patterns for debts Server Actions

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Smuggled `initialAmountMajor` on update | Tampering | `updateDebtMetaSchema` omit + `.strict()` (DEBT-03) |
| Over-repay / negative remaining | Tampering | `assertRepaymentAmount` / `assertSizeDelta` |
| Status/remaining desync display | Spoofing/Tampering (integrity) | Write `statusForRemaining` + page `assertStatusSynced` |
| Accidental NW cache bust | Elevation of privilege / integrity of DISOL | `revalidatePath("/debts")` only; tests forbid `/` |
| Unconfirmed destructive delete | Repudiation | Shared `DestructiveConfirmStep` (D-16/D-17) |

## Project Constraints (from .cursor/rules / AGENTS.md)

- **Next.js docs gate:** This Next differs from training data — read `node_modules/next/dist/docs/` before writing Next APIs (`revalidatePath`, `useRouter`, Server Actions). [VERIFIED: AGENTS.md]
- **Operator UAT:** Before `/gsd-verify-work` / UAT, read `.planning/OPERATOR.md`; agent drives app + Orca; human only for subjective judgment. [VERIFIED: AGENTS.md]
- **No `.cursor/rules/` files present** this session (directory empty / absent actionable rules beyond AGENTS).
- **codegraph / graphify:** graphify disabled in project config — use Grep/Read for search (user prefers codegraph when enabled).
- **Caveman / terse user preference:** planner/executor may keep terse UX; RESEARCH stays structured for planner consumption.

## Sources

### Primary (HIGH confidence)

- `.planning/v1.1-MILESTONE-AUDIT.md` — authoritative `tech_debt` + Nyquist table
- `src/app/debts/actions.ts`, `page.tsx`, `DebtsList.tsx`, `src/lib/debts.ts`, `src/lib/validations/debts.ts` — Read this session
- `node_modules/next/dist/docs/01-app/02-guides/server-actions.md` — Action + `revalidatePath` RSC Payload
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-router.md` — `router.refresh()` semantics
- `.planning/milestones/v1.0-phases/07-address-tech-debt-locf-consolidation-nyquist-3-6/07-RESEARCH.md` + `07-03-PLAN.md` — evidence-first Nyquist
- `.cursor/gsd-core/workflows/validate-phase.md` — State A/B/C + auditor spawn rules
- `package.json`, `vitest.config.ts`, phase 10/11 VALIDATION.md drafts

### Secondary (MEDIUM confidence)

- Phase 10 RESEARCH note on status vs remaining list strategy
- Audit aggregate item wording for “router.refresh or equivalent”

### Tertiary (LOW confidence)

- Whether Action RSC merge alone is always enough in this app’s Dialog/`useActionState` mix without `router.refresh` (A1)

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — pinned versions in package.json; no new installs
- Architecture: HIGH — call sites and data flow verified in source
- Pitfalls: HIGH — grounded in audit + DISOL tests + Phase 07 lessons
- Refresh necessity of client `router.refresh`: MEDIUM — docs say Action path should refresh; audit still requires belt

**Research date:** 2026-09-06
**Valid until:** 2026-10-06 (30 days; stack stable)
