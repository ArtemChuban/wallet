import { z } from "zod";

/** Printable ASCII currency code (D-05 / RESEARCH Q2). */
const currencyCodeSchema = z
  .string()
  .trim()
  .min(1)
  .max(16)
  .regex(/^[\x20-\x7E]+$/);

const currencyNameSchema = z.string().trim().min(1).max(120);

const scaleSchema = z
  .number()
  .int()
  .min(0, "Укажите масштаб от 0 до 18")
  .max(18, "Укажите масштаб от 0 до 18");

/** Create currency: free-form code/name + scale 0–18 (CURR-01, D-05, D-06). */
export const createCurrencySchema = z.object({
  code: currencyCodeSchema,
  name: currencyNameSchema,
  scale: scaleSchema,
});

/** Update currency: name only (D-04, D-08). */
export const updateCurrencyNameSchema = z.object({
  name: currencyNameSchema,
});

export type CreateCurrencyInput = z.infer<typeof createCurrencySchema>;
export type UpdateCurrencyNameInput = z.infer<typeof updateCurrencyNameSchema>;
