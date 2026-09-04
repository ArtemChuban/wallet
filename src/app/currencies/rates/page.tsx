import { RateList } from "@/components/currencies/RateList";
import { calendarDateToday } from "@/lib/balances";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
import { firstHitLocfMap } from "@/lib/locf";

export const dynamic = "force-dynamic";

export default async function RatesPage() {
  await ensureSqlitePragmas();
  const today = calendarDateToday("Europe/Moscow");

  const [nonPrimaryCurrencies, primaryCurrency, ratesLteToday, allRates] =
    await Promise.all([
      prisma.currency.findMany({
        where: { isPrimary: false },
        orderBy: { code: "asc" },
        select: { code: true, name: true },
      }),
      prisma.currency.findFirst({
        where: { isPrimary: true },
        select: { code: true },
      }),
      prisma.fxRate.findMany({
        where: { asOfDate: { lte: today } },
        orderBy: { asOfDate: "desc" },
        select: {
          currencyCode: true,
          asOfDate: true,
          rateToPrimaryScaled: true,
        },
      }),
      prisma.fxRate.findMany({
        where: { currency: { isPrimary: false } },
        orderBy: [{ currencyCode: "asc" }, { asOfDate: "desc" }],
        select: {
          id: true,
          currencyCode: true,
          asOfDate: true,
          rateToPrimaryScaled: true,
        },
      }),
    ]);

  const locfByCurrency = firstHitLocfMap(
    ratesLteToday,
    (rate) => rate.currencyCode,
  );

  const historyByCurrency = new Map<
    string,
    { id: number; asOfDate: string; rateToPrimaryScaled: string }[]
  >();
  for (const rate of allRates) {
    const list = historyByCurrency.get(rate.currencyCode) ?? [];
    list.push({
      id: rate.id,
      asOfDate: rate.asOfDate,
      rateToPrimaryScaled: rate.rateToPrimaryScaled.toString(),
    });
    historyByCurrency.set(rate.currencyCode, list);
  }

  const currencies = nonPrimaryCurrencies.map((c) => {
    const locf = locfByCurrency.get(c.code) ?? null;
    return {
      code: c.code,
      name: c.name,
      locf: locf
        ? {
            asOfDate: locf.asOfDate,
            rateToPrimaryScaled: locf.rateToPrimaryScaled.toString(),
          }
        : null,
      history: historyByCurrency.get(c.code) ?? [],
    };
  });

  const primaryCode = primaryCurrency?.code ?? "RUB";

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 pb-8 pt-6 font-sans">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Валюты
        </h1>
      </header>
      <RateList
        currencies={currencies}
        primaryCode={primaryCode}
        today={today}
      />
    </main>
  );
}
