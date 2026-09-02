"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
import {
  createCurrencySchema,
  updateCurrencyNameSchema,
} from "@/lib/validations/currency";

export type CurrencyActionState = {
  errors?: {
    code?: string[];
    name?: string[];
    scale?: string[];
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
  return { success: true, message: "Сохранено" };
}
