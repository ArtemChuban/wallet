# Phase 22: GRACEISO regression + polish - Research

**Researched:** 2026-09-10
**Domain:** Isolation regression twin (file-scan + golden + action write-gates); gate hygiene
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Carried locks (do not re-open)
- **C-01:** Grace is forecast overlay only; never rewrites historical NW LOCF / `computeNetWorthRows` / `buildNetWorthSeries` (PROJECT + GRISO-01; Phase 18–21). — **Reversibility:** one-way — Core Value trust.
- **C-02:** Grace config / amount-due / early-close actions never write `BalanceSnapshot` (ROADMAP SC1; Phase 19–20 comments already assert). — **Reversibility:** one-way.
- **C-03:** A′ NW-neutral and OPEN membership rules stay as Phase 21; this phase does not change overlay math — only proves isolation walls. — **Reversibility:** costly if reopened.

#### Suite twin layout
- **D-01:** Add dedicated **`src/lib/griso.test.ts`** mirroring `src/lib/iniso.test.ts` structure (describe `GRISO-01 isolation`): import walls on NW math + `nw-forecast` bans + past-series golden identity. — **Reversibility:** reversible — test file layout.
- **D-02:** Keep / expand **action write-gates** in `src/app/accounts/actions.test.ts` for grace mutations (schedule / amount / close / related) — same split as income: `iniso.test.ts` + `income/actions.test.ts`. Do not collapse everything into one file. — **Reversibility:** reversible.
- **D-03:** Milestone-close bar = green GRISO suite (file-scan + golden) covering ROADMAP SC 1–3; planner may fold existing partial GRISO smokes (`credit-grace.test.ts`, actions GRISO cases) into or alongside the twin without deleting coverage. — **Reversibility:** reversible.

#### Write-path scan scope
- **D-04:** **Grace mutation surfaces** (accounts actions that update schedule / obligations / early close): must not call `balanceSnapshot` upsert/delete; source must not reference `BalanceSnapshot` write APIs; prisma test double has no BalanceSnapshot write surface for those paths (mirror income ISO action tests). — **Reversibility:** costly — product isolation.
- **D-05:** **`src/lib/net-worth.ts` and `src/lib/historical-series.ts`:** must not import `credit-grace` or `nw-forecast` (and must not match those module paths). Twin of INISO’s income/`nw-forecast` ban on those files. — **Reversibility:** costly.
- **D-06:** **`src/lib/nw-forecast.ts`:** keep INISO bans (no prisma / `BalanceSnapshot` / net-worth / historical-series). Grace slots as pure inputs remain allowed (Phase 21). — **Reversibility:** costly.
- **D-07:** **`src/lib/credit-grace.ts`:** must not import prisma `BalanceSnapshot`, `net-worth`, or `historical-series`. — **Reversibility:** costly.
- **D-08:** **Do not** ban the string `BalanceSnapshot` from legitimate account UI (`AccountList`, `SetBalanceDialog`, balance upsert actions). Scope is grace write-path + NW math walls, not global string ban. — **Reversibility:** reversible.

#### Golden identity shape
- **D-09:** Past-series golden identity = **INISO style**: call `buildNetWorthSeries` twice with identical account/snapshot/rate inputs; conceptual grace fixture is **void / never passed** into the API; outputs bitwise-identical. Assert public input keys exclude grace/obligation/forecast fields (extend INISO forbidden-key list with grace synonyms: e.g. `grace`, `obligation`, `creditGrace`). — **Reversibility:** reversible — test design.
- **D-10:** Include at least one fixture set with a **credit account** + snapshots so LOCF still account-only when grace data “exists” conceptually. — **Reversibility:** reversible.
- **D-11:** No requirement to run DB integration for golden — pure unit inputs like INISO. Action write-gates cover mutation isolation. — **Reversibility:** reversible.

#### Polish / close-out
- **D-12:** **Polish = gate hygiene**, not product polish: after suite green, mark **GRISO-01** in REQUIREMENTS + Phase 22 ROADMAP progress; sync STATE. No broad RU copy audit unless a test/UAT finds a break. — **Reversibility:** reversible.
- **D-13:** **Orca UAT:** agent-driven smoke only if phase verification/OPERATOR gate requires live check for milestone close; primary evidence is automated GRISO suite. No new UI chrome for isolation. — **Reversibility:** reversible.

### Claude's Discretion
- Exact test case names / describe nesting inside `griso.test.ts` (mirror INISO naming with GRISO prefixes).
- Whether to relocate thin smokes from `credit-grace.test.ts` into `griso.test.ts` or leave both (prefer leave + add twin; avoid coverage loss).
- Exact list of grace action function names under write-gate (research reads `accounts/actions.ts`).
- File naming: `griso.test.ts` locked (matches GRISO-01 / INISO `iniso.test.ts` short prefix).

### Deferred Ideas (OUT OF SCOPE)
- Chart legend доходы vs обязательства — already beyond v1.3 in REQUIREMENTS Deferred.
- Timezone settings todo / local AI agent todo — not folded.
- Broad RU microcopy polish pass — out of scope unless a failure forces a fix.

None else — discussion stayed within GRACEISO regression + gate hygiene.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GRISO-01 | Grace actions never write `BalanceSnapshot` or change historical NW LOCF | Twin `griso.test.ts` (D-01/D-05–D-07/D-09–D-11) + expand `accounts/actions.test.ts` write-gates for all five grace mutations (D-02/D-04); gate hygiene marks REQ after green (D-12) |
</phase_requirements>

## Summary

Phase 22 is a **regression twin of INISO**, not new product math. Production isolation walls already hold: `net-worth.ts` / `historical-series.ts` have no `credit-grace` or `nw-forecast` matches; `nw-forecast.ts` imports only `dates` / `locf` / `money`; `credit-grace.ts` imports only `dates`. Partial GRISO smokes already green (file-scan in `credit-grace.test.ts`; never-calls on create/update/close/reopen in `accounts/actions.test.ts`). What is **missing for milestone close** is the dedicated INISO-shaped suite (`src/lib/griso.test.ts` absent), golden past-series identity with grace forbidden keys + FIAT_CREDIT fixture, `updateGraceSchedule` write-gate gap, and REQUIREMENTS/ROADMAP/STATE checkbox sync.

**Primary recommendation:** Add `src/lib/griso.test.ts` as a structural copy of `iniso.test.ts` with grace bans; leave existing smokes; add dedicated never-calls for all five grace actions (especially `updateGraceSchedule`); then mark GRISO-01 + sync progress. Zero new npm packages.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Historical NW LOCF purity | API / Backend (pure lib) | — | `net-worth` / `historical-series` own series math; must stay grace-free |
| Forecast overlay A′ slots | Browser / Client + Frontend Server | API / Backend (pure `nw-forecast`) | Shell merges; builder stays pure; Phase 21 math locked (C-03) |
| Grace mutation write isolation | API / Backend (server actions) | — | `accounts/actions.ts` grace exports must not touch `balanceSnapshot` |
| Isolation regression suite | CDN / Static N/A — **test tier** | — | Vitest file-scan + golden + mocks; no runtime feature |
| Gate hygiene (REQ/ROADMAP/STATE) | Planning docs | — | D-12 polish only after suite green |
| Optional Orca smoke | Browser / Client | — | D-13 secondary; OPERATOR agent-driven if verify asks |

## Project Constraints (from .cursor/rules/)

No `.cursor/rules/` files present in this workspace (verified empty). Applicable always-on project rules:

- Next.js APIs may differ — read `node_modules/next/dist/docs/` before any Next API change (this phase expects **no** Next API changes).
- Before `/gsd-verify-work` / UAT: read `.planning/OPERATOR.md`; agent drives app + Orca; ask human only for subjective judgment / hard blockers.
- Codebase search: prefer `codegraph` CLI over blind grep when exploring symbols.
- Never `window.confirm` for destructive actions (CONVENTIONS / PROJECT) — N/A for new UI this phase.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitest | 4.1.11 (package.json) | Unit + file-scan isolation suites | Already project test runner; INISO/DISOL/GRISO pattern |
| node:fs `readFileSync` | Node built-in | Static source wall scans | Canonical in `iniso.test.ts` / `disol.test.ts` |
| TypeScript `AssertNever` type walls | project TS | Compile-time forbidden keys on `BuildNetWorthSeriesInput` | INISO already uses this pattern |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vi.mock / prisma double | vitest | Action write-gates | `accounts/actions.test.ts` only — keep split per D-02 |
| `@/lib/money` `RATE_SCALE_E8` | in-repo | Golden fixtures | Mirror INISO imports |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vitest `readFileSync` walls | ESLint `no-restricted-imports` / import-boundaries plugins | Ecosystem option `[CITED: eslint.org/docs/latest/rules/no-restricted-imports]`; **do not adopt** — zero-new-package + twin INISO locked |
| Collapse all GRISO into one file | Single mega-suite | Violates D-02 income split precedent |
| DB integration golden | Prisma e2e | Forbidden by D-11 |

**Installation:**

```bash
# None — no new packages. Use existing:
npx vitest run src/lib/griso.test.ts src/lib/iniso.test.ts src/app/accounts/actions.test.ts
```

**Version verification:** `npm view vitest version` → registry `5.0.0` (2026-09); project lock remains **4.1.11** `[VERIFIED: package.json]`. Do not upgrade in this phase.

## Package Legitimacy Audit

> No external packages to install for Phase 22.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| *(none new)* | — | — | — | — | — | N/A — reuse vitest@4.1.11 already in package.json |

**Packages removed due to [SLOP] verdict:** none  
**Packages flagged as suspicious [SUS]:** none for this phase (registry legitimacy probe on `vitest` alone returned SUS/too-new — ignore; not an install)

## Architecture Patterns

### System Architecture Diagram

```text
[Grace UI / FormData]
        │
        ▼
[accounts/actions.ts grace mutations]
  updateGraceSchedule
  createCreditGraceObligation
  updateCreditGraceObligation
  closeCreditGraceObligation
  reopenCreditGraceObligation
        │
        ├──► prisma.account / creditGraceObligation  (ALLOWED)
        └──► prisma.balanceSnapshot.*               (FORBIDDEN — write-gate)

[upsertBalanceSnapshot / deleteBalanceSnapshot] ──► balanceSnapshot (ALLOWED — D-08)

[credit-grace.ts] ──pure──► membership DTOs ──► page/shell ──► nw-forecast.ts
                                                              (overlay only)
[net-worth.ts] ◄── computeNetWorthRows ◄── page inputs (no grace fields)
[historical-series.ts] ◄── buildNetWorthSeries (accounts/snapshots/rates only)

        ▼ regression
[griso.test.ts] file-scan + golden     [actions.test.ts] never-calls
[credit-grace.test.ts] thin smokes     [iniso.test.ts] must stay green
```

### Recommended Project Structure

```
src/lib/
├── griso.test.ts          # NEW — GRISO-01 twin of iniso.test.ts (D-01)
├── iniso.test.ts          # keep green (Phase 17)
├── disol.test.ts          # ancestor pattern (optional reference)
├── credit-grace.ts        # wall scan target (D-07) — no production edits expected
├── credit-grace.test.ts   # KEEP existing GRISO smoke (discretion: leave)
├── net-worth.ts           # wall target (D-05)
├── historical-series.ts   # wall target + golden API (D-05/D-09)
└── nw-forecast.ts         # INISO bans retained (D-06); do NOT ban word "grace"
src/app/accounts/
├── actions.ts             # five grace mutations + legitimate snapshot APIs
└── actions.test.ts        # EXPAND write-gates (D-02/D-04)
.planning/
├── REQUIREMENTS.md        # checkbox GRISO-01 after green (D-12)
├── ROADMAP.md             # Phase 22 progress after green
└── STATE.md               # sync position
```

### Pattern 1: INISO twin file-scan + golden (`griso.test.ts`)

**What:** Copy structure of `iniso.test.ts` with grace module bans and extended forbidden keys.  
**When to use:** Always for GRISO-01 SC2–SC3.  
**Example (planner skeleton — values from verified sources):**

```typescript
// Source: twin of src/lib/iniso.test.ts:13-148 [VERIFIED]
// Describe: "GRISO-01 isolation"
// 1) For net-worth.ts + historical-series.ts:
//    expect(src).not.toMatch(/@\/lib\/credit-grace|from ["']\.\/credit-grace["']/);
//    expect(src).not.toMatch(/@\/lib\/nw-forecast|from ["']\.\/nw-forecast["']/);
// 2) nw-forecast.ts: keep INISO prisma/BalanceSnapshot/net-worth/historical-series bans
// 3) credit-grace.ts (D-07):
//    expect(src).not.toMatch(/from\s+["']@\/generated\/prisma|from\s+["'][^"']*prisma["']/);
//    expect(src).not.toMatch(/@\/lib\/(?:net-worth|historical-series)/);
//    expect(src).not.toMatch(/from ["']\.\/(?:net-worth|historical-series)["']/);
//    // Prefer write-API ban over bare BalanceSnapshot if scanning comments elsewhere
// 4) Golden: buildNetWorthSeries(input) twice; void _gracePresentConceptually; keys wall
//    Forbidden key extracts include: "grace" | "obligation" | "creditGrace" | income keys
// 5) D-10: second fixture with type: "FIAT_CREDIT" + creditLimitMinor + snapshots
```

`BuildNetWorthSeriesInput` public keys today `[VERIFIED: src/lib/historical-series.ts:59-66]`:

```typescript
export type BuildNetWorthSeriesInput = {
  accounts: SeriesAccount[];
  snapshots: SeriesSnapshot[];
  rates: SeriesRate[];
  primaryScale: number;
  preset: RangePreset;
  today: string;
};
```

### Pattern 2: Action write-gates (accounts, not income whole-file ban)

**What:** Per-action `prisma.balanceSnapshot.upsert/delete` never-calls on happy paths.  
**When to use:** All five grace mutation exports (D-04).  
**Why not income twin literally:** `src/app/income/actions.ts` has zero `BalanceSnapshot` `[VERIFIED: income/actions.test.ts:659-669]` and prisma mock lacks `balanceSnapshot`. Accounts module **must** keep `balanceSnapshot` mock for legitimate BAL actions (D-08). Therefore: **never-calls per grace action**, not `expect(prisma).not.toHaveProperty("balanceSnapshot")`.

### Pattern 3: Leave thin smokes + add twin

**What:** Keep `credit-grace.test.ts` describe `GRISO isolation smoke (T-19-03 / Phase 21)` and page overlay assert; add fuller `griso.test.ts`.  
**When to use:** Default discretion (CONTEXT prefers leave + add twin).

### Anti-Patterns to Avoid

- **Whole-file ban of `BalanceSnapshot` on `accounts/actions.ts`:** breaks D-08; JSDoc on grace functions already contains the string `"Never writes BalanceSnapshot"` `[VERIFIED: src/app/accounts/actions.ts:285]` — naive `\bBalanceSnapshot\b` scan of grace regions **fails on comments**. Ban write APIs: `prisma.balanceSnapshot` / `.balanceSnapshot.(upsert|delete|create)`.
- **Banning the word `grace` inside `nw-forecast.ts`:** violates D-06 (`ForecastSlotKind = "income" | "grace"` is intentional).
- **Changing overlay math / membership:** locked C-03.
- **Deleting credit-grace GRISO smokes when adding twin:** coverage loss risk (D-03).
- **New ESLint boundary packages:** out of stack; twin existing tests.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Import isolation | Custom AST walker / new eslint plugin | `readFileSync` + `not.toMatch` like INISO/DISOL | Already proven in-repo; zero deps |
| Past-series identity | DB seed + snapshot compare | Pure `buildNetWorthSeries` golden (D-11) | Same as INISO D-17 |
| Write isolation | Runtime production flags | Vitest prisma mock never-calls | Income/accounts established |
| Forbidden API keys | Runtime reflection only | `Object.keys` + `AssertNever` type wall | INISO already ships both |

**Key insight:** GRISO is a **test + docs** phase. Production walls already pass; the milestone risk is **missing automated twin + one write-gate gap**, not missing domain code.

## Common Pitfalls

### Pitfall 1: Comment false-positive on BalanceSnapshot scan
**What goes wrong:** File-scan `BalanceSnapshot` on grace action source fails though no write occurs.  
**Why it happens:** JSDoc documents “Never writes BalanceSnapshot”.  
**How to avoid:** Scan for `prisma.balanceSnapshot` / write-method calls; rely on mock never-calls.  
**Warning signs:** New GRISO static test red on untouched actions.ts comments.

### Pitfall 2: Treating accounts prisma mock like income
**What goes wrong:** Removing `balanceSnapshot` from accounts mock breaks BAL-01 tests.  
**Why it happens:** Blind copy of income ISO “no property” assert.  
**How to avoid:** Keep mock; assert never-called on grace paths only.  
**Warning signs:** BAL upsert tests fail after GRISO “cleanup”.

### Pitfall 3: Skipping `updateGraceSchedule` write-gate
**What goes wrong:** SC1 incomplete — schedule is a grace mutation surface (D-04).  
**Why it happens:** Existing GRISO never-calls cover create/update/close/reopen only.  
**How to avoid:** Dedicated it under schedule describe (or shared GRISO describe).  
**Warning signs:** Only obligation paths assert never-calls.

### Pitfall 4: Golden without FIAT_CREDIT
**What goes wrong:** Misses D-10 — credit LOCF path untested under “grace exists conceptually”.  
**Why it happens:** Copying INISO debit-only fixtures verbatim.  
**How to avoid:** Add credit account + `creditLimitMinor` + snapshots (see `historical-series.test.ts` FIAT_CREDIT patterns).  
**Warning signs:** Only `FIAT_DEBIT` in griso golden.

### Pitfall 5: Regressing Phase 21 while polishing docs early
**What goes wrong:** Checkbox marked before suite green; or Phase 21 suites broken unnoticed.  
**Why it happens:** Gate hygiene runs before verify.  
**How to avoid:** Green command set first (below); then D-12 edits in final plan task.  
**Warning signs:** REQUIREMENTS `[x]` while `griso.test.ts` missing.

## Code Examples

### INISO wall loop (exact twin source)

```typescript
// Source: src/lib/iniso.test.ts:14-20 [VERIFIED]
for (const file of ["src/lib/net-worth.ts", "src/lib/historical-series.ts"]) {
  it(`${file} does not import income or nw-forecast`, () => {
    const src = readFileSync(file, "utf8");
    expect(src).not.toMatch(/@\/lib\/income|from ["']\.\/income["']/);
    expect(src).not.toMatch(/@\/lib\/nw-forecast|from ["']\.\/nw-forecast["']/);
  });
}
```

GRISO replacement matchers for the same files: `credit-grace` + `nw-forecast` (D-05).

### INISO nw-forecast ban block (reuse under GRISO describe)

```typescript
// Source: src/lib/iniso.test.ts:22-30 [VERIFIED]
it("nw-forecast.ts bans prisma / BalanceSnapshot / net-worth / historical-series", () => {
  const src = readFileSync("src/lib/nw-forecast.ts", "utf8");
  expect(src).not.toMatch(
    /from\s+["']@\/generated\/prisma|from\s+["'][^"']*prisma["']/,
  );
  expect(src).not.toMatch(/\bBalanceSnapshot\b/);
  expect(src).not.toMatch(/@\/lib\/(?:net-worth|historical-series)/);
  expect(src).not.toMatch(/from ["']\.\/(?:net-worth|historical-series)["']/);
});
```

### Existing GRISO smoke (keep)

```typescript
// Source: src/lib/credit-grace.test.ts:299-306 [VERIFIED]
describe("GRISO isolation smoke (T-19-03 / Phase 21)", () => {
  it("net-worth and historical-series do not import credit-grace", () => {
    const root = join(process.cwd(), "src/lib");
    for (const file of ["net-worth.ts", "historical-series.ts"]) {
      const src = readFileSync(join(root, file), "utf8");
      expect(src).not.toMatch(/credit-grace/);
    }
  });
```

### Existing create write-gate (expand siblings)

```typescript
// Source: src/app/accounts/actions.test.ts:551-572 [VERIFIED]
it("never calls balanceSnapshot upsert/delete (GRISO)", async () => {
  // ... mocks + createCreditGraceObligation ...
  expect(prisma.balanceSnapshot.upsert).not.toHaveBeenCalled();
  expect(prisma.balanceSnapshot.delete).not.toHaveBeenCalled();
});
```

## Exact findings for planner (research focus)

### 1. File-scan patterns to twin from `iniso.test.ts`

| INISO case | GRISO twin |
|------------|------------|
| `net-worth` / `historical-series` ban `@/lib/income` + `./income` + `nw-forecast` | Same files ban `@/lib/credit-grace` + `./credit-grace` + `nw-forecast` |
| `nw-forecast` bans prisma / `BalanceSnapshot` / net-worth / historical-series | **Identical** block (D-06) |
| Past-series golden + `void _incomePresentConceptually` | `void _gracePresentConceptually` (or obligations fixture) never passed |
| `Object.keys(input)` equals accounts/preset/primaryScale/rates/snapshots/today | Same + `not.toContain` grace synonyms: `grace`, `obligation`, `creditGrace` (+ keep income keys banned) |
| `ForbiddenIncomeKeys` AssertNever | Extend Extract union with grace synonyms |
| Baseline debit-only golden | Keep + **add FIAT_CREDIT fixture** (D-10) |
| *(no credit-grace self-wall in INISO)* | **Add** `credit-grace.ts` ban prisma / net-worth / historical-series (D-07) |

### 2. Grace mutation action names needing write-gates

Exact exports `[VERIFIED: src/app/accounts/actions.ts]`:

| Function | Line | Existing never-calls today |
|----------|------|----------------------------|
| `updateGraceSchedule` | 208 | **GAP** — no balanceSnapshot asserts |
| `createCreditGraceObligation` | 287 | Dedicated GRISO it (551–573) |
| `updateCreditGraceObligation` | 386 | Embedded in happy path (622–623) |
| `closeCreditGraceObligation` | 473 | Embedded (“no balanceSnapshot writes”, 718–719) |
| `reopenCreditGraceObligation` | 550 | Embedded (774–775) |

**Not** write-gated as grace mutations: `upsertBalanceSnapshot` (620), `deleteBalanceSnapshot` (706) — legitimate (D-08).

Bodies of all five grace functions contain **no** `prisma.balanceSnapshot` calls (probed this session). Gap is **test coverage**, not production leak.

### 3. Import walls: pass vs fail today

| Wall | Production status | Suite status |
|------|-------------------|--------------|
| `net-worth.ts` / `historical-series.ts` ∌ credit-grace, nw-forecast | **PASS** (no matches) | Partial smoke in credit-grace.test; **no** full griso twin |
| `nw-forecast.ts` ∌ prisma / BalanceSnapshot / net-worth / historical-series | **PASS** (dates/locf/money only) | Covered by **INISO**, not GRISO suite |
| `credit-grace.ts` ∌ prisma / net-worth / historical-series | **PASS** (dates only) | Comment-only; **no** automated D-07 scan |
| Past-series golden with grace synonyms | N/A (API has no grace fields) | **MISSING** (`griso.test.ts` absent) |
| Action never-calls ×5 | Production clean | **4/5** — schedule gap |
| Baseline suites (Phase 21 + iniso + actions) | — | **PASS 85/85** this session |

### 4. Fold vs leave existing GRISO smokes

**Recommend (discretion):** **Leave both** + add twin.

| Asset | Action | Rationale |
|-------|--------|-----------|
| `credit-grace.test.ts` GRISO smoke + page overlay assert | **Keep** | Cheap; covers `computeNetWorthRows(inputs)` / no grace in inputs block; Phase 21 verify still references it |
| `accounts/actions.test.ts` embedded never-calls | **Keep + expand** | Add schedule; optionally add dedicated describe listing all five for SC1 clarity |
| New `griso.test.ts` | **Add** | Milestone SC3 twin of INISO |

Do **not** relocate smoke into griso unless planner wants single describe — if relocating, move then delete old describe in same commit to avoid duplication drift, never delete without replacement.

### 5. Gate hygiene after suite green (D-12)

1. `.planning/REQUIREMENTS.md`: `- [ ] **GRISO-01**` → `- [x] **GRISO-01**`
2. Traceability row: `GRISO-01 | Phase 22 | Pending` → `Complete`
3. `.planning/ROADMAP.md` Progress: Phase 22 `0/TBD` / `Not started` → plans complete / `Complete` + date
4. `.planning/STATE.md`: current focus / stopped_at / last_activity reflect Phase 22 complete (or next milestone close step)
5. Do **not** edit UX / RU copy unless a failing test forces it

### 6. Prior Phase 21 verify commands that must remain green

From `21-VERIFICATION.md` behavioral spot-checks `[VERIFIED: .planning/phases/21-kapital-forecast-integration/21-VERIFICATION.md:113-115]`:

```bash
npx vitest run src/lib/nw-forecast.test.ts src/lib/credit-grace.test.ts src/components/dashboard/nw-forecast-ui.test.ts
# plus wall greps (now should be automated in griso):
# no credit-grace in net-worth.ts / historical-series.ts
# nw-forecast imports dates/locf/money only
```

**Phase 22 recommended gate (extend, do not replace):**

```bash
npx vitest run \
  src/lib/griso.test.ts \
  src/lib/iniso.test.ts \
  src/lib/nw-forecast.test.ts \
  src/lib/credit-grace.test.ts \
  src/components/dashboard/nw-forecast-ui.test.ts \
  src/app/accounts/actions.test.ts
```

This session baseline (without griso yet): those files except griso → **85 passed**.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual grep walls at verify | Dedicated `*iso.test.ts` file-scan + golden | Phase 16–17 DISOL/INISO | Milestone-close automation |
| Partial GRISO smoke in domain test | Full GRISO twin + action gates | Phase 22 (this) | Closes GRISO-01 |
| Income whole-file BalanceSnapshot ban | Accounts per-path never-calls | v1.2 vs v1.3 | Shared actions module |

**Deprecated/outdated:**
- Treating Phase 21 “grep at verify” as sufficient milestone evidence — ROADMAP SC3 requires suite twin.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Optional Orca UAT not required if automated GRISO green and verify does not demand live chrome | D-13 / Environment | Planner may still need a thin UAT plan if verifier insists |
| A2 | No production code changes needed if walls stay green | Summary | If unexpected import appears mid-phase, plan needs a fix task |

*(A1–A2 are process assumptions; all discrete code values above were Read/probed this session.)*

## Open Questions (RESOLVED)

1. **Dedicated vs embedded write-gate its for update/close/reopen**
   - What we know: create has dedicated GRISO it; others embed asserts in happy path.
   - What's unclear: stylistic preference only.
   - Recommendation: add schedule dedicated it; optionally unify all five under `describe("GRISO write-gates")` without removing embedded asserts (belt + suspenders OK).
   - **RESOLVED:** Plan 22-01 T3 adds dedicated `updateGraceSchedule` never-calls; keeps create/update/close/reopen asserts; optional unified `describe("GRISO write-gates")` allowed without removing embedded asserts.

2. **Whether page overlay smoke stays in credit-grace.test.ts**
   - What we know: works; Phase 21 verify cites it.
   - Recommendation: leave; optionally duplicate a one-liner in griso — not required.
   - **RESOLVED:** Leave `credit-grace.test.ts` GRISO smoke + page overlay assert; add fuller `griso.test.ts` twin (D-03 discretion / Plan 22-01). No relocate/delete.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | vitest | ✓ | v24.5.0 | — |
| npm / npx | test runner | ✓ | npm 10.9.3 | — |
| vitest (project) | GRISO suite | ✓ | 4.1.11 | — |
| codegraph CLI | exploration | ✓ | installed | rg |
| Orca / orca-ide | optional UAT (D-13) | not probed | — | Skip unless verify requires; primary = vitest |
| graphify | optional graph | ✗ disabled | — | Skip (config) |

**Missing dependencies with no fallback:** none for core phase delivery.  
**Missing dependencies with fallback:** Orca (fallback = automated suite only).

Step 2.6: external tools limited to Node/vitest — available.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 4.1.11 |
| Config file | `vitest.config.ts` (`include: src/**/*.test.ts`) |
| Quick run command | `npx vitest run src/lib/griso.test.ts src/app/accounts/actions.test.ts` |
| Full suite command | `npx vitest run src/lib/griso.test.ts src/lib/iniso.test.ts src/lib/nw-forecast.test.ts src/lib/credit-grace.test.ts src/components/dashboard/nw-forecast-ui.test.ts src/app/accounts/actions.test.ts` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GRISO-01 SC1 | Grace mutations never call balanceSnapshot upsert/delete | unit (mock) | `npx vitest run src/app/accounts/actions.test.ts` | ✅ partial — expand schedule |
| GRISO-01 SC2 | Past LOCF identical; no grace API fields | unit (golden) | `npx vitest run src/lib/griso.test.ts` | ❌ Wave 0 |
| GRISO-01 SC3 | File-scan walls twin of INISO | unit (file-scan) | `npx vitest run src/lib/griso.test.ts` | ❌ Wave 0 |
| GRISO-01 (smoke) | net-worth/historical-series ∌ credit-grace; page inputs clean | unit | `npx vitest run src/lib/credit-grace.test.ts` | ✅ keep |
| Phase 21 regression | Forecast A′ / membership / UI scan | unit | Phase 21 command above | ✅ must stay green |

### Sampling Rate

- **Per task commit:** `npx vitest run src/lib/griso.test.ts src/app/accounts/actions.test.ts`
- **Per wave merge:** Full suite command above
- **Phase gate:** Full suite green before `/gsd-verify-work`; then D-12 checkbox sync

### Wave 0 Gaps

- [ ] `src/lib/griso.test.ts` — covers GRISO-01 SC2–SC3 (D-01/D-05–D-07/D-09–D-10)
- [ ] `src/app/accounts/actions.test.ts` — add `updateGraceSchedule` never-calls (and optionally unified GRISO describe)
- [ ] Framework install: none

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | local single-user app; no new authz |
| V5 Input Validation | yes (existing) | Zod on grace actions already; do not weaken |
| V6 Cryptography | no | — |

### Known Threat Patterns for GRISO / overlay isolation

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Grace writes BalanceSnapshot (history tamper) | Tampering | Action never-calls + no prisma.balanceSnapshot in grace bodies |
| Grace imported into historical NW LOCF | Tampering | File-scan walls on net-worth / historical-series |
| Forecast module reaches DB/history | Information Disclosure / Tampering | nw-forecast INISO bans retained |
| Whole-file BalanceSnapshot ban breaks BAL UX | Denial of Service (false) | Scope D-08 — never-calls only on grace paths |

Threats T-21-02 style remain closed by hardening tests, not new runtime controls.

## Sources

### Primary (HIGH confidence)

- `src/lib/iniso.test.ts` — full read; twin template
- `src/app/accounts/actions.ts` — export lines + grace bodies probed
- `src/app/accounts/actions.test.ts` — GRISO coverage map
- `src/lib/credit-grace.test.ts:299-322` — existing smoke
- `src/lib/historical-series.ts:59-66` — `BuildNetWorthSeriesInput`
- `src/lib/net-worth.ts` / `nw-forecast.ts` / `credit-grace.ts` — import headers
- `.planning/phases/22-graceiso-regression-polish/22-CONTEXT.md` — D-01…D-13
- `.planning/phases/21-kapital-forecast-integration/21-VERIFICATION.md:113-115` — prior verify cmds
- `npx vitest run` baseline this session — 85 passed
- `codegraph explore` / `codegraph node` — grace mutation symbols

### Secondary (MEDIUM confidence)

- `.planning/milestones/v1.2-phases/17-nw-forecast-overlay-isolation/17-CONTEXT.md` — INISO D-17/D-18 pattern
- `src/app/income/actions.test.ts:659-669` — income ISO write-gate contrast
- `src/lib/disol.test.ts` — ancestor file-scan shape

### Tertiary (LOW confidence)

- WebSearch on ESLint import boundaries — alternatives only; not adopted `[CITED: eslint.org/docs/latest/rules/no-restricted-imports]`

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new packages; vitest lock verified in package.json
- Architecture: HIGH — twin of existing INISO/DISOL; production walls probed
- Pitfalls: HIGH — comment false-positive and schedule gap verified in source

**Research date:** 2026-09-10  
**Valid until:** 2026-10-10 (stable isolation patterns; re-check if actions.ts gains new grace exports)
