---
phase: 10-repayments-close-write-off
verified: 2026-09-05T18:30:23Z
status: human_needed
score: 22/23 must-haves verified
behavior_unverified: 1
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
re_verification:
  previous_status: human_needed
  previous_score: 17/18
  gaps_closed:
    - "G-10-5: P2025 / record-missing map to «Долг или запись не найдены. Обновите страницу.» + revalidatePath(\"/debts\")"
    - "G-10-5: forgiveRemaining assertSizeDelta OVER_FLOOR / DELTA_ZERO mapped to actionable RU"
    - "G-10-5: vitest peer-delete-then-create + P2025 ≠ opaque catch-all"
  gaps_remaining: []
  regressions: []
gaps: []
behavior_unverified_items:
  - truth: "Concurrent delete+create on same debt serializes via SQLite; status always matches remaining after each successful transaction (REPAY-03 concurrency backstop)"
    test: "Two browser tabs: delete repayment/event in one, write repay/size/forgive in the other"
    expected: "Successful writes keep Debt.status ≡ remainingMinor; failed stale writes show refresh RU (not «Не удалось сохранить…»)"
    why_human: "PLAN verification: backstop — vitest covers mapped P2025 + sequential delete→create mocks, not real multi-tab races"
human_verification:
  - test: "Re-UAT concurrency smoke (10-UAT test 5) after G-10-5: two tabs delete+create / stale write on same debt"
    expected: "Ledger consistent after successes; stale failure shows «Долг или запись не найдены. Обновите страницу.» (not opaque save catch-all); list refreshes via /debts revalidate"
    why_human: "UAT previously failed on opaque catch-all; code+vitest closed G-10-5 — need live two-tab confirm before phase pass"
decision_coverage:
  honored: 13
  total: 13
  not_honored: []
  note: "Gate reported all CONTEXT decisions honored. D-07 «Списание» / isForgive waived by user override — not a gap."
---

# Phase 10: Repayments + close/write-off Verification Report

**Phase Goal:** Partial dated repayments with history/delete, auto-close at zero, early write-off close.
**Verified:** 2026-09-05T18:30:23Z
**Status:** human_needed
**Re-verification:** Yes — after G-10-5 gap closure (10-04)

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
| 9 | deleteRepayment twice: second fails without corrupting ledger | ✓ VERIFIED | Missing-id → refresh RU + revalidate (G-10-5); no delete call |
| 10 | CLOSED debts under collapsed per-person «Закрытые (N)» | ✓ VERIFIED | `closedOpen` default false; same person group; DebtCompactRow still mounts detail |
| 11 | Concurrent delete+create serializes; status matches remaining | ⚠️ insufficient_spec | Backstop — SQLite `$transaction` present; vitest sequential peer-delete→create + P2025 mapped. Live multi-tab still human |
| 12 | Early close «Простить остаток» → size-change −remaining + CLOSED | ✓ VERIFIED | `forgiveRemaining` + vitest T-10-02; no client delta on schema |
| 13 | Manual «Изменение суммы» via createSizeChange + assertSizeDelta | ✓ VERIFIED | Action + form + up-delta / over-floor tests |
| 14 | Forgive confirm states remaining + close; asOfDate required; note optional | ✓ VERIFIED | DestructiveConfirmStep message embeds `remainingLabel`; forgive date field required (UAT #4 pass) |
| 15 | Forgive delta server-side; client deltaMajor ignored/absent | ✓ VERIFIED | `forgiveRemainingSchema.strict()`; test ignores smuggled delta |
| 16 | Delete size-change with remaining/status recompute (incl. reopen) | ✓ VERIFIED | `deleteSizeChange` + reopen after forgive-delete test |
| 17 | «Простить остаток» hidden when remaining is 0 | ✓ VERIFIED | `showForgive = remainingMinor !== 0n` (UAT #4 pass) |
| 18a | Timeline «Списание» for isForgive vs «Изменение суммы» (D-07) | ✓ PASSED (override) | User declined distinct label — see overrides |
| 18b | isForgive Boolean persists on DebtSizeChange | ✓ PASSED (override) | User declined column — see overrides |
| 19 | P2025 / record-missing → «Долг или запись не найдены. Обновите страницу.» (G-10-5) | ✓ VERIFIED | `isRecordNotFound` + `staleRecordRefreshState`; create/delete/forgive catch branches; vitest P2025 + missing-id |
| 20 | Staleness failure paths `revalidatePath("/debts")` never `"/"` (G-10-5) | ✓ VERIFIED | `staleRecordRefreshState` only `/debts`; vitest asserts `not.toHaveBeenCalledWith("/")`; no root revalidate in file |
| 21 | forgiveRemaining maps assertSizeDelta domain failures to actionable RU (G-10-5) | ✓ VERIFIED | OVER_FLOOR / DELTA_ZERO (+ raw assert strings) → field errors; vitest OVER_FLOOR ≠ catch-all |
| 22 | After deleteRepayment succeeds, createRepayment on same debt still succeeds (G-10-5) | ✓ VERIFIED | vitest «then createRepayment on same debt still succeeds (G-10-5)» PASS |
| 23 | Missing debt / P2025 on createRepayment returns mapped refresh, not generic save catch-all (G-10-5) | ✓ VERIFIED | vitest asserts message ≠ «Не удалось сохранить…»; create not called |

**Score:** 22/23 truths verified (1 insufficient_spec backstop routed to human; 2 overrides count toward pass)

### Deferred Items

None blocking. Dialog auto-close / remaining-drift banner excluded from 10-04 (follow-up only). DebtDetailDialog tabs redesign deferred in 10-UAT.

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `src/app/debts/actions.ts` | create/delete repay + size-change + forgive + G-10-5 staleness map | ✓ VERIFIED | Five actions; `isRecordNotFound` / `staleRecordRefreshState`; `$transaction` + status sync |
| `src/app/debts/actions.test.ts` | REPAY/DEBT + G-10-5 coverage | ✓ VERIFIED | 7 G-10-5 tests PASS (`-t "G-10-5"`); peer-delete + P2025 + OVER_FLOOR |
| `src/components/debts/DebtDetailDialog.tsx` | Detail Dialog forms + timeline + confirms | ✓ VERIFIED | Wired to all actions; DestructiveConfirmStep (unchanged by 10-04 — intentional) |
| `src/components/debts/DebtsList.tsx` | Row click + «Закрытые (N)» | ✓ VERIFIED | OPEN/CLOSED split; detail openable |
| `src/app/debts/page.tsx` | status + remaining + event rows | ✓ VERIFIED | Prisma include → string minors → list |
| `src/lib/validations/debts.ts` | schemas incl. forgiveRemaining | ✓ VERIFIED | delete + forgive schemas present |
| `prisma/schema.prisma` isForgive | Plan 03 artifact | ✓ PASSED (override) | Absent by user decision — not a gap |
| `prisma/migrations/` isForgive | Plan 03 artifact | ✓ PASSED (override) | No migrate — intentional |

gsd `verify.artifacts` on 10-04: 2/2 passed.

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | --- | ---- | ------ | ------- |
| DebtsList | DebtDetailDialog | row click controlled open | ✓ WIRED | import + DebtCompactRow open |
| DebtDetailDialog | createRepayment / deleteRepayment / forgiveRemaining / deleteSizeChange | useActionState + handleConfirm | ✓ WIRED | imports + calls |
| actions.ts | debts.ts | remainingMinor / asserts / statusForRemaining | ✓ WIRED | create/delete/size/forgive paths |
| actions.ts | validations | createRepaymentSchema / forgiveRemainingSchema | ✓ WIRED | safeParse at entry |
| actions catch | Prisma P2025 | `isRecordNotFound` | ✓ WIRED | code === `"P2025"`; used on all five event actions |
| staleness returns | `revalidatePath("/debts")` | `staleRecordRefreshState` | ✓ WIRED | pattern «Обновите страницу»; never `"/"` |
| actions forgive → isForgive | prisma DebtSizeChange.isForgive | Plan 03 key_link | ✓ PASSED (override) | Pattern absent — waived |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| page.tsx → DebtsList | remainingMinor, status, repayments, sizeChanges | prisma.person.findMany + remainingMinor() | Yes | ✓ FLOWING |
| DebtDetailDialog timeline | buildTimeline(debt.*) | props from page serialization | Yes | ✓ FLOWING |
| createRepayment | amountMinor → DebtRepayment | FormData → parse → prisma create | Yes | ✓ FLOWING |
| forgiveRemaining | deltaMinor | server −remainingBefore → DebtSizeChange | Yes | ✓ FLOWING |
| staleness error message | STALE_RECORD_REFRESH_MESSAGE | catch → staleRecordRefreshState | Yes (fixed RU) | ✓ FLOWING |

No hollow props / static empty event arrays at call site.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| G-10-5 suite | `npx vitest run src/app/debts/actions.test.ts -t "G-10-5"` | 7 passed, 0 failed | ✓ PASS |
| P2025 refresh mapping | `-t "maps P2025 not-found to refresh"` | 3 passed | ✓ PASS |
| Peer delete→create | `-t "then createRepayment on same debt still succeeds"` | 1 passed | ✓ PASS |
| forgive OVER_FLOOR | `-t "maps assertSizeDelta OVER_FLOOR"` | 1 passed | ✓ PASS |
| No root revalidate | `rg 'revalidatePath\("/")' src/app/debts/actions.ts` | no matches | ✓ PASS |
| No isForgive / writeOff | grep prisma/schema.prisma | no matches | ✓ PASS (override / prohibition) |

### Probe Execution

| Probe | Command | Result | Status |
| ----- | ------- | ------ | ------ |
| — | — | No phase probes declared | SKIP |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| REPAY-01 | 10-01, 10-04 | Partial same-currency repayment + asOfDate | ✓ SATISFIED | createRepayment + Dialog + G-10-5 P2025 map |
| REPAY-02 | 10-02 | See repayment/history | ✓ SATISFIED | Mixed timeline from page events |
| REPAY-03 | 10-02, 10-04 | Delete repayment; recalc; reopen | ✓ SATISFIED | deleteRepayment + reopen + missing→refresh RU |
| DEBT-04 | 10-01 | Auto-close at remaining 0 | ✓ SATISFIED | statusForRemaining after repay |
| DEBT-05 | 10-03, 10-04 | Early close write-off/forgive | ✓ SATISFIED | forgiveRemaining + assertSizeDelta RU map |

Orphaned REQUIREMENTS for Phase 10: none — all five IDs claimed by plans.

### Prohibitions

| Statement | Tier | Verdict | Evidence |
| --------- | ---- | ------- | -------- |
| MUST NOT put repayment UI inside DebtFormDialog | judgment | held | Forms live in DebtDetailDialog |
| MUST NOT revalidatePath dashboard root; only /debts | test | held | All debt actions `/debts` only; tests assert not `/` |
| MUST NOT CLOSED without ledger event that zeros remaining | judgment | held | createRepayment/forgive insert event then status |
| MUST NOT introduce writeOffMinor / WRITE_OFF type | judgment | held | absent from schema |
| MUST NOT native browser confirm | judgment | held | DestructiveConfirmStep only |
| MUST NOT page-global CLOSED section | judgment | held | per-person «Закрытые (N)» |
| Do not add forgive-flag column (10-04) | judgment | held | no migration |
| Do not introduce distinct forgive timeline label (10-04) | judgment | held | «Изменение суммы» only |
| Do not rebuild DebtDetailDialog stale-refresh UX (10-04) | judgment | held | Dialog unchanged in 10-04 |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | No TBD/FIXME/XXX/TODO in phase-modified debts files | — | — |

### Test Quality Audit

| Test File | Linked Req | Active | Skipped | Circular | Assertion Level | Verdict |
| --------- | ---------- | ------ | ------- | -------- | --------------- | ------- |
| actions.test.ts createRepayment | REPAY-01, DEBT-04, G-10-5 | active | 0 | no | Behavioral/value | OK |
| actions.test.ts deleteRepayment | REPAY-03, G-10-5 | active | 0 | no | Behavioral/value | OK |
| actions.test.ts createSizeChange / forgive / deleteSizeChange | DEBT-05, G-10-5 | active | 0 | no | Behavioral/value | OK |

**Disabled tests on requirements:** 0
**Circular patterns:** 0
**Insufficient assertions:** 0

### Decision Coverage

All trackable CONTEXT.md decisions honored by shipped artifacts (13/13 per `check.decision-coverage-verify`).
D-07 «Списание» vs «Изменение суммы» / isForgive: **waived by user product override** — mechanics of DEBT-05 intact.

### Human Verification Required

### 1. Re-UAT concurrency smoke (G-10-5 closure)

**Test:** Two tabs on same debt — delete event in one; repay / size-change / forgive in the other (prior 10-UAT test 5).
**Expected:** Successes keep status ≡ remaining; stale failure shows «Долг или запись не найдены. Обновите страницу.» (not «Не удалось сохранить. Проверьте поля и попробуйте снова.»).
**Why human:** Prior UAT failed on opaque catch-all; automated tests lock mapping but not live multi-tab UX.

UAT tests 1–4, 6, 7 already **pass** (documented in 10-UAT.md) — not re-listed.

### Gaps Summary

No blocking code gaps. G-10-5 closed in `actions.ts` + vitest (10-04). Phase goal mechanics present. Status `human_needed` solely for live re-smoke of concurrency after the fix (backstop truth #11).

---

_Verified: 2026-09-05T18:30:23Z_
_Verifier: Claude (gsd-verifier)_
