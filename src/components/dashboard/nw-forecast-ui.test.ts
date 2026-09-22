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
    // D-16 / C-03: currency codes only — no income/grace/savings kind tags in banner copy
    expect(shellSrc).not.toMatch(/доходы|грейс|накопительный/i);
  });

  it("partial banner keeps role=status (quiet)", () => {
    expect(shellSrc).toMatch(/role=["']status["']/);
    expect(shellSrc).toMatch(/Прогноз неполный/);
  });
});

/** Phase 29 Wave 0 — tooltip RU + shell interest wiring (D-01…D-10 / INT-02 / C-01). */
describe("phase-29 tooltip and shell file-scan", () => {
  const pageSrc = readFileSync("src/app/page.tsx", "utf8");

  it("tooltip keeps «Платёж для беспроцентного» header (D-09)", () => {
    expect(chartSrc).toMatch(/Платёж для беспроцентного/);
  });

  it("tooltip locks interest/grace copy strings (D-04, D-05, D-09)", () => {
    expect(chartSrc).toMatch(/Накопительный/);
    expect(chartSrc).toMatch(/Ожидаемое начисление/);
    expect(chartSrc).toMatch(/Ожидаемый платёж/);
    expect(chartSrc).not.toMatch(/NW без изменения \(оплата карты\)/);
  });

  it("interest plus and grace minus prefixes; Прогноз level unsigned (D-08, D-09, D-10)", () => {
    expect(chartSrc).toMatch(/`\+\$\{formatChartNumber/);
    expect(chartSrc).toMatch(/`-\$\{formatChartNumber/);
    // Прогноз level: formatChartNumber(forecastVal) with no leading plus template
    expect(chartSrc).toMatch(
      /Прогноз[\s\S]{0,400}formatChartNumber\(forecastVal\)/,
    );
    expect(chartSrc).not.toMatch(
      /Прогноз[\s\S]{0,400}`\+\$\{formatChartNumber\(forecastVal\)\}/,
    );
  });

  it("interest rows sort localeCompare ru base; missing name is счёт+accountId (D-01, D-02)", () => {
    expect(chartSrc).toMatch(
      /localeCompare\([^)]*["']ru["'][^)]*sensitivity:\s*["']base["']/,
    );
    expect(chartSrc).toMatch(/счёт \$\{(?:ev\.)?accountId\}/);
  });

  it("D-02 probe: same-day interest rows order Альфа, Яндекс, Бета (amount desc then А→Я)", () => {
    // Extract the production comparator from ForecastInterestTooltipBlock — not a twin copy.
    const block = chartSrc.match(
      /function ForecastInterestTooltipBlock[\s\S]*?\.sort\(\(a, b\) => \{([\s\S]*?)\n\s*\}\)/,
    );
    expect(block?.[1]).toBeTruthy();
    // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func -- run locked chart source
    const compare = new Function(
      "a",
      "b",
      `${block![1]};`,
    ) as (a: {
      displayPrimaryMajor: number;
      accountName?: string | null;
      accountId?: number | null;
    }, b: {
      displayPrimaryMajor: number;
      accountName?: string | null;
      accountId?: number | null;
    }) => number;

    type Row = {
      displayPrimaryMajor: number;
      accountName: string;
      accountId: number;
    };
    // Plan probe: amounts 20, 20, 10 — names Альфа, Яндекс, Бета → Альфа, Яндекс, Бета
    const probe: Row[] = [
      { displayPrimaryMajor: 20, accountName: "Яндекс", accountId: 2 },
      { displayPrimaryMajor: 10, accountName: "Бета", accountId: 3 },
      { displayPrimaryMajor: 20, accountName: "Альфа", accountId: 1 },
    ];
    const ordered = probe.slice().sort(compare).map((r) => r.accountName);
    expect(ordered).toEqual(["Альфа", "Яндекс", "Бета"]);

    // Tie-break alone must not alpha-sort Бета before Яндекс when amounts differ.
    const amountOnly: Row[] = [
      { displayPrimaryMajor: 10, accountName: "Альфа", accountId: 1 },
      { displayPrimaryMajor: 20, accountName: "Бета", accountId: 2 },
    ];
    expect(amountOnly.slice().sort(compare).map((r) => r.accountName)).toEqual([
      "Бета",
      "Альфа",
    ]);
  });

  it("tooltip card roots use text-sm not text-xs (UI-SPEC Label)", () => {
    expect(chartSrc).toMatch(
      /rounded-lg border border-border\/50 bg-background[\s\S]*?text-sm/,
    );
    expect(chartSrc).not.toMatch(
      /rounded-lg border border-border\/50 bg-background[\s\S]*?text-xs/,
    );
  });

  it("shell calls listInterestSlotsInRange with kind interest (INT-02)", () => {
    expect(shellSrc).toMatch(/listInterestSlotsInRange/);
    expect(shellSrc).toMatch(/kind:\s*["']interest["']/);
  });

  it("page and shell forecastSavings carry annualRateBps and accrualDayOfMonth (INT-02)", () => {
    expect(pageSrc).toMatch(/annualRateBps/);
    expect(pageSrc).toMatch(/accrualDayOfMonth/);
    expect(shellSrc).toMatch(/annualRateBps/);
    expect(shellSrc).toMatch(/accrualDayOfMonth/);
  });

  it("single dashed Line pattern retained (C-01)", () => {
    const dashMatches = chartSrc.match(/strokeDasharray/g) ?? [];
    expect(dashMatches.length).toBeGreaterThanOrEqual(1);
    expect(chartSrc).toMatch(
      /<Line[\s\S]*?strokeDasharray=["']5 5["'][\s\S]*?\/>/,
    );
  });
});
