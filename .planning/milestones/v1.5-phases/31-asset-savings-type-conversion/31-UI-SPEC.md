---
phase: "31"
slug: "asset-savings-type-conversion"
status: approved
reviewed_at: "2026-09-22T12:15:00.000Z"
shadcn_initialized: true
preset: "b2fA (base-nova / neutral / geist / lucide)"
created: "2026-09-22"
---

# Phase 31 — UI Design Contract

> Visual and interaction contract for ASSET ↔ SAVINGS type conversion in account edit.
> Pipeline `--auto`: locked from 31-CONTEXT D-01…D-16 + 31-RESEARCH + ROADMAP ACCT-04 + Phase 27 token lineage.
> No interactive design Q&A. Supersedes Phase 27 D-08 type lock **only** for the pair ASSET ↔ SAVINGS.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn |
| Preset | b2fA — style nova (base-nova), baseColor neutral, theme neutral, font geist*, iconLibrary lucide, radius default, menuAccent subtle (`npx shadcn info`; `components.json`) |
| Component library | @base-ui/react@1.7.0 (shadcn base-nova) |
| Icon library | lucide-react@1.39.0 |
| Font | Geist Sans (body/UI) + Geist Mono (currency codes / rate % / day-of-month digits); `lang="ru"` on `<html>` |

Sources: Phase 27 UI-SPEC; `components.json`; `src/app/globals.css`; 31-RESEARCH Standard Stack.

**Hard constraints:**
- **Zero new npm packages.**
- **Zero new shadcn registry blocks** — reuse Button / Dialog / Input / Label / Select already installed.
- UI surface this phase: **`AccountFormDialog` edit mode only** (D-01). Create form unchanged (D-04). No new routes, no MCP write UI, no list chrome changes beyond refresh after save.
- Do **not** use `DestructiveConfirmStep` / `window.confirm` for type conversion (D-09).

---

## Component Inventory

> What the project's design system actually provides. **Enumerate this from the installed
> package — never from recall.**

Enumerated by `npx shadcn info` — 6 components — shadcn@4.20.0 — 2026-09-22.

Non-exhaustive known-good set for this phase. Executor may use any official `@shadcn` export already installed. Checking for a component outside the table is the expected path, not an exception.

| Component | Import path | Notes |
|-----------|-------------|-------|
| Button | `@/components/ui/button` | Edit submit «Сохранить»; pending «Сохранение…»; list trigger «Изменить» (unchanged) |
| Dialog | `@/components/ui/dialog` | Shell for edit «Изменить счёт» |
| Input | `@/components/ui/input` | Name; **Годовой %**; **День начисления** when draft type = SAVINGS |
| Label | `@/components/ui/label` | Russian field labels (Phase 27 D-13 strings) |
| Select | `@/components/ui/select` | Edit type unlock: options **ASSET \| SAVINGS only** (D-13); create Select unchanged |
| Chart | `@/components/ui/chart` | Installed; **forbidden** this phase |
| DestructiveConfirmStep | `@/components/ui/destructive-confirm-step` | First-party — snapshot delete only; **not** used for type conversion |
| AccountFormDialog | `@/components/accounts/AccountFormDialog` | **MODIFY** — edit type Select + draft type-gate; DialogDescription split (convertible vs locked) |
| AccountList | `@/components/accounts/AccountList` | **READ-ONLY this phase** — secondary rate line appears/disappears after revalidate; no list chrome changes |

---

## Spacing Scale

Declared values (must be multiples of 4). Inherit Phase 27 / accounts shell — no new spacing tokens.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps; inline mono meta |
| sm | 8px | Compact row gaps; label↔control (`grid gap-2`) |
| md | 16px | Default element spacing; dialog field stack (`grid gap-4`) |
| lg | 24px | Dialog body vertical rhythm |
| xl | 32px | Page `/accounts` header↔list gap (unchanged shell) |
| 2xl | 48px | Major section breaks (not required inside dialog) |
| 3xl | 64px | Page-level rhythm (not required inside dialog) |

Exceptions:
- Minimum tap target **44×44px** for icon-only list controls — existing AccountList; no new icon-only controls this phase.
- Labeled text buttons keep default height.

Source: Phase 27 Spacing; existing `AccountFormDialog` `grid gap-4` / `gap-2`.

---

## Typography

Exactly four sizes, two weights (400 + 600). Match Phase 27 / accounts shell.

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 16px | 400 | 1.5 |
| Label | 14px | 400 | 1.5 |
| Heading | 24px | 600 | 1.2 |
| Display | 30px | 600 | 1.2 |

Usage this phase:
- **Display** — not used on edit conversion surface.
- **Heading** — page title «Счета» only (unchanged shell). Dialog titles stay Body/Label-sized `DialogTitle` (do not bump to Heading).
- **Body** — dialog description; form-level errors; account name input.
- **Label** — form labels («Название», «Тип», «Валюта», «Годовой %», «День начисления»); muted read-only type/currency when locked.

Currency **codes**, **rate %**, and **DOM** digits may use Geist Mono at Label size; weights still 400 or 600 only.

Sources: Phase 27 Typography.

---

## Color

Light theme tokens from `src/app/globals.css` `:root` (shadcn neutral). Hex below are approximate contracts for checker/visual QA. Inherit Phase 27 — **no new semantic colors for conversion**.

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#FFFFFF` (`--background` oklch(1 0 0)) | Page `/accounts`, dialog surface |
| Secondary (30%) | `#F5F5F5` (`--muted` / `--secondary` oklch(0.97 0 0)) | Top nav; list row hover (unchanged) |
| Accent (10%) | `#1A1A1A` (`--primary` oklch(0.205 0 0)) | Reserved elements only (see below) |
| Destructive | `#C4473A` (`--destructive` oklch(0.577 0.245 27.325)) | Field `aria-invalid` / validation + form-level error text (`role="alert"`) only |

Accent reserved for:
1. Primary dialog submit «Сохранить» (edit)
2. Primary create CTA «Добавить счёт» (existing shell — unchanged this phase)
3. Active nav link on `/accounts` (existing shell)
4. Focus ring companion (`--ring`) on focused controls

Do **not** use accent for: outline «Изменить» trigger; type Select chrome; «Накопительный» / «Актив» option text; rate/DOM fields; read-only muted type/currency labels.

Do **not** invent conversion warning/destructive chrome under the type control (D-10 — no soft warning). Clearing rate/DOM is silent hide+clear.

Foreground: `--foreground` ≈ `#0A0A0A`. Muted: `--muted-foreground` ≈ `#737373`. Borders: `--border`.

Sources: Phase 27 Color; 31-CONTEXT D-09/D-10.

---

## Copywriting Contract

All chrome Russian. Currency codes stay Latin. Rate display uses **dot** decimal to match Phase 27 money/form input.

| Element | Copy |
|---------|------|
| Primary CTA (edit submit) | Сохранить |
| Primary CTA (create — unchanged) | Добавить счёт |
| Empty state heading (accounts list — unchanged) | Нет счетов |
| Empty state body (accounts list — unchanged) | Создайте первый счёт, чтобы учитывать активы и кредиты. |
| Empty state (convert → SAVINGS rate/DOM) | Fields render **empty** — no placeholder defaults; no prefill from prior SAVINGS values (D-07). User must enter both before a valid submit. |
| Error state (generic / forbidden transition) | Не удалось сохранить. Проверьте поля и попробуйте снова. |
| Error state (missing rate on convert/create SAVINGS) | Укажите годовой процент |
| Error state (invalid / negative rate) | Введите процент 0 или больше (до 2 знаков после точки) |
| Error state (missing DOM) | Укажите день начисления |
| Error state (DOM out of 1–31) | День начисления — число от 1 до 31 |
| Error state (duplicate name) | Счёт с таким названием уже есть |
| Success (any successful edit incl. type convert) | Сохранено — then close dialog (D-11; no special “type changed” copy) |
| Destructive confirmation (type conversion) | **none** — no second-step confirm either direction (D-09); no soft warning under type (D-10) |
| Destructive confirmation (snapshot delete) | unchanged existing AccountList — out of scope this phase |

### Account type labels (Select + read-only)

| Enum | Russian label | Edit control |
|------|---------------|--------------|
| ASSET | Актив | In convert Select (with SAVINGS only) |
| SAVINGS | Накопительный | In convert Select (with ASSET only) |
| FIAT_CREDIT | Кредитный | Read-only muted label — **no** Select (D-14) |
| FIAT_DEBIT / CRYPTO / CASH | existing soft-read labels | Read-only muted label — **no** Select (D-14); unlock only exact `ASSET`/`SAVINGS`, never `isAssetType()` |

### Dialog titles / descriptions

| Dialog | Title | Description |
|--------|-------|-------------|
| Create account | Новый счёт | Unchanged Phase 27 create copy |
| Edit convertible (`ASSET` or `SAVINGS`) | Изменить счёт | **Валюта не меняется.** |
| Edit locked (`FIAT_CREDIT` / legacy) | Изменить счёт | **Тип и валюта не меняются.** |

Sources: D-01 title «Изменить счёт»; 31-RESEARCH Open Q2 (description split); D-03 currency always locked.

### Field labels (RU) — edit conversion

| Field | Label | Behavior |
|-------|-------|----------|
| Name | Название | Always editable |
| Type | Тип | Convertible: Select with **only** Актив / Накопительный (D-13). Locked types: muted `accountTypeLabel` text |
| Currency | Валюта | Always read-only mono code (D-03) |
| Annual rate | Годовой % | Visible only when **draft** `accountType === "SAVINGS"`; empty on convert-to-SAVINGS; cleared+hidden on leave SAVINGS (D-05…D-07) |
| Accrual DOM | День начисления | Same gate as rate |

### Pending / triggers

| Action | Label |
|--------|-------|
| Edit row trigger | Изменить |
| Submit pending | Сохранение… |
| Success toast/message | Сохранено |

---

## Interaction & Layout Contract

| Decision | Contract |
|----------|----------|
| Routes | `/accounts` only; no new routes |
| Surface | Extend existing `AccountFormDialog` **edit** mode — no separate convert dialog (D-01) |
| Focal point (edit convertible) | **Type Select** is the phase delta focal control (first eye after title); primary action remains accent **«Сохранить»** in footer |
| Focal point (edit locked) | Name field + muted type/currency; submit «Сохранить» |
| Convert unlock gate | Show type Select **only** when `account.type === "ASSET" \|\| account.type === "SAVINGS"` (exact; not soft aliases) |
| Convert options | `CONVERT_TYPE_OPTIONS` = ASSET + SAVINGS only — **never** include FIAT_CREDIT (D-13) |
| Create type options | Unchanged: ASSET · FIAT_CREDIT · SAVINGS (D-04) |
| Draft type-gate | `showSavingsFields` keys off **draft** `accountType === "SAVINGS"` in create **and** edit (replace frozen `account?.type` edit branch) — D-05 |
| Leave SAVINGS in draft | Always `setAnnualRate("")` / `setAccrualDom("")`; hide fields; toggling back starts empty (D-06) |
| Convert to SAVINGS | Rate + DOM start empty; user fills both; **0% allowed once entered** (Phase 27 D-02); no prefill (D-07) |
| Same-type SAVINGS edit open | Prefill rate/DOM from props on mount (31-RESEARCH A2) — only leave/re-enter clears |
| Save button | Stays **enabled** while rate/DOM empty; validation on submit (D-08) |
| Confirm / hint | No in-dialog confirm; no soft warning under type (D-09, D-10) |
| One Submit | Name + type + rate/DOM together (D-02) |
| Currency | Locked label always (D-03) |
| Server gate | UI not sole gate — forged / forbidden transitions → generic save failure (D-15); copy = Error state generic row |
| Snapshots / NW history | Conversion must not create/update/delete BalanceSnapshot (D-16) — UI does not call snapshot APIs |
| Pending submit | Disable primary button; label «Сохранение…»; Dialog stays open until success then close + revalidate |
| Dialog width | Existing `sm:max-w-md` |
| Out of scope UI | Create-form type list changes; currency change; MCP write/convert; interest overlay chrome; confirm step |

### Visual hierarchy (edit convertible dialog)

1. DialogTitle «Изменить счёт»
2. Type Select (phase delta — unlocked ASSET/SAVINGS)
3. Name + currency (currency muted mono)
4. Conditional rate/DOM block when draft = SAVINGS
5. Footer accent «Сохранить»

---

## UI Considerations

> Shape-rooted UI state coverage. Empty/error COPY lives in `## Copywriting Contract` — this section REFERENCES those rows.
> Populated for `--auto` pipeline; probe Step 9.5 may replace idempotently.

Applicable state considerations resolved: 14 covered, 2 backstop, 4 dismissed, 0 unresolved

| Category | Element(s) | Status | Resolution / Reason |
|----------|------------|--------|---------------------|
| empty | edit convert → SAVINGS rate/DOM | ✅ covered | Fields empty per Copywriting empty-convert row; no placeholder; submit validates with «Укажите годовой процент» / «Укажите день начисления» |
| empty | accounts list | dismissed | Unchanged Phase 27 empty state — not in Phase 31 surface delta |
| loading | AccountFormDialog edit | ✅ covered | `useActionState` pending disables submit; label «Сохранение…»; Dialog open until success |
| error | missing rate/DOM on convert | ✅ covered | Field errors reuse create Russian strings (D-12) |
| error | forbidden type transition | ✅ covered | Form-level generic «Не удалось сохранить…» (D-15 / RESEARCH A1) |
| error | Zod garbage type enum | ✅ covered | Prefer `errors.type` field alert when present; else generic message |
| populated | edit ASSET (no convert yet) | ✅ covered | Type Select shows Актив; rate/DOM hidden; currency locked mono |
| populated | edit SAVINGS (same-type) | ✅ covered | Type Select shows Накопительный; rate/DOM prefilled from props |
| partial | draft ASSET→SAVINGS | ✅ covered | Immediate show empty rate/DOM; save enabled; incomplete until both filled |
| partial | draft SAVINGS→ASSET | ✅ covered | Hide+clear rate/DOM immediately; submit persists type ASSET + null clears server-side |
| overflow | dialog | ✅ covered | Dialog body scrolls if viewport short; `sm:max-w-md` |
| overflow | type Select options | ✅ covered | Exactly two options — no overflow risk |
| zero-one-many | type Select | ✅ covered | Always two options when unlocked; locked path = zero Select (label only) |
| long-text | account name | 🧪 backstop | maxLength 120; existing truncate on list; full name in edit Dialog |
| long-text | type labels | ✅ covered | Fixed short RU labels (Актив / Накопительный / Кредитный) |
| long-text | DialogDescription | ✅ covered | Short locked RU sentences — wrap in dialog width |

<!-- Status vocabulary (locked by probe-core projectTruths):
     ✅ covered   → a plain truth string lifted into must_haves.truths
     🧪 backstop  → a flat scalar { statement, verification: backstop }; at verify time, no explicit
                    evidence → insufficient_spec → human_needed (never a silent pass, #1154)
     ⚠ unresolved → an explicit planner assumption (surfaced, never silently dropped)
     Rows are REPLACED (not appended) on a probe re-run — idempotent. -->

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official (`@shadcn`) | button, dialog, input, label, select (already installed); chart unused this phase | not required |
| third-party | none | n/a — `components.json` `registries: {}`; no third-party blocks declared |

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS
- [x] Dimension 7 Inventory Provenance: PASS

**Approval:** approved 2026-09-22

### Checker notes (pipeline `--auto` self-verify)

| Dimension | Verdict | Evidence |
|-----------|---------|----------|
| 1 Copywriting | PASS | Specific RU CTAs («Сохранить», «Изменить счёт»); empty convert fields + list empty inherited; errors include solution path; destructive = none (D-09) |
| 2 Visuals | PASS | Focal point declared (Type Select delta + accent submit); hierarchy table present |
| 3 Color | PASS | 60/30/10 + accent reserved-for list (4 concrete elements); no “all interactive” |
| 4 Typography | PASS | Exactly 4 sizes (14/16/24/30), 2 weights (400/600), body LH 1.5 |
| 5 Spacing | PASS | Scale 4/8/16/24/32/48/64 only; 44px tap exception justified |
| 6 Registry Safety | PASS | Official `@shadcn` only; third-party none; `registries: {}` |
| 7 Inventory Provenance | PASS | `Enumerated by npx shadcn info — 6 components — shadcn@4.20.0 — 2026-09-22` |
