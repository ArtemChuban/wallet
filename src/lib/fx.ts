import { ensureSqlitePragmas, prisma } from "@/lib/db";
import { RATE_SCALE_E8 } from "@/lib/money";

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

/**
 * primaryMinor = otherMinor * rateToPrimaryScaled * 10^primaryScale
 *              / (10^otherScale * 10^8)
 * Truncates toward zero. Caller handles missing rate via getRateAsOf null.
 */
export function convertOtherMinorToPrimaryMinor(
  otherMinor: bigint,
  rateToPrimaryScaled: bigint,
  otherScale: number,
  primaryScale: number,
): bigint {
  const num =
    otherMinor * rateToPrimaryScaled * 10n ** BigInt(primaryScale);
  const den = 10n ** BigInt(otherScale) * RATE_SCALE_E8;
  return num / den;
}
