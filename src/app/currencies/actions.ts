"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { calendarDateToday } from "@/lib/balances";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
import { invertRateScaled, parseRateToScaled } from "@/lib/money";
import {
  createCurrencySchema,
  updateCurrencyNameSchema,
} from "@/lib/validations/currency";
import { setFxRateSchema } from "@/lib/validations/fx";

export type CurrencyActionState = {
  errors?: {
    code?: string[];
    name?: string[];
    scale?: string[];
  };
  message?: string;
  success?: boolean;
};

export type FxRateActionState = {
  errors?: {
    currencyCode?: string[];
    rateMajor?: string[];
    asOfDate?: string[];
    direction?: string[];
  };
  message?: string;
  success?: boolean;
};

function parseScale(value: FormDataEntryValue | null): number | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : Number.NaN;
}

function isUniqueCodeViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

/** Create secondary currency — always isPrimary false (D-02). */
export async function createCurrency(
  _prev: CurrencyActionState,
  formData: FormData,
): Promise<CurrencyActionState> {
  const validated = createCurrencySchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    scale: parseScale(formData.get("scale")),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  try {
    await ensureSqlitePragmas();
    await prisma.currency.create({
      data: {
        code: validated.data.code,
        name: validated.data.name,
        scale: validated.data.scale,
        isPrimary: false,
      },
    });
  } catch (error) {
    if (isUniqueCodeViolation(error)) {
      return { errors: { code: ["Код валюты уже существует"] } };
    }
    return { message: "Не удалось сохранить. Проверьте поля и попробуйте снова." };
  }

  revalidatePath("/currencies");
  revalidatePath("/accounts");
  return { success: true, message: "Сохранено" };
}

/** Update currency name only — ignore tampered code/scale/primary (D-04, D-08). */
export async function updateCurrencyName(
  _prev: CurrencyActionState,
  formData: FormData,
): Promise<CurrencyActionState> {
  const codeRaw = formData.get("code");
  const code = typeof codeRaw === "string" ? codeRaw.trim() : "";
  if (!code) {
    return { message: "Не удалось сохранить. Проверьте поля и попробуйте снова." };
  }

  const validated = updateCurrencyNameSchema.safeParse({
    name: formData.get("name"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  try {
    await ensureSqlitePragmas();
    await prisma.currency.update({
      where: { code },
      data: { name: validated.data.name },
    });
  } catch {
    return { message: "Не удалось сохранить. Проверьте поля и попробуйте снова." };
  }

  revalidatePath("/currencies");
  revalidatePath("/accounts");
  return { success: true, message: "Сохранено" };
}

/** Upsert dated FX rate primary↔other (FX-01); always stores rateToPrimaryScaled (D-05). */
export async function upsertFxRate(
  _prev: FxRateActionState,
  formData: FormData,
): Promise<FxRateActionState> {
  const validated = setFxRateSchema.safeParse({
    currencyCode: formData.get("currencyCode"),
    rateMajor: formData.get("rateMajor"),
    asOfDate: formData.get("asOfDate"),
    direction: formData.get("direction") ?? "toPrimary",
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { currencyCode, rateMajor, asOfDate, direction } = validated.data;
  const today = calendarDateToday();
  if (asOfDate > today) {
    return {
      errors: { asOfDate: ["Дата не может быть в будущем"] },
    };
  }

  try {
    await ensureSqlitePragmas();

    const currency = await prisma.currency.findUnique({
      where: { code: currencyCode },
    });
    if (!currency) {
      return {
        message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
      };
    }
    if (currency.isPrimary) {
      return {
        errors: {
          currencyCode: ["Выберите валюту, отличную от основной"],
        },
      };
    }

    let rateToPrimaryScaled: bigint;
    try {
      rateToPrimaryScaled = parseRateToScaled(rateMajor);
    } catch {
      return { errors: { rateMajor: ["Введите курс"] } };
    }

    if (direction === "fromPrimary") {
      try {
        rateToPrimaryScaled = invertRateScaled(rateToPrimaryScaled);
      } catch {
        return { errors: { rateMajor: ["Курс должен быть больше 0"] } };
      }
    }

    if (rateToPrimaryScaled <= 0n) {
      return { errors: { rateMajor: ["Курс должен быть больше 0"] } };
    }

    await prisma.fxRate.upsert({
      where: { currencyCode_asOfDate: { currencyCode, asOfDate } },
      update: { rateToPrimaryScaled },
      create: { currencyCode, asOfDate, rateToPrimaryScaled },
    });
  } catch {
    return {
      message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
    };
  }

  revalidatePath("/currencies");
  revalidatePath("/currencies/rates");
  return { success: true, message: "Сохранено" };
}
