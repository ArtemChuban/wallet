# Phase 18 — CONT-01 Acceptance Checklist

**Phase:** 18-bank-contract-study-discuss-locks  
**Requirement:** CONT-01  
**Purpose:** Prove bank-contract study + discuss locks are artifact-backed before Phase 19 schema.  
**SoT:** `18-CONTEXT.md` (not DISCUSSION-LOG). Cite-only for CONTEXT / CONTRACT-NOTES / tariff.

**Verified:** 2026-09-08 (Plan 18-01 tracer)

---

## Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `18-CONTEXT.md` | Status Ready for planning; decisions **D-01…D-19** present | ✅ | `test -f` OK; Status line Ready for planning; `rg` / line count = **19** decision IDs |
| `18-CONTRACT-NOTES.md` | User calendar statement DOM **21** → pay-by DOM **15 next** | ✅ | `test -f` OK; table Statement 21 / Pay-by 15 next month |
| `platinum-TP-7.90.pdf` | User tariff sheet ТП 7.90 in phase dir | ✅ | `test -f` OK |
| `platinum-TP-7.90.txt` | Extracted tariff text in phase dir | ✅ | `test -f` OK |

---

## SC ↔ decisions

ROADMAP Phase 18 success criteria → CONTEXT locks (Plan 02 amends stale SC wording; this checklist records product truth).

| ROADMAP SC | Decision IDs / artifacts | Product truth (vs stale SC text) |
| ---------- | ------------------------ | -------------------------------- |
| **SC1** — User-supplied bank contract studied; grace rules in CONTEXT | **D-01…D-06** + `18-CONTRACT-NOTES.md` + `platinum-TP-7.90.pdf` / `.txt` | Contract distilled; cycle + amount + statement-change OOS locked |
| **SC2** — Cycle start, duration, clamp, interest-free vs revolving OOS | **D-01…D-04** + **D-07…D-10** | Dual DOM (21→15 next) **supersedes** sole duration-days SoT (**D-02**); clamp on statement only (**D-03**); OOS D-07…D-10 |
| **SC3** — Overlay NW semantics before Phase 19 | **D-11…D-13** | Locked **A′** NW-neutral (visible @ due, ΔNW=0) — **not** deferred A-vs-B |
| **SC4** — Russian vocabulary locked | **D-14…D-19** | Задолженность ≠ Платёж для беспроцентного ≠ минимум; schedule + status + tooltip copy |

---

## Decision coverage

One-line locked meaning from `18-CONTEXT.md` Decisions (no new locks).

| ID | Locked meaning |
| -- | -------------- |
| **D-01** | Cycle start = statement (выписка) formation date; this card fixed DOM **21** |
| **D-02** | Interest-free due = DOM **15 next month** (not sole `+N`); dual DOM SoT |
| **D-03** | Statement DOM uses `clampDayOfMonth`; due DOM 15 never clamps |
| **D-04** | `dueAsOf` = 15th inclusive; overdue/highlight from the **16th** (Moscow day) |
| **D-05** | One manual field: full «платёж для беспроцентного периода» from statement |
| **D-06** | Bank-app statement-day change OOS for v1.3 design; manual DOM edit only |
| **D-07** | Missed due: highlight + short RU interest hint only — no APR math |
| **D-08** | Cash / cash-like 59.9% fully OOS |
| **D-09** | Missed-min voids next grace — not modeled |
| **D-10** | Penalty / overlimit / insurance OOS; track grace payoff + forecast only |
| **D-11** | **A′** NW-neutral: visible @ due, forecast **ΔNW = 0** (reject naive −grace dip) |
| **D-12** | Zero-delta visibility = tooltip / point detail (not second series) |
| **D-13** | Same-day income + grace: one signed series; tooltip distinguishes kinds |
| **D-14** | Snapshot credit debt label: **«Задолженность»** |
| **D-15** | Manual grace amount: **«Платёж для беспроцентного»** |
| **D-16** | Minimum payment not shown in UI for v1.3 |
| **D-17** | Schedule fields: **«Дата выписки»** + **«Оплатить до»** |
| **D-18** | Obligation UX: **«К оплате»** / **«Оплачено»**; overdue = highlight |
| **D-19** | Tooltip: **«Платёж для беспроцентного»** + **«NW без изменения (оплата карты)»** |

---

## Phase boundary / prohibitions

This phase delivers **docs only** under `.planning/phases/18-bank-contract-study-discuss-locks/`:

- MUST NOT edit `prisma/` or add migrations
- MUST NOT edit `src/` app/UI or `nw-forecast` wiring
- MUST NOT re-open bank discuss or treat DISCUSSION-LOG as SoT over CONTEXT

Schema / UI / forecast belong to Phases 19–21 citing these locks.

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| **CONT-01** | 18-01 | Bank contract studied and grace rules documented in phase CONTEXT before plan lock | ✅ STRUCTURAL | `18-CONTEXT.md` D-01…D-19 + Ready status; `18-CONTRACT-NOTES.md` 21→15; `platinum-TP-7.90.pdf`/`.txt`; this checklist SC↔D map |

_Checkbox flip in REQUIREMENTS.md / full VERIFICATION wait for phase verify / Plan 02 wording sync — structural proof is this artifact._

---

## Structural verify (Plan 18-01-T1)

```bash
test -f .planning/phases/18-bank-contract-study-discuss-locks/18-CONT-01-CHECKLIST.md \
  && test -f .planning/phases/18-bank-contract-study-discuss-locks/18-CONTEXT.md \
  && test -f .planning/phases/18-bank-contract-study-discuss-locks/18-CONTRACT-NOTES.md \
  && test -f .planning/phases/18-bank-contract-study-discuss-locks/platinum-TP-7.90.pdf \
  && test -f .planning/phases/18-bank-contract-study-discuss-locks/platinum-TP-7.90.txt \
  && test "$(python3 -c "import re; t=open('.planning/phases/18-bank-contract-study-discuss-locks/18-CONTEXT.md').read().splitlines(); print(sum(1 for l in t if re.match(r'^- \\*\\*D-(0[1-9]|1[0-9]):', l)))")" = "19" \
  && grep -q 'CONT-01' .planning/phases/18-bank-contract-study-discuss-locks/18-CONT-01-CHECKLIST.md \
  && grep -q 'D-11' .planning/phases/18-bank-contract-study-discuss-locks/18-CONT-01-CHECKLIST.md \
  && grep -q 'D-02' .planning/phases/18-bank-contract-study-discuss-locks/18-CONT-01-CHECKLIST.md
```

*(Plan `<verify>` uses `rg`; if agent `rg` is not ripgrep, equivalent `python3`/`grep` above is authoritative.)*
