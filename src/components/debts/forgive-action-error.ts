import type { DebtActionState } from "@/app/debts/actions";

const OPAQUE_SAVE_FALLBACK =
  "Не удалось сохранить. Проверьте поля и попробуйте снова.";

/**
 * Prefer field errors (incl. deltaMajor from OVER_FLOOR/DELTA_ZERO) then
 * message (stale refresh RU) before opaque catch-all (G-10-8 / WR-01).
 */
export function resolveForgiveActionError(result: DebtActionState): string {
  return (
    result.errors?.asOfDate?.[0] ??
    result.errors?.deltaMajor?.[0] ??
    result.message ??
    OPAQUE_SAVE_FALLBACK
  );
}
