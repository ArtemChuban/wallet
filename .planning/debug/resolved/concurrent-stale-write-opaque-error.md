---
status: resolved
trigger: "10-UAT #5 Optional concurrency smoke — opaque after peer-tab delete then stale write"
created: 2026-09-05T13:20:00Z
updated: 2026-09-07T00:50:00Z
gap_id: G-10-5
symptoms_prefilled: true
---

# DEBUG: concurrent stale write opaque error

## Symptom

- **Test:** 10-UAT #5 Optional concurrency smoke
- **Reported:** «Не удалось сохранить. Проверьте поля и попробуйте снова.» after deleting in one tab then trying to write off / repay part of debt in another
- **Severity:** major
- **gap_id:** G-10-5

## Root Cause

Unmapped P2025 / assertSizeDelta collapsed to opaque catch-all; forgive client ignored deltaMajor (G-10-8).

## Resolution

root_cause: "Unmapped P2025 / assertSizeDelta in debt event actions collapsed to opaque catch-all"
fix: "10-04 P2025 map; 2026-09-07 forgive UI resolveForgiveActionError + message+errors on OVER_FLOOR/DELTA_ZERO"
verification: "vitest actions G-10-5 + forgive-action-error.test.ts — passed 2026-09-07"
files_changed:
  - src/app/debts/actions.ts
  - src/components/debts/DebtDetailDialog.tsx
  - src/components/debts/forgive-action-error.ts
oracle_type: derived
confidence: high

## Status

- **Status:** resolved
- **Resolved:** 2026-09-07T00:50:00Z
