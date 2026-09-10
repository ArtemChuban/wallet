completed: 2026-09-10
---
created: 2026-09-05T12:35:50.289Z
title: Integrate local AI agent via subprocess (Claude Code CLI / Cursor agent)
area: general
severity: minor
resolves_phase: 23
files: []
audit_acknowledged:
  milestone: v1.1
  at: 2026-09-06
---

## Closed note (v1.4 Local MCP)

Removed from pending 2026-09-10. Intent absorbed by **v1.4 Local MCP** (Phases 23–26): in-app read-only MCP on localhost; external Claude Code / Cursor CLI connects — app must **not** spawn agent subprocess. HOST-01/02 + CAP/SIDE/CLI/PARITY cover the goal. File stays under `todos/completed/`.

## Problem (original)

Хотелось интеграции ИИ через subprocess из бэкенда с доступом к данным wallet.

## Solution (superseded)

Не subprocess. External CLI → `http://127.0.0.1:3000/api/mcp`.
