/**
 * Calendar date display helpers (UI-SPEC: DD.MM.YYYY display, YYYY-MM-DD wire).
 */

export type RangePreset = "30d" | "90d" | "1y" | "all";

/**
 * Calendar YYYY-MM-DD in the given IANA time zone.
 * Defaults to Europe/Moscow for D-12 / dialog default (A3).
 * Client-safe — no Prisma / Node fs.
 */
export function calendarDateToday(timeZone: string = "Europe/Moscow"): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  if (!year || !month || !day) {
    throw new Error("calendarDateToday: failed to format date parts");
  }
  return `${year}-${month}-${day}`;
}

/** YYYY-MM-DD → DD.MM.YYYY */
export function formatAsOfDisplay(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
}

/**
 * Add (or subtract) whole calendar days to a YYYY-MM-DD string using UTC math.
 * Avoids local-TZ drift when shifting window starts.
 */
export function addCalendarDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) {
    throw new Error(`invalid ISO date: ${iso}`);
  }
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/**
 * Inclusive window start for a range preset, or null for "all".
 * 1y = 365 calendar days before today (RESEARCH A4).
 */
export function windowStartForPreset(
  preset: RangePreset,
  today: string,
): string | null {
  switch (preset) {
    case "30d":
      return addCalendarDays(today, -30);
    case "90d":
      return addCalendarDays(today, -90);
    case "1y":
      return addCalendarDays(today, -365);
    case "all":
      return null;
    default: {
      const _exhaustive: never = preset;
      throw new Error(`unknown preset: ${_exhaustive}`);
    }
  }
}

/**
 * DD.MM.YYYY → YYYY-MM-DD, or null if shape/calendar invalid.
 * Does not enforce future/past — Server Action owns D-12.
 */
export function parseAsOfDisplay(display: string): string | null {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(display.trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (
    dt.getUTCFullYear() !== year ||
    dt.getUTCMonth() !== month - 1 ||
    dt.getUTCDate() !== day
  ) {
    return null;
  }
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}
