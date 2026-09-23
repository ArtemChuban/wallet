---
phase: "30"
slug: "mcp-parity-verify"
status: approved
reviewed_at: "2026-09-22T10:52:00Z"
shadcn_initialized: true
preset: "b2fA (base-nova / neutral / geist / lucide)"
created: "2026-09-22"
---

# Phase 30 — UI Design Contract

> **MCP read-tool parity ONLY.** No chart chrome, no new pages, no UI component changes.
> Visual tokens inherited from Phase 29 for checker continuity; executor must not touch UI files.
> Pipeline `--auto`: locked from 30-CONTEXT D-01…D-16 + 30-RESEARCH. No interactive design Q&A.
> ROADMAP goal mentions "UI" only as PARITY-01 wording (agents match UI fields) — **no user-visible UI work**.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn (inherited; **no UI work this phase**) |
| Preset | b2fA — style nova (base-nova), baseColor neutral, theme neutral, font geist*, iconLibrary lucide, radius default, menuAccent subtle — **same as Phase 29** (`npx shadcn info`; `components.json`) |
| Component library | @base-ui/react@1.7.0 (shadcn base-nova) — inherited; unused this phase |
| Icon library | lucide-react@1.39.0 — inherited; unused this phase |
| Font | Geist Sans + Geist Mono — inherited; unused this phase |

Sources: `29-UI-SPEC.md`; `components.json`; 30-CONTEXT / 30-RESEARCH.

**Hard constraints:**
- **Zero new npm packages.**
- **Zero UI file touches** — no `src/components/**`, no `src/app/**` pages/layouts/CSS, no `npx shadcn add`.
- Optional shared interest→`ForecastSlot` extract (D-08) may touch `DashboardChartsShell` **only** if extracting a pure mapper used by MCP — must not change visual chrome, copy, or tooltip DOM (Phase 29 contract stays closed).
- Agent-facing copy lives in MCP tool descriptions + `create-handler` instructions, **not** in the browser UI.

---

## Component Inventory

> No UI components in scope — MCP-only phase.

Could not enumerate for phase use: **phase delivers no UI surfaces**; inventory of installed shadcn components is unchanged from Phase 29 and must not be extended.

Provenance (design system still present in repo, for Dimension 7 continuity — **not** a phase touch list):

Enumerated by Phase 29 `npx shadcn info` — 6 components — shadcn@4.20.0 — 2026-09-21 (inherited; do not re-add).

| Component | Import path | Notes |
|-----------|-------------|-------|
| *(none for Phase 30)* | — | MCP-01 / MCP-02 / PARITY-01 = `src/lib/mcp/**` + Vitest + Orca MCP calls only |
| NetWorthHistoryChart | `@/components/dashboard/NetWorthHistoryChart` | **Out of scope** — do not reopen Phase 29 overlay chrome |
| DashboardChartsShell | `@/components/dashboard/DashboardChartsShell` | **Out of scope** for visual change; optional pure-mapper extract only (D-08) |
| Chart / Button / Dialog / Input / Label / Select | `@/components/ui/*` | **Out of scope** — already installed; no registry adds |

---

## Spacing Scale

Inherited from Phase 29 / Phase 21. **N/A for Phase 30 implementation** — no spacing tokens applied; no layout work.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | N/A this phase |
| sm | 8px | N/A this phase |
| md | 16px | N/A this phase |
| lg | 24px | N/A this phase |
| xl | 32px | N/A this phase |
| 2xl | 48px | N/A this phase |
| 3xl | 64px | N/A this phase |

Exceptions: none for this phase (no UI). Chart height 200px / 44×44 tap targets remain Phase 29 contracts if any file is opened for extract — do not change.

---

## Typography

Inherited from Phase 29. Exactly four sizes, two weights. **N/A for Phase 30 UI** — no new labels, tooltips, or banners.

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 16px | 400 | 1.5 |
| Label | 14px | 400 | 1.5 |
| Heading | 24px | 600 | 1.2 |
| Display | 30px | 600 | 1.2 |

Usage this phase: **none** in the browser. MCP English+RU tool prose is not typography contract.

---

## Color

Inherited from Phase 29 light theme (`globals.css` `:root`). **N/A for Phase 30 UI** — no visual accent use.

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#FFFFFF` (`--background`) | Unchanged; not touched |
| Secondary (30%) | `#F5F5F5` (`--muted` / `--secondary`) | Unchanged; not touched |
| Accent (10%) | `#1A1A1A` (`--primary`) | Unchanged; not touched |
| Destructive | `#C4473A` (`--destructive`) | Unchanged; not touched |

Accent reserved for: *(no Phase 30 UI elements — do not introduce accent on MCP or chart)*.

Do **not** reopen Phase 29 rules (no accent/success/destructive on dashed Line, interest/grace glyphs, or FX banner).

---

## Copywriting Contract

Browser UI copy: **N/A / out of scope.** Phase 29 Russian overlay chrome stays closed. Agent-facing strings are MCP-only (D-09…D-12).

| Element | Copy |
|---------|------|
| Primary CTA | *(none — no UI CTA)* |
| Empty state heading | *(none — no UI empty state)* |
| Empty state body | *(none)* |
| Error state | *(none — no UI submit/error chrome)* |
| Destructive confirmation | *(none — no destructive UI)* |

### Agent-facing MCP copy (not browser UI)

| Surface | Contract |
|---------|----------|
| `list_accounts` description | Mention SAVINGS rate / DOM / percent fields (D-04). **No** SAVISO tag (D-12) |
| `get_forecast_overlay` description | Triple tag `INISO-01/GRISO-01/SAVISO-01`; prose income + interest + grace; drop «A′» (D-09/D-10) |
| `create-handler` instructions | Same triple-tag closer; drop «A′» (D-10) |
| JSON payloads | No isolation meta fields (D-12) |
| README connect | Do not rewrite (D-12) |

Phase 29 chart strings («Прогноз», «Накопительный», «Ожидаемое начисление», grace labels, FX banner) — **do not edit**.

---

## Interaction & Layout Contract

| Decision | Contract |
|----------|----------|
| Surface | **No new browser surface.** No new route. No chart UAT |
| Series / tooltip / banner | Unchanged from Phase 29 — do not reopen |
| Verify bar | **Vitest contracts** + **Orca MCP tool calls** against `/api/mcp` (D-13/D-14) — not chart DOM UAT |
| Orca seed | If no накопительный, create via **existing** UI then call MCP (D-15) — seed path only; no UI redesign |
| Isolation | Forecast MCP reads write no `BalanceSnapshot`; historical NW unchanged (SAVISO live) |
| MCP tools | Extend existing `list_accounts` + `get_forecast_overlay` only — no new tool names |

---

## UI Considerations

> Shape-rooted UI state coverage. **Phase 30 has no user-visible UI elements** — all taxonomy categories dismissed for browser surfaces. Verify bar is Vitest + Orca MCP, not chart UAT.

Applicable state considerations resolved: 0 covered, 0 backstop, 0 unresolved — **6 dismissed (no UI elements)**

| Category | Element(s) | Status | Resolution / Reason |
|----------|------------|--------|---------------------|
| empty | Browser surfaces | dismissed | No new screens or empty states; MCP returns JSON only |
| loading | Browser surfaces | dismissed | No UI loading chrome; MCP/Vitest asynchronous paths are not visual |
| error | Browser surfaces | dismissed | No UI error chrome; tool errors stay MCP protocol |
| populated | Browser surfaces | dismissed | No visual populated state; agents consume `list_accounts` / `get_forecast_overlay` payloads |
| partial | Browser surfaces | dismissed | No UI partial banner work; Phase 29 FX banner unchanged |
| overflow | Browser surfaces | dismissed | No UI lists/tooltips touched |
| zero-one-many | Browser surfaces | dismissed | Interest event cardinality is MCP JSON / Vitest fixtures, not chart rows |
| long-text | Browser surfaces | dismissed | Tool description prose is agent-facing text, not rendered UI |
| *(scope)* | Phase 29 overlay chrome | ✅ covered | Explicit: **do not reopen** Phase 29 chart/tooltip/banner; ROADMAP "UI" = PARITY-01 field parity only |
| *(verify)* | UAT method | ✅ covered | Done bar = Vitest + Orca MCP calls (`list_accounts` fields, `kind: "interest"`, snap count unchanged) — **not** chart DOM UAT |
| *(visual)* | Any new visual change | ✅ covered | Contract: **no visual changes**; zero UI file touches except optional non-visual shared mapper extract |

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
| shadcn official (`@shadcn`) | none new — Phase 29 inventory unchanged | not required |
| third-party | none | n/a — `components.json` `registries` is `{}`; no `npx shadcn add`; no third-party blocks |

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS (N/A browser; MCP agent copy scoped; no UI CTA/empty/error)
- [x] Dimension 2 Visuals: PASS (explicit no visual work / no new screens)
- [x] Dimension 3 Color: PASS (inherited; unused)
- [x] Dimension 4 Typography: PASS (inherited; unused)
- [x] Dimension 5 Spacing: PASS (inherited; unused)
- [x] Dimension 6 Registry Safety: PASS (no new blocks)
- [x] Dimension 7 Inventory Provenance: PASS (MCP-only scope line + inherited Phase 29 provenance)

**Approval:** approved 2026-09-22 (pipeline `--auto`)
