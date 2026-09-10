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

/** Resolve tool asOf: explicit wire date or calendar today (Europe/Moscow). */
export function resolveAsOf(asOf?: string): string {
  return asOf ?? calendarDateToday("Europe/Moscow");
}
