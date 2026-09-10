import { z } from "zod";
import { calendarDateToday } from "@/lib/dates";

/**
 * Optional asOf wire field for CAP tools (D-05, D-06, D-08, D-14).
 * Strict YYYY-MM-DD; future dates allowed; English validation message.
 */
export const optionalAsOfSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "asOf must be YYYY-MM-DD")
  .optional();

/**
 * Optional horizonEnd wire field for get_forecast_overlay (D-02).
 * Strict YYYY-MM-DD; default today+365 stays in forecast loader (D-04).
 */
export const optionalHorizonEndSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "horizonEnd must be YYYY-MM-DD")
  .optional();

/** Reusable YYYY-MM-DD string for paired income range fields. */
export const yyyyMmDdSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "must be YYYY-MM-DD");

/**
 * Optional paired from+to for list_income (A2 / Plan 04).
 * Both required together when either set; each must be YYYY-MM-DD.
 */
export const optionalIncomeRangeSchema = z
  .object({
    from: yyyyMmDdSchema.optional(),
    to: yyyyMmDdSchema.optional(),
  })
  .superRefine((val, ctx) => {
    const hasFrom = val.from !== undefined;
    const hasTo = val.to !== undefined;
    if (hasFrom !== hasTo) {
      ctx.addIssue({
        code: "custom",
        message: "from and to must both be set or both omitted",
        path: hasFrom ? ["to"] : ["from"],
      });
    }
  });

/** Resolve tool asOf: explicit wire date or calendar today (Europe/Moscow). */
export function resolveAsOf(asOf?: string): string {
  return asOf ?? calendarDateToday("Europe/Moscow");
}
