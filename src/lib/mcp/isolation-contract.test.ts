import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * D-05 thin MCP isolation wall across SIDE tool + read adapters.
 * Never-write BalanceSnapshot mutates; never import app route actions modules.
 * Phase 26 CLI-01: named DISOL/INISO/GRISO + wallet_ping annotations required.
 */
const SIDE_MCP_SOURCES = [
  "src/lib/mcp/tools/debts.ts",
  "src/lib/mcp/tools/income.ts",
  "src/lib/mcp/tools/grace.ts",
  "src/lib/mcp/tools/forecast.ts",
  "src/lib/mcp/reads/load-debts.ts",
  "src/lib/mcp/reads/load-income.ts",
  "src/lib/mcp/reads/load-grace.ts",
  "src/lib/mcp/reads/load-forecast-overlay.ts",
] as const;

describe("SIDE MCP isolation-contract (D-05)", () => {
  for (const file of SIDE_MCP_SOURCES) {
    it(`${file} never mutates BalanceSnapshot and never imports app actions`, () => {
      const src = readFileSync(resolve(process.cwd(), file), "utf8");
      expect(src).not.toMatch(/balanceSnapshot\.(create|update|upsert|delete)/);
      expect(src).not.toMatch(/from ["']@\/app\/.*\/actions["']/);
    });
  }

  it("grace + income SIDE sources never import historical-series", () => {
    for (const file of [
      "src/lib/mcp/tools/income.ts",
      "src/lib/mcp/tools/grace.ts",
      "src/lib/mcp/reads/load-income.ts",
      "src/lib/mcp/reads/load-grace.ts",
    ] as const) {
      const src = readFileSync(resolve(process.cwd(), file), "utf8");
      expect(src).not.toMatch(/@\/lib\/historical-series/);
      expect(src).not.toMatch(/from ["']\.\/historical-series["']/);
    }
  });

  it("create-handler instructions list full SIDE + CAP catalog (D-08)", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/lib/mcp/create-handler.ts"),
      "utf8",
    );
    expect(src).toMatch(/wallet_ping/);
    expect(src).toMatch(/list_accounts/);
    expect(src).toMatch(/get_net_worth/);
    expect(src).toMatch(/get_account_balance/);
    expect(src).toMatch(/list_fx_rates/);
    expect(src).toMatch(/get_forecast_overlay/);
    expect(src).toMatch(/list_debts/);
    expect(src).toMatch(/list_income/);
    expect(src).toMatch(/list_grace_obligations/);
    expect(src).toMatch(/registerListIncome/);
    expect(src).toMatch(/registerListGraceObligations/);
    expect(src).not.toMatch(/come later/i);
    expect(src).not.toMatch(/list_grace_obligations next/);
    // Phase 26 CLI-01: named isolation rules required in instructions
    expect(src).toMatch(/DISOL-01/);
    expect(src).toMatch(/INISO-01/);
    expect(src).toMatch(/GRISO-01/);
  });

  it("wallet_ping declares readOnlyHint true and openWorldHint false (D-10)", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/lib/mcp/tools/wallet-ping.ts"),
      "utf8",
    );
    expect(src).toMatch(/readOnlyHint:\s*true/);
    expect(src).toMatch(/openWorldHint:\s*false/);
  });
});
