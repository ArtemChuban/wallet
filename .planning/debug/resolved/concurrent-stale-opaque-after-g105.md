---
status: resolved
trigger: "UAT gap G-10-8 — concurrency smoke re-test after 10-04 G-10-5 still shows opaque «Не удалось сохранить…» instead of refresh RU"
created: 2026-09-05T18:47:00Z
updated: 2026-09-07T00:50:00Z
goal: find_root_cause_only
gap_id: G-10-8
symptoms_prefilled: true
---

## Current Focus

hypothesis: "AND-gate — (1) forgive UI WR-01 synthesizes opaque from deltaMajor-only server errors; (2) forgive CR-01 clears confirm so refresh RU never surfaces; (3) peer event-delete rarely hits P2025 so 10-04 server map does not cover common concurrent path; repay/size still have catch-all for non-P2025"
bug_class: Bohrbug
known_pattern_candidate: "concurrent-stale-write-opaque-error (G-10-5) — prior root was unmapped P2025/assert; 10-04 closed server half; client + scenario gap remain"
next_action: "return ROOT CAUSE FOUND to orchestrator (diagnose-only; no fix)"

reasoning_checkpoint:
  hypothesis: "Live opaque after G-10-5 is multi-factor — server P2025 map works but UAT path often never throws P2025; forgive client ignores deltaMajor (opaque fallback) and clears confirm (hides message)"
  confirming_evidence:
    - "isRecordNotFound + staleRecordRefreshState present in createRepayment/createSizeChange/forgiveRemaining catch (actions.ts:69-82, 553-555, 759-761, 884-886)"
    - "Probe: direct + $transaction findUniqueOrThrow missing id → instanceof PrismaClientKnownRequestError P2025, isRecordNotFound true"
    - "forgive handleConfirm reads only errors.asOfDate + message; OVER_FLOOR returns only errors.deltaMajor (actions.ts:864-873) → client fallback exact opaque string (probe WR-01 UI eq opaque true)"
    - "forgive failure setConfirm(null); forgive tabpanel has no actionError render (DebtDetailDialog.tsx:202-210, 470-517); only confirm step + history show actionError"
    - "10-04 PLAN statement: Do not rebuild DebtDetailDialog stale-refresh UX; 10-REVIEW CR-01/WR-01 flag client gap after Plan 04"
    - "Peer delete history event leaves debt row; create* findUniqueOrThrow will not P2025 (scenario ≠ missing debt)"
  falsification_test: "If repay/size after peer event-delete always returned staleRecordRefreshState message and forgive UI showed it, this RCA wrong"
  fix_rationale: "Must fix client error chain + confirm retention for forgive; optionally also map forgive assert failures to message; repay/size already display message when server returns refresh"
  blind_spots: "Did not re-run live two-tab UAT this session (DB had no OPEN debt); exact concurrent throw that hit repay/size catch-all (if any) not captured"
  candidate_causes:
    - "code: DebtDetailDialog forgive error surface (WR-01 + CR-01)"
    - "code: actions catch-all still reachable for non-P2025"
    - "data/scenario: peer event-delete ≠ record-not-found; P2025 path unused"
  and_gate: "yes — server can return correct refresh OR deltaMajor field error AND client still shows opaque or nothing; both layers required for forgive UAT pass"

## Symptoms

expected: After peer-tab delete, stale repay/size/forgive failure shows «Долг или запись не найдены. Обновите страницу.» (never opaque catch-all)
actual: «Не удалось сохранить. Проверьте поля и попробуйте снова.»
errors: "Не удалось сохранить. Проверьте поля и попробуйте снова."
reproduction: "Two tabs same debt; delete history event in one; stale write (repay / size-change / forgive) in other"
started: "2026-09-05 re-UAT after 10-04 G-10-5 (prior G-10-5 same opaque; tracked as G-10-8)"

## Eliminated

- hypothesis: "isRecordNotFound instanceof fails for P2025 inside $transaction (bundled Next / adapter)"
  evidence: "Probe 2026-09-05: direct and $transaction missing-debt both PrismaClientKnownRequestError P2025; isRecordNotFound true. Prior live probe: createRepayment reaches staleRecordRefreshState()"
  timestamp: 2026-09-05T18:53:03Z

- hypothesis: "10-04 never shipped P2025 mapping (deploy/miss)"
  evidence: "actions.ts has isRecordNotFound + staleRecordRefreshState; vitest G-10-5 titles pass per 10-VERIFICATION; catch branches present on all five event actions"
  timestamp: 2026-09-05T18:53:03Z

- hypothesis: "Zod .strict() / FormData extras cause opaque"
  evidence: "Prior G-10-5 rejected; actions pick named keys only; unchanged"
  timestamp: 2026-09-05T18:53:03Z

## Evidence

- timestamp: 2026-09-05T18:48:00Z
  checked: "Prior debug concurrent-stale-write-opaque-error.md + 10-UAT G-10-8 + 10-REVIEW CR-01/WR-01"
  found: "G-10-5 closed server P2025; re-UAT still opaque → G-10-8; review already flags client forgive surface"
  implication: "Start with client + scenario mismatch, not re-prove P2025 helper"

- timestamp: 2026-09-05T18:50:00Z
  checked: "actions.ts createRepayment/createSizeChange/forgiveRemaining catch + DebtDetailDialog handleConfirm / tabs"
  found: "P2025 → staleRecordRefreshState message. forgive OVER_FLOOR → errors.deltaMajor only. UI: asOfDate ?? message ?? opaque; then setConfirm(null). Forgive tab no actionError. Repay/size show *.message and field errors."
  implication: "Forgive can synthesize opaque (WR-01) and/or hide correct refresh (CR-01). Repay/size show server message as-is."

- timestamp: 2026-09-05T18:53:03Z
  checked: "scripts probe via @/lib/db — P2025 direct/tx + WR-01 client chain simulation"
  found: "isRecordNotFound true both paths. WR-01 fallback === opaque catch-all string. No OPEN debt in DB for live concurrent repro."
  implication: "Server map sound for missing debt; client forgive string identity explains reported opaque text without needing server catch-all"

- timestamp: 2026-09-05T18:53:03Z
  checked: "UAT repro semantics vs P2025 trigger"
  found: "Delete history event ≠ delete debt. create* still finds debt. Vitest «then createRepayment on same debt still succeeds (G-10-5)». P2025 mapping often idle for this smoke."
  implication: "10-04 alone cannot satisfy UAT when failure is domain/UI, not record-missing"

## Resolution

root_cause: "AND-gate multi-factor after G-10-5: (1) DebtDetailDialog forgive handleConfirm ignores errors.deltaMajor so OVER_FLOOR/DELTA_ZERO fall through to client opaque fallback identical to server catch-all (WR-01); (2) forgive failure setConfirm(null) and forgive tab never renders actionError so even correct staleRecordRefreshState message is invisible (CR-01); (3) peer-tab history-event delete rarely produces P2025 — 10-04 server map does not cover the common concurrent path; repay/size still collapse unmapped throws to opaque catch-all"
fix: "Client: resolveForgiveActionError chains asOfDate→deltaMajor→message→opaque; forgive failure keeps confirm (actionError visible); forgive tabpanel also renders actionError. Server forgiveRemaining: OVER_FLOOR/DELTA_ZERO return message+errors.deltaMajor so message-only clients avoid opaque."
verification: "vitest: forgive-action-error.test.ts (4) + actions.test.ts G-10-5 OVER_FLOOR/P2025 — 44 passed"
files_changed:
  - src/components/debts/DebtDetailDialog.tsx
  - src/components/debts/forgive-action-error.ts
  - src/components/debts/forgive-action-error.test.ts
  - src/app/debts/actions.ts
  - src/app/debts/actions.test.ts
oracle_type: derived
specialist_hint: react
confidence: high

proposed_fix_outline:
  - "DebtDetailDialog.tsx handleConfirm (forgive): chain result.errors?.deltaMajor?.[0] before message; do NOT setConfirm(null) on failure (keep DestructiveConfirmStep + actionError visible)"
  - "DebtDetailDialog.tsx forgive tabpanel: also render actionError (defense in depth)"
  - "Optional actions.ts forgiveRemaining: return OVER_FLOOR/DELTA_ZERO as message (or message+errors) so all clients share one field"
  - "Optional: map remaining unmapped concurrent throws (e.g. remaining must never be < 0 on deleteSizeChange WR-04) away from catch-all"
  - "Add component/vitest: forgive failure with deltaMajor-only and with refresh message both surface refresh/actionable RU (not opaque, not silent)"
  - "Re-UAT 10-UAT #5: explicit forgive path + repay/size path after peer event delete"
---

## Hypotheses (G-10-8)

| ID | Hypothesis | Result |
|----|------------|--------|
| H1 | P2025 instanceof broken in tx / Next → still catch-all | REJECTED (probe) |
| H2 | 10-04 mapping missing from tree | REJECTED (code) |
| H3 | Forgive UI ignores deltaMajor → opaque client fallback (WR-01) | CONFIRMED |
| H4 | Forgive clears confirm / no actionError on tab (CR-01) → refresh RU never shown | CONFIRMED |
| H5 | Peer event-delete ≠ P2025; 10-04 path idle for UAT smoke | CONFIRMED |
| H6 | Repay/size forms mis-display server refresh message | REJECTED — they render `message` when present |
| H7 | Unmapped non-P2025 still hits server catch-all under concurrency | PLAUSIBLE (catch-all remains; not live-reproduced this session) |

## Root Cause Summary

G-10-5/10-04 fixed **server** P2025 → «Долг или запись не найдены. Обновите страницу.» Vitest + probe confirm that path.

Re-UAT G-10-8 still opaque because:

1. **Client (forgive)** — WR-01 + CR-01: domain errors become opaque string; success/failure messages on forgive are cleared/hidden.
2. **Scenario** — deleting a history event does not remove the debt, so P2025 mapping often never runs; peer-delete→create may succeed or fail via domain/UI paths 10-04 did not fix in the dialog.
3. **Server catch-all** — still present for non-P2025; possible secondary source of visible opaque on repay/size forms.

## Proposed Fix (outline only)

See `proposed_fix_outline` in Resolution frontmatter above. Diagnose-only — no code changes this session.
