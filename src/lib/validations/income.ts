import { z } from "zod";

const asOfDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Укажите дату");

const personNameSchema = z.string().trim().min(1).max(120);

const currencyCodeSchema = z.string().trim().min(1).max(16);

const optionalNoteSchema = z.preprocess(
  (val) => (val === "" || val === undefined ? undefined : val),
  z.string().trim().max(500).optional(),
);

const MAJOR_NON_EMPTY = /^([+-]?)(\d+)(?:\.(\d+))?$/;

/** True when major decimal string represents a strictly positive amount. */
function isStrictlyPositiveMajor(major: string): boolean {
  const trimmed = major.trim();
  if (!trimmed || /[eE]/.test(trimmed)) return false;
  const match = MAJOR_NON_EMPTY.exec(trimmed);
  if (!match) return false;
  if (match[1] === "-") return false;
  const intPart = match[2] ?? "0";
  const frac = match[3] ?? "";
  const digits = `${intPart}${frac}`.replace(/^0+/, "");
  return digits.length > 0;
}

const dayOfMonthSchema = z.coerce.number().int().min(1).max(31);

const plannedAmountMajorField = z
  .string()
  .trim()
  .min(1, "Введите корректную сумму");

function refinePositiveMajor(
  val: { plannedAmountMajor: string },
  ctx: z.RefinementCtx,
) {
  if (!isStrictlyPositiveMajor(val.plannedAmountMajor)) {
    ctx.addIssue({
      code: "custom",
      path: ["plannedAmountMajor"],
      message: "Введите сумму больше 0",
    });
  }
}

/** Create recurring income (SRC-01). */
export const createRecurringIncomeSchema = z
  .object({
    personId: z.coerce.number().int().positive(),
    currencyCode: currencyCodeSchema,
    plannedAmountMajor: plannedAmountMajorField,
    dayOfMonth: dayOfMonthSchema,
    startAsOf: asOfDateSchema,
    note: optionalNoteSchema,
  })
  .strict()
  .superRefine(refinePositiveMajor);

/** Create recurring income with new Person name (D-07). */
export const createRecurringIncomeWithNewPersonSchema = z
  .object({
    name: personNameSchema,
    currencyCode: currencyCodeSchema,
    plannedAmountMajor: plannedAmountMajorField,
    dayOfMonth: dayOfMonthSchema,
    startAsOf: asOfDateSchema,
    note: optionalNoteSchema,
  })
  .strict()
  .superRefine(refinePositiveMajor);

/** Create one-time income (SRC-02). */
export const createOneTimeIncomeSchema = z
  .object({
    personId: z.coerce.number().int().positive(),
    currencyCode: currencyCodeSchema,
    plannedAmountMajor: plannedAmountMajorField,
    plannedAsOf: asOfDateSchema,
    note: optionalNoteSchema,
  })
  .strict()
  .superRefine(refinePositiveMajor);

/** Create one-time income with new Person name (D-07). */
export const createOneTimeIncomeWithNewPersonSchema = z
  .object({
    name: personNameSchema,
    currencyCode: currencyCodeSchema,
    plannedAmountMajor: plannedAmountMajorField,
    plannedAsOf: asOfDateSchema,
    note: optionalNoteSchema,
  })
  .strict()
  .superRefine(refinePositiveMajor);

/**
 * Update recurring income — amount + schedule + note only (A1).
 * personId / currencyCode / kind locked after create.
 */
export const updateRecurringIncomeSchema = z
  .object({
    id: z.coerce.number().int().positive(),
    plannedAmountMajor: plannedAmountMajorField,
    dayOfMonth: dayOfMonthSchema,
    startAsOf: asOfDateSchema,
    note: optionalNoteSchema,
  })
  .strict()
  .superRefine(refinePositiveMajor);

/**
 * Update one-time income — amount + plannedAsOf + note only (A1).
 */
export const updateOneTimeIncomeSchema = z
  .object({
    id: z.coerce.number().int().positive(),
    plannedAmountMajor: plannedAmountMajorField,
    plannedAsOf: asOfDateSchema,
    note: optionalNoteSchema,
  })
  .strict()
  .superRefine(refinePositiveMajor);

export type CreateRecurringIncomeInput = z.infer<
  typeof createRecurringIncomeSchema
>;
export type CreateRecurringIncomeWithNewPersonInput = z.infer<
  typeof createRecurringIncomeWithNewPersonSchema
>;
export type CreateOneTimeIncomeInput = z.infer<typeof createOneTimeIncomeSchema>;
export type CreateOneTimeIncomeWithNewPersonInput = z.infer<
  typeof createOneTimeIncomeWithNewPersonSchema
>;
export type UpdateRecurringIncomeInput = z.infer<
  typeof updateRecurringIncomeSchema
>;
export type UpdateOneTimeIncomeInput = z.infer<typeof updateOneTimeIncomeSchema>;

function refinePositiveActualMajor(
  val: { actualAmountMajor: string },
  ctx: z.RefinementCtx,
) {
  if (!isStrictlyPositiveMajor(val.actualAmountMajor)) {
    ctx.addIssue({
      code: "custom",
      path: ["actualAmountMajor"],
      message: "Введите сумму больше 0",
    });
  }
}

const actualAmountMajorField = z
  .string()
  .trim()
  .min(1, "Введите корректную сумму");

/** Upsert recurring income actual for a plan slot (ACT-01 / D-02 / D-19). */
export const upsertRecurringIncomeActualSchema = z
  .object({
    recurringIncomeId: z.coerce.number().int().positive(),
    plannedAsOf: asOfDateSchema,
    actualAmountMajor: actualAmountMajorField,
    actualAsOf: asOfDateSchema,
    note: optionalNoteSchema,
  })
  .strict()
  .superRefine(refinePositiveActualMajor);

export type UpsertRecurringIncomeActualInput = z.infer<
  typeof upsertRecurringIncomeActualSchema
>;

/** Upsert one-time income actual for a plan slot (ACT-01 / D-02 / D-19). */
export const upsertOneTimeIncomeActualSchema = z
  .object({
    oneTimeIncomeId: z.coerce.number().int().positive(),
    plannedAsOf: asOfDateSchema,
    actualAmountMajor: actualAmountMajorField,
    actualAsOf: asOfDateSchema,
    note: optionalNoteSchema,
  })
  .strict()
  .superRefine(refinePositiveActualMajor);

/** Delete a single RecurringIncomeActual by id (D-04). */
export const deleteRecurringIncomeActualSchema = z
  .object({
    id: z.coerce.number().int().positive(),
  })
  .strict();

/** Delete a single OneTimeIncomeActual by id (D-04). */
export const deleteOneTimeIncomeActualSchema = z
  .object({
    id: z.coerce.number().int().positive(),
  })
  .strict();

export type UpsertOneTimeIncomeActualInput = z.infer<
  typeof upsertOneTimeIncomeActualSchema
>;
export type DeleteRecurringIncomeActualInput = z.infer<
  typeof deleteRecurringIncomeActualSchema
>;
export type DeleteOneTimeIncomeActualInput = z.infer<
  typeof deleteOneTimeIncomeActualSchema
>;
