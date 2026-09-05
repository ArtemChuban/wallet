---
phase: 10-repayments-close-write-off
verified: 2026-09-05T12:34:21Z
status: human_needed
score: 17/18 must-haves verified
behavior_unverified: 0
overrides_applied: 2
overrides:
  - must_have: "Timeline labels «Списание» for isForgive size-changes vs «Изменение суммы» for manual (D-07)"
    reason: "User declined separate «Списание» timeline label; all DebtSizeChange rows use «Изменение суммы». DEBT-05 mechanics (forgiveRemaining → size-change −remaining + CLOSED) remain shipped."
    accepted_by: "user"
    accepted_at: "2026-09-05T12:22:00Z"
  - must_have: "isForgive Boolean @default(false) on DebtSizeChange persists across reload"
    reason: "User declined isForgive Boolean migration; early close is forgiveRemaining UX + server-computed DebtSizeChange only. No writeOffMinor / WRITE_OFF type."
    accepted_by: "user"
    accepted_at: "2026-09-05T12:22:00Z"
gaps: []
behavior_unverified_items: []
human_verification:
  - test: "On /debts, click entire debt row; confirm DebtDetailDialog opens. Click «Изменить» without opening detail (stopPropagation)."
    expected: "Detail Dialog opens from row; meta edit Dialog opens alone from «Изменить»."
    why_human: "Controlled Dialog open / hit-target UX not covered by unit tests."
  - test: "Add repayment + size-change; open detail; inspect История order and labels."
    expected: "Mixed newest-first timeline; repayments «Погашение»; size-changes «Изменение суммы» (no «Списание» — intentional override)."
    why_human: "Visual order and RU labels need live Dialog eye."
  - test: "Close a debt to remaining 0; confirm it sits under person «Закрытые (N)» collapsed by default; expand and open detail."
    expected: "CLOSED under same person group, default collapsed; full detail (repay/size/forgive/delete) still available."
    why_human: "Collapse disclosure UX and CLOSED access path are visual."
  - test: "With remaining > 0, open «Простить остаток»; confirm copy shows amount + close intent; confirm; debt CLOSED. At remaining 0, forgive CTA absent."
    expected: "Confirm states remaining being written off and debt will close; after forgive, CLOSED + size-change in history; CTA hidden at zero."
    why_human: "Confirm microcopy and hide-at-zero CTA need human eye (SUMMARY D4)."
  - test: "Optional smoke: two tabs delete+create on same debt in quick succession."
    expected: "No corrupt ledger; after each successful write, Debt.status matches remainingMinor."
    why_human: "PLAN backstop concurrency truth — no automated multi-writer test; SQLite serialize assumed."
decision_coverage:
  honored: 13
  total: 13
  not_honored: []
  note: "Gate reported all CONTEXT decisions honored. D-07 «Списание» label distinction waived by user override (see overrides) — not a gap."
---

# Phase 10: Repayments + close/write-off Verification Report

**Phase Goal:** Partial dated repayments with history/delete, auto-close at zero, early write-off close.
**Verified:** 2026-09-05T12:34:21Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | User can add same-currency repayment with as-of date (backdating allowed) | ✓ VERIFIED | `createRepayment` + DebtDetailDialog form; vitest partial/OPEN + future-date reject; `asOfDate` past allowed |
| 2 | User can see repayment history and delete repayment with remaining recalculated | ✓ VERIFIED | `buildTimeline` + `deleteRepayment`; page serializes events; reopen test passes |
| 3 | Debt closed at zero reopens when deletion leaves remaining > 0 | ✓ VERIFIED | `deleteRepayment` → `statusForRemaining`; test «reopens OPEN when remaining > 0» |
| 4 | Debt auto-closes at remaining 0; user can close early with recorded write-off/forgive | ✓ VERIFIED | createRepayment CLOSED-at-zero; `forgiveRemaining` writes `DebtSizeChange` delta=`−remaining` + CLOSED |
| 5 | Entire debt row click opens DebtDetailDialog; «Изменить» stopPropagation | ✓ VERIFIED | `DebtsList` DebtCompactRow controlled open + stopPropagation wrapper |
| 6 | Over-repayment rejected before write | ✓ VERIFIED | `assertRepaymentAmount`; test «rejects over-repayment without writing» |
| 7 | Future asOfDate rejected; backdating still allowed | ✓ VERIFIED | Gate in create/forgive/size-change; Russian «Дата не может быть в будущем»; tests pass |
| 8 | Mixed newest-first timeline; «Погашение» / «Изменение суммы» | ✓ VERIFIED | `buildTimeline` sort asOfDate DESC, id DESC; labels wired (Списание waived — override) |
| 9 | deleteRepayment twice: second fails without corrupting ledger | ✓ VERIFIED | Missing-id path returns RU message, no revalidate |
| 10 | CLOSED debts under collapsed per-person «Закрытые (N)» | ✓ VERIFIED | `closedOpen` default false; same person group; DebtCompactRow still mounts detail |
| 11 | Concurrent delete+create serializes; status matches remaining | ⚠️ insufficient_spec | Backstop only — no multi-tab test; SQLite `$transaction` present. Human smoke optional |
| 12 | Early close «Простить остаток» → size-change −remaining + CLOSED | ✓ VERIFIED | `forgiveRemaining` + vitest T-10-02; no client delta on schema |
| 13 | Manual «Изменение суммы» via createSizeChange + assertSizeDelta | ✓ VERIFIED | Action + form + up-delta / over-floor tests |
| 14 | Forgive confirm states remaining + close; asOfDate required; note optional | ✓ VERIFIED | DestructiveConfirmStep message embeds `remainingLabel`; forgive date field required |
| 15 | Forgive delta server-side; client deltaMajor ignored/absent | ✓ VERIFIED | `forgiveRemainingSchema.strict()`; test ignores smuggled delta |
| 16 | Delete size-change with remaining/status recompute (incl. reopen) | ✓ VERIFIED | `deleteSizeChange` + reopen after forgive-delete test |
| 17 | «Простить остаток» hidden when remaining is 0 | ✓ VERIFIED | `showForgive = remainingMinor !== 0n` |
| 18a | Timeline «Списание» for isForgive vs «Изменение суммы» (D-07) | ✓ PASSED (override) | User declined distinct label — see overrides |
| 18b | isForgive Boolean persists on DebtSizeChange | ✓ PASSED (override) | User declined column — see overrides |

**Score:** 17/18 truths verified (1 insufficient_spec backstop routed to human; 2 overrides count toward pass)

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `src/app/debts/actions.ts` | create/delete repay + size-change + forgive | ✓ VERIFIED | All five actions present; `$transaction` + status sync |
| `src/app/debts/actions.test.ts` | REPAY/DEBT coverage | ✓ VERIFIED | 15 phase-relevant tests passed (vitest filter) |
| `src/components/debts/DebtDetailDialog.tsx` | Detail Dialog forms + timeline + confirms | ✓ VERIFIED | Wired to all actions; DestructiveConfirmStep |
| `src/components/debts/DebtsList.tsx` | Row click + «Закрытые (N)» | ✓ VERIFIED | OPEN/CLOSED split; detail openable |
| `src/app/debts/page.tsx` | status + remaining + event rows | ✓ VERIFIED | Prisma include → string minors → list |
| `src/lib/validations/debts.ts` | schemas incl. forgiveRemaining | ✓ VERIFIED | delete + forgive schemas present |
| `prisma/schema.prisma` isForgive | Plan 03 artifact | ✓ PASSED (override) | Absent by user decision — not a gap |
| `prisma/migrations/` isForgive | Plan 03 artifact | ✓ PASSED (override) | No migrate — intentional |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| DebtsList | DebtDetailDialog | row click controlled open | ✓ WIRED | codegraph callers + source |
| DebtDetailDialog | createRepayment / deleteRepayment / forgiveRemaining / deleteSizeChange | useActionState + handleConfirm | ✓ WIRED | codegraph callers |
| actions.ts | debts.ts | remainingMinor / asserts / statusForRemaining | ✓ WIRED | create/delete/size/forgive paths |
| actions.ts | validations | createRepaymentSchema / forgiveRemainingSchema | ✓ WIRED | safeParse at entry |
| actions forgive → isForgive | prisma DebtSizeChange.isForgive | Plan key_link | ✓ PASSED (override) | Pattern absent — waived |

gsd `verify.key-links` on 10-03 reported invalid (isForgive pattern missing) — expected under override.

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| page.tsx → DebtsList | remainingMinor, status, repayments, sizeChanges | prisma.person.findMany + remainingMinor() | Yes | ✓ FLOWING |
| DebtDetailDialog timeline | buildTimeline(debt.*) | props from page serialization | Yes | ✓ FLOWING |
| createRepayment | amountMinor → DebtRepayment | FormData → parse → prisma create | Yes | ✓ FLOWING |
| forgiveRemaining | deltaMinor | server −remainingBefore → DebtSizeChange | Yes | ✓ FLOWING |

No hollow props / static empty event arrays at call site.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| create/delete repay + size/forgive actions | `npx vitest run src/app/debts/actions.test.ts -t "createRepayment\|deleteRepayment\|forgiveRemaining\|createSizeChange\|deleteSizeChange"` | 15 passed, 14 skipped | ✓ PASS |
| No isForgive / writeOff in schema | grep prisma/schema.prisma | no matches | ✓ PASS (override / prohibition) |
| No «Списание» / window.confirm in debts UI | grep DebtDetailDialog / debts components | «Изменение суммы» only; DestructiveConfirmStep | ✓ PASS |

### Probe Execution

| Probe | Command | Result | Status |
| ----- | ------- | ------ | ------ |
| — | — | No phase probes declared | SKIP |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| REPAY-01 | 10-01 | Partial same-currency repayment + asOfDate | ✓ SATISFIED | createRepayment + Dialog form + tests |
| REPAY-02 | 10-02 | See repayment/history | ✓ SATISFIED | Mixed timeline from page events |
| REPAY-03 | 10-02 | Delete repayment; recalc; reopen | ✓ SATISFIED | deleteRepayment + reopen test |
| DEBT-04 | 10-01 | Auto-close at remaining 0 | ✓ SATISFIED | statusForRemaining after repay |
| DEBT-05 | 10-03 | Early close write-off/forgive | ✓ SATISFIED | forgiveRemaining size-change −remaining (label/isForgive overridden) |

Orphaned REQUIREMENTS for Phase 10: none — all five IDs claimed by plans.

### Prohibitions

| Statement | Tier | Verdict | Evidence |
| --------- | ---- | ------- | -------- |
| MUST NOT put repayment UI inside DebtFormDialog | judgment | held | DebtFormDialog has event types only; forms live in DebtDetailDialog |
| MUST NOT revalidatePath dashboard root; only /debts | test | held | All debt actions `revalidatePath("/debts")`; tests assert not `/` |
| MUST NOT CLOSED without ledger event that zeros remaining | judgment | held | createRepayment/forgive insert event then status |
| MUST NOT introduce writeOffMinor / WRITE_OFF type | judgment | held | absent from schema |
| MUST NOT native browser confirm | judgment | held | DestructiveConfirmStep only |
| MUST NOT page-global CLOSED section | judgment | held | per-person «Закрытые (N)» |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | No TBD/FIXME/XXX/TODO in phase-modified debts files | — | — |

### Test Quality Audit

| Test File | Linked Req | Active | Skipped | Circular | Assertion Level | Verdict |
| --------- | ---------- | ------ | ------- | -------- | --------------- | ------- |
| actions.test.ts createRepayment | REPAY-01, DEBT-04 | 4 | 0 | no | Behavioral/value | OK |
| actions.test.ts deleteRepayment | REPAY-03 | 3 | 0 | no | Behavioral/value | OK |
| actions.test.ts createSizeChange / forgive / deleteSizeChange | DEBT-05 | 8 | 0 | no | Behavioral/value | OK |
| validations debts.test.ts forgiveRemainingSchema | DEBT-05 / T-10-02 | active | 0 | no | Value (.strict reject) | OK |

**Disabled tests on requirements:** 0
**Circular patterns:** 0
**Insufficient assertions:** 0

### Decision Coverage

All trackable CONTEXT.md decisions honored by shipped artifacts (13/13 per `check.decision-coverage-verify`).
D-07 «Списание» vs «Изменение суммы» label distinction: **waived by user product override** — mechanics of DEBT-05 intact; do not treat missing «Списание»/isForgive as gap.

### Human Verification Required

### 1. Row click / meta edit separation

**Test:** On `/debts`, click entire debt row; click «Изменить» alone.
**Expected:** Detail Dialog vs meta edit Dialog open on correct controls.
**Why human:** Hit-target / stopPropagation UX.

### 2. Timeline visual

**Test:** Record repayment + size-change; inspect История.
**Expected:** Newest-first; «Погашение» / «Изменение суммы» (no «Списание»).
**Why human:** Visual order/labels.

### 3. «Закрытые (N)» subsection

**Test:** Closed debt under person group; expand; open detail.
**Expected:** Default collapsed; full detail still works.
**Why human:** Collapse UX.

### 4. Forgive confirm + hide at zero

**Test:** Forgive flow with remaining > 0; then at remaining 0.
**Expected:** Confirm shows amount + close; CTA hidden at zero.
**Why human:** Microcopy / CTA visibility.

### 5. Optional concurrency smoke

**Test:** Overlapping delete+create on same debt (two tabs).
**Expected:** Status always matches remaining after each success.
**Why human:** Backstop truth — no automated multi-writer coverage.

### Gaps Summary

No blocking gaps. Goal mechanics present and unit-tested. Status `human_needed` for end-of-phase UAT (UI + optional concurrency). D-07/isForgive deviations accepted via overrides — not gaps.

---

_Verified: 2026-09-05T12:34:21Z_
_Verifier: Claude (gsd-verifier)_
