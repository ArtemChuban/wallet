import { z } from "zod";

const asOfDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Укажите дату");

/** Set FX rate: shape only. Future-date, >0, and primary rejection stay in Server Actions (Plan 02). */
export const setFxRateSchema = z
  .object({
    currencyCode: z.string().trim().min(1),
    rateMajor: z.string().trim().min(1, "Введите курс"),
    asOfDate: asOfDateSchema,
    direction: z.enum(["toPrimary", "fromPrimary"]).default("toPrimary"),
  })
  .strict();

/** Delete a single FxRate by id. */
export const deleteFxRateSchema = z
  .object({
    id: z.coerce.number().int().positive(),
  })
  .strict();

export type SetFxRateInput = z.infer<typeof setFxRateSchema>;
export type DeleteFxRateInput = z.infer<typeof deleteFxRateSchema>;
