import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Phase 30 plan-02 gate: COVERAGE declaration + D-16 savings todo stays pending
 * until /gsd-complete-milestone v1.5 (must not move to completed mid-milestone).
 */
const PENDING_SAVINGS_TODO =
  ".planning/todos/pending/2026-09-10-savings-account-type-with-interest-nw-forecast.md";
const COMPLETED_SAVINGS_TODO =
  ".planning/todos/completed/2026-09-10-savings-account-type-with-interest-nw-forecast.md";
const COVERAGE_MD =
  ".planning/phases/30-mcp-parity-verify/COVERAGE.md";

describe("phase 30 parity gate (PARITY-01 / D-16)", () => {
  it("COVERAGE.md declares no external API integration", () => {
    const src = readFileSync(resolve(process.cwd(), COVERAGE_MD), "utf8");
    expect(src).toMatch(/No external API integration/);
  });

  it("D-16 savings todo remains under pending/ (not completed mid-milestone)", () => {
    expect(existsSync(resolve(process.cwd(), PENDING_SAVINGS_TODO))).toBe(
      true,
    );
    expect(existsSync(resolve(process.cwd(), COMPLETED_SAVINGS_TODO))).toBe(
      false,
    );
  });
});
