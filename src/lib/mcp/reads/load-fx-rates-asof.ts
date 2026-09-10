import { ensureSqlitePragmas, prisma } from "@/lib/db";
import { firstHitLocfMap } from "@/lib/locf";
import { rateToJson } from "@/lib/mcp/serialize";

export type FxRateCurrencyInput = {
  currencyCode: string;
  asOfDate: string | null;
  rateToPrimaryScaled: bigint | null;
};

export type SerializedFxRateRow = {
  currencyCode: string;
  asOfDate: string | null;
  rateToPrimaryScaled: string | null;
};

export type SerializedFxRatesPayload = {
  asOf: string;
  primaryCurrencyCode: string;
  rateScale: 8;
  rates: SerializedFxRateRow[];
};

/**
 * Pure CAP-04 assembler — LOCF snapshot strings + rateScale 8 (D-03, D-09).
 * Missing LOCF keeps currency with null rate fields (honesty).
 * SQLite-free for adapter tests.
 */
export function assembleFxRatesPayload(args: {
  asOf: string;
  primaryCurrencyCode: string;
  currencies: FxRateCurrencyInput[];
  currencyCode?: string;
}): SerializedFxRatesPayload {
  let currencies = args.currencies;
  if (args.currencyCode !== undefined) {
    currencies = currencies.filter((c) => c.currencyCode === args.currencyCode);
  }

  const rates: SerializedFxRateRow[] = currencies.map((c) => ({
    currencyCode: c.currencyCode,
    asOfDate: c.asOfDate,
    rateToPrimaryScaled:
      c.rateToPrimaryScaled === null
        ? null
        : rateToJson(c.rateToPrimaryScaled),
  }));

  return {
    asOf: args.asOf,
    primaryCurrencyCode: args.primaryCurrencyCode,
    rateScale: 8,
    rates,
  };
}

/**
 * Rates-page LOCF snapshot of primary↔other FX (CAP-04 transparency).
 * Optional currencyCode filters non-primary codes.
 */
export async function loadFxRatesAsOf(
  asOf: string,
  currencyCode?: string,
): Promise<SerializedFxRatesPayload> {
  await ensureSqlitePragmas();

  const [nonPrimaryCurrencies, primaryCurrency, ratesLteAsOf] =
    await Promise.all([
      prisma.currency.findMany({
        where: {
          isPrimary: false,
          ...(currencyCode ? { code: currencyCode } : {}),
        },
        orderBy: { code: "asc" },
        select: { code: true },
      }),
      prisma.currency.findFirst({
        where: { isPrimary: true },
        select: { code: true },
      }),
      prisma.fxRate.findMany({
        where: {
          asOfDate: { lte: asOf },
          ...(currencyCode ? { currencyCode } : {}),
        },
        orderBy: { asOfDate: "desc" },
        select: {
          currencyCode: true,
          asOfDate: true,
          rateToPrimaryScaled: true,
        },
      }),
    ]);

  const locfByCurrency = firstHitLocfMap(
    ratesLteAsOf,
    (rate) => rate.currencyCode,
  );

  const currencies: FxRateCurrencyInput[] = nonPrimaryCurrencies.map((c) => {
    const locf = locfByCurrency.get(c.code) ?? null;
    return {
      currencyCode: c.code,
      asOfDate: locf?.asOfDate ?? null,
      rateToPrimaryScaled: locf?.rateToPrimaryScaled ?? null,
    };
  });

  return assembleFxRatesPayload({
    asOf,
    primaryCurrencyCode: primaryCurrency?.code ?? "RUB",
    currencies,
  });
}
