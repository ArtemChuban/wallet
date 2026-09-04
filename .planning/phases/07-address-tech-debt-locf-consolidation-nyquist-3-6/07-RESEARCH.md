# Phase 7: Address tech debt: LOCF consolidation + Nyquist 3–6 - Research

**Researched:** 2026-09-04
**Domain:** Shared LOCF (balance + FX) consolidation; Nyquist VALIDATION reconciliation for phases 3–6
**Confidence:** HIGH (codebase-verified LOCF triplication + test evidence); MEDIUM (Nyquist close path — workflow-documented, not executed this session)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** User will default to «решай сам» for implementation gray areas — skip interactive discuss Q&A; researcher/planner choose concrete designs inside the boundary below. — **Reversibility:** reversible — can re-discuss later without code migration.
- **D-02:** Phase scope = **LOCF consolidation + Nyquist validate phases 3–6** only (roadmap title + audit highest-value items 1–2). Adjacent audit debt (nav «Валюты», PROJECT.md Active sync, optional Phase 1/2/3 smoke re-runs) stays **out of this phase** unless planner finds a zero-cost drive-by that does not expand plans. — **Reversibility:** reversible — fold extras in a later cleanup phase.
- **D-03:** LOCF = latest row with `asOfDate ≤ D`; before first row return `null` — never invent `0` / `1` (BAL-02, FX D-15 / Phase 4).
- **D-04:** List and dashboard “current” reads stay **batch** (one `findMany` + Map / shared builder), not N× `get*AsOf` round-trips (Phase 3 batch preference).
- **D-05:** Chart series keep pure multi-date LOCF over prefetched snapshots/rates; behavior must remain CHART-03-compatible (as-of × as-of, D-16 skip null FX on primary account series).

### Claude's Discretion
- Canonical LOCF API shape (pure-only vs hybrid maps+as-of vs Prisma-first) — prefer minimal drift from current architecture (audit: pages batch + series pure; helpers unused in prod).
- Fate of public `getBalanceAsOf` / `getRateAsOf` (keep as thin wrappers, internalize, or remove after rewiring tests).
- Module layout (`balances.ts`/`fx.ts` vs new `locf.ts` vs shared pure extract).
- Parity / regression proof strategy (dedicated parity suite vs retarget existing Vitest vs light smoke) — must keep BAL-02 / FX-02 / CHART-03 green.
- Nyquist close path: run `/gsd-validate-phase` for 3–6 and/or reconcile VALIDATION.md with existing verify+Vitest evidence; sequencing relative to LOCF refactor (before / after / interleaved) — choose whatever minimizes false gaps and rework.
- How aggressively to delete duplicated page Map loops once a shared builder exists.

### Deferred Ideas (OUT OF SCOPE)
- Nav «Валюты» landing on `/currencies/rates` vs `/currencies` (audit discoverability)
- Sync PROJECT.md Active → Validated for charts
- Optional re-run Phase 1 persist smoke; close Phase 2/3 human console / empty-CTA unverified behaviors
- Any new LOCF features or chart UX changes
</user_constraints>

<phase_requirements>
## Phase Requirements

Derived from CONTEXT + v1-MILESTONE-AUDIT (no REQ-IDs in ROADMAP yet). Preserve BAL-02 / FX-02 / CHART-03.

| ID | Description | Research Support |
|----|-------------|------------------|
| LOCF-01 | Extract shared pure LOCF pickers (balance amount + FX rate) with null-before-first | Architecture Patterns; Code Examples; D-03 |
| LOCF-02 | Replace triplicate page Map loops on `/accounts`, `/currencies/rates`, `/` with shared batch first-hit builders | Standard Stack recommendation; D-04 |
| LOCF-03 | `historical-series` builders call shared pure helpers (CHART-03 / D-16 unchanged) | Code touchpoints; Pitfalls |
| LOCF-04 | Keep `getBalanceAsOf` / `getRateAsOf` as Prisma `findFirst` thin wrappers; existing unit contracts stay green | Discretion recommendation; Don't Hand-Roll |
| LOCF-05 | Parity tests: pure pick ≡ batch first-hit map ≡ Prisma LOCF predicate | Validation Architecture |
| NYQ-03 | Phase 3 VALIDATION.md → `status: validated`, map rows reflect existing tests | Nyquist drafts; validate-phase workflow |
| NYQ-04 | Phase 4 VALIDATION.md → validated with evidence | same |
| NYQ-05 | Phase 5 VALIDATION.md → validated with evidence | same |
| NYQ-06 | Phase 6 VALIDATION.md → validated with evidence | same |
</phase_requirements>

## Summary

Wallet already implements correct LOCF semantics in three places: Prisma single-row helpers (`getBalanceAsOf` / `getRateAsOf`, tests-only in prod), page RSC batch Maps (first hit after `orderBy: { asOfDate: "desc" }` on `asOfDate <= today`), and private pure scanners in `historical-series.ts` for multi-date chart points. Audit flags this as drift risk for BAL-02 / FX-02 / CHART-03. Phase 7 consolidates the pure + batch paths into one shared module without changing semantics, then closes Nyquist for phases 3–6 whose `VALIDATION.md` files are still `draft` / `nyquist_compliant: false` despite VERIFICATION `passed` and a green Vitest suite (147 tests).

No new npm packages. Work is extract/rewire + evidence reconciliation. Graphify disabled in this project; findings come from direct file reads.

**Primary recommendation:** Add `src/lib/locf.ts` (pure `pickLatestAsOf` + `firstHitLocfMap`), rewire pages + `historical-series`, keep Prisma `get*AsOf` wrappers, add `locf.test.ts` parity, then reconcile VALIDATION.md for phases 3–6 after LOCF lands (docs-only Nyquist close unless a real MISSING gap appears).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Pure LOCF pick / batch Map builders | API / Backend (shared `src/lib`) | — | Deterministic domain rules; no UI |
| Prisma single-row `get*AsOf` | API / Backend (`balances.ts` / `fx.ts`) | Database / Storage | I/O boundary; thin wrapper over findFirst |
| Prefetch `findMany` for lists/dashboard/charts | Frontend Server (SSR RSC pages) | Database / Storage | One query per entity type; D-04 batch |
| Chart series multi-date LOCF | API / Backend (`historical-series.ts`) | Browser / Client (Recharts display only) | CHART-03 math stays server/lib; client gets majors |
| Nyquist VALIDATION.md updates | Planning / docs (`.planning/phases/*`) | — | No product UI; evidence gate |

## Project Constraints (from .cursor/rules/)

None found — `.cursor/rules/` absent in this workspace. Follow CONTEXT locks + existing money/LOCF contracts from prior phases.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vitest | 4.1.11 (pinned in package.json) `[VERIFIED: package.json via npm script / npm test banner]` | Unit tests + Nyquist sampling | Already project harness; `vitest.config.ts` includes `src/**/*.test.ts` |
| Prisma Client | existing (Phase 1 pin) | `findFirst` / `findMany` LOCF I/O | Keep wrappers; do not replace ORM |
| Next.js App Router RSC | existing | Pages batch prefetch | Current prod LOCF consumers |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| — | — | No new deps | Phase installs nothing |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| New `src/lib/locf.ts` | Export pure helpers only from `historical-series.ts` | Pages would import from charts module — wrong layering |
| New `locf.ts` | Duplicate tiny helpers into `balances.ts` + `fx.ts` | Two pure copies remain — fails consolidation goal |
| Keep Prisma-only | Force pages through N× `get*AsOf` | Violates D-04; slower; not current arch |
| Delete `get*AsOf` | Retarget all tests to pure-only | Loses explicit Prisma query-contract tests; higher churn |

**Installation:** none — no new packages.

**Version verification:** `vitest@4.1.11` in use (`npm test` → `RUN  v4.1.11`). Registry latest `vitest` is newer (`npm view vitest version` → `5.0.0`); **do not upgrade** in this phase — out of scope and risky for cleanup.

## Package Legitimacy Audit

> No external packages to install this phase.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| — | — | — | — | — | — | N/A — none proposed |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none for install (existing `vitest` legitimacy probe returned SUS/`too-new` against registry 5.x metadata while project stays on pinned 4.1.11 — no action)

## Architecture Patterns

### System Architecture Diagram

```text
                    ┌─────────────────────────────────────┐
                    │  RSC pages: /, /accounts, /rates    │
                    │  findMany where asOfDate <= today   │
                    │  orderBy asOfDate desc              │
                    └──────────────┬──────────────────────┘
                                   │ rows[]
                                   ▼
                    ┌─────────────────────────────────────┐
                    │  locf.ts                            │
                    │  firstHitLocfMap(rows, keyOf)       │  ← “current” LOCF (D-04)
                    │  pickLatestAsOf(rows, key, date)    │  ← multi-date / charts
                    └──────────────┬──────────────────────┘
                       ┌───────────┴───────────┐
                       ▼                       ▼
            computeNetWorthRows          buildNetWorthSeries /
            (dashboard today)            buildAccountSeries
                                         (CHART-03 as-of×as-of)

  balances.ts / fx.ts
  getBalanceAsOf / getRateAsOf ──► prisma.findFirst(lte, order desc)
  (tests + optional single lookup; not used by list/dashboard pages)
```

### Recommended Project Structure

```
src/lib/
├── locf.ts                 # NEW: pure pickLatestAsOf + firstHitLocfMap (+ thin typed wrappers)
├── locf.test.ts            # NEW: null-before-first + parity pure↔map
├── balances.ts             # keep getBalanceAsOf Prisma wrapper; re-export calendarDateToday
├── fx.ts                   # keep getRateAsOf Prisma wrapper
├── historical-series.ts    # import pickLatestAsOf; delete private locf* copies
src/app/
├── page.tsx                # use firstHitLocfMap for account+FX
├── accounts/page.tsx       # use firstHitLocfMap for balances
└── currencies/rates/page.tsx
.planning/phases/{03..06}/
└── *-VALIDATION.md         # reconcile to status: validated
```

### Pattern 1: Hybrid pure + batch + Prisma thin wrappers (RECOMMENDED)

**What:** One pure scanner for “latest row with `asOfDate ≤ D`”; one first-hit Map builder for desc-sorted `findMany` batches; Prisma helpers remain single-row I/O for tests.
**When to use:** Always for this phase — matches audit + D-03..D-05 with minimal drift.
**Example:**

```typescript
// Source: derived from src/lib/historical-series.ts:66-96 + page Map loops
// [VERIFIED: src/lib/historical-series.ts:66-80] private locfAmountAsOf returns best?.amountMinor ?? null
export function pickLatestAsOf<T>(
  rows: readonly T[],
  matchesKey: (row: T) => boolean,
  asOfOf: (row: T) => string,
  asOfDate: string,
): T | null {
  let best: T | null = null;
  for (const row of rows) {
    if (!matchesKey(row)) continue;
    const d = asOfOf(row);
    if (d > asOfDate) continue;
    if (!best || d > asOfOf(best)) best = row;
  }
  return best;
}

/** Requires rows already filtered `asOfDate <= D` and sorted by asOfDate desc. */
export function firstHitLocfMap<K, T>(
  rows: readonly T[],
  keyOf: (row: T) => K,
): Map<K, T> {
  const map = new Map<K, T>();
  for (const row of rows) {
    const key = keyOf(row);
    if (!map.has(key)) map.set(key, row);
  }
  return map;
}
```

### Pattern 2: Evidence-first Nyquist close

**What:** Treat phases 3–6 as State A in `/gsd-validate-phase`: drafts exist; Wave 0 files already on disk; suite green. Reconcile map statuses + frontmatter; spawn auditor only for true MISSING gaps.
**When to use:** After LOCF merge so VALIDATION commands still point at live APIs.
**Example frontmatter target** (mirror Phase 1/2):

```yaml
status: validated
nyquist_compliant: true
wave_0_complete: true
```

`[VERIFIED: .planning/phases/01-docker-sqlite-foundation/01-VALIDATION.md:6-9]` quotes:
`status: validated` / `nyquist_compliant: true` / `wave_0_complete: true`

### Anti-Patterns to Avoid

- **N× `get*AsOf` in RSC pages:** violates D-04; reintroduces chatty SQLite.
- **Inventing `0n` / unit rate before first row:** violates D-03 / BAL-02 / FX D-15; classic LOCF libraries that fill leading NA with mean/rev are wrong here `[CITED: rdrr.io/cran/imputeTS/man/na_locf.html — leading NA has no prior; wallet keeps null]`.
- **Pages importing from `historical-series` for “today” Maps:** couples list UI to chart module.
- **Nyquist-before-LOCF then rewrite:** VALIDATION task rows would need a second pass after helper renames.
- **Scope creep into nav / PROJECT.md Active:** deferred by D-02.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| LOCF predicate | Third bespoke loop per page | Shared `pickLatestAsOf` / `firstHitLocfMap` | Drift is the debt being fixed |
| Single-row DB LOCF | Custom SQL / raw queries | Existing Prisma `findFirst` + `orderBy desc` | Already correct + tested |
| Chart as-of×as-of | New chart math | Keep `computeNetWorthRows` + series builders | CHART-03 already covered |
| Nyquist harness | New test framework | Existing Vitest 4.1.11 | 18 files / 147 tests green |
| Leading-null policy | Impute 0/1/mean | Return `null` | Locked D-03 |

**Key insight:** Consolidation is a single pure function + one batch Map helper — not a new library ecosystem.

## Common Pitfalls

### Pitfall 1: firstHitMap without desc sort
**What goes wrong:** Map stores earliest row instead of latest ≤ D.
**Why it happens:** Shared helper hides the ordering precondition.
**How to avoid:** Document precondition; pages keep `orderBy: { asOfDate: "desc" }`; parity tests use unsorted arrays only on `pickLatestAsOf`, and desc-sorted fixtures on `firstHitLocfMap`.
**Warning signs:** List “current” balance older than a newer snapshot on same account.

### Pitfall 2: Changing chart skip-null-FX behavior
**What goes wrong:** Primary-mode series paints points that should skip (D-16).
**Why it happens:** Refactor renames helpers and accidentally coalesces null rate to identity.
**How to avoid:** Keep `if (rate === null) continue` paths; run `historical-series.test.ts` CHART-03 / D-16 cases every LOCF commit.
**Warning signs:** Failures in “primary mode skips dates with null LOCF FX”.

### Pitfall 3: Deleting `get*AsOf` mid-phase
**What goes wrong:** `balances.test.ts` / `fx.test.ts` churn; BAL-02/FX-02 evidence murkier.
**Why it happens:** Audit says “unused in prod” → delete.
**How to avoid:** Keep thin wrappers (discretion recommendation). Optional later cleanup phase.
**Warning signs:** Large diffs in Prisma mock tests unrelated to shared pure module.

### Pitfall 4: Marking Nyquist validated without green suite evidence
**What goes wrong:** Audit flips to COMPLIANT while maps still ❌ W0.
**Why it happens:** Frontmatter-only edit.
**How to avoid:** Update File Exists / Status columns; append Validation Audit table like Phase 2; require `npm test` green in plan verify.
**Warning signs:** `status: validated` with unchecked Wave 0 boxes.

### Pitfall 5: Dashboard chart prefetch vs list LOCF divergence
**What goes wrong:** Home uses one array for Maps and chart props today (`snapshotsLteToday` / `ratesLteToday`) `[VERIFIED: src/app/page.tsx:28-45,180-189]`. Splitting queries without care breaks CHART-03 vs NW hero consistency.
**How to avoid:** Keep single prefetch feeding both Map builder and series inputs.
**Warning signs:** Hero total ≠ last chart point for “all” range on same day.

## Code Examples

### Pure amount LOCF (current private impl — extract verbatim semantics)

```typescript
// Source: [VERIFIED: src/lib/historical-series.ts:66-80]
function locfAmountAsOf(
  snapshots: SeriesSnapshot[],
  accountId: number,
  asOfDate: string,
): bigint | null {
  let best: SeriesSnapshot | null = null;
  for (const snap of snapshots) {
    if (snap.accountId !== accountId) continue;
    if (snap.asOfDate > asOfDate) continue;
    if (!best || snap.asOfDate > best.asOfDate) {
      best = snap;
    }
  }
  return best?.amountMinor ?? null;
}
```

### Batch first-hit Map (current page pattern — extract)

```typescript
// Source: [VERIFIED: src/app/accounts/page.tsx:41-52]
const locfByAccount = new Map<
  number,
  { asOfDate: string; amountMinor: bigint }
>();
for (const snap of snapshotsLteToday) {
  if (!locfByAccount.has(snap.accountId)) {
    locfByAccount.set(snap.accountId, {
      asOfDate: snap.asOfDate,
      amountMinor: snap.amountMinor,
    });
  }
}
```

### Prisma single-row LOCF (keep)

```typescript
// Source: [VERIFIED: src/lib/balances.ts:10-16]
export async function getBalanceAsOf(accountId: number, asOfDate: string) {
  await ensureSqlitePragmas();
  return prisma.balanceSnapshot.findFirst({
    where: { accountId, asOfDate: { lte: asOfDate } },
    orderBy: { asOfDate: "desc" },
  });
}
```

### Parity test skeleton

```typescript
// Source: pattern from balances.test.ts + historical-series LOCF semantics
it("firstHitLocfMap on desc rows matches pickLatestAsOf for today", () => {
  const rows = [
    { accountId: 1, asOfDate: "2026-02-01", amountMinor: 200n },
    { accountId: 1, asOfDate: "2026-01-01", amountMinor: 100n },
  ];
  const map = firstHitLocfMap(rows, (r) => r.accountId);
  const picked = pickLatestAsOf(
    rows,
    (r) => r.accountId === 1,
    (r) => r.asOfDate,
    "2026-03-01",
  );
  expect(map.get(1)?.amountMinor).toBe(200n);
  expect(picked?.amountMinor).toBe(200n);
});

it("before first row both paths yield null", () => {
  const rows = [{ accountId: 1, asOfDate: "2026-02-01", amountMinor: 200n }];
  expect(
    pickLatestAsOf(rows, (r) => r.accountId === 1, (r) => r.asOfDate, "2025-12-31"),
  ).toBeNull();
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Triplicate LOCF (Prisma + page Maps + private series) | Shared `locf.ts` + thin Prisma wrappers | Phase 7 (planned) | One semantics surface |
| VALIDATION.md draft for 3–6 | `status: validated` after evidence reconcile | Phase 7 (planned) | Nyquist COMPLIANT for 3–6 |
| Phase 1–2 already validated | Leave alone | 2026-09-02/03 | Pattern to copy |

**Deprecated/outdated:**
- Inline page Map loops after shared builder exists — delete aggressively once callers compile (discretion: yes, remove duplicates).

## Discretion Recommendations (planner MUST treat as defaults)

| Topic | Recommendation | Rationale |
|-------|----------------|-----------|
| Canonical API | Hybrid: pure + batch Map + Prisma wrappers | Minimal drift; honors D-04/D-05 |
| `getBalanceAsOf` / `getRateAsOf` | **Keep** public thin wrappers | Tests-primary; cheap; documents Prisma contract |
| Module layout | **New** `src/lib/locf.ts` | Avoid page→charts coupling |
| Parity proof | **Dedicated** `locf.test.ts` + keep existing BAL/FX/CHART suites | Cheap; targets consolidation risk |
| Nyquist sequencing | **After** LOCF refactor | Avoid double VALIDATION edits |
| Nyquist method | Evidence reconcile (State A); full `/gsd-validate-phase` auditor only if MISSING gaps | Wave 0 files already exist; 147 tests green |
| Delete page loops | **Aggressive** once shared builder wired | Debt item is the duplicate loops |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Classic LOCF libs’ leading-NA behavior aligns with wallet null-before-first (supporting narrative only; not importing those libs) | Don't Hand-Roll / Pitfalls | Low — wallet contract already locked in D-03 and tests |
| A2 | Interactive `/gsd-validate-phase` user gate can be satisfied in plan as “reconcile with suite green” without spawning auditor when gap analysis shows COVERED | Nyquist | Medium — if workflow hooks require auditor always, plans need explicit validate-phase runs |

**If wrong on A2:** planner schedules four `/gsd-validate-phase` invocations (or one plan with four phase targets) instead of docs-only reconcile.

## Open Questions (RESOLVED)

1. **Should VALIDATION task IDs stay historical (03-W0-01…) or be rewritten to current files only?**
   - What we know: Phase 2 kept historical IDs and marked ✅ green.
   - What's unclear: How strict audit-milestone is about stale ❌ W0 labels.
   - RESOLVED: Keep historical VALIDATION task IDs; flip File Exists + Status; check Wave 0 boxes; append Validation Audit section (plans implement this).

2. **Optional re-export of `locfAmountAsOf` / `locfRateAsOf` names for readability?**
   - RESOLVED: Yes — export thin typed wrappers `locfAmountAsOf` / `locfRateAsOf` over generic pick for call-site clarity in `historical-series.ts` (plans implement this).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vitest / Next | ✓ | v24.5.0 | — |
| npm | scripts | ✓ | 10.9.3 | — |
| Vitest | LOCF + Nyquist | ✓ | 4.1.11 | — |
| Context7 / ctx7 CLI | External docs | ✗ | — | Use codebase + existing Vitest patterns |
| Graphify | Code search preference | ✗ (disabled) | — | Grep/Read |
| Docker | Not required this phase | (not probed) | — | N/A for LOCF/Nyquist docs |

**Missing dependencies with no fallback:** none for phase scope.

**Missing dependencies with fallback:** Context7 → in-repo patterns; Graphify → Grep/Read.

Step 2.6 note: Phase is code + planning docs; no new external services.

## Validation Architecture

> `workflow.nyquist_validation` is `true` in `.planning/config.json` `[VERIFIED: .planning/config.json workflow.nyquist_validation]`.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.11 |
| Config file | `vitest.config.ts` (`include: src/**/*.test.ts`) |
| Quick run command | `npx vitest run src/lib/locf.test.ts src/lib/balances.test.ts src/lib/fx.test.ts src/lib/historical-series.test.ts` |
| Full suite command | `npm test` (= `vitest run`) |
| Current baseline | 18 files / 147 tests passed (2026-09-04 research run) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LOCF-01 | Pure pick null-before-first + latest ≤ D | unit | `npx vitest run src/lib/locf.test.ts` | ❌ Wave 0 |
| LOCF-02 | Pages use shared Map builder (source-contract or behavior via lib tests) | unit | `npx vitest run src/lib/locf.test.ts` | ❌ Wave 0 |
| LOCF-03 | Series CHART-03 / D-16 still green | unit | `npx vitest run src/lib/historical-series.test.ts` | ✅ |
| LOCF-04 | Prisma get*AsOf contracts | unit | `npx vitest run src/lib/balances.test.ts src/lib/fx.test.ts` | ✅ |
| LOCF-05 | Pure ↔ Map parity | unit | `npx vitest run src/lib/locf.test.ts` | ❌ Wave 0 |
| NYQ-03 | Phase 3 VALIDATION reconciled | docs + suite | `npm test` + edit `03-VALIDATION.md` | VALIDATION ✅ draft → target validated |
| NYQ-04 | Phase 4 VALIDATION reconciled | docs + suite | `npm test` + edit `04-VALIDATION.md` | draft → validated |
| NYQ-05 | Phase 5 VALIDATION reconciled | docs + suite | `npm test` + edit `05-VALIDATION.md` | draft → validated |
| NYQ-06 | Phase 6 VALIDATION reconciled | docs + suite | `npm test` + edit `06-VALIDATION.md` | draft → validated |

### Existing evidence already COVERED (Nyquist reconcile inputs)

| Phase | Draft claims ❌ W0 | Actual files (research) |
|-------|--------------------|-------------------------|
| 3 | `balances.test.ts`, `validations/balance.test.ts`, actions tests | All present under `src/` |
| 4 | `fx.test.ts`, `validations/fx.test.ts`, money/actions | All present |
| 5 | `net-worth.test.ts` | Present |
| 6 | `historical-series.test.ts` | Present |

### Sampling Rate

- **Per task commit:** quick LOCF command above
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`; VALIDATION.md 3–6 show `status: validated` + `nyquist_compliant: true`

### Wave 0 Gaps

- [ ] `src/lib/locf.ts` — shared pure + batch helpers
- [ ] `src/lib/locf.test.ts` — LOCF-01 / LOCF-05 parity + null-before-first
- [ ] Rewire `page.tsx`, `accounts/page.tsx`, `rates/page.tsx`, `historical-series.ts`
- [ ] Reconcile `03|04|05|06-VALIDATION.md` (not new product tests unless auditor finds MISSING)

Framework install: none.

## Security Domain

> `security_enforcement` enabled (config absent key would default on; present `true`).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Local single-user app |
| V3 Session Management | no | — |
| V4 Access Control | no | No multi-user |
| V5 Input Validation | yes (unchanged) | Existing Zod on balance/FX actions — do not weaken |
| V6 Cryptography | no | — |

### Known Threat Patterns for LOCF / SQLite wallet

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Invented balances/rates rewriting history | Tampering / Repudiation | Null-before-first; as-of×as-of; no silent 0/1 |
| Future-dated snapshots/rates | Tampering | Existing Server Action rejects (Phase 3/4) — out of scope to change |
| Injection via raw SQL LOCF | Tampering | Keep Prisma parameterized findFirst/findMany |

## Sources

### Primary (HIGH confidence)

- `src/lib/balances.ts`, `src/lib/fx.ts`, `src/lib/historical-series.ts` — LOCF implementations (Read this session)
- `src/app/page.tsx`, `src/app/accounts/page.tsx`, `src/app/currencies/rates/page.tsx` — batch Maps
- `.planning/phases/03..06/*-VALIDATION.md` — draft Nyquist state
- `.planning/phases/01..02/*-VALIDATION.md` — validated frontmatter pattern
- `.planning/v1-MILESTONE-AUDIT.md` — triplicate LOCF + not_validated_phases [3,4,5,6]
- `.planning/phases/07-.../07-CONTEXT.md` — locked decisions
- `npm test` — 147 passed baseline
- `.cursor/gsd-core/workflows/validate-phase.md` — State A reconcile path

### Secondary (MEDIUM confidence)

- Phase 2 Validation Audit pattern for closing drafts
- Vitest pinned usage (Context7 unavailable; in-repo harness verified)

### Tertiary (LOW confidence)

- WebSearch LOCF library behavior (imputeTS/zoo) — narrative only; not adopted as deps `[ASSUMED` alignment with null-leading`]`

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; Vitest verified in-repo
- Architecture: HIGH — three call sites + helpers read end-to-end
- Pitfalls: HIGH — derived from locked semantics + observed page/series coupling
- Nyquist close path: MEDIUM — workflow read; not executed; A2 open

**Research date:** 2026-09-04
**Valid until:** 2026-10-04 (stable domain; recheck if LOCF files move before planning)
