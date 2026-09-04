---
status: resolved
trigger: "G-02-1-currency-uncontrolled-fieldcontrol — Editing/updating a currency form triggers Base UI console error: uncontrolled FieldControl default value state change after init (CurrencyFormDialog / CurrencyFormBody / Input)."
created: 2026-09-03T00:00:00Z
updated: 2026-09-04T13:00:00Z
symptoms_prefilled: true
goal: find_root_cause_only
---

## Current Focus

hypothesis: "CurrencyFormBody name Input uses uncontrolled defaultValue={currency?.name}; after updateCurrencyName, revalidatePath refreshes list while dialog still mounted, so defaultValue prop changes after Base UI FieldControl init → console warning."
bug_class: bohrbug
test: "Trace edit Input props + updateCurrencyName revalidate + dialog close timing; confirm defaultValue is only Input with changing prop."
expecting: "Stack points at CurrencyFormBody:114; update path revalidates /currencies before useEffect closes dialog."
next_action: "Diagnose-only session complete — DEBUG SESSION COMPLETE emitted; no fix by this session."
known_pattern_candidate: none (no knowledge-base.md)

candidate_causes:
  - "code: defaultValue bound to live currency.name prop (uncontrolled FieldControl)"
  - "data: revalidatePath('/currencies') pushes updated currency into still-open CurrencyFormDialog"
and_gate: "yes — warning needs both uncontrolled defaultValue AND that prop changing after mount; either alone insufficient"

## Symptoms

expected: RUB primary visible; create persists; only name editable after create; Russian chrome matches UI-SPEC; no removal / no primary switch — without console errors when editing currencies
actual: После обновления Console Error: Base UI: A component is changing the default value state of an uncontrolled FieldControl after being initialized. To suppress this warning opt to use a controlled FieldControl. at Input → CurrencyFormBody → CurrencyFormDialog → CurrencyList
errors: Base UI: A component is changing the default value state of an uncontrolled FieldControl after being initialized. To suppress this warning opt to use a controlled FieldControl. (Next.js 16.3.4 Turbopack) Stack: Input (src/components/ui/input.tsx:8:5) → CurrencyFormBody (src/components/currencies/CurrencyFormDialog.tsx:114:9) → CurrencyFormDialog (CurrencyFormDialog.tsx:209:11) → CurrencyList.tsx:50
reproduction: Test 1 in UAT — open currency edit/update flow after values load or change
started: Discovered during UAT phase 02

## Eliminated

- hypothesis: "Input wrapper (input.tsx) incorrectly forces uncontrolled FieldControl"
  evidence: "input.tsx only forwards props to @base-ui/react/input InputPrimitive; no defaultValue of its own. Warning originates from caller-supplied defaultValue."
  timestamp: 2026-09-03T00:03:00Z

- hypothesis: "formKey remount on open incorrectly resets defaultValue mid-session"
  evidence: "formKey increments only when dialog opens (onOpenChange next=true). Update path keeps same formKey while CurrencyFormBody stays mounted; remount is not the trigger."
  timestamp: 2026-09-03T00:04:00Z

## Evidence

- timestamp: 2026-09-03T00:01:00Z
  checked: "Phase 0 knowledge base"
  found: "No .planning/debug/knowledge-base.md"
  implication: "No prior pattern to seed; investigate from code."

- timestamp: 2026-09-03T00:01:30Z
  checked: "02-UAT.md G-02-1 + stack"
  found: "Blocker on edit/update; stack Input:8 → CurrencyFormBody:114 → CurrencyFormDialog:209 → CurrencyList:50"
  implication: "Fault localizes to name Input inside CurrencyFormBody edit path."

- timestamp: 2026-09-03T00:02:00Z
  checked: "CurrencyFormDialog.tsx CurrencyFormBody name field"
  found: "Line 114–122: <Input ... defaultValue={mode === 'edit' ? currency?.name : undefined} /> — uncontrolled, defaultValue tied to live prop."
  implication: "Any post-mount change to currency.name changes defaultValue → Base UI warning."

- timestamp: 2026-09-03T00:02:30Z
  checked: "updateCurrencyName in src/app/currencies/actions.ts"
  found: "On success: revalidatePath('/currencies') then return { success: true }. CurrencyFormBody useEffect closes dialog only after state.success."
  implication: "RSC refresh can deliver new currency.name to still-mounted form before close → defaultValue change."

- timestamp: 2026-09-03T00:03:00Z
  checked: "CurrencyList.tsx"
  found: "Each row: <CurrencyFormDialog mode='edit' currency={currency} /> — currency object from server list props."
  implication: "Parent revalidation updates dialog props in place."

- timestamp: 2026-09-03T00:03:30Z
  checked: "codegraph + rg defaultValue in src"
  found: "Only two defaultValue usages: CurrencyFormDialog.tsx:117 and AccountFormDialog.tsx:142 (same pattern; G-02-2)."
  implication: "Root cause class is shared; this session is G-02-1 currency only."

- timestamp: 2026-09-03T00:04:00Z
  checked: "Phase 1.25 SBFL"
  found: "Skipped — no automated failing test / per-test coverage for console warning."
  implication: "Proceed with code-path localization (Bohrbug)."

- timestamp: 2026-09-03T00:04:30Z
  checked: "common-bug-patterns State Management"
  found: "Matches dual source of truth / uncontrolled init vs later prop update (stale uncontrolled default)."
  implication: "Pattern supports confirmed hypothesis."

- timestamp: 2026-09-04T14:32:00Z
  checked: "Resume verify CurrencyFormDialog.tsx + CurrencyFormDialog.test.ts"
  found: "Tree now uses useState(name)+value/onChange; zero defaultValue; regression test CURR-01/G-02-1 asserts controlled binding. revalidatePath('/currencies') still present in updateCurrencyName."
  implication: "Diagnosed root cause still correct for UAT failure; codebase already moved to suggested controlled pattern (outside this diagnose-only session)."

## Resolution

root_cause: "Edit name Input is uncontrolled with defaultValue bound to live currency.name; updateCurrencyName's revalidatePath refreshes CurrencyList while CurrencyFormBody still mounted, so defaultValue changes after Base UI FieldControl init."
fix: "Plan 02-05 — controlled mount-init useState name + value/onChange; formKey remount on dialog open; zero defaultValue (CurrencyFormDialog.tsx)."
verification: "CurrencyFormDialog.test.ts CURR-01/G-02-1; 02-UAT.md test 3 FieldControl console silence — pass."
files_changed:
  - src/components/currencies/CurrencyFormDialog.tsx
  - src/components/currencies/CurrencyFormDialog.test.ts
oracle_type: "human_uat + unit"
specialist_hint: react

## Prevention

why_not_caught: "none (no gate existed for uncontrolled defaultValue + revalidate race on edit dialogs)"
recurrence_guard: "CurrencyFormDialog.test.ts CURR-01/G-02-1 asserts controlled name binding (value/onChange, no defaultValue) — already present outside this session"
why: "code: defaultValue tied to live prop; data: revalidatePath updates still-open dialog — AND-gate both required for warning"
