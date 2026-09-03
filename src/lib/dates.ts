/**
 * Calendar date display helpers (UI-SPEC: DD.MM.YYYY display, YYYY-MM-DD wire).
 */

/** YYYY-MM-DD → DD.MM.YYYY */
export function formatAsOfDisplay(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
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
