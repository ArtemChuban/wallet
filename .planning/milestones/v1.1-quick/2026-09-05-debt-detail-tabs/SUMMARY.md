---
status: complete
date: 2026-09-05
---

# Quick: DebtDetailDialog tabs

**Date:** 2026-09-05  
**Status:** done

## What

`DebtDetailDialog` — вкладки вместо трёх форм + история в одном столбце.

Tabs: Погашение | Изменение | Простить | История. Одна панель. «Простить» скрыт при remaining 0. Server Actions / confirms без смены API.

## Smoke

Orca `localhost:3000/debts`: tablist, selected Погашение, switch → История без repay form.

## Files

- `src/components/debts/DebtDetailDialog.tsx`
- todo → `.planning/todos/completed/2026-09-05-debt-detail-dialog-tabs-layout.md`
