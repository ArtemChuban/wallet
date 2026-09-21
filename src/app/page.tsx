import { DashboardAccountList } from "@/components/dashboard/DashboardAccountList";
import { DashboardChartsShell } from "@/components/dashboard/DashboardChartsShell";
import { calendarDateToday } from "@/lib/balances";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
import { firstHitLocfMap } from "@/lib/locf";
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

    const [
      accounts,
      primaryCurrency,
      snapshotsLteToday,
      ratesLteToday,
      recurringIncomes,
      oneTimeIncomes,
      recurringActuals,
      oneTimeActuals,
      openGraceObligations,
    ] = await Promise.all([
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
      // Max 1y income window for forecast overlay (D-05); shell slices by range.
      prisma.recurringIncome.findMany({
        include: {
          currency: {
            select: { code: true, scale: true, isPrimary: true },
          },
        },
      }),
      prisma.oneTimeIncome.findMany({
        include: {
          currency: {
            select: { code: true, scale: true, isPrimary: true },
          },
        },
      }),
      prisma.recurringIncomeActual.findMany({
        select: {
          recurringIncomeId: true,
          plannedAsOf: true,
        },
      }),
      prisma.oneTimeIncomeActual.findMany({
        select: {
          oneTimeIncomeId: true,
          plannedAsOf: true,
          amountMinor: true,
          actualAsOf: true,
        },
      }),
      // C-07 / GRFCST-01: OPEN-only lean load for forecast overlay (not NW LOCF).
      prisma.creditGraceObligation.findMany({
        where: { status: "OPEN" },
        select: {
          id: true,
          dueAsOf: true,
          amountMinor: true,
          status: true,
          accountId: true,
          account: {
            select: {
              name: true,
              currency: {
                select: { code: true, scale: true, isPrimary: true },
              },
            },
          },
        },
      }),
    ]);

    const locfByAccount = firstHitLocfMap(
      snapshotsLteToday,
      (snap) => snap.accountId,
    );

    const locfByCurrency = firstHitLocfMap(
      ratesLteToday,
      (rate) => rate.currencyCode,
    );

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
    const accountById = new Map(accounts.map((account) => [account.id, account]));
    const heroAmount = formatMinorToMajor(totalPrimaryMinor, primaryScale);

    const excludedAccounts = rows
      .filter((row) => !row.includedInTotal)
      .map((row) => {
        const account = accountById.get(row.accountId);
        return {
          accountId: row.accountId,
          name: account?.name ?? "—",
          currencyCode: account?.currencyCode ?? "—",
          reason:
            row.excludeReason === "no_fx"
              ? "нет курса"
              : row.excludeReason === "no_balance"
                ? "нет баланса"
                : row.excludeReason,
        };
      });

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
            {excludedAccounts.length > 0 ? (
              <ul className="mt-2 grid gap-1">
                {excludedAccounts.map((row) => (
                  <li
                    key={row.accountId}
                    className="flex flex-wrap items-baseline gap-2 text-sm text-foreground"
                  >
                    <span>{row.name}</span>
                    <span className="font-mono text-muted-foreground">
                      {row.currencyCode}
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{row.reason}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
        {hasAccounts ? (
          <DashboardChartsShell
            accounts={accounts.map((account) => ({
              id: account.id,
              name: account.name,
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
            anchorPrimaryMinor={totalPrimaryMinor.toString()}
            forecastIncome={{
              recurring: recurringIncomes.map((r) => ({
                id: r.id,
                plannedAmountMinor: r.plannedAmountMinor.toString(),
                dayOfMonth: r.dayOfMonth,
                startAsOf: r.startAsOf,
                currencyCode: r.currency.code,
                currencyScale: r.currency.scale,
                isPrimaryCurrency: r.currency.isPrimary,
              })),
              recurringActuals: recurringActuals.map((a) => ({
                recurringIncomeId: a.recurringIncomeId,
                plannedAsOf: a.plannedAsOf,
              })),
              oneTime: oneTimeIncomes.map((o) => ({
                id: o.id,
                plannedAmountMinor: o.plannedAmountMinor.toString(),
                plannedAsOf: o.plannedAsOf,
                currencyCode: o.currency.code,
                currencyScale: o.currency.scale,
                isPrimaryCurrency: o.currency.isPrimary,
              })),
              oneTimeActuals: oneTimeActuals.map((a) => ({
                oneTimeIncomeId: a.oneTimeIncomeId,
                plannedAsOf: a.plannedAsOf,
                amountMinor: a.amountMinor.toString(),
                actualAsOf: a.actualAsOf,
              })),
            }}
            forecastGrace={{
              obligations: openGraceObligations.map((o) => ({
                id: o.id,
                dueAsOf: o.dueAsOf,
                amountMinor: o.amountMinor.toString(),
                status: o.status,
                accountId: o.accountId,
                accountName: o.account.name,
                currencyCode: o.account.currency.code,
                currencyScale: o.account.currency.scale,
                isPrimaryCurrency: o.account.currency.isPrimary,
              })),
            }}
            forecastSavings={{
              accounts: accounts
                .filter(
                  (a) =>
                    a.type === "SAVINGS" &&
                    a.annualRateBps != null &&
                    a.accrualDayOfMonth != null,
                )
                .map((a) => {
                  const locf = locfByAccount.get(a.id);
                  return {
                    accountId: a.id,
                    accountName: a.name,
                    balanceMinor: (locf?.amountMinor ?? 0n).toString(),
                    annualRateBps: a.annualRateBps!,
                    accrualDayOfMonth: a.accrualDayOfMonth!,
                    currencyCode: a.currencyCode,
                    currencyScale: a.currency.scale,
                    isPrimaryCurrency: a.currency.isPrimary,
                  };
                }),
            }}
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
