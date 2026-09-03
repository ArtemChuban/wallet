import { RateList } from "@/components/currencies/RateList";
import { calendarDateToday } from "@/lib/balances";
import { ensureSqlitePragmas, prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function RatesPage() {
  await ensureSqlitePragmas();
  const today = calendarDateToday("Europe/Moscow");

  const [nonPrimaryCurrencies, primaryCurrency, ratesLteToday] =
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
    ]);

  const locfByCurrency = new Map<
    string,
    { asOfDate: string; rateToPrimaryScaled: bigint }
  >();
  for (const rate of ratesLteToday) {
    if (!locfByCurrency.has(rate.currencyCode)) {
      locfByCurrency.set(rate.currencyCode, {
        asOfDate: rate.asOfDate,
        rateToPrimaryScaled: rate.rateToPrimaryScaled,
      });
    }
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
