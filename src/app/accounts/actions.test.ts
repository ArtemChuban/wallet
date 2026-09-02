import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    account: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    currency: {
      findUnique: vi.fn(),
    },
  },
  ensureSqlitePragmas: vi.fn(),
}));

vi.mock("@/lib/money", () => ({
  parseMajorToMinor: vi.fn((major: string) => {
    const n = Number(major);
    if (!Number.isFinite(n) || n <= 0) throw new Error("bad major");
    return BigInt(Math.round(n * 100));
  }),
}));

import { revalidatePath } from "next/cache";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
import * as accountActions from "./actions";
import { createAccount, updateAccountName } from "./actions";

describe("accounts/actions exports (D-14 / T-02-10)", () => {
  it("exports create/update helpers only — no removal symbols", () => {
    const names = Object.keys(accountActions);
    expect(names).toEqual(
      expect.arrayContaining(["createAccount", "updateAccountName"]),
    );
    for (const forbidden of [
      "deleteAccount",
      "removeAccount",
      "archiveAccount",
      "destroyAccount",
    ]) {
      expect(names).not.toContain(forbidden);
    }
  });
});

describe("updateAccountName immutability (D-15 / T-02-01)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureSqlitePragmas).mockResolvedValue(undefined);
    vi.mocked(prisma.account.update).mockResolvedValue({} as never);
  });

  it("writes only name — ignores tampered type/currency/limit FormData", async () => {
    const formData = new FormData();
    formData.set("id", "7");
    formData.set("name", "Новое имя");
    formData.set("type", "CRYPTO");
    formData.set("currencyCode", "USDT");
    formData.set("creditLimitMajor", "99999");
    formData.set("creditLimitMinor", "99999");

    const result = await updateAccountName({}, formData);

    expect(result.success).toBe(true);
    expect(prisma.account.update).toHaveBeenCalledTimes(1);
    expect(prisma.account.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { name: "Новое имя" },
    });
    const data = vi.mocked(prisma.account.update).mock.calls[0]![0]!.data;
    expect(Object.keys(data as object)).toEqual(["name"]);
    expect(revalidatePath).toHaveBeenCalledWith("/accounts");
  });
});

describe("createAccount types (ACCT-01)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureSqlitePragmas).mockResolvedValue(undefined);
    vi.mocked(prisma.currency.findUnique).mockResolvedValue({
      code: "RUB",
      name: "Рубль",
      scale: 2,
      isPrimary: true,
    } as never);
    vi.mocked(prisma.account.create).mockResolvedValue({} as never);
  });

  it("persists creditLimitMinor null for non-credit types", async () => {
    for (const type of ["FIAT_DEBIT", "CRYPTO", "CASH"] as const) {
      vi.mocked(prisma.account.create).mockClear();
      const formData = new FormData();
      formData.set("name", `Счёт ${type}`);
      formData.set("type", type);
      formData.set("currencyCode", "RUB");

      const result = await createAccount({}, formData);

      expect(result.success).toBe(true);
      expect(prisma.account.create).toHaveBeenCalledWith({
        data: {
          name: `Счёт ${type}`,
          type,
          currencyCode: "RUB",
          creditLimitMinor: null,
        },
      });
    }
  });

  it("persists positive creditLimitMinor for FIAT_CREDIT", async () => {
    const formData = new FormData();
    formData.set("name", "Кредитка");
    formData.set("type", "FIAT_CREDIT");
    formData.set("currencyCode", "RUB");
    formData.set("creditLimitMajor", "1000");

    const result = await createAccount({}, formData);

    expect(result.success).toBe(true);
    expect(prisma.account.create).toHaveBeenCalledWith({
      data: {
        name: "Кредитка",
        type: "FIAT_CREDIT",
        currencyCode: "RUB",
        creditLimitMinor: 100000n,
      },
    });
  });
});
