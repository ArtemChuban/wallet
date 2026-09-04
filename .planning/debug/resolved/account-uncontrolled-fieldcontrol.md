---
status: resolved
trigger: "G-02-2-account-uncontrolled-fieldcontrol — Editing an account form triggers Base UI console error: uncontrolled FieldControl default value state change after init (AccountFormDialog / AccountFormBody / Input)."
created: 2026-09-03T00:01:00Z
updated: 2026-09-04T13:00:00Z
symptoms_prefilled: true
goal: find_root_cause_only
---

## Current Focus

hypothesis: "AccountFormBody name Input uses uncontrolled defaultValue={account?.name}; after updateAccountName, revalidatePath('/accounts') refreshes list while dialog still mounted, so defaultValue prop changes after Base UI FieldControl init → console warning."
bug_class: bohrbug
test: "Trace edit Input props + updateAccountName revalidate + dialog close timing; confirm defaultValue is only Input with changing prop on edit path."
expecting: "Stack points at AccountFormBody:139; update path revalidates /accounts before useEffect closes dialog."
next_action: "Diagnosis complete (diagnose-only); fix deferred to /gsd-plan-phase --gaps or manual."
known_pattern_candidate: "currency-uncontrolled-fieldcontrol (G-02-1) — same uncontrolled defaultValue + revalidatePath while dialog mounted"

candidate_causes:
  - "code: defaultValue bound to live account.name prop (uncontrolled FieldControl)"
  - "data: revalidatePath('/accounts') pushes updated account into still-open AccountFormDialog"
and_gate: "yes — warning needs both uncontrolled defaultValue AND that prop changing after mount; either alone insufficient"

## Symptoms

expected: All four types creatable; credit limit required only for credit; edit locks type/currency/limit; Russian empty/CTA copy; no delete — without console errors when editing accounts
actual: При изменении Console Error: Base UI: A component is changing the default value state of an uncontrolled FieldControl after being initialized. To suppress this warning opt to use a controlled FieldControl. at Input → AccountFormBody → AccountFormDialog → AccountList
errors: Base UI: A component is changing the default value state of an uncontrolled FieldControl after being initialized. To suppress this warning opt to use a controlled FieldControl. (Next.js 16.3.4 Turbopack) Stack: Input (src/components/ui/input.tsx:8:5) → AccountFormBody (src/components/accounts/AccountFormDialog.tsx:139:9) → AccountFormDialog (AccountFormDialog.tsx:309:11) → AccountList.tsx:81
reproduction: Test 2 in UAT — change/edit account fields
started: Discovered during UAT phase 02

## Eliminated

- hypothesis: "Input wrapper (input.tsx) incorrectly forces uncontrolled FieldControl"
  evidence: "input.tsx only forwards props to @base-ui/react/input InputPrimitive; no defaultValue of its own. Warning originates from caller-supplied defaultValue at AccountFormBody:142."
  timestamp: 2026-09-03T00:05:00Z

- hypothesis: "formKey remount on open incorrectly resets defaultValue mid-session"
  evidence: "formKey increments only when dialog opens (onOpenChange next=true). Update path keeps same formKey while AccountFormBody stays mounted; remount is not the trigger."
  timestamp: 2026-09-03T00:06:00Z

- hypothesis: "credit-limit Input or Select causes FieldControl warning on edit"
  evidence: "Edit mode renders type/currency/limit as read-only <p>, not Input. Only name Input has defaultValue on edit path. Stack line 139 is name field."
  timestamp: 2026-09-03T00:06:30Z

## Evidence

- timestamp: 2026-09-03T00:01:00Z
  checked: "Phase 0 knowledge base + prior G-02-1 session"
  found: "No knowledge-base.md; currency-uncontrolled-fieldcontrol.md diagnosed identical pattern (defaultValue + revalidatePath while dialog mounted)."
  implication: "Seed G-02-1 as known_pattern_candidate; same class likely."

- timestamp: 2026-09-03T00:02:00Z
  checked: "02-UAT.md G-02-2 + stack"
  found: "Blocker on edit; stack Input:8 → AccountFormBody:139 → AccountFormDialog:309 → AccountList:81"
  implication: "Fault localizes to name Input inside AccountFormBody edit path."

- timestamp: 2026-09-03T00:03:00Z
  checked: "AccountFormDialog.tsx AccountFormBody name field"
  found: "Line 139–147: <Input ... defaultValue={mode === 'edit' ? account?.name : undefined} /> — uncontrolled, defaultValue tied to live prop."
  implication: "Any post-mount change to account.name changes defaultValue → Base UI warning."

- timestamp: 2026-09-03T00:04:00Z
  checked: "updateAccountName in src/app/accounts/actions.ts (codegraph node)"
  found: "On success: revalidatePath('/accounts') then return { success: true }. AccountFormBody useEffect closes dialog only after state.success."
  implication: "RSC refresh can deliver new account.name to still-mounted form before close → defaultValue change."

- timestamp: 2026-09-03T00:05:00Z
  checked: "AccountList.tsx"
  found: "Each row: <AccountFormDialog mode='edit' account={account} /> — account object from server list props."
  implication: "Parent revalidation updates dialog props in place."

- timestamp: 2026-09-03T00:05:30Z
  checked: "codegraph + rg defaultValue in src"
  found: "Only two defaultValue usages: CurrencyFormDialog.tsx:117 and AccountFormDialog.tsx:142 (same pattern; G-02-1 already diagnosed)."
  implication: "Root cause class shared with G-02-1; this session is G-02-2 account only."

- timestamp: 2026-09-03T00:06:00Z
  checked: "Phase 1.25 SBFL"
  found: "Skipped — no automated failing test / per-test coverage for console warning."
  implication: "Proceed with code-path localization (Bohrbug)."

- timestamp: 2026-09-03T00:07:00Z
  checked: "common-bug-patterns State Management"
  found: "Matches dual source of truth / uncontrolled init vs later prop update (stale uncontrolled default)."
  implication: "Pattern supports confirmed hypothesis."

## Resolution

root_cause: "Edit name Input is uncontrolled with defaultValue bound to live account.name; updateAccountName's revalidatePath refreshes AccountList while AccountFormBody still mounted, so defaultValue changes after Base UI FieldControl init."
fix: "Plan 02-05 — controlled mount-init useState name + value/onChange; formKey remount on dialog open; zero defaultValue (AccountFormDialog.tsx)."
verification: "AccountFormDialog.test.ts ACCT-01/G-02-2; 02-UAT.md test 3 FieldControl console silence — pass."
files_changed:
  - src/components/accounts/AccountFormDialog.tsx
  - src/components/accounts/AccountFormDialog.test.ts
oracle_type: "human_uat + unit"

## Specialist Review

specialist_hint: react
skill: typescript-expert
result: "skipped — typescript-expert skill not installed in this environment; same class as G-02-1 (currency-uncontrolled-fieldcontrol)."
suggested_fix_direction: "Make name Input controlled (value + onChange) or freeze initial defaultValue / remount via key so revalidatePath cannot mutate FieldControl default after init; close dialog before list refresh, or avoid binding defaultValue to live server prop."

## Prevention

why_not_caught: "none (no gate existed for Base UI uncontrolled FieldControl defaultValue console warning; SBFL skipped — no automated failing test)"
guard: "After G-02-1/G-02-2: ban defaultValue bound to live server props in edit dialogs; prefer controlled fields or stable key/initial snapshot; optional lint/test for console FieldControl warning on edit+revalidate path"
