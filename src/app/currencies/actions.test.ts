import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/balances", () => ({
  calendarDateToday: vi.fn(() => "2026-09-03"),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    currency: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    fxRate: {
      upsert: vi.fn(),
      delete: vi.fn(),
    },
  },
  ensureSqlitePragmas: vi.fn(),
}));

import { revalidatePath } from "next/cache";
import { calendarDateToday } from "@/lib/balances";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
import * as currencyActions from "./actions";
import {
  createCurrency,
  deleteFxRate,
  updateCurrencyName,
  upsertFxRate,
} from "./actions";

describe("currencies/actions exports (D-07 / T-02-10)", () => {
  it("exports create/update helpers and upsertFxRate — no removal symbols", () => {
    const names = Object.keys(currencyActions);
    expect(names).toEqual(
      expect.arrayContaining([
        "createCurrency",
        "updateCurrencyName",
        "upsertFxRate",
        "deleteFxRate",
      ]),
    );
    for (const forbidden of [
      "deleteCurrency",
      "removeCurrency",
      "archiveCurrency",
      "destroyCurrency",
      "setPrimaryCurrency",
    ]) {
      expect(names).not.toContain(forbidden);
    }
  });
});

describe("updateCurrencyName immutability (D-04 / D-08 / T-02-01)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureSqlitePragmas).mockResolvedValue(undefined);
    vi.mocked(prisma.currency.update).mockResolvedValue({} as never);
  });

  it("writes only name — ignores tampered code/scale/isPrimary FormData", async () => {
    const formData = new FormData();
    formData.set("code", "RUB");
    formData.set("name", "Российский рубль");
    formData.set("scale", "0");
    formData.set("isPrimary", "true");
    formData.append("code", "USD");

    const result = await updateCurrencyName({}, formData);

    expect(result.success).toBe(true);
    expect(prisma.currency.update).toHaveBeenCalledTimes(1);
    expect(prisma.currency.update).toHaveBeenCalledWith({
      where: { code: "RUB" },
      data: { name: "Российский рубль" },
    });
    const data = vi.mocked(prisma.currency.update).mock.calls[0]![0]!.data;
    expect(Object.keys(data as object)).toEqual(["name"]);
    expect(revalidatePath).toHaveBeenCalledWith("/currencies");
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });
});

describe("createCurrency primary lock (D-02 / T-02-02)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureSqlitePragmas).mockResolvedValue(undefined);
    vi.mocked(prisma.currency.create).mockResolvedValue({} as never);
  });

  it("always forces isPrimary false even if FormData claims primary", async () => {
    const formData = new FormData();
    formData.set("code", "USDT");
    formData.set("name", "Tether");
    formData.set("scale", "6");
    formData.set("isPrimary", "true");

    const result = await createCurrency({}, formData);

    expect(result.success).toBe(true);
    expect(prisma.currency.create).toHaveBeenCalledWith({
      data: {
        code: "USDT",
        name: "Tether",
        scale: 6,
        isPrimary: false,
      },
    });
  });
});

describe("upsertFxRate (FX-01 / D-05–D-11 / T-04-01)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureSqlitePragmas).mockResolvedValue(undefined);
    vi.mocked(calendarDateToday).mockReturnValue("2026-09-03");
    vi.mocked(prisma.currency.findUnique).mockResolvedValue({
      code: "USD",
      name: "US Dollar",
      scale: 2,
      isPrimary: false,
    } as never);
    vi.mocked(prisma.fxRate.upsert).mockResolvedValue({} as never);
  });

  it("rejects future asOfDate with Russian message (D-08 / T-04-01)", async () => {
    const formData = new FormData();
    formData.set("currencyCode", "USD");
    formData.set("rateMajor", "90");
    formData.set("asOfDate", "2026-09-04");
    formData.set("direction", "toPrimary");

    const result = await upsertFxRate({}, formData);

    expect(result.success).toBeUndefined();
    expect(result.errors?.asOfDate).toEqual(["Дата не может быть в будущем"]);
    expect(prisma.fxRate.upsert).not.toHaveBeenCalled();
  });

  it("rejects primary currencyCode (D-16)", async () => {
    vi.mocked(prisma.currency.findUnique).mockResolvedValue({
      code: "RUB",
      name: "Рубль",
      scale: 2,
      isPrimary: true,
    } as never);

    const formData = new FormData();
    formData.set("currencyCode", "RUB");
    formData.set("rateMajor", "1");
    formData.set("asOfDate", "2026-09-03");
    formData.set("direction", "toPrimary");

    const result = await upsertFxRate({}, formData);

    expect(result.errors?.currencyCode).toEqual([
      "Выберите валюту, отличную от основной",
    ]);
    expect(prisma.fxRate.upsert).not.toHaveBeenCalled();
  });

  it("rejects zero rate with Russian message (D-09)", async () => {
    const formData = new FormData();
    formData.set("currencyCode", "USD");
    formData.set("rateMajor", "0");
    formData.set("asOfDate", "2026-09-03");
    formData.set("direction", "toPrimary");

    const result = await upsertFxRate({}, formData);

    expect(result.errors?.rateMajor).toEqual(["Курс должен быть больше 0"]);
    expect(prisma.fxRate.upsert).not.toHaveBeenCalled();
  });

  it("rejects negative rate with Russian message (D-09)", async () => {
    const formData = new FormData();
    formData.set("currencyCode", "USD");
    formData.set("rateMajor", "-5");
    formData.set("asOfDate", "2026-09-03");
    formData.set("direction", "toPrimary");

    const result = await upsertFxRate({}, formData);

    expect(result.errors?.rateMajor).toEqual(["Курс должен быть больше 0"]);
    expect(prisma.fxRate.upsert).not.toHaveBeenCalled();
  });

  it("upserts toPrimary rate directly on currencyCode_asOfDate (D-05 / D-11)", async () => {
    const formData = new FormData();
    formData.set("currencyCode", "USD");
    formData.set("rateMajor", "90.5");
    formData.set("asOfDate", "2026-09-01");
    formData.set("direction", "toPrimary");

    const result = await upsertFxRate({}, formData);

    expect(result.success).toBe(true);
    expect(prisma.fxRate.upsert).toHaveBeenCalledWith({
      where: {
        currencyCode_asOfDate: {
          currencyCode: "USD",
          asOfDate: "2026-09-01",
        },
      },
      update: { rateToPrimaryScaled: 9050000000n },
      create: {
        currencyCode: "USD",
        asOfDate: "2026-09-01",
        rateToPrimaryScaled: 9050000000n,
      },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/currencies");
    expect(revalidatePath).toHaveBeenCalledWith("/currencies/rates");
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });

  it("inverts fromPrimary before persist (D-05 / D-06 / T-04-06)", async () => {
    const formData = new FormData();
    formData.set("currencyCode", "USD");
    formData.set("rateMajor", "90");
    formData.set("asOfDate", "2026-09-03");
    formData.set("direction", "fromPrimary");

    const result = await upsertFxRate({}, formData);

    expect(result.success).toBe(true);
    const upsertCall = vi.mocked(prisma.fxRate.upsert).mock.calls[0]![0]!;
    expect(upsertCall.update.rateToPrimaryScaled).toBe(1111111n);
    expect(upsertCall.create.rateToPrimaryScaled).toBe(1111111n);
  });

  it("defaults direction to toPrimary when FormData omits direction (D-06)", async () => {
    const formData = new FormData();
    formData.set("currencyCode", "USD");
    formData.set("rateMajor", "90");
    formData.set("asOfDate", "2026-09-03");

    const result = await upsertFxRate({}, formData);

    expect(result.success).toBe(true);
    expect(prisma.fxRate.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { rateToPrimaryScaled: 9000000000n },
      }),
    );
  });
});

describe("deleteFxRate (FX-01 / D-13 / T-04-09)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureSqlitePragmas).mockResolvedValue(undefined);
    vi.mocked(prisma.fxRate.delete).mockResolvedValue({} as never);
  });

  it("deletes by validated id and revalidates both paths", async () => {
    const formData = new FormData();
    formData.set("id", "7");

    const result = await deleteFxRate(formData);

    expect(result.success).toBe(true);
    expect(prisma.fxRate.delete).toHaveBeenCalledWith({
      where: { id: 7 },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/currencies");
    expect(revalidatePath).toHaveBeenCalledWith("/currencies/rates");
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });

  it("returns Russian error on invalid id", async () => {
    const formData = new FormData();
    formData.set("id", "0");

    const result = await deleteFxRate(formData);

    expect(result.success).toBeUndefined();
    expect(result.message).toBe(
      "Не удалось удалить курс. Попробуйте снова.",
    );
    expect(prisma.fxRate.delete).not.toHaveBeenCalled();
  });

  it("returns Russian error when prisma delete fails", async () => {
    vi.mocked(prisma.fxRate.delete).mockRejectedValue(new Error("not found"));
    const formData = new FormData();
    formData.set("id", "99");

    const result = await deleteFxRate(formData);

    expect(result.success).toBeUndefined();
    expect(result.message).toBe(
      "Не удалось удалить курс. Попробуйте снова.",
    );
  });
});

describe("deleteFxRate (FX-01 / D-13 / T-04-09)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureSqlitePragmas).mockResolvedValue(undefined);
    vi.mocked(prisma.fxRate.delete).mockResolvedValue({} as never);
  });

  it("deletes by validated id and revalidates both paths", async () => {
    const formData = new FormData();
    formData.set("id", "7");

    const result = await deleteFxRate(formData);

    expect(result.success).toBe(true);
    expect(prisma.fxRate.delete).toHaveBeenCalledWith({
      where: { id: 7 },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/currencies");
    expect(revalidatePath).toHaveBeenCalledWith("/currencies/rates");
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });

  it("returns Russian error on invalid id", async () => {
    const formData = new FormData();
    formData.set("id", "0");

    const result = await deleteFxRate(formData);

    expect(result.success).toBeUndefined();
    expect(result.message).toBe(
      "Не удалось удалить курс. Попробуйте снова.",
    );
    expect(prisma.fxRate.delete).not.toHaveBeenCalled();
  });

  it("returns Russian error when prisma delete fails", async () => {
    vi.mocked(prisma.fxRate.delete).mockRejectedValue(new Error("not found"));
    const formData = new FormData();
    formData.set("id", "99");

    const result = await deleteFxRate(formData);

    expect(result.success).toBeUndefined();
    expect(result.message).toBe(
      "Не удалось удалить курс. Попробуйте снова.",
    );
  });
});
