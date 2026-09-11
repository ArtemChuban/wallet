---
schema_version: 1
open_count: 25
waived_count: 0
fixed_count: 5
total_count: 30
last_updated: 2026-09-11T16:23:55.808Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 08 | deviation | src/lib/foundation.test.ts |  | Rule 3: foundation CONTEXT path updated to v1.0 milestones archive | open |  | 2026-09-04T16:11:09.544Z |  |
| 2 | 09 | stub | src/components/debts/DebtsList.tsx |  | NewDebtButton «Новый долг» stub — Plan 03 DebtFormDialog | fixed |  | 2026-09-04T21:31:26.915Z | 2026-09-04T21:42:32.578Z |
| 3 | 09 | stub | src/app/debts/page.tsx |  | Header «Новый долг» Button stub — Plan 03 DebtFormDialog | fixed |  | 2026-09-04T21:31:27.042Z | 2026-09-04T21:42:32.724Z |
| 4 | 09 | stub | src/components/debts/DebtsList.tsx |  | Nested debt rows not rendered when debtCount>0 — Plan 03 | fixed |  | 2026-09-04T21:31:27.170Z | 2026-09-04T21:42:32.871Z |
| 5 | 09 | deviation | src/app/debts/page.tsx |  | Rule 2: debtCount from page for PERSON-02 client gate | open |  | 2026-09-04T21:31:27.301Z |  |
| 6 | 10 | stub | src/components/debts/DebtDetailDialog.tsx |  | History placeholder «Пока нет событий» until Plan 02 timeline | open |  | 2026-09-05T12:05:45.643Z |  |
| 7 | 10 | stub | src/lib/validations/debts.ts |  | deleteSizeChangeSchema only; action in Plan 03 | open |  | 2026-09-05T12:12:37.785Z |  |
| 8 | 10 | stub | src/components/debts/DebtDetailDialog.tsx |  | size-change rows lack delete UI until Plan 03 | open |  | 2026-09-05T12:12:37.927Z |  |
| 9 | 10 | stub | src/components/debts/DebtDetailDialog.tsx |  | Списание label waits Plan 03 isForgive | open |  | 2026-09-05T12:12:38.149Z |  |
| 10 | 17 | stub | src/lib/iniso.test.ts |  | it.todo past-series identity with/without income — Plan 02 | open |  | 2026-09-07T20:27:54.043Z |  |
| 11 | 17 | stub | src/components/dashboard/NetWorthHistoryChart.tsx |  | ReferenceLine today hinge deferred to Plan 03 | open |  | 2026-09-07T20:27:54.165Z |  |
| 12 | 17 | stub | src/components/dashboard/DashboardChartsShell.tsx |  | Partial forecast banner deferred to Plan 03 (D-15) | open |  | 2026-09-07T20:27:54.284Z |  |
| 13 | 17 | skipped-test | src/lib/iniso.test.ts |  | past buildNetWorthSeries golden identity it.todo | open |  | 2026-09-07T20:27:54.406Z |  |
| 14 | 21 | skipped-test | src/components/dashboard/nw-forecast-ui.test.ts |  | Plan 03 tooltip RU describe.skip / it.todo retained for Plan 03 owner | open |  | 2026-09-09T20:35:11.165Z |  |
| 15 | 21 | deviation | src/lib/nw-forecast.ts |  | Rule 2: displayPrimaryMajor on ForecastEvent for D-11 tooltip amounts | open |  | 2026-09-09T20:42:15.926Z |  |
| 16 | 22 | deviation | .planning/REQUIREMENTS.md |  | Task 1 verify-only: GRISO-01 already Complete before 22-02 | fixed |  | 2026-09-09T23:31:30.808Z | 2026-09-09T23:32:32.608Z |
| 17 | 22 | deviation | .planning/ROADMAP.md |  | Rule 3: re-applied Phase 22 Progress Complete after roadmap.update-plan-progress In Progress clobber | fixed |  | 2026-09-09T23:32:45.946Z | 2026-09-09T23:33:19.920Z |
| 18 | 23 | stub | src/lib/mcp/localhost-guard.test.ts | 8 | Wave 0 it.todo Host/Origin/port matrix — Plan 02 greens | open |  | 2026-09-10T13:32:05.374Z |  |
| 19 | 23 | stub | src/app/api/mcp/route.test.ts | 8 | Wave 0 it.todo route smoke mock fetch — Plan 02 greens | open |  | 2026-09-10T13:32:05.494Z |  |
| 20 | 24 | stub | src/lib/mcp/tools/accounts.test.ts |  | Wave 0 it.todo CAP stub until later plan greens | open |  | 2026-09-10T16:04:03.313Z |  |
| 21 | 24 | stub | src/lib/mcp/tools/net-worth.test.ts |  | Wave 0 it.todo CAP stub until later plan greens | open |  | 2026-09-10T16:04:03.433Z |  |
| 22 | 24 | stub | src/lib/mcp/tools/balances.test.ts |  | Wave 0 it.todo CAP stub until later plan greens | open |  | 2026-09-10T16:04:03.553Z |  |
| 23 | 24 | stub | src/lib/mcp/tools/fx.test.ts |  | Wave 0 it.todo CAP stub until later plan greens | open |  | 2026-09-10T16:04:03.667Z |  |
| 24 | 25 | stub | src/lib/mcp/tools/debts.test.ts |  | Wave 0 it.todo stubs for SIDE tool suite — filled by later plans | open |  | 2026-09-10T17:37:00.907Z |  |
| 25 | 25 | stub | src/lib/mcp/tools/income.test.ts |  | Wave 0 it.todo stubs for SIDE tool suite — filled by later plans | open |  | 2026-09-10T17:37:01.029Z |  |
| 26 | 25 | stub | src/lib/mcp/tools/grace.test.ts |  | Wave 0 it.todo stubs for SIDE tool suite — filled by later plans | open |  | 2026-09-10T17:37:01.147Z |  |
| 27 | 25 | stub | src/lib/mcp/tools/forecast.test.ts |  | Wave 0 it.todo stubs for SIDE tool suite — filled by later plans | open |  | 2026-09-10T17:37:01.270Z |  |
| 28 | 27 | stub | src/app/accounts/actions.test.ts |  | describe.skip updateAccount SAVINGS + D-16 — owned by Plan 03 | open |  | 2026-09-11T16:12:25.522Z |  |
| 29 | 27 | skipped-test | src/app/accounts/actions.test.ts |  | it.todo Plan 03 updateAccount SAVINGS name+rate+DOM + D-16 no-snapshot | open |  | 2026-09-11T16:12:25.646Z |  |
| 30 | 27 | todo | src/lib/savings-accrual-display.test.ts | 5 | Wave 0 Plan-04 plant: imports missing savings-accrual-display (tsc error); owned by 27-04 | open |  | 2026-09-11T16:23:55.808Z |  |

````json
[
  {
    "id": 1,
    "kind": "deviation",
    "phase": "08",
    "file": "src/lib/foundation.test.ts",
    "line": null,
    "description": "Rule 3: foundation CONTEXT path updated to v1.0 milestones archive",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-04T16:11:09.544Z",
    "resolved_at": null
  },
  {
    "id": 2,
    "kind": "stub",
    "phase": "09",
    "file": "src/components/debts/DebtsList.tsx",
    "line": null,
    "description": "NewDebtButton «Новый долг» stub — Plan 03 DebtFormDialog",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-04T21:31:26.915Z",
    "resolved_at": "2026-09-04T21:42:32.578Z"
  },
  {
    "id": 3,
    "kind": "stub",
    "phase": "09",
    "file": "src/app/debts/page.tsx",
    "line": null,
    "description": "Header «Новый долг» Button stub — Plan 03 DebtFormDialog",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-04T21:31:27.042Z",
    "resolved_at": "2026-09-04T21:42:32.724Z"
  },
  {
    "id": 4,
    "kind": "stub",
    "phase": "09",
    "file": "src/components/debts/DebtsList.tsx",
    "line": null,
    "description": "Nested debt rows not rendered when debtCount>0 — Plan 03",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-04T21:31:27.170Z",
    "resolved_at": "2026-09-04T21:42:32.871Z"
  },
  {
    "id": 5,
    "kind": "deviation",
    "phase": "09",
    "file": "src/app/debts/page.tsx",
    "line": null,
    "description": "Rule 2: debtCount from page for PERSON-02 client gate",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-04T21:31:27.301Z",
    "resolved_at": null
  },
  {
    "id": 6,
    "kind": "stub",
    "phase": "10",
    "file": "src/components/debts/DebtDetailDialog.tsx",
    "line": null,
    "description": "History placeholder «Пока нет событий» until Plan 02 timeline",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-05T12:05:45.643Z",
    "resolved_at": null
  },
  {
    "id": 7,
    "kind": "stub",
    "phase": "10",
    "file": "src/lib/validations/debts.ts",
    "line": null,
    "description": "deleteSizeChangeSchema only; action in Plan 03",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-05T12:12:37.785Z",
    "resolved_at": null
  },
  {
    "id": 8,
    "kind": "stub",
    "phase": "10",
    "file": "src/components/debts/DebtDetailDialog.tsx",
    "line": null,
    "description": "size-change rows lack delete UI until Plan 03",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-05T12:12:37.927Z",
    "resolved_at": null
  },
  {
    "id": 9,
    "kind": "stub",
    "phase": "10",
    "file": "src/components/debts/DebtDetailDialog.tsx",
    "line": null,
    "description": "Списание label waits Plan 03 isForgive",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-05T12:12:38.149Z",
    "resolved_at": null
  },
  {
    "id": 10,
    "kind": "stub",
    "phase": "17",
    "file": "src/lib/iniso.test.ts",
    "line": null,
    "description": "it.todo past-series identity with/without income — Plan 02",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-07T20:27:54.043Z",
    "resolved_at": null
  },
  {
    "id": 11,
    "kind": "stub",
    "phase": "17",
    "file": "src/components/dashboard/NetWorthHistoryChart.tsx",
    "line": null,
    "description": "ReferenceLine today hinge deferred to Plan 03",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-07T20:27:54.165Z",
    "resolved_at": null
  },
  {
    "id": 12,
    "kind": "stub",
    "phase": "17",
    "file": "src/components/dashboard/DashboardChartsShell.tsx",
    "line": null,
    "description": "Partial forecast banner deferred to Plan 03 (D-15)",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-07T20:27:54.284Z",
    "resolved_at": null
  },
  {
    "id": 13,
    "kind": "skipped-test",
    "phase": "17",
    "file": "src/lib/iniso.test.ts",
    "line": null,
    "description": "past buildNetWorthSeries golden identity it.todo",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-07T20:27:54.406Z",
    "resolved_at": null
  },
  {
    "id": 14,
    "kind": "skipped-test",
    "phase": "21",
    "file": "src/components/dashboard/nw-forecast-ui.test.ts",
    "line": null,
    "description": "Plan 03 tooltip RU describe.skip / it.todo retained for Plan 03 owner",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-09T20:35:11.165Z",
    "resolved_at": null
  },
  {
    "id": 15,
    "kind": "deviation",
    "phase": "21",
    "file": "src/lib/nw-forecast.ts",
    "line": null,
    "description": "Rule 2: displayPrimaryMajor on ForecastEvent for D-11 tooltip amounts",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-09T20:42:15.926Z",
    "resolved_at": null
  },
  {
    "id": 16,
    "kind": "deviation",
    "phase": "22",
    "file": ".planning/REQUIREMENTS.md",
    "line": null,
    "description": "Task 1 verify-only: GRISO-01 already Complete before 22-02",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-09T23:31:30.808Z",
    "resolved_at": "2026-09-09T23:32:32.608Z"
  },
  {
    "id": 17,
    "kind": "deviation",
    "phase": "22",
    "file": ".planning/ROADMAP.md",
    "line": null,
    "description": "Rule 3: re-applied Phase 22 Progress Complete after roadmap.update-plan-progress In Progress clobber",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-09T23:32:45.946Z",
    "resolved_at": "2026-09-09T23:33:19.920Z"
  },
  {
    "id": 18,
    "kind": "stub",
    "phase": "23",
    "file": "src/lib/mcp/localhost-guard.test.ts",
    "line": 8,
    "description": "Wave 0 it.todo Host/Origin/port matrix — Plan 02 greens",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-10T13:32:05.374Z",
    "resolved_at": null
  },
  {
    "id": 19,
    "kind": "stub",
    "phase": "23",
    "file": "src/app/api/mcp/route.test.ts",
    "line": 8,
    "description": "Wave 0 it.todo route smoke mock fetch — Plan 02 greens",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-10T13:32:05.494Z",
    "resolved_at": null
  },
  {
    "id": 20,
    "kind": "stub",
    "phase": "24",
    "file": "src/lib/mcp/tools/accounts.test.ts",
    "line": null,
    "description": "Wave 0 it.todo CAP stub until later plan greens",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-10T16:04:03.313Z",
    "resolved_at": null
  },
  {
    "id": 21,
    "kind": "stub",
    "phase": "24",
    "file": "src/lib/mcp/tools/net-worth.test.ts",
    "line": null,
    "description": "Wave 0 it.todo CAP stub until later plan greens",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-10T16:04:03.433Z",
    "resolved_at": null
  },
  {
    "id": 22,
    "kind": "stub",
    "phase": "24",
    "file": "src/lib/mcp/tools/balances.test.ts",
    "line": null,
    "description": "Wave 0 it.todo CAP stub until later plan greens",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-10T16:04:03.553Z",
    "resolved_at": null
  },
  {
    "id": 23,
    "kind": "stub",
    "phase": "24",
    "file": "src/lib/mcp/tools/fx.test.ts",
    "line": null,
    "description": "Wave 0 it.todo CAP stub until later plan greens",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-10T16:04:03.667Z",
    "resolved_at": null
  },
  {
    "id": 24,
    "kind": "stub",
    "phase": "25",
    "file": "src/lib/mcp/tools/debts.test.ts",
    "line": null,
    "description": "Wave 0 it.todo stubs for SIDE tool suite — filled by later plans",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-10T17:37:00.907Z",
    "resolved_at": null
  },
  {
    "id": 25,
    "kind": "stub",
    "phase": "25",
    "file": "src/lib/mcp/tools/income.test.ts",
    "line": null,
    "description": "Wave 0 it.todo stubs for SIDE tool suite — filled by later plans",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-10T17:37:01.029Z",
    "resolved_at": null
  },
  {
    "id": 26,
    "kind": "stub",
    "phase": "25",
    "file": "src/lib/mcp/tools/grace.test.ts",
    "line": null,
    "description": "Wave 0 it.todo stubs for SIDE tool suite — filled by later plans",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-10T17:37:01.147Z",
    "resolved_at": null
  },
  {
    "id": 27,
    "kind": "stub",
    "phase": "25",
    "file": "src/lib/mcp/tools/forecast.test.ts",
    "line": null,
    "description": "Wave 0 it.todo stubs for SIDE tool suite — filled by later plans",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-10T17:37:01.270Z",
    "resolved_at": null
  },
  {
    "id": 28,
    "kind": "stub",
    "phase": "27",
    "file": "src/app/accounts/actions.test.ts",
    "line": null,
    "description": "describe.skip updateAccount SAVINGS + D-16 — owned by Plan 03",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-11T16:12:25.522Z",
    "resolved_at": null
  },
  {
    "id": 29,
    "kind": "skipped-test",
    "phase": "27",
    "file": "src/app/accounts/actions.test.ts",
    "line": null,
    "description": "it.todo Plan 03 updateAccount SAVINGS name+rate+DOM + D-16 no-snapshot",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-11T16:12:25.646Z",
    "resolved_at": null
  },
  {
    "id": 30,
    "kind": "todo",
    "phase": "27",
    "file": "src/lib/savings-accrual-display.test.ts",
    "line": 5,
    "description": "Wave 0 Plan-04 plant: imports missing savings-accrual-display (tsc error); owned by 27-04",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-11T16:23:55.808Z",
    "resolved_at": null
  }
]
````
