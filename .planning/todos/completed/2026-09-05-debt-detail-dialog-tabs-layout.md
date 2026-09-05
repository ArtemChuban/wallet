---
created: 2026-09-05T18:00:00.000Z
title: DebtDetailDialog tabs layout (variant 1)
area: ui
priority: major
files:
  - src/components/debts/DebtDetailDialog.tsx
---

## Problem

Модалка деталей долга перегружена: три формы + история в одном столбце. Пользователь выбрал редизайн **вариант 1 — вкладки**.

## Solution

Перестроить `DebtDetailDialog`:
- Табы: «Погашение» | «Изменение» | «Простить» | «История»
- Одна панель за раз; сохранять текущие Server Actions / confirms
- Референс: `.planning/phases/10-repayments-close-write-off/debt-detail-variants-mock.html` (и `/tmp/wallet-debt-detail-variants.html`)
- Решение зафиксировано в PROJECT.md Key Decisions (2026-09-05)

## Notes

Делать после закрытия G-10-5 (`/gsd-execute-phase 10 --gaps-only`) или отдельным `/gsd-quick` / UI phase — по выбору оператора.
