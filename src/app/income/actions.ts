"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
import { parseMajorToMinor } from "@/lib/money";
import {
  createRecurringIncomeSchema,
  createRecurringIncomeWithNewPersonSchema,
} from "@/lib/validations/income";

export type IncomeActionState = {
  errors?: {
    personId?: string[];
    name?: string[];
    currencyCode?: string[];
    plannedAmountMajor?: string[];
    dayOfMonth?: string[];
    startAsOf?: string[];
    plannedAsOf?: string[];
    note?: string[];
    id?: string[];
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

async function resolvePlannedMinor(
  currencyCode: string,
  plannedAmountMajor: string,
): Promise<
  | { ok: true; plannedAmountMinor: bigint }
  | { ok: false; state: IncomeActionState }
> {
  const currency = await prisma.currency.findUnique({
    where: { code: currencyCode },
  });
  if (!currency) {
    return {
      ok: false,
      state: { errors: { currencyCode: ["Валюта не найдена"] } },
    };
  }
  if (fracDigitCount(plannedAmountMajor) > currency.scale) {
    return {
      ok: false,
      state: {
        errors: {
          plannedAmountMajor: [
            `Не больше ${currency.scale} знаков после запятой`,
          ],
        },
      },
    };
  }
  try {
    const plannedAmountMinor = parseMajorToMinor(
      plannedAmountMajor,
      currency.scale,
    );
    return { ok: true, plannedAmountMinor };
  } catch (err) {
    const msg =
      err instanceof Error && err.message === "too many fractional digits"
        ? `Не больше ${currency.scale} знаков после запятой`
        : "Некорректная сумма";
    return {
      ok: false,
      state: { errors: { plannedAmountMajor: [msg] } },
    };
  }
}

/**
 * Create recurring income for existing person, or compound new-person+income (SRC-01 / D-07).
 * Branch: personId present → createRecurringIncomeSchema; else name → nested person+recurring.
 * revalidatePath("/income") only — never dashboard root (UI-01).
 */
export async function createRecurringIncome(
  _prev: IncomeActionState,
  formData: FormData,
): Promise<IncomeActionState> {
  const personIdRaw = formData.get("personId");
  const hasPersonId =
    typeof personIdRaw === "string" && personIdRaw.trim() !== "";

  try {
    await ensureSqlitePragmas();

    if (hasPersonId) {
      const validated = createRecurringIncomeSchema.safeParse({
        personId: personIdRaw,
        currencyCode: formData.get("currencyCode"),
        plannedAmountMajor: formData.get("plannedAmountMajor"),
        dayOfMonth: formData.get("dayOfMonth"),
        startAsOf: formData.get("startAsOf"),
        note: formData.get("note") ?? undefined,
      });

      if (!validated.success) {
        return { errors: validated.error.flatten().fieldErrors };
      }

      const {
        personId,
        currencyCode,
        plannedAmountMajor,
        dayOfMonth,
        startAsOf,
        note,
      } = validated.data;

      const resolved = await resolvePlannedMinor(
        currencyCode,
        plannedAmountMajor,
      );
      if (!resolved.ok) return resolved.state;

      await prisma.recurringIncome.create({
        data: {
          personId,
          currencyCode,
          plannedAmountMinor: resolved.plannedAmountMinor,
          dayOfMonth,
          startAsOf,
          note: note ?? null,
        },
      });
    } else {
      const validated = createRecurringIncomeWithNewPersonSchema.safeParse({
        name: formData.get("name"),
        currencyCode: formData.get("currencyCode"),
        plannedAmountMajor: formData.get("plannedAmountMajor"),
        dayOfMonth: formData.get("dayOfMonth"),
        startAsOf: formData.get("startAsOf"),
        note: formData.get("note") ?? undefined,
      });

      if (!validated.success) {
        return { errors: validated.error.flatten().fieldErrors };
      }

      const {
        name,
        currencyCode,
        plannedAmountMajor,
        dayOfMonth,
        startAsOf,
        note,
      } = validated.data;

      const resolved = await resolvePlannedMinor(
        currencyCode,
        plannedAmountMajor,
      );
      if (!resolved.ok) return resolved.state;

      await prisma.person.create({
        data: {
          name,
          recurringIncomes: {
            create: {
              currencyCode,
              plannedAmountMinor: resolved.plannedAmountMinor,
              dayOfMonth,
              startAsOf,
              note: note ?? null,
            },
          },
        },
      });
    }
  } catch (error) {
    if (isUniqueNameViolation(error)) {
      return { errors: { name: ["Человек с таким именем уже есть"] } };
    }
    return {
      message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
    };
  }

  revalidatePath("/income");
  return { success: true, message: "Сохранено" };
}
