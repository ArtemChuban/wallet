import { describe, expect, it } from "vitest";
import {
  assembleFxRatesPayload,
} from "@/lib/mcp/reads/load-fx-rates-asof";
import { LIST_FX_RATES_DESCRIPTION } from "@/lib/mcp/tools/fx";
import { optionalAsOfSchema, resolveAsOf } from "@/lib/mcp/as-of";

/**
 * CAP-04 list_fx_rates — LOCF transparency only (D-03); no agent convert.
 */
describe("list_fx_rates (CAP-04)", () => {
  it("returns LOCF rates ≤ asOf with rateScale 8 string minors", () => {
    const payload = assembleFxRatesPayload({
      asOf: "2026-09-10",
      primaryCurrencyCode: "RUB",
      currencies: [
        {
          currencyCode: "USD",
          asOfDate: "2026-09-01",
          rateToPrimaryScaled: 90_000_000_00n,
        },
        {
          currencyCode: "EUR",
          asOfDate: null,
          rateToPrimaryScaled: null,
        },
      ],
    });

    expect(payload.asOf).toBe("2026-09-10");
    expect(payload.primaryCurrencyCode).toBe("RUB");
    expect(payload.rateScale).toBe(8);
    expect(payload.rates).toHaveLength(2);
    expect(payload.rates[0]).toEqual({
      currencyCode: "USD",
      asOfDate: "2026-09-01",
      rateToPrimaryScaled: "9000000000",
    });
    expect(typeof payload.rates[0]!.rateToPrimaryScaled).toBe("string");
    expect(payload.rates[1]).toEqual({
      currencyCode: "EUR",
      asOfDate: null,
      rateToPrimaryScaled: null,
    });
  });

  it("optional currencyCode filter narrows rates list", () => {
    const all = assembleFxRatesPayload({
      asOf: "2026-09-10",
      primaryCurrencyCode: "RUB",
      currencies: [
        {
          currencyCode: "USD",
          asOfDate: "2026-09-01",
          rateToPrimaryScaled: 90_000_000_00n,
        },
        {
          currencyCode: "EUR",
          asOfDate: "2026-08-15",
          rateToPrimaryScaled: 100_000_000_00n,
        },
      ],
      currencyCode: "EUR",
    });
    expect(all.rates).toHaveLength(1);
    expect(all.rates[0]!.currencyCode).toBe("EUR");
  });

  it("empty currencies returns success with empty rates array", () => {
    const payload = assembleFxRatesPayload({
      asOf: "2026-09-10",
      primaryCurrencyCode: "RUB",
      currencies: [],
    });
    expect(payload.rates).toEqual([]);
    expect(payload.rateScale).toBe(8);
  });

  it("tool description forbids agent-side conversion", () => {
    expect(LIST_FX_RATES_DESCRIPTION.toLowerCase()).toMatch(/not a (currency )?converter|do not convert|transparency/);
    expect(LIST_FX_RATES_DESCRIPTION.toLowerCase()).toMatch(
      /get_net_worth|get_account_balance/,
    );
  });

  it("omitted asOf defaults via resolveAsOf", () => {
    expect(optionalAsOfSchema.safeParse(undefined).success).toBe(true);
    expect(resolveAsOf("2020-01-15")).toBe("2020-01-15");
    expect(resolveAsOf(undefined)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
