import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    currency: {
      create: vi.fn(),
      update: vi.fn(),
    },
  },
  ensureSqlitePragmas: vi.fn(),
}));

import { revalidatePath } from "next/cache";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
import * as currencyActions from "./actions";
import { createCurrency, updateCurrencyName } from "./actions";

describe("currencies/actions exports (D-07 / T-02-10)", () => {
  it("exports create/update helpers only — no removal symbols", () => {
    const names = Object.keys(currencyActions);
    expect(names).toEqual(
      expect.arrayContaining(["createCurrency", "updateCurrencyName"]),
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
    // Tamper identity / primary fields — must be ignored
    formData.set("scale", "0");
    formData.set("isPrimary", "true");
    formData.append("code", "USD"); // duplicate key attempt

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
