---
created: 2026-09-05T12:35:50.289Z
title: Integrate local AI agent via subprocess (Claude Code CLI / Cursor agent)
area: general
severity: minor
files: []
audit_acknowledged:
  milestone: v1.1
  at: 2026-09-06
---

## Problem

Хочется интеграции ИИ в приложение: запуск локальной модели/агента (Claude Code CLI или Cursor agent) через subprocess из бэкенда, чтобы у агента был полный доступ к данным приложения (счета, снапшоты, FX, кредитки, зарплата и т.д.) и он мог отвечать в контексте всего wallet-а — например, отвечать на вопросы о финансах, предлагать инсайты.

## Solution

TBD — вероятно: серверный эндпоинт, который спавнит `claude` (или `cursor-agent`) CLI как child process с нужным working directory / context (экспорт данных из SQLite в промпт или через MCP), стримит ответ обратно в UI. Нужно продумать безопасность (локальный процесс, без внешних вызовов) и формат передачи контекста агенту.
