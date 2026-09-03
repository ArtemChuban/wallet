import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    balanceSnapshot: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
  },
  ensureSqlitePragmas: vi.fn(),
}));

import { ensureSqlitePragmas, prisma } from "@/lib/db";
import {
  calendarDateToday,
  creditDebtMinor,
  getBalanceAsOf,
} from "./balances";

describe("getBalanceAsOf LOCF (BAL-02)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureSqlitePragmas).mockResolvedValue(undefined);
  });

  it("between two snapshots returns earlier amount", async () => {
    vi.mocked(prisma.balanceSnapshot.findFirst).mockResolvedValue({
      id: 1,
      accountId: 7,
      asOfDate: "2026-01-10",
      amountMinor: 100n,
    });

    const row = await getBalanceAsOf(7, "2026-01-15");

    expect(ensureSqlitePragmas).toHaveBeenCalled();
    expect(prisma.balanceSnapshot.findFirst).toHaveBeenCalledWith({
      where: { accountId: 7, asOfDate: { lte: "2026-01-15" } },
      orderBy: { asOfDate: "desc" },
    });
    expect(row?.amountMinor).toBe(100n);
    expect(row?.asOfDate).toBe("2026-01-10");
  });

  it("on exact snapshot date returns that amount", async () => {
    vi.mocked(prisma.balanceSnapshot.findFirst).mockResolvedValue({
      id: 2,
      accountId: 7,
      asOfDate: "2026-02-01",
      amountMinor: 250n,
    });

    const row = await getBalanceAsOf(7, "2026-02-01");

    expect(row?.amountMinor).toBe(250n);
    expect(row?.asOfDate).toBe("2026-02-01");
  });

  it("before first snapshot returns null not 0n", async () => {
    vi.mocked(prisma.balanceSnapshot.findFirst).mockResolvedValue(null);

    const row = await getBalanceAsOf(7, "2025-12-31");

    expect(row).toBeNull();
    expect(row).not.toBe(0n);
    expect(row?.amountMinor).not.toBe(0n);
  });
});

describe("upsert overwrite (BAL-01 / D-09)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("same (accountId, asOfDate) upsert overwrites amountMinor", async () => {
    const store = new Map<string, bigint>();
    const compound = { accountId: 3, asOfDate: "2026-03-01" };
    const key = `${compound.accountId}:${compound.asOfDate}`;

    vi.mocked(prisma.balanceSnapshot.upsert).mockImplementation(
      async (args) => {
        const where = args.where as {
          accountId_asOfDate: { accountId: number; asOfDate: string };
        };
        const { accountId, asOfDate } = where.accountId_asOfDate;
        const k = `${accountId}:${asOfDate}`;
        const amountMinor = store.has(k)
          ? (args.update as { amountMinor: bigint }).amountMinor
          : (args.create as { amountMinor: bigint }).amountMinor;
        store.set(k, amountMinor);
        return {
          id: 1,
          accountId,
          asOfDate,
          amountMinor,
        };
      },
    );

    await prisma.balanceSnapshot.upsert({
      where: { accountId_asOfDate: compound },
      update: { amountMinor: 100n },
      create: {
        accountId: compound.accountId,
        asOfDate: compound.asOfDate,
        amountMinor: 100n,
      },
    });
    expect(store.get(key)).toBe(100n);

    const overwritten = await prisma.balanceSnapshot.upsert({
      where: { accountId_asOfDate: compound },
      update: { amountMinor: 999n },
      create: {
        accountId: compound.accountId,
        asOfDate: compound.asOfDate,
        amountMinor: 999n,
      },
    });

    expect(overwritten.amountMinor).toBe(999n);
    expect(store.get(key)).toBe(999n);
    expect(prisma.balanceSnapshot.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { accountId_asOfDate: compound },
        update: { amountMinor: 999n },
      }),
    );
  });
});

describe("creditDebtMinor (D-05)", () => {
  it("equals limit minus available", () => {
    expect(creditDebtMinor(500_000n, 250_000n)).toBe(250_000n);
    expect(creditDebtMinor(100n, 100n)).toBe(0n);
    expect(creditDebtMinor(100n, 0n)).toBe(100n);
  });
});

describe("calendarDateToday (A3 / D-12)", () => {
  it("defaults to Europe/Moscow YYYY-MM-DD", () => {
    const today = calendarDateToday();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const moscow = calendarDateToday("Europe/Moscow");
    expect(moscow).toBe(today);
  });
});
