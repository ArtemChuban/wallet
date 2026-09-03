import { ensureSqlitePragmas, prisma } from "@/lib/db";

/**
 * LOCF: latest BalanceSnapshot with asOfDate <= D.
 * Returns null before the first snapshot — never invents 0n (BAL-02).
 */
export async function getBalanceAsOf(accountId: number, asOfDate: string) {
  await ensureSqlitePragmas();
  return prisma.balanceSnapshot.findFirst({
    where: { accountId, asOfDate: { lte: asOfDate } },
    orderBy: { asOfDate: "desc" },
  });
}

/** Credit debt = limit − available (D-05–D-08). Pure; bounds enforced in actions. */
export function creditDebtMinor(
  creditLimitMinor: bigint,
  availableMinor: bigint,
): bigint {
  return creditLimitMinor - availableMinor;
}

/**
 * Calendar YYYY-MM-DD in the given IANA time zone.
 * Defaults to Europe/Moscow for D-12 / dialog default (A3).
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
