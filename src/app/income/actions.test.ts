import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    person: {
      create: vi.fn(),
    },
    currency: {
      findUnique: vi.fn(),
    },
    recurringIncome: {
      create: vi.fn(),
    },
  },
  ensureSqlitePragmas: vi.fn(),
}));

vi.mock("@/lib/money", () => ({
  parseMajorToMinor: vi.fn((major: string) => {
    const n = Number(major);
    if (!Number.isFinite(n)) throw new Error("bad major");
    return BigInt(Math.round(n * 100));
  }),
}));

import { revalidatePath } from "next/cache";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
import { parseMajorToMinor } from "@/lib/money";
import { createRecurringIncome } from "./actions";

describe("createRecurringIncome (SRC-01 tracer)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureSqlitePragmas).mockResolvedValue(undefined);
    vi.mocked(prisma.currency.findUnique).mockResolvedValue({
      code: "RUB",
      scale: 2,
    } as never);
    vi.mocked(prisma.recurringIncome.create).mockResolvedValue({} as never);
    vi.mocked(parseMajorToMinor).mockImplementation((major: string) => {
      const n = Number(major);
      if (!Number.isFinite(n)) throw new Error("bad major");
      return BigInt(Math.round(n * 100));
    });
  });

  it("rejects invalid dayOfMonth without Prisma write", async () => {
    const formData = new FormData();
    formData.set("personId", "1");
    formData.set("currencyCode", "RUB");
    formData.set("plannedAmountMajor", "100");
    formData.set("dayOfMonth", "0");
    formData.set("startAsOf", "2026-09-01");

    const result = await createRecurringIncome({}, formData);

    expect(result.success).toBeUndefined();
    expect(result.errors?.dayOfMonth).toBeDefined();
    expect(prisma.recurringIncome.create).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects non-positive amount without Prisma write", async () => {
    const formData = new FormData();
    formData.set("personId", "1");
    formData.set("currencyCode", "RUB");
    formData.set("plannedAmountMajor", "0");
    formData.set("dayOfMonth", "15");
    formData.set("startAsOf", "2026-09-01");

    const result = await createRecurringIncome({}, formData);

    expect(result.success).toBeUndefined();
    expect(result.errors?.plannedAmountMajor).toEqual([
      "Введите сумму больше 0",
    ]);
    expect(prisma.recurringIncome.create).not.toHaveBeenCalled();
  });

  it("persists recurring income for existing person and revalidates /income only", async () => {
    const formData = new FormData();
    formData.set("personId", "5");
    formData.set("currencyCode", "RUB");
    formData.set("plannedAmountMajor", "50.00");
    formData.set("dayOfMonth", "25");
    formData.set("startAsOf", "2026-09-07");

    const result = await createRecurringIncome({}, formData);

    expect(result.success).toBe(true);
    expect(ensureSqlitePragmas).toHaveBeenCalled();
    expect(prisma.recurringIncome.create).toHaveBeenCalledWith({
      data: {
        personId: 5,
        currencyCode: "RUB",
        plannedAmountMinor: 5000n,
        dayOfMonth: 25,
        startAsOf: "2026-09-07",
        note: null,
      },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/income");
    expect(revalidatePath).not.toHaveBeenCalledWith("/");
  });

  it("creates nested person+recurring when personId absent", async () => {
    vi.mocked(prisma.person.create).mockResolvedValue({} as never);

    const formData = new FormData();
    formData.set("name", "  Работодатель  ");
    formData.set("currencyCode", "RUB");
    formData.set("plannedAmountMajor", "100");
    formData.set("dayOfMonth", "1");
    formData.set("startAsOf", "2026-01-01");

    const result = await createRecurringIncome({}, formData);

    expect(result.success).toBe(true);
    expect(prisma.person.create).toHaveBeenCalledWith({
      data: {
        name: "Работодатель",
        recurringIncomes: {
          create: {
            currencyCode: "RUB",
            plannedAmountMinor: 10000n,
            dayOfMonth: 1,
            startAsOf: "2026-01-01",
            note: null,
          },
        },
      },
    });
    expect(prisma.recurringIncome.create).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/income");
  });
});

describe("income actions isolation (UI-01)", () => {
  it("actions.ts never references BalanceSnapshot or net-worth/historical-series imports", () => {
    const src = readFileSync("src/app/income/actions.ts", "utf8");
    expect(src).not.toMatch(/BalanceSnapshot/);
    expect(src).not.toMatch(/@\/lib\/(?:net-worth|historical-series)/);
    expect(src).not.toMatch(/revalidatePath\("\/"\)/);
  });
});
