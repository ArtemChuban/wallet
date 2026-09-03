import { ensureSqlitePragmas, prisma } from "@/lib/db";

export { calendarDateToday } from "@/lib/dates";
export { creditDebtMinor } from "@/lib/money";

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
