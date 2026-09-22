---
status: resolved
trigger: "Я не могу поменять тип счета с Актив на Сберегательный, если счет изначально был Актив"
created: 2026-09-22T13:49:00Z
updated: 2026-09-22T14:05:00Z
symptoms_prefilled: true
goal: find_and_fix
---

## Current Focus

hypothesis: "CONFIRMED — soft-legacy rows labeled Актив but locked by exact canConvertType"
test: "human verify Accounts → Black → Изменить → Тип Select"
expecting: "Select editable; convert to Накопительный works"
next_action: "archived — human confirmed fixed"
bug_class: Bohrbug

## Symptoms

expected: "Edit dialog for account created as Asset (Актив) must allow changing type to Savings (Сберегательный). Symmetric path works: Savings→Asset→Savings editable."
actual: "Type field in Изменить menu is inactive/readonly when account was originally created as Asset."
errors: "None — field simply readonly, no toast/console."
reproduction: "Accounts → account created as Актив → Изменить → Тип field readonly."
started: "Always readonly historically; current milestone should enable Asset↔Savings conversion but conversion UI missing for originally-Asset accounts."

## Eliminated

- hypothesis: "Phase 31 UI never shipped canConvertType / Select for ASSET"
  evidence: "AccountFormDialog has canConvertType + CONVERT_TYPE_OPTIONS; 31-UAT §1–2 passed on UAT ASSET 31"
  timestamp: 2026-09-22T13:55:00Z

- hypothesis: "updateAccount rejects ASSET→SAVINGS so UI hides Select"
  evidence: "actions.ts convertiblePair allows ASSET↔SAVINGS; UI gate is independent client canConvertType; UAT converted successfully"
  timestamp: 2026-09-22T13:55:00Z

- hypothesis: "KB docker-build-zod match"
  evidence: "No keyword/semantic overlap with account type readonly"
  timestamp: 2026-09-22T13:52:00Z

## Evidence

- timestamp: 2026-09-22T13:52:00Z
  checked: knowledge-base.md
  found: Only docker-build-zod entry; no account-type pattern
  implication: No known-pattern shortcut

- timestamp: 2026-09-22T13:54:00Z
  checked: AccountFormDialog.tsx canConvertType + accountTypeLabel
  found: Unlock exact ASSET|SAVINGS; label «Актив» for FIAT_DEBIT/CRYPTO/CASH too
  implication: Soft-legacy looks like Актив but stays muted paragraph

- timestamp: 2026-09-22T13:56:00Z
  checked: sqlite3 data/wallet.db SELECT id,name,type FROM Account
  found: "1 Black FIAT_DEBIT; 3 Сберегательный FIAT_DEBIT; 4 Наличные CASH; 5 QQ CRYPTO; 6/7 ASSET"
  implication: User «originally Актив» rows are legacy enums; Savings→Asset path writes ASSET (explains asymmetry)

- timestamp: 2026-09-22T13:57:00Z
  checked: QUICK-0i7 VERIFICATION + Phase 31 D-14 / 31-UAT
  found: Explicit no forced UPDATE in 0i7; Phase 31 locks soft legacy by design; UAT only seeded true ASSET
  implication: Root cause is missing backfill, not missing Select code for canonical ASSET

- timestamp: 2026-09-22T14:00:00Z
  checked: backfill applied + revert-reconfirm on Black
  found: "post: Black/Сберегательный/Наличные/QQ=ASSET; Platinum=FIAT_CREDIT; revert Black→FIAT_DEBIT then ASSET restores unlock predicate"
  implication: Fix addresses data cause; D-14 code gate unchanged

- timestamp: 2026-09-22T14:05:00Z
  checked: human-verify checkpoint
  found: "user response: confirmed fixed (\"fixed\")"
  implication: End-to-end resolution accepted; archive session

## Resolution

root_cause: "QUICK-0i7 soft-compat left FIAT_DEBIT/CRYPTO/CASH rows in DB while UI labels them «Актив»; Phase 31 canConvertType unlocks only exact ASSET|SAVINGS — so originally-created «Актив» accounts stay readonly until type is canonical ASSET (Savings→Asset path already writes ASSET)."
fix: "Prisma migration 20260922140000_legacy_soft_asset_to_asset UPDATE Account.type→ASSET for FIAT_DEBIT|CRYPTO|CASH; applied to data/wallet.db; regression source-scan test src/lib/legacy-soft-asset-backfill.test.ts"
verification: |
  target_test: { result: pass, name: "src/lib/legacy-soft-asset-backfill.test.ts" }
  mutation_check: { result: skipped, reason_if_skipped: "no Stryker configured" }
  no_op_deletion: { result: pass, deletion_justified_by_rca: false }
  adjacent_tests: { result: pass, ran: "AccountFormDialog.test.ts + actions.test.ts (45+10)" }
  revert_reconfirm: { result: pass, detail: "Black→FIAT_DEBIT restores non-convertible; Black→ASSET restores convertible; Platinum untouched" }
  guardrail_verdict: accepted
  oracle_type: derived
  human_verify: confirmed fixed
files_changed:
  - prisma/migrations/20260922140000_legacy_soft_asset_to_asset/migration.sql
  - src/lib/legacy-soft-asset-backfill.test.ts

## Prevention

whys_branched:
  data: "QUICK-0i7 soft-compat deliberately skipped forced UPDATE of FIAT_DEBIT|CRYPTO|CASH → ASSET; rows stayed legacy while UI labeled them Актив"
  code: "Phase 31 D-14 canConvertType requires exact ASSET|SAVINGS (intentional lock of soft-legacy); accountTypeLabel soft-maps same legacy enums to Актив — AND-gate produces readonly «Актив»"
  why_gate_missed: "31-UAT seeded only canonical ASSET accounts; no check that soft-legacy labeled-Актив rows unlock after conversion milestone"
why_not_caught: "no gate existed for this class — Phase 31 UAT/verify covered ASSET↔SAVINGS on true ASSET rows only; no migration/assert that soft-legacy FIAT_DEBIT|CRYPTO|CASH were backfilled before conversion UI shipped"
recurrence_guard: "prisma/migrations/20260922140000_legacy_soft_asset_to_asset/migration.sql + regression test src/lib/legacy-soft-asset-backfill.test.ts"
