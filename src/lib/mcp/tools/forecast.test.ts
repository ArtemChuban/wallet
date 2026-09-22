import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { addCalendarDays } from "@/lib/dates";
import {
  resolveForecastHorizonEnd,
  serializeForecastPayload,
} from "@/lib/mcp/reads/load-forecast-overlay";
import { buildNetWorthForecastSeries } from "@/lib/nw-forecast";
import { GET_FORECAST_OVERLAY_DESCRIPTION } from "@/lib/mcp/tools/forecast";

const FORECAST_SOURCES = [
  "src/lib/mcp/reads/load-forecast-overlay.ts",
  "src/lib/mcp/tools/forecast.ts",
] as const;

/** Retired Phase 25 «A′» grace-line mark — must not appear in MCP copy (D-10, D-11). */
const RETIRED_GRACE_LINE_MARK = "A′";

describe("get_forecast_overlay (SIDE-04 / MCP-02)", () => {
  it("returns sparse forecast points matching buildNetWorthForecastSeries shape", () => {
    const today = "2026-09-10";
    const horizonEnd = addCalendarDays(today, 365);
    const built = buildNetWorthForecastSeries({
      anchorPrimaryMinor: 1_000_000n,
      slots: [
        {
          kind: "income",
          parentId: 1,
          plannedAsOf: "2026-10-01",
          plannedAmountMinor: 50_000n,
          currencyCode: "RUB",
          currencyScale: 2,
          isPrimaryCurrency: true,
        },
        {
          kind: "grace",
          parentId: 2,
          plannedAsOf: "2026-10-15",
          plannedAmountMinor: 10_000n,
          currencyCode: "RUB",
          currencyScale: 2,
          isPrimaryCurrency: true,
          accountId: 7,
          accountName: "Card",
          dueAsOf: "2026-10-15",
        },
      ],
      rates: [],
      primaryScale: 2,
      today,
      horizonEnd,
    });

    const payload = serializeForecastPayload(built, {
      today,
      horizonEnd,
      anchorPrimaryMinor: 1_000_000n,
      primaryScale: 2,
      primaryCurrencyCode: "RUB",
    });

    expect(payload.points.length).toBeGreaterThan(0);
    for (const p of payload.points) {
      expect(typeof p.asOfDate).toBe("string");
      expect(typeof p.forecastPrimaryMinor).toBe("string");
      expect(typeof p.forecast).toBe("number");
    }
    expect(payload.anchorPrimaryMinor).toBe("1000000");
    expect(payload.isPartialForecast).toBe(built.isPartialForecast);
    expect(payload.includedSlotCount).toBe(built.includedSlotCount);
    expect(payload).not.toHaveProperty("isolation");
    expect(payload).not.toHaveProperty("affectsHistoricalNw");
  });

  it("includes income + interest + grace forecastEvents (D-01, D-03, D-07)", () => {
    const today = "2026-09-10";
    const horizonEnd = "2026-12-31";
    const built = buildNetWorthForecastSeries({
      anchorPrimaryMinor: 500_000n,
      slots: [
        {
          kind: "income",
          parentId: 11,
          plannedAsOf: "2026-10-01",
          plannedAmountMinor: 25_000n,
          currencyCode: "RUB",
          currencyScale: 2,
          isPrimaryCurrency: true,
        },
        {
          kind: "interest",
          parentId: 42,
          plannedAsOf: "2026-10-15",
          plannedAmountMinor: 1_375n,
          currencyCode: "RUB",
          currencyScale: 2,
          isPrimaryCurrency: true,
          accountId: 42,
          accountName: "Накопительный",
        },
        {
          kind: "grace",
          parentId: 22,
          plannedAsOf: "2026-10-05",
          plannedAmountMinor: 8_000n,
          currencyCode: "RUB",
          currencyScale: 2,
          isPrimaryCurrency: true,
          accountId: 3,
          accountName: "Credit",
          dueAsOf: "2026-10-05",
        },
      ],
      rates: [],
      primaryScale: 2,
      today,
      horizonEnd,
    });

    const payload = serializeForecastPayload(built, {
      today,
      horizonEnd,
      anchorPrimaryMinor: 500_000n,
      primaryScale: 2,
      primaryCurrencyCode: "RUB",
    });

    const kinds = payload.points.flatMap(
      (p) => p.forecastEvents?.map((e) => e.kind) ?? [],
    );
    expect(kinds).toContain("income");
    expect(kinds).toContain("interest");
    expect(kinds).toContain("grace");

    const incomeEv = payload.points
      .flatMap((p) => p.forecastEvents ?? [])
      .find((e) => e.kind === "income");
    expect(incomeEv?.plannedAmountMinor).toBe("25000");
    expect(typeof incomeEv?.displayPrimaryMajor).toBe("number");

    const interestEv = payload.points
      .flatMap((p) => p.forecastEvents ?? [])
      .find((e) => e.kind === "interest");
    expect(interestEv?.kind).toBe("interest");
    expect(interestEv?.parentId).toBe(42);
    expect(interestEv?.plannedAmountMinor).toBe("1375");
    expect(typeof interestEv?.plannedAmountMinor).toBe("string");
    expect(typeof interestEv?.displayPrimaryMajor).toBe("number");
    expect(interestEv?.currencyCode).toBe("RUB");
    expect(interestEv?.accountId).toBe(42);
    expect(interestEv?.accountName).toBe("Накопительный");
    expect(interestEv).not.toHaveProperty("annualRateBps");
    expect(interestEv).not.toHaveProperty("annualRatePercent");
    expect(interestEv).not.toHaveProperty("accrualDayOfMonth");

    const graceEv = payload.points
      .flatMap((p) => p.forecastEvents ?? [])
      .find((e) => e.kind === "grace");
    expect(graceEv?.plannedAmountMinor).toBe("8000");
    expect(graceEv?.accountName).toBe("Credit");
  });

  it("omitted horizonEnd defaults to today+365 (D-04); UI-parity keys only", () => {
    const today = "2026-09-10";
    expect(resolveForecastHorizonEnd(today)).toBe(addCalendarDays(today, 365));
    expect(resolveForecastHorizonEnd(today, "2026-10-10")).toBe("2026-10-10");

    const built = buildNetWorthForecastSeries({
      anchorPrimaryMinor: 100n,
      slots: [],
      rates: [],
      primaryScale: 2,
      today,
      horizonEnd: resolveForecastHorizonEnd(today),
    });
    const payload = serializeForecastPayload(built, {
      today,
      horizonEnd: resolveForecastHorizonEnd(today),
      anchorPrimaryMinor: 100n,
      primaryScale: 2,
      primaryCurrencyCode: "RUB",
    });

    expect(payload.horizonEnd).toBe(addCalendarDays(today, 365));
    expect(payload.includedSlotCount).toBe(0);
    expect(Object.keys(payload).sort()).toEqual(
      [
        "anchorPrimaryMinor",
        "excludedMissingFxCount",
        "excludedMissingFxCurrencies",
        "horizonEnd",
        "includedSlotCount",
        "isPartialForecast",
        "points",
        "primaryCurrencyCode",
        "primaryScale",
        "today",
      ].sort(),
    );
  });

  it("forecast MCP sources never write BalanceSnapshot or import app actions (D-05)", () => {
    for (const file of FORECAST_SOURCES) {
      const src = readFileSync(resolve(process.cwd(), file), "utf8");
      expect(src).not.toMatch(/balanceSnapshot\.(create|update|upsert|delete)/);
      expect(src).not.toMatch(/from ["']@\/app\/.*\/actions["']/);
      expect(src).not.toMatch(
        /from ["']@\/lib\/(?:historical-series|nw-series)["']|buildNetWorthSeries\s*\(/,
      );
    }
  });

  it("GET_FORECAST_OVERLAY_DESCRIPTION uses triple tag + income/interest/grace (D-09…D-11)", () => {
    expect(GET_FORECAST_OVERLAY_DESCRIPTION).toMatch(/INISO-01/);
    expect(GET_FORECAST_OVERLAY_DESCRIPTION).toMatch(/GRISO-01/);
    expect(GET_FORECAST_OVERLAY_DESCRIPTION).toMatch(/SAVISO-01/);
    expect(GET_FORECAST_OVERLAY_DESCRIPTION).toMatch(
      /INISO-01\/GRISO-01\/SAVISO-01/,
    );
    expect(GET_FORECAST_OVERLAY_DESCRIPTION).toMatch(/income \+ interest \+ grace/);
    expect(GET_FORECAST_OVERLAY_DESCRIPTION).toMatch(/do not fold/);
    expect(GET_FORECAST_OVERLAY_DESCRIPTION).toMatch(/historical NW LOCF/);
    expect(GET_FORECAST_OVERLAY_DESCRIPTION).toMatch(/Прогноз/);
    expect(GET_FORECAST_OVERLAY_DESCRIPTION).not.toMatch(
      new RegExp(RETIRED_GRACE_LINE_MARK),
    );
  });

  it("load-forecast-overlay wires listInterestSlotsInRange before grace (D-05)", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/lib/mcp/reads/load-forecast-overlay.ts"),
      "utf8",
    );
    expect(src).toMatch(/listInterestSlotsInRange/);
    expect(src).toMatch(
      /slots:\s*\[\s*\.\.\.openSlots\s*,\s*\.\.\.interestSlots\s*,\s*\.\.\.graceSlots\s*\]/,
    );
    expect(src).not.toMatch(/balanceSnapshot\.(create|update|upsert|delete)/);
    expect(src).toMatch(/type:\s*"SAVINGS"/);
    expect(src).toMatch(/firstHitLocfMap/);
  });
});
