# Phase 18: Bank contract study + discuss locks - Pattern Map

**Mapped:** 2026-09-08
**Files analyzed:** 14 (9 Phase-18 docs targets + 5 foreshadow, non-edit)
**Analogs found:** 14 / 14

> **Phase nature:** CONT-01 docs gate only — **no** Prisma/UI/`src` edits in Phase 18.
> Code analogs below are **foreshadow for Phase 19–21** (planner cites; executor must not implement here).

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality | Phase 18 edit? |
|-------------------|------|-----------|----------------|---------------|----------------|
| `18-CONT-01-CHECKLIST.md` (or PLAN acceptance) | config | transform | `17-VERIFICATION.md` Required Artifacts + SC↔req tables | docs-match | **yes** (create) |
| `.planning/REQUIREMENTS.md` | config | transform | `17-02-PLAN.md` FCST-01 docs-sync task | exact (docs) | **yes** |
| `.planning/ROADMAP.md` | config | transform | `17-02-PLAN.md` Phase 17 SC rewrite | exact (docs) | **yes** |
| `.planning/PROJECT.md` | config | transform | same docs-sync wave (goal bullets) | role-match | **yes** |
| `.planning/STATE.md` | config | transform | `17-02-PLAN.md` drop stale blocker | exact (docs) | **yes** |
| `18-VALIDATION.md` | config | transform | self (seeded) + `17-VALIDATION.md` docs-grep rows | exact | **yes** (fill tasks) |
| `18-*-PLAN.md` | config | — | `17-02-PLAN.md` (docs-only task block) | exact | **yes** (create) |
| `18-VERIFICATION.md` | config | — | `17-VERIFICATION.md` | exact | later (verify) |
| `18-CONTEXT.md` / `18-CONTRACT-NOTES.md` / tariff PDF+txt | config | — | self (already SoT) | exact | **cite only** (already done) |
| Folded credit todo | config | — | already under `todos/completed/` | exact | hygiene only |
| `prisma/schema.prisma` Account DOM fields | model | CRUD | `RecurringIncome.dayOfMonth` | foreshadow | **no** |
| `src/lib/credit-grace.ts` (future) | service | transform | `src/lib/income.ts` + `clampDayOfMonth` | foreshadow | **no** |
| `src/lib/nw-forecast.ts` A′ slots | utility | transform | self `ForecastSlot` + stair-step `add=0` | foreshadow | **no** |
| `src/lib/iniso.test.ts` → GRACEISO | test | file-scan | self INISO walls | foreshadow | **no** |

## Pattern Assignments

### `18-CONT-01-CHECKLIST.md` / PLAN acceptance (config, transform)

**Analog:** `.planning/milestones/v1.2-phases/17-nw-forecast-overlay-isolation/17-VERIFICATION.md` — Required Artifacts + Observable Truths + Requirements Coverage

**Structure to copy** (artifact proof table, not runtime):
```markdown
### Required Artifacts
| Artifact | Expected | Status | Details |
| `18-CONTEXT.md` | D-01…D-19 present | … | SC1–4 |
| `18-CONTRACT-NOTES.md` | 21 → 15 next | … | SC1 |
| `platinum-TP-7.90.pdf` + `.txt` | present | … | SC1 |

### Requirements Coverage
| Requirement | Description | Status | Evidence |
| CONT-01 | Bank contract studied… | … | CONTEXT + NOTES + tariff |
```

**SC ↔ decision map** (from RESEARCH; put in checklist):

| ROADMAP SC | Decision IDs |
|------------|--------------|
| SC1 contract studied | D-01…D-06 + CONTRACT-NOTES + PDF/txt |
| SC2 cycle/OOS locks | D-01…D-04, D-07…D-10 (amend SC text: dual DOM not sole duration) |
| SC3 overlay | D-11…D-13 (**A′**, not “A vs B”) |
| SC4 RU vocab | D-14…D-19 |

**Structural verify pattern** (from `18-RESEARCH.md` Validation Architecture / `18-VALIDATION.md`):
```bash
rg -n '^\- \*\*D-0(1[0-9]|[1-9]):' .planning/phases/18-bank-contract-study-discuss-locks/18-CONTEXT.md
# expect 19 hits
test -f …/18-CONTRACT-NOTES.md && test -f …/platinum-TP-7.90.pdf && test -f …/platinum-TP-7.90.txt
```

---

### `.planning/REQUIREMENTS.md` (config, transform)

**Analog:** Phase 17 docs-sync task in `17-02-PLAN.md` (lines 153–174) + Phase 16 CPTY-01 wording task

**Core pattern — CONTEXT supersedes stale REQ text; keep ID; leave checkbox until verify:**
```markdown
<!-- Analog action from 17-02-PLAN.md:154-165 -->
Per CONTEXT D-02 (supersedes stale CYCLE-01): rewrite CYCLE-01 from
"start date and duration (days)" → statement DOM + due DOM (monthly),
clamp on statement day (D-03). Do not invent new req IDs.
Flip CONT-01 to [x] only after VERIFICATION / UAT gate (same as FCST-01 timing).
```

**Current stale line to replace** (`REQUIREMENTS.md` line 12):
```markdown
- [ ] **CYCLE-01**: User can set grace-period start date and duration (days) on a credit account; the cycle repeats monthly
```

**Target sense (D-02 / D-03):** statementDayOfMonth + dueDayOfMonth; monthly repeat; clamp statement DOM like income; due DOM 15 never clamps for this bank.

**CONT-01 checkbox** (line 33) — flip `[ ]` → `[x]` + Traceability Status Pending→Complete **after** checklist green (mirror 17 VERIFICATION Requirements Coverage).

**Out of Scope table** — already aligns D-07…D-10; do not weaken. Optional: tighten “сумма к оплате…” wording toward D-15 «Платёж для беспроцентного».

**Automated verify pattern** (mirror 17-02):
```bash
grep -n 'CYCLE-01' .planning/REQUIREMENTS.md | head -5
# must NOT require sole "duration (days)" as SoT; must mention DOM / statement / due
grep -n 'CONT-01' .planning/REQUIREMENTS.md
```

---

### `.planning/ROADMAP.md` (config, transform)

**Analog:** `17-02-PLAN.md` — rewrite Phase Goal + Success Criteria to match CONTEXT locks

**Stale Phase 18 SC** (lines 72–73) — amend in this phase:
```markdown
# BEFORE (stale)
2. … duration-in-days …
3. Overlay NW semantics Option A vs B … (or deferred with default A)

# AFTER (CONTEXT SoT)
2. … dual DOM (statement + due next month), clamp, interest-free vs revolving OOS (D-01…D-10)
3. Overlay **A′** NW-neutral (visible @ due, ΔNW=0 + tooltip) locked (D-11…D-13)
```

**Stale Phase 19 SC** (lines 83–84) — amend now or hard-block note for 19 (RESEARCH Open Q1 recommends amend in 18):
```markdown
# BEFORE
1. … start date and duration (days) …
2. … due dates via addCalendarDays(start, days) …

# AFTER (D-02)
1. … statementDayOfMonth + dueDayOfMonth (both null or both set)
2. … due = DOM in next month; statement advance via clampDayOfMonth (not sole +N)
```

**Milestone Goal line 56** still says “start + days” — same amend wave.

**Verify:**
```bash
grep -n 'Phase 18' -A15 .planning/ROADMAP.md | grep -Eiq 'A′|A'\''|NW-neutral|dual DOM|statement'
# Phase 19 block must not treat addCalendarDays(start, days) as sole SoT
```

---

### `.planning/PROJECT.md` (config, transform)

**Analog:** same docs-sync wave as REQUIREMENTS/ROADMAP (17-02); goal bullets at lines 19–22, 67, 103

**Pattern:** Replace “start date + duration in days” / “start + days-to-due” with dual DOM + A′ overlay language; keep CONT gate bullet. Do not invent new milestone scope.

---

### `.planning/STATE.md` (config, transform)

**Analog:** `17-02-PLAN.md` — drop/update stale blockers when CONTEXT resolves them

**Apply:** After CONT-01 close-out, update `stopped_at` / progress; ensure Blockers do not re-open A vs B (A′ already locked in Accumulated Context). No new “duration-days” blocker.

---

### `18-*-PLAN.md` (config)

**Analog:** `17-02-PLAN.md` docs-only `<task>` block (files + read_first + action + automated grep verify)

**Copy shape:**
```xml
<task type="auto">
  <name>Sync CYCLE-01 / ROADMAP SC to dual DOM + A′ (D-02, D-11)</name>
  <files>.planning/REQUIREMENTS.md, .planning/ROADMAP.md, .planning/PROJECT.md, .planning/STATE.md</files>
  <read_first>
    .planning/phases/18-bank-contract-study-discuss-locks/18-CONTEXT.md
    .planning/phases/18-bank-contract-study-discuss-locks/18-CONTRACT-NOTES.md
  </read_first>
  <action>Per CONTEXT D-02/D-11 supersedes stale duration-days / Option A wording…</action>
  <verify>
    <automated>…grep dual-DOM / A′ markers…</automated>
  </verify>
</task>
```

Second plan/task: CONT-01 checklist artifact + `rg`/`test -f` gates; **forbid** `prisma/` `src/` in phase commit paths.

---

### `18-VALIDATION.md` (config)

**Analog:** self + `17-VALIDATION.md` row `17-02-T3` docs-grep

**Fill Per-Task Verification Map** when PLAN lands — example row pattern:
```markdown
| 18-01-T1 | 01 | 1 | CONT-01 | — | Artifacts exist | structural | test -f CONTEXT/NOTES/PDF/txt | ✅ | ⬜ |
| 18-01-T2 | 01 | 1 | CONT-01 | — | D-01…D-19 present | docs-grep | rg decision IDs | ✅ | ⬜ |
| 18-02-T1 | 02 | 1 | CONT-01 | — | CYCLE-01/ROADMAP dual DOM + A′ | docs-grep | grep CYCLE-01 / Phase 18 SC | ✅ | ⬜ |
```

---

### Existing contract SoT (cite-only; already delivered)

**Analogs:** `18-CONTEXT.md` (decisions), `18-CONTRACT-NOTES.md` (tariff distill), `17-CONTEXT.md` (prior lock style)

**CONTRACT-NOTES calendar pattern** (lines 6–12) — planner treats as product truth for Phase 19:
```markdown
| Statement (выписка) | **21** |
| Pay-by for interest-free | **15 next month** | Inclusive; overdue from the 16th |
| Duration in days | **varies ~22–25** | Not a fixed +N |
```

Do **not** re-discuss; DISCUSSION-LOG is audit only.

---

## Foreshadow patterns (Phase 19–21 — **do not edit in Phase 18**)

### `prisma/schema.prisma` — dual DOM on Account / obligation child

**Analog:** `RecurringIncome.dayOfMonth` (lines 127–135)

```prisma
model RecurringIncome {
  // …
  plannedAmountMinor BigInt
  dayOfMonth         Int // 1–31; clamp at generation (D-16)
  startAsOf          String // YYYY-MM-DD series start (D-15)
  // …
}
```

**Account home for grace config** (lines 92–104) — extend FIAT_CREDIT metadata beside `creditLimitMinor`; prefer `statementDayOfMonth` + `dueDayOfMonth` over sole `graceDurationDays` (D-02). Obligation child: mirror DebtRepayment Cascade + YYYY-MM-DD key by cycle start (see Phase 13 PATTERNS Debt child).

---

### `src/lib/credit-grace.ts` (future) — cycle math

**Analog:** `src/lib/income.ts` + `src/lib/dates.ts`

**Imports / clamp** (`income.ts` lines 6, 174):
```typescript
import { addCalendarDays, clampDayOfMonth } from "@/lib/dates";
// …
const candidate = clampDayOfMonth(y, m, def.dayOfMonth);
```

**clampDayOfMonth** (`dates.ts` lines 56–66) — statement DOM only (D-03):
```typescript
export function clampDayOfMonth(
  year: number,
  month1to12: number,
  dayOfMonth: number,
): string {
  const last = new Date(Date.UTC(year, month1to12, 0)).getUTCDate();
  const day = Math.min(dayOfMonth, last);
  const mm = String(month1to12).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}
```

**Anti-pattern:** `addCalendarDays(statementAsOf, graceDurationDays)` as sole due SoT (rejected D-02). Due = next calendar month + `dueDayOfMonth` (15 never clamps).

**Overdue** (`dates.ts` `calendarDateToday` lines 12–26 + D-04):
```typescript
const today = calendarDateToday(); // Europe/Moscow
const isOverdue = status === "OPEN" && today > dueAsOf; // 15 inclusive → overdue from 16th
```

**Zod foreshadow:** `src/lib/validations/income.ts` line 31 — `dayOfMonthSchema = z.coerce.number().int().min(1).max(31)`.

**Tests foreshadow:** `src/lib/dates.test.ts` `clampDayOfMonth (D-16 / FND-CLAMP)` Feb/30-day cases.

---

### `src/lib/nw-forecast.ts` — A′ zero-delta membership (Phase 21)

**Analog:** self — `ForecastSlot` + stair-step with `add ?? 0n`

```typescript
// lines 17-24
export type ForecastSlot = {
  parentId: number;
  plannedAsOf: string;
  plannedAmountMinor: bigint;
  currencyCode: string;
  currencyScale: number;
  isPrimaryCurrency: boolean;
};

// lines 146-154 — sample date still emitted when add=0
const add = addByDate.get(asOfDate) ?? 0n;
running += add;
points.push({ asOfDate, forecastPrimaryMinor: running, forecast: ... });
```

**Phase 21 direction (D-11…D-13):** membership at `dueAsOf` with `deltaMinor = 0` + kind/label for tooltip («Платёж для беспроцентного» + «NW без изменения (оплата карты)»). Prefer not paired fake +debt/−cash legs (GRISO).

**Import wall:** keep bans on prisma / BalanceSnapshot / net-worth / historical-series (INISO pattern).

---

### `src/lib/iniso.test.ts` → GRACEISO (Phase 22 foreshadow)

**Analog:** self lines 12–30 — file-scan walls + golden identity

```typescript
describe("INISO-01 isolation", () => {
  for (const file of ["src/lib/net-worth.ts", "src/lib/historical-series.ts"]) {
    it(`${file} does not import income or nw-forecast`, () => {
      const src = readFileSync(file, "utf8");
      expect(src).not.toMatch(/@\/lib\/income|…/);
      expect(src).not.toMatch(/@\/lib\/nw-forecast|…/);
    });
  }
  it("nw-forecast.ts bans prisma / BalanceSnapshot / net-worth / historical-series", () => {
    // …
  });
});
```

Mirror for grace: ban grace modules from `net-worth.ts` / `historical-series.ts`; ban BalanceSnapshot writes from grace actions.

---

## Shared Patterns

### Docs sync when CONTEXT overrides research
**Source:** `17-02-PLAN.md` FCST-01 sync task  
**Apply to:** REQUIREMENTS / ROADMAP / PROJECT / STATE in Phase 18  
**Rule:** CONTEXT is SoT; SUMMARY/ARCHITECTURE sketches with `graceDurationDays` + Option A dip are **stale**. Cite D-IDs in action + SUMMARY.

### Structural CONT-01 proof (docs phase Nyquist)
**Source:** `18-RESEARCH.md` Validation Architecture + `18-VALIDATION.md`  
**Apply to:** PLAN verify blocks, checklist, VERIFICATION  
**Rule:** `test -f` + `rg` decision IDs; no empty “N/A” verification; optional vitest only if planner wants CI-hard file asserts — prefer markdown checklist for docs gate.

### Dual DOM calendar (future code)
**Source:** `clampDayOfMonth` + `RecurringIncome.dayOfMonth` + income generation walk  
**Apply to:** Phase 19 schema + `credit-grace.ts` only  
**Rule:** Statement DOM clamps; due = next-month DOM; Moscow `calendarDateToday` for overdue.

### Overlay-only / no snapshot write
**Source:** INISO + Phase 17 forecast import wall  
**Apply to:** Phase 21–22  
**Rule:** Grace never writes `BalanceSnapshot`; A′ ΔNW=0 at due.

### RU vocabulary (future UI)
**Source:** CONTEXT D-14…D-19 + CONTRACT-NOTES  
**Apply to:** Phase 20–21 copy only  
**Labels:** «Задолженность» ≠ «Платёж для беспроцентного» ≠ минимум; schedule «Дата выписки» / «Оплатить до»; status «К оплате» / «Оплачено».

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| — | — | — | None critical — docs analogs from Phase 16/17; code foreshadow from income/dates/nw-forecast/iniso |

Optional `src/lib/cont01-artifacts.test.ts` has **no** prior `.planning`-path vitest analog in-repo; if created, invent thin `test -f` / `existsSync` suite — prefer checklist markdown unless planner insists on CI-hard gate.

## Metadata

**Analog search scope:** `.planning/milestones/v1.2-phases/{16,17}-*/`, `.planning/{REQUIREMENTS,ROADMAP,PROJECT,STATE}.md`, phase 18 dir, `src/lib/{dates,income,nw-forecast,iniso*,validations/income}.ts`, `prisma/schema.prisma`; codegraph `clampDayOfMonth` / `dayOfMonth` / income explore  
**Files scanned:** ~25 planning + 6 code anchors  
**Tracked-source gate:** all named analogs verified via `git ls-files`  
**Pattern extraction date:** 2026-09-08
