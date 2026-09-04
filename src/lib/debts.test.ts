import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  currentPrincipalMinor,
  remainingMinor,
  statusForRemaining,
} from "./debts";

describe("DEBT-02 remaining (CONTEXT D-04 size-change ledger)", () => {
  it("initial only: remaining equals initialAmountMinor", () => {
    expect(remainingMinor(10_000n, [], [])).toBe(10_000n);
    expect(currentPrincipalMinor(10_000n, [])).toBe(10_000n);
  });

  it("adds signed size deltas into current principal", () => {
    expect(currentPrincipalMinor(10_000n, [2_000n, -500n])).toBe(11_500n);
    expect(remainingMinor(10_000n, [2_000n, -500n], [])).toBe(11_500n);
  });

  it("subtracts repayments from current principal", () => {
    expect(remainingMinor(10_000n, [1_000n], [3_000n, 500n])).toBe(7_500n);
  });

  it("early-close style: down-delta to zero remaining", () => {
    const initial = 5_000n;
    const paid = [1_000n] as const;
    const remainingBeforeClose = remainingMinor(initial, [], paid);
    expect(remainingBeforeClose).toBe(4_000n);
    const closeDelta = -remainingBeforeClose;
    expect(remainingMinor(initial, [closeDelta], paid)).toBe(0n);
  });

  it("is idempotent for same bigint inputs", () => {
    const deltas = [100n, -20n] as const;
    const pays = [30n] as const;
    const a = remainingMinor(1_000n, deltas, pays);
    const b = remainingMinor(1_000n, deltas, pays);
    expect(a).toBe(b);
    expect(a).toBe(1_050n);
  });
});

describe("status sync (D-12, D-13)", () => {
  it("maps 0n to CLOSED and positive remaining to OPEN", () => {
    expect(statusForRemaining(0n)).toBe("CLOSED");
    expect(statusForRemaining(1n)).toBe("OPEN");
    expect(statusForRemaining(99_99n)).toBe("OPEN");
  });

  it("throws on negative remaining", () => {
    expect(() => statusForRemaining(-1n)).toThrow(/remaining must never be < 0/);
  });
});

describe("schema conventions (Person/Debt/events)", () => {
  const schema = readFileSync("prisma/schema.prisma", "utf8");

  it("defines Person, Debt, DebtRepayment, DebtSizeChange with BigInt money", () => {
    expect(schema).toMatch(/model Person\b/);
    expect(schema).toMatch(/model Debt\b/);
    expect(schema).toMatch(/model DebtRepayment\b/);
    expect(schema).toMatch(/model DebtSizeChange\b/);
    expect(schema).toMatch(/initialAmountMinor\s+BigInt/);
    expect(schema).toMatch(/deltaMinor\s+BigInt/);
    expect(schema).toMatch(/amountMinor\s+BigInt/);
  });

  it("uses Restrict/Cascade onDelete and no writeOff/closedAt", () => {
    expect(schema).toMatch(/onDelete:\s*Restrict/);
    expect(schema).toMatch(/onDelete:\s*Cascade/);
    expect(schema).not.toMatch(/writeOffMinor/);
    expect(schema).not.toMatch(/closedAt/);
    expect(schema).not.toMatch(/@@unique\(\[debtId,\s*asOfDate\]/);
  });
});

describe("DISOL-01 isolation", () => {
  for (const file of [
    "src/lib/net-worth.ts",
    "src/lib/historical-series.ts",
    "src/app/page.tsx",
  ]) {
    it(`${file} does not import debts`, () => {
      const src = readFileSync(file, "utf8");
      expect(src).not.toMatch(/@\/lib\/debts|from ["']\.\/debts["']/);
    });
  }
});
