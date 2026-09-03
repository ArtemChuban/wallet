import { ensureSqlitePragmas, prisma } from "@/lib/db";

export { convertOtherMinorToPrimaryMinor } from "@/lib/money";

/**
 * LOCF: latest FxRate with asOfDate <= D.
 * Returns null before the first rate — never invents 0 or 1 (FX-02 / D-15).
 */
export async function getRateAsOf(currencyCode: string, asOfDate: string) {
  await ensureSqlitePragmas();
  return prisma.fxRate.findFirst({
    where: { currencyCode, asOfDate: { lte: asOfDate } },
    orderBy: { asOfDate: "desc" },
  });
}
