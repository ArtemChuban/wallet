import { DashboardAccountList } from "@/components/dashboard/DashboardAccountList";
import { calendarDateToday } from "@/lib/balances";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
import { formatMinorToMajor } from "@/lib/money";
import {
  computeNetWorthRows,
  type NetWorthAccountInput,
} from "@/lib/net-worth";

export const dynamic = "force-dynamic";

export default async function Home() {
  await ensureSqlitePragmas();
  const today = calendarDateToday("Europe/Moscow");

  const [accountsRaw, primaryCurrency, snapshotsLteToday, ratesLteToday] =
    await Promise.all([
      prisma.account.findMany({
        include: { currency: true },
        orderBy: { name: "asc" },
      }),
      prisma.currency.findFirst({
        where: { isPrimary: true },
        select: { code: true, scale: true },
      }),
      prisma.balanceSnapshot.findMany({
        where: { asOfDate: { lte: today } },
        orderBy: { asOfDate: "desc" },
        select: {
          accountId: true,
          asOfDate: true,
          amountMinor: true,
        },
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

  const locfByAccount = new Map<
    number,
    { asOfDate: string; amountMinor: bigint }
  >();
  for (const snap of snapshotsLteToday) {
    if (!locfByAccount.has(snap.accountId)) {
      locfByAccount.set(snap.accountId, {
        asOfDate: snap.asOfDate,
        amountMinor: snap.amountMinor,
      });
    }
  }

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

  const primaryCode = primaryCurrency?.code ?? "RUB";
  const primaryScale = primaryCurrency?.scale ?? 2;

  const inputs: NetWorthAccountInput[] = accountsRaw.map((account) => {
    const locf = locfByAccount.get(account.id) ?? null;
    const rate = locfByCurrency.get(account.currencyCode) ?? null;
    return {
      id: account.id,
      type: account.type,
      currencyCode: account.currencyCode,
      currencyScale: account.currency.scale,
      isPrimaryCurrency: account.currency.isPrimary,
      creditLimitMinor: account.creditLimitMinor,
      locfAmountMinor: locf?.amountMinor ?? null,
      rateToPrimaryScaled: account.currency.isPrimary
        ? null
        : (rate?.rateToPrimaryScaled ?? null),
      primaryScale,
    };
  });

  const { rows, totalPrimaryMinor } = computeNetWorthRows(inputs);
  const rowById = new Map(rows.map((row) => [row.accountId, row]));
  const heroAmount = formatMinorToMajor(totalPrimaryMinor, primaryScale);

  const assetRows = accountsRaw
    .filter((account) => account.type !== "FIAT_CREDIT")
    .map((account) => {
      const row = rowById.get(account.id);
      const nativeMinor = row?.nativeDisplayMinor ?? null;
      const primaryMinor = row?.primaryDisplayMinor ?? null;
      return {
        id: account.id,
        name: account.name,
        nativeDisplay:
          nativeMinor == null
            ? "—"
            : `${formatMinorToMajor(nativeMinor, account.currency.scale)} ${account.currencyCode}`,
        primaryDisplay:
          primaryMinor == null
            ? "—"
            : `${formatMinorToMajor(primaryMinor, primaryScale)} ${primaryCode}`,
      };
    });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 font-sans">
      <section>
        <p className="text-sm text-muted-foreground">Капитал</p>
        <p className="font-mono text-3xl font-semibold text-foreground">
          {heroAmount} {primaryCode}
        </p>
      </section>
      <DashboardAccountList accounts={assetRows} />
    </main>
  );
}
