import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const listSrc = readFileSync(
  "src/components/accounts/AccountList.tsx",
  "utf8",
);

/**
 * Phase 27 ACCT-03 / D-11 / D-12 — SAVINGS list secondary uses rate% + countdown,
 * never raw accrualDayOfMonth as the countdown segment.
 */
describe("AccountList SAVINGS secondary (ACCT-03 / D-11 / D-12)", () => {
  it("wires formatBpsToPercentMajor and formatAccrualCountdown for SAVINGS meta", () => {
    expect(listSrc).toMatch(/formatBpsToPercentMajor/);
    expect(listSrc).toMatch(/formatAccrualCountdown/);
    expect(listSrc).toMatch(/nextAccrualAsOf/);
    expect(listSrc).toMatch(/account\.type\s*===\s*["']SAVINGS["']/);
  });

  it("builds rate segment as formatBpsToPercentMajor(bps)+%", () => {
    expect(listSrc).toMatch(
      /\$\{formatBpsToPercentMajor\(account\.annualRateBps\)\}%/,
    );
  });

  it("does not render raw accrualDayOfMonth as secondary countdown copy", () => {
    // Countdown must go through formatAccrualCountdown(today, nextAccrualAsOf(...))
    expect(listSrc).toMatch(
      /formatAccrualCountdown\(\s*today\s*,\s*nextAccrualAsOf\(\s*today\s*,\s*account\.accrualDayOfMonth/,
    );
    // No template that dumps DOM int as human countdown chrome
    expect(listSrc).not.toMatch(
      /через\s*\$\{[^}]*accrualDayOfMonth/,
    );
  });
});
