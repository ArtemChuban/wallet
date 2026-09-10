import { describe, expect, it } from "vitest";
import type { NetWorthAccountInput } from "@/lib/net-worth";
import { computeNetWorthRows } from "@/lib/net-worth";
import {
  serializeNetWorthPayload,
  type NetWorthAccountMeta,
} from "@/lib/mcp/reads/load-net-worth-asof";
import { optionalAsOfSchema, resolveAsOf } from "@/lib/mcp/as-of";

function input(
  overrides: Partial<NetWorthAccountInput> &
    Pick<NetWorthAccountInput, "id" | "type">,
): NetWorthAccountInput {
  return {
    currencyCode: "RUB",
    currencyScale: 2,
    isPrimaryCurrency: true,
    creditLimitMinor: null,
    locfAmountMinor: 0n,
    rateToPrimaryScaled: null,
    primaryScale: 2,
    ...overrides,
  };
}

function meta(
  accountId: number,
  overrides: Partial<NetWorthAccountMeta> = {},
): NetWorthAccountMeta {
  return {
    accountId,
    accountName: `Account ${accountId}`,
    currencyCode: "RUB",
    type: "ASSET",
    currencyScale: 2,
    ...overrides,
  };
}

describe("get_net_worth (CAP-02)", () => {
  it("returns totalPrimaryMinor string + isPartial + excludeReason rows", () => {
    const fixture = [
      input({ id: 1, type: "ASSET", locfAmountMinor: 100_000n }),
      input({
        id: 2,
        type: "ASSET",
        currencyCode: "USD",
        isPrimaryCurrency: false,
        locfAmountMinor: 50_00n,
        rateToPrimaryScaled: null,
        currencyScale: 2,
      }),
    ];
    const computed = computeNetWorthRows(fixture);
    expect(computed.isPartial).toBe(true);
    expect(computed.rows[1]!.excludeReason).toBe("no_fx");

    const metaByAccountId = new Map<number, NetWorthAccountMeta>([
      [1, meta(1, { accountName: "Cash", type: "ASSET" })],
      [
        2,
        meta(2, {
          accountName: "USD wallet",
          currencyCode: "USD",
          type: "ASSET",
        }),
      ],
    ]);

    const payload = serializeNetWorthPayload({
      asOf: "2026-09-10",
      primaryCurrencyCode: "RUB",
      primaryScale: 2,
      totalPrimaryMinor: computed.totalPrimaryMinor,
      isPartial: computed.isPartial,
      rows: computed.rows,
      metaByAccountId,
    });

    expect(typeof payload.totalPrimaryMinor).toBe("string");
    expect(payload.totalPrimaryMinor).toBe(
      computed.totalPrimaryMinor.toString(),
    );
    expect(payload.isPartial).toBe(computed.isPartial);
    expect(payload.rows[0]!.excludeReason).toBe("none");
    expect(payload.rows[1]!.excludeReason).toBe("no_fx");
    expect(payload.rows[0]!.accountName).toBe("Cash");
    expect(payload.rows[0]!.currencyCode).toBe("RUB");
    expect(payload.rows[0]!.type).toBe("ASSET");
    expect(typeof payload.rows[0]!.contributionPrimaryMinor).toBe("string");
    expect(payload.rows[0]!.primaryScale).toBe(2);
    expect(payload.rows[1]!.nativeDisplayMinor).toBe("5000");
    expect(payload.rows[1]!.primaryDisplayMinor).toBeNull();
  });

  it("matches computeNetWorthRows honesty for same fixture inputs", () => {
    const fixture = [
      input({
        id: 10,
        type: "FIAT_CREDIT",
        creditLimitMinor: 500_000n,
        locfAmountMinor: 300_000n,
      }),
      input({
        id: 11,
        type: "ASSET",
        locfAmountMinor: null,
      }),
    ];
    const computed = computeNetWorthRows(fixture);
    expect(computed.rows[0]!.excludeReason).toBe("none");
    expect(computed.rows[1]!.excludeReason).toBe("no_balance");
    expect(computed.isPartial).toBe(true);

    const payload = serializeNetWorthPayload({
      asOf: "2026-01-01",
      primaryCurrencyCode: "RUB",
      primaryScale: 2,
      totalPrimaryMinor: computed.totalPrimaryMinor,
      isPartial: computed.isPartial,
      rows: computed.rows,
      metaByAccountId: new Map([
        [10, meta(10, { accountName: "Credit", type: "FIAT_CREDIT" })],
        [11, meta(11, { accountName: "Empty", type: "ASSET" })],
      ]),
    });

    expect(payload.isPartial).toBe(true);
    expect(payload.totalPrimaryMinor).toBe("-200000");
    expect(payload.rows.map((r) => r.excludeReason)).toEqual([
      "none",
      "no_balance",
    ]);
    expect(payload.rows[0]!.debtNativeMinor).toBe("200000");
    expect(payload.rows[0]!.contributionPrimaryMinor).toBe("-200000");
  });

  it("omitted asOf defaults via resolveAsOf / calendarDateToday Europe/Moscow", () => {
    expect(optionalAsOfSchema.safeParse(undefined).success).toBe(true);
    expect(optionalAsOfSchema.safeParse("2026-09-10").success).toBe(true);
    expect(optionalAsOfSchema.safeParse("bad").success).toBe(false);

    expect(resolveAsOf("2020-01-15")).toBe("2020-01-15");
    // Omitted → calendarDateToday("Europe/Moscow") YYYY-MM-DD (D-05/D-06)
    expect(resolveAsOf(undefined)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("empty wallet serializes zero total and empty rows (D-07)", () => {
    const computed = computeNetWorthRows([]);
    const payload = serializeNetWorthPayload({
      asOf: "2026-09-10",
      primaryCurrencyCode: "RUB",
      primaryScale: 2,
      totalPrimaryMinor: computed.totalPrimaryMinor,
      isPartial: computed.isPartial,
      rows: computed.rows,
      metaByAccountId: new Map(),
    });
    expect(payload.totalPrimaryMinor).toBe("0");
    expect(payload.isPartial).toBe(false);
    expect(payload.rows).toEqual([]);
  });
});
