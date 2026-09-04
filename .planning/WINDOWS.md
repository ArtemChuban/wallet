---
schema_version: 1
open_count: 1
waived_count: 0
fixed_count: 0
total_count: 1
last_updated: 2026-09-04T16:11:09.544Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 08 | deviation | src/lib/foundation.test.ts |  | Rule 3: foundation CONTEXT path updated to v1.0 milestones archive | open |  | 2026-09-04T16:11:09.544Z |  |

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
  }
]
````
