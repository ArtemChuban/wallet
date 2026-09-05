---
schema_version: 1
open_count: 3
waived_count: 0
fixed_count: 3
total_count: 6
last_updated: 2026-09-05T12:05:45.643Z
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
  }
]
````
