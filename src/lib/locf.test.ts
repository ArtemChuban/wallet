import { describe, expect, it } from "vitest";
import {
  firstHitLocfMap,
  locfAmountAsOf,
  locfRateAsOf,
  pickLatestAsOf,
} from "./locf";

type Snap = { accountId: number; asOfDate: string; amountMinor: bigint };
type Rate = {
  currencyCode: string;
  asOfDate: string;
  rateToPrimaryScaled: bigint;
};

describe("pickLatestAsOf (LOCF-01, D-03)", () => {
  it("returns null when all rows are after D (null-before-first)", () => {
    const rows: Snap[] = [
      { accountId: 1, asOfDate: "2026-02-01", amountMinor: 100n },
      { accountId: 1, asOfDate: "2026-03-01", amountMinor: 200n },
    ];
    const picked = pickLatestAsOf(
      rows,
      (r) => r.accountId === 1,
      (r) => r.asOfDate,
      "2026-01-15",
    );
    expect(picked).toBeNull();
    expect(picked).not.toBe(0n);
  });

  it("picks max asOfDate among key matches with asOfDate <= D", () => {
    const rows: Snap[] = [
      { accountId: 1, asOfDate: "2026-01-01", amountMinor: 100n },
      { accountId: 1, asOfDate: "2026-02-01", amountMinor: 200n },
      { accountId: 2, asOfDate: "2026-03-01", amountMinor: 999n },
      { accountId: 1, asOfDate: "2026-04-01", amountMinor: 300n },
    ];
    const picked = pickLatestAsOf(
      rows,
      (r) => r.accountId === 1,
      (r) => r.asOfDate,
      "2026-03-15",
    );
    expect(picked?.asOfDate).toBe("2026-02-01");
    expect(picked?.amountMinor).toBe(200n);
  });
});

describe("firstHitLocfMap ↔ pickLatestAsOf (LOCF-05)", () => {
  it("first hit on desc-sorted rows equals pickLatestAsOf after newest", () => {
    const rows: Snap[] = [
      { accountId: 1, asOfDate: "2026-02-01", amountMinor: 200n },
      { accountId: 1, asOfDate: "2026-01-01", amountMinor: 100n },
      { accountId: 2, asOfDate: "2026-02-15", amountMinor: 50n },
    ];
    const map = firstHitLocfMap(rows, (r) => r.accountId);
    const picked = pickLatestAsOf(
      rows,
      (r) => r.accountId === 1,
      (r) => r.asOfDate,
      "2026-03-01",
    );
    expect(map.get(1)?.amountMinor).toBe(200n);
    expect(picked?.amountMinor).toBe(200n);
    expect(map.get(1)?.asOfDate).toBe(picked?.asOfDate);
  });

  it("stores only first key hit (latest under desc precondition)", () => {
    const rows: Snap[] = [
      { accountId: 7, asOfDate: "2026-06-01", amountMinor: 700n },
      { accountId: 7, asOfDate: "2026-05-01", amountMinor: 500n },
    ];
    const map = firstHitLocfMap(rows, (r) => r.accountId);
    expect(map.size).toBe(1);
    expect(map.get(7)?.amountMinor).toBe(700n);
  });
});

describe("typed wrappers", () => {
  it("locfAmountAsOf returns null before first snapshot", () => {
    const snaps: Snap[] = [
      { accountId: 1, asOfDate: "2026-02-01", amountMinor: 100n },
    ];
    expect(locfAmountAsOf(snaps, 1, "2025-12-31")).toBeNull();
    expect(locfAmountAsOf(snaps, 1, "2026-02-01")).toBe(100n);
  });

  it("locfRateAsOf returns null before first rate", () => {
    const rates: Rate[] = [
      {
        currencyCode: "USD",
        asOfDate: "2026-02-01",
        rateToPrimaryScaled: 90_00000000n,
      },
    ];
    expect(locfRateAsOf(rates, "USD", "2025-12-31")).toBeNull();
    expect(locfRateAsOf(rates, "USD", "2026-02-01")).toBe(90_00000000n);
  });
});
