import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  serializeIncomeNextOpenPayload,
  serializeIncomeRangePayload,
  type IncomeNextOpenPersonInput,
  type IncomeRangeOccurrenceInput,
} from "@/lib/mcp/reads/load-income";
import { LIST_INCOME_DESCRIPTION } from "@/lib/mcp/tools/income";

const INCOME_MCP_SOURCES = [
  "src/lib/mcp/reads/load-income.ts",
  "src/lib/mcp/tools/income.ts",
] as const;

const fixturePeople: IncomeNextOpenPersonInput[] = [
  {
    id: 1,
    name: "Alice",
    incomes: [
      {
        id: 10,
        kind: "recurring",
        currencyCode: "RUB",
        currencyScale: 2,
        plannedAmountMinor: 100_000n,
        dayOfMonth: 15,
        startAsOf: "2026-01-01",
        plannedAsOf: null,
        note: null,
        nextPlannedAsOf: "2026-08-15",
        hasActual: false,
        overdue: true,
        actualId: undefined,
        actualAmountMinor: undefined,
        actualAsOf: undefined,
        actualNote: null,
      },
      {
        id: 11,
        kind: "oneTime",
        currencyCode: "RUB",
        currencyScale: 2,
        plannedAmountMinor: 50_000n,
        dayOfMonth: null,
        startAsOf: null,
        plannedAsOf: "2026-10-01",
        note: "bonus",
        nextPlannedAsOf: "2026-10-01",
        hasActual: false,
        overdue: false,
        actualId: undefined,
        actualAmountMinor: undefined,
        actualAsOf: undefined,
        actualNote: null,
      },
    ],
  },
];

const fixtureOccurrences: IncomeRangeOccurrenceInput[] = [
  {
    kind: "recurring",
    parentId: 10,
    personId: 1,
    personName: "Alice",
    currencyCode: "RUB",
    currencyScale: 2,
    plannedAsOf: "2026-08-15",
    plannedAmountMinor: 100_000n,
    hasActual: false,
    overdue: true,
  },
  {
    kind: "oneTime",
    parentId: 11,
    personId: 1,
    personName: "Alice",
    currencyCode: "RUB",
    currencyScale: 2,
    plannedAsOf: "2026-09-01",
    plannedAmountMinor: 50_000n,
    hasActual: true,
    overdue: false,
    actualAmountMinor: 48_000n,
    actualAsOf: "2026-09-02",
  },
];

describe("list_income (SIDE-02)", () => {
  it("returns plan/actual/overdue flags with string minors (page-parity default)", () => {
    const payload = serializeIncomeNextOpenPayload({
      today: "2026-09-10",
      people: fixturePeople,
    });

    expect(payload.mode).toBe("next_open");
    expect(payload.today).toBe("2026-09-10");
    expect(payload.people).toHaveLength(1);
    const rows = payload.people[0]!.incomes;
    expect(rows).toHaveLength(2);
    expect(rows[0]!.plannedAmountMinor).toBe("100000");
    expect(rows[0]!.nextPlannedAsOf).toBe("2026-08-15");
    expect(rows[0]!.hasActual).toBe(false);
    expect(rows[0]!.overdue).toBe(true);
    expect(rows[0]!.currencyScale).toBe(2);
    expect(rows[1]!.kind).toBe("oneTime");
    expect(rows[1]!.plannedAsOf).toBe("2026-10-01");
    expect(payload).not.toHaveProperty("isolation");
    expect(payload).not.toHaveProperty("affectsHistoricalNw");
  });

  it("optional paired from+to dumps listAllInRange occurrences with overdue", () => {
    const payload = serializeIncomeRangePayload({
      today: "2026-09-10",
      from: "2026-08-01",
      to: "2026-09-30",
      occurrences: fixtureOccurrences,
    });

    expect(payload.mode).toBe("range");
    expect(payload.from).toBe("2026-08-01");
    expect(payload.to).toBe("2026-09-30");
    expect(payload.occurrences).toHaveLength(2);
    expect(payload.occurrences[0]!.plannedAmountMinor).toBe("100000");
    expect(payload.occurrences[0]!.overdue).toBe(true);
    expect(payload.occurrences[0]!.hasActual).toBe(false);
    expect(payload.occurrences[1]!.hasActual).toBe(true);
    expect(payload.occurrences[1]!.actualAmountMinor).toBe("48000");
    expect(payload.occurrences[1]!.overdue).toBe(false);
    expect(payload).not.toHaveProperty("isolation");
  });

  it("income MCP sources never write BalanceSnapshot / historical LOCF", () => {
    expect(LIST_INCOME_DESCRIPTION).toMatch(/INISO-01/);
    expect(LIST_INCOME_DESCRIPTION).toMatch(/do not fold/);
    expect(LIST_INCOME_DESCRIPTION).toMatch(/historical NW|historical net worth/);
    const loader = readFileSync(
      resolve(process.cwd(), "src/lib/mcp/reads/load-income.ts"),
      "utf8",
    );
    expect(loader).toMatch(/nextOpenPlannedAsOf/);
    expect(loader).toMatch(/isIncomeOverdue/);
    expect(loader).toMatch(/listAllInRange/);
    for (const file of INCOME_MCP_SOURCES) {
      const src = readFileSync(resolve(process.cwd(), file), "utf8");
      expect(src).not.toMatch(/from ["']@\/app\/.*\/actions["']/);
      expect(src).not.toMatch(/balanceSnapshot\.(create|update|upsert|delete)/);
      expect(src).not.toMatch(/@\/lib\/historical-series/);
    }
  });

  it("list_income uses optionalIncomeRangeSchema as inputSchema (no $ZodIssue→addIssue forward)", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/lib/mcp/tools/income.ts"),
      "utf8",
    );
    expect(src).toMatch(/inputSchema:\s*optionalIncomeRangeSchema/);
    expect(src).not.toMatch(/ctx\.addIssue\(\s*issue\s*\)/);
    expect(src).not.toMatch(/parsed\.error\.issues/);
  });
});
