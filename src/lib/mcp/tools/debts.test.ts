import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  filterDebtsForList,
  serializeDebtsPayload,
  type DebtListPersonInput,
} from "@/lib/mcp/reads/load-debts";
import {
  serializeNetWorthPayload,
  type NetWorthAccountMeta,
} from "@/lib/mcp/reads/load-net-worth-asof";
import { LIST_DEBTS_DESCRIPTION } from "@/lib/mcp/tools/debts";
import { computeNetWorthRows, type NetWorthAccountInput } from "@/lib/net-worth";

const DEBTS_MCP_SOURCES = [
  "src/lib/mcp/reads/load-debts.ts",
  "src/lib/mcp/tools/debts.ts",
] as const;

const fixturePeople: DebtListPersonInput[] = [
  {
    id: 1,
    name: "Alice",
    debts: [
      {
        id: 10,
        direction: "I_OWE",
        currencyCode: "RUB",
        currencyScale: 2,
        initialAmountMinor: 100_000n,
        openedAsOf: "2026-01-01",
        remainingMinor: 80_000n,
        status: "OPEN",
        dueDate: "2026-12-01",
        note: null,
      },
      {
        id: 11,
        direction: "THEY_OWE",
        currencyCode: "RUB",
        currencyScale: 2,
        initialAmountMinor: 50_000n,
        openedAsOf: "2026-02-01",
        remainingMinor: 0n,
        status: "CLOSED",
        dueDate: null,
        note: "done",
      },
    ],
  },
];

describe("list_debts (SIDE-01)", () => {
  it("returns debt rows with remaining/totals as string minors + scale", () => {
    const openPeople = filterDebtsForList(fixturePeople, false);
    const payload = serializeDebtsPayload({
      today: "2026-09-10",
      includeClosed: false,
      primaryCurrencyCode: "RUB",
      primaryScale: 2,
      people: openPeople,
      totals: {
        iOwePrimaryMinor: 80_000n,
        theyOwePrimaryMinor: 0n,
        isPartial: false,
        rows: [
          {
            debtId: 10,
            direction: "I_OWE",
            includedInTotal: true,
            excludeReason: "none",
            contributionPrimaryMinor: 80_000n,
            remainingNativeMinor: 80_000n,
          },
        ],
      },
    });

    expect(payload.people[0]!.debts).toHaveLength(1);
    const row = payload.people[0]!.debts[0]!;
    expect(row.remainingMinor).toBe("80000");
    expect(row.initialAmountMinor).toBe("100000");
    expect(row.currencyScale).toBe(2);
    expect(typeof payload.totals.iOwePrimaryMinor).toBe("string");
    expect(payload.totals.iOwePrimaryMinor).toBe("80000");
    expect(payload.totals.theyOwePrimaryMinor).toBe("0");
    expect(payload.totals.isPartial).toBe(false);
    expect(payload.totals.rows[0]!.contributionPrimaryMinor).toBe("80000");
    expect(payload).not.toHaveProperty("isolation");
    expect(payload).not.toHaveProperty("affectsHistoricalNw");
  });

  it("defaults to OPEN debts; includeClosed optional widen", () => {
    const openOnly = filterDebtsForList(fixturePeople, false);
    expect(openOnly[0]!.debts.map((d) => d.id)).toEqual([10]);
    expect(openOnly[0]!.debts.every((d) => d.status !== "CLOSED")).toBe(true);

    const withClosed = filterDebtsForList(fixturePeople, true);
    expect(withClosed[0]!.debts.map((d) => d.id)).toEqual([10, 11]);

    const openPayload = serializeDebtsPayload({
      today: "2026-09-10",
      includeClosed: false,
      primaryCurrencyCode: "RUB",
      primaryScale: 2,
      people: openOnly,
      totals: {
        iOwePrimaryMinor: 80_000n,
        theyOwePrimaryMinor: 0n,
        isPartial: false,
        rows: [],
      },
    });
    expect(openPayload.includeClosed).toBe(false);
    expect(openPayload.people[0]!.debts).toHaveLength(1);

    const closedPayload = serializeDebtsPayload({
      today: "2026-09-10",
      includeClosed: true,
      primaryCurrencyCode: "RUB",
      primaryScale: 2,
      people: withClosed,
      totals: {
        iOwePrimaryMinor: 80_000n,
        theyOwePrimaryMinor: 0n,
        isPartial: false,
        rows: [],
      },
    });
    expect(closedPayload.includeClosed).toBe(true);
    expect(closedPayload.people[0]!.debts).toHaveLength(2);
  });

  it("NW / CAP payloads never include debt-ledger fields (DISOL contract)", () => {
    const fixture: NetWorthAccountInput[] = [
      {
        id: 1,
        type: "ASSET",
        currencyCode: "RUB",
        currencyScale: 2,
        isPrimaryCurrency: true,
        creditLimitMinor: null,
        locfAmountMinor: 100_000n,
        rateToPrimaryScaled: null,
        primaryScale: 2,
      },
    ];
    const computed = computeNetWorthRows(fixture);
    const metaByAccountId = new Map<number, NetWorthAccountMeta>([
      [
        1,
        {
          accountId: 1,
          accountName: "Cash",
          currencyCode: "RUB",
          type: "ASSET",
          currencyScale: 2,
        },
      ],
    ]);
    const nw = serializeNetWorthPayload({
      asOf: "2026-09-10",
      primaryCurrencyCode: "RUB",
      primaryScale: 2,
      totalPrimaryMinor: computed.totalPrimaryMinor,
      isPartial: computed.isPartial,
      rows: computed.rows,
      metaByAccountId,
    });

    const topKeys = Object.keys(nw);
    expect(topKeys).not.toContain("iOwePrimaryMinor");
    expect(topKeys).not.toContain("theyOwePrimaryMinor");
    expect(topKeys).not.toContain("people");
    expect(topKeys).not.toContain("debts");
    expect(JSON.stringify(nw)).not.toMatch(/iOwePrimaryMinor|theyOwePrimaryMinor/);
    // Credit-card debtNativeMinor is accounts CAP — not Долги ledger.
    expect(nw.rows[0]).toHaveProperty("debtNativeMinor");
  });

  it("list_debts description has D-08 side-ledger one-liner; loader uses domain totals", () => {
    expect(LIST_DEBTS_DESCRIPTION).toMatch(/Side ledger \(Долги\)/);
    expect(LIST_DEBTS_DESCRIPTION).toMatch(/not historical net worth/);
    const loader = readFileSync(
      resolve(process.cwd(), "src/lib/mcp/reads/load-debts.ts"),
      "utf8",
    );
    expect(loader).toMatch(/computeDebtPrimaryTotals/);
    expect(loader).toMatch(/remainingMinor/);
    for (const file of DEBTS_MCP_SOURCES) {
      const src = readFileSync(resolve(process.cwd(), file), "utf8");
      expect(src).not.toMatch(/from ["']@\/app\/.*\/actions["']/);
      expect(src).not.toMatch(/balanceSnapshot\.(create|update|upsert|delete)/);
    }
  });
});
