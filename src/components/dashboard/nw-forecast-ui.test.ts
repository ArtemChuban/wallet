import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const chartSrc = readFileSync(
  "src/components/dashboard/NetWorthHistoryChart.tsx",
  "utf8",
);
const shellSrc = readFileSync(
  "src/components/dashboard/DashboardChartsShell.tsx",
  "utf8",
);

/** Wave 0 chart file-scan — full chrome greens in Plan 03; tracer may partially satisfy. */
describe("forecast chart chrome file-scan", () => {
  it("NetWorthHistoryChart uses ComposedChart (D-09)", () => {
    expect(chartSrc).toMatch(/ComposedChart/);
  });

  it("forecast Line uses strokeDasharray (D-09)", () => {
    expect(chartSrc).toMatch(/strokeDasharray/);
  });

  it("legend/series name includes Прогноз (D-10)", () => {
    expect(chartSrc).toMatch(/Прогноз/);
  });

  it("ReferenceLine marks today hinge (D-12) — Plan 03", () => {
    expect(chartSrc).toMatch(/ReferenceLine/);
    expect(chartSrc).toMatch(/stroke=["']var\(--border\)["']/);
  });

  it("tooltip fact branch keeps Итого; future branch uses Прогноз only (D-11)", () => {
    expect(chartSrc).toMatch(/Итого/);
    // Future tooltip must gate on asOfDate vs today — no fake stack
    expect(chartSrc).toMatch(/asOfDate\s*>\s*today|today\s*<\s*.*asOfDate/);
  });

  it("DashboardChartsShell wires forecastHorizonEnd or buildNetWorthForecastSeries", () => {
    expect(shellSrc).toMatch(
      /forecastHorizonEnd|buildNetWorthForecastSeries/,
    );
  });

  it("partial banner Прогноз неполный · нет курса with role=status (D-15)", () => {
    expect(shellSrc).toMatch(/Прогноз неполный/);
    expect(shellSrc).toMatch(/нет курса/);
    expect(shellSrc).toMatch(/role=["']status["']/);
  });
});

/** Plan 02 owner — banner lists unique FX codes; quiet role=status retained. */
describe("plan-02 banner FX codes (GRFCST-02 / D-15)", () => {
  it("banner joins unique missing currency codes (USD, EUR pattern)", () => {
    expect(shellSrc).toMatch(/excludedMissingFxCurrencies/);
    expect(shellSrc).toMatch(/\.join\(", "\)/);
    expect(shellSrc).toMatch(/нет курса/);
    // D-16: currency codes only — no income/grace kind tags in banner copy
    expect(shellSrc).not.toMatch(/доходы|грейс/);
  });

  it("partial banner keeps role=status (quiet)", () => {
    expect(shellSrc).toMatch(/role=["']status["']/);
    expect(shellSrc).toMatch(/Прогноз неполный/);
  });
});

/** Plan 03 owner — locked tooltip RU from C-04. */
describe.skip("plan-03 tooltip RU (C-04 / GRFCST-01)", () => {
  it.todo("tooltip includes «Платёж для беспроцентного»");
  it.todo("tooltip includes «NW без изменения (оплата карты)»");
});
