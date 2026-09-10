---
phase: "19"
slug: "schema-pure-grace-domain-math"
status: draft
shadcn_initialized: true
preset: none
created: "2026-09-08"
---

# Phase 19 — UI Design Contract

> **No UI surfaces in this phase.** Domain boundary (19-CONTEXT.md): Prisma dual-DOM + `CreditGraceObligation` + pure `credit-grace.ts` math + Vitest only. Roadmap phrase "ready for UI" is a **handoff** to Phase 20 — not a Phase 19 deliverable.

Project already has shadcn (`components.json`, style `base-nova`, lucide). This phase does **not** consume or extend any UI surface. Visual tokens / inventory belong to Phase 20 when chrome lands.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (this phase) — project has shadcn; unused here |
| Preset | not applicable — no UI deliverables |
| Component library | not applicable |
| Icon library | not applicable |
| Font | not applicable |

---

## Spacing Scale

N/A — no user-facing layouts this phase. Do not invent page spacing for nonexistent screens.

Exceptions: none (no surfaces)

---

## Typography

N/A — no user-facing text chrome this phase. Russian labels / Phase 18 vocab → Phase 20 (UX-01).

---

## Color

N/A — no surfaces. Overdue highlight chrome deferred to Phase 20 (OBL-03).

Accent reserved for: N/A this phase

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA | N/A — no UI this phase |
| Empty state heading | N/A — deferred Phase 20 |
| Empty state body | N/A — deferred Phase 20 |
| Error state | N/A — deferred Phase 20 (Zod messages may exist server-side only; not UI chrome) |
| Destructive confirmation | N/A — early close confirm → Phase 20 (DestructiveConfirmStep; no `window.confirm`) |

---

## UI Considerations

> Zero UI elements this phase → all shape-rooted state categories **not applicable**. Rows below are explicit so planner can lift without inventing screens.

Applicable state considerations resolved: none applicable (0 covered as product UI; all dismissed N/A or deferred)

| Category | Element(s) | Status | Resolution / Reason |
|----------|------------|--------|---------------------|
| (phase) | — | ✅ covered | Phase 19 ships zero user-facing screens or interactive chrome — confirmed by 19-CONTEXT `<domain>` + Deferred Ideas |
| empty | — | ✅ covered | N/A — no UI this phase; empty/list chrome for obligations → Phase 20 |
| loading | — | ✅ covered | N/A — no UI this phase |
| error | — | ✅ covered | N/A — no UI this phase; write-path Zod errors have no form chrome until Phase 20 |
| populated | — | ✅ covered | N/A — no UI this phase |
| partial | — | ✅ covered | N/A — no UI this phase; partial dual-DOM rejected at schema/Zod (D-03), not a UI state |
| overflow | — | ✅ covered | N/A — no UI this phase |
| zero-one-many | — | ✅ covered | N/A — no UI this phase; cycle list → Phase 20 |
| long-text | — | ✅ covered | N/A — no UI this phase; optional `note` field storage only |

---

## Deferred UI (Phase 20+)

Planner must **not** schedule these under Phase 19. Lift into Phase 20 UI-SPEC / plans:

| Concern | Target | Source |
|---------|--------|--------|
| Dual DOM fields on credit account form | Phase 20 | CYCLE-01 UI; 19-CONTEXT deferred form chrome |
| Obligation CRUD (create with amount, update OPEN, close) | Phase 20 | OBL-01, OBL-02; D-06/D-12 |
| Cycle list (current / next due candidates from pure helpers) | Phase 20 | CYCLE-02; D-11/D-12 |
| Early close confirm (`DestructiveConfirmStep`) | Phase 20 | OBL-02; ROADMAP SC |
| Overdue highlight chrome (`OPEN` + calendar, not status enum) | Phase 20 | OBL-03; D-07; Phase 18 D-04 |
| Russian vocab distinguishing snapshot debt vs grace due | Phase 20 | UX-01; Phase 18 RU locks |
| Капитал «Прогноз» grace wiring | Phase 21 | GRFCST-01/02 |
| GRACEISO regression suite | Phase 22 | milestone |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none this phase | not required |
| third-party | none | not applicable |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS (N/A — no UI copy this phase)
- [ ] Dimension 2 Visuals: PASS (N/A — no surfaces)
- [ ] Dimension 3 Color: PASS (N/A — no surfaces)
- [ ] Dimension 4 Typography: PASS (N/A — no surfaces)
- [ ] Dimension 5 Spacing: PASS (N/A — no surfaces)
- [ ] Dimension 6 Registry Safety: PASS (no blocks consumed)
- [ ] Dimension 7 Inventory Provenance: PASS (section omitted — Tool: none this phase; no inventory claim)

**Approval:** pending

---

*Phase: 19-schema-pure-grace-domain-math*
*Contract type: no-UI / handoff only (mirrors Phase 13 income-schema pattern)*
