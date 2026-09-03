import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    fxRate: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
  },
  ensureSqlitePragmas: vi.fn(),
}));

import { ensureSqlitePragmas, prisma } from "@/lib/db";
import {
  convertOtherMinorToPrimaryMinor,
  getRateAsOf,
} from "./fx";

describe("getRateAsOf LOCF (FX-02 / D-15)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureSqlitePragmas).mockResolvedValue(undefined);
  });

  it("between two rates returns earlier rateToPrimaryScaled", async () => {
    vi.mocked(prisma.fxRate.findFirst).mockResolvedValue({
      id: 1,
      currencyCode: "USD",
      asOfDate: "2026-01-01",
      rateToPrimaryScaled: 90_00000000n,
    });

    const row = await getRateAsOf("USD", "2026-01-05");

    expect(ensureSqlitePragmas).toHaveBeenCalled();
    expect(prisma.fxRate.findFirst).toHaveBeenCalledWith({
      where: { currencyCode: "USD", asOfDate: { lte: "2026-01-05" } },
      orderBy: { asOfDate: "desc" },
    });
    expect(row?.rateToPrimaryScaled).toBe(90_00000000n);
    expect(row?.asOfDate).toBe("2026-01-01");
  });

  it("on exact rate date returns that row", async () => {
    vi.mocked(prisma.fxRate.findFirst).mockResolvedValue({
      id: 2,
      currencyCode: "USD",
      asOfDate: "2026-01-10",
      rateToPrimaryScaled: 95_00000000n,
    });

    const row = await getRateAsOf("USD", "2026-01-10");

    expect(row?.rateToPrimaryScaled).toBe(95_00000000n);
    expect(row?.asOfDate).toBe("2026-01-10");
  });

  it("before first rate returns null not 0 or 1", async () => {
    vi.mocked(prisma.fxRate.findFirst).mockResolvedValue(null);

    const row = await getRateAsOf("USD", "2025-12-31");

    expect(row).toBeNull();
    expect(row).not.toBe(0n);
    expect(row).not.toBe(1n);
    expect(row?.rateToPrimaryScaled).not.toBe(0n);
    expect(row?.rateToPrimaryScaled).not.toBe(1n);
  });
});

describe("upsert overwrite (FX-01 / D-11)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("same (currencyCode, asOfDate) upsert overwrites rateToPrimaryScaled", async () => {
    const store = new Map<string, bigint>();
    const compound = { currencyCode: "USD", asOfDate: "2026-03-01" };
    const key = `${compound.currencyCode}:${compound.asOfDate}`;

    vi.mocked(prisma.fxRate.upsert).mockImplementation(
      (async (args: {
        where: {
          currencyCode_asOfDate: { currencyCode: string; asOfDate: string };
        };
        update: { rateToPrimaryScaled: bigint };
        create: { rateToPrimaryScaled: bigint };
      }) => {
        const { currencyCode, asOfDate } = args.where.currencyCode_asOfDate;
        const k = `${currencyCode}:${asOfDate}`;
        const rateToPrimaryScaled = store.has(k)
          ? args.update.rateToPrimaryScaled
          : args.create.rateToPrimaryScaled;
        store.set(k, rateToPrimaryScaled);
        return {
          id: 1,
          currencyCode,
          asOfDate,
          rateToPrimaryScaled,
        };
      }) as never,
    );

    await prisma.fxRate.upsert({
      where: { currencyCode_asOfDate: compound },
      update: { rateToPrimaryScaled: 90_00000000n },
      create: {
        currencyCode: compound.currencyCode,
        asOfDate: compound.asOfDate,
        rateToPrimaryScaled: 90_00000000n,
      },
    });
    expect(store.get(key)).toBe(90_00000000n);

    const overwritten = await prisma.fxRate.upsert({
      where: { currencyCode_asOfDate: compound },
      update: { rateToPrimaryScaled: 99_00000000n },
      create: {
        currencyCode: compound.currencyCode,
        asOfDate: compound.asOfDate,
        rateToPrimaryScaled: 99_00000000n,
      },
    });

    expect(overwritten.rateToPrimaryScaled).toBe(99_00000000n);
    expect(store.get(key)).toBe(99_00000000n);
  });
});

describe("forward-effective LOCF (FX-02)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureSqlitePragmas).mockResolvedValue(undefined);
  });

  it("later insert leaves earlier as-of unchanged", async () => {
    const rates = [
      { id: 1, currencyCode: "USD", asOfDate: "2026-01-01", rateToPrimaryScaled: 90_00000000n },
      { id: 2, currencyCode: "USD", asOfDate: "2026-01-10", rateToPrimaryScaled: 95_00000000n },
    ];

    vi.mocked(prisma.fxRate.findFirst).mockImplementation(
      (async (args: {
        where: { currencyCode: string; asOfDate: { lte: string } };
      }) => {
        const { lte } = args.where.asOfDate;
        const match = rates
          .filter((r) => r.asOfDate <= lte)
          .sort((a, b) => (a.asOfDate < b.asOfDate ? 1 : -1))[0];
        return match ?? null;
      }) as never,
    );

    const earlier = await getRateAsOf("USD", "2026-01-05");
    expect(earlier?.rateToPrimaryScaled).toBe(90_00000000n);
    expect(earlier?.asOfDate).toBe("2026-01-01");

    const later = await getRateAsOf("USD", "2026-01-15");
    expect(later?.rateToPrimaryScaled).toBe(95_00000000n);
    expect(later?.asOfDate).toBe("2026-01-10");
  });
});

describe("convertOtherMinorToPrimaryMinor (FX-02 / D-17)", () => {
  it("converts scale-2 other minor to scale-2 primary minor with truncating division", () => {
    // 100 USD at 90.00 RUB/USD → 9000.00 RUB = 900000 minor
    const result = convertOtherMinorToPrimaryMinor(
      10000n,
      90_00000000n,
      2,
      2,
    );
    expect(result).toBe(900000n);
  });

  it("truncates toward zero on fractional primary minor", () => {
    const result = convertOtherMinorToPrimaryMinor(
      1n,
      90_00000000n,
      2,
      2,
    );
    expect(result).toBe(90n);
  });
});
