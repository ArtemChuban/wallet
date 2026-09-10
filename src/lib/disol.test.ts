import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/** DISOL-01: debts domain must not couple into NW math or Капитал page. */
describe("DISOL-01 isolation", () => {
  for (const file of [
    "src/lib/net-worth.ts",
    "src/lib/historical-series.ts",
    "src/app/page.tsx",
    "src/lib/mcp/reads/load-net-worth-asof.ts",
    "src/lib/mcp/tools/net-worth.ts",
  ]) {
    it(`${file} does not import debts domain module`, () => {
      const src = readFileSync(file, "utf8");
      expect(src).not.toMatch(/@\/lib\/debts|from ["']\.\/debts["']/);
    });
  }

  it("DebtPrincipalStackChart does not import historical-series", () => {
    const src = readFileSync(
      "src/components/debts/DebtPrincipalStackChart.tsx",
      "utf8",
    );
    expect(src).not.toMatch(/@\/lib\/historical-series|from ["']\.\/historical-series["']/);
  });
});
