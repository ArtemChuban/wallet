# Phase 18: Bank contract study + discuss locks - Research

**Researched:** 2026-09-08
**Domain:** Docs-only CONT-01 gate — T-Bank Platinum grace semantics → locked CONTEXT; Phase 19 schema implications
**Confidence:** HIGH (locks + contract artifacts in-repo); MEDIUM (Phase 21 tooltip/slot shape details)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Bank contract + cycle math
- **D-01:** Cycle **start** = statement (выписка) formation date; this card uses fixed **DOM 21**. — **Reversibility:** costly — schedule fields and cycle keys assume statement-anchored months.
- **D-02:** Interest-free **due** = **DOM 15 of the next month**, always (not a fixed `+N` calendar days). N varies (~22–25; shorter in February). «До 55 дней» in the tariff is marketing max from early-period purchase → due, **not** statement+55. — **Reversibility:** one-way — RESEARCH defaulted to `graceDurationDays` alone; product truth is **dual DOM** (statement day + due day next month). Duration may be derived for display; do not treat a single stored N as the sole source of truth for this bank.
- **D-03:** Month-end for statement DOM uses **`clampDayOfMonth`** (same as income). Due DOM 15 never needs clamp.
- **D-04:** `dueAsOf` = the 15th **inclusive**; overdue / highlight from the **16th** (Moscow calendar day, app convention).
- **D-05:** Amount due = **one manual field**: full «платёж для беспроцентного периода» from the statement (debt without installments + regular installment payment). No second field for installments; user copies bank total.
- **D-06:** Changing statement day in the bank app is **out of design scope** for v1.3 — account stores editable DOM fields; change = manual edit; no history migration engine.

#### Interest-free vs revolving OOS
- **D-07:** On missed due: **overdue highlight** + short RU hint that the bank may charge interest — **no** APR/penalty math in-app.
- **D-08:** Cash / cash-like ops (59.9%): **fully OOS** — no modeling, no special type.
- **D-09:** Bank rule «missed minimum voids next interest-free»: **not modeled** (would need minimum amount / triad UI).
- **D-10:** Penalty 20%, overlimit fee, insurance %: **all OOS**. Wallet tracks grace payoff amount + forecast visibility only.

#### NW overlay (Option A′)
- **D-11:** Reject naive Option A dip (`−grace` on «Прогноз» while credit **Задолженность** already reduces NW). Lock **A′ NW-neutral pay**: at `dueAsOf`, obligation is **visible**, forecast **NW delta = 0** (debt offset / pay-from-assets semantics). — **Reversibility:** costly — Phase 21 chart/tests and signed-slot design depend on this; differs from research default “cash-out dip”.
- **D-12:** Visibility at zero NW delta = **tooltip / point detail** on due (not a second chart series in v1.3).
- **D-13:** Same-day income + grace: **one** signed cumulative «Прогноз» series; tooltip **distinguishes** income vs obligation.

#### RU vocabulary
- **D-14:** Snapshot credit debt label: **«Задолженность»**.
- **D-15:** Manual grace amount label: **«Платёж для беспроцентного»** (align with bank wording; not «минимальный платёж»).
- **D-16:** Minimum payment: **not shown** in UI for v1.3.
- **D-17:** Schedule fields: **«Дата выписки»** + **«Оплатить до»**.
- **D-18:** Obligation UX status: **«К оплате»** / **«Оплачено»**; overdue = highlight, not a separate persisted status enum required by discuss.
- **D-19:** Chart tooltip copy: **«Платёж для беспроцентного»** + пояснение **«NW без изменения (оплата карты)»**.

### Claude's Discretion
- Exact microcopy for overdue interest hint (D-07) — keep short, match Debts/Income tone.
- Implementation of NW-neutral offset (literal `+debt` leg vs membership-only slot with 0 delta) — research/plan choose simplest correct approach under D-11–D-13.
- Whether Phase 19 stores `statementDayOfMonth` + `dueDayOfMonth` vs anchor date + dual DOM ints — must satisfy D-02; prefer dual DOM over sole `graceDurationDays`.

### Deferred Ideas (OUT OF SCOPE)
None new — discussion stayed inside Phase 18 / CONT-01. APR engine, minimum triad, cash modeling, statement-date migration remain milestone Out of Scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CONT-01 | Bank contract studied and grace rules documented in phase CONTEXT before plan lock | Prove closed via artifact checklist below: CONTEXT D-01…D-19 + CONTRACT-NOTES + TP 7.90 PDF/txt; map ROADMAP success criteria → decision IDs; flag REQUIREMENTS/ROADMAP wording still saying sole `duration (days)` / Option A vs B so Phase 19 does not re-lock wrong defaults |
</phase_requirements>

## Summary

Phase 18 is a **documentation / decision-lock gate**, not a code phase. Discuss already produced `18-CONTEXT.md` with D-01…D-19, distilled `18-CONTRACT-NOTES.md`, and the user tariff (`platinum-TP-7.90.pdf` / `.txt`). Official T-Bank rules PDF confirms: for TP 7.90 (not TP 23.X / 7.790), interest-free deadline = **дата минимального платежа** on that statement; bank vocabulary separates **Беспроцентный период** vs **Льготный период**. [CITED: cdn.tbank.ru/static/documents/credit_cards-tariff-rules.pdf §1.1]

Milestone research (`.planning/research/SUMMARY.md`) defaulted to sole `graceDurationDays` + Option A cash-out dip. **CONTEXT overrides both:** dual DOM (21 → 15 next) and **A′ NW-neutral** (visible slot, ΔNW = 0). Planner must treat CONTEXT as SoT and treat SUMMARY/ARCHITECTURE field sketches as **stale where they conflict**.

**Primary recommendation:** Plan Phase 18 as CONT-01 close-out only — acceptance checklist + REQUIREMENTS/ROADMAP drift notes for Phase 19. Prefer schema `statementDayOfMonth` + `dueDayOfMonth` (income-style DOM + `clampDayOfMonth`); prefer A′ as **membership slot with `deltaMinor = 0` + tooltip metadata**, not paired fake legs.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Contract study + grace rule lock (CONT-01) | Planning docs (`.planning/phases/18-…`) | — | No runtime; decisions live in CONTEXT |
| Cycle start / due calendar math (future) | API / Backend pure lib (`credit-grace.ts`) | Database (Account DOM fields) | Same pattern as `income.ts` + `clampDayOfMonth` |
| Manual amount / open-close (future) | API / Backend Server Actions | Browser form UX | Manual minor + Zod; no snapshot write |
| NW overlay A′ (future) | Browser / Client chart + `nw-forecast` pure | Frontend Server (page merge) | Overlay only; historical NW unchanged |
| Snapshot «Задолженность» | Database / Storage `BalanceSnapshot` | Browser display | Already shipped; grace must not write it |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| (none new) | — | Phase 18 installs **zero** packages | Docs-only CONT-01 [VERIFIED: phase boundary 18-CONTEXT.md:9-11] |
| Vitest | 4.1.11 | Existing test runner for optional checklist script / later phases | [VERIFIED: package.json test script + vitest pin] |
| Prisma / Next / Zod / recharts | pinned in app | Downstream Phase 19–21 only | [CITED: .planning/research/SUMMARY.md] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@/lib/dates` `clampDayOfMonth` / `addCalendarDays` / `calendarDateToday` | in-repo | Statement month walk; Moscow today for overdue | Phase 19+; do **not** use `addCalendarDays(start, N)` as sole due truth [VERIFIED: src/lib/dates.ts:12-66] |
| `RecurringIncome.dayOfMonth` pattern | in-repo | Analog for dual DOM ints | Prefer mirror over inventing `graceDurationDays`-only [VERIFIED: prisma/schema.prisma:133-135] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Dual DOM ints | Sole `graceDurationDays` | RESEARCH default; **rejected** by D-02 for this bank |
| A′ delta=0 membership | Naive Option A `−grace` | Double-counts debt stock already in NW; **rejected** by D-11 |
| A′ | Option B second series | Extra chart complexity; D-12 locks tooltip-only visibility |
| Re-fetch / parse PDF in app | Keep PDF under phase dir | OCR/parser OOS; human already distilled notes |

**Installation:**

```bash
# Phase 18: no npm install
```

**Version verification:** No new packages. Existing Vitest `4.1.11` from `package.json` scripts/`devDependencies` [ASSUMED publish date not re-queried this session — pin string only].

## Package Legitimacy Audit

> Phase installs **no** external packages. Gate N/A.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| — | — | — | — | — | — | No installs |

**Packages removed due to [SLOP] verdict:** none  
**Packages flagged as suspicious [SUS]:** none

## Project Constraints (from .cursor/rules/)

No `.cursor/rules/` directory present in this workspace. Follow `AGENTS.md` / Next agent-files note and operator prefs (read `.planning/OPERATOR.md` before UAT — not required for this docs phase).

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  INPUTS (Phase 18)                                               │
│  platinum-TP-7.90.pdf/txt  →  18-CONTRACT-NOTES.md               │
│  T-Bank tariff-rules.pdf   →  confirms min-pay deadline (TP7.90) │
│  Discuss answers           →  18-CONTEXT.md D-01…D-19            │
└───────────────────────────────┬─────────────────────────────────┘
                                │ CONT-01 gate
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  LOCKED PRODUCT TRUTH                                            │
│  cycle: statement DOM 21 → due DOM 15 next (clamp on statement)  │
│  amount: one manual «Платёж для беспроцентного»                  │
│  overlay: A′ visible @ due, ΔNW=0 + tooltip                      │
│  vocab: Задолженность ≠ Платёж для беспроцентного ≠ минимум      │
│  OOS: APR, cash 59.9%, missed-min void, fees                     │
└───────────────────────────────┬─────────────────────────────────┘
                                │ feeds (no code in 18)
           ┌────────────────────┼────────────────────┐
           ▼                    ▼                    ▼
     Phase 19 schema      Phase 20 UI copy      Phase 21 nw-forecast
     dual DOM fields      RU labels D-14…19     A′ slot + tooltip
```

### CONT-01 closed — proof artifacts

Planner/executor must treat CONT-01 **done** when all of the following are true (checklist for Phase 18 plan tasks / VERIFICATION):

| # | Evidence | Maps to ROADMAP SC |
|---|----------|-------------------|
| 1 | `18-CONTEXT.md` exists, Status Ready for planning, Decisions D-01…D-19 present | SC1, SC2, SC3, SC4 |
| 2 | `18-CONTRACT-NOTES.md` has user calendar 21 → 15 next + tariff distillation | SC1 |
| 3 | `platinum-TP-7.90.pdf` + `.txt` present in phase dir | SC1 |
| 4 | Locked: start=выписка, dual DOM (not sole +N), clamp, interest-free vs revolving OOS (D-07…D-10) | SC2 |
| 5 | Overlay **A′** locked (not deferred A); D-11…D-13 | SC3 (wording in ROADMAP still says “A vs B” — **update note**) |
| 6 | RU vocab D-14…D-19 | SC4 |

### CONTEXT overrides research defaults

| Research default (SUMMARY / ARCHITECTURE) | CONTEXT lock | Planner action |
|-------------------------------------------|--------------|----------------|
| `graceAnchorAsOf` + `graceDurationDays`; due = `addCalendarDays(start, days)` | Dual DOM; due = DOM 15 next month (D-02) | Do **not** plan Phase 19 around sole duration column |
| Overlay Option A = negative cash-out dip | **A′** NW-neutral, Δ=0 + tooltip (D-11…D-12) | Phase 21 golden: debt D + amountDue ≤ D → forecast NW **not** −amountDue |
| “до 55 дней” as duration hint | Marketing max only (D-02, CONTRACT-NOTES) | Display-only if shown; never schema SoT |
| Min payment as possible UI | Not shown (D-16) | No min field in Phase 20 |

### Recommended Project Structure (Phase 18 deliverables)

```
.planning/phases/18-bank-contract-study-discuss-locks/
├── 18-CONTEXT.md              # SoT locks (already)
├── 18-CONTRACT-NOTES.md       # Distilled bank rules (already)
├── platinum-TP-7.90.pdf|.txt  # User tariff (already)
├── 18-RESEARCH.md             # This file
├── 18-*-PLAN.md               # CONT-01 checklist / drift notes only
└── (optional) 18-CONT-01-CHECKLIST.md  # Executable acceptance list
```

Downstream (not Phase 18):

```
prisma/schema.prisma           # + statementDayOfMonth + dueDayOfMonth (+ obligation child)
src/lib/credit-grace.ts        # cycle starts via clamp; due via next-month DOM
src/lib/nw-forecast.ts         # signed / zero-delta slots + kind for tooltip
```

### Pattern 1: Dual DOM schedule (prefer for Phase 19)

**What:** Store two ints on `Account` (FIAT_CREDIT), mirror income `dayOfMonth`.  
**When to use:** Always for this milestone under D-02 / Claude discretion.  
**Example (sketch — Phase 19 implements; names discretionary):**

```typescript
// Pattern: income already stores dayOfMonth + clamps at generation
// [VERIFIED: prisma/schema.prisma:133-135]
//   dayOfMonth         Int // 1–31; clamp at generation (D-16)
// [VERIFIED: src/lib/dates.ts:56-66]
//   export function clampDayOfMonth(
//     year: number,
//     month1to12: number,
//     dayOfMonth: number,
//   ): string { ... }

function dueAsOfForCycle(statementAsOf: string, dueDayOfMonth: number): string {
  // statement month M → due in month M+1 on dueDayOfMonth (15 never clamps)
  // Do NOT: addCalendarDays(statementAsOf, graceDurationDays) as sole SoT
}
```

### Pattern 2: A′ membership-only zero delta (prefer)

**What:** Include open grace in forecast membership at `dueAsOf` with **primary delta 0**; carry RU label for tooltip.  
**When to use:** D-11…D-13; Phase 21.  
**Why not paired +debt/−cash legs:** App does not auto-mutate credit available / BalanceSnapshot on grace close (GRISO); fabricating a debt leg would lie about stock. Zero NW delta + copy is honest under overlay-only.

```typescript
// Current ForecastSlot is unsigned-additive income only:
// [VERIFIED: src/lib/nw-forecast.ts:17-24]
//   export type ForecastSlot = {
//     parentId: number;
//     plannedAsOf: string;
//     plannedAmountMinor: bigint;
//     currencyCode: string;
//     currencyScale: number;
//     isPrimaryCurrency: boolean;
//   };
// Stair-step still emits a sample date when add=0
// [VERIFIED: src/lib/nw-forecast.ts:146-154]
//   const add = addByDate.get(asOfDate) ?? 0n;
//   running += add;
//   points.push({ asOfDate, forecastPrimaryMinor: running, forecast: ... });
// Phase 21: extend slot with kind/label (or parallel detail map) so tooltip
// can show D-19 copy when delta is 0.
```

### Anti-Patterns to Avoid

- **Re-opening bank discuss in Phase 19:** CONTEXT is locked; only apply overrides.
- **Planning schema from SUMMARY sketches verbatim:** field names `graceDurationDays` alone conflict with D-02.
- **Treating ROADMAP Phase 19 SC (“addCalendarDays(start, days)”) as still authoritative:** must be amended when planning 19.
- **Shipping PDF parser / APR fields “just in case”:** OOS; CONT-01 exists to prevent this.
- **Using DISCUSSION-LOG as SoT:** log says audit trail only — CONTEXT wins.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bank grace semantics | Guess from blog / other banks | User TP 7.90 + CONTEXT + CONTRACT-NOTES | Pitfall 3 / CONT-01 |
| Calendar month edges | Custom month arithmetic | `clampDayOfMonth` | Income-proven [VERIFIED: src/lib/dates.ts:56-66] |
| Docs-gate proof | Manual “looks done” | Explicit CONT-01 checklist mapped to SC | Docs-only phases need structural evidence |
| NW double-count | `−amountDue` on Прогноз | A′ Δ=0 + tooltip (D-11) | Debt stock already in LOCF NW |
| Isolation tests later | Ad-hoc asserts | Mirror `iniso.test.ts` file-scan + golden | [VERIFIED: src/lib/iniso.test.ts:12-30] |

**Key insight:** Phase 18 value is **preventing wrong schema**. Execution is checklist + drift communication, not code.

## Common Pitfalls

### Pitfall 1: Planner copies stale SUMMARY schema
**What goes wrong:** Phase 19 adds `graceDurationDays` as sole due engine; Feb/length drift vs real 21→15.  
**Why:** SUMMARY/ARCHITECTURE still show duration-days sketch.  
**How to avoid:** Every Phase 19 plan task cites D-02; dual DOM required.  
**Warning signs:** PLAN mentions only `addCalendarDays(start, days)` for due.

### Pitfall 2: ROADMAP SC3 vs A′ mismatch
**What goes wrong:** Verifier checks “Option A or B” and fails A′ or re-opens discuss.  
**Why:** ROADMAP written before discuss refined A′.  
**How to avoid:** Phase 18 plan updates ROADMAP SC3 text to A′ (or notes override in VERIFICATION).  
**Warning signs:** Plan still says “defer default A”.

### Pitfall 3: REQUIREMENTS CYCLE-01 / PROJECT wording lag
**What goes wrong:** CYCLE-01 still: “start date and duration (days)”. Implementers satisfy literal text, violate D-02.  
**Why:** Requirements frozen at roadmap creation.  
**How to avoid:** Phase 18 or early 19 amend CYCLE-01 / PROJECT goal bullets to “statement DOM + due DOM (monthly)” while keeping CONT-01 semantics.  
**Warning signs:** Acceptance tests for CYCLE-01 assert fixed N days.

### Pitfall 4: Treating «льготный» / «беспроцентный» as synonyms in UI
**What goes wrong:** Copy confuses bank terms; user mistrusts amount field.  
**Why:** Rules PDF defines both differently [CITED: tariff-rules §1.1].  
**How to avoid:** Stick to D-14…D-19 labels; hide minimum (D-16).  
**Warning signs:** Label «минимальный платёж» on grace amount.

### Pitfall 5: Docs phase with empty Validation Architecture
**What goes wrong:** Nyquist / verifier has nothing runnable; CONT-01 never formally checked.  
**Why:** No Prisma/UI = temptation to skip tests.  
**How to avoid:** Checklist script or markdown acceptance table + `rg` file existence checks.  
**Warning signs:** VERIFICATION.md says “N/A” with no artifact proof.

## Code Examples

### Overdue boundary (product lock)

```typescript
// D-04: dueAsOf = 15th inclusive; overdue from 16th (Moscow calendarDateToday)
// [VERIFIED: src/lib/dates.ts:12-26 default Europe/Moscow]
const today = calendarDateToday(); // "Europe/Moscow"
const isOverdue = status === "OPEN" && today > dueAsOf; // dueAsOf === "...-15" → true from 16th
```

### Income DOM analog (reuse in Phase 19)

```typescript
// [VERIFIED: prisma/schema.prisma:133-135]
// dayOfMonth         Int // 1–31; clamp at generation (D-16)
// [VERIFIED: src/lib/income.ts uses clampDayOfMonth — codegraph: income.ts imports dates]
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Sole `graceDurationDays` + Option A dip | Dual DOM + A′ NW-neutral | 2026-09-08 discuss (Phase 18) | Schema + forecast redesign before any migration |
| Generic bank articles | User TP 7.90 + official rules PDF | Phase 18 | CONT-01 satisfiable with in-repo artifacts |

**Deprecated/outdated for this milestone:**
- RESEARCH default “cash-out dip” as product truth — superseded by A′
- Sole duration-days as due SoT — superseded by D-02
- ROADMAP Phase 18 SC3 “A vs B” phrasing — product locked A′

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Vitest pin `4.1.11` still current on registry (not re-`npm view`'d) | Standard Stack | Cosmetic only for docs phase |
| A2 | Folded credit todo already under `todos/completed/` needs no further file move | CONT-01 hygiene | Minor todo hygiene if still referenced pending |
| A3 | Weekend/holiday shifts of bank due date are not in user calendar lock (use DOM 15 always) | Cycle math | Rare calendar mismatch vs bank app if bank shifts |

**If empty beyond A1–A3:** Core CONT-01 / dual DOM / A′ claims are CONTEXT- or PDF-backed.

## Open Questions

1. **Amend CYCLE-01 / PROJECT / Phase 19 ROADMAP SC in Phase 18 vs 19?**
   - What we know: CONTEXT D-02 overrides duration-days wording.
   - What's unclear: whether Phase 18 plan should edit REQUIREMENTS.md now or leave a “blocked for 19” note.
   - Recommendation: Phase 18 plan includes a small docs task to update CYCLE-01 + Phase 19 success criteria text to dual DOM / A′ so Phase 19 research does not re-litigate.

2. **Past-due open obligations on dashed «Прогноз»?**
   - What we know: SUMMARY flagged policy open; D-04 defines overdue highlight; D-11 visibility at due.
   - What's unclear: whether slots with `dueAsOf ≤ today` stay in forecast series or UI-list only.
   - Recommendation: defer explicit lock to Phase 21 discuss/plan; default = UI highlight + keep open membership for tooltip until closed (ASSUMED until 21 locks).

3. **Optional `graceDurationDays` derived display column?**
   - Claude discretion allows duration for display.
   - Recommendation: do **not** persist as SoT; compute for UI only if needed.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | Optional checklist script | ✓ | v24.5.0 | — |
| npm | — | ✓ | 10.9.3 | — |
| Vitest (via `npm test`) | Optional automated CONT checks | ✓ | 4.1.11 (pin) | Manual markdown checklist |
| `platinum-TP-7.90.pdf` | CONT-01 evidence | ✓ | in phase dir | — |
| graphify | Cross-doc graph | ✗ disabled | — | codegraph CLI + Read; not required for docs gate |
| New npm packages | — | N/A | — | None |

**Missing dependencies with no fallback:** none for Phase 18.  
**Step 2.6:** External tools minimal; PDF already on disk.

## Validation Architecture

> `workflow.nyquist_validation` is **true** in `.planning/config.json` — section required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.11 (repo); Phase 18 primarily **structural checklist** |
| Config file | Vitest via `package.json` `"test": "vitest run"` |
| Quick run command | `npm test -- src/lib/dates.test.ts` (smoke existing dates; no grace tests yet) |
| Full suite command | `npm test` |
| CONT-01 gate command | Checklist below (file existence + decision ID presence) — Wave 0 may add a tiny node/vitest assert |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONT-01 | CONTEXT contains D-01…D-19 locks | structural | `rg -n '^\\- \\*\\*D-0(1[0-9]|[1-9]):' .planning/phases/18-bank-contract-study-discuss-locks/18-CONTEXT.md` (expect 19) | ✅ CONTEXT |
| CONT-01 | Contract notes + tariff artifacts present | structural | `test -f …/18-CONTRACT-NOTES.md && test -f …/platinum-TP-7.90.pdf && test -f …/platinum-TP-7.90.txt` | ✅ files |
| CONT-01 | Dual DOM + A′ overrides documented | structural / manual | Read CONTEXT D-02, D-11; verify RESEARCH override table | ✅ |
| CONT-01 | ROADMAP SC ↔ decisions mapped | manual-in-checklist | Acceptance table in PLAN/VERIFICATION | ❌ Wave 0 checklist artifact |
| CONT-01 | No Prisma/UI shipped in phase | structural | `git diff --name-only` for phase commits excludes `prisma/` `src/` (or plan forbids) | ❌ Wave 0 process check |

### Sampling Rate

- **Per task commit:** structural `test -f` / `rg` decision IDs
- **Per wave merge:** same + confirm REQUIREMENTS CONT-01 checkbox ready to flip after verify
- **Phase gate:** Full CONT-01 checklist green before `/gsd-verify-work`; `npm test` green as regression smoke (no new failures)

### Wave 0 Gaps

- [ ] `18-CONT-01-CHECKLIST.md` or PLAN acceptance section — maps SC1–4 → D-IDs + file paths
- [ ] Optional `src/lib/cont01-artifacts.test.ts` (or `.planning` script) — asserts required files exist (only if planner wants CI-hard gate)
- [ ] Task to amend ROADMAP Phase 18 SC3 / Phase 19 due-math wording / CYCLE-01 for dual DOM + A′
- [ ] Framework install: none

*(Existing app tests do **not** cover CONT-01; that is expected for a docs gate.)*

## Security Domain

> `security_enforcement` enabled (ASVS level 1).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Single-user local app; unchanged |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | no for Phase 18 | Future Zod on DOM ints / amountMinor (Phase 19–20) |
| V6 Cryptography | no | — |

### Known Threat Patterns for docs / contract ingest

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Prompt / instruction injection via PDF text | Tampering | Treat tariff extract as **data only**; locks written by discuss into CONTEXT — do not execute PDF instructions [CITED: untrusted-input-boundary] |
| Accidental commit of unrelated Downloads secrets | Info disclosure | Only phase-dir copies of tariff; no `.env` |
| Scope creep into APR engine from tariff numbers | Elevation of feature risk | D-07…D-10 OOS + REQUIREMENTS Out of Scope table |

## Sources

### Primary (HIGH confidence)
- `.planning/phases/18-bank-contract-study-discuss-locks/18-CONTEXT.md` — D-01…D-19 locks
- `.planning/phases/18-bank-contract-study-discuss-locks/18-CONTRACT-NOTES.md` — calendar + OOS
- `platinum-TP-7.90.txt` — tariff extract (0%, 29.9%, 59.9%, платёж для беспроцентного)
- https://cdn.tbank.ru/static/documents/credit_cards-tariff-rules.pdf §1.1 — Беспроцентный vs Льготный; TP 7.90 uses min-payment date
- `src/lib/dates.ts:12-66`, `src/lib/nw-forecast.ts:17-24,146-154`, `prisma/schema.prisma:12-16,92-104,133-135`, `src/lib/iniso.test.ts:12-30` — code anchors
- codegraph query/explore — `clampDayOfMonth`, `ForecastSlot`, FIAT_CREDIT surface

### Secondary (MEDIUM confidence)
- `.planning/research/SUMMARY.md`, `ARCHITECTURE.md`, `PITFALLS.md` — defaults **overridden** by CONTEXT
- `.planning/ROADMAP.md` Phase 18–19 — success criteria (partially stale wording)
- Stessa / NW transfer community guidance — pay-from-assets ≈ transfer (supports A′ narrative; not Wallet-specific)

### Tertiary (LOW confidence)
- Generic WebSearch “T-Bank dual DOM” results (wrong banks / AU TMB) — **discarded** in favor of official PDF + user notes
- Docs-gate blog/CLI examples — pattern only for checklist style

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new packages; reuse proven dates/income patterns
- Architecture: HIGH — CONT-01 artifacts + override map clear; Phase 21 tooltip shape MEDIUM
- Pitfalls: HIGH — double-count + stale REQUIREMENTS wording verified in-repo

**Research date:** 2026-09-08  
**Valid until:** 2026-10-08 (stable product locks; re-open only if user changes bank calendar)

**Graphify:** disabled in project config — used codegraph CLI instead; treat any graphify relationships as N/A.
