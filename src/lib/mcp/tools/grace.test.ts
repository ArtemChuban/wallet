import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  serializeGracePayload,
  type GraceAccountListInput,
} from "@/lib/mcp/reads/load-grace";
import { LIST_GRACE_OBLIGATIONS_DESCRIPTION } from "@/lib/mcp/tools/grace";

const GRACE_MCP_SOURCES = [
  "src/lib/mcp/reads/load-grace.ts",
  "src/lib/mcp/tools/grace.ts",
] as const;

const fixtureAccounts: GraceAccountListInput[] = [
  {
    id: 7,
    name: "Card",
    currencyCode: "RUB",
    currencyScale: 2,
    statementDayOfMonth: 1,
    dueDayOfMonth: 15,
    rows: [
      {
        kind: "open",
        overdue: true,
        obligation: {
          id: 100,
          cycleStartAsOf: "2026-08-01",
          dueAsOf: "2026-08-15",
          amountMinor: 25_000n,
          note: null,
        },
      },
      {
        kind: "cta",
        overdue: false,
        cycleStartAsOf: "2026-09-01",
        dueAsOf: "2026-09-15",
      },
    ],
  },
];

describe("list_grace_obligations (SIDE-03)", () => {
  it("returns OPEN grace rows with kind discriminant + CTA fields", () => {
    const payload = serializeGracePayload({
      today: "2026-09-10",
      accounts: fixtureAccounts,
    });

    expect(payload.today).toBe("2026-09-10");
    expect(payload.accounts).toHaveLength(1);
    const rows = payload.accounts[0]!.rows;
    expect(rows).toHaveLength(2);
    expect(rows[0]!.kind).toBe("open");
    if (rows[0]!.kind === "open") {
      expect(rows[0]!.obligation.amountMinor).toBe("25000");
      expect(rows[0]!.obligation.id).toBe(100);
      expect(rows[0]!.overdue).toBe(true);
    }
    expect(rows[1]!.kind).toBe("cta");
    if (rows[1]!.kind === "cta") {
      expect(rows[1]!.cycleStartAsOf).toBe("2026-09-01");
      expect(rows[1]!.dueAsOf).toBe("2026-09-15");
    }
    expect(payload).not.toHaveProperty("isolation");
    expect(payload).not.toHaveProperty("affectsHistoricalNw");
  });

  it("overdue / due presentation matches credit-grace domain helpers", () => {
    const payload = serializeGracePayload({
      today: "2026-09-10",
      accounts: fixtureAccounts,
    });
    const open = payload.accounts[0]!.rows[0]!;
    expect(open.kind).toBe("open");
    expect(open.overdue).toBe(true);
    const cta = payload.accounts[0]!.rows[1]!;
    expect(cta.kind).toBe("cta");
    expect(cta.overdue).toBe(false);

    const loader = readFileSync(
      resolve(process.cwd(), "src/lib/mcp/reads/load-grace.ts"),
      "utf8",
    );
    expect(loader).toMatch(/mergeGraceListRows/);
    expect(loader).toMatch(/isGraceOverdue/);
    expect(LIST_GRACE_OBLIGATIONS_DESCRIPTION).toMatch(/Side ledger \(Грейс\)/);
    expect(LIST_GRACE_OBLIGATIONS_DESCRIPTION).toMatch(/not historical net worth/);
  });

  it("grace MCP sources never rewrite historical LOCF / BalanceSnapshot", () => {
    for (const file of GRACE_MCP_SOURCES) {
      const src = readFileSync(resolve(process.cwd(), file), "utf8");
      expect(src).not.toMatch(/from ["']@\/app\/.*\/actions["']/);
      expect(src).not.toMatch(/balanceSnapshot\.(create|update|upsert|delete)/);
      expect(src).not.toMatch(/@\/lib\/historical-series/);
      expect(src).not.toMatch(/from ["']\.\/historical-series["']/);
    }
  });
});
