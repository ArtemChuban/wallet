---
created: 2026-09-05T12:35:50.289Z
title: Add timezone selection to settings
area: general
severity: minor
files: []
audit_acknowledged:
  milestone: v1.1
  at: 2026-09-06
---

## Problem

Приложение пока не даёт выбрать часовой пояс пользователя. Нужна страница/раздел настроек с выбором timezone, который влияет на отображение дат (снапшоты, графики, дата выписки по кредитке и т.д.).

## Solution

TBD — вероятно: новая настройка `timezone` в конфиге пользователя (single-user, локально), UI-селектор в разделе "Настройки", применение при рендере дат на фронте (date-fns + tz).
