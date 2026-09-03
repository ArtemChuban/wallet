"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { calendarDateToday } from "@/lib/balances";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
import { parseMajorToMinor } from "@/lib/money";
import {
  createAccountSchema,
  updateAccountNameSchema,
} from "@/lib/validations/account";
import {
  deleteBalanceSchema,
  setBalanceSchema,
} from "@/lib/validations/balance";

export type AccountActionState = {
  errors?: {
    name?: string[];
    type?: string[];
    currencyCode?: string[];
    creditLimitMajor?: string[];
  };
  message?: string;
  success?: boolean;
};

export type BalanceActionState = {
  errors?: {
    accountId?: string[];
    amountMajor?: string[];
    asOfDate?: string[];
  };
  message?: string;
  success?: boolean;
};

function isUniqueNameViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

/** Count fractional digits in a major decimal string (0 if none). */
function fracDigitCount(major: string): number {
  const m = /^[+-]?\d+(?:\.(\d+))?$/.exec(major.trim());
  return m?.[1]?.length ?? 0;
}

/** Create typed account; creditLimitMinor only for FIAT_CREDIT (D-09, D-10). */
export async function createAccount(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const creditRaw = formData.get("creditLimitMajor");
  const creditLimitMajor =
    typeof creditRaw === "string" && creditRaw.trim() !== ""
      ? creditRaw
      : undefined;

  const validated = createAccountSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    currencyCode: formData.get("currencyCode"),
    creditLimitMajor,
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { name, type, currencyCode } = validated.data;

  try {
    await ensureSqlitePragmas();

    const currency = await prisma.currency.findUnique({
      where: { code: currencyCode },
    });
    if (!currency) {
      return {
        errors: { currencyCode: ["Валюта не найдена"] },
      };
    }

    let creditLimitMinor: bigint | null = null;
    if (type === "FIAT_CREDIT") {
      const major = validated.data.creditLimitMajor!;
      if (fracDigitCount(major) > currency.scale) {
        return {
          errors: {
            creditLimitMajor: [
              `Не больше ${currency.scale} знаков после запятой`,
            ],
          },
        };
      }
      try {
        creditLimitMinor = parseMajorToMinor(major, currency.scale);
      } catch (err) {
        const msg =
          err instanceof Error && err.message === "too many fractional digits"
            ? `Не больше ${currency.scale} знаков после запятой`
            : "Некорректная сумма";
        return { errors: { creditLimitMajor: [msg] } };
      }
      if (creditLimitMinor <= 0n) {
        return {
          errors: { creditLimitMajor: ["Введите сумму больше 0"] },
        };
      }
    }

    await prisma.account.create({
      data: {
        name,
        type,
        currencyCode,
        creditLimitMinor,
      },
    });
  } catch (error) {
    if (isUniqueNameViolation(error)) {
      return { errors: { name: ["Счёт с таким названием уже есть"] } };
    }
    return {
      message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
    };
  }

  revalidatePath("/accounts");
  revalidatePath("/");
  return { success: true, message: "Сохранено" };
}

/** Update account name only — ignore tampered type/currency/limit (D-15, T-02-01). */
export async function updateAccountName(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const idRaw = formData.get("id");
  if (typeof idRaw !== "string" || !/^\d+$/.test(idRaw.trim())) {
    return {
      message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
    };
  }
  const id = Number(idRaw.trim());
  if (!Number.isInteger(id) || id <= 0) {
    return {
      message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
    };
  }

  const validated = updateAccountNameSchema.safeParse({
    name: formData.get("name"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  try {
    await ensureSqlitePragmas();
    await prisma.account.update({
      where: { id },
      data: { name: validated.data.name },
    });
  } catch (error) {
    if (isUniqueNameViolation(error)) {
      return { errors: { name: ["Счёт с таким названием уже есть"] } };
    }
    return {
      message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
    };
  }

  revalidatePath("/accounts");
  revalidatePath("/");
  return { success: true, message: "Сохранено" };
}

/** Upsert dated balance snapshot (BAL-01); LOCF read on list (BAL-02). */
export async function upsertBalanceSnapshot(
  _prev: BalanceActionState,
  formData: FormData,
): Promise<BalanceActionState> {
  const validated = setBalanceSchema.safeParse({
    accountId: formData.get("accountId"),
    amountMajor: formData.get("amountMajor"),
    asOfDate: formData.get("asOfDate"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { accountId, amountMajor, asOfDate } = validated.data;
  const today = calendarDateToday();
  if (asOfDate > today) {
    return {
      errors: { asOfDate: ["Дата не может быть в будущем"] },
    };
  }

  try {
    await ensureSqlitePragmas();

    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: { currency: true },
    });
    if (!account) {
      return {
        message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
      };
    }

    if (fracDigitCount(amountMajor) > account.currency.scale) {
      return {
        errors: {
          amountMajor: [
            `Не больше ${account.currency.scale} знаков после запятой`,
          ],
        },
      };
    }

    let amountMinor: bigint;
    try {
      amountMinor = parseMajorToMinor(amountMajor, account.currency.scale);
    } catch (err) {
      const msg =
        err instanceof Error && err.message === "too many fractional digits"
          ? `Не больше ${account.currency.scale} знаков после запятой`
          : "Некорректная сумма";
      return { errors: { amountMajor: [msg] } };
    }

    if (account.type === "FIAT_CREDIT") {
      const limit = account.creditLimitMinor ?? 0n;
      if (amountMinor < 0n || amountMinor > limit) {
        return {
          errors: {
            amountMajor: ["Введите сумму от 0 до кредитного лимита"],
          },
        };
      }
    } else if (amountMinor < 0n) {
      return { errors: { amountMajor: ["Введите корректную сумму"] } };
    }

    await prisma.balanceSnapshot.upsert({
      where: { accountId_asOfDate: { accountId, asOfDate } },
      update: { amountMinor },
      create: { accountId, asOfDate, amountMinor },
    });
  } catch {
    return {
      message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
    };
  }

  revalidatePath("/accounts");
  revalidatePath("/");
  return { success: true, message: "Сохранено" };
}

/** Delete one BalanceSnapshot by id (history only — D-10, D-11). */
export async function deleteBalanceSnapshot(
  formData: FormData,
): Promise<BalanceActionState> {
  const validated = deleteBalanceSchema.safeParse({
    id: formData.get("id"),
  });

  if (!validated.success) {
    return {
      message: "Не удалось удалить снимок. Попробуйте снова.",
    };
  }

  try {
    await ensureSqlitePragmas();
    await prisma.balanceSnapshot.delete({
      where: { id: validated.data.id },
    });
  } catch {
    return {
      message: "Не удалось удалить снимок. Попробуйте снова.",
    };
  }

  revalidatePath("/accounts");
  revalidatePath("/");
  return { success: true, message: "Удалено" };
}
