import { DashboardAccountList } from "@/components/dashboard/DashboardAccountList";
import { DashboardChartsShell } from "@/components/dashboard/DashboardChartsShell";
import { calendarDateToday } from "@/lib/balances";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
import { formatMinorToMajor } from "@/lib/money";
import {
  computeNetWorthRows,
  type NetWorthAccountInput,
} from "@/lib/net-worth";

export const dynamic = "force-dynamic";

export default async function Home() {
  try {
    await ensureSqlitePragmas();
    const today = calendarDateToday("Europe/Moscow");

    const [accounts, primaryCurrency, snapshotsLteToday, ratesLteToday] =
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

    const inputs: NetWorthAccountInput[] = accounts.map((account) => {
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

    const { rows, totalPrimaryMinor, isPartial } = computeNetWorthRows(inputs);
    const rowById = new Map(rows.map((row) => [row.accountId, row]));
    const heroAmount = formatMinorToMajor(totalPrimaryMinor, primaryScale);

    const listRows = accounts.map((account) => {
      const row = rowById.get(account.id);
      const excludeReason = row?.excludeReason ?? "no_balance";
      const isCredit = account.type === "FIAT_CREDIT";
      const nativeMinor = row?.nativeDisplayMinor ?? null;
      const debtNativeMinor = row?.debtNativeMinor ?? null;
      const primaryMinor = row?.primaryDisplayMinor ?? null;
      const scale = account.currency.scale;
      const code = account.currencyCode;

      const nativeDisplay =
        nativeMinor == null
          ? "—"
          : `${formatMinorToMajor(nativeMinor, scale)} ${code}`;
      const debtNativeDisplay =
        debtNativeMinor == null
          ? null
          : `${formatMinorToMajor(debtNativeMinor, scale)} ${code}`;
      const primaryDisplay =
        primaryMinor == null
          ? "—"
          : `${formatMinorToMajor(primaryMinor, primaryScale)} ${primaryCode}`;

      return {
        id: account.id,
        name: account.name,
        nativeDisplay,
        primaryDisplay,
        excludeReason,
        isCredit,
        debtNativeDisplay,
        currencyCode: account.currencyCode,
        currencyScale: account.currency.scale,
        isPrimaryCurrency: account.currency.isPrimary,
        type: account.type,
        creditLimitMinor:
          account.creditLimitMinor == null
            ? null
            : account.creditLimitMinor.toString(),
      };
    });

    const hasAccounts = accounts.length > 0;

    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 font-sans">
        {hasAccounts ? (
          <section>
            <p className="text-sm text-muted-foreground">Капитал</p>
            <p className="font-mono text-3xl font-semibold text-foreground">
              {heroAmount} {primaryCode}
            </p>
          </section>
        ) : null}
        {hasAccounts && isPartial ? (
          <div
            className="rounded-lg border border-border bg-muted/60 p-4"
            role="status"
          >
            <p className="text-sm font-medium text-foreground">Итог неполный</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Не все счета учтены в сумме: у части счетов нет баланса или нет
              курса валюты. Задайте балансы на странице «Счета» и курсы на
              «Курсы».
            </p>
          </div>
        ) : null}
        {hasAccounts ? (
          <DashboardChartsShell
            accounts={accounts.map((account) => ({
              id: account.id,
              type: account.type,
              currencyCode: account.currencyCode,
              currencyScale: account.currency.scale,
              isPrimaryCurrency: account.currency.isPrimary,
              creditLimitMinor:
                account.creditLimitMinor == null
                  ? null
                  : account.creditLimitMinor.toString(),
            }))}
            snapshots={snapshotsLteToday.map((snap) => ({
              accountId: snap.accountId,
              asOfDate: snap.asOfDate,
              amountMinor: snap.amountMinor.toString(),
            }))}
            rates={ratesLteToday.map((rate) => ({
              currencyCode: rate.currencyCode,
              asOfDate: rate.asOfDate,
              rateToPrimaryScaled: rate.rateToPrimaryScaled.toString(),
            }))}
            primaryScale={primaryScale}
            today={today}
            listAccounts={listRows}
            primaryCode={primaryCode}
          />
        ) : (
          <DashboardAccountList accounts={listRows} primaryCode={primaryCode} />
        )}
      </main>
    );
  } catch (error) {
    console.error("Dashboard data load failed", error);
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 font-sans">
        <p className="text-base text-foreground">
          Не удалось загрузить данные. Проверьте базу данных и обновите
          страницу.
        </p>
      </main>
    );
  }
}
