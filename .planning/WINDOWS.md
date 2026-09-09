---
schema_version: 1
open_count: 13
waived_count: 0
fixed_count: 4
total_count: 17
last_updated: 2026-09-09T23:32:45.946Z
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
| 17 | 22 | deviation | .planning/ROADMAP.md |  | Rule 3: re-applied Phase 22 Progress Complete after roadmap.update-plan-progress In Progress clobber | open |  | 2026-09-09T23:32:45.946Z |  |

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
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-09T23:32:45.946Z",
    "resolved_at": null
  }
]
````
